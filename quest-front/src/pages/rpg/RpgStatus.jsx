import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/RpgStatus.css";

// 화면에 노출할 4대 필수 스탯 정의
const REQUIRED_STATS = [
  { key: "str", kr: "체력", en: "STR", icon: "💪" },
  { key: "int", kr: "지력", en: "INT", icon: "🔮" },
  { key: "wil", kr: "의지력", en: "WIL", icon: "🧠" },
  { key: "vit", kr: "활력", en: "VIT", icon: "❤️" },
];

const STAT_THEME_COLORS = {
  STR: "#e74c3c", // 레드
  INT: "#3498db", // 블루
  WIL: "#885cf6", // 퍼플
  VIT: "#2ecc71", // 그린
};

// 불꽃 파티클 이펙트 (내 작업물)
const FlameEffect = ({ color, tier }) => {
  if (tier === "none") return null;

  const count = tier === "low" ? 4 : tier === "mid" ? 8 : 14;
  const particles = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="flame-wrap">
      {particles.map((i) => {
        const left = 15 + (i / count) * 70 + Math.random() * 10;
        const delay = (i * 0.15) % 1.2;
        const duration = tier === "low" ? 1.8 : tier === "mid" ? 1.3 : 0.9;
        const size = tier === "low" ? 6 : tier === "mid" ? 10 : 14;
        return (
          <div
            key={i}
            className={`flame-particle flame-${tier}`}
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              width: `${size}px`,
              height: `${size * 1.6}px`,
              background: `radial-gradient(ellipse at 50% 80%, ${color}, transparent)`,
              boxShadow: `0 0 6px 2px ${color}88`,
            }}
          />
        );
      })}
    </div>
  );
};

export default function RpgStatus() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({});
  const [questSummary, setQuestSummary] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    limited: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeDetail, setActiveDetail] = useState(null); // 상세 팝업 스탯 (내 작업물)

  const userId = localStorage.getItem("userId");
  const mainStat = localStorage.getItem("mainStat") || "STR";
  const nickname = localStorage.getItem("nickname") || "test";

  useEffect(() => {
    if (userId) {
      loadAllRpgData();
    }
  }, [userId]);

  const loadAllRpgData = async () => {
    try {
      setLoading(true);
      const [statsRes, questLogsRes] = await Promise.all([
        axiosInstance.get(`/api/stats/${userId}`),
        axiosInstance
          .get(`/api/quests/${userId}/logs`)
          .catch(() => ({ data: null })),
      ]);

      const statsData = statsRes.data?.data || statsRes.data || {};
      setStats(statsData);

      if (questLogsRes && questLogsRes.data) {
        setQuestSummary({
          daily: questLogsRes.data.dailyCount || 0,
          weekly: questLogsRes.data.weeklyCount || 0,
          monthly: questLogsRes.data.monthlyCount || 0,
          limited: questLogsRes.data.limitedCount || 0,
        });
      }
    } catch (err) {
      console.error("API 로드 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNickname = async () => {
    const newNickname = prompt("새로운 닉네임을 입력하세요:", nickname);
    if (!newNickname) return;

    try {
      await axiosInstance.put(`/api/auth/profile/${userId}`, {
        nickname: newNickname,
      });
      localStorage.setItem("nickname", newNickname);
      alert("닉네임 변경 성공!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("변경 실패");
    }
  };

  // 불꽃 이펙트 티어 계산 — 메인스탯 레벨 기준 (내 작업물)
  const getEffectTier = () => {
    const level =
      stats[mainStat.toLowerCase()]?.level ||
      stats[mainStat.toUpperCase()]?.level ||
      0;
    if (level <= 1) return "none";
    if (level <= 20) return "low";
    if (level <= 50) return "mid";
    return "high";
  };

  const currentTier = getEffectTier();
  const themeColor = STAT_THEME_COLORS[mainStat.toUpperCase()] || "#3498db";

  if (loading) {
    return <div className="rpg-container">데이터 동기화 중...</div>;
  }

  return (
    <div className="rpg-container">
      <div className="rpg-card">
        {/* 상단 헤더 네비 */}
        <div className="rpg-header">
          <button className="back-btn" onClick={() => navigate("/main")}>
            ← 뒤로
          </button>
          <div className="header-title">⚔️ RPG 상태창</div>
          <div style={{ width: "24px" }} />
        </div>

        {/* 유저 프로필 정보 */}
        <div className="profile-section">
          <div className="user-info">
            <div className="user-lv">Lv.{stats.mainLevel ?? "?"}</div>
            <div
              className="user-title"
              onClick={handleUpdateNickname}
              style={{ cursor: "pointer" }}
            >
              {nickname} ✏️
            </div>
          </div>
          <div className="user-points">
            <span>🔥</span> {stats.totalPoint?.toLocaleString() ?? 0} pt
          </div>
        </div>

        {/* 중앙 대표 엠블럼 원 + 불꽃 파티클 이펙트 */}
        <div className="avatar-center-wrapper">
          <div
            className={`avatar-glow-circle glow-${currentTier}`}
            style={{
              position: "relative",
              borderColor: themeColor,
              boxShadow:
                currentTier !== "none"
                  ? `0 0 30px ${themeColor}, inset 0 0 15px ${themeColor}`
                  : "none",
            }}
          >
            <FlameEffect color={themeColor} tier={currentTier} />
            {localStorage.getItem("profileImage") || stats.profileImage ? (
              <img
                src={localStorage.getItem("profileImage") || stats.profileImage}
                alt="아바타"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                  position: "relative",
                  zIndex: 1,
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <span style={{ position: "relative", zIndex: 1 }}>⚔️</span>
            )}
          </div>
        </div>

        {/* 태그 필터 */}
        <div className="tag-filter-container">
          <span className="status-tag active">필수</span>
          <span className="status-tag">나의기록</span>
          <span className="status-tag">가이드북</span>
          <span className="status-tag">투자 현황</span>
          <span className="status-tag">히스토리</span>
        </div>

        {/* 스탯 리스트 출력 구역 */}
        <div className="scrolling-stat-list">
          {REQUIRED_STATS.map((stat) => {
            const serverStatObj =
              stats[stat.key] ||
              stats[stat.en] ||
              stats[stat.en.toUpperCase()] ||
              {};
            const currentLevel = serverStatObj.level || 0;
            const currentExp = serverStatObj.exp || 0;
            const requiredExp = serverStatObj.requiredExp || 1;

            const isMain = stat.en === mainStat.toUpperCase();
            const percentage = Math.min((currentExp / requiredExp) * 100, 100);

            return (
              <div key={stat.key} className="stat-card-item">
                <div className="stat-card-top">
                  <div className="stat-card-meta">
                    <span className="stat-icon">{stat.icon}</span>
                    <span className="stat-name-kr">
                      {stat.kr}
                      <span className="stat-name-en">({stat.en})</span>
                    </span>
                  </div>
                  <div className="stat-card-right">
                    <span className="stat-level-text">Lv.{currentLevel}</span>
                    <button
                      className="detail-view-btn"
                      onClick={() => setActiveDetail(stat.en)}
                    >
                      상세 →
                    </button>
                  </div>
                </div>

                <div className="stat-card-bottom">
                  <div className="gauge-track">
                    <div
                      className="gauge-fill"
                      style={{
                        width: `${percentage || 2}%`,
                        backgroundColor: isMain ? themeColor : "#4a5568",
                      }}
                    />
                  </div>
                  <div className="gauge-numerical-row">
                    {currentExp} / {requiredExp} XP
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 퀘스트 현황 보드 */}
        <div className="quest-summary-block">
          <div className="quest-block-title">퀘스트 성공 현황</div>
          <div className="quest-grid-row">
            <div className="quest-grid-item">
              <span className="quest-icon-wrap">🟡</span>
              <span className="quest-type-label">일간</span>
              <span className="quest-count-value">{questSummary.daily}개</span>
            </div>
            <div className="quest-grid-item">
              <span className="quest-icon-wrap">🩵</span>
              <span className="quest-type-label">주간</span>
              <span className="quest-count-value">{questSummary.weekly}개</span>
            </div>
            <div className="quest-grid-item">
              <span className="quest-icon-wrap">🌙</span>
              <span className="quest-type-label">월간</span>
              <span className="quest-count-value">
                {questSummary.monthly}개
              </span>
            </div>
            <div className="quest-grid-item">
              <span className="quest-icon-wrap">🏆</span>
              <span className="quest-type-label">한정</span>
              <span className="quest-count-value">
                {questSummary.limited}개
              </span>
            </div>
          </div>
        </div>
        <div className="quest-pad"></div>
      </div>

      {/* 상세 팝업 (내 작업물 — 다음등급/디버프 포함) */}
      {activeDetail &&
        (() => {
          const key = activeDetail.toLowerCase();
          const s = stats[key] || stats[activeDetail] || {};
          const color = STAT_THEME_COLORS[activeDetail];
          const statMeta = REQUIRED_STATS.find((r) => r.en === activeDetail);
          const pct = s.requiredExp
            ? Math.min((s.exp / s.requiredExp) * 100, 100)
            : 0;
          return (
            <div
              className="rpg-popup-overlay"
              onClick={() => setActiveDetail(null)}
            >
              <div className="rpg-popup" onClick={(e) => e.stopPropagation()}>
                <div className="rpg-popup-header">
                  <span>
                    {statMeta?.icon} {statMeta?.kr}
                  </span>
                  <button onClick={() => setActiveDetail(null)}>✕</button>
                </div>
                <div className="rpg-popup-body">
                  <p className="rpg-popup-grade">{s.grade}</p>
                  <p className="rpg-popup-level">Lv.{s.level}</p>
                  <div className="rpg-popup-bar-wrap">
                    <div className="rpg-popup-bar">
                      <div
                        className="rpg-popup-bar-fill"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <p className="rpg-popup-exp">
                      {s.exp} / {s.requiredExp} XP
                    </p>
                  </div>
                  <div className="rpg-popup-daily">
                    <span>오늘 XP</span>
                    <span>
                      {s.dailyExp} / {s.dailyLimit} XP
                    </span>
                  </div>
                  {s.nextGradeLevel !== -1 && (
                    <div className="rpg-popup-next-grade">
                      <span>다음 등급</span>
                      <span>
                        {s.nextGrade} (Lv.{s.nextGradeLevel} 달성 시)
                      </span>
                    </div>
                  )}
                  {s.debuffs?.length > 0 && (
                    <div className="rpg-popup-debuffs">
                      <p className="rpg-popup-debuffs-title">
                        ⚠️ 발생 가능한 디버프
                      </p>
                      {s.debuffs.map((d, i) => (
                        <div key={i} className="rpg-popup-debuff-item">
                          <div className="rpg-popup-debuff-name">{d.name}</div>
                          <div className="rpg-popup-debuff-row">
                            <span className="rpg-popup-debuff-label">발동</span>
                            <span>{d.condition}</span>
                          </div>
                          <div className="rpg-popup-debuff-row">
                            <span className="rpg-popup-debuff-label">효과</span>
                            <span className="rpg-popup-debuff-effect">
                              {d.effect}
                            </span>
                          </div>
                          <div className="rpg-popup-debuff-row">
                            <span className="rpg-popup-debuff-label">해제</span>
                            <span>{d.release}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      <footer className="bottom-nav">
        <button className="nav-item" onClick={() => navigate("/profile")}>
          👤 캐릭터
        </button>
        <button className="nav-item active" onClick={() => navigate("/rpg")}>
          📊 RPG스탯창
        </button>
        <button className="nav-item" onClick={() => navigate("/main")}>
          🏠 홈
        </button>
        <button className="nav-item" onClick={() => navigate("/ranking")}>
          🏆 랭킹
        </button>
      </footer>
    </div>
  );
}
