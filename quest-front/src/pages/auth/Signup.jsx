import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./Auth.css";

// 온보딩 + 회원가입을 한 화면에서 처리 (SCR-02 + SCR-03 통합)
const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: 온보딩, 2: 계정 생성
  const [form, setForm] = useState({
    nickname: "",
    birthYear: "",
    mbti: "",
    chronotype: "MORNING",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.nickname || !form.birthYear) {
      setError("닉네임과 생년을 입력해주세요.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      await axiosInstance.post("/api/auth/signup", {
        nickname: form.nickname,
        birthYear: parseInt(form.birthYear),
        mbti: form.mbti,
        chronotype: form.chronotype,
        email: form.email,
        password: form.password,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "회원가입에 실패했습니다.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-logo">⚔️ QUEST</h1>

        {step === 1 ? (
          <>
            <p className="auth-sub">캐릭터 정보를 입력해주세요</p>
            <form onSubmit={handleNext} className="auth-form">
              <input
                type="text"
                name="nickname"
                placeholder="닉네임"
                value={form.nickname}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="birthYear"
                placeholder="출생연도 (예: 1999)"
                value={form.birthYear}
                onChange={handleChange}
                min="1900"
                max="2020"
                required
              />
              <select name="mbti" value={form.mbti} onChange={handleChange}>
                <option value="">MBTI 선택 (선택)</option>
                {[
                  "INTJ",
                  "INTP",
                  "ENTJ",
                  "ENTP",
                  "INFJ",
                  "INFP",
                  "ENFJ",
                  "ENFP",
                  "ISTJ",
                  "ISFJ",
                  "ESTJ",
                  "ESFJ",
                  "ISTP",
                  "ISFP",
                  "ESTP",
                  "ESFP",
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="auth-radio-group">
                <label>
                  <input
                    type="radio"
                    name="chronotype"
                    value="MORNING"
                    checked={form.chronotype === "MORNING"}
                    onChange={handleChange}
                  />
                  아침형
                </label>
                <label>
                  <input
                    type="radio"
                    name="chronotype"
                    value="EVENING"
                    checked={form.chronotype === "EVENING"}
                    onChange={handleChange}
                  />
                  저녁형
                </label>
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-btn">
                다음
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-sub">계정을 만들어주세요</p>
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
              <input
                type="password"
                name="passwordConfirm"
                placeholder="비밀번호 확인"
                value={form.passwordConfirm}
                onChange={handleChange}
                required
              />
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-btn">
                가입하기
              </button>
              <button
                type="button"
                className="auth-btn-secondary"
                onClick={() => setStep(1)}
              >
                이전
              </button>
            </form>
          </>
        )}

        <p className="auth-link">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
