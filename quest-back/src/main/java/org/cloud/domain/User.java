package org.cloud.domain;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 회원 정보를 담는 도메인 클래스
 * DB의 users 테이블과 매핑됨
 */
@Getter          //모든 필드의 getter 자동 생성
@Setter          //모든 필드의 setter 자동 생성
@NoArgsConstructor //기본 생성자 자동 생성
public class User {
    private Long userId;          // 회원 고유 ID (PK, AUTO_INCREMENT)
    private String email;         // 로그인용 이메일 (UNIQUE)
    private String password;      // 암호화된 비밀번호
    private String nickname;      // 닉네임 (화면에 표시되는 이름)
    private int birthYear;        // 출생연도 → 메인 레벨(나이) 계산에 사용
    private String mbti;          // MBTI (선택 입력, ex: INTJ)
    private String chronotype;    // 아침형/저녁형 (MORNING or EVENING)
    private long totalPoint;      // 누적 포인트 (랭킹 기준 + 아이템 구매)
    private LocalDateTime createdAt; // 가입 일시
    private LocalDateTime updatedAt; // 최근 수정 일시
    private String mainStat; // 메인 스탯 (STR/INT/WIL/VIT)
    private String profileImage; // 프로필 이미지 URL
    private String likes;        // 좋아하는 것
    private String dislikes;     // 싫어하는 것
    private String goal;         // 목표
    private int nicknameChangeCount; // 닉네임 변경 가능 횟수 (기본 1)
    private long dailyPoint;      // 오늘 적립한 포인트 (일일 상한 체크용, 자정에 리셋)
}