<template>
  <nav class="site-nav navbar navbar-expand-lg" :class="{ 'nav-hidden': navHidden, 'nav-scrolled': navScrolled }">
    <div class="container-fluid nav-shell">
      <RouterLink class="brand" to="/home">
  <img :src="logo" class="brand-logo" />

  <div class="brand-text">
    <span class="brand-mark">ByHat</span><br>
    <span class="brand-sub">Hotpot Restaurant</span>
  </div>
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
            <RouterLink class="nav-link" to="/home">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>Trang chủ</span>
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/menu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
              <span>Thực đơn</span>
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/review">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Đánh giá</span>
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/posts">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
              <span>Bài viết</span>
            </RouterLink>
          </li>
        </ul>

        <div class="nav-actions">
          <button class="btn-reserve" @click="openBooking()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Đặt bàn ngay
          </button>

          <!-- ĐƠN ĐẶT BÀN -->
          <RouterLink to="/my-reservations" class="nav-rsv-btn" title="Đơn đặt bàn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span v-if="rsvCount > 0" class="rsv-badge">{{ rsvCount }}</span>
          </RouterLink>

          <!-- PROFILE DROPDOWN -->
          <div class="profile-wrapper" @click.stop="toggleDropdown">
            <div class="profile-trigger">
              <div class="avatar">{{ avatarText }}</div>
              <span class="user-name">{{ fullName }}</span>
              <svg class="arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            <div v-if="showDropdown" class="profile-dropdown">
              <RouterLink to="/profile" class="dropdown-item" @click="closeDropdown">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>
                Tài khoản
              </RouterLink>
              <RouterLink class="dropdown-item logout" to="/auth/login" @click="closeDropdown">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Đăng xuất
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
import { useRoute } from 'vue-router'
import { useBookingStore } from '@/composables/bookingStore'
import { getProfile } from '@/services/customer/profileApi'
import axiosInstance from '@/services/axiosInstance'
import logo from '@/assets/logo.png'

const { open: openBooking } = useBookingStore()
const route = useRoute()
const isHomePage = computed(() => route.path === '/home')

const showDropdown = ref(false)
const rsvCount = ref(0)

const loadRsvCount = async () => {
  try {
    const res = await axiosInstance.get('/api/invoice/my')
    const pending = (res.data || []).filter((i: any) =>
      i.reservedAt && ['PENDING_CONFIRMATION', 'RESERVED', 'CONFIRMED'].includes(i.status)
    )
    rsvCount.value = pending.length
  } catch { rsvCount.value = 0 }
}
const fullName = ref('User')

// ========================
// NAVBAR HIDE/SHOW ON SCROLL
// ========================
const navHidden = ref(false)
const navScrolled = ref(false)
let lastScrollY = 0

const handleScroll = () => {
  const currentY = window.scrollY

  if (isHomePage.value) {
    // Trang chủ: ẩn/hiện navbar + đổi style
    if (currentY > 500 && currentY > lastScrollY) {
      navHidden.value = true
    } else {
      navHidden.value = false
    }
    navScrolled.value = currentY > 300
  } else {
    // Trang khác: luôn hiện, luôn style đậm
    navHidden.value = false
    navScrolled.value = true
  }
  lastScrollY = currentY
}

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
  loadUser()
  loadRsvCount()
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll)
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
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
  transition: background 0.4s ease, box-shadow 0.4s ease, border 0.4s ease;
}

/* Ẩn: biến mất ngay, không animation */
.site-nav.nav-hidden {
  transform: translateY(-100%);
  transition: transform 0s;
}

/* Hiện: trượt xuống mượt */
.site-nav:not(.nav-hidden) {
  transform: translateY(0);
  transition: transform 0.4s ease, background 0.4s ease, box-shadow 0.4s ease;
}

.nav-shell {
  transition: padding 0.3s ease;
}

.site-nav.nav-hidden {
  transform: translateY(-100%);
}

/* Ở khu vực hero: trong suốt, nhỏ hơn */
.site-nav:not(.nav-scrolled) {
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
  box-shadow: none;
  border-bottom: none;
}

.site-nav:not(.nav-scrolled) .nav-shell {
  padding: 0px 28px;
}

.nav-shell {
  padding: 8px 28px;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;   /* 👈 căn giữa dọc */
  gap: 14px;             /* 👈 khoảng cách logo - chữ */
  text-decoration: none;
  color: #fff;
}

.brand-mark {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
}

.brand-sub {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #f0b66a;
}

.nav-list {
  display: flex;
  gap: 10px;
  list-style: none;
  align-items: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 10px;
  transition: color 0.3s, background 0.3s;
  position: relative;
  overflow: hidden;
}

.nav-link svg {
  position: absolute;
  left: 10px;
  opacity: 0;
  transition: opacity 0.3s, transform 0.3s;
  transform: translateX(-8px);
}

.nav-link span {
  transition: transform 0.3s;
}

.nav-link:hover {
  color: #ffd700;
  background: rgba(255, 215, 0, 0.08);
}

.nav-link:hover svg {
  opacity: 1;
  transform: translateX(0);
}

.nav-link:hover span {
  transform: translateX(10px);
}

.nav-link.router-link-active {
  color: #ffd700;
}

.nav-link.router-link-active svg {
  opacity: 1;
  transform: translateX(0);
}

.nav-link.router-link-active span {
  transform: translateX(10px);
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: #ffd700;
  border-radius: 999px;
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
  padding: 10px 16px;
  cursor: pointer;
  color: #333;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f8f4f0;
  color: #a80000;
}

.dropdown-item.logout {
  color: #a80000;
  border-top: 1px solid #f0ebe5;
}
.dropdown-item.logout:hover {
  background: #fff0f0;
}

/* ===== BUTTON ===== */
.nav-rsv-btn {
  position: relative; border: none; background: rgba(255,255,255,0.12);
  color: white; width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: 0.2s;
}
.nav-rsv-btn:hover { background: rgba(255,255,255,0.25); }

.rsv-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 18px; height: 18px; border-radius: 999px;
  background: #ffd700; color: #1a1a1a; font-size: 11px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
}

.btn-reserve {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: linear-gradient(135deg, #ffd700, #f2b565);
  color: #3a1f12;
  padding: 9px 22px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 2px 10px rgba(242, 181, 101, 0.3);
}
.btn-reserve:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(242, 181, 101, 0.45);
}

.arrow-icon { opacity: 0.6; transition: transform 0.2s; }
.profile-wrapper:hover .arrow-icon { opacity: 1; }

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
.brand-logo {
  width: 80px;       
  height: 80px;
  object-fit: contain;
  border-radius: 50%;
  background: white;
  padding: 6px;

  /* 👇 thêm cho đẹp */
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
}
</style>
