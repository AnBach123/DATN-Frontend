<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1 class="page-title">TRANG CHỦ</h1>
    </div>

    <!-- Row 1: Stats Cards -->
    <div class="stats-grid">
      <StatCard
        :title="revenueLabel"
        :value="formatMoney(stats.todayRevenue.amount)"
        :percent-change="stats.todayRevenue.percentChange"
        :trend="stats.todayRevenue.trend"
        icon="💰"
        color="success"
      />
      <StatCard
        :title="invoiceLabel"
        :value="stats.todayInvoices.count.toString()"
        :percent-change="stats.todayInvoices.percentChange"
        :trend="stats.todayInvoices.trend"
        icon="📄"
        color="info"
      />
      <StatCard
        :title="customerLabel"
        :value="stats.todayCustomers.count.toString()"
        :percent-change="stats.todayCustomers.percentChange"
        :trend="stats.todayCustomers.trend"
        icon="👥"
        color="purple"
      />
      <StatCard
        title="Bàn đang phục vụ"
        :value="`${stats.activeTables.occupied}/${stats.activeTables.total}`"
        :percent-change="stats.activeTables.percentOccupied"
        trend="neutral"
        icon="🪑"
        color="warning"
      />
    </div>

    <!-- Row 2: Charts -->
    <div class="charts-row">
      <div class="chart-card revenue-chart">
        <div class="card-header">
          <h3>Doanh thu</h3>
          <div class="period-controls">
            <select 
              v-model="selectedPeriod" 
              @change="handlePeriodChange"
              class="period-select"
            >
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày</option>
              <option value="30days">30 ngày</option>
              <option value="90days">90 ngày</option>
            </select>
            <div class="date-range-picker" ref="dateRangePicker">
              <button @click="toggleDatePicker" class="date-range-btn">
                <span>📅</span>
                <span>{{ formatDateRange }}</span>
              </button>
              <div v-if="showDatePicker" class="date-picker-dropdown">
                <div class="date-picker-row">
                  <div class="date-picker-col">
                    <label>Từ ngày</label>
                    <input 
                      type="date" 
                      v-model="dateRange.start" 
                      class="date-input"
                    />
                  </div>
                  <div class="date-picker-col">
                    <label>Đến ngày</label>
                    <input 
                      type="date" 
                      v-model="dateRange.end" 
                      class="date-input"
                    />
                  </div>
                </div>
                <button @click="applyDateRange" class="apply-btn">Áp dụng</button>
              </div>
            </div>
          </div>
        </div>
        <RevenueChart v-if="chartData.labels.length > 0" :labels="chartData.labels" :data="chartData.data" />
        <div v-else class="chart-placeholder">
          <p>📈 Đang tải dữ liệu biểu đồ...</p>
        </div>
      </div>

      <div class="chart-card top-products">
        <div class="card-header">
          <h3>Top sản phẩm bán chạy hôm nay</h3>
        </div>
        <div class="products-list">
          <div v-for="(product, index) in topProducts" :key="product.id" class="product-item">
            <div class="product-info">
              <span class="product-rank">#{{ index + 1 }}</span>
              <div class="product-details">
                <span class="product-name">{{ product.name }}</span>
                <span class="product-category">{{ getCategoryName(product.category) }}</span>
              </div>
              <div class="product-stats">
                <span class="product-quantity">{{ product.quantity }} phần</span>
                <span class="product-revenue">{{ formatMoney(product.revenue) }}</span>
              </div>
            </div>
            <div class="product-bar">
              <div class="bar-fill" :style="{ width: product.percentage + '%' }">
                <div class="bar-shine"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>



    <!-- Row 3: Tables -->
    <div class="tables-row">
      <div class="data-card recent-invoices">
        <div class="card-header">
          <h3>Hóa đơn gần đây</h3>
          <router-link to="/admin/invoices" class="view-all">Xem tất cả →</router-link>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã hóa đơn</th>
                <th>Bàn</th>
                <th>Thời gian</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in recentInvoices" :key="invoice.id">
                <td><strong>{{ invoice.code }}</strong></td>
                <td>{{ invoice.table }}</td>
                <td>{{ formatDateTime(invoice.time) }}</td>
                <td><strong>{{ formatMoney(invoice.finalAmount) }}</strong></td>
                <td>
                  <span v-if="invoice.status === 'PAID'" class="status-badge paid">
                    {{ getStatusText(invoice.status) }}
                  </span>
                  <span v-else-if="invoice.status === 'IN_PROGRESS'" class="status-badge serving">
                    {{ getStatusText(invoice.status) }}
                  </span>
                  <span v-else-if="invoice.status === 'RESERVED'" class="status-badge pending">
                    {{ getStatusText(invoice.status) }}
                  </span>
                  <span v-else-if="invoice.status === 'NO_SHOW'" class="status-badge no-show">
                    {{ getStatusText(invoice.status) }}
                  </span>
                  <span v-else class="status-badge cancelled">
                    {{ getStatusText(invoice.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="data-card table-status">
        <div class="card-header">
          <h3>Trạng thái bàn</h3>
          <div class="pagination-info">
            Trang {{ currentTablePage }}/{{ totalTablePages }} ({{ tables.length }} bàn)
          </div>
        </div>
        <div class="tables-grid">
          <div
            v-for="table in paginatedTables"
            :key="table.id"
            class="table-item"
            :class="table.status.toLowerCase()"
            @click="showTableDetail(table.id)"
          >
            <div class="table-name">{{ table.name }}</div>
            <div class="table-capacity">{{ table.capacity }} người</div>
          </div>
        </div>
        <div class="table-legend">
          <div class="legend-item">
            <span class="legend-dot available"></span>
            <span>Trống</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot occupied"></span>
            <span>Đang phục vụ</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot reserved"></span>
            <span>Đã đặt</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot overtime"></span>
            <span>Quá giờ</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot cleaning"></span>
            <span>Đang dọn</span>
          </div>
        </div>
        <div class="pagination-controls" v-if="totalTablePages > 1">
          <button 
            @click="prevTablePage" 
            :disabled="currentTablePage === 1"
            class="pagination-btn"
          >
            ← Trước
          </button>
          <span class="pagination-text">{{ currentTablePage }} / {{ totalTablePages }}</span>
          <button 
            @click="nextTablePage" 
            :disabled="currentTablePage === totalTablePages"
            class="pagination-btn"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>

    <!-- Table Detail Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ tableDetail?.tableName }}</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">Sức chứa:</span>
            <span class="detail-value">{{ tableDetail?.capacity }} người</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Trạng thái:</span>
            <span class="detail-value">
              <span class="status-badge" :class="tableDetail?.status.toLowerCase()">
                {{ getStatusLabel(tableDetail?.status) }}
              </span>
            </span>
          </div>

          <template v-if="tableDetail?.invoiceCode">
            <div class="divider"></div>
            <h3 class="section-title">Thông tin hóa đơn</h3>
            
            <div class="detail-row">
              <span class="detail-label">Mã hóa đơn:</span>
              <span class="detail-value"><strong>{{ tableDetail.invoiceCode }}</strong></span>
            </div>

            <div class="detail-row" v-if="tableDetail.customerName">
              <span class="detail-label">Khách hàng:</span>
              <span class="detail-value">{{ tableDetail.customerName }}</span>
            </div>

            <div class="detail-row" v-if="tableDetail.customerPhone">
              <span class="detail-label">Số điện thoại:</span>
              <span class="detail-value">{{ tableDetail.customerPhone }}</span>
            </div>

            <div class="detail-row" v-if="tableDetail.guestCount">
              <span class="detail-label">Số khách:</span>
              <span class="detail-value">{{ tableDetail.guestCount }} người</span>
            </div>

            <div class="detail-row" v-if="tableDetail.staffName">
              <span class="detail-label">Nhân viên:</span>
              <span class="detail-value">{{ tableDetail.staffName }}</span>
            </div>

            <div class="detail-row" v-if="tableDetail.checkedInAt">
              <span class="detail-label">Giờ vào:</span>
              <span class="detail-value">{{ formatDateTime(tableDetail.checkedInAt) }}</span>
            </div>

            <div class="detail-row" v-if="tableDetail.reservedAt">
              <span class="detail-label">Giờ đặt:</span>
              <span class="detail-value">{{ formatDateTime(tableDetail.reservedAt) }}</span>
            </div>

            <div class="detail-row" v-if="tableDetail.minutesSinceCheckIn !== null">
              <span class="detail-label">Thời gian phục vụ:</span>
              <span class="detail-value" :class="{ 'text-warning': tableDetail.minutesSinceCheckIn > 90 }">
                {{ tableDetail.minutesSinceCheckIn }} phút
                <span v-if="tableDetail.minutesSinceCheckIn > 90" class="overtime-badge">Quá giờ</span>
              </span>
            </div>

            <div class="detail-row" v-if="tableDetail.subtotal">
              <span class="detail-label">Tạm tính:</span>
              <span class="detail-value">{{ formatMoney(tableDetail.subtotal) }}</span>
            </div>

            <div class="detail-row" v-if="tableDetail.finalAmount">
              <span class="detail-label">Tổng tiền:</span>
              <span class="detail-value"><strong class="text-primary">{{ formatMoney(tableDetail.finalAmount) }}</strong></span>
            </div>
          </template>

          <template v-else>
            <div class="empty-state">
              <p>Bàn đang trống</p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import StatCard from '@/components/admin/StatCard.vue'
import RevenueChart from '@/components/admin/RevenueChart.vue'
import { dashboardService, type DashboardStats, type TopProduct, type RecentInvoice, type TableStatus, type TableDetail } from '@/services/dashboardService'
import { DashboardWebSocket } from '@/services/websocket/DashboardWebSocket'

const selectedPeriod = ref('today')
const showDatePicker = ref(false)
const dateRangePicker = ref<HTMLElement | null>(null)
const loading = ref(false)
const dateRange = ref({
  start: new Date().toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
})

// WebSocket instance
let dashboardWs: DashboardWebSocket | null = null

// Load saved state from localStorage
const loadSavedState = () => {
  const savedPeriod = localStorage.getItem('dashboard_period')
  const savedStartDate = localStorage.getItem('dashboard_start_date')
  const savedEndDate = localStorage.getItem('dashboard_end_date')
  
  if (savedStartDate && savedEndDate) {
    dateRange.value.start = savedStartDate
    dateRange.value.end = savedEndDate
  } else {
    // Initialize with today's date if no saved state
    const today = new Date().toISOString().split('T')[0]
    dateRange.value.start = today
    dateRange.value.end = today
  }
  
  if (savedPeriod) {
    selectedPeriod.value = savedPeriod
  } else {
    selectedPeriod.value = 'today'
  }
  
  // Verify that selectedPeriod matches dateRange, if not recalculate
  const today = new Date().toISOString().split('T')[0]
  const start = dateRange.value.start
  const end = dateRange.value.end
  
  if (selectedPeriod.value === 'today' && (start !== today || end !== today)) {
    // Period says "today" but dates don't match - recalculate period
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
    
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89)
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0]
    
    if (start === sevenDaysAgoStr && end === today) {
      selectedPeriod.value = '7days'
    } else if (start === thirtyDaysAgoStr && end === today) {
      selectedPeriod.value = '30days'
    } else if (start === ninetyDaysAgoStr && end === today) {
      selectedPeriod.value = '90days'
    }
    // If still doesn't match, keep selectedPeriod but dates will show custom label
  }
}

// Save state to localStorage
const saveState = () => {
  localStorage.setItem('dashboard_period', selectedPeriod.value)
  localStorage.setItem('dashboard_start_date', dateRange.value.start)
  localStorage.setItem('dashboard_end_date', dateRange.value.end)
}

const stats = ref<DashboardStats>({
  todayRevenue: { amount: 0, percentChange: 0, trend: 'neutral' },
  todayInvoices: { count: 0, percentChange: 0, trend: 'neutral' },
  todayCustomers: { count: 0, percentChange: 0, trend: 'neutral' },
  activeTables: { occupied: 0, total: 0, percentOccupied: 0 }
})

const topProducts = ref<TopProduct[]>([])
const recentInvoices = ref<RecentInvoice[]>([])
const tables = ref<TableStatus[]>([])
const currentTablePage = ref(1)
const tablesPerPage = 20
const showModal = ref(false)
const tableDetail = ref<TableDetail | null>(null)
const chartData = ref<{ labels: string[], data: number[] }>({ labels: [], data: [] })

const paginatedTables = computed(() => {
  const start = (currentTablePage.value - 1) * tablesPerPage
  const end = start + tablesPerPage
  return tables.value.slice(start, end)
})

const totalTablePages = computed(() => {
  return Math.ceil(tables.value.length / tablesPerPage)
})

const revenueLabel = computed(() => {
  const start = dateRange.value.start
  const end = dateRange.value.end
  const today = new Date().toISOString().split('T')[0]
  
  if (selectedPeriod.value === 'today' && start === today && end === today) {
    return 'Doanh thu hôm nay'
  } else if (selectedPeriod.value === '7days') {
    return 'Doanh thu 7 ngày'
  } else if (selectedPeriod.value === '30days') {
    return 'Doanh thu 30 ngày'
  } else if (selectedPeriod.value === '90days') {
    return 'Doanh thu 90 ngày'
  } else {
    // Custom range - calculate total days
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end day
    return `Doanh thu ${diffDays} ngày`
  }
})

const invoiceLabel = computed(() => {
  const start = dateRange.value.start
  const end = dateRange.value.end
  const today = new Date().toISOString().split('T')[0]
  
  if (selectedPeriod.value === 'today' && start === today && end === today) {
    return 'Hóa đơn hôm nay'
  } else if (selectedPeriod.value === '7days') {
    return 'Hóa đơn 7 ngày'
  } else if (selectedPeriod.value === '30days') {
    return 'Hóa đơn 30 ngày'
  } else if (selectedPeriod.value === '90days') {
    return 'Hóa đơn 90 ngày'
  } else {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return `Hóa đơn ${diffDays} ngày`
  }
})

const customerLabel = computed(() => {
  const start = dateRange.value.start
  const end = dateRange.value.end
  const today = new Date().toISOString().split('T')[0]
  
  if (selectedPeriod.value === 'today' && start === today && end === today) {
    return 'Khách hàng hôm nay'
  } else if (selectedPeriod.value === '7days') {
    return 'Khách hàng 7 ngày'
  } else if (selectedPeriod.value === '30days') {
    return 'Khách hàng 30 ngày'
  } else if (selectedPeriod.value === '90days') {
    return 'Khách hàng 90 ngày'
  } else {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return `Khách hàng ${diffDays} ngày`
  }
})

const nextTablePage = () => {
  if (currentTablePage.value < totalTablePages.value) {
    currentTablePage.value++
  }
}

const prevTablePage = () => {
  if (currentTablePage.value > 1) {
    currentTablePage.value--
  }
}

const handlePeriodChange = () => {
  const today = new Date()
  const endDate = new Date()
  
  switch (selectedPeriod.value) {
    case 'today':
      dateRange.value.start = today.toISOString().split('T')[0]
      dateRange.value.end = today.toISOString().split('T')[0]
      break
    case '7days':
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 6) // Changed from -7 to -6 to get exactly 7 days
      dateRange.value.start = sevenDaysAgo.toISOString().split('T')[0]
      dateRange.value.end = endDate.toISOString().split('T')[0]
      break
    case '30days':
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 29) // Changed from -30 to -29 to get exactly 30 days
      dateRange.value.start = thirtyDaysAgo.toISOString().split('T')[0]
      dateRange.value.end = endDate.toISOString().split('T')[0]
      break
    case '90days':
      const ninetyDaysAgo = new Date(today)
      ninetyDaysAgo.setDate(today.getDate() - 89) // Changed from -90 to -89 to get exactly 90 days
      dateRange.value.start = ninetyDaysAgo.toISOString().split('T')[0]
      dateRange.value.end = endDate.toISOString().split('T')[0]
      break
  }
  
  showDatePicker.value = false
  saveState()
  loadDashboardData()
}

const toggleDatePicker = () => {
  showDatePicker.value = !showDatePicker.value
}

const applyDateRange = () => {
  showDatePicker.value = false
  
  // When user manually selects date range, update combobox to match if possible
  const today = new Date().toISOString().split('T')[0]
  const start = dateRange.value.start
  const end = dateRange.value.end
  
  // Check if selected range matches any preset
  if (start === today && end === today) {
    selectedPeriod.value = 'today'
  } else {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
    
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89)
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0]
    
    if (start === sevenDaysAgoStr && end === today) {
      selectedPeriod.value = '7days'
    } else if (start === thirtyDaysAgoStr && end === today) {
      selectedPeriod.value = '30days'
    } else if (start === ninetyDaysAgoStr && end === today) {
      selectedPeriod.value = '90days'
    } else {
      // Custom range - set combobox to match the closest preset or keep as is
      // Don't change selectedPeriod to avoid confusion
    }
  }
  
  saveState()
  loadDashboardData()
}

const formatDateRange = computed(() => {
  const start = dateRange.value.start
  const end = dateRange.value.end
  
  // Calculate actual days from dateRange
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  
  return `${diffDays} ngày`
})

const handleClickOutside = (event: MouseEvent) => {
  if (dateRangePicker.value && !dateRangePicker.value.contains(event.target as Node)) {
    showDatePicker.value = false
  }
}

const loadDashboardData = async () => {
  try {
    loading.value = true
    const startDate = dateRange.value.start
    const endDate = dateRange.value.end
    
    const [statsData, productsData, invoicesData, tablesData, chartDataResponse] = await Promise.all([
      dashboardService.getStats(startDate, endDate),
      dashboardService.getTopProducts(startDate, endDate, 5),
      dashboardService.getRecentInvoices(5),
      dashboardService.getTableStatus(),
      dashboardService.getRevenueChart(startDate, endDate)
    ])
    
    stats.value = statsData
    topProducts.value = productsData
    recentInvoices.value = invoicesData
    tables.value = tablesData
    chartData.value = chartDataResponse
  } catch (error: any) {
    console.error('Error loading dashboard data:', error)
    if (error.response) {
      console.error('Response error:', error.response.data)
      console.error('Status:', error.response.status)
    } else if (error.request) {
      console.error('No response from server. Is backend running?')
    } else {
      console.error('Error:', error.message)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadSavedState()
  loadDashboardData()
  
  // Initialize WebSocket connection
  const token = localStorage.getItem('accessToken')
  dashboardWs = new DashboardWebSocket()
  dashboardWs.connect(token)
  
  // Subscribe to table status updates
  dashboardWs.subscribeTableStatus((update) => {
    // Update table status in real-time
    update.tableIds.forEach(tableId => {
      const table = tables.value.find(t => t.id === tableId)
      if (table) {
        table.status = update.status
      }
    })
  })
  
  // Subscribe to invoice updates
  dashboardWs.subscribeInvoiceUpdates((update) => {
    // Reload recent invoices when there's an update
    dashboardService.getRecentInvoices(5).then(data => {
      recentInvoices.value = data
    })
    
    // Reload stats to reflect new invoice
    const startDate = dateRange.value.start
    const endDate = dateRange.value.end
    dashboardService.getStats(startDate, endDate).then(data => {
      stats.value = data
    })
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  
  // Disconnect WebSocket
  if (dashboardWs) {
    dashboardWs.disconnect()
    dashboardWs = null
  }
})

const formatMoney = (value: number) => {
  return value.toLocaleString('vi-VN') + 'đ'
}

const formatDateTime = (dateTimeString: string | null) => {
  if (!dateTimeString) return 'N/A'
  const date = new Date(dateTimeString)
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getCategoryName = (category: string) => {
  const categories: Record<string, string> = {
    'RAW_FOOD': 'Thực phẩm sống',
    'COOKED_FOOD': 'Món ăn chín',
    'HOT_POT_BROTH': 'Nước lẩu',
    'DRINK': 'Đồ uống',
    'DESSERT': 'Tráng miệng'
  }
  return categories[category] || category
}

const getStatusText = (status: string) => {
  const statuses: Record<string, string> = {
    'RESERVED': 'Đã đặt bàn',
    'IN_PROGRESS': 'Đang phục vụ',
    'PAID': 'Đã thanh toán',
    'CANCELLED': 'Đã hủy',
    'NO_SHOW': 'Không đến'
  }
  return statuses[status] || status
}

const getStatusLabel = (status: string | undefined) => {
  if (!status) return ''
  const labels: Record<string, string> = {
    'AVAILABLE': 'Trống',
    'OCCUPIED': 'Đang phục vụ',
    'RESERVED': 'Đã đặt',
    'OVERTIME': 'Quá giờ',
    'CLEANING': 'Đang dọn'
  }
  return labels[status] || status
}

const showTableDetail = async (tableId: number) => {
  try {
    tableDetail.value = await dashboardService.getTableDetail(tableId)
    showModal.value = true
  } catch (error) {
    console.error('Error loading table detail:', error)
  }
}

const closeModal = () => {
  showModal.value = false
  tableDetail.value = null
}

</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dashboard-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.5px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.chart-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.period-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.period-select {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: white;
  color: #475569;
  transition: all 0.3s;
  outline: none;
}

.period-select:hover {
  border-color: #667eea;
}

.period-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.date-range-picker {
  position: relative;
}

.date-range-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: white;
  color: #475569;
  transition: all 0.3s;
}

.date-range-btn:hover {
  border-color: #667eea;
}

.date-picker-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 100;
  min-width: 320px;
}

.date-picker-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.date-picker-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-picker-col label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: white;
  color: #475569;
  transition: all 0.3s;
  width: 100%;
}

.date-input:hover {
  border-color: #667eea;
}

.date-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.apply-btn {
  width: 100%;
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.apply-btn:hover {
  background: #5568d3;
}

.chart-placeholder {
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  color: #94a3b8;
  font-weight: 500;
}

.chart-note {
  font-size: 13px;
  margin-top: 8px;
  color: #cbd5e1;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  margin-bottom: 8px;
}

.product-rank {
  font-weight: 800;
  color: #667eea;
  font-size: 18px;
  min-width: 32px;
}

.product-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.product-category {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.product-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.product-quantity {
  color: #64748b;
  font-weight: 600;
  font-size: 13px;
}

.product-revenue {
  color: #667eea;
  font-weight: 700;
  font-size: 14px;
}

.product-bar {
  height: 10px;
  background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.bar-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
  animation: shine 2s ease-in-out infinite;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

.tables-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.data-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.data-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.view-all {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  padding: 4px 8px;
  border-radius: 8px;
}

.view-all:hover {
  background: rgba(102, 126, 234, 0.08);
  transform: translateX(4px);
}

.table-responsive {
  overflow-x: auto;
  border-radius: 12px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 14px 16px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #f1f5f9;
  background: linear-gradient(180deg, #fafbfc 0%, #f8fafc 100%);
}

.data-table td {
  padding: 16px;
  font-size: 14px;
  color: #475569;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 500;
}

.data-table tr {
  transition: all 0.3s;
}

.data-table tbody tr:hover {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
}

.status-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-badge.paid {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.pending {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.serving {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.no-show {
  background: #f3f4f6;
  color: #6b7280;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #94a3b8;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.3s;
}

.action-btn:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.08);
  transform: scale(1.1);
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.table-item {
  padding: 18px;
  border-radius: 16px;
  text-align: center;
  border: 2px solid;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.table-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.5) 100%);
  opacity: 0;
  transition: opacity 0.4s;
}

.table-item:hover {
  transform: translateY(-4px) scale(1.02);
}

.table-item:hover::before {
  opacity: 1;
}

.table-item.available {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #10b981;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);
}

.table-item.occupied {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #ef4444;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
}

.table-item.reserved {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
}

.table-item.overtime {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  border-color: #f97316;
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.3);
}

.table-item.cleaning {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-color: #6366f1;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
}

.table-item.inactive,
.table-item.maintenance {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #94a3b8;
  box-shadow: 0 4px 16px rgba(148, 163, 184, 0.2);
  opacity: 0.7;
}

.table-name {
  font-weight: 700;
  font-size: 15px;
  color: #1e293b;
  margin-bottom: 6px;
  position: relative;
  z-index: 1;
}

.table-capacity {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.table-legend {
  display: flex;
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.legend-dot.available {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.legend-dot.occupied {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.legend-dot.reserved {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.legend-dot.overtime {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.legend-dot.cleaning {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.pagination-info {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: white;
  color: #475569;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-text {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

@media (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  
  .tables-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    margin-bottom: 24px;
  }
  
  .page-title {
    font-size: 24px;
  }
}

/* Modal Styles */
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
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
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
  padding: 24px 28px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: white;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: 28px;
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
}

.detail-value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  text-align: right;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
  margin: 20px 0;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
}

.status-badge.available {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.occupied {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.reserved {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.overtime {
  background: #fed7aa;
  color: #9a3412;
}

.status-badge.cleaning {
  background: #e0e7ff;
  color: #3730a3;
}

.text-warning {
  color: #f97316 !important;
  font-weight: 700 !important;
}

.text-primary {
  color: #667eea;
  font-size: 16px;
}

.overtime-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  background: #fed7aa;
  color: #9a3412;
  font-size: 11px;
  font-weight: 700;
  margin-left: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}
</style>
