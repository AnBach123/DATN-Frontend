<template>
  <div class="profile-page">
    <div class="overlay">
      <div class="container profile-wrapper">
        <h2 class="title text-center">THÔNG TIN CÁ NHÂN</h2>

        <div v-if="loading" class="text-center text-white">Đang tải...</div>

        <div v-else class="profile-card">
          <!-- LEFT -->
          <div class="profile-left text-center">
            <div class="avatar">{{ avatarText }}</div>

            <h4>{{ profile?.fullName }}</h4>
            <p class="email">{{ profile?.email }}</p>

            <div class="loyalty">⭐ {{ profile?.loyaltyPoints || 0 }} điểm</div>
          </div>

          <!-- RIGHT -->
          <form class="profile-right" @submit.prevent="handleUpdate">
            <div class="form-group">
              <label>Họ tên</label>
              <input v-model="form.fullName" />
            </div>

            <div class="form-group">
              <label>Số điện thoại</label>
              <input v-model="form.phoneNumber" />
            </div>

            <div class="form-group">
              <label>Email</label>
              <input v-model="form.email" />
            </div>

            <div class="form-group">
              <label>Ngày sinh</label>
              <input type="date" v-model="form.dateOfBirth" />
            </div>

            <div class="form-group">
              <label>Ngày tạo</label>
              <input :value="formatDate(profile?.createdAt)" disabled />
            </div>

            <button class="btn-save" type="submit">CẬP NHẬT</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getProfile, updateProfile } from '@/services/customer/profileApi'
import axios from 'axios'

const loading = ref(true)
const profile = ref<any>(null)

const form = ref({
  fullName: '',
  phoneNumber: '',
  email: '',
  dateOfBirth: '',
})

// ========================
// LOAD PROFILE
// ========================
const loadProfile = async () => {
  try {
    const data = await getProfile()
    profile.value = data

    form.value = {
      fullName: data.fullName || '',
      phoneNumber: data.phoneNumber || '',
      email: data.email || '',
      dateOfBirth: data.dateOfBirth || '',
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// ========================
// UPDATE PROFILE
// ========================
const handleUpdate = async () => {
  const confirmed = confirm('Bạn có chắc chắn muốn cập nhật thông tin không?')

  if (!confirmed) return

  try {
    const res = await updateProfile(form.value)

    alert('Cập nhật thành công')

    if (res.accessToken) {
      localStorage.setItem('accessToken', res.accessToken)
    }

    await loadProfile()
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      alert(err.response?.data?.message || 'Lỗi')
    } else {
      alert('Lỗi')
    }
  }
}

// ========================
// FORMAT DATE
// ========================
const formatDate = (date?: string | null) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN')
}

// ========================
// AVATAR (GIỐNG NAVBAR)
// ========================
const avatarText = computed(() => {
  return profile.value?.fullName ? profile.value.fullName.charAt(0).toUpperCase() : 'U'
})

onMounted(loadProfile)
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #5a1515;
  position: relative;
  overflow: hidden;
}

/* Background blur */
.profile-page::before {
  content: '';
  position: absolute;
  inset: -8%;
  background-image: url('https://images.unsplash.com/photo-1555992336-03a23c7b20ee');
  background-size: cover;
  background-position: center;
  filter: blur(10px);
  opacity: 0.25;
  z-index: 0;
  pointer-events: none;
}

/* Overlay - FIX: align TOP */
.overlay {
  position: relative;
  z-index: 1;
  background: rgba(0, 0, 0, 0.65);
  min-height: 100vh;

  display: flex;
  align-items: flex-start;
  padding-top: 60px;
}

/* Wrapper */
.profile-wrapper {
  width: min(1000px, 95%);
  margin: 0 auto;
}

/* Title */
.title {
  color: white;
  margin-bottom: 30px;
  font-weight: 700;
}

/* Card */
.profile-card {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 2fr;
  background: #fff7f0;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}

/* LEFT */
.profile-left {
  background: #a80000;
  color: white;
  padding: 40px 20px;
  text-align: center;
}

/* AVATAR (TEXT STYLE giống navbar) */
.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f2b565;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3a1f12;
  font-weight: bold;
  font-size: 42px;
  margin: 0 auto 15px;
  border: 4px solid white;
  text-transform: uppercase;
}

/* INFO */
.email {
  opacity: 0.85;
  font-size: 14px;
}

.loyalty {
  margin-top: 15px;
  background: white;
  color: #a80000;
  padding: 8px 12px;
  border-radius: 20px;
  font-weight: bold;
}

/* RIGHT */
.profile-right {
  padding: 30px;
}

/* FORM */
.form-group {
  margin-bottom: 15px;
}

label {
  font-weight: 600;
  margin-bottom: 5px;
  display: block;
}

input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  transition: 0.2s;
}

input:focus {
  outline: none;
  border-color: #a80000;
  box-shadow: 0 0 0 2px rgba(168, 0, 0, 0.15);
}

input:disabled {
  background: #f3f3f3;
  cursor: not-allowed;
}

/* BUTTON */
.btn-save {
  width: 100%;
  margin-top: 10px;
  background: #a80000;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  transition: 0.2s;
  cursor: pointer;
}

.btn-save:hover {
  background: #7a0000;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.btn-save:active {
  transform: scale(0.98);
}
</style>
