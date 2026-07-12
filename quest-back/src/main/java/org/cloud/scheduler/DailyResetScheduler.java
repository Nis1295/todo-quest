package org.cloud.scheduler;

import org.cloud.mapper.QuestMapper;
import org.cloud.mapper.UserMapper;
import org.cloud.mapper.UserStatsMapper;
import org.cloud.service.BuffService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 일일 XP 리셋 + 만료 퀘스트 비활성화 + 디버프 랜덤 발동 스케줄러
 * 매일 자정(00:00)에 실행
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DailyResetScheduler {

    private final UserStatsMapper userStatsMapper;
    private final QuestMapper questMapper;
    private final UserMapper userMapper;
    private final BuffService buffService;

    /**
     * 매일 자정 실행
     * 1. 일일 XP 리셋
     * 2. 마감 지난 퀘스트 비활성화
     * 3. 디버프 해제미션 progress 리셋 (전날 미완료 시)
     * 4. 4스탯 디버프 랜덤 발동 판정
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void resetDailyExp() {
        log.info("[DailyResetScheduler] 일일 XP 리셋 시작");
        userStatsMapper.resetAllDailyExp();
        log.info("[DailyResetScheduler] 일일 XP 리셋 완료");

        log.info("[DailyResetScheduler] 일일 포인트 리셋 시작");
        userMapper.resetAllDailyPoint();
        log.info("[DailyResetScheduler] 일일 포인트 리셋 완료");

        log.info("[DailyResetScheduler] 만료 퀘스트 비활성화 시작");
        questMapper.deactivateExpired();
        log.info("[DailyResetScheduler] 만료 퀘스트 비활성화 완료");

        // 디버프 랜덤 발동보다 먼저 실행되어야 함 (당일 새로 건 디버프가 리셋되지 않도록)
        log.info("[DailyResetScheduler] 디버프 해제미션 progress 리셋 시작");
        buffService.resetStaleReleaseProgress();
        log.info("[DailyResetScheduler] 디버프 해제미션 progress 리셋 완료");

        log.info("[DailyResetScheduler] 디버프 랜덤 발동 시작");
        buffService.rollNightlyDebuffs();
        log.info("[DailyResetScheduler] 디버프 랜덤 발동 완료");
    }
}