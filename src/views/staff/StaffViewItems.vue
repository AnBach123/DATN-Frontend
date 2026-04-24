<template>
  <div class="view-items-container">
    <div class="container-fluid p-4">
      <!-- HEADER -->
      <div class="header-section">
        <button class="back-btn" @click="goBack">
          <span>← Quay lại</span>
        </button>
        <h2>Danh sách món đã order</h2>
      </div>

      <div v-if="loading" class="text-center">Đang tải...</div>

      <div v-else-if="invoice" class="content">
        <!-- INVOICE INFO -->
        <div class="invoice-info-card">
          <div class="info-header">
            <h3>Thông tin bàn</h3>
          </div>
          <div class="info-body">
            <div class="info-row">
              <span class="label">Khách hàng:</span>
              <span class="value">{{ invoice.customerName }}</span>
            </div>
            <div class="info-row">
              <span class="label">Số khách:</span>
              <span class="value">{{ invoice.guestCount }} người</span>
            </div>
            <div class="info-row">
              <span class="label">Bàn:</span>
              <span class="value">{{ invoice.tables.map(t => t.tableName).join(', ') }}</span>
            </div>
            <div class="info-row">
              <span class="label">Khu vực:</span>
              <span class="value">{{ invoice.tables[0]?.area }} - Tầng {{ invoice.tables[0]?.floor }}</span>
            </div>
            <div class="info-row total">
              <span class="label">Tạm tính:</span>
              <span class="value">{{ formatCurrency(invoice.subtotalAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- ITEMS LIST -->
        <div class="items-card">
          <div class="items-header">
            <h3>Danh sách món ({{ items.length }})</h3>
          </div>
          <div v-if="items.length === 0" class="empty-state">
            <p>Chưa có món nào được order</p>
          </div>
          <div v-else class="items-list">
            <div v-for="item in items" :key="item.id" :class="['item-row', { 'item-row--pending': item.status === 'PENDING' }]">
              <div class="item-info">
                <div class="item-name">{{ item.itemName }}</div>
                <div class="item-meta">
                  <span class="qty">SL: {{ item.quantity }}</span>
                  <span :class="['badge', item.status.toLowerCase()]">
                    {{ formatStatus(item.status) }}
                  </span>
                </div>
              </div>
              <div class="item-right">
                <div class="item-price">{{ formatCurrency(item.price * item.quantity) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getInProgressInvoices, getInvoiceItems, type InvoiceGroup, type InvoiceItemResponse } from '@/services/staffOrderApi'
import { DashboardWebSocket } from '@/services/websocket/DashboardWebSocket'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const invoice = ref<InvoiceGroup | null>(null)
const items = ref<InvoiceItemResponse[]>([])

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'CHỜ KÍCH HOẠT',
    ORDERED: 'ĐÃ ORDER',
    IN_PROGRESS: 'ĐANG LÀM',
    DONE: 'HOÀN THÀNH',
    SERVED: 'ĐÃ PHỤC VỤ',
    CANCELLED: 'ĐÃ HỦY',
  }
  return map[status] || status
}

function goBack() {
  router.push({ name: 'staff-table-selection' })
}

// Get current staff ID from localStorage
function getCurrentStaffId(): number | null {
  try {
    const userIdStr = localStorage.getItem('userId')
    if (userIdStr) {
      const userId = parseInt(userIdStr, 10)
      if (!isNaN(userId)) {
        return userId
      }
    }
    return null
  } catch (error) {
    console.error('Failed to get staff ID:', error)
    return null
  }
}

let wsClient: DashboardWebSocket | null = null

// Refresh nhẹ: chỉ load lại items + tổng tiền, không re-check invoice/quyền staff
async function refreshItems() {
  try {
    const invoiceId = Number(route.params.invoiceId)
    if (!invoiceId) return
    items.value = await getInvoiceItems(invoiceId)
    // Reload invoice summary để cập nhật subtotal sau khi hủy món
    const invoices = await getInProgressInvoices()
    const found = invoices.find(inv => inv.invoiceId === invoiceId)
    if (found) invoice.value = found
  } catch (e) {
    console.error('Refresh items thất bại:', e)
  }
}

async function fetchInvoiceData() {
  try {
    loading.value = true
    const invoiceId = Number(route.params.invoiceId)
    const currentStaffId = getCurrentStaffId()
    
    console.log('🔍 Fetching invoice data for invoiceId:', invoiceId)
    console.log('👤 Current staff ID:', currentStaffId)
    
    // Get invoice info
    const invoices = await getInProgressInvoices()
    const foundInvoice = invoices.find(inv => inv.invoiceId === invoiceId)
    
    if (!foundInvoice) {
      alert('Không tìm thấy hóa đơn')
      goBack()
      return
    }
    
    // Check if this invoice belongs to current staff
    if (currentStaffId && foundInvoice.servingStaffId && foundInvoice.servingStaffId !== currentStaffId) {
      console.warn('❌ Access denied: Invoice belongs to another staff')
      alert(`Bàn này đang được phục vụ bởi ${foundInvoice.servingStaffName}. Bạn không có quyền xem.`)
      goBack()
      return
    }
    
    invoice.value = foundInvoice
    
    // Get invoice items
    items.value = await getInvoiceItems(invoiceId)
    console.log('✅ Invoice data loaded successfully')
  } catch (error) {
    console.error('❌ Load invoice error', error)
    alert('Không thể tải thông tin hóa đơn')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInvoiceData()

  // Subscribe WS để auto-refresh khi bếp hủy / đổi trạng thái món
  const token = localStorage.getItem('accessToken') || ''
  const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'
  wsClient = new DashboardWebSocket(wsUrl)
  wsClient.subscribeKitchenUpdates((update) => {
    console.log('📢 Kitchen update (StaffViewItems):', update)
    refreshItems()
  })
  wsClient.connect(token)
})

onUnmounted(() => {
  if (wsClient) {
    wsClient.disconnect()
    wsClient = null
  }
})
</script>

<style scoped>
.view-items-container {
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
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: #e2e8f0;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #cbd5e0;
  transform: translateX(-2px);
}

.header-section h2 {
  margin: 0;
  color: #1a202c;
  font-size: 24px;
  font-weight: 600;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* INVOICE INFO CARD */
.invoice-info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.info-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.info-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.info-body {
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row.total {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 2px solid #e2e8f0;
  border-bottom: none;
}

.info-row .label {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

.info-row .value {
  font-size: 15px;
  color: #2d3748;
  font-weight: 600;
}

.info-row.total .value {
  font-size: 18px;
  color: #667eea;
  font-weight: 700;
}

/* ITEMS CARD */
.items-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.items-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
}

.items-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #718096;
}

.items-list {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin-left: 16px;
  flex-shrink: 0;
}

.badge.pending {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f7fafc;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.item-row:hover {
  background: #edf2f7;
  transform: translateX(4px);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-weight: 600;
  font-size: 16px;
  color: #2d3748;
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qty {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

.badge {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge.ordered {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.badge.in_progress {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.badge.done {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.badge.served {
  background: linear-gradient(135deg, #64748b, #475569);
  color: white;
}

.badge.cancelled {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.item-price {
  font-size: 16px;
  font-weight: 700;
  color: #2b6cb0;
}

.text-center {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
}
</style>
