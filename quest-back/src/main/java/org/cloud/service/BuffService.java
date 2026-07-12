package org.cloud.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.cloud.domain.Buff;
import org.cloud.domain.Quest;
import org.cloud.domain.UserStats;
import org.cloud.mapper.BuffMapper;
import org.cloud.mapper.QuestLogMapper;
import org.cloud.mapper.QuestMapper;
import org.cloud.mapper.UserMapper;
import org.cloud.mapper.UserStatsMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
/**
 * 버프/디버프 발동·해제 로직을 담당하는 서비스
 *
 * 버프 5종 (기존 스트릭 기반 방식 유지): H2O MAX / 불굴의 의지 / 완전회복 / 집중력 MAX / 인생만끽
 * 나태함 디버프 (기존 방식 유지): 일간 퀘스트 3일 연속 0%
 *
 * ↓ 아래는 2026-06-18 재설계된 디버프 시스템 (탈수/피로누적 등 4스탯 디버프 전용) ↓
 * - 매일 자정, STR/INT/WIL/VIT 각각 독립적으로 "레벨×0.5%" 확률 랜덤 판정
 * - 동시 최대 2개까지만 유지
 * - 해제: 유저가 지정한 PHOTO 인증 퀘스트를 2일 연속 완료
 * - 해제 보너스: 기본XP × (1 + 레벨×0.05) 1회 추가 지급
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BuffService {

    private final BuffMapper buffMapper;
    private final QuestLogMapper questLogMapper;
    private final QuestMapper questMapper;
    private final UserMapper userMapper;
    private final UserStatsMapper userStatsMapper;
    private final XpService xpService;

    // 스탯별 디버프 풀 (랜덤 발동 시 이 중 하나를 무작위로 선택, 전부 effectPct -10%)
    private static final Map<String, String[]> DEBUFF_POOL = Map.of(
            "STR", new String[]{"탈수", "몸살", "근육통"},
            "INT", new String[]{"지식 정체", "브레인포그"},
            "WIL", new String[]{"피로누적", "만성피로", "컨디션저조"},
            "VIT", new String[]{"번아웃"}
    );

    private static final int DEBUFF_EFFECT_PCT = -10;
    private static final int MAX_ACTIVE_STAT_DEBUFFS = 2;
    private static final int RELEASE_PROGRESS_GOAL = 2; // 2일 연속 완료 시 해제

    /**
     * 퀘스트 완료 후 버프 발동 + 나태함 디버프 + 해제미션 진행도 체크
     * (기존 4종 디버프 조건부 체크는 폐기됨 — 자정 랜덤 발동으로 대체)
     *
     * @param userId   완료한 유저
     * @param questId  완료한 퀘스트 ID
     * @param statType 완료한 퀘스트 스탯 (STR/INT/WIL/VIT)
     * @param title    완료한 퀘스트 제목
     */
    @Transactional
    public void checkAndApply(Long userId, Long questId, String statType, String title) {
        // 신규 버프 시스템
    	checkRoutineBuff(userId, statType);

        // 나태함 디버프 발동/해제 체크 (기존 방식 유지)
        checkLaziness(userId);

        // 해제미션(linked_quest) 진행도 체크 (신규)
        checkReleaseProgress(userId, questId, statType);
    }

    /**
     * 특정 버프/디버프 활성 여부 확인 (불굴의 의지 포인트 보너스 체크용)
     */
    public boolean hasActiveBuff(Long userId, String name) {
        return buffMapper.findByUserIdAndName(userId, name) != null;
    }

    public int applyEffects(Long userId, String statType, int earnedXp) {

        List<Buff> actives = buffMapper.findActiveByUserIdAndStatType(userId, statType);

        if (actives.isEmpty()) return earnedXp;

        // 디버프만 XP에 적용
        int totalPct = actives.stream()
                .filter(b -> "DEBUFF".equals(b.getBuffType()))
                .mapToInt(Buff::getEffectPct)
                .sum();

        int result = (int)(earnedXp * (1.0 + totalPct / 100.0));

        return Math.max(result, 0);
    }

        public boolean hasPointBuff(Long userId) {

        return hasActiveBuff(userId, "멈출 수 없는 힘")
            || hasActiveBuff(userId, "집중력 MAX")
            || hasActiveBuff(userId, "불굴의 의지")
            || hasActiveBuff(userId, "넘치는 생명력");
    }

    // ─────────────────────────────────────────────
    // 나태함 디버프 (기존 방식, 변경 없음)
    // ─────────────────────────────────────────────

    /**
     * 나태함: 일간 퀘스트 3일 연속 0% → 포인트 -5%
     * 해제: 1개 이상 달성 3일 연속
     */
    private void checkLaziness(Long userId) {
        int emptyDays = questLogMapper.countConsecutiveEmptyDays(userId);
        if (emptyDays >= 3) {
        	applyDebuff(userId, "나태함", "ALL", -5);
        } else {
            int recoveryDays = questLogMapper.countConsecutiveActiveDays(userId);
            if (recoveryDays >= 3) {
                buffMapper.deleteByUserIdAndName(userId, "나태함");
            }
        }
    }

    // ─────────────────────────────────────────────
    // [신규] 디버프 재설계 — 자정 랜덤 발동
    // ─────────────────────────────────────────────

    /**
     * 자정 스케줄러에서 호출: 전체 유저 대상 4스탯 디버프 랜덤 판정
     * - 레벨 × 0.5% 확률로 각 스탯 독립 판정
     * - 유저당 활성 스탯디버프 최대 2개
     * - 이미 해당 스탯에 디버프가 있으면 중복 판정 안 함
     */
    @Transactional
    public void rollNightlyDebuffs() {
        List<Long> userIds = userMapper.findAllUserIds();
        log.info("[BuffService] 자정 디버프 랜덤 발동 시작 — 대상 유저 {}명", userIds.size());

        for (Long userId : userIds) {
            try {
                rollForUser(userId);
            } catch (Exception e) {
                log.error("[BuffService] userId={} 디버프 롤 중 오류", userId, e);
            }
        }
        log.info("[BuffService] 자정 디버프 랜덤 발동 완료");
    }

    private void rollForUser(Long userId) {
        UserStats stats = userStatsMapper.findByUserId(userId);
        if (stats == null) return;

        List<Buff> activeDebuffs = buffMapper.findActiveStatDebuffsByUserId(userId);
        int activeCount = activeDebuffs.size();
        if (activeCount >= MAX_ACTIVE_STAT_DEBUFFS) return; // 이미 가득 찼으면 스킵

        java.util.Set<String> alreadyDebuffedStats = new java.util.HashSet<>();
        for (Buff b : activeDebuffs) alreadyDebuffedStats.add(b.getStatType());

        String[] statTypes = {"STR", "INT", "WIL", "VIT"};
        for (String statType : statTypes) {
            if (activeCount >= MAX_ACTIVE_STAT_DEBUFFS) break;
            if (alreadyDebuffedStats.contains(statType)) continue; // 이미 해당 스탯 디버프 있음

            int level = getStatLevel(stats, statType);
            double chance = level * 0.005; // 레벨 × 0.5%
            if (ThreadLocalRandom.current().nextDouble() < chance) {
                String name = pickRandomDebuffName(statType);
                Buff buff = new Buff();
                buff.setUserId(userId);
                buff.setName(name);
                buff.setStatType(statType);
                buff.setEffectPct(DEBUFF_EFFECT_PCT);
                buffMapper.insertDebuff(buff);
                activeCount++;
                log.info("[BuffService] userId={} 디버프 발동: {} ({})", userId, name, statType);
            }
        }
    }

    private String pickRandomDebuffName(String statType) {
        String[] pool = DEBUFF_POOL.get(statType);
        int idx = ThreadLocalRandom.current().nextInt(pool.length);
        return pool[idx];
    }

    /**
     * 자정 스케줄러에서 호출: linked_quest를 전날 완료하지 못한 디버프들 progress 리셋
     * rollNightlyDebuffs()보다 먼저 호출되어야 함 (당일 새로 건 디버프가 리셋되지 않도록)
     */
    @Transactional
    public void resetStaleReleaseProgress() {
        buffMapper.resetStaleProgress();
    }

    /**
     * 디버프 해제미션(PHOTO 퀘스트) 지정
     * QuestController에서 호출
     *
     * @throws IllegalArgumentException 대상이 디버프가 아니거나, 퀘스트가 PHOTO 타입이 아닌 경우
     */
    @Transactional
    public void linkReleaseQuest(Long buffId, Long questId) {
        Buff buff = buffMapper.findById(buffId);
        if (buff == null || !"DEBUFF".equals(buff.getBuffType())) {
            throw new IllegalArgumentException("디버프를 찾을 수 없습니다.");
        }
        Quest quest = questMapper.findById(questId);
        if (quest == null) {
            throw new IllegalArgumentException("퀘스트를 찾을 수 없습니다.");
        }
        if (!"PHOTO".equals(quest.getVerifyType())) {
            throw new IllegalArgumentException("해제미션은 사진인증(PHOTO) 퀘스트만 지정할 수 있습니다.");
        }
        buffMapper.updateLinkedQuest(buffId, questId);
    }

    /**
     * 퀘스트 완료 시 해제미션 진행도 체크 (QuestService.completeQuest에서 호출)
     * - 완료한 퀘스트가 어떤 디버프의 linked_quest_id와 일치하면 progress +1
     * - progress가 목표(2일) 도달하면 디버프 삭제 + 보너스 XP 지급
     */
    @Transactional
    public void checkReleaseProgress(Long userId, Long questId, String statType) {
        Buff buff = buffMapper.findByUserIdAndLinkedQuestId(userId, questId);
        if (buff == null) return; // 해제미션으로 지정된 퀘스트 아님

        buffMapper.incrementProgress(buff.getBuffId());
        int newProgress = buff.getProgress() + 1;

        if (newProgress >= RELEASE_PROGRESS_GOAL) {
            // 해제 완료: 디버프 삭제 + 보너스 XP 지급
            buffMapper.deleteById(buff.getBuffId());
            grantReleaseBonus(userId, buff.getStatType());
            log.info("[BuffService] userId={} 디버프 해제: {} (보너스 XP 지급)", userId, buff.getName());
        }
    }

    /**
     * 해제 보너스 XP 지급: 기본XP × (1 + 레벨×0.05) — 스트릭배율 없이 1회 적용
     * 기본XP는 SMALL(15) 기준 (해제 보너스는 별도 고정 기준)
     */
    private void grantReleaseBonus(Long userId, String statType) {
        UserStats stats = userStatsMapper.findByUserId(userId);
        if (stats == null) return;

        int level = getStatLevel(stats, statType);
        int baseXp = 15; // SMALL 기준
        int bonusXp = xpService.calcEarnedXp(baseXp, level, 0); // streakDays=0 → 배율 1.0

        int currentExp = getStatExp(stats, statType);
        int dailyExp = getDailyExp(stats, statType);

        XpService.LevelUpResult result = xpService.calcLevelUp(level, currentExp, bonusXp);
        userStatsMapper.updateStatExp(userId, statType, result.remainExp, result.newLevel, dailyExp + bonusXp);
    }
    //신규 버프 시스템
    private void checkRoutineBuff(Long userId, String statType){

        // 만료된 버프 삭제
        buffMapper.deleteExpiredBuffs(userId);

        int streak = questLogMapper.countStreakByStat(userId, statType);
        
        String buffName;
        String effectStat;

        switch (statType) {

        case "STR":
            buffName = "멈출 수 없는 힘";
            effectStat = "STR";
            break;

        case "INT":
            buffName = "집중력 MAX";
            effectStat = "INT";
            break;

        case "WIL":
            buffName = "불굴의 의지";
            effectStat = "WIL";
            break;

        case "VIT":
            buffName = "넘치는 생명력";
            effectStat = "VIT";
            break;

        default:
            return;
        }

        if (streak >= 7 && streak % 7 == 0) {

            buffMapper.deleteByUserIdAndName(userId, buffName);

            applyBuff(
                userId,
                "BUFF",
                buffName,
                effectStat,
                5,
                2
            );

        }
        else if (streak == 3) {

            if(buffMapper.findByUserIdAndName(userId,buffName)==null){

                applyBuff(
                    userId,
                    "BUFF",
                    buffName,
                    effectStat,
                    5,
                    1
                );
            }
        }
    }
    // ─────────────────────────────────────────────
    // 공통 헬퍼
    // ─────────────────────────────────────────────

    private void applyBuff(
            Long userId,
            String buffType,
            String name,
            String statType,
            int effectPct,
            int days) {
        if (buffMapper.findByUserIdAndName(userId, name) != null) return;
        Buff buff = new Buff();
        buff.setUserId(userId);
        buff.setBuffType(buffType);
        buff.setName(name);
        buff.setStatType(statType);
        buff.setEffectPct(effectPct);
        buff.setExpiresAt(
        	    LocalDateTime.now().plusDays(days)
        	);
        buffMapper.insert(buff);
    }
    
    private void applyDebuff(
            Long userId,
            String name,
            String statType,
            int effectPct) {

        if (buffMapper.findByUserIdAndName(userId, name) != null) return;

        Buff buff = new Buff();
        buff.setUserId(userId);
        buff.setBuffType("DEBUFF");
        buff.setName(name);
        buff.setStatType(statType);
        buff.setEffectPct(effectPct);

        // 디버프는 만료시간 없음
        buff.setExpiresAt(null);

        buffMapper.insert(buff);
    }
    

    private int getStatLevel(UserStats stats, String statType) {
        return switch (statType) {
            case "STR" -> stats.getStrLevel();
            case "INT" -> stats.getIntLevel();
            case "WIL" -> stats.getWilLevel();
            case "VIT" -> stats.getVitLevel();
            default -> 1;
        };
    }

    private int getStatExp(UserStats stats, String statType) {
        return switch (statType) {
            case "STR" -> stats.getStrExp();
            case "INT" -> stats.getIntExp();
            case "WIL" -> stats.getWilExp();
            case "VIT" -> stats.getVitExp();
            default -> 0;
        };
    }

    private int getDailyExp(UserStats stats, String statType) {
        return switch (statType) {
            case "STR" -> stats.getStrDailyExp();
            case "INT" -> stats.getIntDailyExp();
            case "WIL" -> stats.getWilDailyExp();
            case "VIT" -> stats.getVitDailyExp();
            default -> 0;
        };
    }
}