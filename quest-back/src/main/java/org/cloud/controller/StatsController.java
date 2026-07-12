package org.cloud.controller;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.cloud.domain.Buff;
import org.cloud.domain.User;
import org.cloud.domain.UserStats;
import org.cloud.mapper.BuffMapper;
import org.cloud.mapper.UserMapper;
import org.cloud.mapper.UserStatsMapper;
import org.cloud.service.SlotUpgradeService;
import org.cloud.service.XpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * RPG 상태창 데이터 조회 API SCR-06 화면에 필요한 모든 데이터를 한 번에 반환
 */
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

	private final UserMapper userMapper;
	private final UserStatsMapper userStatsMapper;
	private final BuffMapper buffMapper;
	private final SlotUpgradeService slotUpgradeService;
	private final XpService xpService;

	/**
	 * RPG 상태창 전체 데이터 조회 GET /api/stats/{userId}
	 */
	@GetMapping("/{userId}")
	public ResponseEntity<?> getStats(@PathVariable Long userId) {

		// 유저 기본 정보
		User user = userMapper.findById(userId);

		// 스탯 정보
		UserStats stats = userStatsMapper.findByUserId(userId);

		// 활성 버프/디버프
		List<Buff> buffs = buffMapper.findByUserId(userId);

		// 메인 레벨 = 나이 (현재 연도 - 출생연도)
		int mainLevel = LocalDate.now().getYear() - user.getBirthYear();

		// 각 스탯 상세 정보 조합
		Map<String, Object> response = new LinkedHashMap<>();

		// 기본 정보
		response.put("userId", user.getUserId());
		response.put("nickname", user.getNickname());
		response.put("mainLevel", mainLevel);
		response.put("totalPoint", user.getTotalPoint());
		response.put("profileImage", user.getProfileImage());
		response.put("likes", user.getLikes());
		response.put("dislikes", user.getDislikes());
		response.put("goal", user.getGoal());

		// 일일 포인트 적립 현황 (메인스탯 레벨 기준 상한)
		int mainStatLevel = getStatLevelByName(stats, user.getMainStat());
		response.put("dailyPoint", user.getDailyPoint());
		response.put("dailyPointLimit", xpService.calcDailyPointLimit(mainStatLevel));

		// STR 스탯
		response.put("str",
				buildStatInfo("STR", stats.getStrLevel(), stats.getStrExp(), stats.getStrDailyExp(), xpService));

		// INT 스탯
		response.put("int",
				buildStatInfo("INT", stats.getIntLevel(), stats.getIntExp(), stats.getIntDailyExp(), xpService));

		// WIL 스탯
		response.put("wil",
				buildStatInfo("WIL", stats.getWilLevel(), stats.getWilExp(), stats.getWilDailyExp(), xpService));

		// VIT 스탯
		response.put("vit",
				buildStatInfo("VIT", stats.getVitLevel(), stats.getVitExp(), stats.getVitDailyExp(), xpService));

		// 버프/디버프 목록
		response.put("buffs", buffs);
		
		response.put("nicknameChangeCount", user.getNicknameChangeCount());

		// 슬롯 현황
		Map<String, Integer> slots = new LinkedHashMap<>();
		slots.put("daily", slotUpgradeService.getCurrentSlot(userId, "DAILY"));
		slots.put("weekly", slotUpgradeService.getCurrentSlot(userId, "WEEKLY"));
		slots.put("monthly", slotUpgradeService.getCurrentSlot(userId, "MONTHLY"));
		slots.put("yearly", slotUpgradeService.getCurrentSlot(userId, "YEARLY"));
		response.put("slots", slots);

		return ResponseEntity.ok(response);
	}

	/**
	 * 스탯별 상세 정보 생성 레벨, 잔여XP, 등급명, 다음 레벨까지 필요XP, 일일 XP 현황
	 */
	private Map<String, Object> buildStatInfo(String statType, int level, int exp, int dailyExp, XpService xpService) {
		Map<String, Object> stat = new LinkedHashMap<>();
		stat.put("level", level);
		stat.put("exp", exp);
		stat.put("grade", getGrade(statType, level));
		stat.put("nextGrade", getNextGrade(statType, level)); // 다음 등급명
		stat.put("nextGradeLevel", getNextGradeLevel(level)); // 다음 등급까지 필요 레벨
		stat.put("requiredExp", xpService.calcRequiredXp(level));
		stat.put("dailyExp", dailyExp);
		stat.put("dailyLimit", xpService.calcDailyLimit(level));
		stat.put("debuffs", getStatDebuffs(statType, level)); // 디버프 정보
		stat.put("buffs", getStatBuffs(statType)); //버프정보
		return stat;
	}

	/**
	 * 다음 등급명 반환
	 */
	private String getNextGrade(String statType, int level) {
		if (level <= 20) {
			return switch (statType) {
			case "STR" -> "건강";
			case "INT" -> "학사";
			case "WIL" -> "루틴러";
			case "VIT" -> "여유인";
			default -> "";
			};
		} else if (level <= 50) {
			return switch (statType) {
			case "STR" -> "전사";
			case "INT" -> "박사";
			case "WIL" -> "전설";
			case "VIT" -> "극S(인생만끽)";
			default -> "";
			};
		} else {
			return "최고 등급";
		}
	}
	
	/**
	 * 스탯 레벨에 따른 등급명 반환
	 */
	private String getGrade(String statType, int level) {
	    if (level <= 20) {
	        return switch (statType) {
	            case "STR" -> "허약";
	            case "INT" -> "초등";
	            case "WIL" -> "새싹";
	            case "VIT" -> "I(집콕)";
	            default -> "";
	        };
	    } else if (level <= 50) {
	        return switch (statType) {
	            case "STR" -> "건강";
	            case "INT" -> "학사";
	            case "WIL" -> "루틴러";
	            case "VIT" -> "여유인";
	            default -> "";
	        };
	    } else {
	        return switch (statType) {
	            case "STR" -> "전사";
	            case "INT" -> "박사";
	            case "WIL" -> "전설";
	            case "VIT" -> "극S(인생만끽)";
	            default -> "";
	        };
	    }
	}

	/**
	 * 다음 등급까지 필요 레벨 반환
	 */
	private int getNextGradeLevel(int level) {
		if (level <= 20)
			return 21;
		if (level <= 50)
			return 51;
		return -1; // 최고 등급
	}
	
	
	// 해제 조건 문구 (4스탯 디버프 공통, BuffService.RELEASE_PROGRESS_GOAL=2와 동기화)
	private static final String RELEASE_TEXT =
	        "지정한 사진인증(PHOTO) 퀘스트를 2일 연속 완료하면 해제 (+보너스 XP 지급)";


	/**
	 * 스탯별 디버프 정보 반환
	 * BuffService.DEBUFF_POOL과 동일한 풀 + 자정 랜덤 발동/PHOTO 2일 연속 해제 조건으로 동기화 (2026-06-23)
	 */
	private List<Map<String, String>> getStatDebuffs(String statType, int level) {
		if ("STR".equals(statType)) {

		    if (level <= 20) {
		        return List.of(
		            Map.of(
		                "name", "탈수 (1단계)",
		                "effect", "STR XP -10%",
		                "release", RELEASE_TEXT
		            )
		        );
		    }

		    if (level <= 50) {
		        return List.of(
		            Map.of(
		                "name", "탈수 (1단계)",
		                "effect", "STR XP -10%",
		                "release", RELEASE_TEXT
		            ),
		            Map.of(
		                "name", "만성 탈수 (2단계)",
		                "effect", "STR XP -20%",
		                "release", RELEASE_TEXT
		            )
		        );
		    }

		    return List.of(
		        Map.of(
		            "name", "탈수 (1단계)",
		            "effect", "STR XP -10%",
		            "release", RELEASE_TEXT
		        ),
		        Map.of(
		            "name", "만성 탈수 (2단계)",
		            "effect", "STR XP -20%",
		            "release", RELEASE_TEXT
		        ),
		        Map.of(
		            "name", "중증 탈수 (3단계)",
		            "effect", "STR XP -30%, 포인트 획득량 -10%",
		            "release", RELEASE_TEXT
		        )
		    );
		}

		if ("INT".equals(statType)) {

		    if (level <= 20) {
		        return List.of(
		            Map.of(
		                "name", "지식 정체 (1단계)",
		                "effect", "INT XP -10%",
		                "release", RELEASE_TEXT
		            )
		        );
		    }

		    if (level <= 50) {
		        return List.of(
		            Map.of(
		                "name", "지식 정체 (1단계)",
		                "effect", "INT XP -10%",
		                "release", RELEASE_TEXT
		            ),
		            Map.of(
		                "name", "사고 둔화 (2단계)",
		                "effect", "INT XP -20%",
		                "release", RELEASE_TEXT
		            )
		        );
		    }

		    return List.of(
		        Map.of(
		            "name", "지식 정체 (1단계)",
		            "effect", "INT XP -10%",
		            "release", RELEASE_TEXT
		        ),
		        Map.of(
		            "name", "사고 둔화 (2단계)",
		            "effect", "INT XP -20%",
		            "release", RELEASE_TEXT
		        ),
		        Map.of(
		            "name", "지적 퇴화 (3단계)",
		            "effect", "INT XP -30%",
		            "release", RELEASE_TEXT
		        )
		    );
		}

		if ("WIL".equals(statType)) {

		    if (level <= 20) {
		        return List.of(
		            Map.of(
		                "name", "나태함 (1단계)",
		                "effect", "포인트 획득량 -5%",
		                "release", RELEASE_TEXT
		            )
		        );
		    }

		    if (level <= 50) {
		        return List.of(
		            Map.of(
		                "name", "나태함 (1단계)",
		                "effect", "포인트 획득량 -5%",
		                "release", RELEASE_TEXT
		            ),
		            Map.of(
		                "name", "무기력 (2단계)",
		                "effect", "포인트 획득량 -10%",
		                "release", RELEASE_TEXT
		            )
		        );
		    }

		    return List.of(
		        Map.of(
		            "name", "나태함 (1단계)",
		            "effect", "포인트 획득량 -5%",
		            "release", RELEASE_TEXT
		        ),
		        Map.of(
		            "name", "무기력 (2단계)",
		            "effect", "포인트 획득량 -10%",
		            "release", RELEASE_TEXT
		        ),
		        Map.of(
		            "name", "의지 붕괴 (3단계)",
		            "effect", "포인트 획득량 -20%",
		            "release", RELEASE_TEXT
		        )
		    );
		}

		if ("VIT".equals(statType)) {

		    if (level <= 20) {
		        return List.of(
		            Map.of(
		                "name", "번아웃 (1단계)",
		                "effect", "VIT XP -10%",
		                "release", RELEASE_TEXT
		            )
		        );
		    }

		    if (level <= 50) {
		        return List.of(
		            Map.of(
		                "name", "번아웃 (1단계)",
		                "effect", "VIT XP -10%",
		                "release", RELEASE_TEXT
		            ),
		            Map.of(
		                "name", "만성 피로 (2단계)",
		                "effect", "VIT XP -20%",
		                "release", RELEASE_TEXT
		            )
		        );
		    }

		    return List.of(
		        Map.of(
		            "name", "번아웃 (1단계)",
		            "effect", "VIT XP -10%",
		            "release", RELEASE_TEXT
		        ),
		        Map.of(
		            "name", "만성 피로 (2단계)",
		            "effect", "VIT XP -20%",
		            "release", RELEASE_TEXT
		        ),
		        Map.of(
		            "name", "생기 상실 (3단계)",
		            "effect", "VIT XP -30%",
		            "release", RELEASE_TEXT
		        )
		    );
		}

		return List.of();		
	    }
	
	/**
	 * 스탯 이름(STR/INT/WIL/VIT)으로 해당 레벨 조회
	 * 일일 포인트 한도 계산(메인스탯 기준)에 사용
	 */
	private int getStatLevelByName(UserStats stats, String statType) {
		return switch (statType) {
		case "STR" -> stats.getStrLevel();
		case "INT" -> stats.getIntLevel();
		case "WIL" -> stats.getWilLevel();
		case "VIT" -> stats.getVitLevel();
		default -> 1;
		};
	}
	
	/*
	 * 새로운 버프 시스템
	 * */
	private List<Map<String, String>> getStatBuffs(String statType) {

	    return switch (statType) {

	    case "STR" -> List.of(
	        Map.of(
	            "name", "멈출 수 없는 힘",
	            "effect", "포인트 적립 +5%",
	            "condition", "STR 퀘스트 3일 연속 완료",
	            "release", "1일 (7일 연속 시 2일)"
	        )
	    );

	    case "INT" -> List.of(
	        Map.of(
	            "name", "집중력 MAX",
	            "effect", "포인트 적립 +5%",
	            "condition", "INT 퀘스트 3일 연속 완료",
	            "release", "1일 (7일 연속 시 2일)"
	        )
	    );

	    case "WIL" -> List.of(
	        Map.of(
	            "name", "불굴의 의지",
	            "effect", "포인트 적립 +5%",
	            "condition", "WIL 퀘스트 3일 연속 완료",
	            "release", "1일 (7일 연속 시 2일)"
	        )
	    );

	    case "VIT" -> List.of(
	        Map.of(
	            "name", "넘치는 생명력",
	            "effect", "포인트 적립 +5%",
	            "condition", "VIT 퀘스트 3일 연속 완료",
	            "release", "1일 (7일 연속 시 2일)"
	        )
	    );

	    default -> List.of();
	    };
	}

}