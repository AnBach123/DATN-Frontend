<template>
  <div class="invoice-list-container">
    <div class="header-section">
      <h2>Lịch sử hóa đơn</h2>
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
        
        <select v-model="filters.paymentMethod" @change="loadInvoices" class="filter-select">
          <option value="">Tất cả PTTT</option>
          <option value="CASH">Tiền mặt</option>
          <option value="TRANSFER">Chuyển khoản</option>
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

          <div class="detail-section" v-if="invoiceDetail && invoiceDetail.items && invoiceDetail.items.length > 0">
            <h3>Danh sách món</h3>
            <div v-if="loadingDetail" class="loading-items">Đang tải...</div>
            <div v-else class="items-table-container">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Tên món</th>
                    <th>SL</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in invoiceDetail.items" :key="item.id">
                    <td class="item-name">{{ item.name }}</td>
                    <td class="item-quantity">{{ item.quantity }}</td>
                    <td class="item-price">{{ formatCurrency(item.unitPrice) }}</td>
                    <td class="item-total">{{ formatCurrency(item.lineTotal) }}</td>
                  </tr>
                </tbody>
              </table>
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
import { invoiceService, type InvoicePageResponse, type RecentInvoice, type InvoiceDetail } from '@/services/dashboardService'

const invoices = ref<RecentInvoice[]>([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const showModal = ref(false)
const selectedInvoice = ref<RecentInvoice | null>(null)
const invoiceDetail = ref<InvoiceDetail | null>(null)
const loadingDetail = ref(false)

const filters = ref({
  search: '',
  status: 'PAID',
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
    'TRANSFER': 'Chuyển khoản'
  }
  return methodMap[method] || method
}

const showInvoiceDetail = async (invoice: RecentInvoice) => {
  selectedInvoice.value = invoice
  showModal.value = true
  loadingDetail.value = true
  invoiceDetail.value = null
  
  try {
    invoiceDetail.value = await invoiceService.getInvoiceDetail(invoice.id)
  } catch (error) {
    console.error('Error loading invoice detail:', error)
  } finally {
    loadingDetail.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  selectedInvoice.value = null
  invoiceDetail.value = null
}

onMounted(() => {
  loadInvoices()
})
</script>

<style scoped>
.invoice-list-container {
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'Inter', 'Be Vietnam Pro', sans-serif;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h2 {
  font-size: 34px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.filters-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
  padding: 12px 18px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-select {
  padding: 12px 18px;
  padding-right: 40px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  background: white;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.filter-select:hover {
  border-color: #667eea;
  background-color: #f8f9ff;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background-color: white;
}

.filter-select option {
  padding: 10px;
  font-weight: 500;
  color: #0f172a;
  background: white;
}

.filter-select option:hover {
  background: #f0f4ff;
}

.date-input {
  padding: 12px 18px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s;
}

.date-input:focus {
  outline: none;
  border-color: #667eea;
}

.date-separator {
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

.table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
  padding: 18px 16px;
  text-align: left;
  font-weight: 700;
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
  color: #1e293b;
}

.code-cell {
  font-weight: 700;
  color: #667eea;
}

.amount-cell {
  font-weight: 600;
  color: #0f172a;
}

.discount-cell {
  color: #f43f5e;
  font-weight: 600;
}

.fee-cell,
.tax-cell {
  color: #64748b;
  font-weight: 500;
}

.total-cell {
  font-weight: 800;
  color: #0f172a;
  font-size: 15px;
}

.detail-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.detail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.status-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}

.status-paid {
  background: #dcfce7;
  color: #166534;
}

.status-in-progress {
  background: #ffe4e6;
  color: #be123c;
}

.status-reserved {
  background: #fef9c3;
  color: #854d0e;
}

.status-cancelled {
  background: #e2e8f0;
  color: #475569;
}

.status-no-show {
  background: #ffedd5;
  color: #9a3412;
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 60px;
  color: #64748b;
  font-size: 16px;
  font-weight: 500;
}

.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.pagination-btn {
  padding: 10px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #475569;
  font-size: 14px;
  font-weight: 700;
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
  width: 44px;
  height: 44px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #475569;
  font-size: 14px;
  font-weight: 700;
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
  max-width: 700px;
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
  padding: 28px;
  border-bottom: 2px solid #e2e8f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 28px;
  width: 40px;
  height: 40px;
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
  padding: 28px;
}

.detail-section {
  margin-bottom: 28px;
}

.detail-section h3 {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 18px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #e2e8f0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item .label {
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item .value {
  font-size: 15px;
  color: #0f172a;
  font-weight: 700;
}

.payment-details {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 24px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #e2e8f0;
}

.payment-row:last-child {
  border-bottom: none;
}

.payment-label {
  font-size: 15px;
  color: #475569;
  font-weight: 600;
}

.payment-value {
  font-size: 15px;
  color: #0f172a;
  font-weight: 700;
}

.discount-row .payment-value {
  color: #f43f5e;
}

.total-row {
  margin-top: 10px;
  padding-top: 18px;
  border-top: 2px solid #cbd5e0;
}

.total-row .payment-label {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.total-row .payment-value {
  font-size: 20px;
  font-weight: 800;
  color: #667eea;
}

.loading-items {
  text-align: center;
  padding: 20px;
  color: #64748b;
  font-size: 14px;
}

.items-table-container {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.items-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.items-table th {
  padding: 12px;
  text-align: left;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.items-table th:nth-child(2) {
  text-align: center;
}

.items-table th:nth-child(3),
.items-table th:nth-child(4) {
  text-align: right;
}

.items-table tbody tr {
  border-bottom: 1px solid #e2e8f0;
}

.items-table tbody tr:last-child {
  border-bottom: none;
}

.items-table tbody tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

.items-table td {
  padding: 12px;
  font-size: 14px;
  color: #1e293b;
}

.item-name {
  font-weight: 600;
  color: #0f172a;
}

.item-quantity {
  text-align: center;
  font-weight: 700;
  color: #667eea;
}

.item-price {
  font-weight: 500;
  color: #64748b;
  text-align: right;
}

.item-total {
  font-weight: 700;
  color: #0f172a;
  text-align: right;
}
</style>
