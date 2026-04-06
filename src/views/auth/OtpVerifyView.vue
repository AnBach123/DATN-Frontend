<script setup lang="ts">
import { callSendOtp, callVerifyOtp } from '@/services/authApi'
import Swal from 'sweetalert2'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const otpCode = ref('')
const loading = ref(false)
const resendLoading = ref(false)
const msg = ref('')

const secondsLeft = ref(0)
const endAtMs = ref<number | null>(null)
let timerId: number | null = null

const lockSecondsLeft = ref(0)
const lockEndAtMs = ref<number | null>(null)
let lockTimerId: number | null = null

type ApiErr = {
  message?: string
  errors?: Array<{ field: string; error: string }>
  lockRemainingSeconds?: number
  data?: {
    lockRemainingSeconds?: number
  }
}

function extractErrorMessage(error: unknown): string {
  const e = error as ApiErr
  if (e?.errors?.length) {
    return e.errors.map((x) => `${x.field}: ${x.error}`).join(' | ')
  }
  return e?.message ?? 'Có lỗi xảy ra'
}

function extractLockSeconds(error: unknown): number | null {
  const e = error as ApiErr

  if (
    typeof e?.lockRemainingSeconds === 'number' &&
    Number.isFinite(e.lockRemainingSeconds) &&
    e.lockRemainingSeconds > 0
  ) {
    return Math.floor(e.lockRemainingSeconds)
  }

  if (
    typeof e?.data?.lockRemainingSeconds === 'number' &&
    Number.isFinite(e.data.lockRemainingSeconds) &&
    e.data.lockRemainingSeconds > 0
  ) {
    return Math.floor(e.data.lockRemainingSeconds)
  }

  const text = extractErrorMessage(error)
  const match = text.match(/(\d+)\s*gi(?:ây|ay|a)y?/i)
  if (match) {
    return Number(match[1])
  }

  return null
}

const email = computed(() => {
  const qEmail = route.query.email
  if (typeof qEmail === 'string' && qEmail.trim()) return qEmail.trim()

  const storageEmail = sessionStorage.getItem('pending_email')
  return storageEmail?.trim() ?? ''
})

function clearTimer() {
  if (timerId !== null) {
    window.clearTimeout(timerId)
    timerId = null
  }
}

function updateSecondsLeft(): boolean {
  if (!endAtMs.value) {
    secondsLeft.value = 0
    return false
  }

  const msLeft = endAtMs.value - Date.now()
  const secLeft = Math.max(0, Math.ceil(msLeft / 1000))
  secondsLeft.value = secLeft
  return msLeft > 0
}

function scheduleNextTick() {
  clearTimer()

  const alive = updateSecondsLeft()
  if (!alive) return

  const msLeft = (endAtMs.value as number) - Date.now()
  const delay = Math.max(80, msLeft % 1000 || 1000)
  timerId = window.setTimeout(scheduleNextTick, delay)
}

function startCountdown(sec: number) {
  clearTimer()

  const safeSec = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0
  if (safeSec <= 0) {
    secondsLeft.value = 0
    endAtMs.value = null
    return
  }

  endAtMs.value = Date.now() + safeSec * 1000
  scheduleNextTick()
}

function clearLockTimer() {
  if (lockTimerId !== null) {
    window.clearTimeout(lockTimerId)
    lockTimerId = null
  }
}

function updateLockSecondsLeft(): boolean {
  if (!lockEndAtMs.value) {
    lockSecondsLeft.value = 0
    return false
  }

  const msLeft = lockEndAtMs.value - Date.now()
  const secLeft = Math.max(0, Math.ceil(msLeft / 1000))
  lockSecondsLeft.value = secLeft
  return msLeft > 0
}

function scheduleNextLockTick() {
  clearLockTimer()

  const alive = updateLockSecondsLeft()
  if (!alive) return

  const msLeft = (lockEndAtMs.value as number) - Date.now()
  const delay = Math.max(80, msLeft % 1000 || 1000)
  lockTimerId = window.setTimeout(scheduleNextLockTick, delay)
}

function startLockCountdown(sec: number) {
  clearLockTimer()

  const safeSec = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0
  if (safeSec <= 0) {
    lockSecondsLeft.value = 0
    lockEndAtMs.value = null
    return
  }

  lockEndAtMs.value = Date.now() + safeSec * 1000
  scheduleNextLockTick()
}

function onVisibilityChange() {
  if (document.visibilityState !== 'visible') return

  if (endAtMs.value) {
    scheduleNextTick()
  }
  if (lockEndAtMs.value) {
    scheduleNextLockTick()
  }
}

async function onVerifyOtp() {
  if (!email.value) {
    msg.value = 'Không có email pending. Vui lòng đăng ký lại.'
    return
  }

  if (lockSecondsLeft.value > 0) {
    msg.value = `Tài khoản OTP đang bị khóa, thử lại sau ${lockSecondsLeft.value} giây`
    return
  }

  loading.value = true
  msg.value = ''

  try {
    const res = await callVerifyOtp({
      email: email.value,
      otpCode: otpCode.value.trim(),
    })

    sessionStorage.removeItem('pending_email')
    startLockCountdown(0)

    await Swal.fire({
      icon: 'success',
      title: 'Xác minh thành công',
      text: `Tài khoản ${res.data.email} đã được kích hoạt`,
      timer: 1300,
      timerProgressBar: true,
      showConfirmButton: false,
    })

    await router.push('/auth/login')
  } catch (e: unknown) {
    const lockSec = extractLockSeconds(e)

    if (lockSec && lockSec > 0) {
      startLockCountdown(lockSec)
      msg.value = ''
      await Swal.fire({
        icon: 'error',
        title: 'OTP tạm thời bị khóa',
        text: `Vui lòng thử lại sau ${lockSec} giây`,
      })
    } else {
      msg.value = extractErrorMessage(e)
      await Swal.fire({
        icon: 'error',
        title: 'Xác minh OTP thất bại',
        text: msg.value,
      })
    }
  } finally {
    loading.value = false
  }
}

function onOtpInput(e: Event) {
  const target = e.target as HTMLInputElement
  otpCode.value = target.value.replace(/\D/g, '').slice(0, 6)
}

async function onResendOtp() {
  if (!email.value || secondsLeft.value > 0 || lockSecondsLeft.value > 0) return

  resendLoading.value = true
  msg.value = ''

  try {
    const res = await callSendOtp({ email: email.value })
    const wait = res.data?.resendAfterSeconds ?? 60
    startCountdown(wait)

    await Swal.fire({
      icon: 'success',
      title: 'Đã gửi lại OTP',
      text: `Vui lòng kiểm tra email ${email.value}`,
      timer: 1000,
      showConfirmButton: false,
    })
  } catch (e: unknown) {
    const lockSec = extractLockSeconds(e)

    if (lockSec && lockSec > 0) {
      startLockCountdown(lockSec)
      msg.value = ''
    } else {
      msg.value = extractErrorMessage(e)
    }
  } finally {
    resendLoading.value = false
  }
}

onMounted(() => {
  const qWaitRaw = route.query.wait
  const qWait = Array.isArray(qWaitRaw) ? qWaitRaw[0] : qWaitRaw
  const initialWait = Number(qWait ?? 0)
  startCountdown(Number.isFinite(initialWait) ? initialWait : 0)

  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  clearTimer()
  clearLockTimer()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <main class="auth-layout">
    <div class="auth-container">
      <!-- Left Side - Restaurant Image (STATIC) -->
      <div class="image-section">
        <div class="image-overlay">
          <div class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <!-- Hot pot with fire -->
              <path d="M5 12 Q5 16, 12 16 Q19 16, 19 12"></path>
              <path d="M5 12 L5 10 Q5 8, 7 8 L17 8 Q19 8, 19 10 L19 12"></path>
              <path d="M4 10 Q3 10, 3 11"></path>
              <path d="M20 10 Q21 10, 21 11"></path>
              <path d="M8 6 Q8 4, 9 4" stroke-width="1.5"></path>
              <path d="M12 5 Q12 3, 13 3" stroke-width="1.5"></path>
              <path d="M16 6 Q16 4, 17 4" stroke-width="1.5"></path>
              <path d="M12 18 Q10 19, 10 20 Q10 21, 12 21 Q14 21, 14 20 Q14 19, 12 18 Z" fill="currentColor" opacity="0.3"></path>
            </svg>
          </div>
          <h1>Tinh Hoa Hội Tụ</h1>
          <p>Trải nghiệm ẩm thực đẳng cấp cùng không gian sang trọng</p>
        </div>
      </div>

      <!-- Right Side - OTP Form -->
      <div class="form-section">
        <div class="otp-form-container">
          <div class="form-header">
            <h2>Xác minh OTP</h2>
            <p class="email-display">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              {{ email }}
            </p>
          </div>

          <form @submit.prevent="onVerifyOtp" class="otp-form">
            <div class="form-group">
              <label>Nhập mã OTP (6 số)</label>
              <input
                v-model="otpCode"
                type="text"
                inputmode="numeric"
                pattern="[0-9]{6}"
                maxlength="6"
                required
                :disabled="lockSecondsLeft > 0"
                @input="onOtpInput"
                class="otp-input"
                placeholder="000000"
              />
            </div>

            <button type="submit" class="submit-btn" :disabled="loading || lockSecondsLeft > 0">
              <span v-if="!loading">Xác minh OTP</span>
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
                Đang xác minh...
              </span>
            </button>

            <button
              type="button"
              class="resend-btn"
              :disabled="resendLoading || secondsLeft > 0 || lockSecondsLeft > 0"
              @click="onResendOtp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              {{
                resendLoading
                  ? 'Đang gửi lại...'
                  : secondsLeft > 0
                    ? `Gửi lại sau ${secondsLeft}s`
                    : 'Gửi lại OTP'
              }}
            </button>
          </form>

          <div class="lock-message" v-if="lockSecondsLeft > 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Tài khoản OTP đang bị khóa, thử lại sau {{ lockSecondsLeft }} giây
          </div>

          <p class="error-message" v-else-if="msg">{{ msg }}</p>

          <p class="switch-link">
            Sai email?
            <RouterLink to="/auth/register">Đăng ký lại</RouterLink>
          </p>
        </div>
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

.otp-form-container {
  width: 100%;
  max-width: 440px;
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.form-header h2 {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
}

.email-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  color: #64748b;
  background: #f1f5f9;
  padding: 12px 20px;
  border-radius: 10px;
  margin: 0;
}

.email-display svg {
  color: #dc2626;
  flex-shrink: 0;
}

.otp-form {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
  margin-bottom: 8px;
}

.otp-input {
  width: 100%;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  letter-spacing: 8px;
  transition: all 0.3s ease;
  background: white;
  box-sizing: border-box;
}

.otp-input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.otp-input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.6;
}

.submit-btn {
  width: 100%;
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
  margin-bottom: 12px;
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

.resend-btn {
  width: 100%;
  padding: 14px;
  background: white;
  color: #dc2626;
  border: 2px solid #dc2626;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.resend-btn:hover:not(:disabled) {
  background: #fef2f2;
  transform: translateY(-1px);
}

.resend-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.lock-message {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-top: 16px;
  border: 1px solid #fecaca;
}

.lock-message svg {
  flex-shrink: 0;
}

.error-message {
  color: #dc2626;
  font-size: 14px;
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.switch-link {
  text-align: center;
  color: #64748b;
  font-size: 14px;
  margin-top: 24px;
}

.switch-link a {
  color: #dc2626;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.switch-link a:hover {
  color: #991b1b;
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 968px) {
  .auth-container {
    flex-direction: column;
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

  .otp-form {
    padding: 30px 24px;
  }

  .form-header h2 {
    font-size: 28px;
  }
}
</style>
