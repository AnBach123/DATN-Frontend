<template>
  <div class="overtime-alert-panel">
    <div class="alert-header">
      <h3>Bàn quá giờ</h3>
      <span class="alert-count" :class="{ 'has-alerts': alerts.length > 0 }">
        {{ alerts.length }}
      </span>
      <span class="connection-status" :class="connectionStatusClass">
        {{ connectionStatusText }}
      </span>
    </div>

    <div v-if="alerts.length === 0" class="no-alerts">
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
            Đặt bàn tiếp theo: {{ formatTime(alert.nextReservationTime) }}
          </div>
          <div class="invoice-code">Hóa đơn: {{ alert.invoiceCode }}</div>
        </div>
        <button @click="acknowledgeAlert(alert.id)" class="acknowledge-btn">
          Xác nhận
        </button>
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
import Swal from 'sweetalert2'

const alerts = ref<OvertimeAlert[]>([])
const wsClient = ref<OvertimeAlertWebSocket | null>(null)
const connectionState = ref<ConnectionState>('disconnected')

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
      return '● Đã kết nối'
    case 'connecting':
      return '● Đang kết nối...'
    case 'disconnected':
      return '● Mất kết nối'
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
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`/api/overtime/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers,
    })

    if (!response.ok) {
      throw new Error('Failed to acknowledge alert')
    }

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
.overtime-alert-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.alert-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.alert-count {
  background: #e0e0e0;
  color: #666;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.alert-count.has-alerts {
  background: #ff4444;
  color: #fff;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.connection-status {
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-connected {
  color: #28a745;
}

.status-connecting {
  color: #ffc107;
}

.status-disconnected {
  color: #dc3545;
}

.no-alerts {
  text-align: center;
  padding: 32px 16px;
  color: #999;
}

.no-alerts p {
  margin: 0;
  font-size: 14px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.alert-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.urgency-critical {
  border-left-color: #dc3545;
  background: #fff5f5;
}

.urgency-high {
  border-left-color: #ff9800;
  background: #fff8f0;
}

.urgency-medium {
  border-left-color: #ffc107;
  background: #fffbf0;
}

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-info strong {
  font-size: 16px;
  color: #333;
}

.duration {
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.reservation-info {
  font-size: 14px;
  color: #666;
}

.invoice-code {
  font-size: 12px;
  color: #999;
}

.acknowledge-btn {
  padding: 8px 16px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  white-space: nowrap;
}

.acknowledge-btn:hover {
  background: #0056b3;
}

.acknowledge-btn:active {
  transform: scale(0.98);
}

/* Responsive design */
@media (max-width: 768px) {
  .overtime-alert-panel {
    padding: 12px;
  }

  .alert-header h3 {
    font-size: 16px;
  }

  .alert-item {
    flex-direction: column;
    align-items: stretch;
  }

  .acknowledge-btn {
    width: 100%;
  }

  .table-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
