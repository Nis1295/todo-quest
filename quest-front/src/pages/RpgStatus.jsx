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

// 버프/디버프 전체 사전 — 이름으로 발동조건/효과/해제법 조회
// (백엔드 BuffService 로직과 1:1 매칭되는 설명 텍스트)
// 2026-06-18 디버프 재설계 반영: 4스탯 디버프는 매일 자정 랜덤 발동 + 사진인증 2일 연속 해제 방식으로 통일
const RELEASE_TEXT =
  "지정한 사진인증(PHOTO) 퀘스트를 2일 연속 완료하면 해제 (+보너스 XP 지급)";
const RANDOM_CONDITION = (stat) =>
  `매일 자정, ${stat} 레벨 × 0.5% 확률로 랜덤 발동`;

const BUFF_INFO = {
  "멈출 수 없는 힘": {
    type: "BUFF",
    condition: "체력(STR) 퀘스트 3일 연속 완료",
    effect: "획득 포인트 +5%",
    release: "1일 유지 (7일 연속 달성 시 2일 유지)",
  },

  "집중력 MAX": {
    type: "BUFF",
    condition: "지력(INT) 퀘스트 3일 연속 완료",
    effect: "획득 포인트 +5%",
    release: "1일 유지 (7일 연속 달성 시 2일 유지)",
  },

  "불굴의 의지": {
    type: "BUFF",
    condition: "의지력(WIL) 퀘스트 3일 연속 완료",
    effect: "획득 포인트 +5%",
    release: "1일 유지 (7일 연속 달성 시 2일 유지)",
  },

  "넘치는 생명력": {
    type: "BUFF",
    condition: "활력(VIT) 퀘스트 3일 연속 완료",
    effect: "획득 포인트 +5%",
    release: "1일 유지 (7일 연속 달성 시 2일 유지)",
  },
  // ↓↓↓ 아래 디버프들은 그대로 유지 ↓↓↓
  나태함: {
    type: "DEBUFF",
    condition: "일간 퀘스트 3일 연속 0% 달성",
    effect: "포인트 적립 -5%",
    release: "퀘스트 1개 이상 달성을 3일 연속 유지 시 해제",
  },
  // ── 4스탯 디버프 (랜덤 발동 + 사진인증 해제, 재설계됨) ──
  탈수: {
    type: "DEBUFF",
    condition: RANDOM_CONDITION("STR"),
    effect: "STR XP -10%",
    release: RELEASE_TEXT,
  },
  몸살: {
    type: "DEBUFF",
    condition: RANDOM_CONDITION("STR"),
    effect: "STR XP -10%",
    release: RELEASE_TEXT,
  },
  근육통: {
    type: "DEBUFF",
    condition: RANDOM_CONDITION("STR"),
    effect: "STR XP -10%",
    release: RELEASE_TEXT,
  },
  "지식 정체": {
    type: "DEBUFF",
    condition: RANDOM_CONDITION("INT"),
    effect: "INT XP -10%",
    release: RELEASE_TEXT,
  },
  브레인포그: {
    type: "DEBUFF",
    condition: RANDOM_CONDITION("INT"),
    effect: "INT XP -10%",
    release: RELEASE_TEXT,
  },
  피로누적: {
    type: "DEBUFF",
    condition: RANDOM_CONDITION("WIL"),
    effect: "WIL XP -10%",
    release: RELEASE_TEXT,
  },
  만성피로: {
    type: "DEBUFF",
    condition: RANDOM_CONDITION("WIL"),
    effect: "WIL XP -10%",
    release: RELEASE_TEXT,
  },
  컨디션저조: {
    type: "DEBUFF",
    condition: RANDOM_CONDITION("WIL"),
    effect: "WIL XP -10%",
    release: RELEASE_TEXT,
  },
  번아웃: {
    type: "DEBUFF",
    condition: RANDOM_CONDITION("VIT"),
    effect: "VIT XP -10%",
    release: RELEASE_TEXT,
  },
};

// 내부적으로 "피로누적_WIL"처럼 구분용 이름이 붙은 경우 화면 표시용 이름으로 정리 (레거시 호환용)
const getDisplayName = (rawName) => rawName.replace(/_WIL$/, "");

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
  const [activeDetail, setActiveDetail] = useState(null); // 상세 팝업 스탯
  const [activeBuff, setActiveBuff] = useState(null); // 버프/디버프 뱃지 클릭 시 선택된 buff 객체(전체)

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
        const logs = questLogsRes.data;
        setQuestSummary({
          daily: logs.filter((l) => l.period === "DAILY").length,
          weekly: logs.filter((l) => l.period === "WEEKLY").length,
          monthly: logs.filter((l) => l.period === "MONTHLY").length,
          limited: logs.filter((l) => l.period === "YEARLY").length,
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

  // 디버프 해제미션 만들기 — QuestCreate로 이동 (PHOTO + 해당 스탯 고정, 생성 후 자동 연결)
  const goCreateReleaseQuest = (buff) => {
    setActiveBuff(null);
    navigate("/quest/create", {
      state: {
        linkBuffId: buff.buffId,
        linkStatType: buff.statType,
      },
    });
  };

  // 불꽃 이펙트 티어 계산 — 메인스탯 레벨 기준
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

        {/* 실제 발동 중인 버프/디버프 뱃지 — 클릭하면 상세 툴팁 */}
        {stats.buffs?.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            {stats.buffs.map((buff) => {
              const displayName = getDisplayName(buff.name);
              const isBuff = buff.buffType === "BUFF";
              const needsLink = !isBuff && !buff.linkedQuestId; // 4스탯 디버프 중 해제미션 미지정
              return (
                <span
                  key={buff.buffId}
                  onClick={() => setActiveBuff(buff)}
                  style={{
                    cursor: "pointer",
                    padding: "3px 10px",
                    borderRadius: "99px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: isBuff
                      ? "rgba(46,204,113,0.15)"
                      : "rgba(231,76,60,0.15)",
                    color: isBuff ? "#2ecc71" : "#e74c3c",
                    border: `1px solid ${isBuff ? "rgba(46,204,113,0.3)" : "rgba(231,76,60,0.3)"}`,
                  }}
                >
                  {isBuff ? "🟢" : "🔴"} {displayName}
                  {needsLink && " 🔗"}
                  {!isBuff &&
                    buff.linkedQuestId &&
                    ` (${buff.progress ?? 0}/2)`}
                </span>
              );
            })}
          </div>
        )}

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

      {/* 스탯 상세 팝업 (다음등급/디버프 가이드 포함) */}
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
                  {s.buffs?.length > 0 && (
                    <div className="rpg-popup-buffs">
                      <p className="rpg-popup-debuffs-title">
                        ✨ 현재 레벨에서 획득 가능한 버프
                      </p>

                      {s.buffs.map((b, i) => (
                        <div key={i} className="rpg-popup-debuff-item">
                          <div
                            className="rpg-popup-debuff-name"
                            style={{ color: "#2ecc71" }}
                          >
                            {b.name}
                          </div>

                          <div className="rpg-popup-debuff-row">
                            <span className="rpg-popup-debuff-label">발동</span>
                            <span>{b.condition}</span>
                          </div>

                          <div className="rpg-popup-debuff-row">
                            <span className="rpg-popup-debuff-label">효과</span>
                            <span
                              style={{
                                color: "#2ecc71",
                                fontWeight: 600,
                              }}
                            >
                              {b.effect}
                            </span>
                          </div>

                          <div className="rpg-popup-debuff-row">
                            <span className="rpg-popup-debuff-label">유지</span>
                            <span>{b.release}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {s.debuffs?.length > 0 && (
                    <div className="rpg-popup-debuffs">
                      <p className="rpg-popup-debuffs-title">
                        ⚠️ 현재 레벨에서 발생 가능한 디버프
                      </p>
                      {s.debuffs.map((d, i) => (
                        <div key={i} className="rpg-popup-debuff-item">
                          <div className="rpg-popup-debuff-name">{d.name}</div>

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

      {/* 버프/디버프 뱃지 클릭 시 — 발동조건/효과/해제법 + 해제미션 연결/진행도 */}
      {activeBuff &&
        (() => {
          const info = BUFF_INFO[activeBuff.name];
          const displayName = getDisplayName(activeBuff.name);
          if (!info) return null;
          const isBuff = info.type === "BUFF";
          const isStatDebuff = !isBuff && activeBuff.statType !== "ALL";
          return (
            <div
              className="rpg-popup-overlay"
              onClick={() => setActiveBuff(null)}
            >
              <div className="rpg-popup" onClick={(e) => e.stopPropagation()}>
                <div className="rpg-popup-header">
                  <span>
                    {isBuff ? "🟢" : "🔴"} {displayName}
                  </span>
                  <button onClick={() => setActiveBuff(null)}>✕</button>
                </div>
                <div className="rpg-popup-body">
                  <p
                    className="rpg-popup-grade"
                    style={{ color: isBuff ? "#2ecc71" : "#e74c3c" }}
                  >
                    {isBuff ? "버프 (긍정 효과)" : "디버프 (부정 효과)"}
                  </p>
                  <div className="rpg-popup-daily" style={{ marginTop: 12 }}>
                    <span>발동 조건</span>
                    <span style={{ textAlign: "right" }}>{info.condition}</span>
                  </div>
                  <div className="rpg-popup-daily" style={{ marginTop: 8 }}>
                    <span>효과</span>
                    <span
                      style={{
                        color: isBuff ? "#2ecc71" : "#e74c3c",
                        fontWeight: 600,
                      }}
                    >
                      {info.effect}
                    </span>
                  </div>
                  <div
                    className="rpg-popup-next-grade"
                    style={{ marginTop: 8 }}
                  >
                    <span>{isBuff ? "유지 기간" : "해제 방법"}</span>
                    <span>{info.release}</span>
                  </div>

                  {/* 4스탯 디버프 전용: 해제미션 연결/진행도 영역 */}
                  {isStatDebuff && !activeBuff.linkedQuestId && (
                    <button
                      className="submit-main-btn"
                      style={{ marginTop: 16, width: "100%" }}
                      onClick={() => goCreateReleaseQuest(activeBuff)}
                    >
                      📸 해제미션 만들기
                    </button>
                  )}
                  {isStatDebuff && activeBuff.linkedQuestId && (
                    <div
                      className="rpg-popup-next-grade"
                      style={{ marginTop: 16 }}
                    >
                      <span>해제 진행도</span>
                      <span style={{ fontWeight: 600 }}>
                        {activeBuff.progress ?? 0} / 2일 연속
                      </span>
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
