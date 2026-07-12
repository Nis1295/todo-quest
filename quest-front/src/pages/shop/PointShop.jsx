import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./Shop.css";

// 슬롯 확장 상품 목록
const SLOT_PRODUCTS = [
  {
    period: "DAILY",
    label: "일간 슬롯",
    icon: "☀️",
    base: 10,
    max: 20,
    costs: [500, 1000, 2000, 3000, 4500, 6500, 9500, 14000, 20000, 30000],
  },
  {
    period: "WEEKLY",
    label: "주간 슬롯",
    icon: "📅",
    base: 5,
    max: 8,
    costs: [1000, 2000, 4000],
  },
  {
    period: "MONTHLY",
    label: "월간 슬롯",
    icon: "🌙",
    base: 3,
    max: 5,
    costs: [2000, 4000],
  },
  {
    period: "YEARLY",
    label: "버킷리스트 슬롯",
    icon: "🏆",
    base: 1,
    max: 2,
    costs: [5000],
  },
];

const PointShop = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [slotInfo, setSlotInfo] = useState({});
  const [userPoint, setUserPoint] = useState(0);
  const [loading, setLoading] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      // 유저 포인트 조회
      const statsRes = await axiosInstance.get(`/api/stats/${userId}`);
      setUserPoint(statsRes.data.totalPoint);

      // 각 기간별 슬롯 현황 조회
      const results = {};
      for (const p of SLOT_PRODUCTS) {
        const res = await axiosInstance.get(
          `/api/slots/${userId}?period=${p.period}`,
        );
        results[p.period] = res.data;
      }
      setSlotInfo(results);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpgrade = async (period) => {
    setLoading(period);
    setMsg("");
    try {
      const res = await axiosInstance.post("/api/slots/upgrade", {
        userId: parseInt(userId),
        period,
      });
      setMsg(res.data.message);
      fetchAll();
    } catch (err) {
      setMsg(err.response?.data?.message || "오류가 발생했습니다.");
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="shop-container">
      <div className="shop-header">
        <button className="shop-back" onClick={() => navigate(-1)}>
          ← 뒤로
        </button>
        <h2>💰 포인트 상점</h2>
        <div />
      </div>

      {/* 보유 포인트 */}
      <div className="shop-point-bar">
        <span>보유 포인트</span>
        <span className="shop-point-val">
          💰 {userPoint.toLocaleString()} pt
        </span>
      </div>

      <div className="shop-content">
        {SLOT_PRODUCTS.map((p) => {
          const info = slotInfo[p.period];
          const current = info?.currentSlot ?? p.base;
          const nextCost = info?.nextCost ?? `${p.costs[0]} 포인트`;
          const isMax = nextCost === "최대 슬롯 도달";

          return (
            <div key={p.period} className="shop-slot-card">
              <div className="shop-slot-top">
                <span className="shop-slot-icon">{p.icon}</span>
                <div>
                  <p className="shop-slot-label">{p.label}</p>
                  <p className="shop-slot-current">
                    현재 {current}개 / 최대 {p.max}개
                  </p>
                </div>
                <div className="shop-slot-bar-wrap">
                  <div className="shop-slot-bar">
                    <div
                      className="shop-slot-fill"
                      style={{ width: `${(current / p.max) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                className={`shop-upgrade-btn ${isMax ? "disabled" : ""}`}
                onClick={() => !isMax && handleUpgrade(p.period)}
                disabled={!!loading || isMax}
              >
                {loading === p.period
                  ? "구매 중..."
                  : isMax
                    ? "✅ 최대 확장 완료"
                    : `슬롯 +1 · ${nextCost}`}
              </button>
            </div>
          );
        })}

        {msg && <p className="shop-msg">{msg}</p>}
      </div>
    </div>
  );
};

export default PointShop;
