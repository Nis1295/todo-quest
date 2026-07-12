package org.cloud.service;
import org.cloud.domain.User;
import org.cloud.mapper.UserMapper;
import org.cloud.mapper.UserStatsMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserMapper userMapper;
    private final UserStatsMapper userStatsMapper;

    /** 회원가입 */
    @Transactional
    public void signup(User user) {
        if (userMapper.findByEmail(user.getEmail()) != null) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        userMapper.insert(user);
        userStatsMapper.insert(user.getUserId());
    }

    /** 로그인 */
    public User login(String email, String password) {
        User user = userMapper.findByEmail(email);
        if (user == null || !user.getPassword().equals(password)) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        return user;
    }

    /** 회원 정보 조회 */
    public User getUser(Long userId) {
        return userMapper.findById(userId);
    }

    /** 포인트 업데이트 */
    @Transactional
    public void updatePoint(Long userId, long amount) {
        userMapper.updatePoint(userId, amount);
    }

    /** 프로필 수정 (닉네임 변경 횟수 체크 포함) */
    @Transactional
    public void updateProfile(User user) {
        if (user.getNickname() != null && !user.getNickname().matches("^[a-zA-Z0-9가-힣\\s]+$")) {
            throw new IllegalArgumentException("닉네임에 특수문자는 사용할 수 없습니다.");
        }
        User current = userMapper.findById(user.getUserId());
        if (!current.getNickname().equals(user.getNickname())) {
            if (current.getNicknameChangeCount() <= 0) {
                throw new IllegalArgumentException("닉네임 변경 횟수를 모두 사용했습니다.");
            }
            userMapper.decreaseNicknameCount(user.getUserId());
        }
        userMapper.updateProfile(user);
    }

    /** 비밀번호 변경 */
    @Transactional
    public void updatePassword(Long userId, String currentPassword, String newPassword) {
        User user = userMapper.findById(userId);
        if (user == null || !user.getPassword().equals(currentPassword)) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다.");
        }
        if (newPassword == null || newPassword.length() < 4) {
            throw new IllegalArgumentException("새 비밀번호는 4자 이상이어야 합니다.");
        }
        userMapper.updatePassword(userId, newPassword);
    }
}