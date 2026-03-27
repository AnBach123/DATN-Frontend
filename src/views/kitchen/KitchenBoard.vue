<template>
  <div class="kitchen-container">
    <!-- HEADER -->
    <div class="header-section">
      <div>
        <h2>ByHat</h2>
      </div>

      <!-- <button class="refresh-btn" @click="fetchKitchen">🔄 Reload</button> -->
      <button class="logout-btn" @click="logout">Đăng xuất</button>
    </div>

    <!-- GRID 2 COLUMN -->
    <div class="grid-container">
      <!-- ORDERED -->
      <div class="panel">
        <div class="panel-header ordered">DANH SÁCH ORDER</div>

        <div class="list">
          <!-- HEADER -->
          <div class="row header">
            <div class="col name">Tên món</div>
            <div class="col qty">SL</div>
            <div class="col table">Bàn</div>
            <div class="col action">Hành động</div>
          </div>

          <!-- DATA -->
          <div v-for="item in orderedItems" :key="item.id" class="row">
            <div class="col name">{{ item.itemName }}</div>
            <div class="col qty">{{ item.quantity }}</div>
            <div class="col table">{{ item.tableName }}</div>

            <div class="col action">
              <button class="btn primary" @click="handleStart(item.id)">Thực hiện</button>
            </div>
          </div>

          <div v-if="orderedItems.length === 0" class="empty">Không có món</div>
        </div>
      </div>

      <!-- IN_PROGRESS -->
      <div class="panel">
        <div class="panel-header progress">ĐANG THỰC HIỆN</div>

        <div class="list">
          <div class="row header">
            <div class="col name">Tên món</div>
            <div class="col qty">SL</div>
            <div class="col table">Bàn</div>
            <div class="col action">Hành động</div>
          </div>

          <div v-for="item in inProgressItems" :key="item.id" class="row">
            <div class="col name">{{ item.itemName }}</div>
            <div class="col qty">{{ item.quantity }}</div>
            <div class="col table">{{ item.tableName }}</div>

            <div class="col action">
              <button class="btn success" @click="handleDone(item.id)">Hoàn thành</button>
            </div>
          </div>

          <div v-if="inProgressItems.length === 0" class="empty">Không có món</div>
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
  tableName: string
}

const items = ref<KitchenItem[]>([])

/* ================= FETCH ================= */
async function fetchKitchen() {
  const data = await getKitchenGrouped()

  // flatten từ table -> items
  const flat: KitchenItem[] = []

  data.forEach((table: any) => {
    table.items.forEach((i: any) => {
      flat.push({
        ...i,
        tableName: table.tableName,
      })
    })
  })

  items.value = flat
}

/* ================= FILTER ================= */

const orderedItems = computed(() => items.value.filter((i) => i.status === 'ORDERED'))

const inProgressItems = computed(() => items.value.filter((i) => i.status === 'IN_PROGRESS'))

/* ================= ACTION ================= */

async function handleStart(id: number) {
  await startCooking(id)
  fetchKitchen()
}

async function handleDone(id: number) {
  await doneCooking(id)
  fetchKitchen()
}

/* ================= INIT ================= */
onMounted(fetchKitchen)

function logout() {
  localStorage.clear()
  router.push('/auth/login')
}
</script>

<style scoped>
.kitchen-container {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
}

/* HEADER */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-section h2 {
  margin: 0;
  color: #2d3748;
}

/* GRID */
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* PANEL */
.panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

/* HEADER PANEL */
.panel-header {
  height: 44px; /* 🔥 FIX chiều cao cố định */
  display: flex; /* 🔥 quan trọng */
  align-items: center; /* center dọc */
  justify-content: center; /* center ngang */

  font-size: 16px;
  font-weight: 700;
  color: white;

  border-radius: 12px;
}

.panel-header.ordered {
  background: linear-gradient(135deg, #ed8936, #dd6b20);
  text-align: center;
  letter-spacing: 0.5px;
}

.panel-header.progress {
  background: linear-gradient(135deg, #667eea, #764ba2);
  text-align: center;
  letter-spacing: 0.5px;
}

/* LIST */
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ROW */
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  transition: 0.2s;
}

.row:hover {
  background: rgba(102, 126, 234, 0.08);
}

.row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
}

.row.header {
  font-weight: 700;
  background: rgba(102, 126, 234, 0.1);
}

.col {
  flex: 1;
  display: flex; /* 🔥 thêm */
  align-items: center; /* 🔥 fix lệch dọc */
  font-size: 1em;
}

.col.name {
  font-weight: 600;
  color: #2d3748;
  justify-content: flex-start;
}

.col.qty,
.col.table {
  justify-content: center; /* 🔥 thay text-align */
}

.col.action {
  justify-content: flex-end; /* 🔥 thay text-align */
}

/* INFO */
.name {
  font-weight: 600;
  color: #2d3748;
}

.meta {
  font-size: 12px;
  color: #718096;
}

/* ACTION */
.actions {
  display: flex;
  gap: 6px;
}

/* BUTTON */
.btn {
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.btn.primary {
  background: #667eea;
  color: white;
}

.btn.success {
  background: #38a169;
  color: white;
}

.btn.danger {
  background: #e53e3e;
  color: white;
}

/* EMPTY */
.empty {
  text-align: center;
  color: #718096;
  padding: 10px;
}

/* REFRESH */
.logout-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
}
</style>
