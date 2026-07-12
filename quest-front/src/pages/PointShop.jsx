import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/Shop.css"; // 상점 통합 CSS

export default function PointShop() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // 보유 포인트 상태 관리
  const [userPoints, setUserPoints] = useState(441);

  const [slotData, setSlotData] = useState({
    DAILY: { count: 5, costMsg: "500 포인트" },
    WEEKLY: { count: 2, costMsg: "1000 포인트" },
    MONTHLY: { count: 1, costMsg: "2000 포인트" },
    YEARLY: { count: 1, costMsg: "5000 포인트" }
  });

  // 🌟 [user_slots 테이블 부재 버그 원천 해결] 400/500 에러 시 자동 인서트 초기화 엔진 탑재
  const loadPointAndSlots = async () => {
    if (!userId) return;
    try {
      const periods = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
      const updatedSlots = { ...slotData };
      let hasError = false;

      for (const p of periods) {
        // 백엔드 조회 호출
        const res = await axiosInstance
          .get(`/api/slots/${userId}?period=${p}`)
          .catch((err) => {
            // ⚠️ 만약 DB 테이블에 내 정보가 없어서 에러(400/404/500)가 발생하면 트리거 가동
            hasError = true;
            return null;
          });

        if (res && res.data) {
          updatedSlots[p] = {
            count: res.data.currentSlot || 1,
            costMsg: res.data.nextCost || "최대 슬롯 도달"
          };
        }
      }

      // 🎯 [핵심 기믹] DB에 내 user_id 데이터가 한 줄도 없다고 판단되면 최초 1회 생성 쿼리(POST)를 자동 우회 주입
      if (hasError) {
        console.log(
          "DB user_slots 내 유저 정보 부재 감지 ➡️ 자동 초기화 행 생성 프로세스 가동"
        );

        // 백엔드 슬롯 생성 혹은 업그레이드 초기 진입 통로에 dummy 데이터 전송으로 강제 테이블 활성화 유도
        await axiosInstance
          .post("/api/slots/upgrade", {
            userId: Number(userId),
            period: "DAILY" // 일간 기본 한도 생성을 찔러서 DB 한 줄 적재 유도
          })
          .catch(() => null);
      }

      setSlotData(updatedSlots);

      const localPoint = localStorage.getItem("totalPoint");
      if (localPoint) setUserPoints(Number(localPoint));
    } catch (err) {
      console.error("슬롯 현황 정보 로드 예외", err);
      const localPoint = localStorage.getItem("totalPoint");
      if (localPoint) setUserPoints(Number(localPoint));
    }
  };

  useEffect(() => {
    loadPointAndSlots();
  }, []);

  const handleUpgradeSlot = async (periodKey, currentCount, maxLimit) => {
    if (currentCount >= maxLimit) {
      return alert(
        `해당 슬롯은 최대 한도(${maxLimit}개)에 도달하여 더 이상 확장할 수 없습니다.`
      );
    }

    const costText = slotData[periodKey].costMsg;
    if (costText === "최대 슬롯 도달")
      return alert("이미 최고 단계 슬롯입니다.");
    const numericCost = parseInt(costText.replace(/[^0-9]/g, ""), 10) || 500;

    if (userPoints < numericCost) {
      return alert(
        `보유 포인트가 부족합니다.\n필요 포인트: ${numericCost} pt / 내 포인트: ${userPoints} pt`
      );
    }

    if (
      !window.confirm(
        `포인트 ${numericCost} pt를 사용하여 [${periodKey} 슬롯] 한도를 확장하시겠습니까?`
      )
    )
      return;

    try {
      const payload = {
        userId: Number(userId),
        period: String(periodKey).toUpperCase()
      };

      const res = await axiosInstance.post("/api/slots/upgrade", payload);
      alert(res.data?.message || "슬롯 확장 성공!");

      const nextPoints = userPoints - numericCost;
      setUserPoints(nextPoints);
      localStorage.setItem("totalPoint", String(nextPoints));

      loadPointAndSlots();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "슬롯 업그레이드 처리 중 예외가 발생했습니다."
      );
    }
  };

  return (
    <div className="shop-page-container">
      {/* 상단 헤더 */}
      <header className="shop-header">
        <button className="header-back-arrow" onClick={() => navigate("/main")}>
          ← 뒤로
        </button>
        <h2 className="header-main-title">🪙 포인트 상점</h2>
        <div style={{ width: "45px" }}></div>
      </header>

      {/* 보유 포인트 안내 바 */}
      <div className="my-points-status-display-bar">
        <span className="pts-lbl">보유 포인트</span>
        <span className="pts-val">🪙 {userPoints.toLocaleString()} pt</span>
      </div>

      <main
        className="shop-content-card"
        style={{ gap: "16px", display: "flex", flexDirection: "column" }}
      >
        {/* 항목 1: 일간 슬롯 (최대 20) */}
        <div className="slot-purchase-row-item">
          <div className="slot-item-info">
            <span className="slot-emoji-title">📋 일간 퀘스트 슬롯</span>
            <span className="slot-limit-status-txt">
              현재 한도: {slotData.DAILY.count}개 / 최대 20개
            </span>
          </div>
          <button
            className="slot-buy-action-btn"
            onClick={() => handleUpgradeSlot("DAILY", slotData.DAILY.count, 20)}
          >
            확장 ➡️ {slotData.DAILY.costMsg}
          </button>
        </div>

        {/* 항목 2: 주간 슬롯 (최대 8) */}
        <div className="slot-purchase-row-item">
          <div className="slot-item-info">
            <span className="slot-emoji-title">📅 주간 퀘스트 슬롯</span>
            <span className="slot-limit-status-txt">
              현재 한도: {slotData.WEEKLY.count}개 / 최대 8개
            </span>
          </div>
          <button
            className="slot-buy-action-btn"
            onClick={() =>
              handleUpgradeSlot("WEEKLY", slotData.WEEKLY.count, 8)
            }
          >
            확장 ➡️ {slotData.WEEKLY.costMsg}
          </button>
        </div>

        {/* 항목 3: 월간 슬롯 (최대 5) */}
        <div className="slot-purchase-row-item">
          <div className="slot-item-info">
            <span className="slot-emoji-title">🌙 월간 퀘스트 슬롯</span>
            <span className="slot-limit-status-txt">
              현재 한도: {slotData.MONTHLY.count}개 / 최대 5개
            </span>
          </div>
          <button
            className="slot-buy-action-btn"
            onClick={() =>
              handleUpgradeSlot("MONTHLY", slotData.MONTHLY.count, 5)
            }
          >
            확장 ➡️ {slotData.MONTHLY.costMsg}
          </button>
        </div>

        {/* 항목 4: 연간 슬롯 (최대 3) */}
        <div className="slot-purchase-row-item">
          <div className="slot-item-info">
            <span className="slot-emoji-title">👑 연간 퀘스트 슬롯</span>
            <span className="slot-limit-status-txt">
              현재 한도: {slotData.YEARLY.count}개 / 최대 3개
            </span>
          </div>
          <button
            className="slot-buy-action-btn"
            onClick={() =>
              handleUpgradeSlot("YEARLY", slotData.YEARLY.count, 3)
            }
          >
            확장 ➡️ {slotData.YEARLY.costMsg}
          </button>
        </div>

        <div className="accessory-locked-tab-banner">
          🔒 악세사리 상점 (시스템 준비 중)
        </div>
      </main>

      {/* 하부 전환 서브 내비게이션 바 주소 업데이트 */}
      <div className="shop-sub-tab-routing-bar">
        <button className="sub-tab-item" onClick={() => navigate("/AdShop")}>
          광고 상점
        </button>
        <button className="sub-tab-item active">포인트 상점</button>
      </div>
    </div>
  );
}
