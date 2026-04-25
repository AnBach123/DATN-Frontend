<template>
  <div class="audit-log-view">
    <AdminPageHeader title="Nhật ký hoạt động" />

    <!-- Search bar — tự tìm khi gõ (debounce 300ms) -->
    <div class="search-bar">
      <span class="search-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </span>
      <input
        v-model="keywordInput"
        type="text"
        class="search-input"
        placeholder="Gõ tên khách, SĐT, tên món, username nhân viên, mã hóa đơn..."
        @input="onKeywordInput"
      />
      <button v-if="keywordInput" class="search-clear-icon" @click="clearKeyword" aria-label="Xóa">
        ×
      </button>
    </div>

    <!-- Filter Panel -->
    <div class="filter-panel">
      <div class="filter-row">
        <div class="filter-group">
          <label>Từ ngày</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="filter-input"
            @change="onDateChange"
          />
        </div>
        <div class="filter-group">
          <label>Đến ngày</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="filter-input"
            @change="onDateChange"
          />
        </div>
        <div class="filter-group">
          <label>Loại hành động</label>
          <select v-model="categoryFilter" class="filter-input" @change="onCategoryChange">
            <option value="">Tất cả</option>
            <option value="CREATE">Tạo</option>
            <option value="UPDATE">Sửa</option>
            <option value="DELETE">Xóa</option>
            <option value="CANCEL">Hủy</option>
            <option value="LOGIN">Đăng nhập</option>
            <option value="LOGIN_FAILED">Đăng nhập thất bại</option>
            <option value="PAYMENT">Thanh toán</option>
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
        <div class="filter-group filter-actions">
          <button class="clear-filter-btn" @click="clearFilters" :disabled="!hasActiveFilter">
            Xóa lọc
          </button>
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
      <div class="modal-content detail-modal" @click.stop>
        <div class="modal-header">
          <h2>Chi tiết nhật ký</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <!-- Summary strip -->
          <div class="log-summary">
            <div class="summary-left">
              <div class="summary-action-label">{{ getActionLabel(selectedLog.actionType) }}</div>
              <div class="summary-who">
                <strong>{{ selectedLog.userFullName || selectedLog.userEmail }}</strong>
                <span :class="['role-chip', `role-${(selectedLog.userRole || '').toLowerCase()}`]">
                  {{ translateRole(selectedLog.userRole) }}
                </span>
              </div>
            </div>
            <div class="summary-right">
              <div class="summary-time-exact">{{ formatDateTime(selectedLog.createdAt) }}</div>
              <div class="summary-time-rel">{{ relativeTime(selectedLog.createdAt) }}</div>
            </div>
          </div>

          <!-- Description block -->
          <div v-if="selectedLog.actionDescription" class="desc-block">
            <div class="block-label">Chi tiết thao tác</div>
            <div class="desc-text">{{ selectedLog.actionDescription }}</div>
          </div>

          <!-- Diff block — hiển thị thay đổi trước/sau cho thao tác UPDATE -->
          <div v-if="selectedLog.changes && selectedLog.changes.length" class="diff-block">
            <div class="block-label">Thay đổi so với trước khi cập nhật</div>
            <table class="diff-table">
              <thead>
                <tr>
                  <th>Trường thông tin</th>
                  <th>Giá trị cũ</th>
                  <th></th>
                  <th>Giá trị mới</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ch in selectedLog.changes" :key="ch.field">
                  <td class="diff-field">{{ ch.fieldLabel || ch.field }}</td>
                  <td class="diff-old">{{ ch.oldValue || '(trống)' }}</td>
                  <td class="diff-arrow">→</td>
                  <td class="diff-new">{{ ch.newValue || '(trống)' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Result banner — thành công / thất bại (nổi bật để admin đánh giá sức khỏe) -->
          <div class="result-block" :class="isSuccess(selectedLog.responseStatus) ? 'result-success' : 'result-failure'">
            <div class="result-icon">{{ isSuccess(selectedLog.responseStatus) ? '✓' : '✕' }}</div>
            <div class="result-text">
              <div class="result-title">
                {{ isSuccess(selectedLog.responseStatus) ? 'Thao tác thành công' : 'Thao tác thất bại' }}
              </div>
              <div v-if="selectedLog.responseMessage && selectedLog.responseMessage !== 'Thành công'" class="result-message">
                {{ selectedLog.responseMessage }}
              </div>
            </div>
            <div class="result-metrics">
              <div class="metric">
                <div class="metric-label">Mã phản hồi</div>
                <div class="metric-value mono">{{ selectedLog.responseStatus || '-' }}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Thời gian xử lý</div>
                <div :class="['metric-value', 'mono', execTimeClass(selectedLog.executionTimeMs)]">
                  {{ selectedLog.executionTimeMs != null ? selectedLog.executionTimeMs + ' ms' : '-' }}
                </div>
                <div v-if="selectedLog.executionTimeMs != null" class="metric-hint">
                  {{ execTimeHint(selectedLog.executionTimeMs) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Người thực hiện — full width -->
          <section class="info-section info-section-full">
            <h3>Người thực hiện</h3>
            <div class="info-row">
              <span class="k">Họ tên</span>
              <span class="v">{{ selectedLog.userFullName || '(chưa cập nhật)' }}</span>
            </div>
            <div class="info-row">
              <span class="k">{{ selectedLog.userRole === 'USER' ? 'Email' : 'Tài khoản đăng nhập' }}</span>
              <span class="v">{{ selectedLog.userEmail || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="k">Vai trò</span>
              <span class="v">
                <span :class="['role-chip', `role-${(selectedLog.userRole || '').toLowerCase()}`]">
                  {{ translateRole(selectedLog.userRole) }}
                </span>
              </span>
            </div>
            <div class="info-row">
              <span class="k">{{ selectedLog.userRole === 'USER' ? 'Mã khách hàng' : 'Mã nhân viên' }}</span>
              <span class="v mono">{{ selectedLog.userId ?? '-' }}</span>
            </div>
            <div class="info-row">
              <span class="k">Mô tả hành động</span>
              <span class="v">{{ getActionDescription(selectedLog.actionType) }}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { auditLogApi, type AuditLogResponse, type AuditLogSearchRequest } from '@/services/admin/auditLogApi'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'

const loading = ref(false)
const auditLogs = ref<AuditLogResponse[]>([])
const selectedLog = ref<AuditLogResponse | null>(null)

const filters = ref<AuditLogSearchRequest>({
  startDate: '',
  endDate: '',
  actionType: '',
  actionCategory: '',
  keyword: '',
  entityType: '',
  entityId: '',
  userRole: '',
  page: 0,
  size: 15,
  sortBy: 'createdAt',
  sortDirection: 'DESC',
})

// Category filter — gộp các semantic action type theo từ khóa
const categoryFilter = ref('')
const onCategoryChange = () => {
  // LOGIN và LOGIN_FAILED là exact code, các option khác là substring
  if (categoryFilter.value === 'LOGIN' || categoryFilter.value === 'LOGIN_FAILED') {
    filters.value.actionType = categoryFilter.value
    filters.value.actionCategory = ''
  } else {
    filters.value.actionType = ''
    filters.value.actionCategory = categoryFilter.value
  }
  currentPage.value = 0
  searchLogs()
}

// Date picker — tự tìm khi user chọn ngày
const onDateChange = () => {
  currentPage.value = 0
  searchLogs()
}

// Text search — tự tìm khi gõ, debounce 300ms để tránh spam request
const keywordInput = ref('')
let keywordTimer: ReturnType<typeof setTimeout> | null = null

const onKeywordInput = () => {
  if (keywordTimer) clearTimeout(keywordTimer)
  keywordTimer = setTimeout(() => {
    const trimmed = keywordInput.value.trim()
    // Chỉ search khi rỗng hoặc đủ 2 ký tự (tránh search single char quá rộng)
    if (trimmed === '' || trimmed.length >= 2) {
      filters.value.keyword = trimmed
      currentPage.value = 0
      searchLogs()
    }
  }, 300)
}

const clearKeyword = () => {
  keywordInput.value = ''
  filters.value.keyword = ''
  currentPage.value = 0
  searchLogs()
}

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
    // Input type="date" cho string "yyyy-MM-dd"
    // startDate → đầu ngày 00:00:00, endDate → cuối ngày 23:59:59 để bao trọn ngày được chọn
    const toStartOfDay = (d: string) => {
      const date = new Date(d)
      date.setHours(0, 0, 0, 0)
      return date.toISOString()
    }
    const toEndOfDay = (d: string) => {
      const date = new Date(d)
      date.setHours(23, 59, 59, 999)
      return date.toISOString()
    }
    const searchRequest: AuditLogSearchRequest = {
      ...filters.value,
      startDate: filters.value.startDate ? toStartOfDay(filters.value.startDate) : undefined,
      endDate: filters.value.endDate ? toEndOfDay(filters.value.endDate) : undefined,
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

// Bất kỳ filter nào có giá trị → nút "Xóa lọc" active
const hasActiveFilter = computed(() => {
  return !!filters.value.startDate
      || !!filters.value.endDate
      || !!categoryFilter.value
      || !!filters.value.userRole
      || !!filters.value.keyword
})

const clearFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    actionType: '',
    actionCategory: '',
    keyword: '',
    userRole: '',
    page: 0,
    size: 15,
    sortBy: 'createdAt',
    sortDirection: 'DESC',
  }
  categoryFilter.value = ''
  keywordInput.value = ''
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
  if (!status) return 'Không xác định'
  if (status >= 200 && status < 300) return 'Thành công'
  if (status >= 300 && status < 400) return 'Chuyển hướng'
  if (status >= 400 && status < 500) return 'Lỗi client'
  if (status >= 500) return 'Lỗi hệ thống'
  return 'Không xác định'
}

const getSeverityLabel = (severity: string | null | undefined): string => {
  switch ((severity || '').toUpperCase()) {
    case 'CRITICAL': return 'Quan trọng'
    case 'ERROR': return 'Lỗi'
    case 'WARNING': return 'Cảnh báo'
    case 'INFO':
    default: return 'Thông tin'
  }
}

const translateRole = (role: string | null | undefined): string => {
  switch ((role || '').toUpperCase()) {
    case 'ADMIN': return 'Quản trị viên'
    case 'STAFF': return 'Nhân viên'
    case 'RECEPTION': return 'Lễ tân'
    case 'KITCHEN': return 'Bếp'
    case 'USER': return 'Khách hàng'
    case 'ANONYMOUS': return 'Ẩn danh'
    default: return role || '-'
  }
}

const relativeTime = (dateString: string): string => {
  if (!dateString) return ''
  const then = new Date(dateString).getTime()
  if (isNaN(then)) return ''
  const diffSec = Math.floor((Date.now() - then) / 1000)
  if (diffSec < 10) return 'vừa xong'
  if (diffSec < 60) return diffSec + ' giây trước'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return diffMin + ' phút trước'
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return diffHour + ' giờ trước'
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return diffDay + ' ngày trước'
  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return diffMonth + ' tháng trước'
  return Math.floor(diffMonth / 12) + ' năm trước'
}

const execTimeClass = (ms: number | null | undefined): string => {
  if (ms == null) return ''
  if (ms < 100) return 'exec-fast'
  if (ms < 500) return 'exec-normal'
  if (ms < 2000) return 'exec-slow'
  return 'exec-critical'
}

const viewDetails = (log: AuditLogResponse) => {
  selectedLog.value = log
}

const closeModal = () => {
  selectedLog.value = null
}

const isSuccess = (status: number | null | undefined): boolean => {
  if (status == null) return false
  return status >= 200 && status < 400
}

const execTimeHint = (ms: number): string => {
  if (ms < 100) return 'Rất nhanh'
  if (ms < 500) return 'Bình thường'
  if (ms < 2000) return 'Hơi chậm — theo dõi nếu lặp lại'
  return 'Chậm bất thường — cần kiểm tra hệ thống'
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
    // Chung
    CREATE: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',
    // Auth
    LOGIN: 'Đăng nhập',
    LOGOUT: 'Đăng xuất',
    LOGIN_FAILED: 'Đăng nhập thất bại',
    REGISTER_START: 'Bắt đầu đăng ký',
    REGISTER_OTP_SEND: 'Gửi OTP xác nhận',
    REGISTER_VERIFY: 'Xác nhận OTP',
    PASSWORD_CHANGE: 'Đổi mật khẩu',
    // Customer
    CUSTOMER_PROFILE_UPDATE: 'Cập nhật hồ sơ KH',
    CUSTOMER_STATUS_CHANGE: 'Đổi trạng thái KH',
    CUSTOMER_PASSWORD_CHANGE: 'KH đổi mật khẩu',
    // Employee
    EMPLOYEE_CREATE: 'Tạo nhân viên',
    EMPLOYEE_UPDATE: 'Sửa nhân viên',
    EMPLOYEE_DISABLE: 'Vô hiệu hóa nhân viên',
    // Reservation
    RESERVATION_CREATE: 'Tạo đặt bàn',
    RESERVATION_CONFIRM: 'Xác nhận đặt bàn',
    RESERVATION_CHECKIN: 'Check-in đặt bàn',
    RESERVATION_CANCEL: 'Hủy đặt bàn',
    RESERVATION_TABLE_REASSIGN: 'Chuyển bàn',
    RESERVATION_EMAIL_SEND: 'Gửi email đặt bàn',
    // Walk-in
    WALKIN_CHECKIN: 'Check-in walk-in',
    WALKIN_CANCEL: 'Hủy walk-in',
    // Payment / Invoice
    PAYMENT_CHECKOUT: 'Thanh toán hóa đơn',
    PAYMENT_CANCEL: 'Hủy thanh toán',
    PAYMENT_QR_NOTIFY: 'Thông báo QR',
    INVOICE_ITEM_ADD: 'Thêm món vào HĐ',
    INVOICE_ITEM_UPDATE: 'Sửa món trong HĐ',
    INVOICE_ITEM_REMOVE: 'Xóa món khỏi HĐ',
    INVOICE_ORDER_ADD_ITEMS: 'Gọi thêm món cho bàn',
    // Kitchen
    KITCHEN_ITEM_START: 'Bắt đầu nấu',
    KITCHEN_ITEM_DONE: 'Nấu xong',
    KITCHEN_ITEM_SERVE: 'Phục vụ món',
    KITCHEN_ITEM_CANCEL: 'Hủy món',
    KITCHEN_ITEM_ACTIVATE: 'Kích hoạt dessert',
    // Product / Combo
    PRODUCT_CREATE: 'Tạo sản phẩm',
    PRODUCT_UPDATE: 'Sửa sản phẩm',
    PRODUCT_DISABLE: 'Ngừng bán SP',
    COMBO_CREATE: 'Tạo combo',
    COMBO_UPDATE: 'Sửa combo',
    COMBO_DISABLE: 'Ngừng bán combo',
    COMBO_ITEM_ADD: 'Thêm món vào combo',
    COMBO_ITEMS_CLEAR: 'Xóa các món combo',
    // Voucher
    PRODUCT_VOUCHER_CREATE: 'Tạo voucher SP',
    PRODUCT_VOUCHER_UPDATE: 'Sửa voucher SP',
    PRODUCT_VOUCHER_DISABLE: 'Ngừng voucher SP',
    COMBO_VOUCHER_CREATE: 'Tạo voucher combo',
    COMBO_VOUCHER_UPDATE: 'Sửa voucher combo',
    COMBO_VOUCHER_DISABLE: 'Ngừng voucher combo',
    CUSTOMER_VOUCHER_CREATE: 'Tạo voucher KH',
    CUSTOMER_VOUCHER_UPDATE: 'Sửa voucher KH',
    CUSTOMER_VOUCHER_DELETE: 'Xóa voucher KH',
    // Table
    TABLE_CREATE: 'Tạo bàn',
    TABLE_UPDATE: 'Sửa bàn',
    TABLE_DELETE: 'Xóa bàn',
    // Review
    REVIEW_CREATE: 'Gửi đánh giá',
    REVIEW_APPROVE: 'Duyệt đánh giá',
    REVIEW_REJECT: 'Từ chối đánh giá',
    REVIEW_DELETE: 'Xóa đánh giá',
    // Blog
    BLOG_CREATE: 'Tạo bài viết',
    BLOG_UPDATE: 'Sửa bài viết',
    BLOG_DISABLE: 'Vô hiệu hóa bài viết',
    BLOG_RESTORE: 'Kích hoạt lại bài viết',
    BLOG_HARD_DELETE: 'Xóa vĩnh viễn bài viết',
    BLOG_AI_GENERATE: 'AI viết bài',
    // Query Builder
    QUERY_EXECUTE: 'Chạy custom query',
    QUERY_AI_GENERATE: 'AI sinh lệnh SQL',
    SAVED_QUERY_CREATE: 'Lưu query',
    SAVED_QUERY_UPDATE: 'Sửa lưu truy vấn',
    SAVED_QUERY_DELETE: 'Xóa lưu truy vấn',
    DASHBOARD_CREATE: 'Tạo dashboard',
    DASHBOARD_UPDATE: 'Sửa dashboard',
    DASHBOARD_DELETE: 'Xóa dashboard',
    DASHBOARD_LAYOUT_SAVE: 'Lưu layout dashboard',
    DASHBOARD_WIDGET_REMOVE: 'Xóa widget',
  }
  return labels[actionType] || actionType
}

// Mô tả ý nghĩa nghiệp vụ của từng action — giải thích "hành động đó là gì/làm gì"
const getActionDescription = (actionType: string): string => {
  const descriptions: Record<string, string> = {
    // Auth
    LOGIN: 'Đăng nhập thành công vào hệ thống quản lý',
    LOGIN_FAILED: 'Đăng nhập thất bại',
    LOGOUT: 'Đăng xuất hệ thống',
    REGISTER_START: 'Đăng ký tài khoản',
    REGISTER_OTP_SEND: 'Gửi mã OTP',
    REGISTER_VERIFY: 'Nhập đúng mã OTP, hoàn tất đăng ký tài khoản',
    PASSWORD_CHANGE: 'Đổi mật khẩu tài khoản',

    // Customer
    CUSTOMER_PROFILE_UPDATE: 'Cập nhật hồ sơ',
    CUSTOMER_STATUS_CHANGE: 'Kích hoạt hoặc vô hiệu hóa tài khoản khách hàng',
    CUSTOMER_PASSWORD_CHANGE: 'Đổi mật khẩu',

    // Employee
    EMPLOYEE_CREATE: 'Tạo mới tài khoản',
    EMPLOYEE_UPDATE: 'Chỉnh sửa thông tin',
    EMPLOYEE_DISABLE: 'Vô hiệu hóa tài khoản nhân viên',

    // Reservation / Walk-in
    RESERVATION_CREATE: 'Tạo mớiđơn đặt bàn cho khách',
    RESERVATION_CONFIRM: 'Xác nhận đơn đặt bàn',
    RESERVATION_CHECKIN: 'Check-in khách đến quán',
    RESERVATION_CANCEL: 'Hủy đơn đặt bàn',
    RESERVATION_TABLE_REASSIGN: 'Chuyển bàn',
    RESERVATION_EMAIL_SEND: 'Gửi email thông báo chi tiết đặt bàn đến khách',
    WALKIN_CHECKIN: 'Check-in khách vãng lai',
    WALKIN_CANCEL: 'Hủy phiếu khách walk-in',

    // Payment / Invoice
    PAYMENT_CHECKOUT: 'Thực hiện thanh toán hóa đơn',
    PAYMENT_CANCEL: 'Hủy hóa đơn',
    PAYMENT_QR_NOTIFY: 'Thông báo kết quả thanh toán QR từ cổng thanh toán',
    INVOICE_ITEM_ADD: 'Thêm món vào hóa đơn',
    INVOICE_ITEM_UPDATE: 'Cập nhật số lượng/ghi chú của món trong hóa đơn',
    INVOICE_ITEM_REMOVE: 'Xóa món',
    INVOICE_ORDER_ADD_ITEMS: 'Gọi món',

    // Kitchen
    KITCHEN_ITEM_START: 'Bắt đầu nấu món',
    KITCHEN_ITEM_DONE: 'Hoàn tất món',
    KITCHEN_ITEM_SERVE: 'Phục vụ món',
    KITCHEN_ITEM_CANCEL: 'Hủy món',
    KITCHEN_ITEM_ACTIVATE: 'Gửi món',

    // Product / Combo
    PRODUCT_CREATE: 'Thêm sản phẩm',
    PRODUCT_UPDATE: 'Cập nhật món',
    PRODUCT_DISABLE:'Ngừng kinh doanh sản phẩm',
    COMBO_CREATE: 'Tạo combo sản phẩm mới',
    COMBO_UPDATE: 'Cập nhật thông tin combo',
    COMBO_DISABLE: 'Ngừng bán combo',
    COMBO_ITEM_ADD: 'Thêm sản phẩm vào combo',
    COMBO_ITEMS_CLEAR: 'Xóa sản phẩm trong combo',

    // Voucher
    PRODUCT_VOUCHER_CREATE: 'Tạo voucher giảm giá áp dụng cho sản phẩm',
    PRODUCT_VOUCHER_UPDATE: 'Cập nhật thông tin voucher sản phẩm',
    PRODUCT_VOUCHER_DISABLE: 'Ngừng phát hành voucher sản phẩm',
    COMBO_VOUCHER_CREATE: 'Tạo voucher giảm giá áp dụng cho combo',
    COMBO_VOUCHER_UPDATE: 'Cập nhật thông tin voucher combo',
    COMBO_VOUCHER_DISABLE: 'Ngừng phát hành voucher combo',
    CUSTOMER_VOUCHER_CREATE: 'Phát hành voucher riêng cho khách hàng cụ thể',
    CUSTOMER_VOUCHER_UPDATE: 'Cập nhật voucher khách hàng',
    CUSTOMER_VOUCHER_DELETE: 'Thu hồi voucher khách hàng',

    // Table
    TABLE_CREATE: 'Thêm mới một bàn ăn vào hệ thống',
    TABLE_UPDATE: 'Cập nhật thông tin bàn (vị trí, sức chứa, trạng thái)',
    TABLE_DELETE: 'Xóa bàn ăn khỏi hệ thống',

    // Review
    REVIEW_CREATE: 'Khách hàng gửi đánh giá, bình luận về quán',
    REVIEW_APPROVE: 'Phê duyệt đánh giá, hiển thị công khai cho mọi người',
    REVIEW_REJECT: 'Từ chối đánh giá (ẩn khỏi hiển thị công khai)',
    REVIEW_DELETE: 'Xóa đánh giá khỏi hệ thống',

    // Blog
    BLOG_CREATE: 'Tạo mới một bài viết trên trang tin tức của quán',
    BLOG_UPDATE: 'Chỉnh sửa nội dung bài viết đã có',
    BLOG_DISABLE: 'Vô hiệu hóa bài viết — ẩn khỏi website nhưng vẫn lưu trong CSDL',
    BLOG_RESTORE: 'Kích hoạt lại bài viết từ danh sách đã vô hiệu',
    BLOG_HARD_DELETE: 'Xóa vĩnh viễn bài viết và ảnh đính kèm khỏi CSDL',
    BLOG_AI_GENERATE: 'Dùng trợ lý AI để tự động sinh nội dung bài viết',

    // Query Builder
    QUERY_EXECUTE: 'Chạy câu truy vấn SQL tùy chỉnh trên dữ liệu hệ thống',
    QUERY_AI_GENERATE: 'Dùng AI để sinh câu SQL từ câu hỏi ngôn ngữ tự nhiên',
    SAVED_QUERY_CREATE: 'Lưu câu truy vấn',
    SAVED_QUERY_UPDATE: 'Cập nhật câu truy vấn',
    SAVED_QUERY_DELETE: 'Xóa câu truy vấn',
    DASHBOARD_CREATE: 'Tạo bảng điều khiển báo cáo mới',
    DASHBOARD_UPDATE: 'Cập nhật bảng điều khiển',
    DASHBOARD_DELETE: 'Xóa bảng điều khiển',
    DASHBOARD_LAYOUT_SAVE: 'Lưu bố cục các widget trên dashboard',
    DASHBOARD_WIDGET_REMOVE: 'Xóa một widget khỏi dashboard',

    // Generic fallback
    CREATE: 'Tạo mới bản ghi trong hệ thống',
    UPDATE: 'Cập nhật bản ghi hiện có',
    DELETE: 'Xóa bản ghi khỏi hệ thống',
  }
  return descriptions[actionType] || `Thao tác ${getActionLabel(actionType)} trên hệ thống`
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
  justify-content: flex-end;
}

.clear-filter-btn {
  padding: 10px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.clear-filter-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #ef4444;
  color: #ef4444;
}
.clear-filter-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* SEARCH BAR — input đẹp có icon + clear (×) bên trong */
.search-bar {
  position: relative;
  margin-bottom: 20px;
}
.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
  display: flex;
  align-items: center;
}
.search-input {
  width: 100%;
  padding: 13px 44px 13px 46px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.search-input::placeholder { color: #94a3b8; }
.search-input:hover { border-color: #cbd5e1; }
.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12);
}
.search-clear-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 18px;
  font-weight: 400;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0 2px 0;
  transition: all 0.15s;
}
.search-clear-icon:hover { background: #cbd5e1; color: #1e293b; }

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

.action-create,
.action-blog_create {
  background: #d1fae5;
  color: #065f46;
}

.action-update,
.action-blog_update {
  background: #dbeafe;
  color: #1e40af;
}

.action-delete,
.action-blog_hard_delete {
  background: #fee2e2;
  color: #991b1b;
}

/* Blog-specific action colors */
.action-blog_disable {
  background: #fed7aa;
  color: #9a3412;
}

.action-blog_restore {
  background: #bbf7d0;
  color: #166534;
}

.action-blog_ai_generate {
  background: #e9d5ff;
  color: #6b21a8;
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

/* Detail modal — dải severity ở cạnh trái */
.detail-modal { max-width: 880px; }

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

/* ======= Detail modal redesign ======= */

/* Summary strip */
.log-summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding: 16px 18px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 20px;
}
.summary-left { display: flex; flex-direction: column; gap: 6px; }
.summary-action-label { font-size: 20px; font-weight: 700; color: #1e293b; line-height: 1.2; }
.summary-who { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: #475569; }
.summary-who strong { color: #1e293b; font-weight: 600; }
.summary-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.summary-time-exact { font-size: 13px; font-weight: 600; color: #334155; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.summary-time-rel { font-size: 11px; color: #94a3b8; font-style: italic; }

/* Severity chip */
.severity-chip { padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.severity-chip.sev-critical { background: #fee2e2; color: #991b1b; }
.severity-chip.sev-error { background: #fed7aa; color: #9a3412; }
.severity-chip.sev-warning { background: #fef3c7; color: #92400e; }
.severity-chip.sev-info { background: #dbeafe; color: #1e40af; }

/* Description block */
.desc-block { background: #fffbea; border-left: 3px solid #f59e0b; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }
.block-label { font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.desc-text { font-size: 14px; color: #1e293b; line-height: 1.6; word-break: break-word; }

/* Diff block — bảng hiển thị thay đổi trước/sau */
.diff-block {
  background: #f0f9ff;
  border-left: 3px solid #3b82f6;
  padding: 14px 18px;
  border-radius: 0 8px 8px 0;
  margin-bottom: 20px;
}
.diff-block .block-label { color: #1e40af; margin-bottom: 10px; }
.diff-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.diff-table thead th {
  text-align: left;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #dbeafe;
}
.diff-table tbody td {
  padding: 8px 8px;
  border-bottom: 1px solid #e0f2fe;
  vertical-align: top;
}
.diff-table tbody tr:last-child td { border-bottom: none; }
.diff-field { color: #1e293b; font-weight: 600; white-space: nowrap; width: 160px; }
.diff-old {
  color: #991b1b;
  background: #fef2f2;
  padding: 4px 8px !important;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  word-break: break-word;
}
.diff-new {
  color: #166534;
  background: #f0fdf4;
  padding: 4px 8px !important;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  word-break: break-word;
}
.diff-arrow { color: #94a3b8; font-weight: 700; text-align: center; width: 24px; }

/* Info section card */
.info-section { background: #fafbfc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; }
.info-section-full { width: 100%; }
.info-section h3 { font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }

.info-row { display: grid; grid-template-columns: 130px 1fr; gap: 10px; padding: 6px 0; font-size: 13px; align-items: center; }
.info-row .k { color: #64748b; font-weight: 600; font-size: 12px; }
.info-row .v { color: #1e293b; word-break: break-word; }
.info-row .v.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #475569; }
.info-row .v.tiny { font-size: 10px; color: #94a3b8; }
.info-row .v.endpoint { color: #4f46e5; }

/* Role chips — đồng bộ màu với .badge ở bảng ngoài để admin nhất quán */
.role-chip { display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 500; width: fit-content; }
.role-chip.role-admin { background: #fef3c7; color: #92400e; }
.role-chip.role-staff { background: #dbeafe; color: #1e40af; }
.role-chip.role-reception { background: #e0e7ff; color: #3730a3; }
.role-chip.role-kitchen { background: #fce7f3; color: #831843; }
.role-chip.role-user { background: #d1fae5; color: #065f46; }
.role-chip.role-anonymous { background: #f1f5f9; color: #64748b; }

/* RESULT block — hiển thị success/failure + 2 metrics (mã phản hồi + thời gian xử lý) */
.result-block { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: 10px; margin-bottom: 16px; }
.result-block.result-success { background: #f0fdf4; border: 1px solid #bbf7d0; }
.result-block.result-failure { background: #fef2f2; border: 1px solid #fecaca; }
.result-icon { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; flex-shrink: 0; }
.result-block.result-success .result-icon { background: #22c55e; color: white; }
.result-block.result-failure .result-icon { background: #ef4444; color: white; }
.result-text { flex: 1; }
.result-title { font-size: 15px; font-weight: 700; }
.result-block.result-success .result-title { color: #166534; }
.result-block.result-failure .result-title { color: #991b1b; }
.result-message { font-size: 12px; color: #64748b; margin-top: 2px; }
.result-metrics { display: flex; gap: 24px; border-left: 1px solid rgba(0,0,0,0.08); padding-left: 20px; }
.metric { display: flex; flex-direction: column; gap: 2px; }
.metric-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.metric-value { font-size: 16px; font-weight: 700; color: #1e293b; }
.metric-hint { font-size: 10px; color: #94a3b8; font-style: italic; }
.metric-value.exec-fast { color: #16a34a; }
.metric-value.exec-normal { color: #334155; }
.metric-value.exec-slow { color: #d97706; }
.metric-value.exec-critical { color: #dc2626; }

/* Responsive */
@media (max-width: 720px) {
  .sections-grid { grid-template-columns: 1fr; }
  .log-summary { flex-direction: column; align-items: flex-start; }
  .summary-right { align-items: flex-start; }
  .info-row { grid-template-columns: 1fr; gap: 2px; }
}
</style>
