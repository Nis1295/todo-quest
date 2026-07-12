import { useNavigate } from "react-router-dom";

export default function SideDrawer({
  isOpen,
  onClose,
  userProfile,
  isEditingNickname,
  editNicknameValue,
  setEditNicknameValue,
  handleStartEditNickname,
  handleSaveNickname,
  
}) {
  const navigate = useNavigate();

  return (
    <div
      className={`side-drawer-overlay ${isOpen ? "open" : ""}`}
      onClick={onClose}
    >
      <div className="side-drawer" onClick={(e) => e.stopPropagation()}>
        {/* 🌟 닫기(X) 버튼을 사이드 드로어 최상단 우측 레이어로 독립 배치 */}
        <button className="drawer-top-right-close-btn" onClick={onClose}>
          ✕
        </button>

        {/* 드로어 상단 프로필 대시보드 (이미지 왼쪽, 텍스트 오른쪽 가로 배치) */}
        <div className="drawer-profile-screen">
          {/* 1. 왼쪽: 아바타 이미지 구역 */}
          <div className="drawer-avatar-relative-container">
            <div
              className="avatar-frame"
              onClick={() => {
                onClose();
                navigate("/profile");
              }}
            >
              {userProfile.profileImage ? (
                <img
                  src={userProfile.profileImage}
                  alt="유저 아바타"
                  className="avatar-img"
                />
              ) : (
                <div className="avatar-fallback">⚔️</div>
              )}
            </div>
            <div
              className="avatar-edit-pencil-badge"
              onClick={() => {
                onClose();
                navigate("/profile");
              }}
            >
              ✏️
            </div>
          </div>

          {/* 2. 오른쪽: 닉네임, 레벨, 포인트 정보 가로 정렬 배치 구역 */}
          <div className="profile-details">
            <div className="nickname-row-edit">
              {isEditingNickname ? (
                <div className="inline-input-group">
                  <input
                    className="drawer-inline-input"
                    value={editNicknameValue}
                    onChange={(e) => setEditNicknameValue(e.target.value)}
                    maxLength={15}
                  />
                  <button
                    className="nickname-save-small-btn"
                    onClick={handleSaveNickname}
                  >
                    저장
                  </button>
                </div>
              ) : (
                <div
                  className="nickname-display-flex-wrapper"
                  onClick={handleStartEditNickname}
                  style={{ cursor: "pointer" }}
                >
                  <span className="drawer-nickname-txt">
                    {userProfile.nickname}
                  </span>
                  <span className="edit-pencil-icon-txt">✏️</span>
                </div>
              )}
              {userProfile.isGuest && (
                <span className="guest-badge-tag">게스트</span>
              )}
            </div>

            {/* Lv.25 와 441 pt 정보 노출 정렬 */}
            <p className="drawer-user-lv">Lv.{userProfile.mainLevel}</p>
            <p className="drawer-user-pts">
              🪙 {userProfile?.totalPoint?.toLocaleString() ?? 0} pt
            </p>
          </div>
        </div>

        {/* 게스트 계정 연동하기 배너 */}
        {userProfile.isGuest && (
          <div
            className="guest-link-banner"
            onClick={() => navigate("/signup")}
          >
            ⚠️ 게스트 계정입니다. 데이터 보호를 위해 계정을 연동해 주세요!
          </div>
        )}

        {/* 메뉴 구성 리스트 */}
        <ul className="drawer-menu-list">
          <li
            onClick={() => {
              onClose();
              navigate("/profile");
            }}
          >
            👤 내 정보 / 활동기록
          </li>
          <li
            onClick={() => {
              onClose();
              navigate("/rpg");
            }}
          >
            📊 RPG 상태창 대시보드
          </li>
          <li
            onClick={() => {
              onClose();
              navigate("/ranking");
            }}
          >
            🏆 글로벌 랭킹 순위
          </li>
          <li
            onClick={() => {
              onClose();
              navigate("/Logs");
            }}
          >
            📊 활동 기록
          </li>
          <li
            onClick={() => {
              onClose();
              navigate("/AdShop");
            }}
          >
            🛒 광고 상점
          </li>
          <li
            onClick={() => {
              onClose();
              navigate("/PointShop");
            }}
          >
            🛒 포인트 상점
          </li>
          <li className="menu-item-disabled">
            ⚙️ 설정 (폰트/알림/Google연동/악세사리 - 준비중)
          </li>
          <li
            className="logout"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
          >
            🔓 로그아웃
          </li>
        </ul>
      </div>
    </div>
  );
}
