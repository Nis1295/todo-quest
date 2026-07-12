import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import SideDrawer from "../../components/SideDrawer";
import "./MainTodo.css";

const PERIODS = [
  { key: "DAILY", label: "오늘" },
  { key: "WEEKLY", label: "주간" },
  { key: "MONTHLY", label: "월간" },
  { key: "YEARLY", label: "연간" },
];

const MainTodo = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const nickname = localStorage.getItem("nickname");

  const [period, setPeriod] = useState("DAILY");
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    fetchQuests();
    fetchUserInfo();
  }, [period]);

  const fetchQuests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/api/quests/${userId}?period=${period}`,
      );
      setQuests(res.data);
    } catch (err) {
      console.error("퀘스트 조회 실패", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const res = await axiosInstance.get(`/api/stats/${userId}`);
      setUserInfo(res.data);
    } catch (err) {
      console.error("유저 정보 조회 실패", err);
    }
  };

  // 완료 버튼 → 인증 화면으로 이동
  const handleComplete = (questId) => {
    navigate(`/quest/complete/${questId}`);
  };

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="main-container">
      {/* 상단 헤더 */}
      <div className="main-header">
        <div className="main-date">{today}</div>
        <div className="main-header-right">
          <span className="main-nickname">{nickname}</span>
          {/* 햄버거 메뉴 버튼 */}
          <button className="main-menu-btn" onClick={() => setDrawerOpen(true)}>
            ☰
          </button>
        </div>
      </div>

      {/* 탭 바 */}
      <div className="main-tabs">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            className={`main-tab ${period === p.key ? "active" : ""}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 퀘스트 목록 */}
      <div className="main-quest-list">
        {loading ? (
          <p className="main-empty">로딩 중...</p>
        ) : quests.length === 0 ? (
          <p className="main-empty">퀘스트가 없습니다. 추가해보세요!</p>
        ) : (
          quests.map((quest) => (
            <div
              key={quest.questId}
              className={`quest-card ${quest.completed ? "done" : ""}`}
            >
              <div className="quest-info">
                <span
                  className={`quest-stat stat-${quest.statType?.toLowerCase()}`}
                >
                  {quest.statType}
                </span>
                <span className="quest-title">{quest.title}</span>
              </div>
              <div className="quest-right">
                <span className="quest-xp">+{getBaseXp(quest.xpSize)} XP</span>
                {!quest.completed ? (
                  <button
                    className="quest-complete-btn"
                    onClick={() => handleComplete(quest.questId)}
                  >
                    {quest.verifyType === "TIME"
                      ? "▶ 시작"
                      : quest.verifyType === "PHOTO"
                        ? "📷 인증"
                        : "완료"}
                  </button>
                ) : (
                  <span className="quest-done-badge">✓</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* + 퀘스트 추가 버튼 */}
      <button
        className="main-add-btn"
        onClick={() => navigate("/quest/create")}
      >
        + 퀘스트 추가
      </button>

      {/* 하단 네비게이션 */}
      <div className="main-bottom-nav">
        <button onClick={() => navigate("/rpg")}>⚔️ 캐릭터</button>
        <button className="active">🏠 홈</button>
        <button onClick={() => navigate("/ranking")}>🏆 랭킹</button>
      </div>

      {/* 사이드 드로어 */}
      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userInfo={userInfo}
      />
    </div>
  );
};

const getBaseXp = (xpSize) => {
  if (xpSize === "LARGE") return 85;
  if (xpSize === "MEDIUM") return 40;
  return 15;
};

export default MainTodo;
