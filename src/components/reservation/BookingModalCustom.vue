<template>
  <div v-if="isCustomOpen" class="booking-overlay" @click.self="closeCustom">
    <div class="booking-panel">
      <div class="booking-header">
        <h3>Đặt bàn với thông tin khác</h3>
        <button class="icon-btn" @click="closeCustom">×</button>
      </div>

      <form @submit.prevent="submitReservation">
        <!-- Thông tin liên hệ - Có thể chỉnh sửa -->
        <div class="info-section">
          <div class="section-header">
            <span class="section-title">Thông tin liên hệ</span>
            <a 
              href="#" 
              class="back-link"
              @click.prevent="backToMainForm"
            >
              Dùng thông tin tài khoản
            </a>
          </div>
          <div class="form-group">
            <label>Họ và tên</label>
            <input 
              v-model="fullName" 
              type="text" 
              placeholder="Nhập họ và tên"
              required 
            />
          </div>
          <div class="form-group">
            <label>Số điện thoại</label>
            <input 
              v-model="phone" 
              type="tel" 
              placeholder="Nhập số điện thoại"
              :class="{ 'error-input': phoneError }"
              required 
            />
            <span v-if="phoneError" class="text-danger">Số điện thoại phải có 10 chữ số</span>
          </div>
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
            <input 
              v-model.number="guestCount" 
              type="number" 
              min="1" 
              max="302" 
              placeholder="Nhập số khách"
              required 
            />
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
const { isCustomOpen, presetNote, closeCustom, open } = useBookingStore()

const fullName = ref('')
const phone = ref('')
const date = ref('')
const time = ref('')
const guestCount = ref<number | null>(null)
const customerNote = ref('')
const foodNote = ref('')
const msg = ref('')
const phoneError = ref(false)
const loadingSubmit = ref(false)

const today = new Date().toISOString().split('T')[0]

// Lấy thông tin user từ localStorage để lấy customer_id
const userInfo = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return {
      fullName: user.fullName || '',
      phoneNumber: user.phoneNumber || ''
    }
  } catch {
    return { fullName: '', phoneNumber: '' }
  }
})

const timeSlots = computed(() => {
  const slots: string[] = []
  for (let h = 9; h <= 22; h++) {
    for (let m = 0; m < 60; m += 10) {
      if (h === 22 && m > 0) break
      const hour = String(h).padStart(2, '0')
      const minute = String(m).padStart(2, '0')
      slots.push(`${hour}:${minute}`)
    }
  }
  
  // Lọc bỏ giờ quá khứ nếu chọn ngày hôm nay
  if (date.value) {
    const selectedDate = new Date(date.value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)
    
    // Nếu chọn ngày hôm nay, chỉ hiện giờ từ hiện tại trở đi
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      
      return slots.filter(slot => {
        const [h, m] = slot.split(':').map(Number)
        if (h === undefined || m === undefined) return false
        const slotTime = h * 60 + m
        const currentTime = currentHour * 60 + currentMinute
        return slotTime > currentTime
      })
    }
  }
  
  return slots
})

const validatePhone = () => /^[0-9]{10}$/.test(phone.value)

const buildReservedAt = () => {
  if (!date.value || !time.value) return ''
  return `${date.value}T${time.value}`
}

const backToMainForm = () => {
  closeCustom()
  open(foodNote.value)
}

watch(isCustomOpen, (val) => {
  if (!val) return
  msg.value = ''
  phoneError.value = false
  loadingSubmit.value = false
  customerNote.value = ''
  foodNote.value = presetNote.value || ''
  fullName.value = ''
  phone.value = ''
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

  loadingSubmit.value = true
  try {
    const reservedAt = buildReservedAt()
    const payload = {
      fullName: userInfo.value.fullName,
      phoneNumber: userInfo.value.phoneNumber,
      guestCount: guestCount.value,
      reservedAt,
      note: customerNote.value,
      foodNote: foodNote.value,
      guestName: fullName.value,
      guestPhone: phone.value,
    }

    const res = await createReservation(payload)
    const data = res.data?.data
    if (!data) {
      msg.value = 'Đặt bàn thất bại'
      return
    }
    sessionStorage.setItem('reservationSuccess', JSON.stringify(data))
    closeCustom()
    router.push('/reservation/success')
  } catch (e: unknown) {
    const error = e as { response?: { data?: { message?: string } } }
    msg.value = error?.response?.data?.message || 'Đặt bàn thất bại'
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

.form-group input.error-input {
  border-color: #dc3545;
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
  cursor: pointer;
}

.btn-primary {
  width: 100%;
  border: none;
  background: #f0b66a;
  padding: 10px 20px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #f4c07a;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.readonly-textarea {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: #666;
}

.info-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #2a1f1a;
}

.back-link {
  color: #f0b66a;
  font-size: 0.875rem;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.back-link:hover {
  color: #d89d4f;
  text-decoration: underline;
}

.account-info {
  background: #fff3e0;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 4px solid #f0b66a;
}

.account-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 4px;
}

.account-value {
  font-weight: 600;
  color: #2a1f1a;
  font-size: 0.95rem;
}

.text-danger {
  color: #dc3545;
  font-size: 0.875rem;
  margin-bottom: 12px;
}
</style>
