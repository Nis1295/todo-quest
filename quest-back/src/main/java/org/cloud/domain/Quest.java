package org.cloud.domain;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 퀘스트 정보를 담는 도메인 클래스
 * DB의 quests 테이블과 매핑됨
 */
@Getter
@Setter
@NoArgsConstructor
public class Quest {
    private Long questId;         // 퀘스트 고유 ID (PK)
    private Long userId;          // 작성자 회원 ID (FK → users.user_id)
    private String title;         // 퀘스트 제목 (최대 30자)
    private String period;        // DAILY / WEEKLY / MONTHLY / YEARLY
    private String statType;      // STR / INT / WIL / VIT
    private String xpSize;        // SMALL / MEDIUM / LARGE
    private String verifyType;    // CHECK / TIME / PHOTO
    private String notifyType;    // NONE / BANNER / FULLSCREEN
    private String notifyTab;     // 알림 기준 탭
    private boolean showCard;     // 알림 시 카드 목록 표시 여부
    private boolean template;     // 기본 제공 템플릿 여부
    private boolean active;       // 활성 여부 (soft delete)
    private boolean completed;    // 오늘 완료 여부 (quest_logs 기준, DB 컬럼 아님)
    private Integer targetMinutes;  // 시간 인증 목표 시간(분), TIME 방식일 때만 사용
    private LocalDateTime createdAt;
    private java.time.LocalDate deadline;   // 퀘스트 마감일 (연장 시 하루씩 늘어남)
    private java.time.LocalDateTime extendedAt;  // 마지막 연장 일시
}