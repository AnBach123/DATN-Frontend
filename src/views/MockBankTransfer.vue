<template>
  <div class="bank-app">
    <div class="bank-header">
      <button class="btn-back" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <h3>Chuyển khoản</h3>
      <div></div>
    </div>

    <div class="bank-content">
      <div class="transfer-info">
        <div class="info-section">
          <label>Ngân hàng nhận</label>
          <div class="info-value">
            <img src="https://api.vietqr.io/img/ICB.png" alt="Vietcombank" class="bank-logo" />
            <span>Vietcombank</span>
          </div>
        </div>

        <div class="info-section">
          <label>Số tài khoản</label>
          <div class="info-value">0123456789</div>
        </div>

        <div class="info-section">
          <label>Tên người nhận</label>
          <div class="info-value">NGUYEN VAN A</div>
        </div>

        <div class="info-section">
          <label>Số tiền</label>
          <div class="info-value amount">{{ formatMoney(amount) }}</div>
        </div>

        <div class="info-section">
          <label>Nội dung</label>
          <div class="info-value">{{ orderInfo }}</div>
        </div>
      </div>

      <button 
        class="btn-transfer" 
        :disabled="processing"
        @click="confirmTransfer"
      >
        {{ processing ? 'Đang xử lý...' : 'Xác nhận chuyển khoản' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()

const amount = ref(0)
const orderInfo = ref('')
const invoiceId = ref(0)
const processing = ref(false)

onMounted(() => {
  // Lấy thông tin từ query params (dùng key ngắn)
  amount.value = Number(route.query.amt) || 0
  orderInfo.value = `Thanh toan hoa don`
  invoiceId.value = Number(route.query.iid) || 0
})

const goBack = () => {
  router.back()
}

const confirmTransfer = async () => {
  processing.value = true

  try {
    // Gửi notification đến server qua proxy
    const tableId = Number(route.query.tid)
    
    await axios.post(`/api/public/notification/send/${tableId}`, {
      amount: amount.value,
      invoiceId: invoiceId.value
    })

    // Hiển thị toast thành công với animated checkmark
    const Toast = Swal.mixin({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'payment-success-toast',
        icon: 'payment-success-icon'
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    })

    await Toast.fire({
      icon: 'success',
      title: 'Thanh toán thành công!',
      html: `
        <div style="text-align: center; margin-top: 8px;">
          <p style="font-size: 16px; font-weight: 600; color: #28a745; margin: 8px 0;">
            ${formatMoney(amount.value)}
          </p>
          <p style="font-size: 13px; color: #666; margin: 4px 0;">
            Cảm ơn quý khách!
          </p>
        </div>
      `
    })
  } catch (error: any) {
    console.error('Payment error:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Có lỗi xảy ra',
      text: 'Vui lòng thông báo cho nhân viên',
      confirmButtonText: 'Đóng',
    })
  } finally {
    processing.value = false
  }
}

const formatMoney = (value: number) => value.toLocaleString('vi-VN') + 'đ'
</script>

<style scoped>
.bank-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Be Vietnam Pro', sans-serif;
}

.bank-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
  color: white;
}

.bank-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.btn-back {
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bank-content {
  padding: 24px 20px;
}

.transfer-info {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-section {
  margin-bottom: 20px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #222;
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-value.amount {
  font-size: 24px;
  color: #e74c3c;
}

.bank-logo {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.btn-transfer {
  width: 100%;
  padding: 16px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-transfer:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.btn-transfer:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Custom toast styles */
:deep(.payment-success-toast) {
  background: white !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
  padding: 20px !important;
  min-width: 320px !important;
  max-width: 90vw !important;
}

:deep(.payment-success-icon) {
  border-color: #28a745 !important;
  color: #28a745 !important;
  animation: checkmarkSpin 0.8s ease-in-out !important;
}

@keyframes checkmarkSpin {
  0% {
    transform: rotate(0deg) scale(0);
    opacity: 0;
  }
  50% {
    transform: rotate(180deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
    opacity: 1;
  }
}
</style>
