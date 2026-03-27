<template>
  <header class="staff-header">
    <!-- LEFT -->
    <div class="header-left">
      <div class="logo">🍽️ ByHat Staff</div>

      <div class="nav-links">
        <router-link to="/staff/order" class="nav-item" active-class="active">
          Order món
        </router-link>

        <router-link to="/staff/view-orders" class="nav-item" active-class="active">
          Danh sách Order
        </router-link>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="header-right">
      <div class="user-menu">
        <button class="user-btn" @click="toggleUserMenu">
          <div class="avatar">{{ userInitials }}</div>
          <span class="user-name">{{ user.name }}</span>
          <span class="dropdown-icon">▼</span>
        </button>

        <div v-if="showUserMenu" class="dropdown">
          <button class="dropdown-item logout" @click="logout">🚪 Đăng xuất</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import router from '@/router'

const showUserMenu = ref(false)

const user = ref({
  name: localStorage.getItem('fullName') || 'Nhân viên',
})

const userInitials = computed(() => {
  return user.value.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function logout() {
  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    localStorage.clear()
    router.push('/auth/login')
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.user-menu')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* HEADER */
.staff-header {
  height: 72px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 100;
}

/* LEFT */
.header-left {
  display: flex;
  align-items: center;
  gap: 30px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
}

/* NAV */
.nav-links {
  display: flex;
  gap: 10px;
}

.nav-item {
  padding: 8px 14px;
  border-radius: 12px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.3s;
}

.nav-item:hover {
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

/* RIGHT */
.header-right {
  display: flex;
  align-items: center;
}

/* USER */
.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 16px;
  transition: 0.3s;
}

.user-btn:hover {
  background: rgba(102, 126, 234, 0.08);
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.dropdown-icon {
  font-size: 10px;
  color: #94a3b8;
}

/* DROPDOWN */
.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  background: white;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 6px;
  min-width: 160px;
}

.dropdown-item {
  width: 100%;
  border: none;
  background: none;
  padding: 10px 14px;
  text-align: left;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
}

.dropdown-item:hover {
  background: rgba(239, 68, 68, 0.08);
}

.dropdown-item.logout {
  color: #e53e3e;
}
</style>
