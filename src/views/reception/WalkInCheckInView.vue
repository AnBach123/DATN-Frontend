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
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      Đang tải...
    </div>

    <div v-else class="content-grid">
      <!-- Tables Grid -->
      <div class="tables-grid">
        <div
          v-for="table in tables"
          :key="table.id"
          class="table-card"
          :class="getTableClass(table)"
          @click="toggleTableSelection(table)"
        >
          <div class="table-header">
            <div class="table-number">#{{ table.id }}</div>
            <div class="table-capacity">{{ table.capacity }} chỗ</div>
          </div>
          <div class="table-name">{{ table.name }}</div>
          <div class="table-status-badge" :class="getStatusClass(table)">
            {{ getStatusText(table) }}
          </div>
          <div v-if="table.minutesSinceCheckIn !== null && table.minutesSinceCheckIn !== undefined" class="table-time">
            {{ table.minutesSinceCheckIn }} phút
          </div>
          <div v-if="selectedTableIds.includes(table.id)" class="selected-badge">✓</div>
        </div>
      </div>

      <!-- Check-in Form (Sticky) -->
      <div v-if="selectedTableIds.length > 0" class="form-section">
        <h3>Thông tin check-in</h3>
        
        <div class="form-group">
          <label>Bàn đã chọn</label>
          <div class="selected-tables">
            {{ selectedTableNames.join(' + ') }}
          </div>
        </div>

        <div class="form-group">
          <label>Số khách</label>
          <input
            v-model.number="guestCount"
            type="number"
            class="form-input"
            placeholder="Nhập số khách"
            min="1"
          />
        </div>

        <div class="form-actions">
          <button class="action-btn secondary" @click="clearSelection">Hủy</button>
          <button 
            class="action-btn check-in" 
            @click="handleCheckIn"
            :disabled="submitting || !guestCount || guestCount < 1"
          >
            {{ submitting ? 'Đang xử lý...' : 'Check-in' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { tableService, type TableStatus } from '@/services/tableService';
import { walkInService } from '@/services/walkInService';

const tables = ref<TableStatus[]>([]);
const selectedTableIds = ref<number[]>([]);
const guestCount = ref<number>(1);
const loading = ref(false);
const submitting = ref(false);

const availableCount = computed(() => 
  tables.value.filter(t => t.status === 'AVAILABLE').length
);

const inUseCount = computed(() => 
  tables.value.filter(t => t.status === 'IN_USE' || t.status === 'OCCUPIED').length
);

const reservedCount = computed(() => 
  tables.value.filter(t => t.status === 'RESERVED').length
);

const selectedTableNames = computed(() => {
  return tables.value
    .filter(t => selectedTableIds.value.includes(t.id))
    .map(t => t.name);
});

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
    'out-of-service': table.status === 'OUT_OF_SERVICE',
    'selected': selectedTableIds.value.includes(table.id)
  };
  return classes;
};

const getStatusClass = (table: TableStatus) => {
  const statusMap: Record<string, string> = {
    'AVAILABLE': 'status-available',
    'IN_USE': 'status-in-use',
    'OCCUPIED': 'status-in-use',
    'RESERVED': 'status-reserved',
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
    'OUT_OF_SERVICE': 'Ngừng phục vụ'
  };
  return textMap[table.status] || table.status;
};

const toggleTableSelection = (table: TableStatus) => {
  if (table.status !== 'AVAILABLE') {
    alert(`Bàn ${table.name} đang ${getStatusText(table).toLowerCase()}`);
    return;
  }

  const index = selectedTableIds.value.indexOf(table.id);
  if (index > -1) {
    selectedTableIds.value.splice(index, 1);
  } else {
    selectedTableIds.value.push(table.id);
  }
};

const clearSelection = () => {
  selectedTableIds.value = [];
  guestCount.value = 1;
};

const handleCheckIn = async () => {
  if (selectedTableIds.value.length === 0) {
    alert('Vui lòng chọn bàn');
    return;
  }

  if (!guestCount.value || guestCount.value < 1) {
    alert('Vui lòng nhập số khách hợp lệ');
    return;
  }

  submitting.value = true;
  try {
    const response = await walkInService.checkIn({
      tableIds: selectedTableIds.value,
      guestCount: guestCount.value
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

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  border-left-color: #f59e0b;
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

.content-grid {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.table-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
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
  opacity: 0.6;
  cursor: not-allowed;
}

.table-card.reserved {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  opacity: 0.6;
  cursor: not-allowed;
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

.table-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
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
  background: #f59e0b;
  color: white;
}

.status-out {
  background: #94a3b8;
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

.form-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  height: fit-content;
  position: sticky;
  top: 24px;
}

.form-section h3 {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 20px 0;
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

.selected-tables {
  padding: 12px 16px;
  background: #f0f9ff;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  transition: all 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
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

@media (max-width: 1200px) {
  .tables-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .tables-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}
</style>
