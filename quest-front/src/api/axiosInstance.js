import axios from "axios";

// Spring Boot 백엔드 기본 URL 설정
// 배포 시 환경변수로 교체 예정
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
