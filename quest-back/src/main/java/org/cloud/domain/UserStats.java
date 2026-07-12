package org.cloud.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

/**
 * 사용자의 4대 스탯 레벨 및 경험치를 담는 도메인 클래스
 * DB의 user_stats 테이블과 매핑됨
 * users 테이블과 1:1 관계
 */
@Getter
@Setter
@NoArgsConstructor
public class UserStats {
    private Long userId;          // 회원 ID (FK → users.user_id)

    // STR 체력 스탯
    private int strLevel;         // 체력 레벨 (1~100)
    private int strExp;           // 체력 누적 경험치
    private int strDailyExp;      // 오늘 획득한 체력 XP (자정마다 0으로 리셋)

    // INT 지력 스탯
    private int intLevel;         // 지력 레벨 (1~100)
    private int intExp;           // 지력 누적 경험치
    private int intDailyExp;      // 오늘 획득한 지력 XP

    // WIL 의지력 스탯
    private int wilLevel;         // 의지력 레벨 (1~100)
    private int wilExp;           // 의지력 누적 경험치
    private int wilDailyExp;      // 오늘 획득한 의지력 XP

    // VIT 활력 스탯
    private int vitLevel;         // 활력 레벨 (1~100)
    private int vitExp;           // 활력 누적 경험치
    private int vitDailyExp;      // 오늘 획득한 활력 XP

    private LocalDate lastResetDate; // 일일 XP 마지막 리셋 날짜 (자정 리셋 기준)
}