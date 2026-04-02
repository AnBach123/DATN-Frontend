<template>
  <div class="container">
    <div class="table-wrapper">
      <!-- HEADER -->
      <div class="header">
        <h2>Danh sách món của bàn</h2>
        <button class="refresh-btn" @click="fetchData">🔄 Reload</button>
      </div>

      <!-- TABLE HEADER -->
      <div class="table header-row">
        <div class="col name">Tên món</div>
        <div class="col qty">Số lượng</div>
        <div class="col table-row">Bàn</div>
        <div class="col status">Trạng thái</div>
        <div class="col action">Hành động</div>
      </div>

      <!-- DATA -->
      <div v-for="item in items" :key="item.id" class="table row">
        <div class="col name">{{ item.itemName }}</div>
        <div class="col qty">{{ item.quantity }}</div>
        <div class="col table">{{ item.tableName }}</div>

        <div class="col status">
          <span :class="['badge', item.status.toLowerCase()]">
            {{ formatStatus(item.status) }}
          </span>
        </div>

        <div class="col action">
          <!-- SERVED -->
          <button v-if="item.status === 'DONE'" class="btn serve" @click="handleServe(item.id)">
            PHỤC VỤ
          </button>

          <!-- CANCEL -->
          <button
            v-if="item.status === 'ORDERED'"
            class="btn cancel"
            @click="handleCancel(item.id)"
          >
            HỦY
          </button>

          <span v-if="item.status === 'SERVED'" class="done-text">✔ Đã phục vụ</span>
        </div>
      </div>

      <div v-if="items.length === 0" class="empty">Không có dữ liệu</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getKitchenGrouped, serveItem, cancelItem } from '@/services/kitchenApi'

interface Item {
  id: number
  itemName: string
  quantity: number
  tableName: string
  status: string
}

const items = ref<Item[]>([])

async function fetchData() {
  try {
    const data = await getKitchenGrouped()

    // flatten từ table -> list
    const flat: Item[] = []

    data.forEach((table: any) => {
      table.items.forEach((i: any) => {
        flat.push({
          id: i.id,
          itemName: i.itemName,
          quantity: i.quantity,
          tableName: table.tableName,
          status: i.status,
        })
      })
    })

    items.value = flat
  } catch (e) {
    console.error(e)
  }
}

async function handleServe(id: number) {
  try {
    await serveItem(id)
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

async function handleCancel(id: number) {
  if (!confirm('Xác nhận hủy món?')) return
  try {
    await cancelItem(id)
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    ORDERED: 'ĐÃ ORDER',
    IN_PROGRESS: 'ĐANG LÀM',
    DONE: 'HOÀN THÀNH',
    SERVED: 'ĐÃ PHỤC VỤ',
    CANCELLED: 'ĐÃ HỦY',
  }
  return map[status] || status
}

onMounted(fetchData)
</script>

<style scoped>
.container {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
}
/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 20px 24px; /* 🔥 thêm padding */

  border-bottom: 1px solid #e2e8f0; /* 🔥 phân tách */

  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.refresh-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
}

/* TABLE */
.table {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.header-row {
  font-weight: 700;

  padding: 14px 16px;

  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;

  font-size: 13px;
  letter-spacing: 0.3px;
}

/* COL */
.col {
  font-size: 14px;
  padding: 4px 8px; /* 🔥 cực quan trọng để không bị lệch */
}

/* STATUS */
.badge {
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 1.2em;
  font-weight: 500;
}

/* ORDERED - vàng đậm */
.badge.ordered {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

/* IN_PROGRESS - xanh dương */
.badge.in_progress {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

/* DONE - xanh lá */
.badge.done {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

/* SERVED - xám đậm */
.badge.served {
  background: linear-gradient(135deg, #64748b, #475569);
}

/* CANCELLED - đỏ */
.badge.cancelled {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

/* BUTTON */
.btn {
  padding: 8px 2.5em;
  border-radius: 12px;

  font-size: 1em;
  font-weight: 600;

  border: none;
  cursor: pointer;

  transition: all 0.25s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.btn.serve {
  background: linear-gradient(135deg, #38a169, #2f855a);
  color: white;
}

.btn.cancel {
  background: linear-gradient(135deg, #e53e3e, #c53030);
  color: white;
}

.done-text {
  color: #38a169;
  font-weight: 600;
}

/* EMPTY */
.empty {
  text-align: center;
  padding: 20px;
  color: #718096;
}

.table-wrapper {
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);

  border-radius: 20px; /* 🔥 bo tròn hơn */
  border: 1px solid rgba(0, 0, 0, 0.05); /* 🔥 viền nhẹ */

  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.04);

  overflow: hidden;

  max-height: 75vh;
  display: flex;
  flex-direction: column;
}

/* scroll nếu dài */
.table-wrapper {
  max-height: 70vh;
  overflow-y: auto;
}

.table.row {
  padding: 14px 16px; /* 🔥 tăng spacing */
  transition: all 0.2s ease;
}

.table.row:hover {
  background: rgba(102, 126, 234, 0.06);
}

.empty {
  text-align: center;
  padding: 30px;
  color: #718096;
  font-style: italic;
}
</style>
