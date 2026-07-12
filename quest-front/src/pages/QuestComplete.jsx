import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import "../styles/QuestComplete.css";

export default function QuestComplete() {
  const { questId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [photoInfo, setPhotoInfo] = useState(null);

  // 1. 메인 화면(MainTodo)에서 넘겨준 퀘스트 객체 정보 확보
  const incomingQuest = location.state?.quest;

  // 2. 전달받은 q.targetMinutes 변수명을 명확하게 상태 시스템과 연결 완료 ⭐
  const [questDetail, setQuestDetail] = useState({
    title: incomingQuest?.title || "퀘스트 정보 로딩 중...",
    mainStat: incomingQuest?.statType || "STR",
    verifyType: incomingQuest?.verifyType || "TIME",
    targetMinutes: incomingQuest?.targetMinutes
      ? Number(incomingQuest.targetMinutes)
      : 0, // 변수명 일치화 ⭐
    xpSize: incomingQuest?.xpSize || "SMALL"
  });

  const [elapsedSec, setElapsedSec] = useState(0);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSuccessfullyDone, setIsSuccessfullyDone] = useState(false);

  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const getRewardXp = (size) => {
    if (size === "MEDIUM") return 40;
    if (size === "LARGE") return 85;
    return 15;
  };

  // 3. 메인에서 클릭되어 넘어온 실제 데이터 실시간 동기화 ⭐
  useEffect(() => {
    if (incomingQuest) {
      setQuestDetail({
        title: incomingQuest.title,
        mainStat: incomingQuest.statType || "STR",
        verifyType: incomingQuest.verifyType,
        targetMinutes: incomingQuest.targetMinutes
          ? Number(incomingQuest.targetMinutes)
          : 0, // 변수명 일치화 ⭐
        xpSize: incomingQuest.xpSize || "SMALL"
      });
    }
  }, [incomingQuest]);

  // TIME 인증용 타이머 엔진
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  const formatTimeDisplay = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // 최종 완료 API 전송 처리 (POST /api/quests/{questId}/complete)
  const handleCompleteRequest = async () => {
    // 목표 시간 도달 검증 수식 (분 단위를 초 단위로 보정)
    if (
      questDetail.verifyType === "TIME" &&
      questDetail.targetMinutes > 0 &&
      elapsedSec < questDetail.targetMinutes * 60
    ) {
      return alert(
        `목표 수행 시간(${questDetail.targetMinutes}분)을 가득 채워야 완료 가능합니다.`
      );
    }

    if (questDetail.verifyType === "PHOTO" && !photoUrl) {
      return alert("인증 사진을 업로드해 주세요.");
    }

    try {
      const payload = {
        userId: localStorage.getItem("userId")
          ? Number(localStorage.getItem("userId"))
          : null,
        verifyType: questDetail.verifyType,
        elapsedSec: questDetail.verifyType === "TIME" ? elapsedSec : 0,
        photoUrl: questDetail.verifyType === "PHOTO" ? photoUrl : ""
      };

      await axiosInstance.post(`/api/quests/${questId}/complete`, payload);
      setIsSuccessfullyDone(true);
    } catch (err) {
      alert(err.response?.data?.message || "완료 처리 중 에러가 발생했습니다.");
    }
  };

 const handlePhotoUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 20MB 제한
  const MAX_SIZE = 20 * 1024 * 1024;

  if (file.size > MAX_SIZE) {
    alert("사진은 최대 20MB까지 업로드 가능합니다.");
    e.target.value = "";
    return;
  }

  setPhotoInfo({
    name: file.name,
    size: (file.size / 1024 / 1024).toFixed(2)
  });

  const reader = new FileReader();

  reader.onload = () => {
    setPhotoUrl(reader.result);
  };

  reader.readAsDataURL(file);
};
  return (
    <div className="verify-container">
      <div className="verify-box">
        {/* 상단 헤더 영역 */}
        <div className="verify-header">
          <button className="back-arrow-btn" onClick={() => navigate("/main")}>
            ◀ 뒤로
          </button>
          <h2 className="verify-page-title">퀘스트 인증</h2>
          <div style={{ width: "24px" }}></div>
        </div>

        {!isSuccessfullyDone ? (
          <>
            {/* 중간 메인 타이틀 바 */}
            <div className="quest-info-center-row">
              <div className="quest-badge-row">
                <span className={`stat-tag ${questDetail.mainStat}`}>
                  {questDetail.mainStat}
                </span>
                <span className="quest-title-text">{questDetail.title}</span>
              </div>
            </div>

            {/* CHECK 타입 뷰 */}
            {questDetail.verifyType === "CHECK" && (
              <div className="check-mode-zone">
                <div className="huge-check-circle">✓</div>
                <p className="verify-guide-txt">
                  완료 버튼을 누르면
                  <br />
                  즉시 퀘스트 인증을 완료하고 보상을 받습니다.
                </p>
              </div>
            )}

            {/* TIME 타입 뷰 - targetMinutes 데이터 완벽 연동 연출 ⭐ */}
            {questDetail.verifyType === "TIME" && (
              <div className="time-mode-zone">
                {questDetail.targetMinutes > 0 ? (
                  <p className="target-time-notice">
                    목표 시간: {questDetail.targetMinutes}분
                  </p>
                ) : (
                  <p className="target-time-notice">목표 시간: 무제한 기록</p>
                )}
                <div className="timer-countdown-display">
                  {formatTimeDisplay(elapsedSec)}
                </div>
                <button
                  className="verify-action-btn"
                  style={{
                    backgroundColor: isTimerRunning ? "#e74c3c" : "#ffcc00",
                    color: isTimerRunning ? "#fff" : "#0d111a",
                    marginBottom: "20px"
                  }}
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                >
                  {isTimerRunning ? "⏸ 일시정지" : "▶ 타이머 시작"}
                </button>
              </div>
            )}

            {/* PHOTO 타입 뷰 */}
            {questDetail.verifyType === "PHOTO" && (
              <div className="photo-mode-zone">
                <div
                  className="photo-preview-box"
                  onClick={() => fileInputRef.current.click()}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="인증 업로드 스크린샷"
                      className="photo-preview-img"
                    />
                  ) : (
                    <>
                      <span className="photo-placeholder-icon">📸</span>
                      <p className="verify-guide-txt">
                        터치하여 인증 사진 첨부
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden-file-input"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                />{photoInfo && (
                  <div
                    style={{
                      marginTop: "12px",
                      textAlign: "center",
                      fontSize: "0.85rem",
                      color: "#666"
                    }}
                  >
                    <div>📄 {photoInfo.name}</div>
                    <div>📦 {photoInfo.size} MB / 최대 20 MB</div>
                  </div>
                )}
              </div>
            )}
            

            {/* 하단 최종 전송 실행 액션 바 */}
            <button
              className="verify-action-btn"
              onClick={handleCompleteRequest}
              disabled={
                questDetail.verifyType === "TIME" &&
                questDetail.targetMinutes > 0 &&
                elapsedSec < questDetail.targetMinutes * 60
              }
            >
              {questDetail.verifyType === "TIME" &&
              questDetail.targetMinutes > 0 &&
              elapsedSec < questDetail.targetMinutes * 60
                ? `⌛ 목표 시간(${questDetail.targetMinutes}분)을 채워주세요`
                : "인증 완료하기"}
            </button>
          </>
        ) : (
          /* 퀘스트 완료 성공 뷰 */
          <div className="success-popup-view">
            <span className="celebrate-badge">🎉</span>
            <h2 className="success-main-title">퀘스트 완료!</h2>
            <p className="success-reward-xp">
              +{getRewardXp(questDetail.xpSize)} XP를 획득했습니다.
            </p>

            <button
              className="verify-action-btn"
              onClick={() => navigate("/main")}
            >
              메인으로 이동
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
