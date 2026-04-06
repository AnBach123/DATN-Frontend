<script setup lang="ts">
import { callCustomerLogin } from '@/services/authApi'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { authenticateMockUser, generateMockJWT } from '@/mock/mockAuth'

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const msg = ref('')
const showPassword = ref(false)
const useMockAuth = ref(false)

async function onSubmit() {
    loading.value = true
    msg.value = ''

    try {
        if (useMockAuth.value) {
            const mockUser = authenticateMockUser(email.value.trim(), password.value)
            
            if (mockUser && mockUser.role === 'USER') {
                const mockJWT = generateMockJWT(mockUser.email, mockUser.role)
                
                localStorage.setItem('accessToken', mockJWT)
                localStorage.setItem('tokenType', 'Bearer')
                localStorage.setItem('email', mockUser.email)
                localStorage.setItem('userRole', mockUser.role)
                localStorage.setItem('fullName', mockUser.fullName)

                msg.value = 'Đăng nhập thành công!'
                
                setTimeout(() => {
                    router.push('/')
                }, 500)
            } else {
                msg.value = 'Email hoặc mật khẩu không đúng'
            }
        } else {
            const res = await callCustomerLogin({
                email: email.value.trim(),
                password: password.value,
            })

            localStorage.setItem('accessToken', res.data.accessToken)
            localStorage.setItem('tokenType', res.data.tokenType)
            localStorage.setItem('email', res.data.email)
            localStorage.setItem('userRole', res.data.role)
            
            if (res.data.userId) {
                localStorage.setItem('userId', res.data.userId.toString())
            }
            if (res.data.fullName) {
                localStorage.setItem('fullName', res.data.fullName)
            }
            if (res.data.username) {
                localStorage.setItem('username', res.data.username)
            }

            msg.value = 'Đăng nhập thành công!'
            router.push('/')
        }
    } catch (e: any) {
        msg.value = e?.message || 'Đăng nhập thất bại'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <main class="auth-layout">
        <div class="auth-container">
            <!-- Left Side - Restaurant Image (STATIC - NO TRANSITION) -->
            <div class="image-section">
                <div class="image-overlay">
                    <div class="logo-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <!-- Hot pot with fire -->
                            <!-- Pot body -->
                            <path d="M5 12 Q5 16, 12 16 Q19 16, 19 12"></path>
                            <path d="M5 12 L5 10 Q5 8, 7 8 L17 8 Q19 8, 19 10 L19 12"></path>
                            <!-- Handles -->
                            <path d="M4 10 Q3 10, 3 11"></path>
                            <path d="M20 10 Q21 10, 21 11"></path>
                            <!-- Steam -->
                            <path d="M8 6 Q8 4, 9 4" stroke-width="1.5"></path>
                            <path d="M12 5 Q12 3, 13 3" stroke-width="1.5"></path>
                            <path d="M16 6 Q16 4, 17 4" stroke-width="1.5"></path>
                            <!-- Fire -->
                            <path d="M12 18 Q10 19, 10 20 Q10 21, 12 21 Q14 21, 14 20 Q14 19, 12 18 Z" fill="currentColor" opacity="0.3"></path>
                        </svg>
                    </div>
                    <h1>Tinh Hoa Hội Tụ</h1>
                    <p>Trải nghiệm ẩm thực đẳng cấp cùng không gian sang trọng</p>
                </div>
            </div>

            <!-- Right Side - Login Form (WITH TRANSITION) -->
            <div class="form-section">
                <div class="form-header">
                    <div class="tab-buttons">
                        <button class="tab-btn active">Đăng nhập</button>
                        <RouterLink to="/auth/register" class="tab-btn">Đăng ký</RouterLink>
                    </div>
                </div>

                <form @submit.prevent="onSubmit" class="login-form">
                    <div class="input-group">
                        <input 
                            v-model="email" 
                            type="email" 
                            id="email"
                            required
                            :class="{ 'has-value': email }"
                        />
                        <label for="email">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            Email
                        </label>
                    </div>

                    <div class="input-group">
                        <div class="password-wrapper">
                            <input 
                                v-model="password" 
                                :type="showPassword ? 'text' : 'password'" 
                                id="password"
                                required
                                :class="{ 'has-value': password }"
                            />
                            <label for="password">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                Mật khẩu
                            </label>
                            <button 
                                type="button" 
                                class="toggle-password"
                                @click="showPassword = !showPassword"
                            >
                                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <button type="submit" class="submit-btn" :disabled="loading">
                        <span v-if="!loading">Đăng nhập</span>
                        <span v-else class="loading-spinner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin">
                                <line x1="12" y1="2" x2="12" y2="6"></line>
                                <line x1="12" y1="18" x2="12" y2="22"></line>
                                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                <line x1="2" y1="12" x2="6" y2="12"></line>
                                <line x1="18" y1="12" x2="22" y2="12"></line>
                                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                            </svg>
                            Đang xử lý...
                        </span>
                    </button>

                    <p v-if="msg" class="message" :class="{ 'success': msg.includes('thành công'), 'error': !msg.includes('thành công') }">
                        {{ msg }}
                    </p>
                </form>

                <p class="not-member">
                    Chưa có tài khoản?
                    <RouterLink to="/auth/register">Đăng ký ngay</RouterLink>
                </p>
            </div>
        </div>
    </main>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 0;
}

.auth-container {
  display: flex;
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
  background: white;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Left Side - Image Section */
.image-section {
  flex: 1;
  background: 
    linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.5) 100%),
    url('https://www.vietfuntravel.com.vn/image/data/Ha-Noi/am-thuc-ha-noi/tat-ca-nha-hang-co-khong-gian-dep-ha-noi-1.jpg');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 60px 40px;
  overflow: hidden;
}

.image-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.image-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.02) 0px,
      rgba(255, 255, 255, 0.02) 1px,
      transparent 1px,
      transparent 40px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.02) 0px,
      rgba(255, 255, 255, 0.02) 1px,
      transparent 1px,
      transparent 40px
    );
  pointer-events: none;
}

.image-overlay {
  text-align: center;
  color: white;
  z-index: 1;
  animation: fadeIn 0.8s ease-out 0.3s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-icon {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.image-overlay h1 {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.image-overlay p {
  font-size: 18px;
  opacity: 0.95;
  margin: 0 0 40px 0;
  line-height: 1.6;
}

/* Right Side - Form Section */
.form-section {
  flex: 1;
  padding: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  position: relative;
}

/* Slide animation for form content */
.form-section > * {
  animation: slideFromRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideFromRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.form-header {
  width: 100%;
  max-width: 440px;
  margin-bottom: 32px;
}

.tab-buttons {
  display: flex;
  gap: 0;
  background: #f1f5f9;
  padding: 6px;
  border-radius: 12px;
  position: relative;
}

.tab-buttons::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 6px;
  width: calc(50% - 6px);
  height: calc(100% - 12px);
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 0;
  transform: translateX(0);
}

.tab-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.3s ease;
  text-decoration: none;
  text-align: center;
  position: relative;
  z-index: 1;
}

.tab-btn.active {
  color: #dc2626;
}

.tab-btn:not(.active):hover {
  color: #475569;
}

.login-form {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  background: white;
  padding: 48px 40px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* Floating label input group */
.input-group {
  position: relative;
  width: 100%;
}

.input-group input {
  width: 100%;
  padding: 16px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fafafa;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
}

.input-group input:focus {
  outline: none;
  border-color: #dc2626;
  background: white;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
}

.input-group label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 16px;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  padding: 0 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.input-group label svg {
  width: 16px;
  height: 16px;
}

/* Label moves up when input is focused or has value */
.input-group input:focus + label,
.input-group input.has-value + label {
  top: 0;
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
  background: white;
}

.input-group input:focus + label svg,
.input-group input.has-value + label svg {
  width: 14px;
  height: 14px;
}

/* Password wrapper for floating label */
.password-wrapper {
  position: relative;
  width: 100%;
}

.password-wrapper input {
  width: 100%;
  padding: 16px 48px 16px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fafafa;
  box-sizing: border-box;
}

.password-wrapper input:focus {
  outline: none;
  border-color: #dc2626;
  background: white;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
}

.password-wrapper label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 16px;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  padding: 0 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.password-wrapper label svg {
  width: 16px;
  height: 16px;
}

.password-wrapper input:focus + label,
.password-wrapper input.has-value + label {
  top: 0;
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
  background: white;
}

.password-wrapper input:focus + label svg,
.password-wrapper input.has-value + label svg {
  width: 14px;
  height: 14px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  z-index: 10;
}

.toggle-password:hover {
  color: #dc2626;
}

.submit-btn {
  padding: 16px;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.message {
  margin-top: 12px;
  text-align: center;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  animation: fadeInMessage 0.3s ease-out;
}

@keyframes fadeInMessage {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.success {
  background: #c6f6d5;
  color: #22543d;
  border: 1px solid #9ae6b4;
}

.message.error {
  background: #fed7d7;
  color: #742a2a;
  border: 1px solid #fc8181;
}

.not-member {
  width: 100%;
  max-width: 440px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
  margin-top: 24px;
}

.not-member a {
  color: #dc2626;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.not-member a:hover {
  color: #991b1b;
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 968px) {
  .auth-container {
    flex-direction: column;
    max-width: 100%;
  }

  .image-section {
    min-height: 300px;
    padding: 40px 30px;
  }

  .image-overlay h1 {
    font-size: 32px;
  }

  .image-overlay p {
    font-size: 16px;
  }

  .form-section {
    padding: 40px 30px;
  }
}

@media (max-width: 480px) {
  .auth-layout {
    padding: 0;
  }

  .form-section {
    padding: 30px 20px;
  }

  .image-section {
    min-height: 250px;
    padding: 30px 20px;
  }

  .logo-icon {
    width: 80px;
    height: 80px;
  }

  .image-overlay h1 {
    font-size: 28px;
  }
}
</style>
