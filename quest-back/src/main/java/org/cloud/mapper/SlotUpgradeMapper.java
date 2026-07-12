package org.cloud.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.cloud.domain.SlotUpgrade;

/**
 * 슬롯 확장 관련 DB 작업을 처리하는 MyBatis Mapper 인터페이스
 */
@Mapper
public interface SlotUpgradeMapper {

    // 특정 기간의 현재 확장 횟수 조회 (다음 확장 비용 계산용)
    int countByUserIdAndPeriod(Long userId, String period);

    // 슬롯 확장 이력 저장
    void insert(SlotUpgrade slotUpgrade);
}