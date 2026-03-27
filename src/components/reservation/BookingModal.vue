<template>
  <div v-if="isOpen" class="booking-overlay" @click.self="close">
    <div class="booking-panel">
      <div class="booking-header">
        <h3>Đặt bàn</h3>
        <button class="icon-btn" @click="close">×</button>
      </div>

      <form @submit.prevent="submitReservation">
        <div class="form-group">
          <label>Họ và tên</label>
          <input v-model="fullName" type="text" required />
        </div>
        <div class="form-group">
          <label>Số điện thoại</label>
          <input v-model="phone" type="text" placeholder="0123456789" required />
          <small v-if="phoneError" class="text-danger">Số điện thoại phải đủ 10 số</small>
        </div>

        <div class="grid">
          <div class="form-group">
            <label>Ngày đặt</label>
            <input v-model="date" type="date" :min="today" required />
          </div>
          <div class="form-group">
            <label>Giờ đến</label>
            <select v-model="time" required>
              <option value="">Chọn giờ</option>
              <option v-for="t in timeSlots" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <div class="grid">
          <div class="form-group">
            <label>Số lượng khách</label>
            <select v-model.number="guestCount" required>
              <option :value="null">Chọn số khách</option>
              <option v-for="n in guestOptions" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Ưu đãi</label>
            <select v-model="promotionType" required>
              <option value="">Chọn ưu đãi</option>
              <option v-for="p in promotions" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
        </div>

        <div v-if="foodNote" class="form-group">
          <label>Món đặt trước (tham khảo)</label>
          <textarea
            :value="foodNote"
            rows="3"
            readonly
            class="readonly-textarea"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Ghi chú của khách</label>
          <textarea
            v-model="customerNote"
            rows="3"
            placeholder="Ví dụ: cần ghép bàn, có trẻ em..."
          ></textarea>
        </div>

        <div v-if="msg" class="text-danger">{{ msg }}</div>

        <button class="btn-primary" :disabled="loadingSubmit">
          {{ loadingSubmit ? 'Đang đặt bàn...' : 'Xác nhận đặt bàn' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createReservation } from '@/services/reservationApi'
import { useBookingStore } from '@/composables/bookingStore'

const router = useRouter()
const { isOpen, presetNote, close } = useBookingStore()

const fullName = ref('')
const phone = ref('')
const date = ref('')
const time = ref('')
const guestCount = ref<number | null>(null)
const promotionType = ref('')
const customerNote = ref('')
const foodNote = ref('')
const msg = ref('')
const phoneError = ref(false)
const loadingSubmit = ref(false)

const today = new Date().toISOString().split('T')[0]

const guestOptions = Array.from({ length: 20 }, (_, i) => i + 1)
const promotions = [
  'Ưu đãi sinh nhật 10% tổng hóa đơn',
  'Có mã ưu đãi riêng',
  'Đầy tiền không cần ưu đãi',
]

const timeSlots = computed(() => {
  const slots: string[] = []
  for (let h = 10; h <= 22; h++) {
    for (let m = 0; m < 60; m += 10) {
      const hour = String(h).padStart(2, '0')
      const minute = String(m).padStart(2, '0')
      slots.push(`${hour}:${minute}`)
    }
  }
  return slots
})

const validatePhone = () => /^[0-9]{10}$/.test(phone.value)

const buildReservedAt = () => {
  if (!date.value || !time.value) return ''
  return `${date.value}T${time.value}`
}

watch(isOpen, (val) => {
  if (!val) return
  msg.value = ''
  phoneError.value = false
  loadingSubmit.value = false
  customerNote.value = ''
  foodNote.value = presetNote.value || ''
})

const submitReservation = async () => {
  msg.value = ''

  if (!validatePhone()) {
    phoneError.value = true
    return
  }
  phoneError.value = false

  if (!guestCount.value || !date.value || !time.value) {
    msg.value = 'Vui lòng chọn ngày, giờ và số khách'
    return
  }

  if (!promotionType.value) {
    msg.value = 'Vui lòng chọn ưu đãi'
    return
  }

  loadingSubmit.value = true
  try {
    const reservedAt = buildReservedAt()
    const payload = {
      fullName: fullName.value,
      phoneNumber: phone.value,
      guestCount: guestCount.value,
      reservedAt,
      note: customerNote.value,
      foodNote: foodNote.value,
      promotionType: promotionType.value,
    }

    const res = await createReservation(payload)
    const data = res.data?.data
    if (!data) {
      msg.value = 'Đặt bàn thất bại'
      return
    }
    sessionStorage.setItem('reservationSuccess', JSON.stringify(data))
    close()
    router.push('/reservation/success')
  } catch (e: any) {
    msg.value = e?.response?.data?.message || 'Đặt bàn thất bại'
  } finally {
    loadingSubmit.value = false
  }
}
</script>

<style scoped>
.booking-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.booking-panel {
  width: min(760px, 94vw);
  background: #fff;
  color: #2a1f1a;
  border-radius: 18px;
  padding: 24px;
  max-height: 85vh;
  overflow: auto;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-group input,
.form-group select,
.form-group textarea {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 10px 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.icon-btn {
  border: none;
  background: #eee;
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.btn-primary {
  border: none;
  background: #f0b66a;
  padding: 10px 20px;
  border-radius: 999px;
  font-weight: 700;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  background: #f4c07a;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
}
</style>
