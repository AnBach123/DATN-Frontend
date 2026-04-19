import axios from 'axios'
import router from '@/router'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

// Request interceptor để tự động gửi JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    // Chỉ gửi JWT token khi auto-logout được bật (production mode)
    // const autoLogoutEnabled = import.meta.env.VITE_ENABLE_AUTO_LOGOUT === 'true'

    // if (autoLogoutEnabled) {
    //   const token = localStorage.getItem('accessToken')
    //   if (token) {
    //     config.headers.Authorization = `Bearer ${token}`
    //   }
    // }
    // return config
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Gửi username trong header để định danh nhân viên khi security bị tắt
    const username = localStorage.getItem('username')
    if (username) {
      config.headers['X-Employee-Username'] = username
    }
    
    // Gửi email trong header để định danh customer khi security bị tắt
    const email = localStorage.getItem('email')
    if (email) {
      config.headers['X-Customer-Email'] = email
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor để xử lý token hết hạn
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if auto-logout is enabled via environment variable
    const autoLogoutEnabled = import.meta.env.VITE_ENABLE_AUTO_LOGOUT === 'true'

    // 🔧 CHANGED: vẫn log lỗi nhưng KHÔNG chặn flow xử lý response tiếp theo
    if (!autoLogoutEnabled) {
      console.warn(
        '⚠️ API Error (auto-logout disabled):',
        error.response?.status,
        error.response?.data,
      )
      // KHÔNG return ở đây để không ảnh hưởng logic auth khác
    }

    // Auto-logout enabled: Handle 401 errors
    // Chỉ xử lý khi:
    // 1. Có response từ server (không phải network error)
    // 2. Status là 401 (Unauthorized) - token hết hạn hoặc không hợp lệ
    // 3. KHÔNG xử lý 403 vì có thể là lỗi permission thật sự
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('accessToken')
      localStorage.removeItem('tokenType')
      localStorage.removeItem('userRole')
      localStorage.removeItem('email')
      localStorage.removeItem('fullName')

      // Redirect về login
      router.push('/auth/login')

      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }

    // Handle 403 Forbidden - User không có quyền truy cập
    if (error.response?.status === 403) {
      alert('Bạn không có quyền truy cập chức năng này.')
      
      // Redirect về trang phù hợp với role
      const userRole = localStorage.getItem('userRole')
      if (userRole === 'STAFF') {
        router.push('/staff')
      } else if (userRole === 'RECEPTION') {
        router.push('/reception')
      } else if (userRole === 'ADMIN') {
        router.push('/admin')
      } else if (userRole === 'KITCHEN') {
        router.push('/kitchen')
      } else if (userRole === 'USER') {
        router.push('/home')
      } else {
        router.push('/')
      }
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
