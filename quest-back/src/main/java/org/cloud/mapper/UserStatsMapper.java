package org.cloud.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.cloud.domain.UserStats;

/**
 * 4대 스탯(STR/INT/WIL/VIT) 관련 DB 작업을 처리하는 MyBatis Mapper 인터페이스
 * resources/mapper/UserStatsMapper.xml과 연결됨
 * users 테이블과 1:1 관계
 */
@Mapper
public interface UserStatsMapper {

    // 회원가입 시 user_stats 초기 행 삽입 (모든 스탯 Lv.1, XP=0)
    void insert(Long userId);

    // 회원 ID로 스탯 전체 조회 (RPG 상태창, 퀘스트 완료 시 사용)
    UserStats findByUserId(Long userId);

    // 퀘스트 완료 후 특정 스탯의 누적 XP + 레벨 업데이트
    // statType: STR / INT / WIL / VIT
    void updateStatExp(Long userId, String statType, int newExp, int newLevel, int newDailyExp);

    // 자정 스케줄러용: 모든 유저의 일일 XP(dailyExp) 0으로 리셋 + lastResetDate 갱신
    void resetAllDailyExp();
}