<template>
  <div v-if="isCustomOpen" class="bk-overlay" @click.self="closeCustom">
    <div class="bk-panel">
      <!-- HEADER -->
      <div class="bk-header">
        <div class="bk-header-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <h3>Đặt bàn với thông tin khác</h3>
        </div>
        <button class="bk-close" @click="closeCustom">&times;</button>
      </div>

      <form @submit.prevent="submitReservation" class="bk-body">
        <!-- THÔNG TIN LIÊN HỆ -->
        <div class="bk-info">
          <div class="bk-info-head">
            <span>Thông tin người dùng bữa</span>
            <a href="#" @click.prevent="backToMainForm">Dùng thông tin tài khoản</a>
          </div>
          <div class="bk-grid">
            <div class="bk-field">
              <label>Họ và tên</label>
              <input v-model="fullName" type="text" placeholder="Nhập họ và tên" required />
            </div>
            <div class="bk-field">
              <label>Số điện thoại</label>
              <input v-model="phone" type="tel" placeholder="Nhập số điện thoại" :class="{ 'bk-error-input': phoneError }" required />
              <small v-if="phoneError" class="bk-field-error">Số điện thoại phải có 10 chữ số</small>
            </div>
          </div>
        </div>

        <!-- NGÀY + GIỜ -->
        <div class="bk-grid">
          <div class="bk-field">
            <label>Ngày đặt</label>
            <button type="button" class="bk-date-btn" @click="showCalendar = true">
              {{ dateObj ? dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Chọn ngày' }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </button>
          </div>
          <div class="bk-field">
            <label>Giờ đến</label>
            <div class="bk-time-wrap">
              <button type="button" class="bk-date-btn" @click="showTime = !showTime">
                {{ time || 'Chọn giờ' }}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </button>
              <div v-if="showTime" class="bk-time-dropdown">
                <div
                  v-for="t in timeSlots" :key="t"
                  class="bk-time-option"
                  :class="{ active: t === time }"
                  @click="time = t; showTime = false"
                >{{ t }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- SỐ KHÁCH -->
        <div class="bk-field">
          <label>Số lượng khách</label>
          <input v-model.number="guestCount" type="number" min="1" max="302" placeholder="Nhập số khách" required />
        </div>

        <!-- MÓN ĐẶT TRƯỚC -->
        <div v-if="foodNote" class="bk-field">
          <label>Món đặt trước (tham khảo)</label>
          <textarea :value="foodNote" rows="3" readonly class="bk-readonly"></textarea>
        </div>

        <!-- GHI CHÚ -->
        <div class="bk-field">
          <label>Ghi chú</label>
          <textarea v-model="customerNote" rows="3" placeholder="Ví dụ: cần ghép bàn, có trẻ em..."></textarea>
        </div>

        <div v-if="msg" class="bk-error">{{ msg }}</div>

        <button class="bk-submit" :disabled="loadingSubmit">
          {{ loadingSubmit ? 'Đang đặt bàn...' : 'Xác nhận đặt bàn' }}
        </button>
      </form>
    </div>

    <!-- CALENDAR POPUP -->
    <div v-if="showCalendar" class="cal-overlay" @click.self="showCalendar = false">
      <div class="cal-modal">
        <VDatePicker v-model="dateObj" :min-date="new Date()" :locale="'vi'" @dayclick="showCalendar = false" expanded />
        <div class="cal-footer">
          <button type="button" class="cal-btn" @click="dateObj = new Date(); showCalendar = false">Hôm nay</button>
          <button type="button" class="cal-btn" @click="showCalendar = false">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DatePicker as VDatePicker } from 'v-calendar'
import { useRouter } from 'vue-router'
import { createReservation } from '@/services/reservationApi'
import { useBookingStore } from '@/composables/bookingStore'
import { useCartStore } from '@/composables/cartStore'

const router = useRouter()
const { isCustomOpen, presetNote, closeCustom, open } = useBookingStore()
const { clearCart } = useCartStore()

const fullName = ref('')
const phone = ref('')
const today = new Date().toISOString().split('T')[0]
const date = ref(today)
const dateObj = ref<Date>(new Date())
const time = ref('')
const guestCount = ref<number | null>(null)
const customerNote = ref('')
const foodNote = ref('')
const msg = ref('')
const phoneError = ref(false)
const loadingSubmit = ref(false)
const showCalendar = ref(false)
const showTime = ref(false)

const userInfo = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return { fullName: user.fullName || '', phoneNumber: user.phoneNumber || '' }
  } catch {
    return { fullName: '', phoneNumber: '' }
  }
})



const timeSlots = computed(() => {
  const slots: string[] = []
  for (let h = 9; h <= 22; h++) {
    for (let m = 0; m < 60; m += 10) {
      if (h === 22 && m > 0) break
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  if (date.value) {
    const selectedDate = new Date(date.value)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)
    if (selectedDate.getTime() === todayDate.getTime()) {
      const now = new Date()
      const cur = now.getHours() * 60 + now.getMinutes() + 30
      return slots.filter(s => { const [h, m] = s.split(':').map(Number); return h * 60 + m > cur })
    }
  }
  return slots
})

const validatePhone = () => /^[0-9]{10}$/.test(phone.value)

const buildReservedAt = () => {
  if (!date.value || !time.value) return ''
  return `${date.value}T${time.value}`
}

watch(dateObj, (val) => {
  if (val) {
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    date.value = `${y}-${m}-${d}`
  }
})

const backToMainForm = () => { closeCustom(); open(foodNote.value) }

watch(isCustomOpen, (val) => {
  if (!val) return
  msg.value = ''; phoneError.value = false; loadingSubmit.value = false
  customerNote.value = ''; foodNote.value = presetNote.value || ''
  fullName.value = ''; phone.value = ''
  dateObj.value = new Date()
  date.value = new Date().toISOString().split('T')[0]
  showCalendar.value = false
  showTime.value = false
})

const submitReservation = async () => {
  msg.value = ''

  const cooldown = localStorage.getItem('byhat_cancel_cooldown')
  if (cooldown && Date.now() < Number(cooldown)) {
    const mins = Math.ceil((Number(cooldown) - Date.now()) / 60000)
    msg.value = `Bạn vừa hủy đơn đặt bàn. Vui lòng chờ thêm ${mins} phút để đặt bàn mới.`
    return
  }

  if (!validatePhone()) { phoneError.value = true; return }
  phoneError.value = false
  if (!guestCount.value || !date.value || !time.value) { msg.value = 'Vui lòng chọn ngày, giờ và số khách'; return }

  loadingSubmit.value = true
  try {
    const res = await createReservation({
      fullName: userInfo.value.fullName,
      phoneNumber: userInfo.value.phoneNumber,
      guestCount: guestCount.value,
      reservedAt: buildReservedAt(),
      note: customerNote.value,
      foodNote: foodNote.value,
      guestName: fullName.value,
      guestPhone: phone.value,
    })
    const data = res.data?.data
    if (!data) { msg.value = 'Đặt bàn thất bại'; return }
    sessionStorage.setItem('reservationSuccess', JSON.stringify(data))
    clearCart()
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
.bk-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1200;
}

.bk-panel {
  width: min(500px, 94vw); background: #faf8f5; border-radius: 18px;
  max-height: 90vh; overflow: auto;
}

.bk-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 22px; background: #a80000; border-radius: 18px 18px 0 0;
}
.bk-header-left { display: flex; align-items: center; gap: 8px; }
.bk-header h3 { margin: 0; font-size: 18px; font-weight: 800; color: white; }
.bk-close {
  width: 30px; height: 30px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.2); color: white; font-size: 18px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.bk-close:hover { background: rgba(255,255,255,0.35); }

.bk-body { padding: 20px 22px 22px; }

.bk-info {
  background: white; border-radius: 10px; padding: 14px; border: 1px solid #ede8e0; margin-bottom: 16px;
}
.bk-info-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.bk-info-head span { font-size: 13px; font-weight: 700; color: #1a1a1a; }
.bk-info-head a { font-size: 12px; color: #a80000; text-decoration: none; font-weight: 600; }
.bk-info-head a:hover { text-decoration: underline; }

.bk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.bk-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.bk-field label { font-size: 12px; font-weight: 600; color: #5a4a38; }

.bk-field input, .bk-field select, .bk-field textarea {
  border: 1.5px solid #e0d6ca; border-radius: 8px; padding: 9px 12px;
  font-size: 14px; font-family: inherit; transition: 0.2s;
}
.bk-field input:focus, .bk-field select:focus, .bk-field textarea:focus {
  border-color: #a80000; outline: none;
}

.bk-error-input { border-color: #dc3545 !important; }
.bk-field-error { color: #dc3545; font-size: 11px; }

.bk-date-wrap { position: relative; }
.bk-date-input { width: 100%; }
.bk-date-display {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  font-size: 13px; font-weight: 600; color: #a80000; pointer-events: none;
}

.bk-readonly { background: #f8f5f0; cursor: not-allowed; color: #888; }

.bk-date-btn {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  border: 1.5px solid #e0d6ca; border-radius: 8px; padding: 9px 12px;
  font-size: 14px; font-family: inherit; background: white; cursor: pointer;
  color: #333; transition: 0.2s;
}
.bk-date-btn:hover { border-color: #a80000; }
.bk-date-btn svg { color: #a80000; flex-shrink: 0; }

/* TIME DROPDOWN */
.bk-time-wrap { position: relative; }
.bk-time-dropdown {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 10;
  background: white; border: 1.5px solid #e0d6ca; border-radius: 8px;
  margin-top: 4px; max-height: 200px; overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.bk-time-option {
  padding: 8px 14px; font-size: 14px; cursor: pointer; transition: 0.15s;
}
.bk-time-option:hover { background: #f5f0eb; color: #a80000; }
.bk-time-option.active { background: #a80000; color: white; font-weight: 700; }

.cal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 1300;
}
.cal-modal {
  background: white; border-radius: 14px; overflow: hidden;
  box-shadow: 0 16px 40px rgba(0,0,0,0.18);
}
.cal-footer {
  display: flex; justify-content: center; gap: 10px; padding: 10px 16px 16px;
  border-top: 1px solid #f0ebe5;
}
.cal-btn {
  padding: 8px 20px; border: 1.5px solid #d0c8be; border-radius: 8px;
  background: white; color: #555; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: 0.2s;
}
.cal-btn:hover { border-color: #a80000; color: #a80000; }

.bk-error { color: #dc3545; font-size: 13px; margin-bottom: 10px; }

.bk-submit {
  width: 100%; border: none; background: #a80000; color: white;
  padding: 12px; border-radius: 999px; font-weight: 700; font-size: 15px;
  cursor: pointer; transition: 0.2s;
}
.bk-submit:hover:not(:disabled) { background: #8b0000; }
.bk-submit:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
