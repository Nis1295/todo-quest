package org.cloud.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 버프/디버프 상태를 담는 도메인 클래스
 * DB의 buffs 테이블과 매핑됨
 * RPG 상태창 캐릭터 발 아래에 표시됨
 */
@Getter
@Setter
@NoArgsConstructor
public class Buff {
    private Long buffId;          // 버프/디버프 고유 ID (PK)
    private Long userId;          // 대상 회원 ID (FK → users.user_id)

    // 타입: BUFF(버프=긍정효과), DEBUFF(디버프=부정효과)
    private String buffType;

    private String name;          // 버프/디버프 이름 (ex: H2O MAX, 나태함)

    // 영향받는 스탯: STR, INT, WIL, VIT, ALL(전체)
    private String statType;

    private int effectPct;        // 효과 퍼센트 (양수=버프, 음수=디버프, ex: +15, -10)
    private LocalDateTime expiresAt;  // 만료 일시 (null이면 조건 해제형)
    private LocalDateTime createdAt;  // 버프/디버프 발동 일시

    private Long linkedQuestId;   // 디버프 해제용으로 지정된 PHOTO 퀘스트 ID (없으면 null)
    private int progress;         // 해제미션 연속완료 진행도 (0~2, 2달성 시 해제)
}