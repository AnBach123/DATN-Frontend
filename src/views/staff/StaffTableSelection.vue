<template>
  <div class="table-selection-container">
    <div class="container-fluid p-4">
      <div class="header-section">
        <h2>Chọn bàn phục vụ</h2>
        <p>Nhân viên: <strong>{{ staffName }}</strong></p>
      </div>

      <div v-if="loading" class="text-center">Đang tải...</div>

      <div v-else-if="invoices.length === 0" class="empty-state">
        <p>Không có bàn nào đang phục vụ</p>
      </div>

      <div v-else class="invoice-grid">
        <div
          v-for="invoice in invoices"
          :key="invoice.invoiceId"
          class="invoice-card"
          @click="selectInvoice(invoice)"
        >
          <div class="invoice-header">
            <div class="customer-name">{{ invoice.customerName }}</div>
            <div class="guest-count">{{ invoice.guestCount }} khách</div>
          </div>
          
          <div class="tables-section">
            <div class="tables-list">
              <span 
                v-for="(table, idx) in invoice.tables" 
                :key="table.tableId"
                class="table-badge"
              >
                {{ table.tableName }}
                <span v-if="idx < invoice.tables.length - 1">, </span>
              </span>
            </div>
            <div class="meta-info">
              <span class="area-badge">Khu vực {{ invoice.tables[0]?.area }}</span>
              <span class="separator">•</span>
              <span class="floor-info">Tầng {{ invoice.tables[0]?.floor }}</span>
            </div>
          </div>

          <div class="time-section">
            <div class="time-label">Thời gian phục vụ:</div>
            <div class="time-value">{{ getElapsedTime(invoice.checkedInAt) }}</div>
          </div>

          <div class="invoice-footer">
            <div class="amount-label">Tạm tính:</div>
            <div class="amount-value">{{ formatCurrency(invoice.subtotalAmount) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ACTION MODAL -->
    <div v-if="showActionModal" class="modal-overlay" @click="closeActionModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Chọn thao tác</h3>
          <button class="btn-close" @click="closeActionModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedInvoice" class="invoice-info">
            <p><strong>Khách hàng:</strong> {{ selectedInvoice.customerName }}</p>
            <p><strong>Bàn:</strong> {{ selectedInvoice.tables.map(t => t.tableName).join(', ') }}</p>
          </div>
          <div class="action-buttons">
            <button class="action-btn order-btn" @click="goToOrder">
              Order món
            </button>
            <button class="action-btn view-btn" @click="goToViewItems">
              Xem danh sách món
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getInProgressInvoices, type InvoiceGroup } from '@/services/staffOrderApi'
import { DashboardWebSocket } from '@/services/websocket/DashboardWebSocket'

const router = useRouter()
const staffName = 'Staff'
const loading = ref(true)
const invoices = ref<InvoiceGroup[]>([])
const currentTime = ref(Date.now())
let intervalId: number | null = null
const showActionModal = ref(false)
const selectedInvoice = ref<InvoiceGroup | null>(null)

// WebSocket instance
let wsClient: DashboardWebSocket | null = null

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

function getElapsedTime(checkedInAt: string): string {
  if (!checkedInAt) return '0 phút'
  
  const checkedIn = new Date(checkedInAt).getTime()
  const elapsed = Math.floor((currentTime.value - checkedIn) / 1000)
  
  const hours = Math.floor(elapsed / 3600)
  const minutes = Math.floor((elapsed % 3600) / 60)
  const seconds = elapsed % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

async function fetchInvoices() {
  try {
    loading.value = true
    console.log('Fetching in-progress invoices...')
    invoices.value = await getInProgressInvoices()
    console.log('Invoices loaded:', invoices.value)
  } catch (error) {
    console.error('Load invoices error', error)
    alert('Không thể tải danh sách hóa đơn')
  } finally {
    loading.value = false
  }
}

function selectInvoice(invoice: InvoiceGroup) {
  console.log('Selecting invoice:', invoice)
  selectedInvoice.value = invoice
  showActionModal.value = true
}

function closeActionModal() {
  showActionModal.value = false
  selectedInvoice.value = null
}

function goToOrder() {
  if (selectedInvoice.value) {
    router.push({
      name: 'staff-order',
      params: { invoiceId: selectedInvoice.value.invoiceId },
    })
  }
}

function goToViewItems() {
  if (selectedInvoice.value) {
    router.push({
      name: 'staff-view-items',
      params: { invoiceId: selectedInvoice.value.invoiceId },
    })
  }
}

onMounted(() => {
  fetchInvoices()
  
  // Update time every second
  intervalId = window.setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)

  // Initialize WebSocket
  const token = localStorage.getItem('token') || ''
  console.log('🔑 Token from localStorage:', token ? 'Found' : 'Not found (dev mode)')
  
  const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'
  console.log('🌐 WebSocket URL:', wsUrl)
  
  wsClient = new DashboardWebSocket(wsUrl)
  
  // Subscribe to invoice updates BEFORE connecting
  wsClient.subscribeInvoiceUpdates((update) => {
    console.log('📢 Invoice update received:', update)
    // Refresh invoice list when there's an update
    fetchInvoices()
  })
  
  // Subscribe to table status updates BEFORE connecting
  wsClient.subscribeTableStatus((update) => {
    console.log('📢 Table status update received:', update)
    // Refresh invoice list when table status changes
    fetchInvoices()
  })
  
  // Connect to WebSocket (will auto-subscribe after connection)
  console.log('🔌 Connecting to WebSocket...')
  wsClient.connect(token)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
  
  // Disconnect WebSocket
  if (wsClient) {
    wsClient.disconnect()
    wsClient = null
  }
})
</script>

<style scoped>
.table-selection-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 20px;
}

.header-section {
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-section h2 {
  margin: 0 0 8px 0;
  color: #1a202c;
  font-size: 24px;
  font-weight: 600;
}

.header-section p {
  margin: 0;
  color: #718096;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  color: #718096;
}

.invoice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.invoice-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
}

.invoice-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #4299e1;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: -20px -20px 16px -20px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px 12px 0 0;
}

.customer-name {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.guest-count {
  font-size: 13px;
  color: white;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 12px;
}

.tables-section {
  margin-bottom: 12px;
}

.tables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.table-badge {
  font-size: 15px;
  font-weight: 600;
  color: #2d3748;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.area-badge {
  color: #2c5282;
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 12px;
}

.separator {
  color: #cbd5e0;
}

.floor-info {
  color: #718096;
}

.time-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px;
  background: #f7fafc;
  border-radius: 8px;
}

.time-label {
  font-size: 12px;
  color: #718096;
}

.time-value {
  font-size: 14px;
  font-weight: 600;
  color: #2b6cb0;
  font-family: 'Courier New', monospace;
}

.invoice-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.amount-label {
  font-size: 13px;
  color: #718096;
}

.amount-value {
  font-size: 16px;
  font-weight: 600;
  color: #2b6cb0;
}

/* ACTION MODAL */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 16px 16px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
}

.invoice-info {
  background: #f7fafc;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.invoice-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #2d3748;
}

.invoice-info p:first-child {
  margin-top: 0;
}

.invoice-info p:last-child {
  margin-bottom: 0;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  padding: 16px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.order-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.view-btn {
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
}
</style>
