import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./Profile.css";

const MBTI_LIST = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
];

const STAT_OPTIONS = [
  { key: "STR", label: "💪 체력", color: "#e74c3c" },
  { key: "INT", label: "📚 지력", color: "#3498db" },
  { key: "WIL", label: "🔥 의지력", color: "#8B5CF6" },
  { key: "VIT", label: "🌿 활력", color: "#2ecc71" },
];

const Profile = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [form, setForm] = useState({
    nickname: "",
    mbti: "",
    chronotype: "MORNING",
    mainStat: "STR",
    likes: "",
    dislikes: "",
    goal: "",
    profileImage: "",
  });
  const [originalNickname, setOriginalNickname] = useState("");
  const [nicknameChangeCount, setNicknameChangeCount] = useState(1);
  const [showPwForm, setShowPwForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    axiosInstance.get(`/api/stats/${userId}`).then((res) => {
      const d = res.data;
      setForm({
        nickname: d.nickname || "",
        mbti: d.mbti || "",
        chronotype: d.chronotype || "MORNING",
        mainStat: localStorage.getItem("mainStat") || "STR",
        likes: d.likes || "",
        dislikes: d.dislikes || "",
        goal: d.goal || "",
        profileImage: d.profileImage || "",
      });
      setOriginalNickname(d.nickname || "");
      setNicknameChangeCount(d.nicknameChangeCount ?? 1);
    });
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSaveClick = () => {
    if (!form.nickname.trim()) {
      setMsg("닉네임을 입력해주세요.");
      return;
    }
    if (form.nickname !== originalNickname) {
      // 닉네임 바꿨을 때만 검사
      if (!/^[a-zA-Z0-9가-힣\s]+$/.test(form.nickname)) {
        setMsg("닉네임에 특수문자는 사용할 수 없습니다.");
        return;
      }
      if (nicknameChangeCount <= 0) {
        setMsg(
          "닉네임 변경 횟수를 모두 사용했습니다. 포인트로 변경권을 구매하세요.",
        );
        return;
      }
      setShowConfirm(true);
    } else {
      doSave();
    }
  };

  console.log(form);
  console.log(form.profileImage);
  const doSave = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await axiosInstance.put(`/api/auth/profile/${userId}`, form);
      localStorage.setItem("profileImage", form.profileImage || "");
      localStorage.setItem("nickname", form.nickname);
      localStorage.setItem("mainStat", form.mainStat);
      setOriginalNickname(form.nickname);
      if (form.nickname !== originalNickname) {
        setNicknameChangeCount((prev) => prev - 1);
      }
      setMsg("✅ 저장되었습니다.");
    } catch (err) {
      setMsg(err.response?.data?.message || "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePwChange = async () => {
    if (pwForm.newPassword !== pwForm.newPasswordConfirm) {
      setPwMsg("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (pwForm.newPassword.length < 4) {
      setPwMsg("새 비밀번호는 4자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.put(`/api/auth/password/${userId}`, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg("✅ 비밀번호가 변경되었습니다.");
      setPwForm({
        currentPassword: "",
        newPassword: "",
        newPasswordConfirm: "",
      });
      setShowPwForm(false);
    } catch (err) {
      setPwMsg(err.response?.data?.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      {/* 닉네임 변경 확인 팝업 */}
      {showConfirm && (
        <div className="profile-confirm-overlay">
          <div className="profile-confirm-box">
            <p className="profile-confirm-title">닉네임 변경</p>
            <p className="profile-confirm-msg">
              닉네임은 <b>1회</b>만 무료 변경 가능합니다.
              <br />
              이후에는 포인트로 변경권을 구매해야 합니다.
              <br />
              <br />
              <b>"{form.nickname}"</b> 으로 변경하시겠습니까?
            </p>
            <div className="profile-confirm-btns">
              <button
                className="profile-confirm-cancel"
                onClick={() => setShowConfirm(false)}
              >
                취소
              </button>
              <button className="profile-confirm-ok" onClick={doSave}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="profile-header">
        <button className="profile-back" onClick={() => navigate(-1)}>
          ← 뒤로
        </button>
        <h2>👤 내 정보</h2>
        <div />
      </div>

      {/* 기본 정보 */}
      <div className="profile-section">
        <p className="profile-section-title">기본 정보</p>

        {/* 프로필 이미지 */}
        <div className="profile-field">
          <label>프로필 이미지</label>
          <div className="profile-img-upload">
            <div className="profile-img-preview-wrap">
              {form.profileImage ? (
                <img
                  src={form.profileImage}
                  alt="프로필"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <span className="profile-img-placeholder-icon">⚔️</span>
              )}
              <button
                type="button"
                className="profile-img-edit-btn"
                onClick={() =>
                  document.getElementById("profileImgInput").click()
                }
              >
                ✏️
              </button>
            </div>
            <input
              id="profileImgInput"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                // 2MB 제한
                if (file.size > 2 * 1024 * 1024) {
                  setMsg("이미지 크기는 2MB 이하여야 합니다.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  setForm({ ...form, profileImage: reader.result });
                };
                reader.readAsDataURL(file);
              }}
            />
            {form.profileImage && (
              <button
                type="button"
                className="profile-img-remove"
                onClick={() => setForm({ ...form, profileImage: "" })}
              >
                🗑️ 이미지 삭제
              </button>
            )}
          </div>
        </div>

        {/* 닉네임 */}
        <div className="profile-field">
          <div className="profile-field-header">
            <label>닉네임</label>
            <span className="profile-nick-count">
              변경 가능 횟수:{" "}
              <b
                style={{
                  color: nicknameChangeCount > 0 ? "#f0c040" : "#e74c3c",
                }}
              >
                {nicknameChangeCount}
              </b>
            </span>
          </div>
          <input
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            maxLength={10}
            placeholder="특수문자 제외"
          />
          {nicknameChangeCount <= 0 && (
            <p className="profile-nick-warn">
              포인트로 변경권 구매 후 변경 가능
            </p>
          )}
        </div>

        <div className="profile-field">
          <label>MBTI</label>
          <select name="mbti" value={form.mbti} onChange={handleChange}>
            <option value="">선택 안함</option>
            {MBTI_LIST.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="profile-field">
          <label>크로노타입</label>
          <div className="profile-radio">
            <label>
              <input
                type="radio"
                name="chronotype"
                value="MORNING"
                checked={form.chronotype === "MORNING"}
                onChange={handleChange}
              />
              아침형
            </label>
            <label>
              <input
                type="radio"
                name="chronotype"
                value="EVENING"
                checked={form.chronotype === "EVENING"}
                onChange={handleChange}
              />
              저녁형
            </label>
          </div>
        </div>

        <div className="profile-field">
          <label>메인 스탯</label>
          <div className="profile-stat-grid">
            {STAT_OPTIONS.map((s) => (
              <div
                key={s.key}
                className={`profile-stat-card ${form.mainStat === s.key ? "selected" : ""}`}
                style={{
                  borderColor:
                    form.mainStat === s.key ? s.color : "rgba(255,255,255,0.1)",
                }}
                onClick={() => setForm({ ...form, mainStat: s.key })}
              >
                <span>{s.label.split(" ")[0]}</span>
                <span
                  style={{
                    color: form.mainStat === s.key ? s.color : "#fff",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                  }}
                >
                  {s.label.split(" ").slice(1).join(" ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 개인 취향 */}
      <div className="profile-section">
        <p className="profile-section-title">개인 취향</p>
        <div className="profile-field">
          <label>좋아하는 것</label>
          <input
            name="likes"
            value={form.likes}
            onChange={handleChange}
            placeholder="예: 운동, 독서, 커피"
          />
        </div>
        <div className="profile-field">
          <label>싫어하는 것</label>
          <input
            name="dislikes"
            value={form.dislikes}
            onChange={handleChange}
            placeholder="예: 늦잠, 미루기"
          />
        </div>
        <div className="profile-field">
          <label>목표</label>
          <input
            name="goal"
            value={form.goal}
            onChange={handleChange}
            placeholder="예: 매일 퀘스트 완료"
          />
        </div>
      </div>

      {msg && <p className="profile-msg">{msg}</p>}
      <button
        className="profile-save-btn"
        onClick={handleSaveClick}
        disabled={loading}
      >
        {loading ? "저장 중..." : "저장하기"}
      </button>

      {/* 비밀번호 변경 */}
      <div className="profile-section">
        <div className="profile-pw-header">
          <p className="profile-section-title" style={{ margin: 0 }}>
            비밀번호 변경
          </p>
          <button
            className="profile-pw-toggle"
            onClick={() => {
              setShowPwForm(!showPwForm);
              setPwMsg("");
            }}
          >
            {showPwForm ? "닫기" : "변경하기"}
          </button>
        </div>
        {showPwForm && (
          <div style={{ marginTop: 12 }}>
            <div className="profile-field">
              <label>현재 비밀번호</label>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) =>
                  setPwForm({ ...pwForm, currentPassword: e.target.value })
                }
                placeholder="현재 비밀번호"
              />
            </div>
            <div className="profile-field">
              <label>새 비밀번호</label>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) =>
                  setPwForm({ ...pwForm, newPassword: e.target.value })
                }
                placeholder="4자 이상"
              />
            </div>
            <div className="profile-field">
              <label>새 비밀번호 확인</label>
              <input
                type="password"
                value={pwForm.newPasswordConfirm}
                onChange={(e) =>
                  setPwForm({ ...pwForm, newPasswordConfirm: e.target.value })
                }
                placeholder="새 비밀번호 재입력"
              />
            </div>
            {pwMsg && <p className="profile-msg">{pwMsg}</p>}
            <button
              className="profile-save-btn"
              onClick={handlePwChange}
              disabled={loading}
            >
              비밀번호 변경
            </button>
          </div>
        )}
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
};

export default Profile;
