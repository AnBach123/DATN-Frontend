<template>
  <div class="staff-page">
    <div class="lookup-card">
      <div class="header">
        <div>
          <p class="eyebrow">Nhân viên</p>
          <h2>Tra cứu đặt bàn</h2>
          <p class="sub">Nhập mã đặt bàn để xem thông tin khách và bàn đã xếp.</p>
        </div>
      </div>

      <div class="form-row">
        <input
          v-model.trim="reservationCode"
          type="text"
          placeholder="VD: RSV-1712345678901"
          @keyup.enter="fetchReservation"
        />
        <button class="btn primary" :disabled="loading" @click="fetchReservation">
          {{ loading ? 'Đang tra cứu...' : 'Tra cứu' }}
        </button>
      </div>

      <div v-if="errorMsg" class="status error">{{ errorMsg }}</div>

      <div v-if="result" class="result">
        <div class="grid">
          <div class="row">
            <span class="label">Mã đặt bàn</span>
            <span class="value">{{ result.reservationCode }}</span>
          </div>
          <div class="row">
            <span class="label">Tên khách</span>
            <span class="value">{{ result.fullName }}</span>
          </div>
          <div class="row">
            <span class="label">Số điện thoại</span>
            <span class="value">{{ result.phoneNumber }}</span>
          </div>
          <div class="row">
            <span class="label">Tổng khách</span>
            <span class="value">{{ result.guestCount }} khách</span>
          </div>
          <div class="row">
            <span class="label">Ngày & giờ đến</span>
            <span class="value">{{ formatDateTime(result.reservedAt) }}</span>
          </div>
          <div class="row">
            <span class="label">Ưu đãi</span>
            <span class="value">{{ result.promotionType }}</span>
          </div>
          <div class="row" v-if="result.note">
            <span class="label">Ghi chú khách</span>
            <span class="value">{{ result.note }}</span>
          </div>
          <div class="row" v-if="result.foodNote">
            <span class="label">Ghi chú món ăn</span>
            <span class="value">{{ result.foodNote }}</span>
          </div>
          <div class="row">
            <span class="label">Bàn đã xếp</span>
            <span class="value">{{ tableText }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getReservationByCode } from '@/services/reservationApi'

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

const reservationCode = ref('')
const loading = ref(false)
const errorMsg = ref('')
const result = ref<ReservationResult | null>(null)

const tableText = computed(() => {
  if (!result.value?.tables?.length) return 'Chưa có'
  return result.value.tables
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

const fetchReservation = async () => {
  errorMsg.value = ''
  result.value = null
  const code = reservationCode.value.trim()
  if (!code) {
    errorMsg.value = 'Vui lòng nhập mã đặt bàn'
    return
  }

  loading.value = true
  try {
    const res = await getReservationByCode(code)
    const data = res.data?.data
    if (!data) {
      errorMsg.value = 'Không tìm thấy thông tin đặt bàn'
      return
    }
    result.value = data
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message || 'Tra cứu thất bại'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap');

.staff-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  background: radial-gradient(circle at top, #6e1d1d 0%, #8f2f2f 45%, #5b1515 100%);
}

.lookup-card {
  width: min(720px, 94vw);
  background: #fff9f3;
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 3px;
  font-size: 11px;
  color: #b46a2c;
  margin: 0 0 6px;
}

h2 {
  font-family: 'Playfair Display', serif;
  margin: 0 0 6px;
  color: #2a1f1a;
}

.sub {
  margin: 0;
  color: #6b5f57;
  font-size: 14px;
}

.form-row {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}

input {
  border: 1px solid #e3d6c9;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
}

.btn {
  border: none;
  padding: 10px 20px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.btn.primary {
  background: #f0b66a;
  color: #3a1f12;
}

.btn.primary:hover {
  transform: translateY(-1px);
  background: #f4c07a;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
}

.status {
  margin-top: 12px;
  font-size: 13px;
}

.status.error {
  color: #c0392b;
}

.result {
  margin-top: 20px;
  background: #fff;
  border-radius: 16px;
  padding: 18px;
  border: 1px solid #f1e4d6;
}

.grid {
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

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
