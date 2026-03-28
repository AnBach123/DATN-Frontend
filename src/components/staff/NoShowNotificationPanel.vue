<template>
  <div class="noshow-notification-container" :class="{ 'is-open': isOpen }">
    <!-- Toggle Button -->
    <button 
      class="sidebar-toggle" 
      @click="toggleSidebar"
      :class="{ 'has-notifications': notifications.length > 0 }"
      :title="isOpen ? 'Đóng' : 'Mở thông báo no-show'"
    >
      <i :class="isOpen ? 'bi bi-chevron-right' : 'bi bi-chevron-left'"></i>
      <span v-if="notifications.length > 0 && !isOpen" class="notification-badge">{{ notifications.length }}</span>
    </button>

    <!-- Panel -->
    <div class="noshow-notification-panel">
      <div class="notification-header">
        <h3>
          <i class="bi bi-person-x-fill me-2"></i>
          Khách không đến
        </h3>
        <span class="notification-count" :class="{ 'has-notifications': notifications.length > 0 }">
          {{ notifications.length }}
        </span>
      </div>

      <div class="connection-status" :class="connectionStatusClass">
        {{ connectionStatusText }}
      </div>

      <div v-if="notifications.length === 0" class="no-notifications">
        <i class="bi bi-check-circle"></i>
        <p>Không có thông báo no-show</p>
      </div>

      <div v-else class="notification-list">
        <div
          v-for="notification in sortedNotifications"
          :key="notification.reservationCode"
          class="notification-item"
        >
          <div class="notification-content">
            <div class="reservation-info">
              <strong>{{ notification.reservationCode }}</strong>
              <span class="status-badge">Đã hủy tự động</span>
            </div>
            
            <div class="customer-info">
              <i class="bi bi-person"></i>
              {{ notification.customerName }}
            </div>
            
            <div class="phone-info">
              <i class="bi bi-telephone"></i>
              {{ notification.phoneNumber }}
            </div>
            
            <div class="table-info">
              <i class="bi bi-grid-3x3"></i>
              {{ notification.tableNames }}
            </div>
            
            <div class="time-info">
              <i class="bi bi-clock"></i>
              Đặt lúc: {{ formatTime(notification.reservedAt) }}
            </div>
            
            <div class="detected-info">
              <i class="bi bi-exclamation-triangle"></i>
              Phát hiện: {{ formatTime(notification.detectedAt) }}
            </div>
            
            <div class="message-info">
              {{ notification.message }}
            </div>
          </div>
          
          <button @click="dismissNotification(notification.reservationCode)" class="dismiss-btn">
            <i class="bi bi-x-lg"></i>
            Đã xem
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface NoShowNotification {
  reservationCode: string;
  customerName: string;
  phoneNumber: string;
  reservedAt: string;
  tableNames: string;
  guestCount: number;
  detectedAt: string;
  notificationType: string;
  message: string;
}

type ConnectionState = 'connected' | 'connecting' | 'disconnected';

const notifications = ref<NoShowNotification[]>([]);
const connectionState = ref<ConnectionState>('disconnected');
const isOpen = ref(false);
let stompClient: Client | null = null;

// Methods
const toggleSidebar = () => {
  isOpen.value = !isOpen.value;
};

// Computed
const sortedNotifications = computed(() => {
  return [...notifications.value].sort((a, b) => {
    return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
  });
});

const connectionStatusClass = computed(() => {
  return {
    'status-connected': connectionState.value === 'connected',
    'status-connecting': connectionState.value === 'connecting',
    'status-disconnected': connectionState.value === 'disconnected',
  };
});

const connectionStatusText = computed(() => {
  switch (connectionState.value) {
    case 'connected':
      return 'Đã kết nối';
    case 'connecting':
      return 'Đang kết nối...';
    case 'disconnected':
      return 'Mất kết nối';
    default:
      return '';
  }
});

// Format time
const formatTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return isoString;
  }
};

// Dismiss notification
const dismissNotification = (reservationCode: string) => {
  notifications.value = notifications.value.filter(n => n.reservationCode !== reservationCode);
};

// Handle new notification
const handleNewNotification = (notification: NoShowNotification) => {
  const exists = notifications.value.some(n => n.reservationCode === notification.reservationCode);
  if (!exists) {
    notifications.value.push(notification);
    
    // Auto-open sidebar
    if (!isOpen.value) {
      isOpen.value = true;
    }
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Khách không đến', {
        body: `${notification.customerName} - ${notification.reservationCode}`,
        icon: '/favicon.ico'
      });
    }
  }
};

// Setup WebSocket
const setupWebSocket = () => {
  try {
    connectionState.value = 'connecting';
    
    let token = localStorage.getItem('accessToken');
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7);
    }
    
    const wsUrl = import.meta.env.VITE_API_BASE_URL + '/ws';
    const socketUrl = token ? `${wsUrl}?token=${token}` : wsUrl;
    
    stompClient = new Client({
      webSocketFactory: () => new SockJS(socketUrl) as WebSocket,
      
      onConnect: () => {
        console.log('✅ No-show WebSocket connected');
        connectionState.value = 'connected';
        
        // Subscribe to no-show notifications
        stompClient?.subscribe('/topic/noshow', (message) => {
          try {
            const notification: NoShowNotification = JSON.parse(message.body);
            console.log('📨 Received no-show notification:', notification);
            handleNewNotification(notification);
          } catch (error) {
            console.error('❌ Error parsing no-show notification:', error);
          }
        });
      },
      
      onStompError: (frame) => {
        console.error('❌ No-show STOMP error:', frame);
        connectionState.value = 'disconnected';
      },
      
      onWebSocketClose: () => {
        console.log('🔌 No-show WebSocket closed');
        connectionState.value = 'disconnected';
      },
      
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 5000,
    });
    
    stompClient.activate();
  } catch (error) {
    console.error('Error setting up no-show WebSocket:', error);
    connectionState.value = 'disconnected';
  }
};

// Request notification permission
const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
};

// Lifecycle
onMounted(() => {
  setupWebSocket();
  requestNotificationPermission();
});

onUnmounted(() => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
});
</script>

<style scoped>
/* Container */
.noshow-notification-container {
  position: fixed;
  top: 140px;
  right: 0;
  z-index: 9998;
  display: flex;
  align-items: flex-start;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: translateX(400px);
}

.noshow-notification-container.is-open {
  transform: translateX(0);
}

/* Toggle Button */
.sidebar-toggle {
  width: 48px;
  height: 48px;
  border-radius: 50% 0 0 50%;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  box-shadow: -6px 4px 20px rgba(220, 53, 69, 0.4), 
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
  box-shadow: -8px 6px 28px rgba(220, 53, 69, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.sidebar-toggle.has-notifications {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: -6px 4px 20px rgba(220, 53, 69, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 0 0 0 rgba(220, 53, 69, 0.7);
  }
  50% {
    box-shadow: -8px 6px 28px rgba(220, 53, 69, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                0 0 0 8px rgba(220, 53, 69, 0);
  }
}

.notification-badge {
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
  box-shadow: 0 3px 12px rgba(255, 193, 7, 0.5);
  border: 2px solid white;
}

/* Panel */
.noshow-notification-panel {
  width: 400px;
  max-height: calc(100vh - 160px);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 20px 0 0 20px;
  box-shadow: -12px 0 48px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-right: none;
}

.notification-header {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.notification-header::before {
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

.notification-header h3 {
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

.notification-header h3 i {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.notification-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 6px 14px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 700;
  min-width: 36px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-count.has-notifications {
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
}

.connection-status::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-connected {
  color: #28a745;
  background: linear-gradient(to right, rgba(40, 167, 69, 0.08) 0%, transparent 100%);
}

.status-connected::before {
  background: #28a745;
  box-shadow: 0 0 12px rgba(40, 167, 69, 0.6);
}

.status-connecting {
  color: #ffc107;
  background: linear-gradient(to right, rgba(255, 193, 7, 0.08) 0%, transparent 100%);
}

.status-connecting::before {
  background: #ffc107;
  animation: connecting-pulse 1.5s ease-in-out infinite;
}

@keyframes connecting-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-disconnected {
  color: #dc3545;
  background: linear-gradient(to right, rgba(220, 53, 69, 0.08) 0%, transparent 100%);
}

.status-disconnected::before {
  background: #dc3545;
}

.no-notifications {
  text-align: center;
  padding: 80px 24px;
  color: #999;
}

.no-notifications i {
  font-size: 64px;
  color: #28a745;
  margin-bottom: 20px;
  opacity: 0.7;
}

.no-notifications p {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #6c757d;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-item {
  padding: 18px;
  border-radius: 16px;
  border-left: 4px solid #dc3545;
  background: linear-gradient(135deg, rgba(220, 53, 69, 0.08) 0%, white 30%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.notification-item:hover {
  transform: translateX(-8px) scale(1.02);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.reservation-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.reservation-info strong {
  font-size: 17px;
  color: #212529;
  font-weight: 700;
}

.status-badge {
  background: #dc3545;
  color: white;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
}

.customer-info,
.phone-info,
.table-info,
.time-info,
.detected-info {
  font-size: 13px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.customer-info i,
.phone-info i,
.table-info i,
.time-info i,
.detected-info i {
  color: #adb5bd;
  font-size: 14px;
}

.message-info {
  font-size: 13px;
  color: #495057;
  font-style: italic;
  padding: 8px;
  background: rgba(220, 53, 69, 0.05);
  border-radius: 8px;
}

.dismiss-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.dismiss-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(108, 117, 125, 0.35);
}

/* Scrollbar */
.notification-list::-webkit-scrollbar {
  width: 6px;
}

.notification-list::-webkit-scrollbar-track {
  background: transparent;
}

.notification-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #dee2e6 0%, #ced4da 100%);
  border-radius: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .noshow-notification-container {
    transform: translateX(calc(100vw - 48px));
  }
  
  .noshow-notification-panel {
    width: calc(100vw - 68px);
    max-width: 400px;
  }
}
</style>
