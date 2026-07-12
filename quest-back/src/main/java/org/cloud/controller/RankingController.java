package org.cloud.controller;

import java.util.List;
import java.util.Map;

import org.cloud.mapper.UserMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * 글로벌 랭킹 API (SCR-09)
 * MVP: 전체 포인트 기준 랭킹 리스트만 구현
 * 필터(스탯별/국가별)는 추후 구현
 */
@RestController
@RequestMapping("/api/ranking")
@RequiredArgsConstructor
public class RankingController {

    private final UserMapper userMapper;

    /**
     * 글로벌 랭킹 조회
     * GET /api/ranking?limit=50
     * 전체 포인트 기준 내림차순, 기본 50명
     */
    @GetMapping
    public ResponseEntity<?> getRanking(
            @RequestParam(defaultValue = "50") int limit) {
        List<Map<String, Object>> ranking = userMapper.findRanking(limit);
        return ResponseEntity.ok(ranking);
    }

    /**
     * 내 순위 조회
     * GET /api/ranking/me/{userId}
     */
    @GetMapping("/me/{userId}")
    public ResponseEntity<?> getMyRank(@PathVariable Long userId) {
        Map<String, Object> myRank = userMapper.findMyRank(userId);
        return ResponseEntity.ok(myRank);
    }
}