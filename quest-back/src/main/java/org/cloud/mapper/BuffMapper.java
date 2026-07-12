package org.cloud.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.cloud.domain.Buff;
import java.util.List;

/**
 * 버프/디버프 관련 DB 작업을 처리하는 MyBatis Mapper 인터페이스
 * resources/mapper/BuffMapper.xml과 연결됨
 */
@Mapper
public interface BuffMapper {

    // 특정 유저의 활성 버프/디버프 전체 조회 (RPG 상태창 표시용)
    List<Buff> findByUserId(Long userId);

    // 특정 버프/디버프 이름으로 조회 (중복 발동 방지용)
    Buff findByUserIdAndName(Long userId, String name);

    // 버프/디버프 발동 (insert)
    void insert(Buff buff);

    // 버프/디버프 해제 (name 기준 delete)
    void deleteByUserIdAndName(Long userId, String name);

    // 디버프 1개 해제 (완전회복 버프 효과용 — 가장 오래된 디버프 제거)
    void deleteOldestDebuff(Long userId);

    // 특정 스탯 관련 활성 버프/디버프 조회 (XP 계산 시 효과 적용용)
    // statType이 일치하거나 ALL인 것만 조회
    List<Buff> findActiveByUserIdAndStatType(Long userId, String statType);

    // ── 디버프 재설계(랜덤 발동 + 사진인증 해제) 관련 ──

    // buffId로 단건 조회 (해제미션 지정 시 검증용)
    Buff findById(Long buffId);

    // 유저의 활성 "스탯 디버프"(탈수/몸살/근육통/지식정체/브레인포그/피로누적/만성피로/컨디션저조/번아웃) 목록
    // 나태함(stat_type=ALL)은 제외 — 최대 2개 동시유지 카운트용
    List<Buff> findActiveStatDebuffsByUserId(Long userId);

    // 해제미션(linked_quest_id) 지정/변경
    void updateLinkedQuest(@org.apache.ibatis.annotations.Param("buffId") Long buffId,
                            @org.apache.ibatis.annotations.Param("questId") Long questId);

    // 해제미션 연속완료 진행도 +1
    void incrementProgress(Long buffId);

    // 특정 유저 + 특정 퀘스트가 linked_quest_id로 지정된 활성 디버프 조회 (퀘스트 완료 시 체크용)
    Buff findByUserIdAndLinkedQuestId(@org.apache.ibatis.annotations.Param("userId") Long userId,
                                       @org.apache.ibatis.annotations.Param("questId") Long questId);

    // buffId로 디버프 삭제 (해제 완료 시)
    void deleteById(Long buffId);

    // 자정 스케줄러: linked_quest가 전날 미완료된 디버프들 progress 0으로 리셋
    void resetStaleProgress();

    // 자정 스케줄러: 새 디버프 발동 (insert, linkedQuestId/progress는 null/0)
    void insertDebuff(Buff buff);

    void deleteExpiredBuffs(Long userId);

}