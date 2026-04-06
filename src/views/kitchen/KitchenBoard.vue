<template>
  <div class="kitchen-container">
    <!-- HEADER -->
    <div class="header">
      <h2>Bếp - Quản lý món</h2>
      <div class="header-actions">
        <button class="refresh-btn" @click="fetchKitchen">Reload</button>
        <button class="logout-btn" @click="logout">Đăng xuất</button>
      </div>
    </div>

    <!-- 2 COLUMNS LAYOUT -->
    <div class="columns-layout">
      <!-- LEFT COLUMN: ORDERED (Chưa làm) - Grid cards by table -->
      <div class="column">
        <div class="column-header ordered">
          <h3>Chưa làm</h3>
          <span class="count">{{ orderedTables.length }} bàn</span>
        </div>
        <div class="column-body">
          <div v-if="orderedTables.length > 0" class="tables-grid">
            <div v-for="table in orderedTables" :key="table.tableId" class="table-grid-card">
              <div class="grid-card-header ordered-header">
                <span class="table-name">{{ table.tableName }}</span>
                <span class="item-count">{{ table.items.length }} món</span>
              </div>
              <div class="grid-card-body">
                <div v-for="item in table.items" :key="item.id" class="grid-item">
                  <div class="grid-item-name">{{ item.itemName }}</div>
                  <div class="grid-item-footer">
                    <span class="grid-item-qty">SL: {{ item.quantity }}</span>
                    <button class="btn-grid btn-start" @click="handleStart(item.id)">
                      Thực hiện
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty">Không có bàn nào</div>
        </div>
      </div>

      <!-- RIGHT COLUMN: IN_PROGRESS (Đang làm) - Grid cards -->
      <div class="column">
        <div class="column-header in-progress">
          <h3>Đang làm</h3>
          <span class="count">{{ inProgressTables.length }} bàn</span>
        </div>
        <div class="column-body">
          <div v-if="inProgressTables.length > 0" class="tables-grid">
            <div v-for="table in inProgressTables" :key="table.tableId" class="table-grid-card">
              <div class="grid-card-header in-progress">
                <span class="table-name">{{ table.tableName }}</span>
                <span class="item-count">{{ table.items.length }} món</span>
              </div>
              <div class="grid-card-body">
                <div v-for="item in table.items" :key="item.id" class="grid-item">
                  <div class="grid-item-name">{{ item.itemName }}</div>
                  <div class="grid-item-footer">
                    <span class="grid-item-qty">SL: {{ item.quantity }}</span>
                    <button class="btn-grid btn-done" @click="handleDone(item.id)">
                      Hoàn thành
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty">Không có bàn nào</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getKitchenGrouped, startCooking, doneCooking } from '@/services/kitchenApi'
import router from '@/router'

interface KitchenItem {
  id: number
  itemName: string
  quantity: number
  status: string
}

interface KitchenTable {
  tableId: number
  tableName: string
  items: KitchenItem[]
}

const tables = ref<KitchenTable[]>([])

// Computed: Bàn có món ORDERED (chưa làm)
const orderedTables = computed((): KitchenTable[] => {
  return tables.value
    .map((table) => ({
      ...table,
      items: table.items.filter((item) => item.status === 'ORDERED'),
    }))
    .filter((table) => table.items.length > 0)
})

// Computed: Bàn có món IN_PROGRESS (đang làm)
const inProgressTables = computed((): KitchenTable[] => {
  return tables.value
    .map((table) => ({
      ...table,
      items: table.items.filter((item) => item.status === 'IN_PROGRESS'),
    }))
    .filter((table) => table.items.length > 0)
})

async function fetchKitchen() {
  try {
    const data = await getKitchenGrouped()
    tables.value = data
  } catch (e) {
    console.error(e)
  }
}

async function handleStart(id: number) {
  try {
    await startCooking(id)
    await fetchKitchen()
  } catch (e) {
    console.error(e)
  }
}

async function handleDone(id: number) {
  try {
    await doneCooking(id)
    await fetchKitchen()
  } catch (e) {
    console.error(e)
  }
}

function logout() {
  localStorage.clear()
  router.push('/auth/login')
}

onMounted(fetchKitchen)
</script>

<style scoped>
.kitchen-container {
  padding: 16px;
  min-height: 100vh;
  background: #f8f9fa;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.refresh-btn,
.logout-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.refresh-btn {
  background: #0d6efd;
  color: white;
}

.refresh-btn:hover {
  background: #0b5ed7;
}

.logout-btn {
  background: #dc3545;
  color: white;
}

.logout-btn:hover {
  background: #bb2d3b;
}

/* 2 COLUMNS LAYOUT */
.columns-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

/* COLUMN */
.column {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.column-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-weight: 500;
}

.column-header.ordered {
  background: #fd7e14;
}

.column-header.in-progress {
  background: #0d6efd;
}

.column-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.column-body {
  padding: 12px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

/* TABLES GRID (Both columns - grid cards) */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.table-grid-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s;
}

.table-grid-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.grid-card-header {
  color: white;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.grid-card-header.ordered-header {
  background: #fd7e14;
}

.grid-card-header.in-progress {
  background: #0d6efd;
}

.grid-card-header .table-name {
  font-weight: 600;
}

.grid-card-header .item-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.grid-card-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grid-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 8px;
}

.grid-item-name {
  font-weight: 500;
  font-size: 0.875rem;
  color: #212529;
  margin-bottom: 6px;
}

.grid-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.grid-item-qty {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

.btn-grid {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-grid:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.btn-grid.btn-start {
  background: #fd7e14;
  color: white;
}

.btn-grid.btn-start:hover {
  background: #e8590c;
}

.btn-grid.btn-done {
  background: #198754;
  color: white;
}

.btn-grid.btn-done:hover {
  background: #157347;
}

/* EMPTY STATE */
.empty {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  font-size: 0.875rem;
}

/* SCROLLBAR */
.column-body::-webkit-scrollbar {
  width: 6px;
}

.column-body::-webkit-scrollbar-track {
  background: #f8f9fa;
}

.column-body::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 3px;
}

.column-body::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

/* RESPONSIVE */
@media (max-width: 1024px) {
  .columns-layout {
    grid-template-columns: 1fr;
  }

  .column-body {
    max-height: 500px;
  }

  .tables-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
  }

  .refresh-btn,
  .logout-btn {
    flex: 1;
  }

  .tables-grid {
    grid-template-columns: 1fr;
  }
}
</style>
