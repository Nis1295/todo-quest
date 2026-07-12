package org.cloud.controller;

import java.util.Map;

import org.cloud.domain.User;
import org.cloud.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * 회원 관련 HTTP 요청을 처리하는 REST 컨트롤러
 * 회원가입, 로그인 API 제공
 */
@RestController // JSON 응답을 반환하는 REST 컨트롤러
@RequestMapping("/api/auth") // 기본 URL 경로
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 회원가입 API
     * POST /api/auth/signup
     * Body: { email, password, nickname, birthYear, mbti, chronotype }
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        try {
            userService.signup(user);
            return ResponseEntity.ok(Map.of("message", "회원가입 성공"));
        } catch (IllegalArgumentException e) {
            // 이메일 중복 등 유효성 오류
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 로그인 API
     * POST /api/auth/login
     * Body: { email, password }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            User user = userService.login(body.get("email"), body.get("password"));
            // 비밀번호는 응답에서 제외
            user.setPassword(null);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
    
    /**
     * 프로필 수정 API
     * PUT /api/auth/profile/{userId}
     * Body: { nickname, mbti, chronotype, mainStat, likes, dislikes, goal, profileImage }
     */
    @PutMapping("/profile/{userId}")
    public ResponseEntity<?> updateProfile(
            @PathVariable Long userId,
            @RequestBody User user) {
        try {
            user.setUserId(userId);
            userService.updateProfile(user);
            return ResponseEntity.ok(Map.of("message", "프로필 수정 완료"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * 비밀번호 변경 API
     * PUT /api/auth/password/{userId}
     * Body: { currentPassword, newPassword }
     */
    @PutMapping("/password/{userId}")
    public ResponseEntity<?> updatePassword(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body) {
        try {
            userService.updatePassword(userId, body.get("currentPassword"), body.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "비밀번호 변경 완료"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
    
    
    
}