package org.cloud.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.cloud.domain.User;

/**
 * 회원 관련 DB 작업을 처리하는 MyBatis Mapper 인터페이스
 */
@Mapper
public interface UserMapper {

    // 회원 가입 시 users 테이블에 새 행 삽입
    void insert(User user);

    // 로그인 시 이메일로 회원 조회
    User findByEmail(String email);

    // 회원 ID로 단건 조회
    User findById(Long userId);

    // 포인트 증감 업데이트 (totalPoint만 변경, 차감 등 범용)
    void updatePoint(Long userId, long amount);

    // 일일 한도 체크를 거친 포인트 적립 (totalPoint + dailyPoint 동시 증가)
    void addDailyPoint(@Param("userId") Long userId, @Param("amount") long amount);

    // 매일 자정 전체 유저 dailyPoint 리셋
    void resetAllDailyPoint();

    // 전체 포인트 기준 랭킹 조회
    List<Map<String, Object>> findRanking(int limit);

    // 내 순위 조회
    Map<String, Object> findMyRank(Long userId);
    
    void updateProfile(User user);
    void updatePassword(@Param("userId") Long userId, @Param("password") String password);

    void decreaseNicknameCount(Long userId);

    // 자정 디버프 랜덤 발동 스케줄러용: 전체 유저 ID 목록
    List<Long> findAllUserIds();
}