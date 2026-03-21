<template>
  <header class="admin-header">
    <div class="header-left">
      <button class="menu-toggle" @click="$emit('toggle-sidebar')">
        <span class="hamburger">☰</span>
      </button>
      <div class="breadcrumb">
        <span v-for="(crumb, index) in breadcrumbs" :key="index">
          <span v-if="index > 0" class="separator">/</span>
          <span :class="{ active: index === breadcrumbs.length - 1 }">{{ crumb }}</span>
        </span>
      </div>
    </div>

    <div class="header-right">
      <button class="header-btn notification-btn">
        <span class="icon">🔔</span>
        <span v-if="notificationCount > 0" class="badge">{{ notificationCount }}</span>
      </button>

      <div class="user-menu">
        <button class="user-btn" @click="toggleUserMenu">
          <img v-if="user.avatar" :src="user.avatar" alt="Avatar" class="avatar" />
          <span v-else class="avatar-placeholder">{{ userInitials }}</span>
          <span class="user-name">{{ user.name }}</span>
          <span class="dropdown-icon">▼</span>
        </button>

        <div v-if="showUserMenu" class="user-dropdown">
          <router-link to="/admin/profile" class="dropdown-item">
            <span class="icon">👤</span>
            <span>Hồ sơ</span>
          </router-link>
          <router-link to="/admin/settings" class="dropdown-item">
            <span class="icon">⚙️</span>
            <span>Cài đặt</span>
          </router-link>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item logout" @click="handleLogout">
            <span class="icon">🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()

const showUserMenu = ref(false)
const notificationCount = ref(3)

const user = ref({
  name: 'Bảo An',
  avatar: '',
  role: 'Admin'
})

const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(p => p)
  const labels: Record<string, string> = {
    admin: 'Admin',
    dashboard: 'Trang chủ',
    customers: 'Khách hàng',
    products: 'Sản phẩm',
    combos: 'Combo',
    vouchers: 'Voucher',
    tables: 'Bàn ăn',
    reservations: 'Đặt bàn',
    invoices: 'Hóa đơn',
    employees: 'Nhân viên',
    reports: 'Báo cáo',
    settings: 'Cài đặt'
  }
  return paths.map(p => labels[p] || p)
})

const userInitials = computed(() => {
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu')) {
    showUserMenu.value = false
  }
}

const handleLogout = () => {
  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    localStorage.removeItem('token')
    router.push('/login')
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
.admin-header {
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
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.menu-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-toggle:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  transform: scale(1.05);
}

.hamburger {
  font-size: 24px;
  color: #64748b;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
}

.breadcrumb .separator {
  color: #cbd5e1;
}

.breadcrumb .active {
  color: #1e293b;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-btn:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  transform: scale(1.05);
}

.header-btn .icon {
  font-size: 22px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 12px;
  min-width: 18px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-btn:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  transform: translateY(-1px);
}

.avatar,
.avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.dropdown-icon {
  font-size: 10px;
  color: #94a3b8;
  transition: transform 0.3s;
}

.user-btn:hover .dropdown-icon {
  transform: translateY(2px);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  min-width: 220px;
  padding: 8px;
  z-index: 1000;
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #475569;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  border-radius: 12px;
}

.dropdown-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  color: #667eea;
  transform: translateX(4px);
}

.dropdown-item.logout {
  color: #ef4444;
}

.dropdown-item.logout:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.08) 100%);
  color: #dc2626;
}

.dropdown-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.06) 50%, transparent 100%);
  margin: 8px 0;
}

@media (max-width: 768px) {
  .admin-header {
    padding: 0 20px;
    height: 64px;
  }
  
  .breadcrumb {
    display: none;
  }
  
  .user-name {
    display: none;
  }
}
</style>
