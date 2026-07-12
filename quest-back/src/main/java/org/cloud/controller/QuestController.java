package org.cloud.controller;

import java.util.List;
import java.util.Map;

import org.cloud.domain.Quest;
import org.cloud.service.BuffService;
import org.cloud.service.QuestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * 퀘스트 관련 HTTP 요청을 처리하는 REST 컨트롤러
 * 퀘스트 생성, 조회, 완료 인증 API 제공
 */
@RestController
@RequestMapping("/api/quests")
@RequiredArgsConstructor
public class QuestController {

    private final QuestService questService;
    private final BuffService buffService;
   
    @PostMapping
    public ResponseEntity<?> createQuest(@RequestBody Quest quest) {

        questService.createQuest(quest);

        return ResponseEntity.ok(
                Map.of("message", "퀘스트 생성 완료", "questId", quest.getQuestId())
        );
    }
     /**
     * 기간별 퀘스트 목록 조회 API
     * GET /api/quests/{userId}?period=DAILY
     * period: DAILY, WEEKLY, MONTHLY, YEARLY
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<Quest>> getQuests(
            @PathVariable Long userId,
            @RequestParam String period) {
        List<Quest> quests = questService.getQuestsByPeriod(userId, period);
        return ResponseEntity.ok(quests);
    }

    /**
     * 퀘스트 완료 인증 API
     * POST /api/quests/{questId}/complete
     * Body: { userId, verifyType, photoUrl(optional), elapsedSec(optional) }
     *
     * statLevel, streakDays는 서버가 DB에서 직접 계산하므로 클라이언트 전송 불필요
     * 상한 초과 시: earnedXp=0, cappedOut=true 반환
     */
    @PostMapping("/{questId}/complete")
    public ResponseEntity<?> completeQuest(
            @PathVariable Long questId,
            @RequestBody Map<String, Object> body) {

        Long userId     = Long.valueOf(body.get("userId").toString());
        String verifyType = (String) body.get("verifyType");
        String photoUrl   = (String) body.getOrDefault("photoUrl", null);
        int elapsedSec    = (int) body.getOrDefault("elapsedSec", 0);

        int earnedXp = questService.completeQuest(userId, questId, verifyType, photoUrl, elapsedSec);

        // earnedXp=0이면 상한 도달 메시지 함께 반환
        boolean cappedOut = (earnedXp == 0);
        String message = cappedOut ? "오늘 XP 상한 도달 — 완료는 기록됩니다" : "퀘스트 완료!";

        return ResponseEntity.ok(Map.of(
                "message",   message,
                "earnedXp",  earnedXp,
                "cappedOut", cappedOut
        ));
    }

    /**
     * 퀘스트 삭제 API (soft delete)
     * DELETE /api/quests/{questId}
     */
    @DeleteMapping("/{questId}")
    public ResponseEntity<?> deleteQuest(@PathVariable Long questId) {
        questService.deactivateQuest(questId);
        return ResponseEntity.ok(Map.of("message", "퀘스트 삭제 완료"));
    }
    
    /**
     * 퀘스트 하루 연장 API
     * POST /api/quests/{questId}/extend
     * Body: { userId }
     */
    @PostMapping("/{questId}/extend")
    public ResponseEntity<?> extendQuest(@PathVariable Long questId) {
        try {
            questService.extendQuest(questId);
            return ResponseEntity.ok(Map.of("message", "퀘스트 연장 완료"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
    
    /**
     * 내 템플릿 목록 조회
     * GET /api/quests/{userId}/templates
     */
    @GetMapping("/{userId}/templates")
    public ResponseEntity<List<Quest>> getTemplates(@PathVariable Long userId) {
        List<Quest> templates = questService.getTemplates(userId);
        return ResponseEntity.ok(templates);
    }
    
    /**
     * 활동 기록 조회
     * GET /api/quests/{userId}/logs
     */
    @GetMapping("/{userId}/logs")
    public ResponseEntity<?> getLogs(@PathVariable Long userId) {
        List<Map<String, Object>> logs = questService.getLogs(userId);
        return ResponseEntity.ok(logs);
    }

    /**
     * 디버프 해제미션(PHOTO 인증 퀘스트) 지정 API
     * POST /api/quests/buffs/{buffId}/link
     * Body: { questId }
     */
    @PostMapping("/buffs/{buffId}/link")
    public ResponseEntity<?> linkReleaseQuest(
            @PathVariable Long buffId,
            @RequestBody Map<String, Object> body) {
        try {
            Long questId = Long.valueOf(body.get("questId").toString());
            buffService.linkReleaseQuest(buffId, questId);
            return ResponseEntity.ok(Map.of("message", "해제미션 지정 완료"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}