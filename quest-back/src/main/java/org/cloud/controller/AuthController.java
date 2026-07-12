package org.cloud.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  @PostMapping("/guest")
  public ResponseEntity<?> guestLogin(HttpSession session) {
    // 1. 임시 게스트 유저 아이디 생성 (PageController의 Long 타입에 맞게 숫자로 생성)
    Long guestId = (long) (Math.random() * 1000000) + 99000000L;

    // 2. ⚠️ 핵심: PageController가 검사하는 "LOGIN_USER"라는 이름으로 세션에 저장합니다.
    // 이렇게 하면 PageController가 로그인된 유저로 인식하여 정상 통과시킵니다.
    session.setAttribute("LOGIN_USER", guestId);

    // 3. 리액트 res.data.userId 명칭 구조에 맞게 데이터 리턴
    Map<String, Object> response = new HashMap<>();
    response.put("message", "게스트 로그인 성공");
    response.put("userId", guestId.toString()); // Main.jsx에서 사용할 userId 제공

    return ResponseEntity.ok(response);
  }
}
