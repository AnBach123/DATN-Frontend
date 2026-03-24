<template>
  <div class="overtime-alert-container" :class="{ 'is-open': isOpen }">
    <!-- Toggle Button -->
    <button 
      class="sidebar-toggle" 
      @click="toggleSidebar"
      :class="{ 'has-alerts': alerts.length > 0 }"
      :title="isOpen ? 'Đóng' : 'Mở cảnh báo bàn quá giờ'"
    >
      <i :class="isOpen ? 'bi bi-chevron-right' : 'bi bi-chevron-left'"></i>
      <span v-if="alerts.length > 0 && !isOpen" class="alert-badge">{{ alerts.length }}</span>
    </button>

    <!-- Panel -->
    <div class="overtime-alert-panel">
      <div class="alert-header">
        <h3>
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          Bàn quá giờ
        </h3>
        <span class="alert-count" :class="{ 'has-alerts': alerts.length > 0 }">
          {{ alerts.length }}
        </span>
      </div>

      <div class="connection-status" :class="connectionStatusClass">
        {{ connectionStatusText }}
      </div>

      <div v-if="alerts.length === 0" class="no-alerts">
        <i class="bi bi-check-circle"></i>
        <p>Không có cảnh báo nào</p>
      </div>

      <div v-else class="alert-list">
        <div
          v-for="alert in sortedAlerts"
          :key="alert.id"
          :class="['alert-item', getUrgencyClass(alert)]"
        >
          <div class="alert-content">
            <div class="table-info">
              <strong>{{ alert.tableNames.join(', ') }}</strong>
              <span class="duration">{{ alert.diningDuration }} phút</span>
            </div>
            <div class="reservation-info">
              <i class="bi bi-calendar-event"></i>
              {{ formatTime(alert.nextReservationTime) }}
            </div>
            <div class="invoice-code">
              <i class="bi bi-receipt"></i>
              {{ alert.invoiceCode }}
            </div>
          </div>
          <button @click="acknowledgeAlert(alert.id)" class="acknowledge-btn">
            <i class="bi bi-check-lg"></i>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  OvertimeAlertWebSocket,
  type OvertimeAlert,
  type ConnectionState,
} from '@/services/websocket/OvertimeAlertWebSocket'
import axiosInstance from '@/services/axiosInstance'
import Swal from 'sweetalert2'

const alerts = ref<OvertimeAlert[]>([])
const wsClient = ref<OvertimeAlertWebSocket | null>(null)
const connectionState = ref<ConnectionState>('disconnected')
const isOpen = ref(false)

// Methods
const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}

// Computed properties
const sortedAlerts = computed(() => {
  return [...alerts.value].sort((a, b) => {
    const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 }
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
  })
})

const connectionStatusClass = computed(() => {
  return {
    'status-connected': connectionState.value === 'connected',
    'status-connecting': connectionState.value === 'connecting',
    'status-disconnected': connectionState.value === 'disconnected',
  }
})

const connectionStatusText = computed(() => {
  switch (connectionState.value) {
    case 'connected':
      return 'Đã kết nối'
    case 'connecting':
      return 'Đang kết nối...'
    case 'disconnected':
      return 'Mất kết nối'
    default:
      return ''
  }
})

// Methods
const getUrgencyClass = (alert: OvertimeAlert): string => {
  switch (alert.urgency) {
    case 'CRITICAL':
      return 'urgency-critical'
    case 'HIGH':
      return 'urgency-high'
    case 'MEDIUM':
      return 'urgency-medium'
    default:
      return ''
  }
}

const formatTime = (isoString: string): string => {
  try {
    const date = new Date(isoString)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${hours}:${minutes} ${day}/${month}`
  } catch (error) {
    console.error('Error formatting time:', error)
    return isoString
  }
}

const acknowledgeAlert = async (alertId: string) => {
  try {
    const token = localStorage.getItem('accessToken')
    const headers: any = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await axiosInstance.post(`/api/overtime/alerts/${alertId}/acknowledge`, {}, {
      headers,
    })

    // Remove alert from local array on success
    alerts.value = alerts.value.filter((alert) => alert.id !== alertId)

    // Show success toast
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      html: '<div style="font-family: Arial, sans-serif;">Đã xác nhận cảnh báo</div>',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    })
  } catch (error) {
    console.error('Error acknowledging alert:', error)

    // Show error toast with retry option
    const result = await Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: 'Không thể xác nhận cảnh báo. Bạn có muốn thử lại?',
      showCancelButton: true,
      confirmButtonText: 'Thử lại',
      cancelButtonText: 'Hủy',
    })

    if (result.isConfirmed) {
      await acknowledgeAlert(alertId)
    }
  }
}

const handleNewAlert = (alert: OvertimeAlert) => {
  // Check if alert already exists
  const exists = alerts.value.some((a) => a.id === alert.id)
  if (!exists) {
    alerts.value.push(alert)

    // Auto-open sidebar when new alert arrives
    if (!isOpen.value) {
      isOpen.value = true
    }

    // Show notification for new alert
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      html: `<div style="font-family: Arial, sans-serif;"><strong>Cảnh báo bàn quá giờ!</strong><br/>${alert.tableNames.join(', ')}</div>`,
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
    })
  }
}

// Lifecycle hooks
onMounted(() => {
  try {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:8080/ws/overtime-alerts'
    let token = localStorage.getItem('accessToken')
    
    // Remove "Bearer " prefix if exists
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7)
    }

    wsClient.value = new OvertimeAlertWebSocket(wsUrl)

    // Set callback BEFORE connecting (will be used in onConnect)
    wsClient.value.subscribe(handleNewAlert)

    // Connect to WebSocket (subscribe will happen automatically in onConnect)
    wsClient.value.connect(token || undefined)

    // Update connection state periodically
    const stateInterval = setInterval(() => {
      if (wsClient.value) {
        connectionState.value = wsClient.value.getConnectionState()
      }
    }, 1000)

    // Store interval ID for cleanup
    ;(wsClient.value as any)._stateInterval = stateInterval
  } catch (error) {
    console.error('Error initializing WebSocket:', error)
    // Set disconnected state on error
    connectionState.value = 'disconnected'
  }
})

onUnmounted(() => {
  try {
    if (wsClient.value) {
      // Clear state interval
      const stateInterval = (wsClient.value as any)._stateInterval
      if (stateInterval) {
        clearInterval(stateInterval)
      }

      // Disconnect WebSocket
      wsClient.value.disconnect()
      wsClient.value = null
    }
  } catch (error) {
    console.error('Error cleaning up WebSocket:', error)
  }
})
</script>

<style scoped>
/* Container for the entire sidebar system */
.overtime-alert-container {
  position: fixed;
  top: 80px;
  right: 0;
  z-index: 9998;
  display: flex;
  align-items: flex-start;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: translateX(400px);
}

.overtime-alert-container.is-open {
  transform: translateX(0);
}

/* Toggle Button - Elegant floating button */
.sidebar-toggle {
  width: 48px;
  height: 48px;
  border-radius: 50% 0 0 50%;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  box-shadow: -6px 4px 20px rgba(255, 107, 107, 0.4), 
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  margin-top: 10px;
  backdrop-filter: blur(10px);
}

.sidebar-toggle:hover {
  transform: scale(1.1) translateX(-4px);
  box-shadow: -8px 6px 28px rgba(255, 107, 107, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.sidebar-toggle:active {
  transform: scale(0.95) translateX(-2px);
}

.sidebar-toggle.has-alerts {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: -6px 4px 20px rgba(255, 107, 107, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 0 0 0 rgba(255, 107, 107, 0.7);
  }
  50% {
    box-shadow: -8px 6px 28px rgba(255, 107, 107, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                0 0 0 8px rgba(255, 107, 107, 0);
  }
}

.sidebar-toggle i {
  transition: transform 0.3s ease;
}

.sidebar-toggle:hover i {
  transform: scale(1.2);
}

.alert-badge {
  position: absolute;
  top: -4px;
  left: -4px;
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
  color: #000;
  border-radius: 50%;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  box-shadow: 0 3px 12px rgba(255, 193, 7, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
  border: 2px solid white;
  animation: badge-bounce 0.6s ease-out;
}

@keyframes badge-bounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* Sidebar Panel - Modern glass morphism design */
.overtime-alert-panel {
  width: 400px;
  max-height: calc(100vh - 100px);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 20px 0 0 20px;
  box-shadow: -12px 0 48px rgba(0, 0, 0, 0.12),
              -4px 0 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-right: none;
}

.alert-header {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.alert-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.alert-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  flex: 1;
  display: flex;
  align-items: center;
  letter-spacing: -0.3px;
  position: relative;
  z-index: 1;
}

.alert-header h3 i {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.alert-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 6px 14px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 700;
  min-width: 36px;
  text-align: center;
  margin-left: auto;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.alert-count.has-alerts {
  background: rgba(255, 255, 255, 0.35);
  animation: count-pulse 2s ease-in-out infinite;
}

@keyframes count-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

.connection-status {
  padding: 12px 24px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.connection-status::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px currentColor;
  opacity: 0.2;
}

.status-connected {
  color: #28a745;
  background: linear-gradient(to right, rgba(40, 167, 69, 0.08) 0%, transparent 100%);
}

.status-connected::before {
  background: #28a745;
  box-shadow: 0 0 12px rgba(40, 167, 69, 0.6),
              0 0 0 3px rgba(40, 167, 69, 0.2);
}

.status-connecting {
  color: #ffc107;
  background: linear-gradient(to right, rgba(255, 193, 7, 0.08) 0%, transparent 100%);
}

.status-connecting::before {
  background: #ffc107;
  box-shadow: 0 0 12px rgba(255, 193, 7, 0.6),
              0 0 0 3px rgba(255, 193, 7, 0.2);
  animation: connecting-pulse 1.5s ease-in-out infinite;
}

@keyframes connecting-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

.status-disconnected {
  color: #dc3545;
  background: linear-gradient(to right, rgba(220, 53, 69, 0.08) 0%, transparent 100%);
}

.status-disconnected::before {
  background: #dc3545;
  box-shadow: 0 0 12px rgba(220, 53, 69, 0.6),
              0 0 0 3px rgba(220, 53, 69, 0.2);
}

.no-alerts {
  text-align: center;
  padding: 80px 24px;
  color: #999;
}

.no-alerts i {
  font-size: 64px;
  color: #28a745;
  margin-bottom: 20px;
  opacity: 0.7;
  filter: drop-shadow(0 4px 12px rgba(40, 167, 69, 0.2));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.no-alerts p {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #6c757d;
}

.alert-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alert-item {
  padding: 18px;
  border-radius: 16px;
  border-left: 4px solid;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.alert-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: inherit;
  filter: brightness(1.2);
}

.alert-item:hover {
  transform: translateX(-8px) scale(1.02);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
}

.urgency-critical {
  border-left-color: #dc3545;
  background: linear-gradient(135deg, rgba(220, 53, 69, 0.08) 0%, white 30%);
}

.urgency-high {
  border-left-color: #ff9800;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, white 30%);
}

.urgency-medium {
  border-left-color: #ffc107;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.08) 0%, white 30%);
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 14px;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.table-info strong {
  font-size: 17px;
  color: #212529;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.duration {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: #495057;
  font-weight: 700;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.reservation-info,
.invoice-code {
  font-size: 13px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.reservation-info i,
.invoice-code i {
  color: #adb5bd;
  font-size: 14px;
}

.acknowledge-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.25);
  position: relative;
  overflow: hidden;
}

.acknowledge-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.acknowledge-btn:hover::before {
  width: 300px;
  height: 300px;
}

.acknowledge-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(40, 167, 69, 0.35);
}

.acknowledge-btn:active {
  transform: translateY(-1px);
}

.acknowledge-btn i {
  position: relative;
  z-index: 1;
}

/* Scrollbar styling - Modern minimal */
.alert-list::-webkit-scrollbar {
  width: 6px;
}

.alert-list::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}

.alert-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #dee2e6 0%, #ced4da 100%);
  border-radius: 10px;
  transition: background 0.3s ease;
}

.alert-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #ced4da 0%, #adb5bd 100%);
}

/* Responsive */
@media (max-width: 768px) {
  .overtime-alert-container {
    transform: translateX(calc(100vw - 48px));
  }
  
  .overtime-alert-panel {
    width: calc(100vw - 68px);
    max-width: 400px;
  }
  
  .sidebar-toggle {
    width: 44px;
    height: 44px;
    font-size: 18px;
  }
}
</style>
