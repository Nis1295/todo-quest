package org.cloud;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS 설정
 * React 개발 서버(localhost:5173)에서 Spring Boot API 호출 허용
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
		    	registry.addMapping("/api/**")
		    	.allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }
}

//registry.addMapping("/api/**")
//.allowedOrigins(
//    "http://localhost:5173",  // React 개발 서버
//    "http://localhost:3000"   // 혹시 모를 CRA 포트
//)