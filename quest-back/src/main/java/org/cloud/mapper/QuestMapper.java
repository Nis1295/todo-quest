package org.cloud.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.cloud.domain.Quest;
import java.util.List;

/**
 * 퀘스트 관련 DB 작업을 처리하는 MyBatis Mapper 인터페이스
 * resources/mapper/QuestMapper.xml과 연결됨
 */
@Mapper
public interface QuestMapper {

    // 새 퀘스트 생성 (+ 버튼으로 추가 시)
    void insert(Quest quest);

    // 특정 회원의 기간별 퀘스트 목록 조회 (탭 전환 시 사용)
    // period: DAILY, WEEKLY, MONTHLY, YEARLY
    List<Quest> findByUserIdAndPeriod(Long userId, String period);

    // 퀘스트 ID로 단건 조회 (인증 화면 진입 시)
    Quest findById(Long questId);

    // 퀘스트 비활성화 (삭제 대신 isActive=false 처리)
    void deactivate(Long questId);
    
    // 퀘스트 연장
    void extendDeadline(Long questId);

    // 마감 지난 퀘스트 비활성화
    void deactivateExpired();
    
    // 내 템플릿 목록 조회
    List<Quest> findTemplatesByUserId(Long userId);
}