<template>
  <div class="walk-in-container">
    <div class="header">
      <h1 class="title">Check-in Khách Vãng Lai</h1>
      <p class="subtitle">Chọn bàn trống để xếp chỗ cho khách</p>
    </div>

    <div class="content">
      <!-- Table Grid -->
      <div class="tables-section">
        <div class="section-header">
          <h2>Trạng thái bàn</h2>
          <button @click="refreshTables" class="refresh-btn">
            <span>🔄</span> Làm mới
          </button>
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
        </div>

        <div v-if="loading" class="loading">Đang tải...</div>
        
        <div v-else class="tables-grid">
          <div
            v-for="table in tables"
            :key="table.id"
            class="table-item"
            :class="[
              table.status.toLowerCase(),
              { selected: selectedTableIds.includes(table.id) }
            ]"
            @click="toggleTableSelection(table)"
          >
            <div class="table-name">{{ table.name }}</div>
            <div class="table-capacity">{{ table.capacity }} người</div>
            
            <!-- Show minutes for OCCUPIED/OVERTIME tables -->
            <div v-if="(table.status === 'OCCUPIED' || table.status === 'OVERTIME') && table.minutesSinceCheckIn" 
                 class="table-time">
              {{ table.minutesSinceCheckIn }} phút
            </div>
            
            <!-- Show reservation time for RESERVED tables -->
            <div v-else-if="table.status === 'RESERVED' && table.reservedAt" 
                 class="table-time">
              {{ formatReservationTime(table.reservedAt) }}
            </div>
            
            <div class="table-status">{{ getStatusLabel(table.status) }}</div>
            <div v-if="selectedTableIds.includes(table.id)" class="selected-badge">✓</div>
          </div>
        </div>
      </div>

      <!-- Check-in Form -->
      <div class="form-section" v-if="selectedTableIds.length > 0">
        <h2>Thông tin check-in</h2>
        
        <div class="form-group">
          <label>Bàn đã chọn:</label>
          <div class="selected-tables">
            {{ selectedTableNames.join(' + ') }}
          </div>
        </div>

        <div class="form-group">
          <label for="guestCount">Số khách:</label>
          <input
            id="guestCount"
            v-model.number="guestCount"
            type="number"
            min="1"
            placeholder="Nhập số khách"
            class="input"
          />
        </div>

        <div class="form-actions">
          <button @click="clearSelection" class="btn-secondary">Hủy</button>
          <button @click="handleCheckIn" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Đang xử lý...' : 'Check-in' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { dashboardService, type TableStatus } from '@/services/dashboardService'
import { walkInService } from '@/services/walkInService'

const tables = ref<TableStatus[]>([])
const selectedTableIds = ref<number[]>([])
const guestCount = ref<number>(1)
const loading = ref(false)
const submitting = ref(false)

const selectedTableNames = computed(() => {
  return tables.value
    .filter(t => selectedTableIds.value.includes(t.id))
    .map(t => t.name)
})

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'AVAILABLE': 'Trống',
    'OCCUPIED': 'Đang phục vụ',
    'RESERVED': 'Đã đặt',
    'OVERTIME': 'Quá giờ',
    'CLEANING': 'Đang dọn'
  }
  return labels[status] || status
}

const formatReservationTime = (reservedAt: string) => {
  const date = new Date(reservedAt)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const loadTables = async () => {
  loading.value = true
  try {
    tables.value = await dashboardService.getTableStatus()
  } catch (error) {
    console.error('Error loading tables:', error)
    alert('Không thể tải danh sách bàn')
  } finally {
    loading.value = false
  }
}

const refreshTables = () => {
  loadTables()
}

const toggleTableSelection = (table: TableStatus) => {
  // Only allow selecting AVAILABLE tables
  if (table.status !== 'AVAILABLE') {
    alert(`Bàn ${table.name} đang ${getStatusLabel(table.status).toLowerCase()}`)
    return
  }

  const index = selectedTableIds.value.indexOf(table.id)
  if (index > -1) {
    selectedTableIds.value.splice(index, 1)
  } else {
    selectedTableIds.value.push(table.id)
  }
}

const clearSelection = () => {
  selectedTableIds.value = []
  guestCount.value = 1
}

const handleCheckIn = async () => {
  if (selectedTableIds.value.length === 0) {
    alert('Vui lòng chọn bàn')
    return
  }

  if (!guestCount.value || guestCount.value < 1) {
    alert('Vui lòng nhập số khách hợp lệ')
    return
  }

  submitting.value = true
  try {
    const response = await walkInService.checkIn({
      tableIds: selectedTableIds.value,
      guestCount: guestCount.value
    })

    alert(`${response.message}\nMã hóa đơn: ${response.invoiceCode}`)
    
    // Clear selection and refresh
    clearSelection()
    await loadTables()
  } catch (error: any) {
    console.error('Check-in error:', error)
    alert(error.response?.data?.message || 'Không thể check-in')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadTables()
})
</script>

<style scoped>
.walk-in-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  margin-bottom: 32px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #64748b;
  font-size: 16px;
  margin: 0;
}

.content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
}

@media (max-width: 1024px) {
  .content {
    grid-template-columns: 1fr;
  }
}

.tables-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.refresh-btn {
  padding: 8px 16px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #e2e8f0;
}

.table-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
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
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.loading {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.table-item {
  position: relative;
  padding: 20px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  text-align: center;
}

.table-item.available {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #10b981;
}

.table-item.available:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
}

.table-item.occupied {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #ef4444;
  cursor: not-allowed;
  opacity: 0.7;
}

.table-item.reserved {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
  cursor: not-allowed;
  opacity: 0.7;
}

.table-item.overtime {
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  border-color: #8b5cf6;
  cursor: not-allowed;
  opacity: 0.7;
}

.table-item.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  transform: translateY(-4px);
}

.table-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.table-capacity {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.table-time {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.table-status {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.selected-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.form-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 24px;
}

.form-section h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.selected-tables {
  padding: 12px;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
