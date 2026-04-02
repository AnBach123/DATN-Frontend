<template>
  <nav class="site-nav navbar navbar-expand-lg">
    <div class="container-fluid nav-shell">
      <RouterLink class="brand" to="/home">
        <span class="brand-mark">ByHat</span>
        <span class="brand-sub">Hotpot Restaurant</span>
      </RouterLink>

      <button
        class="navbar-toggler nav-toggle"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse nav-collapse" id="navbarNav">
        <ul class="nav-list ms-auto">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/menu">Thực đơn</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/reviews">Đánh giá</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/contact">Liên hệ</RouterLink>
          </li>
        </ul>

        <div class="nav-actions">
          <button class="btn-reserve" @click="openBooking()">Đặt bàn ngay</button>

          <!-- PROFILE DROPDOWN -->
          <div class="profile-wrapper" @click.stop="toggleDropdown">
            <div class="profile-trigger">
              <div class="avatar">{{ avatarText }}</div>
              <span class="user-name">{{ fullName }}</span>
              <span class="arrow">▼</span>
            </div>

            <div v-if="showDropdown" class="profile-dropdown">
              <RouterLink to="/profile" class="dropdown-item" @click="closeDropdown">
                Profile
              </RouterLink>

              <RouterLink class="btn-ghost dropdown-item" to="/auth/login" @click="closeDropdown">
                Logout
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '@/composables/bookingStore'
import { getProfile } from '@/services/customerApi' // ✅ THÊM

const { open: openBooking } = useBookingStore()
const router = useRouter()

const showDropdown = ref(false)
const fullName = ref('User')

// ========================
// AVATAR TEXT
// ========================
const avatarText = computed(() => {
  return fullName.value ? fullName.value.charAt(0).toUpperCase() : 'U'
})

// ========================
// TOGGLE DROPDOWN
// ========================
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
}

// ========================
// LOAD USER INFO (FIX)
// ========================
const loadUser = async () => {
  try {
    const data = await getProfile()
    fullName.value = data.fullName || 'User'

    // ✅ cache lại (optional)
    localStorage.setItem('fullName', data.fullName)
  } catch (err) {
    console.error('Load profile lỗi:', err)

    // fallback
    const cached = localStorage.getItem('fullName')
    if (cached) fullName.value = cached
  }
}

onMounted(() => {
  loadUser() // ✅ gọi API
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// ========================
// CLICK OUTSIDE
// ========================
const handleClickOutside = (e: MouseEvent) => {
  const el = document.querySelector('.profile-wrapper')
  if (el && !el.contains(e.target as Node)) {
    showDropdown.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap');

.site-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: linear-gradient(
    120deg,
    rgba(96, 15, 15, 0.92) 0%,
    rgba(132, 36, 36, 0.92) 45%,
    rgba(166, 48, 48, 0.92) 100%
  );
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
}

.nav-shell {
  padding: 14px 28px;
  align-items: center;
}

.brand {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: #fff;
}

.brand-mark {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
}

.brand-sub {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #f0b66a;
}

.nav-list {
  display: flex;
  gap: 18px;
  list-style: none;
}

.nav-link {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
  text-decoration: none;
}

.nav-link:hover {
  color: #fff;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: 20px;
}

/* ===== PROFILE ===== */
.profile-wrapper {
  position: relative;
  cursor: pointer;
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 600;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f2b565;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3a1f12;
  font-weight: bold;
}

.user-name {
  font-size: 14px;
}

.arrow {
  font-size: 10px;
}

/* ===== DROPDOWN ===== */
.dropdown-menu {
  position: absolute;
  right: 0;
  top: 120%;
  background: #fff;
  border-radius: 10px;
  min-width: 150px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  animation: fadeIn 0.15s ease;
  z-index: 9999;
}

.dropdown-item {
  padding: 10px 14px;
  cursor: pointer;
  color: #333;
  text-decoration: none;
  display: block;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.logout {
  color: red;
}

/* ===== BUTTON ===== */
.btn-reserve {
  border: none;
  background: linear-gradient(135deg, #f7c782 0%, #f2b565 100%);
  color: #3a1f12;
  padding: 10px 22px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}

.nav-collapse {
  overflow: visible !important;
}

.profile-dropdown {
  position: absolute;
  right: 0;
  top: 120%;
  background: #fff;
  border-radius: 10px;
  min-width: 150px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  animation: fadeIn 0.15s ease;
  z-index: 9999;
}

/* ===== ANIMATION ===== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
