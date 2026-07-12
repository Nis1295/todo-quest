package org.cloud.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 퀘스트 슬롯 확장 이력을 담는 도메인 클래스
 * DB의 slot_upgrades 테이블과 매핑됨
 */
@Getter
@Setter
@NoArgsConstructor
public class SlotUpgrade {
    private Long upgradeId;       // 확장 고유 ID (PK)
    private Long userId;          // 회원 ID (FK → users.user_id)
    private String period;        // 확장 대상 기간 (DAILY/WEEKLY/MONTHLY/YEARLY)
    private int upgradeCount;     // 몇 번째 확장인지 (1~10)
    private int costPoint;        // 사용한 포인트
    private LocalDateTime createdAt;
}