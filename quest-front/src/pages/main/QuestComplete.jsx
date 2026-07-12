import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./QuestComplete.css";

const QuestComplete = () => {
  const navigate = useNavigate();
  const { questId } = useParams();
  const userId = localStorage.getItem("userId");

  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMsg, setShowMsg] = useState(false); // 양심 문구 표시
  const [result, setResult] = useState(null); // 완료 결과

  // 타이머 상태
  const [timerSec, setTimerSec] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef(null);

  // 사진 상태
  const [photo, setPhoto] = useState(null); // File 객체
  const [preview, setPreview] = useState(null); // 미리보기 URL
  const fileRef = useRef(null);

  useEffect(() => {
    fetchQuest();
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchQuest = async () => {
    try {
      const res = await axiosInstance.get(`/api/quests/${userId}?period=DAILY`);
      const found = res.data.find((q) => q.questId === parseInt(questId));
      setQuest(found);
      // 타이머 목표 시간 초기화
      if (found?.targetMinutes) {
        // 목표 시간은 표시용으로만 사용
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── 타이머 ───
  const startTimer = () => {
    setTimerRunning(true);
    intervalRef.current = setInterval(() => {
      setTimerSec((prev) => {
        const next = prev + 1;
        // 목표 시간 도달 시 자동 완료 알림
        if (quest?.targetMinutes && next >= quest.targetMinutes * 60) {
          setTimerDone(true);
        }
        return next;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
    clearInterval(intervalRef.current);
  };

  const stopTimer = () => {
    setTimerRunning(false);
    clearInterval(intervalRef.current);
    setTimerDone(true);
  };

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ─── 사진 ───
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  // ─── 완료 처리 ───
  const handleComplete = () => {
    // 양심 문구 1초 표시 후 완료
    setShowMsg(true);
    setTimeout(() => {
      setShowMsg(false);
      submitComplete();
    }, 1500);
  };

  const submitComplete = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/api/quests/${questId}/complete`, {
        userId: parseInt(userId),
        verifyType: quest.verifyType,
        elapsedSec: timerSec,
        photoUrl: null, // 실제 파일 업로드는 추후 S3 연동
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 완료 가능 여부
  const canComplete = () => {
    if (!quest) return false;
    if (quest.verifyType === "TIME") return timerDone;
    if (quest.verifyType === "PHOTO") return !!photo;
    return true; // CHECK
  };

  const targetProgress = quest?.targetMinutes
    ? Math.min((timerSec / (quest.targetMinutes * 60)) * 100, 100)
    : null;

  // ─── 완료 결과 화면 ───
  if (result) {
    return (
      <div className="qc-result">
        <div className="qc-result-icon">{result.cappedOut ? "⚠️" : "🎉"}</div>
        <h2>{result.cappedOut ? "오늘 XP 상한 도달" : "퀘스트 완료!"}</h2>
        <p className="qc-result-xp">
          {result.cappedOut
            ? "완료는 기록됩니다"
            : `+${result.earnedXp} XP 획득`}
        </p>
        <button className="qc-result-btn" onClick={() => navigate("/main")}>
          메인으로
        </button>
      </div>
    );
  }

  if (!quest) return <div className="qc-loading">로딩 중...</div>;

  return (
    <div className="qc-complete-container">
      {/* 양심 문구 오버레이 */}
      {showMsg && (
        <div className="qc-conscience">
          <p>"아무것도 하지 않은 자는 변화가 없다."</p>
        </div>
      )}

      {/* 헤더 */}
      <div className="qc-complete-header">
        <button className="qc-back" onClick={() => navigate("/main")}>
          ← 뒤로
        </button>
        <h2>퀘스트 인증</h2>
        <div />
      </div>

      {/* 퀘스트 정보 */}
      <div className="qc-complete-info">
        <span className={`qc-stat-badge stat-${quest.statType?.toLowerCase()}`}>
          {quest.statType}
        </span>
        <p className="qc-complete-title">{quest.title}</p>
      </div>

      {/* 인증 방식별 UI */}
      <div className="qc-complete-body">
        {/* ── 체크 ── */}
        {quest.verifyType === "CHECK" && (
          <div className="qc-check-area">
            <div className="qc-check-icon">✓</div>
            <p>완료 버튼을 눌러 퀘스트를 완료하세요.</p>
          </div>
        )}

        {/* ── 시간 ── */}
        {quest.verifyType === "TIME" && (
          <div className="qc-timer-area">
            {/* 목표 시간 */}
            {quest.targetMinutes && (
              <p className="qc-timer-target">
                목표:{" "}
                {quest.targetMinutes >= 60
                  ? `${Math.floor(quest.targetMinutes / 60)}시간 ${quest.targetMinutes % 60 > 0 ? (quest.targetMinutes % 60) + "분" : ""}`
                  : `${quest.targetMinutes}분`}
              </p>
            )}

            {/* 타이머 */}
            <div className={`qc-timer-display ${timerDone ? "done" : ""}`}>
              {formatTime(timerSec)}
            </div>

            {/* 진행 바 */}
            {targetProgress !== null && (
              <div className="qc-timer-progress">
                <div
                  className="qc-timer-progress-fill"
                  style={{ width: `${targetProgress}%` }}
                />
              </div>
            )}
            {timerDone && <p className="qc-timer-done-msg">🎉 목표 달성!</p>}

            {/* 버튼 */}
            <div className="qc-timer-btns">
              {!timerRunning && !timerDone && (
                <button className="qc-timer-btn start" onClick={startTimer}>
                  ▶ 시작
                </button>
              )}
              {timerRunning && (
                <button className="qc-timer-btn pause" onClick={pauseTimer}>
                  ⏸ 일시정지
                </button>
              )}
              {(timerRunning || timerSec > 0) && !timerDone && (
                <button className="qc-timer-btn stop" onClick={stopTimer}>
                  ⏹ 정지
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── 사진 ── */}
        {quest.verifyType === "PHOTO" && (
          <div className="qc-photo-area">
            {/* 인증 방법 안내 */}
            <div className="qc-photo-guide">
              <p className="qc-photo-guide-title">📋 사진 인증 방법</p>
              <ul className="qc-photo-guide-list">
                <li>퀘스트 완료를 증명하는 사진을 업로드하세요.</li>
                <li>본인만 열람 가능한 개인 기록용입니다.</li>
                <li>사진 없이는 완료할 수 없습니다.</li>
                <li>아무것도 하지 않은 자는 변화가 없습니다. 🗡️</li>
              </ul>
            </div>
            {preview ? (
              <div className="qc-photo-preview-wrap">
                <img
                  src={preview}
                  alt="인증 사진"
                  className="qc-photo-preview"
                />
                <button
                  className="qc-photo-retake"
                  onClick={() => {
                    setPhoto(null);
                    setPreview(null);
                  }}
                >
                  다시 찍기
                </button>
              </div>
            ) : (
              <div className="qc-photo-btns">
                <button
                  className="qc-photo-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  📷 사진 찍기
                </button>
                <button
                  className="qc-photo-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  🖼 갤러리에서 선택
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handlePhotoChange}
                />
              </div>
            )}
            {!photo && (
              <p className="qc-photo-hint">
                사진을 업로드해야 완료할 수 있습니다.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 완료 버튼 */}
      <div className="qc-complete-footer">
        <button
          className={`qc-complete-btn ${!canComplete() ? "disabled" : ""}`}
          onClick={handleComplete}
          disabled={!canComplete() || loading}
        >
          {loading ? "처리 중..." : "완료하기"}
        </button>
      </div>
    </div>
  );
};

export default QuestComplete;
