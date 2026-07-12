import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/Logs.css"; // 스타일시트 연결

export default function Logs() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // 활동 기록 리스트 상태 관리
  const [logs, setLogs] = useState([]);

  // 사진 확대를 위한 모달 상태 관리
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // 1. 최근 7일간의 퀘스트 완료 기록 로드 (GET /api/quests/{userId}/logs)
  const loadActivityLogs = async () => {
    if (!userId) return;
    try {
      const res = await axiosInstance.get(`/api/quests/${userId}/logs`);
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
      setLogs([]);
    }
  };

  useEffect(() => {
    loadActivityLogs();
  }, []);

  // 2. TIME 인증 전용 포맷터 명세 규칙 반영 (elapsedSec ➡️ X시간 X분 X초)
  const formatElapsedSec = (totalSeconds) => {
    if (!totalSeconds) return "0초 수행";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = "";
    if (hours > 0) result += `${hours}시간 `;
    if (minutes > 0) result += `${minutes}분 `;
    if (seconds > 0) result += `${seconds}초`;
    return `${result.trim()} 수행`;
  };

  // 3. 완료 시각 데이트 포맷 변환 (ex: 6/12 10:06)
  const formatCompletedAt = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    const date = new Date(dateTimeStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}/${day} ${hours}:${minutes}`;
  };

  return (
    <div className="logs-page-container">
      {/* 상단 내비바 헤더 영역 */}
      <header className="logs-header">
        <button className="header-back-arrow" onClick={() => navigate("/main")}>
          ← 뒤로
        </button>
        <h2 className="header-main-title">📊 활동 기록</h2>
        <div style={{ width: "45px" }}></div>
      </header>

      <p className="logs-sub-guide-text">최근 7일 퀘스트 완료 기록</p>

      {/* 리스트 본문 영역 구역 구분 */}
      <main className="logs-content-wrapper">
        {logs.length === 0 ? (
          /* 🌟 기획서 명세: '아직 완료한 퀘스트가 없습니다.' 빈 상태 트리거 */
          <div className="logs-empty-view">
            <span className="empty-icon">📭</span>
            <p className="empty-text">아직 완료한 퀘스트가 없습니다.</p>
          </div>
        ) : (
          <div className="logs-scroll-list">
            {logs.map((item) => (
              <div key={item.logId} className="logs-row-card">
                {/* 왼쪽 레이아웃 정보 세션 */}
                <div className="log-card-left">
                  <h3 className="log-quest-title">{item.title}</h3>

                  {/* 인증방식 분기 렌더링 명세 준수 */}
                  <div className="log-verify-type-label">
                    {item.verifyType === "CHECK" && "✓ 체크 인증"}
                    {item.verifyType === "TIME" &&
                      `⏱ ${formatElapsedSec(item.elapsedSec)}`}
                    {item.verifyType === "PHOTO" && "📸 사진 인증"}
                  </div>

                  {/* 연속 달성 N일 뱃지 가딩 (streakDays > 0 일 때만 노출) */}
                  {item.streakDays > 0 && (
                    <span className="log-streak-badge-tag">
                      🔥 {item.streakDays}일 연속 달성
                    </span>
                  )}
                </div>

                {/* 오른쪽 레이아웃 정보 세션 (경험치 및 완료시각) */}
                <div className="log-card-right">
                  <span className="log-earned-xp-text">
                    +{item.earnedXp} XP
                  </span>
                  <span className="log-timestamp-text">
                    {formatCompletedAt(item.completedAt)}
                  </span>

                  {/* PHOTO 인증일 때만 활성화되는 60x60 작은 썸네일 구조 */}
                  {item.verifyType === "PHOTO" && item.photoUrl && (
                    <div
                      className="log-thumbnail-box"
                      onClick={() => setSelectedPhoto(item.photoUrl)}
                    >
                      <img
                        src={item.photoUrl}
                        alt="인증 스탬프"
                        className="log-img-thumb"
                      />
                      <span className="thumb-zoom-hint-overlay">확대</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 🌟 기획서 요구사항: 사진 클릭 시 중앙에 나타나는 확대 팝업 모달 */}
      {selectedPhoto && (
        <div
          className="photo-zoom-modal-overlay"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="photo-zoom-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-top-btn"
              onClick={() => setSelectedPhoto(null)}
            >
              ✕
            </button>
            <img
              src={selectedPhoto}
              alt="인증 스크린샷 확대본"
              className="modal-large-render-img"
            />
            <p className="modal-bottom-tip">터치하여 닫기</p>
          </div>
        </div>
      )}
    </div>
  );
}
