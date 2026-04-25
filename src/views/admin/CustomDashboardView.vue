<template>
  <div class="custom-dashboard-view" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- Dashboard Header -->
    <div class="dashboard-header" v-show="!isFullscreen">
      <div class="dashboard-title-section">
        <button class="btn-back" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div>
          <h1 class="page-title">{{ currentDashboard?.dashboardName || 'Dashboard' }}</h1>
          <p v-if="currentDashboard?.description" class="page-subtitle">{{ currentDashboard.description }}</p>
        </div>
      </div>
      
      <div class="dashboard-actions">
        <!-- Auto-refresh Interval Dropdown -->
        <div v-if="!editMode" class="refresh-interval-dropdown">
          <label for="refresh-interval">Tự động làm mới:</label>
          <select 
            id="refresh-interval" 
            v-model="selectedRefreshInterval" 
            @change="onRefreshIntervalChange"
            class="select-refresh-interval"
          >
            <option :value="0">Tắt</option>
            <option :value="1">1 phút</option>
            <option :value="5">5 phút</option>
            <option :value="10">10 phút</option>
            <option :value="15">15 phút</option>
            <option :value="30">30 phút</option>
            <option :value="60">60 phút</option>
          </select>
        </div>
        
        <!-- Export Buttons -->
        <button
          v-if="!editMode && gridLayout.length > 0"
          class="btn-export excel"
          @click="exportExcel"
          :disabled="isExporting"
          title="Xuất Excel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          {{ isExporting ? 'Đang xuất file...' : 'Xuất Excel' }}
        </button>
        <button
          v-if="!editMode && gridLayout.length > 0"
          class="btn-export pdf"
          @click="exportPdf"
          :disabled="isExporting"
          title="Xuất PDF"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          {{ isExporting ? 'Đang xuất file...' : 'Xuất PDF' }}
        </button>

        <!-- Manual Refresh Button -->
        <button
          v-if="!editMode && gridLayout.length > 0"
          class="btn-refresh"
          :class="{ refreshing: isRefreshing }"
          @click="manualRefresh"
          :disabled="isRefreshing"
          title="Làm mới dữ liệu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          {{ isRefreshing ? 'Đang làm mới...' : 'Làm mới' }}
        </button>
        
        <button 
          v-if="editMode"
          class="btn-add-widget" 
          :class="{ active: showQueryPanel }"
          @click="showQueryPanel = !showQueryPanel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Thêm widget
        </button>
        
        <button 
          class="btn-edit-mode" 
          :class="{ active: editMode }"
          @click="toggleEditMode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path v-if="!editMode" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path v-if="!editMode" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            <polyline v-if="editMode" points="20 6 9 17 4 12"/>
          </svg>
          {{ editMode ? 'Lưu bố cục' : 'Chỉnh sửa' }}
        </button>

        <!-- Fullscreen Button -->
        <button 
          v-if="!editMode && gridLayout.length > 0"
          class="btn-fullscreen" 
          @click="toggleFullscreen"
          :title="isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'"
        >
          <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Last Refresh Time Display -->
    <div v-if="!editMode && lastRefreshTime && gridLayout.length > 0" class="last-refresh-info" v-show="!isFullscreen">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <span>Cập nhật lần cuối: {{ formatLastRefreshTime() }}</span>
    </div>

    <!-- Fullscreen Floating Controls -->
    <div v-if="isFullscreen" class="fullscreen-controls">
      <div class="fullscreen-title">
        <h2>{{ currentDashboard?.dashboardName || 'Dashboard' }}</h2>
        <span v-if="lastRefreshTime" class="fullscreen-refresh-time">
          Cập nhật: {{ formatLastRefreshTime() }}
        </span>
      </div>
      <div class="fullscreen-actions">
        <button 
          class="btn-fullscreen-refresh" 
          :class="{ refreshing: isRefreshing }"
          @click="manualRefresh"
          :disabled="isRefreshing"
          title="Làm mới dữ liệu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
        <button 
          class="btn-fullscreen-exit" 
          @click="toggleFullscreen"
          title="Thoát toàn màn hình (ESC)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Query Panel Dropdown (Edit Mode) -->
    <transition name="slide-down">
      <div v-if="editMode && showQueryPanel" class="query-panel-dropdown">
        <div class="query-panel-header">
          <h3>Chọn truy vấn để thêm vào dashboard</h3>
          <button class="btn-close-panel" @click="showQueryPanel = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="query-panel-grid">
          <div 
            v-for="query in savedQueries" 
            :key="query.id"
            class="query-card"
            :class="{ 'in-dashboard': gridLayout.some(item => item.savedQueryId === query.id) }"
            @click="addWidgetToDashboard(query)"
          >
            <div class="query-card-icon">
              <svg v-if="query.visualizationType === 'BAR'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="20" x2="12" y2="10"/>
                <line x1="18" y1="20" x2="18" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="16"/>
              </svg>
              <svg v-else-if="query.visualizationType === 'LINE'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <svg v-else-if="query.visualizationType === 'PIE' || query.visualizationType === 'DOUGHNUT'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                <path d="M22 12A10 10 0 0 0 12 2v10z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3h18v18H3z"/>
                <path d="M3 9h18"/>
                <path d="M3 15h18"/>
                <path d="M9 3v18"/>
              </svg>
            </div>
            <div class="query-card-content">
              <h4>{{ query.name }}</h4>
              <p v-if="query.description" class="query-desc">{{ query.description }}</p>
              <p v-else class="query-desc-empty">Không có mô tả</p>
              <div class="query-card-meta">
                <span class="query-card-badge">{{ query.visualizationType }}</span>
                <span v-if="query.createdBy" class="query-card-author">{{ query.createdBy }}</span>
              </div>
            </div>
            <div v-if="gridLayout.some(item => item.savedQueryId === query.id)" class="query-card-check">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Grid Layout Dashboard -->
    <div class="dashboard-grid-wrapper">
      <div v-if="editMode && gridLayout.length > 0" class="edit-mode-hint">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span>Nhấn vào bất kỳ đâu trên widget để di chuyển, kéo góc dưới bên phải để thay đổi kích thước</span>
      </div>
      
      <div v-if="gridLayout.length === 0" class="empty-dashboard">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <h3>Dashboard trống</h3>
        <p>{{ editMode ? 'Nhấn nút "Thêm widget" ở trên để thêm truy vấn vào dashboard' : 'Bật chế độ chỉnh sửa để thêm widget' }}</p>
      </div>

      <!-- CSS Grid Layout with Manual Drag & Drop -->
      <div v-else class="widgets-grid" :style="{ minHeight: gridHeight + 'px' }">
        <div
          v-for="item in gridLayout"
          :key="`widget-${item.savedQueryId}`"
          class="grid-widget"
          :class="{ 
            'dragging': draggingItem === item.i, 
            'resizing': resizingItem === item.i,
            'edit-mode': editMode 
          }"
          :style="getWidgetStyle(item)"
        >
          <div 
            class="dashboard-widget"
            @mousedown="editMode && startDrag($event, item)"
          >
            <div 
              class="widget-header" 
              :class="{ 'draggable': editMode }"
            >
              <div class="widget-title-section">
                <svg v-if="editMode" class="drag-handle" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="9" cy="5" r="1"/>
                  <circle cx="9" cy="12" r="1"/>
                  <circle cx="9" cy="19" r="1"/>
                  <circle cx="15" cy="5" r="1"/>
                  <circle cx="15" cy="12" r="1"/>
                  <circle cx="15" cy="19" r="1"/>
                </svg>
                <h4>{{ getSavedQueryName(item.savedQueryId) }}</h4>
              </div>
              <div class="widget-actions">
                <button 
                  v-if="editMode"
                  class="btn-widget-remove" 
                  @click.stop="removeWidgetFromDashboard(item.savedQueryId)"
                  title="Xóa widget"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="widget-content">
              <!-- TABLE viz: render thành <table> với đầy đủ cột -->
              <div
                v-if="getSavedQueryVizType(item.savedQueryId) === 'TABLE' && savedQueryResults.has(item.savedQueryId)"
                class="widget-table-wrapper"
              >
                <table class="widget-table">
                  <thead>
                    <tr>
                      <th
                        v-for="col in savedQueryResults.get(item.savedQueryId)!.columns"
                        :key="col.name"
                      >{{ col.displayName || col.name }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, rIdx) in savedQueryResults.get(item.savedQueryId)!.rows"
                      :key="rIdx"
                    >
                      <td
                        v-for="col in savedQueryResults.get(item.savedQueryId)!.columns"
                        :key="col.name"
                      >{{ formatTableCell(row[col.name]) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Chart viz (BAR/LINE/PIE/DOUGHNUT): canvas + data summary bên cạnh -->
              <template v-else>
                <div class="widget-chart-container">
                  <canvas :id="`widget-chart-${item.savedQueryId}`"></canvas>
                </div>

                <div v-if="savedQueryResults.has(item.savedQueryId)" class="widget-data-summary">
                  <div
                    v-for="(row, idx) in savedQueryResults.get(item.savedQueryId)!.rows"
                    :key="idx"
                    class="data-item"
                  >
                    <div class="data-item-header">
                      <div class="data-category-wrapper">
                        <span class="color-dot" :style="{ backgroundColor: getColorForIndex(idx) }"></span>
                        <span class="data-category">{{ Object.values(row)[0] }}</span>
                      </div>
                      <span class="data-amount">{{ formatPreviewValue(Object.values(row)[1]) }}</span>
                    </div>
                    <div class="data-item-count">
                      {{ calculatePercentage(item.savedQueryId, Object.values(row)[1]) }}
                    </div>
                    <div class="progress-bar-container">
                      <div
                        class="progress-bar-fill"
                        :style="{
                          width: calculatePercentage(item.savedQueryId, Object.values(row)[1]),
                          backgroundColor: getColorForIndex(idx)
                        }"
                      ></div>
                    </div>
                    <div class="data-item-percentage">
                      {{ calculatePercentage(item.savedQueryId, Object.values(row)[1]) }}
                    </div>
                  </div>
                </div>
              </template>
              
              <div v-show="!savedQueryResults.has(item.savedQueryId)" class="widget-loading-overlay">
                <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="2" x2="12" y2="6"/>
                  <line x1="12" y1="18" x2="12" y2="22"/>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                  <line x1="2" y1="12" x2="6" y2="12"/>
                  <line x1="18" y1="12" x2="22" y2="12"/>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                </svg>
                <p>Đang tải...</p>
              </div>
            </div>
            
            <!-- Widget Footer - Execution Time -->
            <div v-if="savedQueryResults.has(item.savedQueryId)" class="widget-footer">
              <div class="execution-time">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <span>Thực thi: {{ savedQueryResults.get(item.savedQueryId)!.executionTimeMs }}ms</span>
              </div>
            </div>
            
            <!-- Resize handle -->
            <div 
              v-if="editMode" 
              class="resize-handle"
              @mousedown.stop="startResize($event, item)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { queryBuilderService, type SavedQuery, type QueryResponse, type DashboardLayoutRequest, type DashboardResponse } from '@/services/queryBuilderService'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const route = useRoute()
const router = useRouter()

const dashboardId = ref<number>(parseInt(route.params.id as string))
const currentDashboard = ref<DashboardResponse | null>(null)
const editMode = ref(false)
const showQueryPanel = ref(false)
const gridLayout = ref<any[]>([])
const savedQueries = ref<SavedQuery[]>([])
const savedQueryResults = ref<Map<number, QueryResponse>>(new Map())
const widgetCharts = ref<Map<string, Chart>>(new Map())

// Drag & Drop state
const draggingItem = ref<string | null>(null)
const resizingItem = ref<string | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
const itemStartPos = ref({ x: 0, y: 0 })
const itemStartSize = ref({ w: 0, h: 0 })

// Export state
const isExporting = ref(false)

// Auto-refresh state
let autoRefreshInterval: number | null = null
const selectedRefreshInterval = ref<number>(30) // in minutes
const isRefreshing = ref(false)
const lastRefreshTime = ref<Date | null>(null)

// Fullscreen state
const isFullscreen = ref(false)

const GRID_COLS = 12
const COL_WIDTH = 80 // pixels per column
const ROW_HEIGHT = 80 // pixels per row
const GAP = 16 // gap between widgets

// Computed property to calculate dynamic grid height based on widget positions
const gridHeight = computed(() => {
  if (gridLayout.value.length === 0) {
    return 400 // Default min-height when empty
  }
  
  // Find the lowest widget position (y + h)
  const maxY = Math.max(...gridLayout.value.map(item => item.y + item.h))
  
  // Calculate height: maxY * (ROW_HEIGHT + GAP) + extra padding
  const calculatedHeight = maxY * (ROW_HEIGHT + GAP) + 40
  
  // Return at least 400px
  return Math.max(400, calculatedHeight)
})

const goBack = () => {
  router.push('/admin/query-builder')
}

const getWidgetStyle = (item: any) => {
  const left = item.x * (COL_WIDTH + GAP)
  const top = item.y * (ROW_HEIGHT + GAP)
  const width = item.w * COL_WIDTH + (item.w - 1) * GAP
  const height = item.h * ROW_HEIGHT + (item.h - 1) * GAP
  
  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    transition: draggingItem.value === item.i || resizingItem.value === item.i ? 'none' : 'all 0.2s ease'
  }
}

const startDrag = (event: MouseEvent, item: any) => {
  if (!editMode.value) return
  
  const target = event.target as HTMLElement
  
  // Don't drag if clicking on resize handle or remove button
  if (target.closest('.resize-handle')) return
  if (target.closest('.btn-widget-remove')) return
  
  draggingItem.value = item.i
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  itemStartPos.value = { x: item.x, y: item.y }
  
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  
  event.preventDefault()
  event.stopPropagation()
}

const onDragMove = (event: MouseEvent) => {
  if (!draggingItem.value) return
  
  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y
  
  const colDelta = Math.round(deltaX / (COL_WIDTH + GAP))
  const rowDelta = Math.round(deltaY / (ROW_HEIGHT + GAP))
  
  const newX = Math.max(0, Math.min(GRID_COLS - 1, itemStartPos.value.x + colDelta))
  const newY = Math.max(0, itemStartPos.value.y + rowDelta)
  
  const item = gridLayout.value.find(i => i.i === draggingItem.value)
  if (item) {
    item.x = newX
    item.y = newY
  }
}

const onDragEnd = () => {
  draggingItem.value = null
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

const startResize = (event: MouseEvent, item: any) => {
  if (!editMode.value) return
  
  resizingItem.value = item.i
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  itemStartSize.value = { w: item.w, h: item.h }
  
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
  
  event.preventDefault()
  event.stopPropagation()
}

const onResizeMove = (event: MouseEvent) => {
  if (!resizingItem.value) return
  
  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y
  
  const colDelta = Math.round(deltaX / (COL_WIDTH + GAP))
  const rowDelta = Math.round(deltaY / (ROW_HEIGHT + GAP))
  
  const newW = Math.max(3, Math.min(GRID_COLS, itemStartSize.value.w + colDelta))
  const newH = Math.max(3, Math.min(10, itemStartSize.value.h + rowDelta))
  
  const item = gridLayout.value.find(i => i.i === resizingItem.value)
  if (item) {
    item.w = newW
    item.h = newH
  }
}

const onResizeEnd = () => {
  resizingItem.value = null
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  
  // Re-render charts after resize
  nextTick(() => {
    for (const [queryId] of savedQueryResults.value.entries()) {
      const query = savedQueries.value.find(q => q.id === queryId)
      if (query) {
        const chartKey = `widget-${queryId}`
        const existingChart = widgetCharts.value.get(chartKey)
        if (existingChart) {
          existingChart.resize()
        }
      }
    }
  })
}

const loadDashboard = async () => {
  try {
    currentDashboard.value = await queryBuilderService.getDashboard(dashboardId.value)
  } catch (err: any) {
    console.error('Load dashboard error:', err)
    alert('Lỗi khi tải dashboard')
  }
}

const loadSavedQueries = async () => {
  try {
    savedQueries.value = await queryBuilderService.getMyQueries()
  } catch (err: any) {
    console.error('Load saved queries error:', err)
  }
}

const loadDashboardLayouts = async () => {
  try {
    console.log('[loadDashboardLayouts] Loading layouts for dashboard:', dashboardId.value)
    const layouts = await queryBuilderService.getDashboardLayouts(dashboardId.value)
    console.log('[loadDashboardLayouts] Loaded layouts:', layouts)
    
    if (layouts.length === 0) {
      console.log('[loadDashboardLayouts] No layouts found')
      return
    }
    
    gridLayout.value = layouts.map(layout => {
      console.log('[loadDashboardLayouts] Mapping layout:', layout, 'savedQueryId:', layout.savedQueryId)
      return {
        i: `widget-${layout.savedQueryId}`,
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
        savedQueryId: layout.savedQueryId
      }
    })
    
    console.log('[loadDashboardLayouts] Grid layout after mapping:', gridLayout.value)
    console.log('[loadDashboardLayouts] Waiting for grid to render...')
    
    // Wait for grid-layout to render
    await nextTick()
    
    console.log('[loadDashboardLayouts] Grid rendered, executing queries for', layouts.length, 'widgets')
    
    for (const layout of layouts) {
      const query = savedQueries.value.find(q => q.id === layout.savedQueryId)
      console.log('[loadDashboardLayouts] Processing layout:', layout.savedQueryId, 'query found:', !!query)
      if (query) {
        await executeWidgetQuery(query)
      } else {
        console.warn('[loadDashboardLayouts] Query not found for savedQueryId:', layout.savedQueryId)
      }
    }
    
    console.log('[loadDashboardLayouts] All queries executed')
  } catch (err: any) {
    console.error('Load dashboard layouts error:', err)
  }
}

const saveDashboardLayouts = async () => {
  try {
    console.log('[saveDashboardLayouts] Saving layouts:', gridLayout.value)
    
    const layoutRequests: DashboardLayoutRequest[] = gridLayout.value.map(item => ({
      savedQueryId: item.savedQueryId,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h
    }))
    
    console.log('[saveDashboardLayouts] Layout requests:', layoutRequests)
    
    await queryBuilderService.saveDashboardLayouts(dashboardId.value, layoutRequests)
    editMode.value = false
    
    alert('Đã lưu bố cục dashboard thành công!')
  } catch (err: any) {
    console.error('Save dashboard layouts error:', err)
    alert('Lỗi khi lưu bố cục dashboard: ' + (err.response?.data?.message || err.message))
  }
}

const toggleEditMode = async () => {
  if (editMode.value) {
    // Saving mode
    await saveDashboardLayouts()
  } else {
    // Entering edit mode
    editMode.value = true
  }
}

const addWidgetToDashboard = async (query: SavedQuery) => {
  if (gridLayout.value.some(item => item.savedQueryId === query.id)) {
    alert('Widget này đã có trong dashboard')
    return
  }
  
  const maxY = gridLayout.value.length > 0 
    ? Math.max(...gridLayout.value.map(item => item.y + item.h))
    : 0
  
  const newWidget = {
    i: `widget-${query.id}`,
    x: 0,
    y: maxY,
    w: 6,
    h: 4,
    savedQueryId: query.id
  }
  
  gridLayout.value.push(newWidget)
  await executeWidgetQuery(query)
  await saveDashboardLayouts()
  
  // Close panel after adding
  showQueryPanel.value = false
}

const removeWidgetFromDashboard = async (queryId: number) => {
  if (!confirm('Bạn có chắc muốn xóa widget này khỏi dashboard?')) {
    return
  }
  
  try {
    await queryBuilderService.removeDashboardLayout(dashboardId.value, queryId)
    gridLayout.value = gridLayout.value.filter(item => item.savedQueryId !== queryId)
    
    const chartKey = `widget-${queryId}`
    const chart = widgetCharts.value.get(chartKey)
    if (chart) {
      chart.destroy()
      widgetCharts.value.delete(chartKey)
    }
  } catch (err: any) {
    console.error('Remove widget error:', err)
    alert('Lỗi khi xóa widget')
  }
}

const executeWidgetQuery = async (query: SavedQuery) => {
  try {
    console.log(`[executeWidgetQuery] Executing query ${query.id} (${query.name})`)
    const result = await queryBuilderService.executeSavedQuery(query.id)
    console.log(`[executeWidgetQuery] Query ${query.id} result:`, result)
    
    if (!result || !result.rows || result.rows.length === 0) {
      console.warn(`[executeWidgetQuery] Query ${query.id} returned empty result`)
      savedQueryResults.value.set(query.id, result)
      return
    }
    
    // Set result - watcher will handle rendering
    savedQueryResults.value.set(query.id, result)
    console.log(`[executeWidgetQuery] Result set for query ${query.id}, watcher will render chart`)
  } catch (err: any) {
    console.error(`Error executing widget query ${query.id}:`, err)
    console.error(`Error details:`, {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    })
  }
}

const renderWidgetChart = (queryId: number, vizType: string) => {
  const canvasId = `widget-chart-${queryId}`
  
  console.log(`[renderWidgetChart] ===== START RENDER WIDGET ${queryId} =====`)
  console.log(`[renderWidgetChart] vizType: ${vizType}`)
  console.log(`[renderWidgetChart] canvasId: ${canvasId}`)
  console.log(`[renderWidgetChart] All canvas elements in DOM:`, document.querySelectorAll('canvas'))
  console.log(`[renderWidgetChart] All canvas IDs:`, Array.from(document.querySelectorAll('canvas')).map(c => c.id))
  
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement
  if (!canvas) {
    console.error(`[renderWidgetChart] ❌ Canvas not found for widget ${queryId}`)
    console.error(`[renderWidgetChart] DOM structure:`, document.querySelector('.dashboard-grid-wrapper')?.innerHTML)
    return
  }
  
  console.log(`[renderWidgetChart] ✅ Canvas found:`, canvas)
  console.log(`[renderWidgetChart] Canvas dimensions:`, canvas.width, 'x', canvas.height)
  console.log(`[renderWidgetChart] Canvas parent:`, canvas.parentElement)
  
  const result = savedQueryResults.value.get(queryId)
  if (!result) {
    console.warn(`[renderWidgetChart] ❌ No result found for widget ${queryId}`)
    console.warn(`[renderWidgetChart] Available results:`, Array.from(savedQueryResults.value.keys()))
    return
  }
  
  console.log(`[renderWidgetChart] ✅ Result found:`, result)
  console.log(`[renderWidgetChart] Result rows:`, result.rows)
  console.log(`[renderWidgetChart] Result columns:`, result.columns)
  
  const chartKey = `widget-${queryId}`
  const existingChart = widgetCharts.value.get(chartKey)
  if (existingChart) {
    console.log(`[renderWidgetChart] Destroying existing chart for widget ${queryId}`)
    existingChart.destroy()
  }
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error(`[renderWidgetChart] ❌ Failed to get 2D context for widget ${queryId}`)
    return
  }
  
  console.log(`[renderWidgetChart] ✅ Got 2D context`)
  console.log(`[renderWidgetChart] Calling renderChart...`)
  
  renderChart(ctx, result, vizType, (chart) => {
    widgetCharts.value.set(chartKey, chart)
    console.log(`[renderWidgetChart] ✅✅✅ Chart successfully rendered for widget ${queryId}`)
    console.log(`[renderWidgetChart] ===== END RENDER WIDGET ${queryId} =====`)
  })
}

const renderChart = (ctx: CanvasRenderingContext2D, result: QueryResponse, vizType: string, callback: (chart: Chart) => void) => {
  console.log(`[renderChart] Rendering chart with vizType: ${vizType}`)
  
  if (vizType === 'TABLE') {
    console.log('[renderChart] Skipping TABLE visualization')
    return
  }
  
  const labels = result.rows.map(row => Object.values(row)[0]?.toString() || '')
  const data = result.rows.map(row => {
    const values = Object.values(row)
    return parseFloat(values[1]?.toString() || '0')
  })
  
  console.log('[renderChart] Chart data:', { labels, data })
  
  const colors = getChartColors()
  
  const config: any = {
    type: vizType.toLowerCase(),
    data: {
      labels,
      datasets: [{
        label: result.columns[1]?.displayName || 'Giá trị',
        data,
        backgroundColor: vizType === 'PIE' || vizType === 'DOUGHNUT' 
          ? colors
          : colors[0],
        borderColor: vizType === 'PIE' || vizType === 'DOUGHNUT'
          ? colors.map(c => c.replace('0.8', '1'))
          : colors[0].replace('0.8', '1'),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Hide default legend, we show custom one
        }
      }
    }
  }
  
  console.log('[renderChart] Creating Chart with config:', config)
  
  try {
    const chart = new Chart(ctx, config)
    console.log('[renderChart] Chart created successfully:', chart)
    callback(chart)
  } catch (err) {
    console.error('[renderChart] Error creating chart:', err)
  }
}

const onLayoutUpdated = (newLayout: any[]) => {
  console.log('[onLayoutUpdated] Layout updated:', newLayout)
  
  // Update gridLayout with new positions while preserving savedQueryId
  gridLayout.value = newLayout.map(item => {
    const existingItem = gridLayout.value.find(g => g.i === item.i)
    return {
      ...item,
      savedQueryId: existingItem?.savedQueryId
    }
  })
  
  console.log('[onLayoutUpdated] Updated gridLayout:', gridLayout.value)
}

const getSavedQueryName = (queryId: number): string => {
  const query = savedQueries.value.find(q => q.id === queryId)
  return query?.name || 'Unknown Query'
}

const getSavedQueryVizType = (queryId: number): string => {
  const query = savedQueries.value.find(q => q.id === queryId)
  return query?.visualizationType || 'TABLE'
}

// Format giá trị cell trong bảng — xử lý null, số, ngày
const formatTableCell = (value: unknown): string => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return value.toLocaleString('vi-VN')
  return String(value)
}

const getChartColors = () => {
  return [
    'rgba(102, 126, 234, 0.8)',
    'rgba(118, 75, 162, 0.8)',
    'rgba(237, 100, 166, 0.8)',
    'rgba(255, 154, 158, 0.8)',
    'rgba(250, 208, 196, 0.8)',
    'rgba(77, 201, 246, 0.8)',
    'rgba(67, 233, 123, 0.8)',
    'rgba(252, 196, 25, 0.8)',
  ]
}

const getColorForIndex = (index: number): string => {
  const colors = getChartColors()
  return colors[index % colors.length]
}

const formatPreviewValue = (value: any): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    return value.toLocaleString('vi-VN')
  }
  return String(value)
}

const calculatePercentage = (queryId: number, value: any): string => {
  const result = savedQueryResults.value.get(queryId)
  if (!result || !result.rows) return '0%'
  
  const numValue = parseFloat(value?.toString() || '0')
  const total = result.rows.reduce((sum, row) => {
    const val = parseFloat(Object.values(row)[1]?.toString() || '0')
    return sum + val
  }, 0)
  
  if (total === 0) return '0%'
  const percentage = (numValue / total) * 100
  return `${percentage.toFixed(1)}%`
}

// Export functions
const exportExcel = async () => {
  try {
    isExporting.value = true
    await queryBuilderService.downloadCustomDashboardExcel(dashboardId.value)
  } catch (error) {
    console.error('Error exporting Excel:', error)
    alert('Xuất Excel thất bại. Vui lòng thử lại.')
  } finally {
    isExporting.value = false
  }
}

const exportPdf = async () => {
  try {
    isExporting.value = true
    await queryBuilderService.downloadCustomDashboardPdf(dashboardId.value)
  } catch (error) {
    console.error('Error exporting PDF:', error)
    alert('Xuất PDF thất bại. Vui lòng thử lại.')
  } finally {
    isExporting.value = false
  }
}

// Auto-refresh function to reload all widget data
const refreshAllWidgets = async () => {
  if (editMode.value) {
    console.log('[refreshAllWidgets] Skipping refresh - in edit mode')
    return
  }
  
  if (gridLayout.value.length === 0) {
    console.log('[refreshAllWidgets] Skipping refresh - no widgets')
    return
  }
  
  console.log('[refreshAllWidgets] Refreshing all widgets...')
  isRefreshing.value = true
  
  try {
    for (const item of gridLayout.value) {
      const query = savedQueries.value.find(q => q.id === item.savedQueryId)
      if (query) {
        await executeWidgetQuery(query)
      }
    }
    
    lastRefreshTime.value = new Date()
    console.log('[refreshAllWidgets] Refresh completed')
  } catch (err) {
    console.error('[refreshAllWidgets] Error during refresh:', err)
  } finally {
    isRefreshing.value = false
  }
}

// Manual refresh triggered by button click
const manualRefresh = async () => {
  await refreshAllWidgets()
}

// Handle refresh interval change
const onRefreshIntervalChange = () => {
  console.log('[onRefreshIntervalChange] Interval changed to:', selectedRefreshInterval.value, 'minutes')
  
  // Stop existing interval
  stopAutoRefresh()
  
  // Start new interval if not disabled
  if (selectedRefreshInterval.value > 0) {
    startAutoRefresh()
  }
}

// Format last refresh time for display
const formatLastRefreshTime = (): string => {
  if (!lastRefreshTime.value) return ''
  
  const now = new Date()
  const diff = now.getTime() - lastRefreshTime.value.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours} giờ ${minutes % 60} phút trước`
  } else if (minutes > 0) {
    return `${minutes} phút trước`
  } else {
    return `${seconds} giây trước`
  }
}

// Toggle fullscreen mode
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  if (isFullscreen.value) {
    // Enter fullscreen
    document.body.style.overflow = 'hidden'
    console.log('[toggleFullscreen] Entered fullscreen mode')
  } else {
    // Exit fullscreen
    document.body.style.overflow = ''
    console.log('[toggleFullscreen] Exited fullscreen mode')
  }
}

// Handle ESC key to exit fullscreen
const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isFullscreen.value) {
    toggleFullscreen()
  }
}

// Start auto-refresh interval
const startAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
  
  if (selectedRefreshInterval.value === 0) {
    console.log('[startAutoRefresh] Auto-refresh disabled')
    return
  }
  
  const intervalMs = selectedRefreshInterval.value * 60 * 1000
  
  autoRefreshInterval = window.setInterval(() => {
    refreshAllWidgets()
  }, intervalMs)
  
  console.log(`[startAutoRefresh] Auto-refresh started - interval: ${selectedRefreshInterval.value} minutes`)
}

// Stop auto-refresh interval
const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
    console.log('[stopAutoRefresh] Auto-refresh stopped')
  }
}

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  document.removeEventListener('keydown', handleEscKey)
  stopAutoRefresh()
  
  // Reset body overflow
  document.body.style.overflow = ''
})

// Watch for changes in savedQueryResults and render charts
watch(savedQueryResults, async (newResults) => {
  console.log('[watch] savedQueryResults changed, keys:', Array.from(newResults.keys()))
  
  // Wait for DOM to update
  await nextTick()
  
  // Additional wait for grid-layout to fully render - increased to 500ms
  await new Promise(resolve => setTimeout(resolve, 500))
  
  console.log('[watch] After delay, checking canvas elements:', document.querySelectorAll('canvas').length)
  
  // Render charts for all results that have corresponding grid items
  for (const [queryId, result] of newResults.entries()) {
    const gridItem = gridLayout.value.find(item => item.savedQueryId === queryId)
    if (!gridItem) {
      console.log(`[watch] No grid item for query ${queryId}, skipping`)
      continue
    }
    
    const query = savedQueries.value.find(q => q.id === queryId)
    if (!query) {
      console.log(`[watch] No query found for ${queryId}, skipping`)
      continue
    }
    
    const chartKey = `widget-${queryId}`
    if (widgetCharts.value.has(chartKey)) {
      console.log(`[watch] Chart already exists for ${queryId}, skipping`)
      continue
    }
    
    console.log(`[watch] Rendering chart for query ${queryId}`)
    renderWidgetChart(queryId, query.visualizationType as any)
  }
}, { deep: true })

onMounted(async () => {
  await loadDashboard()
  await loadSavedQueries()
  await loadDashboardLayouts()
  
  // Set initial refresh time
  lastRefreshTime.value = new Date()
  
  // Start auto-refresh after initial load
  startAutoRefresh()
  
  // Add ESC key listener for fullscreen
  document.addEventListener('keydown', handleEscKey)
})
</script>

<style scoped>
.custom-dashboard-view {
  padding: 24px;
  background: #f7fafc;
  min-height: 100vh;
}

.custom-dashboard-view.fullscreen-mode {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  padding: 0;
  margin: 0;
  z-index: 9999;
  background: #f7fafc;
  overflow-y: auto;
}

.fullscreen-controls {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e2e8f0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.fullscreen-title h2 {
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 4px 0;
}

.fullscreen-refresh-time {
  font-size: 13px;
  color: #718096;
}

.fullscreen-actions {
  display: flex;
  gap: 12px;
}

.btn-fullscreen-refresh,
.btn-fullscreen-exit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-fullscreen-refresh:hover,
.btn-fullscreen-exit:hover {
  background: #667eea;
  color: white;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-fullscreen-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-fullscreen-refresh.refreshing svg {
  animation: spin 1s linear infinite;
}

.btn-fullscreen-exit {
  background: #e53e3e;
  border-color: #e53e3e;
  color: white;
}

.btn-fullscreen-exit:hover {
  background: #c53030;
  border-color: #c53030;
}

.fullscreen-mode .dashboard-grid-wrapper {
  padding: 24px;
}

.fullscreen-mode .widgets-grid {
  min-height: calc(100vh - 120px);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dashboard-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f7fafc;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e2e8f0;
  transform: translateX(-2px);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #718096;
  margin: 4px 0 0 0;
}

.dashboard-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.refresh-interval-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f7fafc;
  border-radius: 8px;
}

.refresh-interval-dropdown label {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  white-space: nowrap;
}

.select-refresh-interval {
  padding: 6px 12px;
  background: white;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
  color: #2d3748;
  cursor: pointer;
  transition: all 0.2s;
}

.select-refresh-interval:hover {
  border-color: #667eea;
}

.select-refresh-interval:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-export.excel {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.btn-export.excel:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

.btn-export.pdf {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.btn-export.pdf:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-refresh.refreshing svg {
  animation: spin 1s linear infinite;
}

.btn-fullscreen {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-fullscreen:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.last-refresh-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  font-size: 13px;
  color: #718096;
}

.last-refresh-info svg {
  flex-shrink: 0;
  color: #667eea;
}

.btn-edit-mode {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit-mode:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-edit-mode.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.btn-add-widget {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-widget:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-add-widget.active {
  background: #667eea;
  color: white;
}

/* Query Panel Dropdown */
.query-panel-dropdown {
  position: fixed;
  top: 160px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 48px);
  max-width: 1200px;
  max-height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 300;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.query-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.query-panel-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.btn-close-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #718096;
}

.btn-close-panel:hover {
  background: #f7fafc;
  color: #2d3748;
}

.query-panel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 24px;
  overflow-y: auto;
  max-height: 400px;
}

.query-card {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.query-card:hover {
  border-color: #667eea;
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.query-card.in-dashboard {
  background: #e6fffa;
  border-color: #38b2ac;
  opacity: 0.7;
  cursor: not-allowed;
}

.query-card.in-dashboard:hover {
  transform: none;
  box-shadow: none;
}

.query-card-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
}

.query-card.in-dashboard .query-card-icon {
  background: linear-gradient(135deg, #38b2ac 0%, #319795 100%);
}

.query-card-content {
  flex: 1;
  min-width: 0;
}

.query-card-content h4 {
  font-size: 15px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.query-card-content p {
  font-size: 13px;
  color: #718096;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.query-desc {
  font-size: 13px;
  color: #718096;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.query-desc-empty {
  font-size: 13px;
  color: #cbd5e0;
  margin: 0 0 8px 0;
  font-style: italic;
}

.query-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.query-card-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #667eea;
  color: white;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.query-card-author {
  font-size: 12px;
  color: #a0aec0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.query-card.in-dashboard .query-card-badge {
  background: #38b2ac;
}

.query-card-check {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #38b2ac;
  border-radius: 50%;
  color: white;
}

/* Slide down animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.available-queries-sidebar {
  display: none; /* Hidden - replaced by dropdown panel */
}

.dashboard-grid-wrapper {
  transition: margin-left 0.3s;
}

.edit-mode-hint {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  margin-bottom: 24px;
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
}

.edit-mode-hint svg {
  flex-shrink: 0;
}

.empty-dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  background: white;
  border-radius: 16px;
  border: 2px dashed #cbd5e0;
  text-align: center;
}

.empty-dashboard svg {
  color: #667eea;
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-dashboard h3 {
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 12px 0;
}

.empty-dashboard p {
  font-size: 15px;
  color: #718096;
  max-width: 500px;
  margin: 0;
}

/* Widgets Grid Container */
.widgets-grid {
  position: relative;
  min-height: 400px;
  padding-bottom: 40px;
}

.grid-widget {
  position: absolute;
  z-index: 1;
}

.grid-widget.dragging {
  z-index: 100;
  opacity: 0.8;
  cursor: move !important;
}

.grid-widget.edit-mode .dashboard-widget {
  cursor: move;
}

.grid-widget.edit-mode.dragging .dashboard-widget {
  cursor: move;
}

.dashboard-widget {
  height: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.grid-widget.edit-mode .dashboard-widget {
  border: 2px dashed transparent;
  transition: border-color 0.2s;
}

.grid-widget.edit-mode:hover .dashboard-widget {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.grid-widget.dragging .dashboard-widget,
.grid-widget.resizing .dashboard-widget {
  border-color: #667eea;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.widget-header.draggable {
  cursor: move;
}

.widget-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.drag-handle {
  color: #a0aec0;
  flex-shrink: 0;
}

.widget-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.widget-actions {
  display: flex;
  gap: 8px;
}

.btn-widget-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #fff5f5;
  color: #e53e3e;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-widget-remove:hover {
  background: #e53e3e;
  color: white;
}

.widget-content {
  flex: 1;
  padding: 16px;
  overflow: hidden;
  position: relative;
  display: flex;
  gap: 16px;
}

.widget-chart-container {
  flex: 1;
  position: relative;
  min-width: 0;
}

.widget-chart-container canvas {
  max-height: 100%;
}

/* TABLE widget */
.widget-table-wrapper {
  flex: 1;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
}

.widget-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.widget-table thead {
  position: sticky;
  top: 0;
  background: #f8fafc;
  z-index: 1;
}

.widget-table th {
  text-align: left;
  padding: 8px 12px;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.widget-table td {
  padding: 8px 12px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  white-space: nowrap;
}

.widget-table tbody tr:hover {
  background: #f8fafc;
}

.widget-table tbody tr:last-child td {
  border-bottom: none;
}

.widget-data-summary {
  flex-shrink: 0;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
  overflow-y: auto;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.data-category-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.data-category {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  flex: 1;
}

.data-amount {
  font-size: 16px;
  font-weight: 700;
  color: #667eea;
  white-space: nowrap;
}

.data-item-count {
  font-size: 12px;
  color: #718096;
}

.progress-bar-container {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.data-item-percentage {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  text-align: center;
}

.widget-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  color: #718096;
  z-index: 10;
}

.widget-footer {
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.execution-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #718096;
}

.execution-time svg {
  color: #667eea;
}

.spinner {
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Resize Handle */
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, transparent 0%, transparent 50%, #667eea 50%, #667eea 100%);
  cursor: nwse-resize !important;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
  border-bottom-right-radius: 12px;
}

.grid-widget.edit-mode:hover .resize-handle {
  opacity: 0.8;
}

.resize-handle:hover {
  opacity: 1 !important;
  cursor: nwse-resize !important;
}

.resize-handle::after {
  content: '';
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 8px 8px;
  border-color: transparent transparent white transparent;
  pointer-events: none;
}

@media (max-width: 1024px) {
  .available-queries-sidebar {
    width: 280px;
  }
  
  .dashboard-grid-wrapper.edit-mode {
    margin-left: 300px;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .available-queries-sidebar {
    width: 100%;
    position: relative;
    top: 0;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .dashboard-grid-wrapper.edit-mode {
    margin-left: 0;
  }
}
</style>
