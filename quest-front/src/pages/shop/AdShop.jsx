import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./Shop.css";

const AdShop = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await axiosInstance.get(`/api/slots/ad-status/${userId}`);
      setStatus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWatchAd = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await axiosInstance.post("/api/slots/ad-reward", {
        userId: parseInt(userId),
      });
      setMsg(res.data.message);
      fetchStatus();
    } catch (err) {
      setMsg(err.response?.data?.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-container">
      <div className="shop-header">
        <button className="shop-back" onClick={() => navigate(-1)}>
          ← 뒤로
        </button>
        <h2>🎬 광고 상점</h2>
        <div />
      </div>

      <div className="shop-content">
        {/* 상품 카드 */}
        <div className="shop-card">
          <div className="shop-card-icon">🏆</div>
          <div className="shop-card-info">
            <p className="shop-card-title">버킷리스트 슬롯 +1</p>
            <p className="shop-card-desc">
              24시간 임시 슬롯 · 1회성 · 1년 후 다시 활성화
            </p>
          </div>
        </div>

        {/* 상태 표시 */}
        {status && (
          <div className="shop-status-box">
            {status.tempSlotActive && (
              <p className="shop-status active">
                ✅ 임시 슬롯 활성 중
                <br />
                <span>
                  만료: {new Date(status.expiresAt).toLocaleString("ko-KR")}
                </span>
              </p>
            )}
            {!status.available && !status.tempSlotActive && (
              <p className="shop-status used">
                이미 사용됨 · 다음 가능일: {status.nextAdAvailable}
              </p>
            )}
          </div>
        )}

        {/* 광고 보기 버튼 */}
        <button
          className={`shop-btn ${!status?.available ? "disabled" : ""}`}
          onClick={handleWatchAd}
          disabled={loading || !status?.available}
        >
          {loading
            ? "광고 재생 중..."
            : status?.available
              ? "🎬 광고 보고 슬롯 받기"
              : "사용 불가"}
        </button>
        <p className="shop-btn-notice">1회성 · 1년 후 다시 활성화</p>

        {msg && <p className="shop-msg">{msg}</p>}
      </div>
    </div>
  );
};

export default AdShop;
