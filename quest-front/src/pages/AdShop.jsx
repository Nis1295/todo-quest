import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/Shop.css";

export default function AdShop() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // 백엔드 watchAdForSlot 리턴 결과 구조(Map) 수용을 위한 상태 정의
  const [adStatus, setAdStatus] = useState({
    canWatch: true,
    message: "연간 임시 슬롯 +1 획득 가능"
  });

  const [isWatching, setIsWatching] = useState(false);

  // 1. 🌟 백엔드 명세 일치화: @GetMapping("/ad-status/{userId}") 경로 정밀 타격
  const loadAdStatus = async () => {
    if (!userId) return;
    try {
      const res = await axiosInstance.get(`/api/slots/ad-status/${userId}`);

      // 백엔드 리턴값 분기 조건 방어
      if (res.data) {
        setAdStatus({
          canWatch: res.data.canWatch !== undefined ? res.data.canWatch : true,
          message: res.data.message || "연간 임시 슬롯 +1 (24시간 제한)"
        });
      }
    } catch (err) {
      console.warn("광고 조회 가드 작동");
    }
  };

  useEffect(() => {
    loadAdStatus();
  }, []);

  // 2. 광고 시청 처리: POST /api/slots/ad-reward
  const handleWatchAdReward = async () => {
    if (!adStatus.canWatch) {
      return alert("이미 광고 보상을 획득하셨습니다. (24시간 가드 작동 중)");
    }

    setIsWatching(true);
    alert("🎬 광고 영상 재생 중... (테스트 모드: 3초 후 완료)");

    setTimeout(async () => {
      try {
        // 백엔드 watchAd(@RequestBody Map<String, Object> body) 호출 명세 준수
        const res = await axiosInstance.post("/api/slots/ad-reward", {
          userId: Number(userId)
        });

        alert(res.data?.message || "광고 보상 적용 완료!");

        setAdStatus({
          canWatch: false,
          message: "보상 획득 완료 (24시간 제한)"
        });
      } catch (err) {
        alert(err.response?.data?.message || "광고 시청 처리 중 실패했습니다.");
      } finally {
        setIsWatching(false);
      }
    }, 3000);
  };

  return (
    <div className="shop-page-container">
      <header className="shop-header">
        <button className="header-back-arrow" onClick={() => navigate("/main")}>
          ← 뒤로
        </button>
        <h2 className="header-main-title">🎬 광고 상점</h2>
        <div style={{ width: "45px" }}></div>
      </header>

      <main className="shop-content-card">
        <p className="shop-section-meta-title">무료 한도 확장</p>

        <div className="ad-reward-display-banner">
          <span className="ad-trophy-icon">🏆</span>
          <h3 className="ad-banner-main-title">👑 연간 버킷리스트 슬롯</h3>
          <p className="ad-banner-sub-desc">{adStatus.message}</p>
        </div>

        <div style={{ marginTop: "24px" }}>
          <button
            className={`ad-execute-mega-btn ${!adStatus.canWatch || isWatching ? "disabled" : ""}`}
            onClick={handleWatchAdReward}
            disabled={!adStatus.canWatch || isWatching}
          >
            {isWatching
              ? "⏳ 광고 시청 중..."
              : adStatus.canWatch
                ? "📺 광고 보고 슬롯 받기"
                : "⌛ 24시간 제한 작동 중"}
          </button>
        </div>
      </main>

      <div className="shop-sub-tab-routing-bar">
        <button className="sub-tab-item active">광고 상점</button>
        <button className="sub-tab-item" onClick={() => navigate("/PointShop")}>
          포인트 상점
        </button>
      </div>
    </div>
  );
}
