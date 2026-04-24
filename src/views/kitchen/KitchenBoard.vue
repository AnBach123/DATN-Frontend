<template>
  <div class="kitchen-container">
    <!-- HEADER -->
    <div class="header">
      <h2>Bếp - Quản lý món</h2>
      <div class="header-actions">
        <button
          class="sound-btn"
          :class="{ muted: !soundEnabled }"
          @click="toggleSound"
          :title="soundEnabled ? 'Tắt âm báo' : 'Bật âm báo'"
        >
          {{ soundEnabled ? '🔔 Âm báo: Bật' : '🔕 Âm báo: Tắt' }}
        </button>
        <button class="logout-btn" @click="logout">Đăng xuất</button>
      </div>
    </div>

    <!-- CANCEL ITEM MODAL -->
    <div v-if="ENABLE_CANCEL_ITEM && cancelingItem" class="cancel-modal-backdrop" @click.self="closeCancel">
      <div class="cancel-modal">
        <div class="cancel-modal-header">
          <h3>Hủy món</h3>
          <button class="cancel-modal-close" @click="closeCancel">✕</button>
        </div>
        <div class="cancel-modal-body">
          <p class="cancel-modal-item">
            <strong>{{ cancelingItem.itemName }}</strong> × {{ cancelingItem.quantity }}
          </p>
          <p class="cancel-modal-hint">Chọn lý do để báo cho nhân viên phục vụ:</p>
          <div class="cancel-reasons">
            <button
              v-for="reason in CANCEL_REASONS"
              :key="reason"
              class="cancel-reason-btn"
              @click="confirmCancel(reason)"
            >{{ reason }}</button>
          </div>
        </div>
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
              <div class="grid-card-progress" :title="`${getProgress(table.tableId).done}/${getProgress(table.tableId).total} món đã xong`">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: getProgress(table.tableId).percent + '%' }"></div>
                </div>
                <span class="progress-text">
                  {{ getProgress(table.tableId).done }}/{{ getProgress(table.tableId).total }} xong
                </span>
              </div>
              <div class="grid-card-body">
                <div v-for="item in table.items" :key="item.id" class="grid-item" :class="[getAgeClass(item.orderedAt), { 'has-note': !!item.note }]">
                  <div class="grid-item-top">
                    <div class="grid-item-name">{{ item.itemName }}</div>
                    <div class="grid-item-qty-big">×{{ item.quantity }}</div>
                  </div>
                  <div v-if="item.note" class="grid-item-note">
                    <span class="note-icon">⚠️</span>
                    <span class="note-text">{{ item.note }}</span>
                  </div>
                  <div class="grid-item-footer">
                    <span class="grid-item-timer">
                      <span class="timer-dot"></span>
                      {{ formatElapsed(item.orderedAt) }}
                    </span>
                    <div class="grid-item-btns">
                      <button
                        v-if="ENABLE_CANCEL_ITEM"
                        class="btn-grid btn-cancel"
                        @click="openCancel(item)"
                        title="Hủy món (hết nguyên liệu, không làm được...)"
                      >Hủy</button>
                      <button class="btn-grid btn-start" @click="handleStart(item.id)">
                        Thực hiện
                      </button>
                    </div>
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
              <div class="grid-card-progress" :title="`${getProgress(table.tableId).done}/${getProgress(table.tableId).total} món đã xong`">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: getProgress(table.tableId).percent + '%' }"></div>
                </div>
                <span class="progress-text">
                  {{ getProgress(table.tableId).done }}/{{ getProgress(table.tableId).total }} xong
                </span>
              </div>
              <div class="grid-card-body">
                <div v-for="item in table.items" :key="item.id" class="grid-item" :class="[getAgeClass(item.orderedAt), { 'has-note': !!item.note }]">
                  <div class="grid-item-top">
                    <div class="grid-item-name">{{ item.itemName }}</div>
                    <div class="grid-item-qty-big">×{{ item.quantity }}</div>
                  </div>
                  <div v-if="item.note" class="grid-item-note">
                    <span class="note-icon">⚠️</span>
                    <span class="note-text">{{ item.note }}</span>
                  </div>
                  <div class="grid-item-footer">
                    <span class="grid-item-timer">
                      <span class="timer-dot"></span>
                      {{ formatElapsed(item.orderedAt) }}
                    </span>
                    <div class="grid-item-btns">
                      <button
                        v-if="ENABLE_CANCEL_ITEM"
                        class="btn-grid btn-cancel"
                        @click="openCancel(item)"
                        title="Hủy món (hết nguyên liệu, không làm được...)"
                      >Hủy</button>
                      <button class="btn-grid btn-done" @click="handleDone(item.id)">
                        Hoàn thành
                      </button>
                    </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getKitchenGrouped, startCooking, doneCooking, cancelItem } from '@/services/kitchenApi'
import { DashboardWebSocket } from '@/services/websocket/DashboardWebSocket'
import router from '@/router'

// ============================================================
// 🎛️  FEATURE FLAGS — bật/tắt tính năng ở đây
// ============================================================
// ENABLE_CANCEL_ITEM: cho phép bếp hủy món (hết nguyên liệu, không làm được...)
//   true  → hiện nút "Hủy món" trên mỗi item + popup chọn lý do
//   false → ẩn hoàn toàn nút, không ảnh hưởng logic khác
// Hệ thống hiện tại CHƯA quản lý kho nguyên liệu, nên nút này chỉ là
// công cụ giao tiếp thủ công bếp → staff. Nếu thấy chưa cần thì để false.
const ENABLE_CANCEL_ITEM = true
// ============================================================

interface KitchenItem {
  id: number
  itemName: string
  quantity: number
  status: string
  note?: string | null
  orderedAt?: string | null
}

interface KitchenTable {
  tableId: number
  tableName: string
  items: KitchenItem[]
}

const tables = ref<KitchenTable[]>([])

// Tick mỗi 15s để timer + màu age tự cập nhật (không cần reload API)
const now = ref(Date.now())
let tickInterval: number | null = null

// Âm báo khi có order mới — lưu preference vào localStorage
const soundEnabled = ref(localStorage.getItem('kitchen_sound') !== 'off')
let audioCtx: AudioContext | null = null

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  localStorage.setItem('kitchen_sound', soundEnabled.value ? 'on' : 'off')
  // Unlock AudioContext ngay khi user tương tác — tránh bị chặn autoplay
  if (soundEnabled.value) {
    playBeep()
  }
}

// Beep: 2 tiếng ngắn cao độ (880Hz + 1175Hz) để chú ý mà không khó chịu
function playBeep() {
  if (!soundEnabled.value) return
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      audioCtx = new AC()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    const tone = (freq: number, start: number, duration: number) => {
      const osc = audioCtx!.createOscillator()
      const gain = audioCtx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, audioCtx!.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.25, audioCtx!.currentTime + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx!.currentTime + start + duration)
      osc.connect(gain).connect(audioCtx!.destination)
      osc.start(audioCtx!.currentTime + start)
      osc.stop(audioCtx!.currentTime + start + duration)
    }
    tone(880, 0, 0.18)
    tone(1175, 0.22, 0.22)
  } catch (e) {
    console.warn('Không phát được âm báo:', e)
  }
}

// WebSocket instance
let wsClient: DashboardWebSocket | null = null

// Sort FIFO: món order trước lên đầu (oldest first). Món thiếu orderedAt đẩy xuống cuối.
function sortFifo(items: KitchenItem[]): KitchenItem[] {
  return [...items].sort((a, b) => {
    const ta = a.orderedAt ? new Date(a.orderedAt).getTime() : Number.MAX_SAFE_INTEGER
    const tb = b.orderedAt ? new Date(b.orderedAt).getTime() : Number.MAX_SAFE_INTEGER
    return ta - tb
  })
}

// Tính số phút đã chờ
function getElapsedMinutes(orderedAt?: string | null): number {
  if (!orderedAt) return 0
  const ms = now.value - new Date(orderedAt).getTime()
  return Math.max(0, Math.floor(ms / 60000))
}

// Text hiển thị: "vừa xong" / "3 phút" / "1 giờ 12 phút"
function formatElapsed(orderedAt?: string | null): string {
  if (!orderedAt) return '—'
  const mins = getElapsedMinutes(orderedAt)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins} phút`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`
}

// Color aging: xanh 0-5p, vàng 5-10p, đỏ 10p+
function getAgeClass(orderedAt?: string | null): string {
  if (!orderedAt) return 'age-unknown'
  const mins = getElapsedMinutes(orderedAt)
  if (mins < 5) return 'age-fresh'
  if (mins < 10) return 'age-warning'
  return 'age-urgent'
}

// Progress per bàn: đếm tổng và số DONE, tính %
// Dùng cho cả 2 cột để hiển thị "2/5 xong"
interface TableProgress { done: number; total: number; percent: number }
const progressByTable = computed((): Record<number, TableProgress> => {
  const map: Record<number, TableProgress> = {}
  for (const table of tables.value) {
    const total = table.items.length
    const done = table.items.filter((i) => i.status === 'DONE').length
    const percent = total > 0 ? Math.round((done / total) * 100) : 0
    map[table.tableId] = { done, total, percent }
  }
  return map
})

function getProgress(tableId: number): TableProgress {
  return progressByTable.value[tableId] || { done: 0, total: 0, percent: 0 }
}

// Sort bàn theo món cũ nhất trong bàn (bàn chờ lâu nhất lên đầu)
function sortTablesByOldestItem(tbls: KitchenTable[]): KitchenTable[] {
  return [...tbls].sort((a, b) => {
    const oldestA = a.items.reduce((min, it) => {
      const t = it.orderedAt ? new Date(it.orderedAt).getTime() : Number.MAX_SAFE_INTEGER
      return Math.min(min, t)
    }, Number.MAX_SAFE_INTEGER)
    const oldestB = b.items.reduce((min, it) => {
      const t = it.orderedAt ? new Date(it.orderedAt).getTime() : Number.MAX_SAFE_INTEGER
      return Math.min(min, t)
    }, Number.MAX_SAFE_INTEGER)
    return oldestA - oldestB
  })
}

// Computed: Bàn có món ORDERED (chưa làm) — items FIFO, tables sort theo món cũ nhất
const orderedTables = computed((): KitchenTable[] => {
  const filtered = tables.value
    .map((table) => ({
      ...table,
      items: sortFifo(table.items.filter((item) => item.status === 'ORDERED')),
    }))
    .filter((table) => table.items.length > 0)
  return sortTablesByOldestItem(filtered)
})

// Computed: Bàn có món IN_PROGRESS (đang làm) — items FIFO
const inProgressTables = computed((): KitchenTable[] => {
  const filtered = tables.value
    .map((table) => ({
      ...table,
      items: sortFifo(table.items.filter((item) => item.status === 'IN_PROGRESS')),
    }))
    .filter((table) => table.items.length > 0)
  return sortTablesByOldestItem(filtered)
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

// ===== HỦY MÓN =====
// cancelingItem giữ item đang chờ xác nhận hủy (null = không hiện popup)
const cancelingItem = ref<KitchenItem | null>(null)
const CANCEL_REASONS = [
  'Hết nguyên liệu',
  'Hết hàng',
  'Lý do khác',
]

function openCancel(item: KitchenItem) {
  cancelingItem.value = item
}

function closeCancel() {
  cancelingItem.value = null
}

async function confirmCancel(reason: string) {
  if (!cancelingItem.value) return
  const item = cancelingItem.value
  try {
    await cancelItem(item.id, undefined, reason)
    cancelingItem.value = null
    await fetchKitchen()
  } catch (e) {
    console.error('Hủy món thất bại:', e)
    const err = e as { response?: { data?: { message?: string } } }
    alert(err?.response?.data?.message || 'Hủy món thất bại')
  }
}

function logout() {
  localStorage.clear()
  router.push('/auth/login')
}

onMounted(() => {
  fetchKitchen()

  // Tick timer mỗi 15s để age color + elapsed text tự cập nhật
  tickInterval = window.setInterval(() => {
    now.value = Date.now()
  }, 15000)

  // Initialize WebSocket
  const token = localStorage.getItem('accessToken') || ''
  console.log('🔑 Kitchen - Token for WebSocket:', token ? 'Found' : 'Not found (dev mode)')
  
  const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'
  console.log('🌐 Kitchen WebSocket URL:', wsUrl)
  
  wsClient = new DashboardWebSocket(wsUrl)
  
  // Subscribe to kitchen updates BEFORE connecting
  wsClient.subscribeKitchenUpdates((update) => {
    console.log('📢 Kitchen update received:', update)
    // Beep khi có order mới — action bắt đầu bằng ITEMS_ORDERED
    if (update?.action && update.action.startsWith('ITEMS_ORDERED')) {
      playBeep()
    }
    // Refresh kitchen data when there's an update
    fetchKitchen()
  })
  
  // Connect to WebSocket
  console.log('🔌 Connecting to WebSocket...')
  wsClient.connect(token)
})

onUnmounted(() => {
  if (tickInterval !== null) {
    clearInterval(tickInterval)
    tickInterval = null
  }
  // Disconnect WebSocket
  if (wsClient) {
    wsClient.disconnect()
    wsClient = null
  }
})
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

.logout-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: #dc3545;
  color: white;
}

.logout-btn:hover {
  background: #bb2d3b;
}

.sound-btn {
  padding: 8px 14px;
  border: 1px solid #0d6efd;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  background: white;
  color: #0d6efd;
  transition: all 0.2s;
}

.sound-btn:hover {
  background: #e7f1ff;
}

.sound-btn.muted {
  border-color: #adb5bd;
  color: #6c757d;
}

.sound-btn.muted:hover {
  background: #f1f3f5;
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
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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
  font-size: 0.95rem;
}

.grid-card-header .item-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.grid-card-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f1f3f5;
  border-bottom: 1px solid #e9ecef;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #dee2e6;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #20c997, #0d9488);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.72rem;
  color: #495057;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
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
  border-radius: 6px;
  padding: 8px 10px;
  transition: all 0.2s ease;
}

/* AGE COLOR — ưu tiên làm món chờ lâu */
.grid-item.age-fresh {
  border-left: 4px solid #20c997;
}

.grid-item.age-warning {
  border-left: 4px solid #ffc107;
  background: #fffbea;
}

.grid-item.age-urgent {
  border-left: 4px solid #dc3545;
  background: #fff5f6;
  animation: pulseUrgent 2.5s ease-in-out infinite;
}

.grid-item.age-unknown {
  border-left: 4px solid #adb5bd;
}

@keyframes pulseUrgent {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.2); }
  50%      { box-shadow: 0 0 0 4px rgba(220, 53, 69, 0); }
}

.grid-item.has-note {
  border-color: #fd7e14;
  background: #fff8f1;
}

.grid-item.has-note.age-urgent {
  background: #fff5f6;
}

.grid-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
}

.grid-item-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1a202c;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
}

.grid-item-qty-big {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0d6efd;
  line-height: 1;
  flex-shrink: 0;
}

.grid-item.age-urgent .grid-item-qty-big {
  color: #dc3545;
}

.grid-item-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: #fff3cd;
  border-left: 3px solid #f59f00;
  padding: 5px 8px;
  border-radius: 3px;
  margin-bottom: 6px;
  font-size: 0.8rem;
  color: #704d00;
  line-height: 1.35;
  word-break: break-word;
  font-weight: 500;
}

.grid-item-note .note-icon {
  flex-shrink: 0;
  font-size: 0.85rem;
  line-height: 1;
}

.grid-item-note .note-text {
  font-weight: 500;
}

.grid-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.grid-item-timer {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: #495057;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.timer-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #20c997;
  flex-shrink: 0;
}

.grid-item.age-warning .timer-dot { background: #ffc107; }
.grid-item.age-warning .grid-item-timer { color: #7a5200; }
.grid-item.age-urgent .timer-dot { background: #dc3545; }
.grid-item.age-urgent .grid-item-timer { color: #a52834; font-weight: 600; }
.grid-item.age-unknown .timer-dot { background: #adb5bd; }

.btn-grid {
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-grid:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.btn-grid:active {
  transform: translateY(0);
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

.btn-grid.btn-cancel {
  background: white;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.btn-grid.btn-cancel:hover {
  background: #dc3545;
  color: white;
}

.grid-item-btns {
  display: flex;
  gap: 6px;
}

/* CANCEL MODAL */
.cancel-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.cancel-modal {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

.cancel-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #fff5f5;
  border-bottom: 1px solid #fecaca;
}

.cancel-modal-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #991b1b;
  font-weight: 600;
}

.cancel-modal-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #991b1b;
  padding: 4px 8px;
  border-radius: 4px;
}

.cancel-modal-close:hover {
  background: #fecaca;
}

.cancel-modal-body {
  padding: 16px 18px 18px;
}

.cancel-modal-item {
  margin: 0 0 10px;
  font-size: 0.95rem;
  color: #212529;
}

.cancel-modal-hint {
  margin: 0 0 12px;
  font-size: 0.82rem;
  color: #6c757d;
}

.cancel-reasons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cancel-reason-btn {
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  color: #212529;
  cursor: pointer;
  text-align: left;
  font-weight: 500;
  transition: all 0.15s ease;
}

.cancel-reason-btn:hover {
  border-color: #dc3545;
  background: #fff5f5;
  color: #991b1b;
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

  .logout-btn {
    width: 100%;
  }

  .tables-grid {
    grid-template-columns: 1fr;
  }
}
</style>
