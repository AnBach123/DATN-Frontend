<template>
  <aside class="reception-sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <path d="M7 2v20"/>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
        </span>
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
        <span class="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </span>
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
  { 
    path: '/reception/check-in-offline', 
    label: 'Trạng thái bàn', 
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' 
  },
  { 
    path: '/reception/check-in-online', 
    label: 'Check-in Online', 
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>' 
  },
  { 
    path: '/reception/payment', 
    label: 'Thanh toán', 
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' 
  },
  { 
    path: '/reception/invoice-history', 
    label: 'Lịch sử HĐ', 
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' 
  },
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
}

.logo-icon svg {
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
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
}

.nav-icon svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
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
