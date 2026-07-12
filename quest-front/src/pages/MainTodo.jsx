import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import SideDrawer from "./SideDrawer"; // 분리한 컴포넌트 경로 확인
import "../styles/MainTodo.css";
import questLogo from "../assets/quest_logo.png";

const PERIODS = [
  { key: "DAILY", label: "오늘" },
  { key: "WEEKLY", label: "주간" },
  { key: "MONTHLY", label: "월간" },
  { key: "YEARLY", label: "연간" },
];

export default function MainTodo() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("DAILY");
  const [quests, setQuests] = useState([]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const userId = localStorage.getItem("userId");

  // 초기값 디버깅 세션 락 유지
  const [userProfile, setUserProfile] = useState({
    nickname: localStorage.getItem("nickname") || "모험가",
    birthYear: 2001,
    mainLevel: 0,
    totalPoint: 0,
    isGuest: localStorage.getItem("isGuest") === "true",
    nicknameChangeCount: 1,
    profileImage: localStorage.getItem("profileImage") || "",
  });

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNicknameValue, setEditNicknameValue] = useState("");

  // 실시간 한국 표준시 현재 날짜 연산 시스템 준수
  const todayString = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const load = async () => {
    if (!userId) return;
    try {
      const [questsRes, statsRes] = await Promise.all([
        axiosInstance.get(`/api/quests/${userId}?period=${period}`),
        axiosInstance.get(`/api/stats/${userId}`),
      ]);

      setQuests(questsRes.data || []);

      const localNickname = localStorage.getItem("nickname") || "모험가";
      const localMainStat = localStorage.getItem("mainStat") || "STR";
      const localProfileImage = localStorage.getItem("profileImage") || "";

      setUserProfile((prev) => ({
        ...prev,
        nickname: localNickname,
        mainStat: localMainStat,
        profileImage: localProfileImage,
        mainLevel: statsRes.data.mainLevel,
        totalPoint: statsRes.data.totalPoint,
        nicknameChangeCount: statsRes.data.nicknameChangeCount,
      }));
    } catch (err) {
      console.error("데이터 동기화 오류", err);
    }
  };

  useEffect(() => {
    load();
  }, [period]);

  const handleStartEditNickname = () => {
    if (userProfile.nicknameChangeCount <= 0) {
      return alert(
        "변경 가능 횟수가 0회입니다.\n포인트로 변경권을 구매한 후 변경 가능합니다.",
      );
    }
    setEditNicknameValue(userProfile.nickname);
    setIsEditingNickname(true);
  };

  const handleSaveNickname = async () => {
    if (!editNicknameValue.trim()) return alert("닉네임을 입력하세요.");
    if (editNicknameValue === userProfile.nickname) {
      setIsEditingNickname(false);
      return;
    }

    if (
      !window.confirm(
        `닉네임을 [${editNicknameValue}]으로 변경하시겠습니까?\n(남은 변경 가능 횟수: ${userProfile.nicknameChangeCount}회)`,
      )
    )
      return;

    try {
      const payload = {
        userId: Number(userId),
        nickname: editNicknameValue,
        birthYear: Number(userProfile.birthYear),
        nicknameChangeCount: userProfile.nicknameChangeCount - 1,
        totalPoint: Number(userProfile.totalPoint),
      };

      await axiosInstance.put(`/api/auth/profile/${userId}`, payload);
      alert("닉네임이 성공적으로 변경되었습니다.");
      localStorage.setItem("nickname", editNicknameValue);

      setUserProfile((prev) => ({
        ...prev,
        nickname: editNicknameValue,
        nicknameChangeCount: prev.nicknameChangeCount - 1,
      }));
      setIsEditingNickname(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "닉네임 수정 실패");
    }
  };

  const handleActionClick = async (questId, currentQuest) => {
    if (!questId) return alert("유효하지 않은 퀘스트 식별자입니다.");
    if (currentQuest?.completed) {
      return alert("이 퀘스트는 이미 오늘의 목표를 달성했습니다!");
    }

    const type = currentQuest?.verifyType || "CHECK";
    if (type === "TIME" || type === "PHOTO") {
      navigate(`/quest/complete/${questId}`, {
        state: { quest: currentQuest },
      });
      return;
    }

    try {
      const payload = {
        userId: Number(userId),
        verifyType: "CHECK",
        photoUrl: "",
        elapsedSec: 0,
      };
      const res = await axiosInstance.post(
        `/api/quests/${questId}/complete`,
        payload,
      );
      alert(res.data?.message || "퀘스트 완료인증 성공!");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "인증 처리 실패");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await axiosInstance.delete(`/api/quests/${deleteTargetId}`);
      alert("퀘스트가 삭제되었습니다.");
      setDeleteTargetId(null);
      load();
    } catch (err) {
      alert("삭제 실패");
    }
  };
  const handleExtend = async (questId) => {
    try {
      await axiosInstance.post(`/api/quests/${questId}/extend`);
      alert("퀘스트가 하루 연장되었습니다.");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "연장에 실패했습니다.");
    }
  };
  return (
    <div className="todo-container">
      {/* 실시간 날짜 바인딩 헤더 구역 */}
      <div className="todo-header">
        <p className="todo-date-info">{todayString}</p>

        <button
          className="menu-hamburger-btn"
          onClick={() => setIsMenuOpen(true)}
        >
          ☰
        </button>
      </div>

      <div className="quest-brand-area">
        <img src={questLogo} alt="QUEST" className="quest-brand-logo" />

        <h1 className="quest-brand-title">QUEST</h1>

        <p className="quest-brand-slogan">Level Up Your Life</p>
      </div>

      <div className="tab-group">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            className={`tab-button ${period === p.key ? "active" : ""}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 퀘스트 리스트 카드 구역 */}
      <div className="quest-list">
        {quests.length === 0 ? (
          <p
            style={{ color: "#627299", textAlign: "center", marginTop: "20px" }}
          >
            등록된 퀘스트가 없습니다.
          </p>
        ) : (
          quests.map((q) => (
            <div
              key={q.questId}
              className={`quest-card ${q.completed ? "completed-status" : ""}`}
            >
              <button
                className="delete-card-btn"
                onClick={() => setDeleteTargetId(q.questId)}
              >
                ✕
              </button>
              <div className="quest-top-row">
                <span className={`stat-tag ${q.statType || "STR"}`}>
                  {q.statType || "STR"}
                </span>
                <h3 className="quest-title">{q.title}</h3>
              </div>
              <div className="card-actions">
                <button
                  className={`action-btn complete ${q.completed ? "disabled-btn" : ""}`}
                  onClick={() => handleActionClick(q.questId, q)}
                  disabled={q.completed}
                >
                  {q.completed
                    ? "✓ 오늘의 임무 완수"
                    : q.verifyType === "TIME"
                      ? "⏱ 타이머 시작"
                      : q.verifyType === "PHOTO"
                        ? "📸 사진 인증"
                        : "▶ 즉시 완료"}
                </button>
                <button
                  className="action-btn extend"
                  disabled={q.completed}
                  onClick={() => handleExtend(q.questId)}
                >
                  ■ 연장하기
                </button>
              </div>
            </div>
          ))
        )}

        {/* 🌟 퀘스트 리스트 바로 밑에 추가되는 독립형 [➕ 퀘스트 추가] 대형 액션 버튼 */}
        <button
          className="quest-list-append-btn"
          onClick={() => navigate("/quest/create")}
        >
          ➕ 퀘스트 추가하기
        </button>
      </div>

      {/* 🌟 기획 요구사항 반영: 캐릭터 ➡️ RPG스탯창 ➡️ 홈 ➡️ 랭킹 정밀 4분할 바인딩 고정바 */}
      <footer className="bottom-nav">
        <button className="nav-item" onClick={() => navigate("/profile")}>
          👤 캐릭터
        </button>
        <button className="nav-item" onClick={() => navigate("/rpg")}>
          📊 RPG스탯창
        </button>
        <button className="nav-item active" onClick={() => navigate("/main")}>
          🏠 홈
        </button>
        <button className="nav-item" onClick={() => navigate("/ranking")}>
          🏆 랭킹
        </button>
      </footer>

      <SideDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userProfile={userProfile}
        isEditingNickname={isEditingNickname}
        editNicknameValue={editNicknameValue}
        setEditNicknameValue={setEditNicknameValue}
        handleStartEditNickname={handleStartEditNickname}
        handleSaveNickname={handleSaveNickname}
      />

      {deleteTargetId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p className="modal-text">이 퀘스트를 정말로 삭제하시겠습니까?</p>
            <div className="modal-buttons">
              <button
                className="action-btn extend"
                onClick={() => setDeleteTargetId(null)}
              >
                취소
              </button>
              <button
                className="action-btn complete"
                style={{ backgroundColor: "#ff4d4d", color: "#fff" }}
                onClick={confirmDelete}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
