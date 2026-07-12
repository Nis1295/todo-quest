import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./Ranking.css";

const Ranking = () => {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    axiosInstance.get("/api/ranking?limit=100").then((res) => {
      setRankings(res.data);
    });
    axiosInstance.get(`/api/ranking/me/${userId}`).then((res) => {
      setMyRank(res.data);
    });
  }, []);

  const getMedal = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <div className="ranking-container">
      <div className="ranking-header">
        <button className="back-btn" onClick={() => navigate("/main")}>
          ←
        </button>
        <h2>🏆 글로벌 랭킹</h2>
      </div>

      {myRank && (
        <div className="my-rank-card">
          <span className="my-rank-label">내 순위</span>
          <span className="my-rank-num">{myRank.rank}위</span>
          <span className="my-rank-name">{myRank.nickname}</span>
          <span className="my-rank-point">
            {myRank.totalPoint.toLocaleString()} pt
          </span>
        </div>
      )}

      <div className="ranking-list">
        {rankings.map((user) => (
          <div
            key={user.rank}
            className={`ranking-item ${user.userId == userId ? "me" : ""}`}
          >
            <span className="rank-num">
              {getMedal(user.rank) ?? `${user.rank}위`}
            </span>
            <span className="rank-name">{user.nickname}</span>
            <span className="rank-point">
              {user.totalPoint.toLocaleString()} pt
            </span>
          </div>
        ))}
      </div>

      {/* 하단 네비게이션 */}
      <div className="ranking-bottom-nav">
        <button onClick={() => navigate("/rpg")}>⚔️ 캐릭터</button>
        <button onClick={() => navigate("/main")}>🏠 홈</button>
        <button className="active">🏆 랭킹</button>
      </div>
    </div>
  );
};

export default Ranking;
