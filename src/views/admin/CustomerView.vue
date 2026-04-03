<template>
  <div class="invoice-list-container">

    <!-- HEADER -->
    <div class="header-section">
      <h2>Quản lý khách hàng</h2>
    </div>

    <!-- FILTER -->
    <div class="filters-section">
      <div class="filter-row">

        <!-- SEARCH GỘP -->
        <input
          v-model="search"
          type="text"
          placeholder="Tìm ID, tên, SĐT, email..."
          class="search-input"
          @input="handleSearch"
        />
        <select v-model="genderFilter" @change="fetchData" class="filter-select">
          <option value="">Tất cả giới tính</option>
          <option value="MALE">Nam</option>
          <option value="FEMALE">Nữ</option>
          <option value="OTHER">Khác</option>
        </select>
        <!-- FILTER STATUS -->
        <select v-model="statusFilter" @change="fetchData" class="filter-select">
          <option value="">Tất cả trạng thái</option>
          <option :value="true">Hoạt động</option>
          <option :value="false">Không hoạt động</option>
        </select>

          <input
            v-model="startDate"
            type="date"
            class="date-input"
            @change="fetchData"
          />

          <span class="date-separator">đến</span>

          <input
            v-model="endDate"
            type="date"
            class="date-input"
            @change="fetchData"
          />
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-container">
      <table class="invoice-table">
        <thead>
          <tr>
            <th @click="sort('id')">ID {{ icon('id') }}</th>
            <th @click="sort('fullName')">Họ tên {{ icon('fullName') }}</th>
            <th>SĐT</th>
            <th>Email</th>
            <th>Giới tính</th>
            <th @click="sort('createdAt')">Ngày tạo {{ icon('createdAt') }}</th>
            <th @click="sort('loyaltyPoints')">Điểm {{ icon('loyaltyPoints') }}</th>
            <th>Trạng thái</th>
            <th>Chi tiết</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="loading-cell">Đang tải...</td>
          </tr>

          <tr v-else-if="list.length === 0">
            <td colspan="8" class="empty-cell">Không có dữ liệu</td>
          </tr>

          <tr v-else v-for="c in list" :key="c.id">
            <td>{{ c.id }}</td>
            <td class="code-cell">{{ c.fullName }}</td>
            <td>{{ c.phoneNumber }}</td>
            <td>{{ c.email }}</td>
            <td>{{ c.gender }}</td>
            <td>{{ formatDate(c.createdAt) }}</td>
            <td>{{ c.loyaltyPoints }}</td>

            <td>
              <span :class="['status-badge', c.isActive ? 'status-paid' : 'status-cancelled']">
                {{ c.isActive ? 'Hoạt động' : 'Không hoạt động' }}
              </span>
            </td>

            <td>
              <button class="detail-btn" @click="openDetail(c)">
                Chi tiết
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>

        <div class="modal-header">
          <h2>Chi tiết khách hàng</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-body" v-if="selected">

          <div class="detail-section">
            <h3>Thông tin khách hàng</h3>

            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">ID</span>
                <span class="value">{{ selected.id }}</span>
              </div>

              <div class="detail-item">
                <span class="label">Họ tên</span>
                <span class="value">{{ selected.fullName }}</span>
              </div>

              <div class="detail-item">
                <span class="label">SĐT</span>
                <span class="value">{{ selected.phoneNumber }}</span>
              </div>

              <div class="detail-item">
                <span class="label">Email</span>
                <span class="value">{{ selected.email }}</span>
              </div>

              <div class="detail-item">
                <span class="label">Ngày sinh</span>
                <span class="value">{{ formatDate(selected.dateOfBirth) }}</span>
              </div>

              <div class="detail-item">
                <span class="label">Giới tính</span>
                <span class="value">{{ selected.gender }}</span>
              </div>

              <div class="detail-item">
                <span class="label">Điểm</span>
                <span class="value">{{ selected.loyaltyPoints }}</span>
              </div>

              <div class="detail-item">
                <span class="label">Ngày tạo</span>
                <span class="value">{{ formatDate(selected.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- COMBOBOX STATUS -->
          <div class="detail-section">
            <h3>Trạng thái</h3>

            <select v-model="selected.isActive" class="filter-select">
              <option :value="true">Mở</option>
              <option :value="false">Tắt</option>
            </select>

            <button class="detail-btn mt-2" @click="updateStatus">
              Cập nhật
            </button>
          </div>

        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { customerApi } from '@/services/admin/customerApi'

const list = ref<any[]>([])
const loading = ref(false)

const search = ref('')
const statusFilter = ref('')

const sortBy = ref('id')
const direction = ref('asc')

const showModal = ref(false)
const selected = ref<any>(null)

const genderFilter = ref('')

const startDate = ref('')
const endDate = ref('')

let timeout: any = null

// LOAD
const fetchData = async () => {
  loading.value = true
  try {
    const res = await customerApi.searchCustomers({
      keyword: search.value || undefined,
      isActive:
        statusFilter.value === '' ? undefined : statusFilter.value,
      gender:
        genderFilter.value === '' ? undefined : genderFilter.value,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined
    })
    list.value = res.data
  } finally {
    loading.value = false
  }
}

// SEARCH GỘP
const handleSearch = () => {
  clearTimeout(timeout)
  timeout = setTimeout(fetchData, 500)
}

// SORT
const sort = async (field: string) => {
  if (sortBy.value === field) {
    direction.value = direction.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    direction.value = 'asc'
  }

  const res = await customerApi.sortCustomers(sortBy.value, direction.value)
  list.value = res.data
}

const icon = (f: string) =>
  sortBy.value === f ? (direction.value === 'asc' ? '↑' : '↓') : ''

// MODAL
const openDetail = (c: any) => {
  selected.value = { ...c }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

// UPDATE STATUS
const updateStatus = async () => {
  await customerApi.updateStatus(selected.value.id, selected.value.isActive)
  fetchData()
  closeModal()
}

// FORMAT DATE
const formatDate = (d: any) => {
  if (!d || typeof d !== 'string') return '---'

  const arr = d.split(' ')
  if (arr.length === 0 || !arr[0]) return '---'

  const datePart = arr[0]
  const parts = datePart.split('-')

  if (parts.length !== 3) return '---'

  const [day, month, year] = parts

  return `${day}/${month}/${year}`
}

onMounted(fetchData)
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
  padding-right: 40px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  background: white;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='%23667eea' d='M8 11L3 6h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.filter-select:hover {
  border-color: #667eea;
  background-color: #f8f9ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.15);
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
  background-color: white;
}

.filter-select option {
  padding: 12px;
  font-weight: 600;
  color: #2d3748;
  background: white;
}

.filter-select option:checked {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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

.loading-items {
  text-align: center;
  padding: 20px;
  color: #718096;
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
  padding: 10px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
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
  padding: 10px;
  font-size: 13px;
  color: #4a5568;
}

.item-name {
  font-weight: 600;
  color: #2d3748;
}

.item-quantity {
  text-align: center;
  font-weight: 600;
  color: #667eea;
}

.item-price {
  font-weight: 500;
  color: #718096;
  text-align: right;
}

.item-total {
  font-weight: 600;
  color: #2d3748;
  text-align: right;
}
</style>
