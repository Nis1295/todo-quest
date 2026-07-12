import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/Ranking.css"; // CSS 스타일 연결

export default function Ranking() {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId");

  // 랭킹 데이터 상태 관리
  const [rankingList, setRankingList] = useState([]);
  const [myRanking, setMyRanking] = useState(null);

  // 1. API 데이터 로드 함수
  const loadRankingData = async () => {
    try {
      // 전체 랭킹 조회 (GET /api/ranking?limit=100)
      const listRes = await axiosInstance.get("/api/ranking?limit=100");
      setRankingList(listRes.data || []);

      // 내 순위 조회 (GET /api/ranking/me/{userId})
      if (currentUserId) {
        const myRes = await axiosInstance.get(
          `/api/ranking/me/${currentUserId}`
        );
        setMyRanking(myRes.data);
      }
    } catch (err) {
      console.error("랭킹 데이터 로딩 실패, 모크 데이터로 대체합니다.", err);

      // API 연결 전 기획서 시안 기반 테스트용 더미 데이터 세팅
      const dummyList = [
        { userId: 101, nickname: "테스터4", totalPoint: 9994, birthYear: 1995 },
        { userId: 102, nickname: "테스트", totalPoint: 5200, birthYear: 1998 },
        { userId: 103, nickname: "테스타", totalPoint: 3100, birthYear: 2002 },
        {
          userId: 104,
          nickname: "모험가_rtoo",
          totalPoint: 1500,
          birthYear: 1990
        },
        {
          userId: 105,
          nickname: "모험가_t671",
          totalPoint: 800,
          birthYear: 2000
        },
        { userId: 106, nickname: "모험가_q3m", totalPoint: 0, birthYear: 1997 },
        {
          userId: 107,
          nickname: "모험가_ua6u",
          totalPoint: 0,
          birthYear: 1999
        },
        { userId: 108, nickname: "test4", totalPoint: 0, birthYear: 2001 },
        {
          userId: Number(currentUserId) || 1,
          nickname: localStorage.getItem("nickname") || "닉네임 변경",
          totalPoint: 0,
          birthYear: 1998
        }
      ];
      setRankingList(dummyList);

      setMyRanking({
        rank: 6,
        nickname: localStorage.getItem("nickname") || "닉네임 변경",
        totalPoint: 0,
        birthYear: 1998
      });
    }
  };

  useEffect(() => {
    loadRankingData();
  }, []);

  // 2. 헬퍼 함수: 현재 연도 기준으로 메인 레벨(나이) 계산 명세 준수
  const calculateMainLevel = (birthYear) => {
    if (!birthYear) return 1;
    const currentYear = new Date().getFullYear();
    return currentYear - Number(birthYear);
  };

  // 3. 헬퍼 함수: 기획서 조건에 따른 순위 표기 방식 (1~3위 메달, 4위~ 텍스트)
  const renderRankBadge = (index) => {
    const rank = index + 1;
    if (rank === 1) return <span className="rank-medal">🥇</span>;
    if (rank === 2) return <span className="rank-medal">🥈</span>;
    if (rank === 3) return <span className="rank-medal">🥉</span>;
    return <span className="rank-number">{rank}위</span>;
  };

  return (
    <div className="ranking-container">
      {/* 상단 타이틀바 */}
      <header className="ranking-header">
        <button className="back-btn" onClick={() => navigate("/main")}>
          ◀
        </button>
        <h2 className="ranking-page-title">🏆 글로벌 랭킹</h2>
        <div style={{ width: "24px" }}></div>
      </header>

      {/* 내 순위 상단 고정 바 (기획서 최상단 레이아웃 반영) */}
      {myRanking && (
        <div className="my-rank-fixed-bar">
          <span className="my-rank-highlight">{myRanking.rank}위</span>
          <span className="my-rank-name">{myRanking.nickname}</span>
          <span className="my-rank-level">
            Lv.{calculateMainLevel(myRanking.birthYear)}
          </span>
          <span className="my-rank-points">
            {myRanking.totalPoint.toLocaleString()} pt
          </span>
        </div>
      )}

      {/* 글로벌 랭킹 리스트 스크롤 영역 */}
      <main className="ranking-scroll-area">
        <div className="ranking-list-wrapper">
          {rankingList.map((user, index) => {
            const isMe = Number(user.userId) === Number(currentUserId);
            return (
              <div
                key={user.userId || index}
                className={`ranking-row-card ${isMe ? "highlight-me" : ""}`}
              >
                {/* 왼쪽: 순위 메달/텍스트 */}
                <div className="rank-left-section">
                  {renderRankBadge(index)}
                  <span className="rank-user-name">{user.nickname}</span>
                  <span className="rank-user-level">
                    Lv.{calculateMainLevel(user.birthYear)}
                  </span>
                </div>

                {/* 오른쪽: 총 포인트 */}
                <div className="rank-right-section">
                  <span className="rank-user-points">
                    {user.totalPoint.toLocaleString()} pt
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 하단 글로벌 네비게이션 고정 바 */}
      <footer className="bottom-nav">
        <button className="nav-item" onClick={() => navigate("/profile")}>
          👤 캐릭터
        </button>
        <button className="nav-item" onClick={() => navigate("/rpg")}>
          📊 RPG스탯창
        </button>
        <button className="nav-item" onClick={() => navigate("/main")}>
          🏠 홈
        </button>
        <button
          className="nav-item active"
          onClick={() => navigate("/ranking")}
        >
          🏆 랭킹
        </button>
      </footer>
    </div>
  );
}
