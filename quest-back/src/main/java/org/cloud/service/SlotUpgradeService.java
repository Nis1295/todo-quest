package org.cloud.service;

import org.cloud.domain.SlotUpgrade;
import org.cloud.mapper.SlotUpgradeMapper;
import org.cloud.mapper.UserMapper;
import org.cloud.domain.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 퀘스트 슬롯 확장 비즈니스 로직
 * - 포인트 구매 (영구)
 * - 광고 시청 (1년 1회, 24시간 임시 슬롯, YEARLY 전용)
 */
@Service
@RequiredArgsConstructor
public class SlotUpgradeService {

    private final SlotUpgradeMapper slotUpgradeMapper;
    private final UserMapper userMapper;

    // 광고 시청 기록 저장 (userId → 광고 시청 일시)
    // 실제 서비스에서는 DB 컬럼으로 관리 권장
    private final Map<Long, LocalDateTime> adWatchedAt  = new ConcurrentHashMap<>(); // 광고 시청 일시
    private final Map<Long, LocalDateTime> adSlotExpiry = new ConcurrentHashMap<>(); // 임시 슬롯 만료 일시

    private static final int[] DAILY_COSTS   = {500, 1000, 2000, 3000, 4500, 6500, 9500, 14000, 20000, 30000};
    private static final int[] WEEKLY_COSTS  = {1000, 2000, 4000};
    private static final int[] MONTHLY_COSTS = {2000, 4000};
    private static final int[] YEARLY_COSTS  = {5000};

    /**
     * 슬롯 확장 (포인트 구매, 영구)
     */
    @Transactional
    public int upgradeSlot(Long userId, String period) {
        int currentCount = slotUpgradeMapper.countByUserIdAndPeriod(userId, period);
        int[] costs      = getCosts(period);
        int baseSlot     = getBaseSlot(period);

        if (currentCount >= costs.length) {
            throw new IllegalStateException("최대 슬롯 확장 횟수에 도달했습니다.");
        }

        int cost = costs[currentCount];
        User user = userMapper.findById(userId);
        if (user.getTotalPoint() < cost) {
            throw new IllegalArgumentException("포인트가 부족합니다. 필요: " + cost + " / 보유: " + user.getTotalPoint());
        }

        userMapper.updatePoint(userId, -cost);

        SlotUpgrade upgrade = new SlotUpgrade();
        upgrade.setUserId(userId);
        upgrade.setPeriod(period);
        upgrade.setUpgradeCount(currentCount + 1);
        upgrade.setCostPoint(cost);
        slotUpgradeMapper.insert(upgrade);

        return baseSlot + currentCount + 1;
    }

    /**
     * 광고 시청 → YEARLY 임시 슬롯 +1
     * 규칙:
     * - 1년에 1회만 가능
     * - 슬롯은 24시간 유효
     * - 24시간 안에 퀘스트 미등록 시 슬롯 소멸
     */
    public Map<String, Object> watchAdForSlot(Long userId) {
        LocalDateTime now       = LocalDateTime.now();
        LocalDateTime watched   = adWatchedAt.get(userId);

        // 1년 1회 제한 체크
        if (watched != null && watched.plusYears(1).isAfter(now)) {
            LocalDateTime nextAvailable = watched.plusYears(1);
            throw new IllegalStateException(
                "광고 슬롯은 1년에 1회만 사용 가능합니다. 다음 가능일: " +
                nextAvailable.toLocalDate().toString()
            );
        }

        // 광고 시청 기록 + 24시간 임시 슬롯 부여
        adWatchedAt.put(userId, now);
        LocalDateTime expiry = now.plusHours(24);
        adSlotExpiry.put(userId, expiry);

        return Map.of(
            "message",       "광고 시청 완료! 버킷리스트 슬롯 +1",
            "expiresAt",     expiry.toString(),
            "nextAdAvailable", now.plusYears(1).toLocalDate().toString(),
            "tempSlot",      true
        );
    }

    /**
     * 광고 슬롯 상태 조회 (UI 표시용)
     * - available: 광고 시청 가능 여부
     * - tempSlotActive: 현재 임시 슬롯 활성 여부
     * - nextAdAvailable: 다음 광고 가능일 (1년 후)
     * - expiresAt: 임시 슬롯 만료 시각
     */
    public Map<String, Object> getAdSlotStatus(Long userId) {
        LocalDateTime now     = LocalDateTime.now();
        LocalDateTime watched = adWatchedAt.get(userId);
        LocalDateTime expiry  = adSlotExpiry.get(userId);

        boolean available       = (watched == null || watched.plusYears(1).isBefore(now));
        boolean tempSlotActive  = (expiry != null && expiry.isAfter(now));
        String  nextAdAvailable = (watched != null) ? watched.plusYears(1).toLocalDate().toString() : null;
        String  expiresAt       = tempSlotActive ? expiry.toString() : null;

        return Map.of(
            "available",        available,
            "tempSlotActive",   tempSlotActive,
            "nextAdAvailable",  nextAdAvailable != null ? nextAdAvailable : "",
            "expiresAt",        expiresAt != null ? expiresAt : ""
        );
    }

    /**
     * 현재 슬롯 수 조회 (영구 + 임시 포함)
     */
    public int getCurrentSlot(Long userId, String period) {
        int base = getBaseSlot(period) + slotUpgradeMapper.countByUserIdAndPeriod(userId, period);
        if ("YEARLY".equals(period)) {
            LocalDateTime expiry = adSlotExpiry.get(userId);
            if (expiry != null && expiry.isAfter(LocalDateTime.now())) {
                base += 1;
            }
        }
        return base;
    }

    /** 다음 확장 비용 조회 */
    public int getNextUpgradeCost(Long userId, String period) {
        int currentCount = slotUpgradeMapper.countByUserIdAndPeriod(userId, period);
        int[] costs = getCosts(period);
        if (currentCount >= costs.length) return -1;
        return costs[currentCount];
    }

    private int[] getCosts(String period) {
        return switch (period) {
            case "DAILY"   -> DAILY_COSTS;
            case "WEEKLY"  -> WEEKLY_COSTS;
            case "MONTHLY" -> MONTHLY_COSTS;
            case "YEARLY"  -> YEARLY_COSTS;
            default -> throw new IllegalArgumentException("잘못된 period: " + period);
        };
    }

    private int getBaseSlot(String period) {
        return switch (period) {
            case "DAILY"   -> 10;
            case "WEEKLY"  -> 5;
            case "MONTHLY" -> 3;
            case "YEARLY"  -> 1;
            default -> throw new IllegalArgumentException("잘못된 period: " + period);
        };
    }
}