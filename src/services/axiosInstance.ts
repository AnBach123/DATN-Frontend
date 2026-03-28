import axios from 'axios';
import router from '@/router';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL
});

// Request interceptor để tự động gửi JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý token hết hạn
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if auto-logout is enabled via environment variable
    const autoLogoutEnabled = import.meta.env.VITE_ENABLE_AUTO_LOGOUT === 'true';
    
    // If auto-logout is disabled, just log the error and reject
    if (!autoLogoutEnabled) {
      console.warn('⚠️ API Error (auto-logout disabled):', error.response?.status, error.response?.data);
      return Promise.reject(error);
    }
    
    // Auto-logout enabled: Handle 401 errors
    // Chỉ xử lý khi:
    // 1. Có response từ server (không phải network error)
    // 2. Status là 401 (Unauthorized) - token hết hạn hoặc không hợp lệ
    // 3. KHÔNG xử lý 403 vì có thể là lỗi permission thật sự
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('userRole');
      localStorage.removeItem('email');
      localStorage.removeItem('fullName');
      
      // Redirect về login
      router.push('/auth/login');
      
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
