<template>
  <div class="walk-in-container">
    <!-- Header -->
    <div class="header-section">
      <h2>Check-in Khách Vãng Lai</h2>
      
      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">Tổng số bàn</span>
          <span class="stat-value">{{ tables.length }}</span>
        </div>
        <div class="stat-item available">
          <span class="stat-label">Bàn trống</span>
          <span class="stat-value">{{ availableCount }}</span>
        </div>
        <div class="stat-item in-use">
          <span class="stat-label">Đang phục vụ</span>
          <span class="stat-value">{{ inUseCount }}</span>
        </div>
        <div class="stat-item reserved">
          <span class="stat-label">Đã đặt</span>
          <span class="stat-value">{{ reservedCount }}</span>
        </div>
        <div class="stat-item overtime">
          <span class="stat-label">Quá giờ</span>
          <span class="stat-value">{{ overtimeCount }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      Đang tải...
    </div>

    <div v-else>
      <!-- Search and Guest Count Row -->
      <div class="search-guest-row">
        <div class="search-box-inline">
          <label class="input-label">Tìm kiếm bàn</label>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input-inline"
            placeholder="Nhập tên khách..."
          />
        </div>
        
        <div class="guest-count-inline">
          <label class="input-label">Số lượng khách <span class="required-mark">*</span></label>
          <input
            v-model.number="guestCount"
            type="number"
            class="guest-count-input-inline"
            placeholder="Nhập số khách..."
            min="1"
          />
          <div v-if="guestCount > 0 && recommendedTables.length > 0" class="recommendation-badge">
            💡 {{ getRecommendationText() }}
          </div>
        </div>
      </div>

      <!-- Main Content Wrapper -->
      <div class="content-wrapper" :class="{ 'has-form': selectedTableIds.length > 0 }">
        <!-- Tables Grid -->
        <div class="tables-grid">
          <div
            v-for="table in filteredTables"
            :key="table.id"
            class="table-card"
            :class="getTableClass(table)"
            @click="toggleTableSelection(table)"
          >
            <div class="table-header">
              <div class="table-number">#{{ table.id }}</div>
              <!-- Show customer name if occupied/reserved, otherwise show capacity -->
              <div v-if="table.customerName && (table.status === 'IN_USE' || table.status === 'OCCUPIED' || table.status === 'RESERVED')" class="table-customer-name">
                👤 {{ table.customerName }}
              </div>
              <div v-else class="table-capacity">{{ table.capacity }} chỗ</div>
            </div>
            <div class="table-name-row">
              <span class="table-name">{{ table.name }}</span>
              <span v-if="table.customerName && (table.status === 'IN_USE' || table.status === 'OCCUPIED' || table.status === 'RESERVED')" class="table-capacity-small">{{ table.capacity }} chỗ</span>
            </div>
            
            <div class="table-status-badge" :class="getStatusClass(table)">
              {{ getStatusText(table) }}
            </div>
            
            <div v-if="table.minutesSinceCheckIn !== null && table.minutesSinceCheckIn !== undefined" class="table-time">
              {{ table.minutesSinceCheckIn }} phút
            </div>
            <div v-if="selectedTableIds.includes(table.id)" class="selected-badge">✓</div>
          </div>
        </div>

        <!-- Check-in Form Sidebar -->
        <div v-if="selectedTableIds.length > 0" class="check-in-sidebar">
          <h3 class="sidebar-title">Thông tin check-in</h3>
          
          <div class="form-group">
            <label>Bàn đã chọn</label>
            <div class="selected-tables">
              {{ selectedTableNames.join(' + ') }}
            </div>
            <div class="capacity-info" :class="{ 'capacity-error': validationMessage }">
              Tổng sức chứa: <strong>{{ totalCapacity }} chỗ</strong>
            </div>
            <div v-if="validationMessage" class="error-message">
              {{ validationMessage }}
            </div>
          </div>

          <div class="form-group">
            <label>Tên khách <span class="required-mark">*</span></label>
            <input
              v-model="customerName"
              type="text"
              class="form-input"
              placeholder="Nhập tên khách"
            />
          </div>

          <div class="form-actions">
            <button class="action-btn secondary" @click="clearSelection">Hủy</button>
            <button 
              class="action-btn check-in" 
              @click="handleCheckIn"
              :disabled="isCheckInDisabled"
            >
              {{ submitting ? 'Đang xử lý...' : 'Check-in' }}
            </button>
          </div>
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
              <span class="detail-value" :class="{ 'text-warning': tableDetail.minutesSinceCheckIn && tableDetail.minutesSinceCheckIn > 90 }">
                {{ tableDetail.minutesSinceCheckIn }} phút
                <span v-if="tableDetail.minutesSinceCheckIn && tableDetail.minutesSinceCheckIn > 90" class="overtime-badge">Quá giờ</span>
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
        
        <!-- Cancel Button (only for OCCUPIED/RESERVED tables) -->
        <div v-if="tableDetail?.invoiceCode && (tableDetail?.status === 'OCCUPIED' || tableDetail?.status === 'IN_USE' || tableDetail?.status === 'RESERVED')" class="modal-footer">
          <button @click="showCancelConfirm = true" class="cancel-table-btn">
            🗑️ Hủy bàn
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div v-if="showCancelConfirm" class="modal-overlay" @click="showCancelConfirm = false">
      <div class="confirm-modal" @click.stop>
        <div class="confirm-header">
          <h3>⚠️ Xác nhận hủy bàn</h3>
        </div>
        <div class="confirm-body">
          <p>Bạn có chắc chắn muốn hủy <strong>{{ tableDetail?.tableName }}</strong>?</p>
          <p class="confirm-warning">Hóa đơn <strong>{{ tableDetail?.invoiceCode }}</strong> sẽ bị hủy và bàn sẽ trở về trạng thái trống.</p>
        </div>
        <div class="confirm-actions">
          <button @click="showCancelConfirm = false" class="confirm-btn secondary" :disabled="cancellingTable">
            Không
          </button>
          <button @click="handleCancelTable" class="confirm-btn danger" :disabled="cancellingTable">
            {{ cancellingTable ? 'Đang hủy...' : 'Có, hủy bàn' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { tableService, type TableStatus } from '@/services/tableService';
import { walkInService } from '@/services/walkInService';
import { dashboardService, type TableDetail } from '@/services/dashboardService';

const tables = ref<TableStatus[]>([]);
const selectedTableIds = ref<number[]>([]);
const customerName = ref<string>('');
const guestCount = ref<number>(0);
const searchQuery = ref<string>('');
const loading = ref(false);
const submitting = ref(false);
const showModal = ref(false);
const tableDetail = ref<TableDetail | null>(null);
const showCancelConfirm = ref(false);
const cancellingTable = ref(false);

const availableCount = computed(() => 
  tables.value.filter(t => t.status === 'AVAILABLE').length
);

const inUseCount = computed(() => 
  tables.value.filter(t => t.status === 'IN_USE' || t.status === 'OCCUPIED').length
);

const reservedCount = computed(() => 
  tables.value.filter(t => t.status === 'RESERVED').length
);

const overtimeCount = computed(() => 
  tables.value.filter(t => t.status === 'OVERTIME' || (t.minutesSinceCheckIn !== null && t.minutesSinceCheckIn > 90)).length
);

const filteredTables = computed(() => {
  if (!searchQuery.value.trim()) {
    return tables.value;
  }
  
  const query = searchQuery.value.toLowerCase().trim();
  return tables.value.filter(table => {
    // Search by customer name
    if (table.customerName && table.customerName.toLowerCase().includes(query)) {
      return true;
    }
    // Search by table name
    if (table.name.toLowerCase().includes(query)) {
      return true;
    }
    return false;
  });
});

const selectedTableNames = computed(() => {
  return tables.value
    .filter(t => selectedTableIds.value.includes(t.id))
    .map(t => t.name);
});

const totalCapacity = computed(() => {
  return tables.value
    .filter(t => selectedTableIds.value.includes(t.id))
    .reduce((sum, t) => sum + t.capacity, 0);
});

// Validation: Check if selected tables are valid for guest count
const validationMessage = computed(() => {
  if (selectedTableIds.value.length === 0 || guestCount.value <= 0) {
    return '';
  }
  
  const total = totalCapacity.value;
  
  // Guest count exceeds total capacity
  if (guestCount.value > total) {
    return `⚠️ Số khách vượt quá sức chứa (tối đa ${total} chỗ)`;
  }
  
  // Guest count is valid
  return '';
});

const isCheckInDisabled = computed(() => {
  return submitting.value || 
         !guestCount.value || 
         guestCount.value < 1 || 
         selectedTableIds.value.length === 0 ||
         validationMessage.value !== '';
});

// Smart recommendation algorithm
const recommendedTables = computed(() => {
  if (guestCount.value <= 0) return [];
  
  const availableTables = tables.value.filter(t => t.status === 'AVAILABLE');
  if (availableTables.length === 0) return [];
  
  // For 10 or fewer guests: recommend single best table
  if (guestCount.value <= 10) {
    // Find table with capacity closest to guest count (but >= guest count)
    const suitableTables = availableTables.filter(t => t.capacity >= guestCount.value);
    if (suitableTables.length === 0) return [];
    
    // Sort by capacity ascending, pick the smallest one that fits
    suitableTables.sort((a, b) => a.capacity - b.capacity);
    return [suitableTables[0].id];
  }
  
  // For more than 10 guests: recommend best 2-table combination
  const combinations: Array<{tables: number[], totalCapacity: number, waste: number}> = [];
  
  for (let i = 0; i < availableTables.length; i++) {
    for (let j = i + 1; j < availableTables.length; j++) {
      const table1 = availableTables[i];
      const table2 = availableTables[j];
      const totalCapacity = table1.capacity + table2.capacity;
      
      // Only consider if total capacity >= guest count
      if (totalCapacity >= guestCount.value) {
        const waste = totalCapacity - guestCount.value;
        combinations.push({
          tables: [table1.id, table2.id],
          totalCapacity,
          waste
        });
      }
    }
  }
  
  if (combinations.length === 0) return [];
  
  // Sort by waste (ascending) - prefer combination with least waste
  combinations.sort((a, b) => a.waste - b.waste);
  return combinations[0].tables;
});

const getRecommendationText = () => {
  if (recommendedTables.value.length === 0) return '';
  
  const tableNames = recommendedTables.value
    .map(id => tables.value.find(t => t.id === id)?.name)
    .filter(Boolean);
  
  if (recommendedTables.value.length === 1) {
    return `Bàn ${tableNames[0]} phù hợp nhất`;
  } else {
    return `Ghép ${tableNames.join(' + ')} phù hợp nhất`;
  }
};

// No auto-removal of tables - let user manage their selection

onMounted(() => {
  loadTables();
});

const loadTables = async () => {
  loading.value = true;
  try {
    tables.value = await tableService.getAllTablesWithStatus();
  } catch (error) {
    console.error('Load tables error:', error);
  } finally {
    loading.value = false;
  }
};

const getTableClass = (table: TableStatus) => {
  const classes: any = {
    'available': table.status === 'AVAILABLE',
    'in-use': table.status === 'IN_USE' || table.status === 'OCCUPIED',
    'reserved': table.status === 'RESERVED',
    'overtime': table.status === 'OVERTIME',
    'out-of-service': table.status === 'OUT_OF_SERVICE',
    'selected': selectedTableIds.value.includes(table.id)
  };
  
  // Highlight recommended tables
  if (table.status === 'AVAILABLE' && guestCount.value > 0) {
    if (recommendedTables.value.includes(table.id)) {
      classes['recommended'] = true;
    }
  }
  
  return classes;
};

const getStatusClass = (table: TableStatus) => {
  const statusMap: Record<string, string> = {
    'AVAILABLE': 'status-available',
    'IN_USE': 'status-in-use',
    'OCCUPIED': 'status-in-use',
    'RESERVED': 'status-reserved',
    'OVERTIME': 'status-overtime',
    'OUT_OF_SERVICE': 'status-out'
  };
  return statusMap[table.status] || '';
};

const getStatusText = (table: TableStatus) => {
  const textMap: Record<string, string> = {
    'AVAILABLE': 'Bàn trống',
    'IN_USE': 'Đang phục vụ',
    'OCCUPIED': 'Đang phục vụ',
    'RESERVED': 'Đã đặt',
    'OVERTIME': 'Quá giờ',
    'OUT_OF_SERVICE': 'Ngừng phục vụ'
  };
  return textMap[table.status] || table.status;
};

const toggleTableSelection = async (table: TableStatus) => {
  // If table is not available, show detail modal instead
  if (table.status !== 'AVAILABLE') {
    await showTableDetail(table.id);
    return;
  }

  const index = selectedTableIds.value.indexOf(table.id);
  if (index > -1) {
    selectedTableIds.value.splice(index, 1);
  } else {
    selectedTableIds.value.push(table.id);
  }
};

const showTableDetail = async (tableId: number) => {
  try {
    tableDetail.value = await dashboardService.getTableDetail(tableId);
    showModal.value = true;
  } catch (error) {
    console.error('Error loading table detail:', error);
  }
};

const closeModal = () => {
  showModal.value = false;
  showCancelConfirm.value = false;
  tableDetail.value = null;
};

const handleCancelTable = async () => {
  if (!tableDetail.value?.invoiceCode) return;
  
  cancellingTable.value = true;
  try {
    // Call API to cancel invoice/table
    await walkInService.cancelTable(tableDetail.value.invoiceCode);
    
    alert('Đã hủy bàn thành công');
    closeModal();
    await loadTables();
  } catch (error: any) {
    console.error('Cancel table error:', error);
    alert(error.response?.data?.message || 'Không thể hủy bàn');
  } finally {
    cancellingTable.value = false;
    showCancelConfirm.value = false;
  }
};

const getStatusLabel = (status: string | undefined) => {
  if (!status) return '';
  const labels: Record<string, string> = {
    'AVAILABLE': 'Trống',
    'OCCUPIED': 'Đang phục vụ',
    'IN_USE': 'Đang phục vụ',
    'RESERVED': 'Đã đặt',
    'OVERTIME': 'Quá giờ',
    'CLEANING': 'Đang dọn',
    'OUT_OF_SERVICE': 'Ngừng phục vụ'
  };
  return labels[status] || status;
};

const formatDateTime = (dateTimeString: string | null) => {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatMoney = (value: number | null) => {
  if (value === null) return 'N/A';
  return value.toLocaleString('vi-VN') + 'đ';
};

const clearSelection = () => {
  selectedTableIds.value = [];
  customerName.value = '';
  guestCount.value = 0;
};

const handleCheckIn = async () => {
  if (selectedTableIds.value.length === 0) {
    alert('Vui lòng chọn bàn');
    return;
  }

  if (!customerName.value || !customerName.value.trim()) {
    alert('Vui lòng nhập tên khách');
    return;
  }

  if (!guestCount.value || guestCount.value < 1) {
    alert('Vui lòng nhập số khách hợp lệ');
    return;
  }

  // This should never happen because button is disabled, but just in case
  if (guestCount.value > totalCapacity.value) {
    alert(`Số khách vượt quá sức chứa. Tối đa ${totalCapacity.value} chỗ`);
    return;
  }

  submitting.value = true;
  try {
    const response = await walkInService.checkIn({
      tableIds: selectedTableIds.value,
      guestCount: guestCount.value,
      customerName: customerName.value.trim()
    });

    alert(`${response.message}\nMã hóa đơn: ${response.invoiceCode}`);
    
    clearSelection();
    await loadTables();
  } catch (error: any) {
    console.error('Check-in error:', error);
    alert(error.response?.data?.message || 'Không thể check-in');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.walk-in-container {
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'Inter', 'Be Vietnam Pro', sans-serif;
}

.header-section {
  margin-bottom: 32px;
}

.header-section h2 {
  font-size: 34px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 20px 0;
}

/* Search and Guest Count Row */
.search-guest-row {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
  margin-bottom: 24px;
}

.search-box-inline,
.guest-count-inline {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 10px;
}

.search-input-inline,
.guest-count-input-inline {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  color: #0f172a;
  transition: all 0.3s;
  background: white;
  box-sizing: border-box;
}

.search-input-inline:focus,
.guest-count-input-inline:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input-inline::placeholder,
.guest-count-input-inline::placeholder {
  color: #94a3b8;
  font-weight: 500;
}

.recommendation-badge {
  margin-top: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #10b981;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #065f46;
}

@media (max-width: 1024px) {
  .search-guest-row {
    grid-template-columns: 1fr;
  }
}

.search-box {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 14px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  color: #0f172a;
  transition: all 0.3s;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08);
}

.search-input::placeholder {
  color: #94a3b8;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.stat-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #94a3b8;
}

.stat-item.available {
  border-left-color: #10b981;
}

.stat-item.in-use {
  border-left-color: #f43f5e;
}

.stat-item.reserved {
  border-left-color: #eab308;
}

.stat-item.overtime {
  border-left-color: #fb923c;
}

.stat-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: #64748b;
  font-size: 16px;
}

/* Content Wrapper */
.content-wrapper {
  display: flex;
  gap: 24px;
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  flex: 1;
}

@media (max-width: 1400px) {
  .tables-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1024px) {
  .tables-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .tables-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-wrapper.has-form {
    flex-direction: column;
  }
}

.table-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 3px solid transparent;
}

.table-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.table-card.available {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.table-card.in-use {
  border-color: #f43f5e;
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
  cursor: pointer;
}

.table-card.reserved {
  border-color: #eab308;
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
  cursor: pointer;
}

.table-card.overtime {
  border-color: #fb923c;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  cursor: pointer;
}

.table-card.out-of-service {
  border-color: #94a3b8;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  opacity: 0.6;
  cursor: not-allowed;
}

.table-card.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2), 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

/* Smart Table Suggestion Styles */
.table-card.recommended {
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3), 0 8px 24px rgba(16, 185, 129, 0.2);
  animation: recommendedGlow 2s ease-in-out infinite;
}

@keyframes recommendedGlow {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3), 0 8px 24px rgba(16, 185, 129, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.4), 0 12px 32px rgba(16, 185, 129, 0.3);
  }
}

.table-card.recommended:hover {
  transform: translateY(-6px);
  box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.4), 0 12px 32px rgba(16, 185, 129, 0.3);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-number {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.table-capacity {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.table-customer-name {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  background: rgba(59, 130, 246, 0.15);
  padding: 4px 8px;
  border-radius: 6px;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.table-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.table-capacity-small {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}

.table-status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
}

.status-available {
  background: #10b981;
  color: white;
}

.status-in-use {
  background: #f43f5e;
  color: white;
}

.status-reserved {
  background: #eab308;
  color: white;
}

.status-out {
  background: #94a3b8;
  color: white;
}

.status-overtime {
  background: #fb923c;
  color: white;
}

.table-time {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-top: 8px;
}

.selected-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Check-in Sidebar */
.check-in-sidebar {
  width: 380px;
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  height: fit-content;
  position: sticky;
  top: 20px;
  animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.sidebar-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 24px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.required-mark {
  color: #f43f5e;
  font-weight: 700;
  margin-left: 2px;
}

.selected-tables {
  padding: 10px 14px;
  background: #f0f9ff;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.capacity-info {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0fdf4;
  border: 1px solid #10b981;
  border-radius: 6px;
  font-size: 13px;
  color: #065f46;
  transition: all 0.3s;
}

.capacity-info.capacity-error {
  background: #fff1f2;
  border-color: #f43f5e;
  color: #be123c;
}

.capacity-info strong {
  color: #047857;
  font-weight: 800;
}

.capacity-info.capacity-error strong {
  color: #be123c;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: #0f172a;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.input-error {
  border-color: #f43f5e;
  background: #fff1f2;
}

.form-input.input-error:focus {
  border-color: #f43f5e;
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.1);
}

.error-message {
  margin-top: 6px;
  padding: 8px 12px;
  background: #fff1f2;
  border: 1px solid #f43f5e;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #be123c;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}

.action-btn {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.check-in {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.action-btn.check-in:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.action-btn.secondary {
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}

.action-btn.secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

.status-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-badge.available {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.occupied,
.status-badge.in_use {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.reserved {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.overtime {
  background: #fb923c;
  color: white;
}

.status-badge.cleaning {
  background: #e0e7ff;
  color: #3730a3;
}

.status-badge.out_of_service {
  background: #f3f4f6;
  color: #6b7280;
}

.text-warning {
  color: #f97316 !important;
  font-weight: 700 !important;
}

.text-primary {
  color: #10b981;
  font-size: 16px;
}

.overtime-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  background: #fb923c;
  color: white;
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

/* Modal Footer */
.modal-footer {
  padding: 20px 28px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  display: flex;
  justify-content: center;
}

.cancel-table-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #f43f5e 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);
}

.cancel-table-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(244, 63, 94, 0.4);
}

/* Confirmation Modal */
.confirm-modal {
  background: white;
  border-radius: 16px;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

.confirm-header {
  padding: 24px 28px;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.confirm-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #92400e;
}

.confirm-body {
  padding: 24px 28px;
}

.confirm-body p {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #1e293b;
  line-height: 1.6;
}

.confirm-body p:last-child {
  margin-bottom: 0;
}

.confirm-warning {
  color: #dc2626;
  font-weight: 600;
}

.confirm-actions {
  padding: 20px 28px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.confirm-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.confirm-btn.secondary {
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}

.confirm-btn.secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.confirm-btn.danger {
  background: linear-gradient(135deg, #f43f5e 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);
}

.confirm-btn.danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(244, 63, 94, 0.4);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .tables-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tables-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
