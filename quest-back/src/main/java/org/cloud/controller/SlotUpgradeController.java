package org.cloud.controller;

import org.cloud.service.SlotUpgradeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.util.Map;

@RestController
@RequestMapping("/api/slots")
@RequiredArgsConstructor
public class SlotUpgradeController {

    private final SlotUpgradeService slotUpgradeService;

    /** 슬롯 확장 (포인트 구매) */
    @PostMapping("/upgrade")
    public ResponseEntity<?> upgradeSlot(@RequestBody Map<String, Object> body) {
        try {
            Long userId   = Long.valueOf(body.get("userId").toString());
            String period = (String) body.get("period");
            int newSlotCount = slotUpgradeService.upgradeSlot(userId, period);
            return ResponseEntity.ok(Map.of(
                "message", "슬롯 확장 성공!", "period", period, "newSlotCount", newSlotCount
            ));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 광고 시청 → YEARLY 임시 슬롯 +1 (24시간, 1년 1회)
     * POST /api/slots/ad-reward
     */
    @PostMapping("/ad-reward")
    public ResponseEntity<?> watchAd(@RequestBody Map<String, Object> body) {
        try {
            Long userId = Long.valueOf(body.get("userId").toString());
            Map<String, Object> result = slotUpgradeService.watchAdForSlot(userId);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 광고 슬롯 상태 조회
     * GET /api/slots/ad-status/{userId}
     */
    @GetMapping("/ad-status/{userId}")
    public ResponseEntity<?> getAdStatus(@PathVariable Long userId) {
        return ResponseEntity.ok(slotUpgradeService.getAdSlotStatus(userId));
    }

    /** 슬롯 현황 조회 */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getSlotInfo(
            @PathVariable Long userId,
            @RequestParam String period) {
        int currentSlot = slotUpgradeService.getCurrentSlot(userId, period);
        int nextCost    = slotUpgradeService.getNextUpgradeCost(userId, period);
        String nextCostMsg = (nextCost == -1) ? "최대 슬롯 도달" : nextCost + " 포인트";
        return ResponseEntity.ok(Map.of(
            "period", period, "currentSlot", currentSlot, "nextCost", nextCostMsg
        ));
    }
}