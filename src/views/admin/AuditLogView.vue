<template>
  <div class="audit-log-view">
    <div class="page-header">
      <h1>Nhật ký hoạt động</h1>
      <p class="subtitle">Theo dõi tất cả hoạt động trong hệ thống</p>
    </div>

    <!-- Filter Panel -->
    <div class="filter-panel">
      <div class="filter-row">
        <div class="filter-group">
          <label>Từ ngày</label>
          <input
            v-model="filters.startDate"
            type="datetime-local"
            class="filter-input"
          />
        </div>
        <div class="filter-group">
          <label>Đến ngày</label>
          <input
            v-model="filters.endDate"
            type="datetime-local"
            class="filter-input"
          />
        </div>
        <div class="filter-group">
          <label>Loại hành động</label>
          <select v-model="filters.actionType" class="filter-input" @change="searchLogs">
            <option value="">Tất cả</option>
            <option value="CREATE">Tạo mới</option>
            <option value="UPDATE">Cập nhật</option>
            <option value="DELETE">Xóa</option>
            <option value="LOGIN">Đăng nhập</option>
            <option value="LOGIN_FAILED">Đăng nhập thất bại</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Vai trò</label>
          <select v-model="filters.userRole" class="filter-input" @change="searchLogs">
            <option value="">Tất cả</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Nhân viên</option>
            <option value="RECEPTION">Lễ tân</option>
            <option value="KITCHEN">Bếp</option>
            <option value="USER">Khách hàng</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <!-- Audit Log Table -->
    <div v-else class="table-container">
      <table class="audit-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Người dùng</th>
            <th>Hành động</th>
            <th>Mô tả</th>
            <th>Trạng thái</th>
            <th>Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="auditLogs.length === 0">
            <td colspan="6" class="no-data">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="log in auditLogs"
            :key="log.id"
            :class="getRowClass(log.actionType)"
          >
            <td>{{ formatDateTime(log.createdAt) }}</td>
            <td>
              <div class="user-info">
                <div class="user-name">{{ log.userFullName || log.userEmail }}</div>
                <div v-if="log.userRole === 'USER'" class="user-email">{{ log.userEmail }}</div>
                <div class="user-meta">
                  <span class="badge" :class="`badge-${log.userRole?.toLowerCase()}`">
                    {{ log.userRole }}
                  </span>
                  <span class="user-id">ID: {{ log.userId || '-' }}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="action-badge" :class="`action-${log.actionType?.toLowerCase()}`">
                {{ getActionLabel(log.actionType) }}
              </span>
            </td>
            <td>
              <div class="description">{{ log.actionDescription || '-' }}</div>
            </td>
            <td>
              <span
                class="status-badge"
                :class="getStatusClass(log.responseStatus)"
              >
                {{ getStatusText(log.responseStatus) }}
              </span>
            </td>
            <td>
              <button @click="viewDetails(log)" class="btn-view">
                Chi tiết
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
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

    <!-- Detail Modal -->
    <div v-if="selectedLog" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Chi tiết nhật ký</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h3>Thông tin cơ bản</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Người dùng:</span>
                <span class="value">{{ selectedLog.userFullName || selectedLog.userEmail }}</span>
              </div>
              <div v-if="selectedLog.userRole === 'USER'" class="detail-item">
                <span class="label">Email:</span>
                <span class="value">{{ selectedLog.userEmail }}</span>
              </div>
              <div class="detail-item">
                <span class="label">User ID:</span>
                <span class="value">{{ selectedLog.userId || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Vai trò:</span>
                <span class="value">{{ selectedLog.userRole }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Hành động:</span>
                <span class="value">{{ getActionLabel(selectedLog.actionType) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Thời gian:</span>
                <span class="value">{{ formatDateTime(selectedLog.createdAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Trạng thái:</span>
                <span class="value">{{ getStatusText(selectedLog.responseStatus) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { auditLogApi, type AuditLogResponse, type AuditLogSearchRequest } from '@/services/admin/auditLogApi'

const loading = ref(false)
const auditLogs = ref<AuditLogResponse[]>([])
const selectedLog = ref<AuditLogResponse | null>(null)

const filters = ref<AuditLogSearchRequest>({
  startDate: '',
  endDate: '',
  actionType: '',
  userRole: '',
  page: 0,
  size: 15,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
})

const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  
  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    const current = currentPage.value + 1
    let start = Math.max(1, current - 2)
    let end = Math.min(totalPages.value, current + 2)
    
    if (current <= 3) {
      end = maxVisible
    } else if (current >= totalPages.value - 2) {
      start = totalPages.value - maxVisible + 1
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }
  
  return pages
})

const searchLogs = async () => {
  loading.value = true
  try {
    const searchRequest: AuditLogSearchRequest = {
      ...filters.value,
      startDate: filters.value.startDate ? new Date(filters.value.startDate).toISOString() : undefined,
      endDate: filters.value.endDate ? new Date(filters.value.endDate).toISOString() : undefined,
      page: currentPage.value,
    }

    const response = await auditLogApi.search(searchRequest)
    auditLogs.value = response.data.data.content
    totalPages.value = response.data.data.totalPages
    totalElements.value = response.data.data.totalElements
    currentPage.value = response.data.data.number
  } catch (error) {
    console.error('Error searching audit logs:', error)
    alert('Lỗi khi tìm kiếm nhật ký')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    actionType: '',
    userRole: '',
    page: 0,
    size: 15,
    sortBy: 'createdAt',
    sortDirection: 'DESC',
  }
  currentPage.value = 0
  searchLogs()
}

const loadTodayLogs = async () => {
  loading.value = true
  try {
    const response = await auditLogApi.getTodayLogs(0, 15)
    auditLogs.value = response.data.data.content
    totalPages.value = response.data.data.totalPages
    totalElements.value = response.data.data.totalElements
    currentPage.value = 0
  } catch (error) {
    console.error('Error loading today logs:', error)
    alert('Lỗi khi tải nhật ký hôm nay')
  } finally {
    loading.value = false
  }
}

const loadFailedLogins = async () => {
  loading.value = true
  try {
    const response = await auditLogApi.getFailedLogins(24)
    auditLogs.value = response.data.data
    totalPages.value = 1
    totalElements.value = response.data.data.length
    currentPage.value = 0
  } catch (error) {
    console.error('Error loading failed logins:', error)
    alert('Lỗi khi tải nhật ký đăng nhập thất bại')
  } finally {
    loading.value = false
  }
}

const loadCriticalEvents = async () => {
  loading.value = true
  try {
    const response = await auditLogApi.getCriticalEvents(0, 15)
    auditLogs.value = response.data.data.content
    totalPages.value = response.data.data.totalPages
    totalElements.value = response.data.data.totalElements
    currentPage.value = 0
  } catch (error) {
    console.error('Error loading critical events:', error)
    alert('Lỗi khi tải sự kiện nghiêm trọng')
  } finally {
    loading.value = false
  }
}

const goToPage = (page: number) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
    searchLogs()
  }
}

const getStatusText = (status: number) => {
  if (status >= 200 && status < 300) return 'Thành công'
  if (status >= 400 && status < 500) return 'Lỗi'
  if (status >= 500) return 'Lỗi hệ thống'
  return 'Không xác định'
}

const viewDetails = (log: AuditLogResponse) => {
  selectedLog.value = log
}

const closeModal = () => {
  selectedLog.value = null
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const getActionLabel = (actionType: string) => {
  const labels: Record<string, string> = {
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',
    LOGIN: 'Đăng nhập',
    LOGOUT: 'Đăng xuất',
    LOGIN_FAILED: 'Đăng nhập thất bại',
  }
  return labels[actionType] || actionType
}

const getRowClass = (actionType: string) => {
  return `row-${actionType?.toLowerCase()}`
}

const getStatusClass = (status: number) => {
  if (status >= 200 && status < 300) return 'status-success'
  if (status >= 400 && status < 500) return 'status-warning'
  if (status >= 500) return 'status-error'
  return ''
}

onMounted(() => {
  searchLogs()
})

// Watch for date changes
watch(() => filters.value.startDate, () => {
  if (filters.value.startDate) {
    searchLogs()
  }
})

watch(() => filters.value.endDate, () => {
  if (filters.value.endDate) {
    searchLogs()
  }
})
</script>

<style scoped>
.audit-log-view {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.subtitle {
  color: #64748b;
  font-size: 16px;
}

.filter-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.filter-input {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.filter-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.quick-btn {
  padding: 10px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f1f5f9;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
}

.audit-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.audit-table th {
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
}

.audit-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}

.audit-table tbody tr:hover {
  background: #f8fafc;
}

.row-create {
  border-left: 3px solid #10b981;
}

.row-update {
  border-left: 3px solid #3b82f6;
}

.row-delete {
  border-left: 3px solid #ef4444;
}

.row-login {
  border-left: 3px solid #8b5cf6;
}

.row-login_failed {
  border-left: 3px solid #f59e0b;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
}

.user-email {
  font-size: 12px;
  color: #64748b;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-id {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  width: fit-content;
}

.badge-admin {
  background: #fef3c7;
  color: #92400e;
}

.badge-staff {
  background: #dbeafe;
  color: #1e40af;
}

.badge-reception {
  background: #e0e7ff;
  color: #3730a3;
}

.badge-kitchen {
  background: #fce7f3;
  color: #831843;
}

.badge-user {
  background: #d1fae5;
  color: #065f46;
}

.action-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.action-create {
  background: #d1fae5;
  color: #065f46;
}

.action-update {
  background: #dbeafe;
  color: #1e40af;
}

.action-delete {
  background: #fee2e2;
  color: #991b1b;
}

.action-login {
  background: #ede9fe;
  color: #5b21b6;
}

.action-login_failed {
  background: #fed7aa;
  color: #92400e;
}

.entity-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.entity-type {
  font-weight: 500;
  color: #1e293b;
}

.entity-id {
  font-size: 12px;
  color: #64748b;
}

.description {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-warning {
  background: #fed7aa;
  color: #92400e;
}

.status-error {
  background: #fee2e2;
  color: #991b1b;
}

.btn-view {
  padding: 6px 10px;
  background: #f1f5f9;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view:hover {
  background: #667eea;
  transform: scale(1.1);
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 16px;
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
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f1f5f9;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item .label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item .value {
  font-size: 14px;
  color: #1e293b;
  word-break: break-word;
}
</style>
