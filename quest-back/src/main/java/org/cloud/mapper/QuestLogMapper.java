package org.cloud.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.cloud.domain.QuestLog;

/**
 * 퀘스트 완료 인증 로그 관련 DB 작업을 처리하는 MyBatis Mapper 인터페이스
 */
@Mapper
public interface QuestLogMapper {

    // 퀘스트 완료 인증 로그 저장
    void insert(QuestLog log);

    // 특정 회원의 전체 인증 로그 조회 (최신순)
    List<QuestLog> findByUserId(Long userId);

    // 오늘 특정 스탯으로 획득한 XP 합계 (일일 XP 상한 체크용)
    int sumDailyXp(Long userId, String statType);

    // 특정 퀘스트의 연속 달성 일수 (스트릭)
    int countStreak(Long userId, Long questId);

    // 특정 스탯의 연속 달성 일수 (버프 조건 체크용 — 해당 스탯 퀘스트 전체 기준)
    int countStreakByStat(Long userId, String statType);

    // 특정 스탯 + 제목 키워드로 연속 달성 일수 (H2O MAX, 피로누적 체크용)
    int countStreakByStatAndTitle(Long userId, String statType, String titleKeyword);

    // 오늘 특정 제목 키워드 퀘스트 완료 여부 (완전회복, 탈수 체크용)
    boolean completedTodayByTitle(Long userId, String titleKeyword);

    // 일간 퀘스트를 하나도 완료 안 한 날이 연속 며칠인지 (나태함 체크용)
    int countConsecutiveEmptyDays(Long userId);

    // 일간 퀘스트를 1개 이상 완료한 날이 연속 며칠인지 (나태함 해제용)
    int countConsecutiveActiveDays(Long userId);

    // 특정 제목 키워드 퀘스트를 미달성한 날이 연속 며칠인지 (피로누적 체크용)
    int countMissedDaysByTitle(Long userId, String titleKeyword);

    // 특정 스탯 퀘스트를 미달성한 날이 연속 며칠인지 (지식 정체, 번아웃 체크용)
    int countMissedDaysByStat(Long userId, String statType);

    List<Map<String, Object>> findLogsByUserId(Long userId);
}