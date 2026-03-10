<template>
  <div class="page-wrapper">
    <div class="card form-card shadow">
      <div class="card-body p-4">
        <h2 class="mb-4 fw-bold">Đặt bàn</h2>

        <form @submit.prevent="submitReservation">
          <div class="mb-3">
            <label class="form-label">Họ và tên</label>
            <input v-model="fullName" type="text" class="form-control form-control-lg" required />
          </div>

          <div class="mb-3">
            <label class="form-label">Số điện thoại</label>
            <input
              type="text"
              v-model="phone"
              class="form-control form-control-lg"
              placeholder="0123456789"
              required
            />
            <small v-if="phoneError" class="text-danger"> Số điện thoại phải đủ 10 số </small>
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Ngày đặt</label>
              <input
                type="date"
                v-model="date"
                class="form-control form-control-lg"
                :min="today"
                required
              />
            </div>

            <div class="col-md-6">
              <label class="form-label">Giờ đến</label>
              <select v-model="time" class="form-select form-select-lg" required>
                <option value="">Chọn giờ</option>
                <option v-for="t in timeSlots" :key="t" :value="t">
                  {{ t }}
                </option>
              </select>
            </div>
          </div>

          <div class="row g-3 mt-1">
            <div class="col-md-6">
              <label class="form-label">Số lượng khách</label>
              <select v-model.number="guestCount" class="form-select form-select-lg" required>
                <option :value="null">Chọn số khách</option>
                <option v-for="n in guestOptions" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>

            <div class="col-md-6">
              <label class="form-label">Ưu đãi</label>
              <select v-model="promotionType" class="form-select form-select-lg" required>
                <option value="">Chọn ưu đãi</option>
                <option v-for="p in promotions" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>
          </div>

          <div class="mt-3">
            <label class="form-label">Ghi chú</label>
            <textarea
              v-model="note"
              rows="3"
              class="form-control form-control-lg"
              placeholder="Ví dụ: cần ghép bàn, có trẻ em..."
            ></textarea>
          </div>

          <div class="mt-4">
            <button class="btn reserve-btn w-100 btn-lg" :disabled="loadingSubmit">
              {{ loadingSubmit ? 'Đang đặt bàn...' : 'Đặt bàn' }}
            </button>
          </div>
        </form>

        <div v-if="msg" class="mt-3 text-danger">{{ msg }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createReservation } from '@/services/reservationApi'

const fullName = ref('')
const phone = ref('')
const date = ref('')
const time = ref('')
const guestCount = ref<number | null>(null)
const promotionType = ref('')
const note = ref('')

const phoneError = ref(false)
const msg = ref('')
const loadingSubmit = ref(false)

const router = useRouter()

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
      note: note.value,
      promotionType: promotionType.value,
    }

    const res = await createReservation(payload)
    const data = res.data?.data
    if (!data) {
      msg.value = 'Đặt bàn thất bại'
      return
    }
    sessionStorage.setItem('reservationSuccess', JSON.stringify(data))
    router.push('/reservation/success')
  } catch (e: any) {
    msg.value = e?.response?.data?.message || 'Đặt bàn thất bại'
  } finally {
    loadingSubmit.value = false
  }
}
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e7ddd2, #d6c7b6);
}

.form-card {
  width: 520px;
  border-radius: 20px;
  background: #efe7de;
}

.form-control,
.form-select,
textarea {
  border-radius: 12px;
}

.reserve-btn {
  background: linear-gradient(90deg, #b90d00, #e53b1c);
  color: white;
  border-radius: 12px;
  font-weight: 600;
}

.reserve-btn:hover {
  opacity: 0.9;
}
</style>
