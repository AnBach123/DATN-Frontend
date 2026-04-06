<script setup lang="ts">
import router from '@/router'
import { callRegister } from '@/services/authApi'
import Swal from 'sweetalert2'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const fullName = ref('')
const email = ref('')
const password = ref('')
const phoneNumber = ref('')
const day = ref('')
const month = ref('')
const year = ref('')
const loading = ref(false)
const msg = ref('')
const showPassword = ref(false)

// Refs for input elements
const dayInput = ref<HTMLInputElement | null>(null)
const monthInput = ref<HTMLInputElement | null>(null)
const yearInput = ref<HTMLInputElement | null>(null)

function handlePhoneInput(event: Event) {
  const input = event.target as HTMLInputElement
  let value = input.value
  
  // Remove all non-digit characters
  value = value.replace(/\D/g, '')
  
  // Limit to 10 digits
  if (value.length > 10) {
    value = value.slice(0, 10)
  }
  
  phoneNumber.value = value
}

type ApiErr = {
  message?: string
  errors?: Array<{ field: string; error: string }>
  error?: string
  data?: {
    message?: string
    errors?: Array<{ field: string; error: string }>
  }
}

function extractErrorMessage(error: unknown): string {
  const e = error as any
  
  // Check for errors array (validation errors)
  if (e?.errors?.length) {
    return e.errors.map((x: any) => `${x.field}: ${x.error}`).join('\n')
  }
  
  // Check for response data errors
  if (e?.response?.data?.errors?.length) {
    return e.response.data.errors.map((x: any) => `${x.field}: ${x.error}`).join('\n')
  }
  
  // Check for response data message
  if (e?.response?.data?.message) {
    return e.response.data.message
  }
  
  // Check for direct message
  if (e?.message) {
    return e.message
  }
  
  // Check for error string
  if (e?.error) {
    return e.error
  }
  
  return 'Có lỗi xảy ra'
}

function handleDayInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  
  // Validate day input
  if (value.length === 1) {
    const firstDigit = parseInt(value)
    if (firstDigit > 3) {
      // If first digit > 3, reset to empty
      day.value = ''
      return
    }
  } else if (value.length === 2) {
    const num = parseInt(value)
    const firstDigit = parseInt(value[0] || '0')
    const secondDigit = parseInt(value[1] || '0')
    
    // If first digit is 3, only allow 0 or 1 as second digit
    if (firstDigit === 3 && secondDigit > 1) {
      day.value = value[0] || ''
      return
    }
    
    // If number is invalid (0 or > 31), reset to first digit
    if (num === 0 || num > 31) {
      day.value = value[0] || ''
      return
    }
    
    // Auto-focus to month when day has 2 valid digits
    if (monthInput.value) {
      monthInput.value.focus()
    }
  }
}

function handleMonthInput(event: Event) {
  const input = event.target as HTMLInputElement
  let value = input.value
  
  // Limit to 2 digits max
  if (value.length > 2) {
    value = value.slice(0, 2)
    month.value = value
    return
  }
  
  // Only validate when we have 2 digits
  if (value.length === 2) {
    const num = parseInt(value)
    
    // If invalid month (00 or > 12), truncate to 1 digit
    if (num === 0 || num > 12) {
      month.value = value.slice(0, 1)
      return
    }
    
    // Valid month, auto-focus to year
    if (yearInput.value) {
      yearInput.value.focus()
    }
  }
}

function handleYearInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  
  // Limit to 4 digits only
  if (value.length > 4) {
    year.value = value.slice(0, 4)
    return
  }
  
  // Validate year range when 4 digits are entered
  if (value.length === 4) {
    const yearNum = parseInt(value)
    const currentYear = new Date().getFullYear()
    const maxYear = currentYear - 13 // Must be at least 13 years old
    
    // If year is greater than maxYear (2013), reset to maxYear
    if (yearNum > maxYear) {
      year.value = maxYear.toString()
    }
  }
}

function validateDate(): string | null {
  if (!day.value || !month.value || !year.value) {
    return null // Optional field
  }

  const d = parseInt(day.value)
  const m = parseInt(month.value)
  const y = parseInt(year.value)

  // Validate ranges
  if (d < 1 || d > 31) return 'Ngày không hợp lệ (1-31)'
  if (m < 1 || m > 12) return 'Tháng không hợp lệ (1-12)'
  
  const currentYear = new Date().getFullYear()
  const age = currentYear - y
  
  if (age < 13) return 'Bạn phải từ 13 tuổi trở lên'
  if (age > 120) return 'Năm sinh không hợp lệ'

  // Validate day in month
  const daysInMonth = new Date(y, m, 0).getDate()
  if (d > daysInMonth) return `Tháng ${m} chỉ có ${daysInMonth} ngày`

  return null
}

function validatePhone(): string | null {
  if (!phoneNumber.value) {
    return null // Optional field
  }
  
  if (phoneNumber.value.length !== 10) {
    return 'Số điện thoại phải có đúng 10 chữ số'
  }
  
  if (!phoneNumber.value.startsWith('0')) {
    return 'Số điện thoại phải bắt đầu bằng số 0'
  }
  
  return null
}

async function onSubmit() {
  // Validate phone if provided
  const phoneError = validatePhone()
  if (phoneError) {
    await Swal.fire({
      icon: 'error',
      title: 'Số điện thoại không hợp lệ',
      text: phoneError,
    })
    return
  }

  // Validate date if provided
  const dateError = validateDate()
  if (dateError) {
    await Swal.fire({
      icon: 'error',
      title: 'Ngày sinh không hợp lệ',
      text: dateError,
    })
    return
  }

  loading.value = true
  msg.value = ''

  try {
    // Format date as yyyy-MM-dd (ISO format for LocalDate) if all fields are filled
    let dateOfBirth: string | undefined = undefined
    if (day.value && month.value && year.value) {
      // Convert to string first, then pad
      const d = String(day.value).padStart(2, '0')
      const m = String(month.value).padStart(2, '0')
      dateOfBirth = `${year.value}-${m}-${d}` // ISO format: yyyy-MM-dd
    }

    const res = await callRegister({
      fullName: fullName.value.trim(),
      email: email.value.trim(),
      password: password.value,
      phoneNumber: phoneNumber.value.trim() || undefined,
      dateOfBirth: dateOfBirth,
    })

    const wait = res.data?.resendAfterSeconds ?? 60
    const emailVal = res.data?.email ?? email.value.trim()

    sessionStorage.setItem('pending_email', emailVal)

    await Swal.fire({
      icon: 'success',
      title: 'Đã gửi OTP',
      text: `Mã OTP đã gửi tới ${emailVal}`,
      timer: 1200,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    })

    await router.push({
      name: 'verify-otp',
      query: { email: emailVal, wait: String(wait) },
    })
  } catch (e: unknown) {
    // Log full error for debugging
    console.error('Registration error:', e)
    console.error('Error response:', (e as any)?.response)
    console.error('Error response data:', (e as any)?.response?.data)
    
    msg.value = extractErrorMessage(e)
    await Swal.fire({
      icon: 'error',
      title: 'Đăng ký thất bại',
      text: msg.value,
    })
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

      <!-- Right Side - Register Form (WITH TRANSITION) -->
      <div class="form-section">
        <div class="form-header">
          <div class="tab-buttons">
            <RouterLink to="/auth/login" class="tab-btn">Đăng nhập</RouterLink>
            <button class="tab-btn active">Đăng ký</button>
          </div>
        </div>

        <form @submit.prevent="onSubmit" class="register-form">
          <div class="form-group">
            <label>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Họ và tên
            </label>
            <input 
              v-model="fullName" 
              type="text" 
              required 
              placeholder="Nhập họ và tên"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Email
            </label>
            <input 
              v-model="email" 
              type="email" 
              required 
              placeholder="example@email.com"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Mật khẩu
            </label>
            <div class="password-wrapper">
              <input 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                required
                placeholder="••••••••"
                class="form-input"
              />
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

          <div class="form-group">
            <label>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Số điện thoại
            </label>
            <input 
              v-model="phoneNumber" 
              type="text" 
              placeholder="0123456789"
              class="form-input"
              maxlength="10"
              @input="handlePhoneInput"
            />
          </div>

          <div class="form-group">
            <label>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Ngày sinh
            </label>
            <div class="date-inputs">
              <input 
                ref="dayInput"
                v-model="day" 
                type="number" 
                placeholder="Ngày"
                min="1"
                max="31"
                class="form-input date-input"
                @input="handleDayInput"
              />
              <input 
                ref="monthInput"
                v-model="month" 
                type="number" 
                placeholder="Tháng"
                min="1"
                max="12"
                class="form-input date-input"
                @input="handleMonthInput"
              />
              <input 
                ref="yearInput"
                v-model="year" 
                type="number" 
                placeholder="Năm"
                :min="new Date().getFullYear() - 120"
                :max="new Date().getFullYear() - 13"
                class="form-input date-input"
                @input="handleYearInput"
              />
            </div>
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="!loading">Đăng ký</span>
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
        </form>

        <p class="already-member">
          Đã có tài khoản?
          <RouterLink to="/auth/login">Đăng nhập ngay</RouterLink>
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
  animation: slideFromLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideFromLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.form-header {
  width: 100%;
  max-width: 520px;
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
  right: 6px;
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

.register-form {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  background: white;
  padding: 48px 40px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group label svg {
  color: #dc2626;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: white;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.password-wrapper {
  position: relative;
  width: 100%;
}

.password-wrapper .form-input {
  width: 100%;
  padding: 12px 48px 12px 16px;
  box-sizing: border-box;
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
}

.toggle-password:hover {
  color: #dc2626;
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 8px;
}

.date-input {
  text-align: center;
}

/* Remove spinner arrows from number inputs */
.date-input::-webkit-outer-spin-button,
.date-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.date-input[type=number] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.submit-btn {
  padding: 14px;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
  border: none;
  border-radius: 10px;
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

.already-member {
  width: 100%;
  max-width: 520px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
  margin-top: 24px;
}

.already-member a {
  color: #dc2626;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.already-member a:hover {
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
