import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/QuestCreate.css";

export default function QuestCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("userId");

  // 디버프 해제미션 생성 모드 — RpgStatus에서 "해제미션 만들기" 클릭 시 state로 전달됨
  const linkBuffId = location.state?.linkBuffId || null;
  const linkStatType = location.state?.linkStatType || null;
  const isLinkMode = !!linkBuffId;

  const [activeTab, setActiveTab] = useState("DIRECT");

  // 1. 🌟 [명세서 완벽 반영] 소문자 키 구조에 맞춘 실시간 스탯 데이터셋 공간 개설
  const [statLevels, setStatLevels] = useState({
    str: 1, // 체력
    int: 1, // 지력
    wil: 1, // 의지력
    vit: 1, // 활력
  });

  const [maxSlotLimits, setMaxSlotLimits] = useState({
    DAILY: 5,
    WEEKLY: 2,
    MONTHLY: 1,
    YEARLY: 1,
  });

  const [quest, setQuest] = useState({
    title: "",
    period: "DAILY",
    statType: linkStatType || "STR", // 해제미션 모드면 디버프 스탯으로 고정 시작
    xpType: "SMALL",
    verifyType: isLinkMode ? "PHOTO" : "CHECK", // 해제미션 모드면 PHOTO 고정 시작
    targetMinutes: 0,
  });

  // 2. 스탯창 데이터 및 슬롯 데이터 통합 동기화 로드
  useEffect(() => {
    const loadRequiredData = async () => {
      if (!userId) return;
      try {
        // 내 실제 스탯 정보를 백엔드에서 읽어옵니다. (GET /api/stats/{userId})
        const statRes = await axiosInstance
          .get(`/api/stats/${userId}`)
          .catch(() => null);
        if (statRes?.data) {
          // 🎯 제공해주신 소문자 변수명 명세와 100% 매핑 싱크로 완료
          setStatLevels({
            str:
              statRes.data.strLevel ||
              statRes.data.str_level ||
              statRes.data.str ||
              1,
            int:
              statRes.data.intLevel ||
              statRes.data.int_level ||
              statRes.data.int ||
              1,
            wil:
              statRes.data.wilLevel ||
              statRes.data.wil_level ||
              statRes.data.wil ||
              1,
            vit:
              statRes.data.vitLevel ||
              statRes.data.vit_level ||
              statRes.data.vit ||
              1,
          });
        }

        // 상점 슬롯 한도 데이터 로드
        const slotRes = await axiosInstance
          .get(`/api/slots/${userId}`)
          .catch(() => null);
        if (slotRes?.data) {
          setMaxSlotLimits({
            DAILY: slotRes.data.dailyCount || 5,
            WEEKLY: slotRes.data.weeklyCount || 2,
            MONTHLY: slotRes.data.monthlyCount || 1,
            YEARLY: slotRes.data.yearlyCount || 1,
          });
        }
      } catch (e) {
        console.warn("API 미연동 가드 가동");
      }
    };
    loadRequiredData();
  }, [userId]);

  // 3. 🌟 [잠금 제어 대동맥] 선택한 대문자 필드를 소문자로 하향 매핑하여 실시간 레벨 가드 가동
  // 연간(버킷리스트)은 레벨 무관 대(LARGE)만 가능 — 최우선 적용
  const isXpTypeLocked = (type) => {
    if (quest.period === "YEARLY") {
      return type !== "LARGE";
    }

    const targetKey = quest.statType.toLowerCase();
    const statData = statLevels[targetKey];

    // 🎯 만약 스탯 데이터가 객체라면 .level을 꺼내고, 아니라면 숫자 그대로 인지
    const currentSelectedStatLevel =
      typeof statData === "object" ? statData?.level || 1 : statData || 1;

    if (type === "MEDIUM" && currentSelectedStatLevel < 21) return true;
    if (type === "LARGE" && currentSelectedStatLevel < 51) return true;
    return false;
  };

  // 인증 방식 잠금: 해제미션 모드 또는 연간(버킷리스트)이면 사진(PHOTO)만 가능
  const isVerifyTypeLocked = (type) => {
    if (isLinkMode) return type !== "PHOTO";
    if (quest.period === "YEARLY") return type !== "PHOTO";
    return false;
  };

  useEffect(() => {
    if (quest.period === "YEARLY") {
      // 연간 선택 시 난이도=대, 인증방식=사진으로 자동 고정
      setQuest((prev) => ({
        ...prev,
        xpType: "LARGE",
        verifyType: "PHOTO",
        targetMinutes: 0,
      }));
    } else if (isXpTypeLocked(quest.xpType)) {
      setQuest((prev) => ({ ...prev, xpType: "SMALL" }));
    }
  }, [quest.statType, quest.period]);

  const handleVerifyChange = (type) => {
    if (isVerifyTypeLocked(type)) return; // 해제미션/연간 모드에서는 PHOTO 고정, 변경 불가
    setQuest((prev) => ({
      ...prev,
      verifyType: type,
      targetMinutes: type === "TIME" ? 10 : 0,
    }));
  };

  const handleStatChange = (statId) => {
    if (isLinkMode) return; // 해제미션 모드에서는 디버프 스탯 고정, 변경 불가
    setQuest((prev) => ({ ...prev, statType: statId }));
  };

  const save = async (isTemplateSave = false) => {
    if (!quest.title.trim()) return alert("퀘스트 이름을 입력해 주세요.");

    try {
      const res = await axiosInstance.get(
        `/api/quests/${userId}?period=${quest.period}`,
      );
      const currentActiveQuestsCount = res.data ? res.data.length : 0;
      const allowedMaxLimit = maxSlotLimits[quest.period];

      if (currentActiveQuestsCount >= allowedMaxLimit) {
        return alert(
          `🔒 퀘스트 생성 한도 초과!\n포인트 상점에서 슬롯을 구매하세요.`,
        );
      }

      const payload = {
        userId: userId ? Number(userId) : null,
        title: quest.title,
        period: quest.period,
        statType: quest.statType, // 백엔드가 원하는 대문자 규칙(STR/INT/WIL/VIT) 수용
        xpSize: quest.xpType,
        verifyType: quest.verifyType,
        targetMinutes:
          quest.verifyType === "TIME" ? Number(quest.targetMinutes) : 0,
        template: isTemplateSave,
        notifyType: "NONE",
        notifyTab: quest.period,
        showCard: true,
        active: true,
      };

      const createRes = await axiosInstance.post("/api/quests", payload);

      // 해제미션 생성 모드면, 생성된 퀘스트를 디버프에 자동 연결
      if (isLinkMode && !isTemplateSave) {
        const newQuestId = createRes.data?.questId;
        if (newQuestId) {
          try {
            await axiosInstance.post(`/api/quests/buffs/${linkBuffId}/link`, {
              questId: newQuestId,
            });
            alert(
              "해제미션 생성 + 연결 완료! 2일 연속 완료하면 디버프가 해제돼요.",
            );
          } catch (linkErr) {
            console.error(linkErr);
            alert(
              "퀘스트는 생성됐지만 디버프 연결에 실패했어요. RPG 상태창에서 다시 시도해 주세요.",
            );
          }
        }
        navigate("/rpg");
        return;
      }

      alert(isTemplateSave ? "템플릿 저장 완료!" : "퀘스트 생성 완료!");
      navigate("/main");
    } catch (e) {
      alert("생성 실패");
    }
  };

  return (
    <div className="create-container">
      <div className="create-box">
        <button
          className="close-page-btn"
          onClick={() => navigate(isLinkMode ? "/rpg" : "/main")}
        >
          ✕
        </button>
        <h2 className="create-title">
          {isLinkMode ? "📸 디버프 해제미션 만들기" : "퀘스트 추가"}
        </h2>

        {isLinkMode && (
          <div
            style={{
              backgroundColor: "rgba(231,76,60,0.12)",
              border: "1px solid rgba(231,76,60,0.3)",
              padding: "10px 12px",
              borderRadius: "10px",
              fontSize: "0.82rem",
              color: "#e74c3c",
              marginBottom: "14px",
              fontWeight: 600,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            🔗 {linkStatType} 디버프 해제용 사진인증 퀘스트를 만듭니다.
            <br />
            인증 방식은 PHOTO로 고정돼요. 2일 연속 완료하면 디버프가 해제됩니다.
          </div>
        )}

        {/* 상단 미니 전광판 명세 동기화 (🧠 아이콘 및 한글 명칭 전면 패치 완료) ⚡ */}
        <div
          style={{
            backgroundColor: "#141a29",
            padding: "12px",
            borderRadius: "10px",
            fontSize: "0.85rem",
            color: "#ffcc00",
            marginBottom: "14px",
            fontWeight: "bold",
            textAlign: "center",
            lineHeight: "1.4",
          }}
        >
          ⚡ 내 실시간 능력치 ⚡<br />
          💪 체력(STR): Lv.
          {typeof statLevels.str === "object"
            ? statLevels.str?.level || 1
            : statLevels.str}{" "}
          | 🔮 지력(INT): Lv.
          {typeof statLevels.int === "object"
            ? statLevels.int?.level || 1
            : statLevels.int}{" "}
          | 🧠 의지력(WIL): Lv.
          {typeof statLevels.wil === "object"
            ? statLevels.wil?.level || 1
            : statLevels.wil}{" "}
          | ❤️ 활력(VIT): Lv.
          {typeof statLevels.vit === "object"
            ? statLevels.vit?.level || 1
            : statLevels.vit}
        </div>

        {!isLinkMode && (
          <div className="create-tabs">
            <button
              className={`create-tab-btn ${activeTab === "TEMPLATE_LIST" ? "active" : ""}`}
              onClick={() => setActiveTab("TEMPLATE_LIST")}
            >
              내 템플릿
            </button>
            <button
              className={`create-tab-btn ${activeTab === "DIRECT" ? "active" : ""}`}
              onClick={() => setActiveTab("DIRECT")}
            >
              직접 입력
            </button>
            <button
              className={`create-tab-btn ${activeTab === "MAKE_TEMPLATE" ? "active" : ""}`}
              onClick={() => setActiveTab("MAKE_TEMPLATE")}
            >
              템플릿 만들기
            </button>
          </div>
        )}

        {(isLinkMode ||
          activeTab === "DIRECT" ||
          activeTab === "MAKE_TEMPLATE") && (
          <div className="form-section">
            <label className="form-label">퀘스트 이름</label>
            <input
              className="create-input"
              placeholder="퀘스트 이름을 입력하세요"
              value={quest.title}
              onChange={(e) => setQuest({ ...quest, title: e.target.value })}
            />

            <label className="form-label">수행 기간</label>
            <div className="option-grid">
              {[
                { id: "DAILY", name: "📋 일간" },
                { id: "WEEKLY", name: "📅 주간" },
                { id: "MONTHLY", name: "📆 월간" },
                { id: "YEARLY", name: "👑 연간" },
              ].map((p) => (
                <button
                  key={p.id}
                  className={`option-btn ${quest.period === p.id ? "active" : ""}`}
                  onClick={() => setQuest({ ...quest, period: p.id })}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {quest.period === "YEARLY" && (
              <div
                style={{
                  backgroundColor: "rgba(255,204,0,0.1)",
                  border: "1px solid rgba(255,204,0,0.35)",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  fontSize: "0.82rem",
                  color: "#ffcc00",
                  marginTop: "-4px",
                  marginBottom: "14px",
                  fontWeight: 600,
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                🏆 연간(버킷리스트)는 사진 인증 필수이며,
                <br />
                생성 후 7일 이후부터 완료 가능합니다.
                <br />
                완료 시 XP 3배 지급!
              </div>
            )}

            {/* 🌟 명세서 지정 한글 이름 및 아이콘 100% 매핑 재배치 구역 */}
            <label className="form-label">
              연관 스탯 선택 {isLinkMode && "(디버프 해제 대상 — 고정)"}
            </label>
            <div className="option-grid">
              {[
                { id: "STR", name: "💪 체력" },
                { id: "INT", name: "🔮 지력" },
                { id: "WIL", name: "🧠 의지력" },
                { id: "VIT", name: "❤️ 활력" },
              ].map((s) => (
                <button
                  key={s.id}
                  disabled={isLinkMode && s.id !== linkStatType}
                  className={`option-btn ${quest.statType === s.id ? "active" : ""} ${isLinkMode && s.id !== linkStatType ? "locked" : ""}`}
                  onClick={() => handleStatChange(s.id)}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <label className="form-label">
              난이도 설정 (선택한 연관 스탯 기준)
              {quest.period === "YEARLY" && " — XP × 3배"}
            </label>
            <div className="option-grid triple">
              {[
                { id: "SMALL", name: "소", baseXp: 15 },
                { id: "MEDIUM", name: "중", baseXp: 40, lv: 21 },
                { id: "LARGE", name: "대", baseXp: 85, lv: 51 },
              ].map((x) => {
                const isLocked = isXpTypeLocked(x.id);
                const displayXp =
                  quest.period === "YEARLY" ? x.baseXp * 3 : x.baseXp;
                let label;
                if (isLocked && quest.period === "YEARLY") {
                  label = `🔒 ${x.name} (대형목표만 가능)`;
                } else if (isLocked) {
                  label = `🔒 ${quest.statType} Lv.${x.lv} 필요`;
                } else {
                  label = `${x.name} (${displayXp} XP)`;
                }
                return (
                  <button
                    key={x.id}
                    disabled={isLocked}
                    className={`option-btn ${quest.xpType === x.id ? "active" : ""} ${isLocked ? "locked" : ""}`}
                    onClick={() => setQuest({ ...quest, xpType: x.id })}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <label className="form-label">
              인증 방식
              {isLinkMode && " (사진인증 — 고정)"}
              {!isLinkMode && quest.period === "YEARLY" && " (사진인증 — 고정)"}
            </label>
            <div className="option-grid triple">
              {[
                { id: "CHECK", name: "✓ 체크" },
                { id: "TIME", name: "⏱ 시간" },
                { id: "PHOTO", name: "📸 사진" },
              ].map((v) => (
                <button
                  key={v.id}
                  disabled={isVerifyTypeLocked(v.id)}
                  className={`option-btn ${quest.verifyType === v.id ? "active" : ""} ${isVerifyTypeLocked(v.id) ? "locked" : ""}`}
                  onClick={() => handleVerifyChange(v.id)}
                >
                  {v.name}
                </button>
              ))}
            </div>

            {quest.verifyType === "TIME" && (
              <div className="time-input-fade-zone">
                <label className="form-label">⏱ 목표 수행 시간 설정</label>
                <div className="time-input-wrapper">
                  <input
                    className="create-input time-number-field"
                    type="number"
                    min="1"
                    placeholder="예: 30"
                    value={quest.targetMinutes || ""}
                    onChange={(e) =>
                      setQuest({ ...quest, targetMinutes: e.target.value })
                    }
                  />
                  <span className="time-unit-label">분 동안 수행</span>
                </div>
              </div>
            )}

            <div className="submit-group">
              <button className="submit-main-btn" onClick={() => save(false)}>
                {isLinkMode
                  ? "📸 해제미션 생성 + 연결하기"
                  : activeTab === "MAKE_TEMPLATE"
                    ? "템플릿 기본 등록"
                    : "퀘스트 생성하기"}
              </button>
              {!isLinkMode && (
                <button className="submit-sub-btn" onClick={() => save(true)}>
                  ⭐ 내 템플릿으로 저장하기
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
