<template>
  <div class="page-wrapper">
    <div class="card form-card shadow">
      <div class="card-body p-4">
        <h2 class="mb-4 fw-bold">Đặt bàn</h2>

        <form @submit.prevent="submitForm">
          <!-- Name -->
          <div class="mb-3">
            <label class="form-label">Tên</label>
            <input type="text" v-model="name" class="form-control form-control-lg" required />
          </div>

          <!-- Phone -->
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

          <!-- Date -->
          <div class="mb-3">
            <label class="form-label">Ngày đặt</label>
            <input
              type="date"
              v-model="date"
              class="form-control form-control-lg"
              :min="today"
              required
            />
          </div>

          <!-- Time -->
          <div class="mb-4">
            <label class="form-label">Giờ</label>

            <select v-model="time" class="form-select form-select-lg" required>
              <option value="">Chọn giờ</option>

              <option v-for="t in timeSlots" :key="t" :value="t">
                {{ t }}
              </option>
            </select>
          </div>

          <button class="btn reserve-btn w-100 btn-lg">Đặt bàn</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const name = ref('')
const phone = ref('')
const date = ref('')
const time = ref('')

const phoneError = ref(false)

const today = new Date().toISOString().split('T')[0]

/* tạo danh sách giờ 10 phút */
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

const validatePhone = () => {
  const regex = /^[0-9]{10}$/
  return regex.test(phone.value)
}

const submitForm = () => {
  if (!validatePhone()) {
    phoneError.value = true
    return
  }

  phoneError.value = false

  const reservations = JSON.parse(localStorage.getItem('reservations') || '[]')

  reservations.push({
    name: name.value,
    phone: phone.value,
    date: date.value,
    time: time.value,
  })

  localStorage.setItem('reservations', JSON.stringify(reservations))

  alert('Reservation saved!')

  name.value = ''
  phone.value = ''
  date.value = ''
  time.value = ''
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
  width: 420px;
  border-radius: 20px;
  background: #efe7de;
}

.form-control,
.form-select {
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
