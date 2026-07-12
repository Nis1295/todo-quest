package org.cloud.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

  @GetMapping("/login")
  public String login(
      HttpSession session,
      HttpServletRequest request) {

    // 이미 로그인 상태
    if (session.getAttribute("LOGIN_USER") != null) {
      return "redirect:/main";
    }

    // 자동 로그인 쿠키 확인
    Cookie[] cookies = request.getCookies();

    if (cookies != null) {

      for (Cookie cookie : cookies) {

        if ("AUTO_LOGIN".equals(cookie.getName())) {

          Long userId = Long.parseLong(cookie.getValue());

          session.setAttribute(
              "LOGIN_USER",
              userId);

          return "redirect:/main";
        }
      }
    }

    return "forward:/login.html";
  }

  @GetMapping("/main")
  public String main(
      HttpSession session,
      HttpServletRequest request) {

    // 세션 존재
    if (session.getAttribute("LOGIN_USER") != null) {
      return "forward:/index.html";
    }

    // 자동 로그인 쿠키 확인
    Cookie[] cookies = request.getCookies();

    if (cookies != null) {

      for (Cookie cookie : cookies) {

        if ("AUTO_LOGIN".equals(cookie.getName())) {

          Long userId = Long.parseLong(cookie.getValue());

          session.setAttribute(
              "LOGIN_USER",
              userId);

          return "forward:/index.html";
        }
      }
    }

    return "redirect:/login";
  }
}