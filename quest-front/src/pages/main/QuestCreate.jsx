import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./QuestCreate.css";

const TEMPLATES = [
  {
    title: "물 2L 마시기",
    statType: "STR",
    xpSize: "SMALL",
    verifyType: "CHECK",
    period: "DAILY",
  },
  {
    title: "헬스 1시간",
    statType: "STR",
    xpSize: "LARGE",
    verifyType: "CHECK",
    period: "DAILY",
  },
  {
    title: "수면 7시간",
    statType: "STR",
    xpSize: "SMALL",
    verifyType: "CHECK",
    period: "DAILY",
  },
  {
    title: "독서 30분",
    statType: "INT",
    xpSize: "SMALL",
    verifyType: "CHECK",
    period: "DAILY",
  },
  {
    title: "공부 2시간",
    statType: "INT",
    xpSize: "MEDIUM",
    verifyType: "CHECK",
    period: "DAILY",
  },
  {
    title: "취미 활동 1시간",
    statType: "VIT",
    xpSize: "MEDIUM",
    verifyType: "CHECK",
    period: "DAILY",
  },
  {
    title: "산책 / 휴식",
    statType: "VIT",
    xpSize: "SMALL",
    verifyType: "CHECK",
    period: "DAILY",
  },
];

const STAT_LABELS = {
  STR: "💪 체력",
  INT: "📚 지력",
  WIL: "🔥 의지력",
  VIT: "🌿 활력",
};
const XP_LABELS = {
  SMALL: "소 (15XP)",
  MEDIUM: "중 (40XP)",
  LARGE: "대 (85XP)",
};
const PERIOD_LABELS = {
  DAILY: "☀️ 오늘",
  WEEKLY: "📅 주간",
  MONTHLY: "🌙 월간",
  YEARLY: "🏆 연간",
};

const defaultForm = {
  title: "",
  period: "DAILY",
  statType: "STR",
  xpSize: "SMALL",
  verifyType: "CHECK",
  notifyType: "BANNER",
  notifyTab: "DAILY",
  showCard: true,
  template: false,
  targetMinutes: null,
};

// 시간 선택 옵션 (분 단위)
const TIME_OPTIONS = [
  { label: "10분", value: 10 },
  { label: "30분", value: 30 },
  { label: "1시간", value: 60 },
  { label: "2시간", value: 120 },
  { label: "3시간", value: 180 },
];

const QuestCreate = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [tab, setTab] = useState("template");
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isYearly = form.period === "YEARLY";

  // 연간 선택 시 사진 인증 강제
  const handlePeriod = (p) => {
    setForm({
      ...form,
      period: p,
      notifyTab: p,
      verifyType: p === "YEARLY" ? "PHOTO" : form.verifyType,
    });
  };

  const handleTemplate = (tmpl) => {
    setForm({ ...defaultForm, ...tmpl, template: true });
    setTab("custom");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("퀘스트 제목을 입력해주세요.");
      return;
    }
    if (form.verifyType === "TIME" && !form.targetMinutes) {
      setError("목표 시간을 선택해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axiosInstance.post("/api/quests", {
        ...form,
        userId: parseInt(userId),
      });
      navigate("/main");
    } catch (err) {
      setError(err.response?.data?.message || "퀘스트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getBaseXp = (size) => ({ SMALL: 15, MEDIUM: 40, LARGE: 85 })[size];

  return (
    <div className="qc-container">
      <div className="qc-header">
        <button className="qc-back" onClick={() => navigate("/main")}>
          ← 뒤로
        </button>
        <h2>퀘스트 추가</h2>
        <div />
      </div>

      <div className="qc-tabs">
        <button
          className={`qc-tab ${tab === "template" ? "active" : ""}`}
          onClick={() => setTab("template")}
        >
          템플릿
        </button>
        <button
          className={`qc-tab ${tab === "custom" ? "active" : ""}`}
          onClick={() => setTab("custom")}
        >
          직접 입력
        </button>
      </div>

      {/* 템플릿 탭 */}
      {tab === "template" && (
        <div className="qc-template-list">
          {TEMPLATES.map((tmpl, i) => (
            <button
              key={i}
              className="qc-template-item"
              onClick={() => handleTemplate(tmpl)}
            >
              <div className="qc-template-left">
                <span
                  className={`qc-stat-badge stat-${tmpl.statType.toLowerCase()}`}
                >
                  {tmpl.statType}
                </span>
                <span className="qc-template-title">{tmpl.title}</span>
              </div>
              <span className="qc-template-xp">
                +{getBaseXp(tmpl.xpSize)} XP
              </span>
            </button>
          ))}
          <button
            className="qc-template-item custom"
            onClick={() => {
              setForm(defaultForm);
              setTab("custom");
            }}
          >
            <div className="qc-template-left">
              <span className="qc-stat-badge stat-custom">✏️</span>
              <span className="qc-template-title">직접 만들기</span>
            </div>
            <span className="qc-template-xp">›</span>
          </button>
        </div>
      )}

      {/* 직접 입력 탭 */}
      {tab === "custom" && (
        <form className="qc-form" onSubmit={handleSubmit}>
          {/* 제목 */}
          <div className="qc-field">
            <label>퀘스트 이름</label>
            <input
              type="text"
              name="title"
              maxLength={30}
              placeholder="예: 헬스 1시간"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          {/* 기간 */}
          <div className="qc-field">
            <label>기간</label>
            <div className="qc-btn-group">
              {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                <button
                  type="button"
                  key={k}
                  className={`qc-option-btn ${form.period === k ? "active" : ""} ${k === "YEARLY" ? "yearly" : ""}`}
                  onClick={() => handlePeriod(k)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* 연간 안내 배너 */}
          {isYearly && (
            <div className="qc-yearly-notice">
              <p>🏆 버킷리스트는 사진 인증 필수이며</p>
              <p>
                생성 후 <strong>7일 이후</strong>부터 완료 가능합니다.
              </p>
              <p>
                완료 시 XP <strong>3배</strong> 지급!
              </p>
            </div>
          )}

          {/* 스탯 */}
          <div className="qc-field">
            <label>연관 스탯</label>
            <div className="qc-btn-group">
              {Object.entries(STAT_LABELS).map(([k, v]) => (
                <button
                  type="button"
                  key={k}
                  className={`qc-option-btn ${form.statType === k ? "active" : ""}`}
                  onClick={() => setForm({ ...form, statType: k })}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* 난이도 */}
          <div className="qc-field">
            <label>난이도 (XP){isYearly && " × 3배"}</label>
            <div className="qc-btn-group">
              {Object.entries(XP_LABELS).map(([k, v]) => (
                <button
                  type="button"
                  key={k}
                  className={`qc-option-btn ${form.xpSize === k ? "active" : ""}`}
                  onClick={() => setForm({ ...form, xpSize: k })}
                >
                  {isYearly
                    ? v
                        .replace("15XP", "45XP")
                        .replace("40XP", "120XP")
                        .replace("85XP", "255XP")
                    : v}
                </button>
              ))}
            </div>
          </div>

          {/* 인증 방식 - 연간은 사진 고정 */}
          <div className="qc-field">
            <label>인증 방식</label>
            <div className="qc-btn-group">
              {[
                ["CHECK", "✓ 체크"],
                ["TIME", "⏱ 시간"],
                ["PHOTO", "📷 사진"],
              ].map(([k, v]) => (
                <button
                  type="button"
                  key={k}
                  className={`qc-option-btn ${form.verifyType === k ? "active" : ""}`}
                  onClick={() =>
                    !isYearly && setForm({ ...form, verifyType: k })
                  }
                  disabled={isYearly && k !== "PHOTO"}
                  style={{ opacity: isYearly && k !== "PHOTO" ? 0.3 : 1 }}
                >
                  {v}
                </button>
              ))}
            </div>
            {isYearly && (
              <p className="qc-field-hint">
                버킷리스트는 사진 인증만 가능합니다
              </p>
            )}
          </div>

          {/* 시간 선택 - TIME 방식일 때만 표시 */}
          {form.verifyType === "TIME" && (
            <div className="qc-field">
              <label>목표 시간</label>
              <div className="qc-btn-group">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`qc-option-btn ${form.targetMinutes === opt.value ? "active" : ""}`}
                    onClick={() =>
                      setForm({
                        ...form,
                        targetMinutes: opt.value,
                        customTime: "",
                      })
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* 직접 입력 */}
              <div className="qc-time-custom">
                <span className="qc-time-custom-label">직접 입력</span>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  placeholder="분 단위 (최대 1440)"
                  value={form.customTime || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    const capped = val > 1440 ? 1440 : val;
                    setForm({
                      ...form,
                      customTime: capped || "",
                      targetMinutes: capped > 0 ? capped : null,
                    });
                  }}
                  className="qc-time-custom-input"
                />
                <span className="qc-time-custom-unit">분</span>
              </div>
              <p className="qc-field-hint">
                💡 60 = 1시간 · 90 = 1시간 30분 · 최대 1440 (24시간)
              </p>
              {!form.targetMinutes && (
                <p className="qc-field-hint">
                  목표 시간을 선택하거나 직접 입력해주세요
                </p>
              )}
              {form.targetMinutes && (
                <p className="qc-field-hint" style={{ color: "#f0c040" }}>
                  목표:{" "}
                  {form.targetMinutes >= 60
                    ? `${Math.floor(form.targetMinutes / 60)}시간 ${form.targetMinutes % 60 > 0 ? (form.targetMinutes % 60) + "분" : ""}`
                    : `${form.targetMinutes}분`}
                </p>
              )}
            </div>
          )}

          {/* 알림 */}
          <div className="qc-field">
            <label>알림</label>
            <div className="qc-btn-group">
              {[
                ["NONE", "없음"],
                ["BANNER", "배너"],
                ["FULLSCREEN", "전체화면"],
              ].map(([k, v]) => (
                <button
                  type="button"
                  key={k}
                  className={`qc-option-btn ${form.notifyType === k ? "active" : ""}`}
                  onClick={() => setForm({ ...form, notifyType: k })}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="qc-error">{error}</p>}

          <button type="submit" className="qc-submit" disabled={loading}>
            {loading ? "저장 중..." : "퀘스트 추가하기"}
          </button>
        </form>
      )}
    </div>
  );
};

export default QuestCreate;
