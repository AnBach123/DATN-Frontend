<template>
  <div class="invoice-list-container">
    <div class="header-section">
      <h2>Danh sách hóa đơn</h2>
    </div>

    <div class="filters-section">
      <div class="filter-row">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Tìm kiếm theo mã HĐ, tên KH, SĐT, bàn..."
          class="search-input"
          @input="handleSearch"
        />
        
        <select v-model="filters.status" @change="loadInvoices" class="filter-select">
          <option value="">Tất cả trạng thái</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="IN_PROGRESS">Đang phục vụ</option>
          <option value="RESERVED">Đã đặt</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>

        <select v-model="filters.paymentMethod" @change="loadInvoices" class="filter-select">
          <option value="">Tất cả PTTT</option>
          <option value="CASH">Tiền mặt</option>
          <option value="BANK_TRANSFER">Chuyển khoản</option>
          <option value="MOMO">MoMo</option>
        </select>

        <input
          v-model="filters.startDate"
          type="date"
          class="date-input"
          @change="loadInvoices"
        />
        <span class="date-separator">đến</span>
        <input
          v-model="filters.endDate"
          type="date"
          class="date-input"
          @change="loadInvoices"
        />
      </div>
    </div>

    <div class="table-container">
      <table class="invoice-table">
        <thead>
          <tr>
            <th @click="handleSort('code')">
              Mã Hóa đơn
              <span v-if="filters.sortBy === 'code'">{{ filters.sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th>Bàn</th>
            <th @click="handleSort('time')">
              Thời gian
              <span v-if="filters.sortBy === 'time'">{{ filters.sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th>Tạm tính</th>
            <th>Giảm giá</th>
            <th>Phí DV</th>
            <th>Thuế</th>
            <th @click="handleSort('finalAmount')">
              Tổng tiền
              <span v-if="filters.sortBy === 'finalAmount'">{{ filters.sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th>Trạng thái</th>
            <th>PTTT</th>
            <th>Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="11" class="loading-cell">Đang tải...</td>
          </tr>
          <tr v-else-if="invoices.length === 0">
            <td colspan="11" class="empty-cell">Không có hóa đơn nào</td>
          </tr>
          <tr v-else v-for="invoice in invoices" :key="invoice.id" class="invoice-row">
            <td class="code-cell">{{ invoice.code }}</td>
            <td>{{ invoice.table }}</td>
            <td>{{ formatDateTime(invoice.time) }}</td>
            <td class="amount-cell">{{ formatCurrency(invoice.subtotal) }}</td>
            <td class="discount-cell">{{ formatCurrency(invoice.discount) }}</td>
            <td class="fee-cell">{{ formatCurrency(invoice.serviceFee) }}</td>
            <td class="tax-cell">{{ formatCurrency(invoice.tax) }}</td>
            <td class="total-cell">{{ formatCurrency(invoice.finalAmount) }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(invoice.status)]">
                {{ getStatusText(invoice.status) }}
              </span>
            </td>
            <td>{{ getPaymentMethodText(invoice.paymentMethod) }}</td>
            <td>
              <button @click="showInvoiceDetail(invoice)" class="detail-btn">
                Chi tiết
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Invoice Detail Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Chi tiết hóa đơn</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body" v-if="selectedInvoice">
          <div class="detail-section">
            <h3>Thông tin chung</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Mã hóa đơn:</span>
                <span class="value">{{ selectedInvoice.code }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Bàn:</span>
                <span class="value">{{ selectedInvoice.table }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Thời gian:</span>
                <span class="value">{{ formatDateTime(selectedInvoice.time) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Trạng thái:</span>
                <span :class="['status-badge', getStatusClass(selectedInvoice.status)]">
                  {{ getStatusText(selectedInvoice.status) }}
                </span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="selectedInvoice.customerName || selectedInvoice.customerPhone || selectedInvoice.customerEmail">
            <h3>Thông tin khách hàng</h3>
            <div class="detail-grid">
              <div class="detail-item" v-if="selectedInvoice.customerName">
                <span class="label">Tên khách hàng:</span>
                <span class="value">{{ selectedInvoice.customerName }}</span>
              </div>
              <div class="detail-item" v-if="selectedInvoice.customerPhone">
                <span class="label">Số điện thoại:</span>
                <span class="value">{{ selectedInvoice.customerPhone }}</span>
              </div>
              <div class="detail-item" v-if="selectedInvoice.customerEmail">
                <span class="label">Email:</span>
                <span class="value">{{ selectedInvoice.customerEmail }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Chi tiết thanh toán</h3>
            <div class="payment-details">
              <div class="payment-row">
                <span class="payment-label">Tạm tính:</span>
                <span class="payment-value">{{ formatCurrency(selectedInvoice.subtotal) }}</span>
              </div>
              <div class="payment-row discount-row">
                <span class="payment-label">Giảm giá:</span>
                <span class="payment-value">-{{ formatCurrency(selectedInvoice.discount) }}</span>
              </div>
              <div class="payment-row">
                <span class="payment-label">Phí dịch vụ:</span>
                <span class="payment-value">{{ formatCurrency(selectedInvoice.serviceFee) }}</span>
              </div>
              <div class="payment-row">
                <span class="payment-label">Thuế:</span>
                <span class="payment-value">{{ formatCurrency(selectedInvoice.tax) }}</span>
              </div>
              <div class="payment-row total-row">
                <span class="payment-label">Tổng cộng:</span>
                <span class="payment-value">{{ formatCurrency(selectedInvoice.finalAmount) }}</span>
              </div>
              <div class="payment-row" v-if="selectedInvoice.paymentMethod">
                <span class="payment-label">Phương thức thanh toán:</span>
                <span class="payment-value">{{ getPaymentMethodText(selectedInvoice.paymentMethod) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="pagination-section" v-if="totalPages > 1">
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 0"
        class="pagination-btn"
      >
        ‹ Trước
      </button>
      
      <div class="page-numbers">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="goToPage(page - 1)"
          :class="['page-btn', { active: page - 1 === currentPage }]"
        >
          {{ page }}
        </button>
      </div>

      <button
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage >= totalPages - 1"
        class="pagination-btn"
      >
        Sau ›
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { invoiceService, type InvoicePageResponse, type RecentInvoice } from '@/services/dashboardService'

const invoices = ref<RecentInvoice[]>([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const showModal = ref(false)
const selectedInvoice = ref<RecentInvoice | null>(null)

const filters = ref({
  search: '',
  status: '',
  paymentMethod: '',
  startDate: '',
  endDate: '',
  sortBy: 'time',
  sortDirection: 'desc'
})

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 0
    loadInvoices()
  }, 500)
}

const handleSort = (field: string) => {
  if (filters.value.sortBy === field) {
    filters.value.sortDirection = filters.value.sortDirection === 'asc' ? 'desc' : 'asc'
  } else {
    filters.value.sortBy = field
    filters.value.sortDirection = 'desc'
  }
  loadInvoices()
}

const loadInvoices = async () => {
  loading.value = true
  try {
    const response: InvoicePageResponse = await invoiceService.getAllInvoices({
      page: currentPage.value,
      size: 20,
      status: filters.value.status || undefined,
      startDate: filters.value.startDate || undefined,
      endDate: filters.value.endDate || undefined,
      search: filters.value.search || undefined,
      paymentMethod: filters.value.paymentMethod || undefined,
      sortBy: filters.value.sortBy,
      sortDirection: filters.value.sortDirection
    })
    
    invoices.value = response.content
    totalPages.value = response.totalPages
    totalElements.value = response.totalElements
  } catch (error) {
    console.error('Error loading invoices:', error)
  } finally {
    loading.value = false
  }
}

const goToPage = (page: number) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
    loadInvoices()
  }
}

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2) + 1)
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getStatusClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PAID': 'status-paid',
    'IN_PROGRESS': 'status-in-progress',
    'RESERVED': 'status-reserved',
    'CANCELLED': 'status-cancelled',
    'NO_SHOW': 'status-no-show'
  }
  return statusMap[status] || ''
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PAID': 'Đã thanh toán',
    'IN_PROGRESS': 'Đang phục vụ',
    'RESERVED': 'Đã đặt',
    'CANCELLED': 'Đã hủy',
    'NO_SHOW': 'Không đến'
  }
  return statusMap[status] || status
}

const getPaymentMethodText = (method: string | null): string => {
  if (!method) return 'N/A'
  const methodMap: Record<string, string> = {
    'CASH': 'Tiền mặt',
    'BANK_TRANSFER': 'Chuyển khoản',
    'MOMO': 'MoMo'
  }
  return methodMap[method] || method
}

const showInvoiceDetail = (invoice: RecentInvoice) => {
  selectedInvoice.value = invoice
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedInvoice.value = null
}

onMounted(() => {
  loadInvoices()
})
</script>

<style scoped>
.invoice-list-container {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h2 {
  font-size: 28px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.filters-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-select {
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.date-input {
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s;
}

.date-input:focus {
  outline: none;
  border-color: #667eea;
}

.date-separator {
  color: #718096;
  font-size: 14px;
}

.table-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
}

.invoice-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.invoice-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
  transition: background 0.3s;
}

.invoice-table th:hover {
  background: rgba(255, 255, 255, 0.1);
}

.invoice-table tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.3s;
}

.invoice-table tbody tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

.invoice-table td {
  padding: 16px;
  font-size: 14px;
  color: #4a5568;
}

.code-cell {
  font-weight: 600;
  color: #667eea;
}

.amount-cell {
  font-weight: 500;
  color: #2d3748;
}

.discount-cell {
  color: #e53e3e;
  font-weight: 500;
}

.fee-cell,
.tax-cell {
  color: #718096;
  font-weight: 500;
}

.total-cell {
  font-weight: 700;
  color: #2d3748;
  font-size: 15px;
}

.detail-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  letter-spacing: 0.3px;
}

.detail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
  background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
}

.detail-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-paid {
  background: #c6f6d5;
  color: #22543d;
}

.status-in-progress {
  background: #fed7d7;
  color: #742a2a;
}

.status-reserved {
  background: #feebc8;
  color: #7c2d12;
}

.status-cancelled {
  background: #e2e8f0;
  color: #4a5568;
}

.status-no-show {
  background: #fef3c7;
  color: #78350f;
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 40px;
  color: #718096;
  font-style: italic;
}

.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.pagination-btn {
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #4a5568;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 8px;
}

.page-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #4a5568;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.page-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

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
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 2px solid #e2e8f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  font-size: 16px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item .label {
  font-size: 12px;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item .value {
  font-size: 14px;
  color: #2d3748;
  font-weight: 600;
}

.payment-details {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 12px;
  padding: 20px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.payment-row:last-child {
  border-bottom: none;
}

.payment-label {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
}

.payment-value {
  font-size: 14px;
  color: #2d3748;
  font-weight: 600;
}

.discount-row .payment-value {
  color: #e53e3e;
}

.total-row {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 2px solid #cbd5e0;
}

.total-row .payment-label {
  font-size: 16px;
  font-weight: 700;
  color: #2d3748;
}

.total-row .payment-value {
  font-size: 18px;
  font-weight: 700;
  color: #667eea;
}
</style>
