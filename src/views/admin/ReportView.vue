<template>
  <div class="report-view">
    <AdminPageHeader title="Báo cáo">
      <template #actions>
        <div class="date-range-controls">
          <div class="period-select-wrapper">
            <select v-model="selectedPeriod" @change="handlePeriodChange" class="period-select">
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày</option>
              <option value="30days">30 ngày</option>
              <option value="90days">90 ngày</option>
            </select>
          </div>

          <div class="date-range-picker" ref="dateRangePicker">
            <button @click="toggleDatePicker" class="date-range-btn">
              <span>{{ formatDateRange }}</span>
            </button>
            <div v-if="showDatePicker" class="date-picker-dropdown">
              <div class="date-picker-row">
                <div class="date-picker-col">
                  <label>Từ ngày</label>
                  <input type="date" v-model="dateRange.start" class="date-input" />
                </div>
                <div class="date-picker-col">
                  <label>Đến ngày</label>
                  <input type="date" v-model="dateRange.end" class="date-input" />
                </div>
              </div>
              <button @click="applyDateRange" class="apply-btn">Áp dụng</button>
            </div>
          </div>
        </div>
      </template>
    </AdminPageHeader>

    <div class="report-tabs-container">
      <div class="report-tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'revenue' }]"
          @click="activeTab = 'revenue'"
        >
          Báo cáo Doanh Thu
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'products' }]"
          @click="activeTab = 'products'"
        >
          Báo cáo Món Ăn
        </button>
      </div>
      
      <div v-if="activeTab === 'revenue'" class="export-buttons-group">
        <button @click="handleDownloadRevenueExcel" :disabled="downloading" class="export-btn excel-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Xuất Excel
        </button>
        <button @click="handleDownloadRevenuePdf" :disabled="downloading" class="export-btn pdf-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Xuất PDF
        </button>
      </div>
      
      <div v-if="activeTab === 'products'" class="export-buttons-group">
        <button @click="handleDownloadProductExcel" :disabled="downloading" class="export-btn excel-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Xuất Excel
        </button>
        <button @click="handleDownloadProductPdf" :disabled="downloading" class="export-btn pdf-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Xuất PDF
        </button>
      </div>
    </div>

    <!-- Revenue Report Tab -->
    <div v-if="activeTab === 'revenue'" class="tab-content">
      <div v-if="loading" class="loading-skeleton">
        <div class="skeleton-cards">
          <div class="skeleton-card" v-for="i in 3" :key="i">
            <div class="skeleton-icon"></div>
            <div class="skeleton-content">
              <div class="skeleton-label"></div>
              <div class="skeleton-value"></div>
            </div>
          </div>
        </div>
        <div class="skeleton-section">
          <div class="skeleton-header"></div>
          <div class="skeleton-chart"></div>
        </div>
      </div>
      <div v-else-if="revenueReport" class="revenue-report">
        <!-- Summary Cards -->
        <div class="summary-section">
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-content">
                <div class="card-label">Tổng doanh thu</div>
                <div class="card-value">{{ formatMoney(revenueReport.totalRevenue) }}</div>
                <div v-if="revenueReport.revenueGrowthPercentage !== null" 
                     :class="['card-comparison', revenueReport.revenueGrowthPercentage >= 0 ? 'positive' : 'negative']">
                  <span class="comparison-icon">{{ revenueReport.revenueGrowthPercentage >= 0 ? '↑' : '↓' }}</span>
                  <span class="comparison-text">{{ Math.abs(revenueReport.revenueGrowthPercentage).toFixed(1) }}% so với kỳ trước</span>
                </div>
              </div>
            </div>
            
            <div class="summary-card">
              <div class="card-content">
                <div class="card-label">Tổng hóa đơn</div>
                <div class="card-value">{{ revenueReport.totalInvoices }}</div>
                <div v-if="revenueReport.invoiceGrowthPercentage !== null" 
                     :class="['card-comparison', revenueReport.invoiceGrowthPercentage >= 0 ? 'positive' : 'negative']">
                  <span class="comparison-icon">{{ revenueReport.invoiceGrowthPercentage >= 0 ? '↑' : '↓' }}</span>
                  <span class="comparison-text">{{ Math.abs(revenueReport.invoiceGrowthPercentage).toFixed(1) }}% so với kỳ trước</span>
                </div>
              </div>
            </div>
            
            <div class="summary-card">
              <div class="card-content">
                <div class="card-label">Giá trị TB/đơn</div>
                <div class="card-value">{{ formatMoney(revenueReport.averageOrderValue) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Methods and Invoice Channels Grid -->
        <div class="dual-section-grid">
          <!-- Payment Methods -->
          <div class="report-section">
            <div class="section-header">
              <h3>Phương thức thanh toán</h3>
            </div>
            <div class="breakdown-container">
              <div class="breakdown-list">
                <div v-for="method in revenueReport.paymentMethods" :key="method.method" class="breakdown-item">
                  <div class="item-info">
                    <span class="item-name">{{ getPaymentMethodName(method.method) }}</span>
                    <span class="item-stats">{{ method.count }} đơn</span>
                  </div>
                  <div class="item-amount">{{ formatMoney(method.amount) }}</div>
                  <div class="item-bar">
                    <div class="bar-fill" :style="{ width: method.percentage + '%' }"></div>
                  </div>
                  <div class="item-percentage">{{ method.percentage.toFixed(1) }}%</div>
                </div>
              </div>
              <div class="breakdown-chart">
                <canvas ref="paymentPieCanvas"></canvas>
              </div>
            </div>
          </div>

          <!-- Invoice Channels -->
          <div class="report-section">
            <div class="section-header">
              <h3>Loại hóa đơn</h3>
            </div>
            <div class="breakdown-container">
              <div class="breakdown-list">
                <div v-for="channel in (revenueReport.invoiceChannels || [])" :key="channel.channel" class="breakdown-item">
                  <div class="item-info">
                    <span class="item-name">{{ getInvoiceChannelName(channel.channel) }}</span>
                    <span class="item-stats">{{ channel.count }} đơn</span>
                  </div>
                  <div class="item-amount">{{ formatMoney(channel.amount) }}</div>
                  <div class="item-bar">
                    <div class="bar-fill" :style="{ width: channel.percentage + '%', background: getInvoiceChannelColor(channel.channel) }"></div>
                  </div>
                  <div class="item-percentage">{{ channel.percentage.toFixed(1) }}%</div>
                </div>
              </div>
              <div class="breakdown-chart">
                <canvas ref="channelPieCanvas"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Daily Revenue Chart -->
        <div class="report-section">
          <div class="section-header">
            <h3>Doanh thu theo ngày</h3>
          </div>
          <div class="chart-container">
            <canvas ref="revenueChartCanvas"></canvas>
          </div>
        </div>

        <!-- Peak Hours Chart -->
        <div class="report-section">
          <div class="section-header">
            <h3>Giờ cao điểm</h3>
          </div>
          <div class="chart-container" style="height: 350px;">
            <canvas ref="peakHoursCanvas"></canvas>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="report-section">
          <div class="section-header">
            <h3>Doanh thu theo danh mục</h3>
          </div>
          <div class="category-grid">
            <div class="category-chart">
              <canvas ref="categoryChartCanvas"></canvas>
            </div>
            <div class="category-list">
              <div v-for="cat in revenueReport.categoryBreakdown" :key="cat.category" class="category-item">
                <div class="category-info">
                  <span class="category-name">{{ getCategoryName(cat.category) }}</span>
                  <span class="category-items">{{ cat.itemCount }} món</span>
                </div>
                <div class="category-amount">{{ formatMoney(cat.revenue) }}</div>
                <div class="category-percentage">{{ cat.percentage.toFixed(1) }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Products Report Tab -->
    <div v-if="activeTab === 'products'" class="tab-content">
      <div v-if="loading" class="loading-skeleton">
        <div class="skeleton-section">
          <div class="skeleton-header"></div>
          <div class="skeleton-list">
            <div class="skeleton-item" v-for="i in 5" :key="i"></div>
          </div>
        </div>
      </div>
      <div v-else-if="productReport" class="product-report">
        <!-- Top by Revenue -->
        <div class="report-section">
          <div class="section-header">
            <h3>Top món ăn theo doanh thu</h3>
          </div>
          <div class="products-list">
            <div v-for="(product, index) in productReport.topByRevenue" :key="'rev-' + product.productId" class="product-item">
              <div class="product-rank">#{{ index + 1 }}</div>
              <div class="product-info">
                <div class="product-name">{{ product.productName }}</div>
                <div class="product-category">{{ getCategoryName(product.category) }}</div>
              </div>
              <div class="product-stats">
                <div class="stat-value">{{ formatMoney(product.revenue) }}</div>
                <div class="stat-label">{{ product.quantitySold }} phần</div>
              </div>
              <div class="product-bar">
                <div class="bar-fill" :style="{ width: product.percentage + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top by Quantity -->
        <div class="report-section">
          <div class="section-header">
            <h3>Top món ăn theo số lượng</h3>
          </div>
          <div class="products-list">
            <div v-for="(product, index) in productReport.topByQuantity" :key="'qty-' + product.productId" class="product-item">
              <div class="product-rank">#{{ index + 1 }}</div>
              <div class="product-info">
                <div class="product-name">{{ product.productName }}</div>
                <div class="product-category">{{ getCategoryName(product.category) }}</div>
              </div>
              <div class="product-stats">
                <div class="stat-value">{{ product.quantitySold }} phần</div>
                <div class="stat-label">{{ formatMoney(product.revenue) }}</div>
              </div>
              <div class="product-bar">
                <div class="bar-fill" :style="{ width: product.percentage + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { reportService, type RevenueReport, type ProductReport } from '@/services/reportService'
import { Chart, registerables } from 'chart.js'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'

Chart.register(...registerables)

const activeTab = ref<'revenue' | 'products'>('revenue')
const loading = ref(false)
const downloading = ref(false)
const revenueReport = ref<RevenueReport | null>(null)
const productReport = ref<ProductReport | null>(null)

const selectedPeriod = ref('today')
const showDatePicker = ref(false)
const dateRangePicker = ref<HTMLElement | null>(null)
const dateRange = ref({
  start: new Date().toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
})

const revenueChartCanvas = ref<HTMLCanvasElement | null>(null)
const paymentPieCanvas = ref<HTMLCanvasElement | null>(null)
const channelPieCanvas = ref<HTMLCanvasElement | null>(null)
const peakHoursCanvas = ref<HTMLCanvasElement | null>(null)
const categoryChartCanvas = ref<HTMLCanvasElement | null>(null)
let revenueChart: Chart | null = null
let paymentPieChart: Chart | null = null
let channelPieChart: Chart | null = null
let peakHoursChart: Chart | null = null
let categoryChart: Chart | null = null

const formatDateRange = computed(() => {
  const start = dateRange.value.start
  const end = dateRange.value.end
  if (!start || !end) return '0 ngày'
  
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  
  return `${diffDays} ngày`
})

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
      sevenDaysAgo.setDate(today.getDate() - 6)
      dateRange.value.start = sevenDaysAgo.toISOString().split('T')[0]
      dateRange.value.end = endDate.toISOString().split('T')[0]
      break
    case '30days':
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 29)
      dateRange.value.start = thirtyDaysAgo.toISOString().split('T')[0]
      dateRange.value.end = endDate.toISOString().split('T')[0]
      break
    case '90days':
      const ninetyDaysAgo = new Date(today)
      ninetyDaysAgo.setDate(today.getDate() - 89)
      dateRange.value.start = ninetyDaysAgo.toISOString().split('T')[0]
      dateRange.value.end = endDate.toISOString().split('T')[0]
      break
  }
  
  showDatePicker.value = false
  loadReports()
}

const toggleDatePicker = () => {
  showDatePicker.value = !showDatePicker.value
}

const applyDateRange = () => {
  showDatePicker.value = false
  loadReports()
}

const handleClickOutside = (event: MouseEvent) => {
  if (dateRangePicker.value && !dateRangePicker.value.contains(event.target as Node)) {
    showDatePicker.value = false
  }
}

const loadReports = async () => {
  loading.value = true
  try {
    const [revenue, products] = await Promise.all([
      reportService.getRevenueReport(dateRange.value.start, dateRange.value.end),
      reportService.getProductReport(dateRange.value.start, dateRange.value.end, 10)
    ])
    revenueReport.value = revenue
    productReport.value = products
    
    // Update chart after data is loaded
    if (activeTab.value === 'revenue') {
      setTimeout(() => {
        renderRevenueChart()
        renderPaymentPieChart()
        renderChannelPieChart()
        renderPeakHoursChart()
        renderCategoryChart()
      }, 100)
    }
  } catch (error) {
    console.error('Error loading reports:', error)
  } finally {
    loading.value = false
  }
}

const renderRevenueChart = () => {
  if (!revenueChartCanvas.value || !revenueReport.value) return
  
  // Destroy existing chart
  if (revenueChart) {
    revenueChart.destroy()
  }
  
  const ctx = revenueChartCanvas.value.getContext('2d')
  if (!ctx) return
  
  const labels = revenueReport.value.dailyRevenues.map(d => {
    const date = new Date(d.date)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  })
  
  const data = revenueReport.value.dailyRevenues.map(d => d.revenue)
  
  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Doanh thu',
        data,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          callbacks: {
            label: (context) => {
              return 'Doanh thu: ' + formatMoney(context.parsed.y)
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => {
              return (value as number / 1000000).toFixed(0) + 'M'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  })
}

const renderPaymentPieChart = () => {
  if (!paymentPieCanvas.value || !revenueReport.value) return
  
  // Destroy existing chart
  if (paymentPieChart) {
    paymentPieChart.destroy()
  }
  
  const ctx = paymentPieCanvas.value.getContext('2d')
  if (!ctx) return
  
  const labels = revenueReport.value.paymentMethods.map(m => getPaymentMethodName(m.method))
  const data = revenueReport.value.paymentMethods.map(m => m.amount)
  const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe']
  
  paymentPieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: '#fff',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: { size: 13, weight: '600' },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const value = formatMoney(context.parsed)
              const percentage = revenueReport.value?.paymentMethods[context.dataIndex]?.percentage.toFixed(1) || '0'
              return `${label}: ${value} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

const renderChannelPieChart = () => {
  if (!channelPieCanvas.value || !revenueReport.value || !revenueReport.value.invoiceChannels) return
  
  // Destroy existing chart
  if (channelPieChart) {
    channelPieChart.destroy()
  }
  
  const ctx = channelPieCanvas.value.getContext('2d')
  if (!ctx) return
  
  const labels = revenueReport.value.invoiceChannels.map(c => getInvoiceChannelName(c.channel))
  const data = revenueReport.value.invoiceChannels.map(c => c.count)
  const colors = revenueReport.value.invoiceChannels.map(c => getInvoiceChannelColor(c.channel))
  
  channelPieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: '#fff',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: { size: 13, weight: '600' },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const count = context.parsed
              const percentage = revenueReport.value?.invoiceChannels[context.dataIndex]?.percentage.toFixed(1) || '0'
              return `${label}: ${count} đơn (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

const renderPeakHoursChart = () => {
  if (!peakHoursCanvas.value || !revenueReport.value) return
  
  if (peakHoursChart) {
    peakHoursChart.destroy()
  }
  
  const ctx = peakHoursCanvas.value.getContext('2d')
  if (!ctx) return
  
  const labels = revenueReport.value.hourlyRevenues.map(h => `${h.hour}:00`)
  const data = revenueReport.value.hourlyRevenues.map(h => h.revenue)
  
  peakHoursChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Doanh thu',
        data,
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: '#667eea',
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          callbacks: {
            label: (context) => {
              const hour = revenueReport.value?.hourlyRevenues[context.dataIndex]
              return [
                'Doanh thu: ' + formatMoney(context.parsed.y),
                'Số đơn: ' + (hour?.invoiceCount || 0)
              ]
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => {
              return (value as number / 1000000).toFixed(1) + 'M'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  })
}

const renderCategoryChart = () => {
  if (!categoryChartCanvas.value || !revenueReport.value) return
  
  if (categoryChart) {
    categoryChart.destroy()
  }
  
  const ctx = categoryChartCanvas.value.getContext('2d')
  if (!ctx) return
  
  const labels = revenueReport.value.categoryBreakdown.map(c => getCategoryName(c.category))
  const data = revenueReport.value.categoryBreakdown.map(c => c.revenue)
  const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140']
  
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: '#fff',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: { size: 13, weight: '600' },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const value = formatMoney(context.parsed)
              const percentage = revenueReport.value?.categoryBreakdown[context.dataIndex]?.percentage.toFixed(1) || '0'
              return `${label}: ${value} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

const formatMoney = (value: number) => {
  return value.toLocaleString('vi-VN') + 'đ'
}

const getPaymentMethodName = (method: string) => {
  const methods: Record<string, string> = {
    'CASH': 'Tiền mặt',
    'TRANSFER': 'Chuyển khoản',
    'CARD': 'Thẻ',
    'POINTS': 'Điểm tích lũy'
  }
  return methods[method] || method
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

const getInvoiceChannelName = (channel: string) => {
  const channels: Record<string, string> = {
    'ONLINE': 'Online',
    'OFFLINE': 'Tại quầy'
  }
  return channels[channel] || channel
}

const getInvoiceChannelColor = (channel: string) => {
  const colors: Record<string, string> = {
    'OFFLINE': '#667eea',
    'ONLINE': '#764ba2'
  }
  return colors[channel] || '#667eea'
}

const handleDownloadRevenueExcel = async () => {
  if (downloading.value) return
  downloading.value = true
  try {
    await reportService.downloadRevenueExcel(dateRange.value.start, dateRange.value.end)
  } catch (error) {
    console.error('Error downloading revenue Excel:', error)
    alert('Lỗi khi tải file Excel')
  } finally {
    downloading.value = false
  }
}

const handleDownloadRevenuePdf = async () => {
  if (downloading.value) return
  downloading.value = true
  try {
    await reportService.downloadRevenuePdf(dateRange.value.start, dateRange.value.end)
  } catch (error) {
    console.error('Error downloading revenue PDF:', error)
    alert('Lỗi khi tải file PDF')
  } finally {
    downloading.value = false
  }
}

const handleDownloadProductExcel = async () => {
  if (downloading.value) return
  downloading.value = true
  try {
    await reportService.downloadProductExcel(dateRange.value.start, dateRange.value.end, 10)
  } catch (error) {
    console.error('Error downloading product Excel:', error)
    alert('Lỗi khi tải file Excel')
  } finally {
    downloading.value = false
  }
}

const handleDownloadProductPdf = async () => {
  if (downloading.value) return
  downloading.value = true
  try {
    await reportService.downloadProductPdf(dateRange.value.start, dateRange.value.end, 10)
  } catch (error) {
    console.error('Error downloading product PDF:', error)
    alert('Lỗi khi tải file PDF')
  } finally {
    downloading.value = false
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'revenue' && revenueReport.value) {
    setTimeout(() => {
      renderRevenueChart()
      renderPaymentPieChart()
      renderChannelPieChart()
      renderPeakHoursChart()
      renderCategoryChart()
    }, 100)
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadReports()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (revenueChart) {
    revenueChart.destroy()
  }
  if (paymentPieChart) {
    paymentPieChart.destroy()
  }
  if (channelPieChart) {
    channelPieChart.destroy()
  }
  if (peakHoursChart) {
    peakHoursChart.destroy()
  }
  if (categoryChart) {
    categoryChart.destroy()
  }
})
</script>

<style scoped>
.report-view {
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

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
}

.date-range-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.period-select {
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: white;
  color: #475569;
  transition: all 0.3s;
}

.period-select:hover {
  border-color: #667eea;
}

.date-range-picker {
  position: relative;
}

.date-range-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
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
  width: 100%;
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

.report-tabs-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.report-tabs {
  display: flex;
  gap: 12px;
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  background: none;
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: #667eea;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-content {
  animation: fadeIn 0.4s ease-out;
}

.loading {
  text-align: center;
  padding: 60px;
  font-size: 18px;
  color: #64748b;
}

.loading-skeleton {
  animation: fadeIn 0.4s ease-out;
}

.skeleton-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.skeleton-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-label {
  width: 60%;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-value {
  width: 80%;
  height: 28px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.skeleton-header {
  width: 200px;
  height: 24px;
  border-radius: 4px;
  margin-bottom: 20px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-chart {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-item {
  width: 100%;
  height: 80px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.summary-section {
  margin-bottom: 32px;
}

.export-buttons-group {
  display: flex;
  gap: 12px;
  margin-bottom: -2px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.summary-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 48px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.card-comparison {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  margin-top: 6px;
}

.card-comparison.positive {
  color: #10b981;
}

.card-comparison.negative {
  color: #ef4444;
}

.comparison-icon {
  font-size: 16px;
  font-weight: 700;
}

.comparison-text {
  font-size: 12px;
}

.report-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.section-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.export-buttons {
  display: flex;
  gap: 8px;
}

.export-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.excel-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.excel-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.pdf-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.pdf-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.payment-methods-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  align-items: start;
}

.payment-methods-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-pie-chart {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-method-item {
  display: grid;
  grid-template-columns: 2fr 1fr 3fr auto;
  gap: 16px;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.method-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.method-name {
  font-weight: 600;
  color: #1e293b;
}

.method-stats {
  font-size: 13px;
  color: #64748b;
}

.method-amount {
  font-weight: 700;
  color: #667eea;
  text-align: right;
}

.method-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.6s ease;
}

.method-percentage {
  font-weight: 600;
  color: #64748b;
  min-width: 50px;
  text-align: right;
}

.chart-container {
  height: 400px;
  position: relative;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-item {
  display: grid;
  grid-template-columns: auto 2fr 1fr 3fr;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.3s;
}

.product-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.product-rank {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  min-width: 50px;
  text-align: center;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
}

.product-category {
  font-size: 13px;
  color: #64748b;
}

.product-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
}

.stat-value {
  font-weight: 700;
  color: #1e293b;
  font-size: 15px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

.product-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.category-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 32px;
  align-items: start;
}

.category-chart {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.3s;
}

.category-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
}

.category-items {
  font-size: 13px;
  color: #64748b;
}

.category-amount {
  font-weight: 700;
  color: #667eea;
  text-align: right;
  font-size: 15px;
}

.category-percentage {
  font-weight: 600;
  color: #64748b;
  min-width: 60px;
  text-align: right;
  font-size: 14px;
}

/* Dual Section Grid */
.dual-section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.breakdown-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  align-items: start;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-item {
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.3s;
}

.breakdown-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
}

.item-stats {
  font-size: 13px;
  color: #64748b;
}

.item-amount {
  font-weight: 700;
  color: #667eea;
  text-align: right;
  font-size: 15px;
}

.item-bar {
  position: relative;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  grid-column: 1 / -1;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.6s ease;
}

.item-percentage {
  font-weight: 600;
  color: #64748b;
  min-width: 60px;
  text-align: right;
  font-size: 14px;
}

.breakdown-chart {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 250px;
}

.export-buttons-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
}

@media (max-width: 1200px) {
  .dual-section-grid {
    grid-template-columns: 1fr;
  }
  
  .breakdown-container {
    grid-template-columns: 1fr;
  }
  
  .breakdown-chart {
    max-width: 400px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .report-tabs-container {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .export-buttons-group {
    justify-content: center;
    margin-bottom: 0;
  }
  
  .export-btn {
    flex: 1;
  }
}
</style>
