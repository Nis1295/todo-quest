<div align="center">

# ⚔️ QUEST

**할 일을 클리어하고, 캐릭터를 성장시키세요.**
RPG 메커닉을 결합한 게이미피케이션 To-Do 서비스

![Java](https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

`KH아카데미 부산지원` · `TEAM 3조` · `2026.05.27 ~ 06.25 (4주)`

</div>

> 이 문서는 팀 프로젝트 QUEST에서 **제(이준혁)가 프론트엔드로 담당한 부분**을 중심으로 정리한 개인 포트폴리오용 README입니다.

---

## 프로젝트 소개

QUEST는 할 일을 **퀘스트**로, 습관을 **캐릭터 스탯**으로 바꾸는 게이미피케이션 To-Do 서비스입니다.
퀘스트를 클리어하면 경험치를 얻어 성장하고, 방치하면 디버프(페널티)가 걸려 스탯이 약해집니다.

React SPA(프론트엔드)와 Spring Boot REST API(백엔드)를 완전히 분리한 3-tier 구조로 개발했으며,
저는 **프론트엔드(React) 화면 대부분**을 담당했습니다.

## 제가 담당한 기능

- **메인 퀘스트 보드**: 기간별(일/주/월/연간) 퀘스트 목록 조회·완료·삭제, 닉네임·레벨·포인트 실시간 동기화
- **퀘스트 생성 화면**: 스탯 레벨에 따른 난이도(중/대) 동적 잠금, 연간 퀘스트 옵션 자동 고정
- **퀘스트 완료 처리**: 체크형/타이머형/사진인증형 인증 방식별 분기 처리
- **생성 한도(슬롯) 검증**: 기간별 활성 퀘스트 수와 보유 슬롯을 비교해 초과 시 생성 제한
- **디버프 해제미션 연동**: RPG 상태창에서 "해제미션 만들기" 클릭 → 퀘스트 생성 화면 이동 → 사진인증 퀘스트 생성 → 디버프 자동 연결 플로우
- **RPG 상태창 시각 효과**: 메인스탯 레벨에 따라 아바타 주변 불꽃 파티클 이펙트 티어(low/mid/high) 차등 표시
- **프로필 화면**: 닉네임/MBTI/기상타입/메인스탯/좋아하는 것·싫어하는 것/목표 등 캐릭터 설정 UI
- 로그인/회원가입, 랭킹, 포인트/광고 상점 UI

> ⚠️ **버프/디버프 뱃지 표시 자체(데이터 구조 및 렌더링)** 는 개발 중반 팀장님이 재설계·수정한 부분이라 이 README에서는 제 기여로 서술하지 않았습니다. 저는 그 위에서 동작하는 "해제미션 생성 → 연동" 플로우를 담당했습니다.

## 기술 스택

| 구분 | 스택 |
|---|---|
| 프론트엔드 | React, Vite, Axios, React Router |
| 백엔드(팀 전체) | Spring Boot, MyBatis, MySQL |
| 인프라(팀 전체) | Docker, AWS EC2, Nginx |

## 핵심 코드

### 1. 퀘스트 생성 - 스탯 레벨 기반 동적 잠금

```jsx
// 스탯 레벨 기준 난이도(XP타입) 잠금 로직
const isXpTypeLocked = (type) => {
  if (quest.period === "YEARLY") {
    return type !== "LARGE"; // 연간(버킷리스트)은 무조건 대(LARGE)만 허용
  }
  const targetKey = quest.statType.toLowerCase();
  const statData = statLevels[targetKey];
  const currentSelectedStatLevel =
    typeof statData === "object" ? statData?.level || 1 : statData || 1;

  if (type === "MEDIUM" && currentSelectedStatLevel < 21) return true;
  if (type === "LARGE" && currentSelectedStatLevel < 51) return true;
  return false;
};

// 인증 방식 잠금: 디버프 해제미션 모드 / 연간 퀘스트는 사진(PHOTO)만 허용
const isVerifyTypeLocked = (type) => {
  if (isLinkMode) return type !== "PHOTO";
  if (quest.period === "YEARLY") return type !== "PHOTO";
  return false;
};
```

### 2. 퀘스트 저장 - 슬롯 검증 및 디버프 해제미션 자동 연동

```jsx
const save = async (isTemplateSave = false) => {
  if (!quest.title.trim()) return alert("퀘스트 이름을 입력해 주세요.");

  // 슬롯(생성 한도) 초과 검증 — 기간별 활성 퀘스트 수 vs 보유 슬롯
  const res = await axiosInstance.get(`/api/quests/${userId}?period=${quest.period}`);
  const currentActiveQuestsCount = res.data ? res.data.length : 0;
  const allowedMaxLimit = maxSlotLimits[quest.period];

  if (currentActiveQuestsCount >= allowedMaxLimit) {
    return alert(`🔒 퀘스트 생성 한도 초과!\n포인트 상점에서 슬롯을 구매하세요.`);
  }

  const createRes = await axiosInstance.post("/api/quests", { /* ...payload */ });

  // 디버프 해제미션 생성 모드면, 생성된 퀘스트를 디버프에 자동 연결
  if (isLinkMode && !isTemplateSave) {
    const newQuestId = createRes.data?.questId;
    if (newQuestId) {
      await axiosInstance.post(`/api/quests/buffs/${linkBuffId}/link`, { questId: newQuestId });
      alert("해제미션 생성 + 연결 완료! 2일 연속 완료하면 디버프가 해제돼요.");
    }
    navigate("/rpg");
    return;
  }

  navigate("/main");
};
```

### 3. 퀘스트 완료 - 인증 방식별 분기 처리

```jsx
const handleActionClick = async (questId, currentQuest) => {
  if (currentQuest?.completed) {
    return alert("이 퀘스트는 이미 오늘의 목표를 달성했습니다!");
  }

  const type = currentQuest?.verifyType || "CHECK";
  if (type === "TIME" || type === "PHOTO") {
    // 타이머형 / 사진인증형은 별도 인증 화면으로 이동
    navigate(`/quest/complete/${questId}`, { state: { quest: currentQuest } });
    return;
  }

  // 체크형은 즉시 완료 처리
  const res = await axiosInstance.post(`/api/quests/${questId}/complete`, {
    userId: Number(userId), verifyType: "CHECK", photoUrl: "", elapsedSec: 0,
  });
  alert(res.data?.message || "퀘스트 완료인증 성공!");
};
```

### 4. RPG 상태창 - 레벨 연동 시각 효과

```jsx
// 메인스탯 레벨에 따른 아바타 불꽃 이펙트 티어 계산
const getEffectTier = () => {
  const level = stats[mainStat.toLowerCase()]?.level || 0;
  if (level <= 1) return "none";
  if (level <= 20) return "low";
  if (level <= 50) return "mid";
  return "high";
};

const currentTier = getEffectTier();
const themeColor = STAT_THEME_COLORS[mainStat.toUpperCase()] || "#3498db";
```

## 실행 방법

```bash
# Frontend
cd quest-front
npm install
npm run dev
```


## 배운 점

4주라는 짧은 기간 안에 프론트엔드 화면 대부분을 구현하면서, 백엔드 API 명세가 바뀔 때마다 데이터 매핑을
유연하게 대응하는 방어 코드(대문자/소문자 키 모두 처리 등)를 작성하는 습관을 갖게 되었습니다. 특히 디버프
해제미션처럼 여러 화면(RPG 상태창 → 퀘스트 생성)을 넘나드는 플로우를 `state` 전달로 자연스럽게 연결하는
과정에서 라우팅 설계와 화면 간 데이터 전달 방식에 대한 이해가 깊어졌습니다. 팀장님이 버프/디버프 로직을
재설계할 때도 제가 만든 연동 플로우의 인터페이스(state 파라미터 형태)가 그대로 유지되도록 맞춰 협업했습니다.

## 파티원

| 이름 | 역할 | 담당 |
|---|---|---|
| 김효준 | 팀장 · PM · 백엔드 총괄 | 기획, Spring Boot 설계, XP/레벨/버프·디버프 로직, 배포 총괄 |
| **이준혁 (본인)** | 프론트엔드 | React UI, RPG 상태창/퀘스트 생성 화면, 디버프 해제미션 연동 |
| 남동욱 | 멘토 | 주제 피드백, 질의응답 지원 |
