package org.cloud.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 퀘스트 인증 기록을 담는 도메인 클래스
 * DB의 quest_logs 테이블과 매핑됨
 * 퀘스트를 완료할 때마다 한 행씩 생성됨
 */
@Getter
@Setter
@NoArgsConstructor
public class QuestLog {
    private Long logId;           // 인증 로그 고유 ID (PK)
    private Long questId;         // 완료한 퀘스트 ID (FK → quests.quest_id)
    private Long userId;          // 완료한 회원 ID (FK → users.user_id)

    // 인증 방식: CHECK(체크), TIME(시간기록), PHOTO(사진)
    private String verifyType;

    private String photoUrl;      // 사진 인증 URL (본인만 열람, 소셜 기능 추가 시 공유 가능)
    private int elapsedSec;       // 시간 기록 인증 시 소요 시간 (초 단위)
    private int baseXp;           // 기본 XP (소=15, 중=40, 대=85)
    private int earnedXp;         // 실제 획득 XP (레벨 보정 + 스트릭 보너스 적용 후)
    private int streakDays;       // 인증 당시 연속 달성 일수
    private LocalDateTime completedAt; // 인증 완료 일시
    private String title;
}