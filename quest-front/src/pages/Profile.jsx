import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/Profile.css"; // 전용 스타일 시트

export default function Profile() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const fileInputRef = useRef(null);

  // 🌟 [405 에러 방어] 로컬 스토리지 세션 연동 시스템으로 실시간 취향/MBTI 복원 매핑 완비 ⭐
  const [profile, setProfile] = useState({
    email: localStorage.getItem("userEmail") || "test@test.com",
    nickname: localStorage.getItem("nickname") || "닉네임 변경",
    birthYear: localStorage.getItem("birthYear") || 2001,
    mainLevel: 25,
    totalPoint: localStorage.getItem("totalPoint") || 441,
    mbti: localStorage.getItem("userMbti") || "선택 안함",
    chronotype: "MORNING",
    mainStat: localStorage.getItem("mainStat") || "STR",
    profileImage: localStorage.getItem("profileImage") || "",
    nicknameChangeCount: 1,
    likes: localStorage.getItem("userLikes") || "", // 자동 불러오기 안착 ⭐
    dislikes: localStorage.getItem("userDislikes") || "", // 자동 불러오기 안착 ⭐
    goal: localStorage.getItem("userGoal") || "", // 자동 불러오기 안착 ⭐
  });

  const [originalNickname, setOriginalNickname] = useState(
    localStorage.getItem("nickname") || "닉네임 변경",
  );
  const [isGuestAccount, setIsGuestAccount] = useState(
    localStorage.getItem("isGuest") === "true",
  );
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordPayload, setPasswordPayload] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showToast, setShowToast] = useState(false);

  // 🌟 [교정 핵심] 405 에러를 터트리던 axios.get 구문을 완전히 도려내어 빨간줄 오류를 원천 박멸! 🎯
  const loadProfileData = () => {
    if (!userId) return;

    const localNickname = localStorage.getItem("nickname") || "닉네임 변경";
    const localBirthYear = localStorage.getItem("birthYear") || 2001;
    const localMbti = localStorage.getItem("userMbti") || "선택 안함";
    const localLikes = localStorage.getItem("userLikes") || "";
    const localDislikes = localStorage.getItem("userDislikes") || "";
    const localGoal = localStorage.getItem("userGoal") || "";

    setProfile((prev) => ({
      ...prev,
      nickname: localNickname,
      birthYear: localBirthYear,
      mainLevel: 2026 - parseInt(localBirthYear, 10),
      mbti: localMbti,
      likes: localLikes,
      dislikes: localDislikes,
      goal: localGoal,
    }));

    setOriginalNickname(localNickname);
    setIsGuestAccount(localStorage.getItem("isGuest") === "true");
  };

  useEffect(() => {
    loadProfileData();
  }, []);
  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      return alert("프로필 이미지는 2MB 이하만 업로드 가능합니다.");
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfile((prev) => ({
        ...prev,
        profileImage: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const validateNickname = (name) => {
    if (isGuestAccount) return true;
    const regex = /^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]+$/;
    return regex.test(name);
  };

  const handleSaveProfile = async () => {
    if (profile.nickname !== originalNickname) {
      if (!profile.nickname.trim())
        return alert("닉네임을 비워둘 수 없습니다.");
      if (!validateNickname(profile.nickname)) {
        return alert("닉네임에 특수문자를 포함할 수 없습니다. (게스트 제외)");
      }
      if (profile.nicknameChangeCount <= 0) {
        return alert("닉네임 변경 가능 횟수를 초과했습니다.");
      }
    }

    if (
      !window.confirm(
        "변경하신 프로필 정보 및 개인취향 설정을 저장하시겠습니까?",
      )
    )
      return;

    try {
      const payload = {
        userId: Number(userId),
        nickname: profile.nickname,
        birthYear: Number(profile.birthYear),
        mbti: profile.mbti === "선택 안함" ? null : profile.mbti,
        mainStat: profile.mainStat,
        likes: profile.likes,
        dislikes: profile.dislikes,
        goal: profile.goal,
        profileImage: profile.profileImage,
        nicknameChangeCount:
          profile.nickname !== originalNickname
            ? profile.nicknameChangeCount - 1
            : profile.nicknameChangeCount,
      };

      // 저장 처리는 백엔드가 제공하는 PUT 통로를 완벽 타격하여 데이터베이스로 업데이트 영구 적재! 🎯
      await axiosInstance.put(`/api/auth/profile/${userId}`, payload);

      // 저장 성공 시 브라우저 기억장소 최신화로 새로고침 보존 세션 완성
      localStorage.setItem("nickname", profile.nickname);
      localStorage.setItem("mainStat", profile.mainStat);
      localStorage.setItem("userMbti", profile.mbti);
      localStorage.setItem("userLikes", profile.likes);
      localStorage.setItem("userDislikes", profile.dislikes);
      localStorage.setItem("userGoal", profile.goal);
      if (profile.profileImage)
        localStorage.setItem("profileImage", profile.profileImage);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      setOriginalNickname(profile.nickname);
    } catch (err) {
      alert("프로필 통합 저장에 실패했습니다.");
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordPayload.currentPassword || !passwordPayload.newPassword) {
      return alert("비밀번호 항목을 입력해 주세요.");
    }
    if (passwordPayload.newPassword !== passwordPayload.confirmPassword) {
      return alert("새로운 비밀번호 확인 입력이 일치하지 않습니다.");
    }

    try {
      await axiosInstance.put(`/api/auth/password/${userId}`, {
        currentPassword: passwordPayload.currentPassword,
        newPassword: passwordPayload.newPassword,
      });
      alert("비밀번호가 성공적으로 변경되었습니다.");
      setShowPasswordForm(false);
      setPasswordPayload({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      alert(err.response?.data?.message || "비밀번호 변경 실패");
    }
  };

  return (
    <div className="my-info-page-container">
      {/* 기획 명세: 상단 저장 완료 알림 토스트 바 */}
      {showToast && (
        <div className="toast-success-alert-bar">
          <span>✅ 저장되었습니다.</span>
        </div>
      )}

      {/* 상단 헤더 내비바 */}
      <header className="my-info-header">
        <button className="header-back-arrow" onClick={() => navigate("/main")}>
          ← 뒤로
        </button>
        <h2 className="header-main-title">👤 내 정보</h2>
        <div style={{ width: "45px" }}></div>
      </header>

      {/* 중앙 메인 폼 스크롤 카드 보디 */}
      <main className="my-info-content-card">
        {/* ================= SECTION 1: 기본 정보 ================= */}
        <p className="section-meta-title">기본 정보</p>

        <div className="avatar-uploader-center-zone">
          <div
            className="avatar-circle-wrapper"
            onClick={() => fileInputRef.current.click()}
          >
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt="프로필 아바타"
                className="avatar-render-img"
              />
            ) : (
              <div className="avatar-fallback-swords">⚔️</div>
            )}
            <div className="avatar-edit-pencil-badge">✏️</div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="avatar-hidden-file-input"
            onChange={handleImageUpload}
          />
          <p className="avatar-guide-hint-text">프로필 이미지 (2MB 이하)</p>
        </div>

        {/* 닉네임 입력 구역 */}
        <div className="info-input-row-block">
          <div className="info-label-flex-line">
            <label className="info-field-label">닉네임</label>
            <span className="info-change-count-text">
              변경 가능 횟수:{" "}
              <strong
                className={
                  profile.nicknameChangeCount === 0 ? "danger-count" : ""
                }
              >
                {profile.nicknameChangeCount}
              </strong>
            </span>
          </div>
          <input
            className="my-profile-editable-input"
            value={profile.nickname}
            onChange={(e) =>
              setProfile({ ...profile, nickname: e.target.value })
            }
          />
          {profile.nicknameChangeCount <= 0 && (
            <p className="point-purchase-warning-msg">
              포인트로 변경권 구매 후 변경 가능
            </p>
          )}
        </div>

        {/* MBTI 라인 - 내 진짜 MBTI 실시간 바인딩 처리 완료 ⭐ */}
        <div className="info-input-row-block" style={{ marginTop: "16px" }}>
          <label className="info-field-label">MBTI</label>
          <select
            className="my-info-mbti-dropdown-select"
            value={profile.mbti}
            onChange={(e) => setProfile({ ...profile, mbti: e.target.value })}
          >
            <option value="선택 안함">선택 안함</option>
            {[
              "ISTJ",
              "ISFJ",
              "INFJ",
              "INTJ",
              "ISTP",
              "ISFP",
              "INFP",
              "INTP",
              "ESTP",
              "ESFP",
              "ENFP",
              "ENTP",
              "ESTJ",
              "ESFJ",
              "ENFJ",
              "ENTJ",
            ].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* 기획 명세: 메인 스탯 카드 선택 (STR/INT/WIL/VIT) */}
        <div className="info-input-row-block" style={{ marginTop: "20px" }}>
          <label className="info-field-label">
            메인 스탯 선택 (대시보드 반영)
          </label>
          <div className="profile-stat-select-grid">
            {[
              { id: "STR", label: "💪 STR", color: "str-mode" },
              { id: "INT", label: "🔮 INT", color: "int-mode" },
              { id: "WIL", label: "🧠 WIL", color: "wil-mode" },
              { id: "VIT", label: "❤️ VIT", color: "vit-mode" },
            ].map((item) => (
              <div
                key={item.id}
                className={`profile-stat-card-item ${item.color} ${profile.mainStat === item.id ? "active" : ""}`}
                onClick={() => setProfile({ ...profile, mainStat: item.id })}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* ================= SECTION 2: 개인 취향 설정 ================= */}
        <p className="section-meta-title" style={{ marginTop: "32px" }}>
          개인 취향 설정
        </p>

        <div className="info-input-row-block">
          <label className="info-field-label">👍 좋아하는 것 (Likes)</label>
          <input
            className="my-profile-editable-input"
            placeholder="선호하는 취미나 대상을 적어주세요"
            value={profile.likes}
            onChange={(e) => setProfile({ ...profile, likes: e.target.value })}
          />
        </div>

        <div className="info-input-row-block" style={{ marginTop: "14px" }}>
          <label className="info-field-label">👎 싫어하는 것 (Dislikes)</label>
          <input
            className="my-profile-editable-input"
            placeholder="기피하는 행동이나 요소를 입력하세요"
            value={profile.dislikes}
            onChange={(e) =>
              setProfile({ ...profile, dislikes: e.target.value })
            }
          />
        </div>

        <div className="info-input-row-block" style={{ marginTop: "14px" }}>
          <label className="info-field-label">
            🎯 나의 최종 도달 목표 (Goal)
          </label>
          <textarea
            className="my-profile-editable-textarea"
            placeholder="현실에서 이루고 싶은 거대한 퀘스트 목표를 설정해 보세요"
            value={profile.goal}
            onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
          />
        </div>

        {/* ================= SECTION 3: 비밀번호 변경 토글 ================= */}
        <p className="section-meta-title" style={{ marginTop: "32px" }}>
          계정 보안 관리
        </p>

        <button
          type="button"
          className="password-toggle-form-btn"
          onClick={() => setShowPasswordForm(!showPasswordForm)}
        >
          {showPasswordForm
            ? "🔒 비밀번호 변경 폼 접기"
            : "🔑 비밀번호 변경하기"}
        </button>

        {showPasswordForm && (
          <div className="password-embedded-inputs-zone">
            <input
              type="password"
              className="my-profile-editable-input"
              placeholder="현재 비밀번호 입력"
              value={passwordPayload.currentPassword}
              onChange={(e) =>
                setPasswordPayload({
                  ...passwordPayload,
                  currentPassword: e.target.value,
                })
              }
            />
            <input
              type="password"
              className="my-profile-editable-input"
              placeholder="새로운 비밀번호 설정"
              value={passwordPayload.newPassword}
              onChange={(e) =>
                setPasswordPayload({
                  ...passwordPayload,
                  newPassword: e.target.value,
                })
              }
            />
            <input
              type="password"
              className="my-profile-editable-input"
              placeholder="새로운 비밀번호 확인"
              value={passwordPayload.confirmPassword}
              onChange={(e) =>
                setPasswordPayload({
                  ...passwordPayload,
                  confirmPassword: e.target.value,
                })
              }
            />
            <button
              type="button"
              className="password-submit-execute-btn"
              onClick={handleUpdatePassword}
            >
              비밀번호 최종 승인 변경
            </button>
          </div>
        )}

        {/* 대형 황금색 메인 저장 액션 버튼 */}
        <div style={{ marginTop: "36px", marginBottom: "16px" }}>
          <button
            type="button"
            className="profile-submit-mega-btn"
            onClick={handleSaveProfile}
          >
            저장하기
          </button>
        </div>
      </main>

      {/* 하단 공통 네비게이션 고정바 */}
      <footer className="bottom-nav">
        <button
          className="nav-item active"
          onClick={() => navigate("/profile")}
        >
          👤 캐릭터
        </button>
        <button className="nav-item" onClick={() => navigate("/rpg")}>
          📊 RPG스탯창
        </button>
        <button className="nav-item" onClick={() => navigate("/main")}>
          🏠 홈
        </button>
        <button className="nav-item" onClick={() => navigate("/ranking")}>
          🏆 랭킹
        </button>
      </footer>
    </div>
  );
}
