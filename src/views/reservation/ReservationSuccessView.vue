<template>
  <div class="success-container">
    <div class="success-card">
      <div class="success-icon">✓</div>
      <h2 class="success-title">Yêu cầu đặt bàn đã được ghi nhận!</h2>
      
      <div class="info-section">
        <div class="info-row">
          <span class="label">Mã đặt bàn:</span>
          <span class="value code">{{ reservationCode }}</span>
        </div>
        <div class="info-row">
          <span class="label">Tên khách hàng:</span>
          <span class="value">{{ fullName }}</span>
        </div>
        <div class="info-row">
          <span class="label">Số điện thoại:</span>
          <span class="value">{{ phoneNumber }}</span>
        </div>
        <div class="info-row">
          <span class="label">Số lượng khách:</span>
          <span class="value">{{ guestCount }} người</span>
        </div>
        <div class="info-row">
          <span class="label">Thời gian đến:</span>
          <span class="value">{{ formatDateTime(reservedAt) }}</span>
        </div>
      </div>

      <div class="pending-notice">
        <div class="notice-icon">📞</div>
        <div class="notice-content">
          <h3>Lễ tân sẽ gọi xác nhận trong 2-3 phút</h3>
          <p>Vui lòng giữ máy để nhận cuộc gọi xác nhận từ nhà hàng. Chúng tôi sẽ xác nhận khu vực bàn phù hợp với yêu cầu của quý khách.</p>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn-secondary" @click="goHome">Về trang chủ</button>
      </div>
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
    const reservation = JSON.parse(data)
    reservationCode.value = reservation.reservationCode || ''
    fullName.value = reservation.fullName || ''
    phoneNumber.value = reservation.phoneNumber || ''
    guestCount.value = reservation.guestCount || 0
    reservedAt.value = reservation.reservedAt || ''
    
    // Clear session storage after reading
    sessionStorage.removeItem('reservationSuccess')
  } else {
    // No data, redirect to home
    router.push('/')
  }
})

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.success-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 90px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.success-card {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 24px;
  padding: 48px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.5s ease;
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

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: white;
  font-weight: bold;
}

.success-title {
  text-align: center;
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 32px 0;
}

.info-section {
  background: #f9fafb;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-size: 15px;
  font-weight: 600;
  color: #6b7280;
}

.value {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.value.code {
  font-family: 'Courier New', monospace;
  background: #eef2ff;
  padding: 4px 12px;
  border-radius: 8px;
  color: #667eea;
}

.pending-notice {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border-left: 4px solid #f97316;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.notice-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.notice-content h3 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.notice-content p {
  font-size: 15px;
  font-weight: 500;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn-secondary {
  padding: 14px 32px;
  background: white;
  color: #667eea;
  font-weight: 700;
  font-size: 16px;
  border: 2px solid #667eea;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
