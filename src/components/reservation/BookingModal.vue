<template>
  <div v-if="isOpen" class="booking-overlay" @click.self="close">
    <div class="booking-panel">
      <div class="booking-header">
        <h3>Đặt bàn</h3>
        <button class="icon-btn" @click="close">×</button>
      </div>

      <form @submit.prevent="submitReservation">
        <!-- Thông tin liên hệ - Hiển thị text -->
        <div class="info-display">
          <div class="info-header">
            <span class="info-title">Thông tin liên hệ</span>
            <a 
              href="#" 
              class="custom-link"
              @click.prevent="openCustomForm"
            >
              Nhập thông tin khác
            </a>
          </div>
          <div class="info-content">
            <div class="info-item">
              <span class="info-label">Họ và tên:</span>
              <span class="info-value">{{ userInfo.fullName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Số điện thoại:</span>
              <span class="info-value">{{ userInfo.phoneNumber }}</span>
            </div>
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
const { isOpen, presetNote, close, openCustom } = useBookingStore()

const date = ref('')
const time = ref('')
const guestCount = ref<number | null>(null)
const customerNote = ref('')
const foodNote = ref('')
const msg = ref('')
const loadingSubmit = ref(false)

const today = new Date().toISOString().split('T')[0]

// Lấy thông tin user từ localStorage
const userInfo = computed(() => {
  try {
    // Thử lấy từ object 'user' trước
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      return {
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || ''
      }
    }
    
    // Fallback: lấy từ các key riêng lẻ
    return {
      fullName: localStorage.getItem('fullName') || '',
      phoneNumber: localStorage.getItem('phoneNumber') || ''
    }
  } catch {
    // Fallback: lấy từ các key riêng lẻ
    return {
      fullName: localStorage.getItem('fullName') || '',
      phoneNumber: localStorage.getItem('phoneNumber') || ''
    }
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

const buildReservedAt = () => {
  if (!date.value || !time.value) return ''
  return `${date.value}T${time.value}`
}

const openCustomForm = () => {
  close()
  openCustom(foodNote.value)
}

watch(isOpen, (val) => {
  if (!val) return
  msg.value = ''
  loadingSubmit.value = false
  customerNote.value = ''
  foodNote.value = presetNote.value || ''
})

const submitReservation = async () => {
  msg.value = ''

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
      guestName: null,
      guestPhone: null,
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

.info-display {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.info-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #2a1f1a;
}

.custom-link {
  color: #f0b66a;
  font-size: 0.875rem;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.custom-link:hover {
  color: #d89d4f;
  text-decoration: underline;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.info-label {
  font-weight: 500;
  color: #6c757d;
  min-width: 110px;
}

.info-value {
  color: #2a1f1a;
  font-weight: 600;
  font-size: 1rem;
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
