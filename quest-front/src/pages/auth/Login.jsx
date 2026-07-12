import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 일반 로그인
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/auth/login", form);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("nickname", res.data.nickname);
      localStorage.setItem("isGuest", "false");
      navigate("/main");
    } catch (err) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 게스트로 시작하기
  // 랜덤 이메일로 자동 회원가입 후 로그인
  const handleGuest = async () => {
    setError("");
    setLoading(true);
    try {
      const rand = Math.random().toString(36).substring(2, 10);
      const email = `guest_${rand}@quest.app`;
      const password = rand;

      // 게스트 계정 자동 생성
      await axiosInstance.post("/api/auth/signup", {
        email,
        password,
        nickname: `모험가_${rand.substring(0, 4)}`,
        birthYear: 2000,
        mbti: "",
        chronotype: "MORNING",
      });

      // 자동 로그인
      const res = await axiosInstance.post("/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("nickname", res.data.nickname);
      localStorage.setItem("isGuest", "true"); // 게스트 여부 표시
      localStorage.setItem("guestEmail", email);
      localStorage.setItem("guestPassword", password);
      navigate("/main");
    } catch (err) {
      setError("게스트 시작에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-logo">⚔️ QUEST</h1>
        <p className="auth-sub">나라는 캐릭터를 현실에서 키운다</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            name="email"
            placeholder="이메일"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={handleChange}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 구분선 */}
        <div className="auth-divider">
          <span>또는</span>
        </div>

        {/* 게스트 시작 버튼 */}
        <button
          className="auth-btn-guest"
          onClick={handleGuest}
          disabled={loading}
        >
          {loading ? "준비 중..." : "🗡️ 게스트로 시작하기"}
        </button>

        <p className="auth-guest-notice">
          계정 없이 바로 시작 · 나중에 계정 연동 가능
        </p>

        <p className="auth-link">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
