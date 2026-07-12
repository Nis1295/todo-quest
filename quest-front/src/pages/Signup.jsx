import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/Signup.css";

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // 기존 구조 상태 유지
  const [form, setForm] = useState({
    nickname: "",
    birthYear: "",
    mbti: "",
    chronotype: "MORNING",
    mainStat: "STR",
    email: "",
    password: ""
  });

  const STAT_OPTIONS = [
    { id: "STR", name: "힘 (STR)", icon: "⚔️", desc: "육체 활동 중심" },
    { id: "INT", name: "지능 (INT)", icon: "🔮", desc: "학업 및 생산성" },
    { id: "WIL", name: "의지 (WIL)", icon: "🛡️", desc: "멘탈 케어 및 습관" },
    { id: "VIT", name: "활력 (VIT)", icon: "❤️", desc: "수면 및 건강 관리" }
  ];

  // 회원가입 전송 핸들러 (POST /api/auth/signup)
  const submit = async () => {
    try {
      // 명세서 규격에 맞춰 필요한 정보 가공 후 요청 보냄
      const payload = {
        ...form,
        mbti: form.mbti || null // 공백일 시 null 처리
      };

      await axiosInstance.post("/api/auth/signup", payload);
      alert("회원가입 완료");
      navigate("/login"); // 성공 시 /login 이동 명세 준수
    } catch (e) {
      alert("회원가입 실패");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-header">
          <h2 className="signup-title">QUEST 온보딩</h2>
          <p className="signup-step-indicator">단계: {step} / 2</p>
        </div>

        {/* STEP 1: 온보딩 입력 구간 */}
        {step === 1 && (
          <div className="form-group">
            <input
              className="signup-input"
              placeholder="닉네임 입력"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            />
            <input
              className="signup-input"
              type="number"
              placeholder="출생연도 입력 (예: 1998)"
              value={form.birthYear}
              onChange={(e) => setForm({ ...form, birthYear: e.target.value })}
            />
            <select
              className="signup-select"
              value={form.mbti}
              onChange={(e) => setForm({ ...form, mbti: e.target.value })}
            >
              <option value="">MBTI 선택 (선택사항)</option>
              {[
                "ISTJ",
                "ISFJ",
                "INFJ",
                "INTJ",
                "ISTP",
                "ISFP",
                "INFP",
                "INTP",
                "ESTP",
                "ESFP",
                "ENFP",
                "ENTP",
                "ESTJ",
                "ESFJ",
                "ENFJ",
                "ENTJ"
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <label className="signup-label">크로노타입 선택</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="chronotype"
                  value="MORNING"
                  checked={form.chronotype === "MORNING"}
                  onChange={(e) =>
                    setForm({ ...form, chronotype: e.target.value })
                  }
                />
                아침형
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="chronotype"
                  value="NIGHT"
                  checked={form.chronotype === "NIGHT"}
                  onChange={(e) =>
                    setForm({ ...form, chronotype: e.target.value })
                  }
                />
                저녁형
              </label>
            </div>

            <label className="signup-label">메인 스탯 선택</label>
            <div className="stat-grid">
              {STAT_OPTIONS.map((stat) => (
                <div
                  key={stat.id}
                  className={`stat-card ${stat.id} ${form.mainStat === stat.id ? "active" : ""}`}
                  onClick={() => setForm({ ...form, mainStat: stat.id })}
                >
                  <span className="stat-icon">{stat.icon}</span>
                  <span className="stat-name">{stat.name}</span>
                  <span className="stat-desc">{stat.desc}</span>
                </div>
              ))}
            </div>

            <button className="signup-button" onClick={() => setStep(2)}>
              다음 단계로
            </button>
          </div>
        )}

        {/* STEP 2: 계정 생성 구간 */}
        {step === 2 && (
          <div className="form-group">
            <input
              className="signup-input"
              type="email"
              placeholder="이메일 주소 입력"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="signup-input"
              type="password"
              placeholder="비밀번호 설정"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <div className="button-group">
              <button
                className="signup-button secondary"
                onClick={() => setStep(1)}
              >
                이전으로
              </button>
              <button className="signup-button" onClick={submit}>
                계정 생성 및 완료
              </button>
            </div>
          </div>
        )}

        <div className="login-link-box">
          이미 계정이 있으신가요?
          <Link className="login-link" to="/login">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
