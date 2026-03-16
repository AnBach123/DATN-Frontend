<template>
  <div>
    <h3 class="mb-4">Check In Khách Hàng</h3>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-2 align-items-center">
          <div class="col-md-4">
            <input
              v-model.trim="reservationCode"
              class="form-control"
              placeholder="Nhập mã đặt bàn"
            />
          </div>

          <div class="col-md-2">
            <button class="btn btn-danger w-100" :disabled="loading" @click="searchReservation">
              {{ loading ? 'Đang tìm...' : 'Tìm' }}
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="text-danger mt-2">{{ errorMsg }}</div>
      </div>
    </div>

    <div v-if="reservation" class="card">
      <div class="card-body">
        <div class="row g-2">
          <div class="col-md-6"><b>Mã đặt bàn</b> {{ reservation.reservationCode }}</div>
          <div class="col-md-6"><b>Trạng thái:</b> {{ reservation.invoiceStatus }}</div>

          <div class="col-md-6"><b>Tên khách</b> {{ reservation.fullName }}</div>
          <div class="col-md-6"><b>Số điện thoại:</b> {{ reservation.phoneNumber }}</div>

          <div class="col-md-6"><b>Thời gian:</b> {{ formatDateTime(reservation.reservedAt) }}</div>
          <div class="col-md-6"><b>Số khách:</b> {{ reservation.guestCount }}</div>

          <div class="col-md-6"><b>Ưu đãi:</b> {{ reservation.promotionType }}</div>
          <div class="col-md-6"><b>Bàn đã xếp:</b> {{ tableText }}</div>

          <div class="col-12" v-if="reservation.note">
            <b>Ghi chú khách hàng:</b> {{ reservation.note }}
          </div>
          <div class="col-12" v-if="reservation.foodNote">
            <b>Ghi chú món ăn:</b> {{ reservation.foodNote }}
          </div>
        </div>

        <div class="mt-3">
          <button class="btn btn-success" :disabled="checkingIn" @click="checkIn">
            {{ checkingIn ? 'Đang check-in...' : 'Check-in' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getReservationByCode, checkInReservation } from '@/services/reservationApi'

interface TableInfo {
  id: number
  tableCode: string
  tableName: string
  seatingCapacity: number
}

interface Reservation {
  reservationCode: string
  reservedAt: string
  guestCount: number
  fullName: string
  phoneNumber: string
  invoiceStatus: string
  promotionType: string
  note?: string
  foodNote?: string
  tables: TableInfo[]
}

const reservationCode = ref('')
const reservation = ref<Reservation | null>(null)
const loading = ref(false)
const checkingIn = ref(false)
const errorMsg = ref('')

const tableText = computed(() => {
  if (!reservation.value?.tables?.length) return 'Chưa có'
  return reservation.value.tables
    .map((t) => `${t.tableCode} (ID ${t.id} - ${t.seatingCapacity} chỗ)`)
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

async function searchReservation() {
  errorMsg.value = ''
  reservation.value = null
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
    reservation.value = data
  } catch (error: any) {
    errorMsg.value = error?.response?.data?.message || 'Tra cứu thất bại'
  } finally {
    loading.value = false
  }
}

async function checkIn() {
  if (!reservation.value?.reservationCode) return
  errorMsg.value = ''
  checkingIn.value = true
  try {
    const res = await checkInReservation(reservation.value.reservationCode)
    const data = res.data?.data
    if (data) {
      reservation.value = data
    }
    alert('Check-in thành công')
  } catch (error: any) {
    errorMsg.value = error?.response?.data?.message || 'Check-in thất bại'
  } finally {
    checkingIn.value = false
  }
}
</script>
