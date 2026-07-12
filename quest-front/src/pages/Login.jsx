import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 1. 일반 로그인 (POST /api/auth/login)
  const login = async () => {
    try {
      const res = await axiosInstance.post("/api/auth/login", {
        email,
        password
      });

      // 백엔드 반환 Key 카멜/스네이크 케이스 전면 방어 가딩
      const userId = res.data.userId || res.data.user_id;
      const nickname = res.data.nickname || "test";
      const mainStat = res.data.mainStat || res.data.stat_type || "STR";
      const birthYear = res.data.birthYear || res.data.birth_year || "2001";
      const totalPoint = res.data.totalPoint || res.data.total_point || "576";

      // 🌟 [핵심 교정] 로그인 성공 시 백엔드 DB에 박혀있던 개인취향/MBTI 원본 데이터를 통째로 수집 세팅 ⭐
      const mbti = res.data.mbti || "선택 안함";
      const likes = res.data.likes || "";
      const dislikes = res.data.dislikes || "";
      const goal = res.data.goal || "";

      // 로컬스토리지 영구 적재로 세션 동기화 라인 구축
      localStorage.setItem("userId", String(userId));
      localStorage.setItem("nickname", String(nickname));
      localStorage.setItem("mainStat", String(mainStat));
      localStorage.setItem("birthYear", String(birthYear));
      localStorage.setItem("totalPoint", String(totalPoint));
      localStorage.setItem("isGuest", "false");

      // 🎯 취향 세션 기억장치 가동 완료
      localStorage.setItem("userMbti", String(mbti));
      localStorage.setItem("userLikes", String(likes));
      localStorage.setItem("userDislikes", String(dislikes));
      localStorage.setItem("userGoal", String(goal));

      if (res.data.profileImage || res.data.profile_image) {
        localStorage.setItem(
          "profileImage",
          res.data.profileImage || res.data.profile_image
        );
      }

      navigate("/main");
    } catch (err) {
      alert("로그인 실패");
    }
  };

  // 2. 게스트 로그인
  const handleGuestLogin = async () => {
    try {
      const rand4 = Math.floor(1000 + Math.random() * 9000);
      const guestNickname = `모험가${rand4}`;
      const guestEmail = `guest${Date.now()}@quest.com`;
      const guestPassword = Math.random().toString(36).substring(2, 12);
      const guestBirthYear = "2001";

      await axiosInstance.post("/api/auth/signup", {
        email: guestEmail,
        password: guestPassword,
        nickname: guestNickname,
        birthYear: guestBirthYear,
        chronotype: "MORNING",
        mainStat: "STR"
      });

      const res = await axiosInstance.post("/api/auth/login", {
        email: guestEmail,
        password: guestPassword
      });

      const userId = res.data.userId || res.data.user_id;
      const nickname = res.data.nickname || res.data.user_id || guestNickname;
      const mainStat = res.data.mainStat || res.data.stat_type || "STR";

      localStorage.setItem("userId", String(userId));
      localStorage.setItem("nickname", String(nickname));
      localStorage.setItem("mainStat", String(mainStat));
      localStorage.setItem("isGuest", "true");
      localStorage.setItem("birthYear", guestBirthYear);
      localStorage.setItem("totalPoint", "0");
      localStorage.setItem("userMbti", "선택 안함");
      localStorage.setItem("userLikes", "");
      localStorage.setItem("userDislikes", "");
      localStorage.setItem("userGoal", "");
      localStorage.setItem("guestEmail", guestEmail);
      localStorage.setItem("guestPassword", guestPassword);

      navigate("/main");
    } catch (err) {
      console.error(err);
      alert("게스트 로그인 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo-container">
          <span className="login-icon">⚔️</span>
          <h1 className="login-title">QUEST</h1>
        </div>
        <p className="login-subtitle">나만의 캐릭터를 현실에서 키우다</p>

        <div className="input-group">
          <input
            className="login-input"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="login-input"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="login-button" onClick={login}>
          로그인
        </button>
        <div className="divider">또는</div>
        <button className="guest-button" onClick={handleGuestLogin}>
          <span>✓</span> 게스트로 시작하기
        </button>
        <p className="guest-notice">
          회원 가입 없이 시작 · 나중에 계정 연동 가능
        </p>
        <div className="signup-box">
          계정이 없으신가요?
          <Link className="signup-link" to="/signup">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
