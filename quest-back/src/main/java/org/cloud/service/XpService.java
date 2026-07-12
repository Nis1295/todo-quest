package org.cloud.service;

import org.springframework.stereotype.Service;

/**
 * XP 계산 전담 서비스 클래스
 * 스토리보드 v0.4의 게임 시스템 공식을 구현
 */
@Service
public class XpService {

    /**
     * 실제 획득 XP 계산
     * 공식: 기본XP × (1 + 스탯레벨 × 0.05) × 스트릭배율
     */
    public int calcEarnedXp(int baseXp, int statLevel, int streakDays) {
        double levelMultiplier = 1.0 + (statLevel * 0.05);
        double streakMultiplier = getStreakMultiplier(streakDays);
        return (int)(baseXp * levelMultiplier * streakMultiplier);
    }

    /**
     * 연속 달성 일수에 따른 스트릭 배율 반환
     */
    private double getStreakMultiplier(int streakDays) {
        if (streakDays >= 30) return 1.50;
        if (streakDays >= 7)  return 1.20;
        if (streakDays >= 3)  return 1.10;
        return 1.0;
    }

    /**
     * 레벨업에 필요한 XP 계산
     * 공식: 30 × (1.15 ^ 현재레벨)
     */
    public int calcRequiredXp(int currentLevel) {
        return (int)(30 * Math.pow(1.15, currentLevel));
    }

    /**
     * 일일 XP 상한 계산
     * 공식: 300 × (1 + 스탯레벨 × 0.03)
     */
    public int calcDailyLimit(int statLevel) {
        return (int)(300 * (1.0 + statLevel * 0.03));
    }

    /**
     * 일일 포인트 적립 상한 계산 (XP 일일상한과 동일 공식, 메인스탯 레벨 기준)
     * 공식: 300 × (1 + 메인스탯레벨 × 0.03)
     */
    public long calcDailyPointLimit(int mainStatLevel) {
        return (long)(300 * (1.0 + mainStatLevel * 0.03));
    }

    /**
     * 레벨업 처리 결과를 담는 내부 클래스
     * B방식(잔여 XP): 레벨업 시 소모된 XP를 차감하고 남은 XP만 보관
     */
    public static class LevelUpResult {
        public final int newLevel;  // 레벨업 후 새 레벨
        public final int remainExp; // 레벨업 후 남은 잔여 XP

        public LevelUpResult(int newLevel, int remainExp) {
            this.newLevel = newLevel;
            this.remainExp = remainExp;
        }
    }

    /**
     * 레벨업 판정 (잔여 XP 방식 — 정통 RPG)
     * 레벨업 시 필요 XP를 차감하고 남은 XP로 연속 레벨업 체크
     *
     * 예) 현재 Lv.1, 잔여XP=0, 획득XP=89
     *   → 현재 잔여 = 0 + 89 = 89
     *   → Lv.1→2 필요: 34XP, 89 >= 34 → 레벨업, 잔여 = 55
     *   → Lv.2→3 필요: 39XP, 55 >= 39 → 레벨업, 잔여 = 16
     *   → Lv.3→4 필요: 45XP, 16 < 45  → 종료
     *   → 결과: Lv.3, remainExp=16
     *
     * @param currentLevel 현재 레벨
     * @param currentExp   현재 잔여 XP (레벨업 후 남은 XP)
     * @param earnedXp     이번에 획득한 XP
     */
    public LevelUpResult calcLevelUp(int currentLevel, int currentExp, int earnedXp) {
        int level = currentLevel;
        int exp   = currentExp + earnedXp; // 잔여 XP에 획득 XP 합산

        // 최대 레벨 100까지 연속 레벨업 체크
        while (level < 100) {
            int required = calcRequiredXp(level);
            if (exp >= required) {
                exp -= required; // 필요 XP 차감
                level++;         // 레벨업
            } else {
                break; // 더 이상 레벨업 불가
            }
        }

        return new LevelUpResult(level, exp);
    }
}