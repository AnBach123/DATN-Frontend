<template>
  <div class="success-page">
    <div class="success-card">
      <!-- ICON -->
      <div class="s-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <h2>Đặt bàn thành công!</h2>
      <p class="s-sub">Yêu cầu của bạn đã được ghi nhận</p>

      <!-- THÔNG TIN -->
      <div class="s-info">
        <div class="s-row">
          <span>Mã đặt bàn</span>
          <strong class="s-code">{{ reservationCode }}</strong>
        </div>
        <div class="s-row">
          <span>Khách hàng</span>
          <strong>{{ fullName }}</strong>
        </div>
        <div class="s-row">
          <span>Số điện thoại</span>
          <strong>{{ phoneNumber }}</strong>
        </div>
        <div class="s-row">
          <span>Số khách</span>
          <strong>{{ guestCount }} người</strong>
        </div>
        <div class="s-row">
          <span>Thời gian đến</span>
          <strong>{{ formatDateTime(reservedAt) }}</strong>
        </div>
      </div>

      <!-- THÔNG BÁO -->
      <div class="s-notice">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a80000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        <div>
          <strong>Lễ tân sẽ gọi xác nhận trong vài phút</strong>
          <p>Vui lòng giữ máy để nhận cuộc gọi xác nhận từ nhà hàng</p>
        </div>
      </div>

      <!-- NÚT -->
      <button class="s-btn" @click="goHome">Về trang chủ</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const reservationCode = ref('')
const fullName = ref('')
const phoneNumber = ref('')
const guestCount = ref(0)
const reservedAt = ref('')

onMounted(() => {
  const data = sessionStorage.getItem('reservationSuccess')
  if (data) {
    const r = JSON.parse(data)
    reservationCode.value = r.reservationCode || ''
    fullName.value = r.fullName || ''
    phoneNumber.value = r.phoneNumber || ''
    guestCount.value = r.guestCount || 0
    reservedAt.value = r.reservedAt || ''
    sessionStorage.removeItem('reservationSuccess')
  } else {
    router.push('/')
  }
})

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const time = d.toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit' })
  const day = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${time} - ${day}`
}

const goHome = () => router.push('/home')
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');

.success-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  padding-top: 90px;
  background: #3a1010;
  font-family: 'Manrope', sans-serif;
  position: relative;
}

.success-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 30%, rgba(168,0,0,0.2) 0%, transparent 70%);
}

.success-card {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: #faf8f5;
  border-radius: 20px;
  padding: 36px 28px;
  text-align: center;
  animation: cardIn 0.4s ease;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ICON */
.s-icon {
  width: 68px; height: 68px; margin: 0 auto 18px;
  background: #a80000; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 20px rgba(168,0,0,0.25);
}

.success-card h2 {
  font-family: 'Playfair Display', serif;
  font-size: 24px; font-weight: 800; color: #1a1a1a; margin: 0 0 4px;
}

.s-sub { font-size: 14px; color: #999; margin: 0 0 24px; }

/* INFO */
.s-info {
  background: white; border-radius: 12px; padding: 4px 0;
  border: 1px solid #ede8e0; margin-bottom: 18px; text-align: left;
}

.s-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 11px 18px; border-bottom: 1px solid #f5f0eb;
}
.s-row:last-child { border-bottom: none; }
.s-row span { font-size: 13px; color: #999; }
.s-row strong { font-size: 14px; color: #1a1a1a; }

.s-code {
  font-family: 'Courier New', monospace;
  background: #fff0f0; color: #a80000; padding: 3px 10px; border-radius: 6px;
  font-size: 13px !important;
}

/* NOTICE */
.s-notice {
  display: flex; gap: 12px; align-items: flex-start;
  background: white; border-left: 3px solid #a80000;
  border-radius: 10px; padding: 14px 16px; margin-bottom: 22px;
  text-align: left;
}
.s-notice svg { flex-shrink: 0; margin-top: 2px; }
.s-notice strong { font-size: 13px; color: #1a1a1a; display: block; margin-bottom: 3px; }
.s-notice p { font-size: 12px; color: #888; margin: 0; line-height: 1.5; }

/* BUTTON */
.s-btn {
  width: 100%; padding: 12px; border: none; border-radius: 999px;
  background: #a80000; color: white; font-weight: 700; font-size: 15px;
  cursor: pointer; transition: 0.2s;
}
.s-btn:hover { background: #8b0000; }

@media (max-width: 480px) {
  .success-card { padding: 28px 20px; }
  .success-card h2 { font-size: 20px; }
}
</style>
