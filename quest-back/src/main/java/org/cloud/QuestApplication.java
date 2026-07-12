package org.cloud;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // 스케줄러 활성화 (@Scheduled 어노테이션 동작하려면 필수)
public class QuestApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuestApplication.class, args);
    }
}