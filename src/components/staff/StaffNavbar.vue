<template>
  <header class="staff-header">
    <!-- LEFT -->
    <div class="header-left">
      <div class="logo">🍽️ ByHat Staff</div>

      <div class="nav-links">
        <router-link to="/staff/tables" class="nav-item" active-class="active">
          Chọn bàn
        </router-link>

        <router-link to="/staff/view-orders" class="nav-item" active-class="active">
          Danh sách Order
        </router-link>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="header-right">
      <!-- BELL NOTIFICATION -->
      <div class="bell-menu">
        <button class="bell-btn" @click.stop="toggleBell" :title="unreadCount > 0 ? `${unreadCount} thông báo mới` : 'Thông báo'">
          <span class="bell-icon">🔔</span>
          <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </button>

        <div v-if="showBell" class="bell-dropdown">
          <div class="bell-header">
            <strong>Thông báo</strong>
            <button v-if="notifications.length > 0" class="bell-clear" @click="clearAll">Xóa hết</button>
          </div>
          <div class="bell-body">
            <div v-if="notifications.length === 0" class="bell-empty">
              Không có thông báo nào
            </div>
            <div
              v-for="n in notifications"
              :key="n.id"
              class="bell-item"
              :class="{
                unread: !n.read,
                'type-cancel': n.type === 'ITEM_CANCELLED',
                'type-done': n.type === 'ITEM_DONE'
              }"
            >
              <div class="bell-item-icon">{{ n.type === 'ITEM_CANCELLED' ? '🚫' : n.type === 'ITEM_DONE' ? '✅' : '📢' }}</div>
              <div class="bell-item-content">
                <div class="bell-item-title">{{ n.title }}</div>
                <div class="bell-item-message">{{ n.message }}</div>
                <div class="bell-item-time">{{ formatTime(n.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="user-menu">
        <button class="user-btn" @click="toggleUserMenu">
          <div class="avatar">{{ userInitials }}</div>
          <div class="user-info">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-role">{{ roleLabel }} • @{{ user.username }}</span>
          </div>
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
import { DashboardWebSocket } from '@/services/websocket/DashboardWebSocket'

const showUserMenu = ref(false)

// ===== BELL NOTIFICATION =====
interface StaffNotification {
  id: string
  type: 'ITEM_CANCELLED' | 'ITEM_DONE'
  title: string
  message: string
  timestamp: number
  read: boolean
}

const NOTIF_KEY = 'staff_notifications'
const MAX_NOTIFS = 50

const showBell = ref(false)
const notifications = ref<StaffNotification[]>(loadNotifs())
let wsClient: DashboardWebSocket | null = null

const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

function loadNotifs(): StaffNotification[] {
  try {
    const raw = sessionStorage.getItem(NOTIF_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveNotifs() {
  try {
    sessionStorage.setItem(NOTIF_KEY, JSON.stringify(notifications.value))
  } catch {
    // sessionStorage full hoặc disabled — không chặn UI
  }
}

function addNotification(notif: Omit<StaffNotification, 'id' | 'timestamp' | 'read'>) {
  const full: StaffNotification = {
    ...notif,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    read: false,
  }
  notifications.value.unshift(full)
  if (notifications.value.length > MAX_NOTIFS) {
    notifications.value = notifications.value.slice(0, MAX_NOTIFS)
  }
  saveNotifs()
}

function toggleBell() {
  showBell.value = !showBell.value
  // Mở bell → đánh dấu tất cả đã đọc
  if (showBell.value && unreadCount.value > 0) {
    notifications.value.forEach((n) => (n.read = true))
    saveNotifs()
  }
}

function clearAll() {
  notifications.value = []
  saveNotifs()
  showBell.value = false
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  return new Date(ts).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

const user = ref({
  name: localStorage.getItem('fullName') || 'Nhân viên',
  username: localStorage.getItem('username') || '',
  role: localStorage.getItem('userRole') || 'STAFF',
})

// Watch for changes in localStorage (when user logs in)
const updateUserInfo = () => {
  user.value = {
    name: localStorage.getItem('fullName') || 'Nhân viên',
    username: localStorage.getItem('username') || '',
    role: localStorage.getItem('userRole') || 'STAFF',
  }
}

// Listen for storage events (when localStorage changes)
onMounted(() => {
  updateUserInfo()
  window.addEventListener('storage', updateUserInfo)
  document.addEventListener('click', handleClickOutside)

  // WS subscribe — nhận thông báo ITEM_CANCELLED từ bếp
  const token = localStorage.getItem('accessToken') || ''
  const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'
  wsClient = new DashboardWebSocket(wsUrl)
  wsClient.subscribeKitchenUpdates((update) => {
    if (update?.action === 'ITEM_CANCELLED') {
      const itemName = update.itemName || 'Món'
      const reason = update.reason?.trim()
      const message = reason
        ? `"${itemName}" đã bị hủy — Lý do: ${reason}. Vui lòng thông báo khách hàng.`
        : `"${itemName}" đã bị hủy. Vui lòng thông báo khách hàng.`
      addNotification({
        type: 'ITEM_CANCELLED',
        title: 'Bếp đã hủy món',
        message,
      })
    } else if (update?.action === 'ITEM_DONE') {
      const itemName = update.itemName || 'Món'
      const tableName = update.tableName?.trim()
      const message = tableName
        ? `"${itemName}" của bàn ${tableName} đã sẵn sàng.`
        : `"${itemName}" đã sẵn sàng.`
      addNotification({
        type: 'ITEM_DONE',
        title: 'Bếp đã hoàn thành món',
        message,
      })
    }
  })
  wsClient.connect(token)
})

onUnmounted(() => {
  window.removeEventListener('storage', updateUserInfo)
  document.removeEventListener('click', handleClickOutside)
  if (wsClient) {
    wsClient.disconnect()
    wsClient = null
  }
})

const roleLabel = computed(() => {
  const roles: Record<string, string> = {
    STAFF: 'Nhân viên phục vụ',
    RECEPTION: 'Lễ tân',
    KITCHEN: 'Nhà bếp',
    ADMIN: 'Quản trị viên',
  }
  return roles[user.value.role] || user.value.role
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
  if (!target.closest('.bell-menu')) {
    showBell.value = false
  }
}
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
  gap: 8px;
}

/* BELL */
.bell-menu {
  position: relative;
}

.bell-btn {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.08);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.bell-btn:hover {
  background: rgba(102, 126, 234, 0.15);
  transform: scale(1.05);
}

.bell-icon {
  font-size: 20px;
}

.bell-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #e53e3e;
  color: white;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-sizing: content-box;
  animation: bellPulse 1.6s ease-in-out infinite;
}

@keyframes bellPulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.1); }
}

.bell-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  background: white;
  border-radius: 14px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
  width: 360px;
  max-width: calc(100vw - 32px);
  overflow: hidden;
  z-index: 110;
}

.bell-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #edf2f7;
  background: #f8fafc;
}

.bell-header strong {
  font-size: 14px;
  color: #2d3748;
}

.bell-clear {
  border: none;
  background: none;
  color: #e53e3e;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.bell-clear:hover {
  background: rgba(229, 62, 62, 0.08);
}

.bell-body {
  max-height: 420px;
  overflow-y: auto;
}

.bell-empty {
  padding: 32px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.bell-item {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}

.bell-item:last-child {
  border-bottom: none;
}

.bell-item:hover {
  background: #f8fafc;
}

.bell-item.unread {
  background: #eff6ff;
}

.bell-item.unread:hover {
  background: #dbeafe;
}

.bell-item.type-cancel .bell-item-title {
  color: #c53030;
}

.bell-item.type-done .bell-item-title {
  color: #2f855a;
}

.bell-item.type-done .bell-item-icon {
  background: #f0fff4;
}

.bell-item-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.bell-item-content {
  flex: 1;
  min-width: 0;
}

.bell-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 2px;
}

.bell-item-message {
  font-size: 12.5px;
  color: #4a5568;
  line-height: 1.4;
  word-break: break-word;
}

.bell-item-time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
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
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.2;
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
