package org.cloud.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.cloud.domain.Quest;
import org.cloud.domain.QuestLog;
import org.cloud.domain.User;
import org.cloud.domain.UserStats;
import org.cloud.mapper.QuestLogMapper;
import org.cloud.mapper.QuestMapper;
import org.cloud.mapper.UserMapper;
import org.cloud.mapper.UserStatsMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class QuestService {

    private final QuestMapper questMapper;
    private final QuestLogMapper questLogMapper;
    private final UserStatsMapper userStatsMapper;
    private final UserMapper userMapper;
    private final XpService xpService;
    private final BuffService buffService;

    /** 퀘스트 생성 */
    @Transactional
    public void createQuest(Quest quest) {
        questMapper.insert(quest);
    }

    /** 기간별 퀘스트 목록 조회 */
    public List<Quest> getQuestsByPeriod(Long userId, String period) {
        return questMapper.findByUserIdAndPeriod(userId, period);
    }

    /**
     * 퀘스트 완료 인증 처리
     *
     * 연간(버킷리스트) 특별 규칙:
     * - 생성 후 7일 이후에만 완료 가능
     * - XP 기본의 3배 지급
     */
    @Transactional
    public int completeQuest(Long userId, Long questId, String verifyType, String photoUrl, int elapsedSec) {

        // 1. 퀘스트 정보 조회
    	Quest quest = questMapper.findById(questId);
        String statType = quest.getStatType();
        String title    = quest.getTitle();
        int baseXp      = getBaseXp(quest.getXpSize());
        // 타이머 검증 추가
        validateTimer(quest, elapsedSec);

        // 2. 연간(버킷리스트) 7일 제한 체크
        if ("YEARLY".equals(quest.getPeriod())) {
            LocalDateTime createdAt = quest.getCreatedAt();
            if (createdAt != null && createdAt.plusDays(7).isAfter(LocalDateTime.now())) {
                throw new IllegalStateException("버킷리스트는 생성 후 7일 이후에 완료할 수 있습니다.");
            }
            // 연간 퀘스트 XP 3배
            baseXp = baseXp * 3;
        }

        // 3. 현재 스탯 조회
        UserStats stats = userStatsMapper.findByUserId(userId);
        int statLevel  = getStatLevel(stats, statType);
        int currentExp = getStatExp(stats, statType);
        int dailyExp   = getDailyExp(stats, statType);

        // 4. 스트릭 계산
        int streakDays = questLogMapper.countStreak(userId, questId);

        // 5. XP 계산 (레벨 보정 + 스트릭 배율)
        int earnedXp = xpService.calcEarnedXp(baseXp, statLevel, streakDays);

        // 6. 버프/디버프 효과 적용
        earnedXp = buffService.applyEffects(userId, statType, earnedXp);
        

        // 7. 일일 XP 상한 체크
        int dailyLimit = xpService.calcDailyLimit(statLevel);
        boolean cappedOut = (dailyExp >= dailyLimit);
        if (cappedOut) earnedXp = 0;

        // 8. 인증 로그 저장
        QuestLog log = new QuestLog();
        log.setQuestId(questId);
        log.setUserId(userId);
        log.setVerifyType(verifyType);
        log.setPhotoUrl(photoUrl);
        log.setElapsedSec(elapsedSec);
        log.setBaseXp(baseXp);
        log.setEarnedXp(earnedXp);
        log.setStreakDays(streakDays);
        questLogMapper.insert(log);
        log.setTitle(quest.getTitle());  // 이 줄 추가
        

        if (!cappedOut) {
            // 9. 레벨업 판정 + 스탯 업데이트 (잔여 XP 방식)
            XpService.LevelUpResult result = xpService.calcLevelUp(statLevel, currentExp, earnedXp);
            int newDailyExp = dailyExp + earnedXp;
            userStatsMapper.updateStatExp(userId, statType, result.remainExp, result.newLevel, newDailyExp);

           
            //10. 포인트 적립
            long point = earnedXp;

            if (buffService.hasPointBuff(userId)) {
                point = Math.round(point * 1.05);
            }

            User user = userMapper.findById(userId);
            int mainStatLevel = getStatLevel(stats, user.getMainStat());
            long pointDailyLimit = xpService.calcDailyPointLimit(mainStatLevel);
            long remainingPointQuota = pointDailyLimit - user.getDailyPoint();

            if (remainingPointQuota > 0) {
                long actualPoint = Math.min(point, remainingPointQuota);
                userMapper.addDailyPoint(userId, actualPoint);
            }
            // remainingPointQuota <= 0 이면 포인트 적립 없이 패스 (퀘스트 완료/XP는 그대로 처리됨)
        }

        // 11. 버프/디버프 발동·해제 체크 (해제미션 진행도 체크 포함)
        buffService.checkAndApply(userId, questId, statType, title);
       

        return earnedXp;
    }
    
    /**
     * 내 템플릿 목록 조회
     */
    public List<Quest> getTemplates(Long userId) {
        return questMapper.findTemplatesByUserId(userId);
    }
    
    /**
     * 퀘스트 하루 연장
     * - 오늘 이미 연장했으면 거부
     */
    public void extendQuest(Long questId) {
        Quest quest = questMapper.findById(questId);

        // 오늘 이미 연장했으면 거부
        if (quest.getExtendedAt() != null &&
            quest.getExtendedAt().toLocalDate().equals(LocalDate.now())) {
            throw new IllegalStateException("오늘 이미 연장했습니다");
        }
        questMapper.extendDeadline(questId);
    }

    /**
     * 타이머 완료 검증
     * - TIME 타입 퀘스트는 elapsedSec이 targetMinutes*60 이상이어야 완료 가능
     */
    private void validateTimer(Quest quest, int elapsedSec) {
        if ("TIME".equals(quest.getVerifyType())) {
            int targetSec = quest.getTargetMinutes() * 60;
            if (elapsedSec < targetSec) {
                throw new IllegalStateException("목표 시간 미달성 — 완료 불가");
            }
        }
    }
    
    /** 활동 기록 조회 */
    public List<Map<String, Object>> getLogs(Long userId) {
        return questLogMapper.findLogsByUserId(userId);
    }

    /** 퀘스트 비활성화 (soft delete) */
    @Transactional
    public void deactivateQuest(Long questId) {
        questMapper.deactivate(questId);
    }

    // ─────────────────────────────────────────────
    // private 헬퍼
    // ─────────────────────────────────────────────

    private int getBaseXp(String xpSize) {
        return switch (xpSize) {
            case "SMALL"  -> 15;
            case "MEDIUM" -> 40;
            case "LARGE"  -> 85;
            default -> 15;
        };
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