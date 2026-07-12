import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SideDrawer.css";

const SideDrawer = ({ isOpen, onClose, userInfo }) => {
  const navigate = useNavigate();
  const isGuest = localStorage.getItem("isGuest") === "true";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.clear();
    onClose();
    navigate("/login");
  };

  const go = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <div
        className={`drawer-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
      />

      <div className={`drawer ${isOpen ? "open" : ""}`}>
        <button className="drawer-close" onClick={onClose}>
          ✕
        </button>

        {/* 프로필 */}
        <div className="drawer-profile">
          <div className="drawer-avatar">⚔️</div>
          <div className="drawer-user-info">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p className="drawer-nickname">
                {userInfo?.nickname || "모험가"}
              </p>
              {isGuest && <span className="drawer-guest-badge">게스트</span>}
            </div>
            <p className="drawer-level">Lv.{userInfo?.mainLevel || "?"}</p>
            <p className="drawer-point">
              💰 {userInfo?.totalPoint?.toLocaleString() || 0} pt
            </p>
          </div>
        </div>

        {/* 게스트일 때 계정 연동 배너 */}
        {isGuest && (
          <div className="drawer-guest-banner" onClick={() => go("/signup")}>
            <span>🔗 계정 연동하기</span>
            <span className="drawer-item-arrow">›</span>
          </div>
        )}

        <div className="drawer-divider" />

        {/* 메뉴 */}
        <nav className="drawer-nav">
          <button className="drawer-item" onClick={() => go("/rpg")}>
            <span className="drawer-item-icon">⚔️</span>
            <span>RPG 상태창</span>
            <span className="drawer-item-arrow">›</span>
          </button>
          <button className="drawer-item" onClick={() => go("/ranking")}>
            <span className="drawer-item-icon">🏆</span>
            <span>랭킹</span>
            <span className="drawer-item-arrow">›</span>
          </button>
        </nav>

        <div className="drawer-divider" />

        <div className="drawer-section-title">상점</div>
        <nav className="drawer-nav">
          <button className="drawer-item" onClick={() => go("/shop/ad")}>
            <span className="drawer-item-icon">🎬</span>
            <span>광고 상점</span>
            <span className="drawer-item-arrow">›</span>
          </button>
          <button className="drawer-item" onClick={() => go("/shop/point")}>
            <span className="drawer-item-icon">💰</span>
            <span>포인트 상점</span>
            <span className="drawer-item-arrow">›</span>
          </button>
        </nav>

        <div className="drawer-divider" />

        <div className="drawer-section-title">설정</div>
        <nav className="drawer-nav">
          <button className="drawer-item">
            <span className="drawer-item-icon">🔤</span>
            <span>폰트</span>
            <span className="drawer-item-badge">준비중</span>
          </button>
          <button className="drawer-item">
            <span className="drawer-item-icon">🔔</span>
            <span>알림</span>
            <span className="drawer-item-badge">준비중</span>
          </button>
          {/* 구글 소셜 로그인 — 추후 구현 */}
          <button className="drawer-item">
            <span className="drawer-item-icon">🔗</span>
            <span>Google 계정 연동</span>
            <span className="drawer-item-badge">준비중</span>
          </button>
        </nav>

        <div className="drawer-divider" />

        <button className="drawer-logout" onClick={handleLogout}>
          로그아웃
        </button>

        <p className="drawer-version">QUEST v0.4</p>
      </div>
    </>
  );
};

export default SideDrawer;
