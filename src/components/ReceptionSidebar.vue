<template>
  <aside class="reception-sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-icon">🍽️</span>
        <span v-if="!collapsed" class="logo-text">ByHat</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <span class="nav-icon" v-html="item.icon"></span>
        <span v-if="!collapsed" class="nav-text">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <button class="nav-item logout-btn" @click="handleLogout">
        <span class="nav-icon">🚪</span>
        <span v-if="!collapsed" class="nav-text">Đăng xuất</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

interface Props {
  collapsed?: boolean
}

defineProps<Props>()

const route = useRoute()
const router = useRouter()

const menuItems = [
  { path: '/reception/check-in-offline', label: 'Trạng thái bàn', icon: '🏠' },
  { path: '/reception/check-in-online', label: 'Check-in Online', icon: '📱' },
  { path: '/reception/payment', label: 'Thanh toán', icon: '💳' },
  { path: '/reception/invoice-history', label: 'Lịch sử HĐ', icon: '📄' },
]

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

const handleLogout = () => {
  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('tokenType')
    localStorage.removeItem('userRole')
    localStorage.removeItem('email')
    localStorage.removeItem('fullName')
    router.push('/auth/login')
  }
}
</script>

<style scoped>
.reception-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 240px;
  background: linear-gradient(180deg, #ffffff 0%, #fefefe 100%);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.03);
}

.reception-sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  margin: 4px 12px;
  color: #64748b;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  background: none;
  width: calc(100% - 24px);
  text-align: left;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.nav-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  color: #667eea;
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  color: #667eea;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.nav-icon {
  font-size: 22px;
  min-width: 22px;
  text-align: center;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.nav-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapsed .nav-text {
  display: none;
}

.collapsed .nav-item {
  justify-content: center;
  padding: 14px;
}

.sidebar-footer {
  padding: 16px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.logout-btn {
  color: #ef4444;
}

.logout-btn:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.08) 100%);
  color: #dc2626;
}

@media (max-width: 768px) {
  .reception-sidebar {
    transform: translateX(-100%);
  }
  
  .reception-sidebar.show {
    transform: translateX(0);
  }
}
</style>
