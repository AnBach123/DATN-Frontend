<template>
  <div class="success-wrapper">
    <div class="success-card">
      <div class="success-icon">✓</div>
      <h2>Quý khách đã gửi yêu cầu đặt bàn thành công</h2>
      <p class="sub">
        Hệ thống sẽ ghi nhận thông tin và hiển thị chi tiết bên dưới.
      </p>

      <div class="divider"></div>

      <div v-if="data" class="info-grid">
        <div class="row">
          <span class="label">Mã đặt bàn</span>
          <span class="value">{{ data.reservationCode }}</span>
        </div>
        <div class="row">
          <span class="label">Tên khách</span>
          <span class="value">{{ data.fullName }}</span>
        </div>
        <div class="row">
          <span class="label">Số điện thoại</span>
          <span class="value">{{ data.phoneNumber }}</span>
        </div>
        <div class="row">
          <span class="label">Tổng khách</span>
          <span class="value">{{ data.guestCount }} khách</span>
        </div>
        <div class="row">
          <span class="label">Ngày & giờ đến</span>
          <span class="value">{{ formatDateTime(data.reservedAt) }}</span>
        </div>
        <div class="row">
          <span class="label">Ưu đãi</span>
          <span class="value">{{ data.promotionType }}</span>
        </div>
        <div class="row" v-if="data.note">
          <span class="label">Ghi chú khách</span>
          <span class="value">{{ data.note }}</span>
        </div>
        <div class="row">
          <span class="label">Bàn đã xếp</span>
          <span class="value">{{ tableText }}</span>
        </div>
      </div>

      <div v-else class="empty-state">
        Không có thông tin đặt bàn. Vui lòng đặt bàn lại.
      </div>

      <div v-if="statusMsg" :class="['status', statusType]">
        {{ statusMsg }}
      </div>

      <div class="actions" v-if="data">
        <button class="btn primary" @click="goHome">Trở về trang chủ</button>
        <button class="btn outline" :disabled="sending" @click="sendEmail">
          {{ sending ? 'Đang gửi...' : 'Gửi thông tin về email' }}
        </button>
      </div>

      <div class="actions" v-else>
        <button class="btn primary" @click="goReservation">Đặt bàn lại</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { sendReservationEmail } from '@/services/reservationApi'

type TableInfo = {
  id: number
  tableCode: string
  tableName: string
  seatingCapacity: number
}

type ReservationResult = {
  reservationCode: string
  reservedAt: string
  guestCount: number
  fullName: string
  phoneNumber: string
  promotionType: string
  note?: string
  foodNote?: string
  tables: TableInfo[]
}

const router = useRouter()
const data = ref<ReservationResult | null>(null)
const statusMsg = ref('')
const statusType = ref<'success' | 'error'>('success')
const sending = ref(false)

onMounted(() => {
  const raw = sessionStorage.getItem('reservationSuccess')
  if (raw) {
    data.value = JSON.parse(raw)
  }
})

const tableText = computed(() => {
  if (!data.value?.tables?.length) return 'Chưa có'
  return data.value.tables
    .map((t) => `${t.tableCode} (${t.seatingCapacity} chỗ)`)
    .join(', ')
})

const formatDateTime = (value: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const goHome = () => router.push('/home')
const goReservation = () => router.push('/reservation')

const sendEmail = async () => {
  if (!data.value?.reservationCode) return
  statusMsg.value = ''
  sending.value = true
  try {
    await sendReservationEmail(data.value.reservationCode)
    statusType.value = 'success'
    statusMsg.value = 'Đã gửi email thành công'
  } catch (e: any) {
    statusType.value = 'error'
    statusMsg.value = e?.response?.data?.message || 'Gửi email thất bại'
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.success-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #b1120a 0%, #8e0e0a 50%, #6d0b0b 100%);
  padding: 60px 16px;
}

.success-card {
  width: min(560px, 95vw);
  background: #ffffff;
  border-radius: 24px;
  padding: 32px 28px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  text-align: center;
  border-top: 6px solid #f0b66a;
}

.success-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  border-radius: 50%;
  border: 4px solid #1d7a4b;
  color: #1d7a4b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
}

h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #2a1f1a;
}

.sub {
  margin: 0;
  color: #6b5f57;
  font-size: 14px;
}

.divider {
  height: 1px;
  background: #e9dccd;
  margin: 18px 0;
}

.info-grid {
  text-align: left;
  display: grid;
  gap: 8px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  gap: 8px;
  font-size: 14px;
}

.label {
  color: #6b5f57;
}

.value {
  color: #2a1f1a;
  font-weight: 600;
}

.actions {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  border: none;
  padding: 12px 16px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: #d47a1f;
  color: #fff;
}

.btn.outline {
  background: transparent;
  border: 2px solid #d47a1f;
  color: #d47a1f;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status {
  margin-top: 12px;
  font-size: 13px;
}

.status.success {
  color: #1d7a4b;
}

.status.error {
  color: #c0392b;
}

.empty-state {
  color: #6b5f57;
  font-size: 14px;
  margin: 12px 0 8px;
}
</style>
