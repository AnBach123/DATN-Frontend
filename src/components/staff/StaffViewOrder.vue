<template>
  <div class="container">
    <!-- ALERT -->
    <div class="mb-4">
      <OvertimeAlertPanel />
      <NoShowNotificationPanel />
    </div>

    <!-- HEADER -->
    <div class="header">
      <h2>Quản lý món theo bàn</h2>
      <button class="refresh-btn" @click="fetchData">
        <span>Reload</span>
      </button>
    </div>

    <!-- CARDS GRID -->
    <div v-if="tables.length > 0" class="cards-grid">
      <div v-for="table in tables" :key="table.tableId" class="table-card">
        <!-- CARD HEADER -->
        <div class="card-header">
          <h3>{{ table.tableName }}</h3>
        </div>

        <!-- CARD BODY -->
        <div class="card-body">
          <div class="info-row">
            <span class="label">Khách hàng:</span>
            <span class="value">{{ table.customerName || 'Khách vãng lai' }}</span>
          </div>

          <div class="info-row">
            <span class="label">Số khách:</span>
            <span class="value">{{ table.guestCount || 0 }} người</span>
          </div>

          <div class="info-row">
            <span class="label">Số món:</span>
            <span class="value">{{ table.items.length }} món</span>
          </div>

          <div class="info-row total">
            <span class="label">Tổng bill:</span>
            <span class="value">{{ formatCurrency(table.totalAmount) }}</span>
          </div>
        </div>

        <!-- CARD FOOTER -->
        <div class="card-footer">
          <button class="btn-detail" @click="openDetailModal(table)">
            <span>Xem chi tiết & Thao tác</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty">
      <p>Không có bàn nào đang có món</p>
    </div>

    <!-- DETAIL MODAL -->
    <div v-if="selectedTable" class="modal-overlay" @click="closeDetailModal">
      <div class="modal-content" @click.stop>
        <!-- MODAL HEADER -->
        <div class="modal-header">
          <h3>{{ selectedTable.tableName }} - Chi tiết món</h3>
          <button class="btn-close" @click="closeDetailModal">×</button>
        </div>

        <!-- MODAL BODY -->
        <div class="modal-body">
          <!-- TABLE INFO -->
          <div class="table-info-section">
            <div class="info-item">
              <span class="info-label">Khách hàng:</span>
              <span class="info-value">{{ selectedTable.customerName || 'Khách vãng lai' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Số khách:</span>
              <span class="info-value">{{ selectedTable.guestCount || 0 }} người</span>
            </div>
            <div class="info-item">
              <span class="info-label">Tổng bill:</span>
              <span class="info-value highlight">{{ formatCurrency(selectedTable.totalAmount) }}</span>
            </div>
          </div>

          <!-- ITEMS LIST -->
          <div class="items-section">
            <h4>Danh sách món ({{ selectedTable.items.length }})</h4>
            <div class="items-list">
              <div v-for="item in selectedTable.items" :key="item.id" class="item-row">
                <div class="item-info">
                  <div class="item-name">{{ item.itemName }}</div>
                  <div class="item-meta">
                    <span class="qty">SL: {{ item.quantity }}</span>
                    <span :class="['badge', item.status.toLowerCase()]">
                      {{ formatStatus(item.status) }}
                    </span>
                  </div>
                </div>

                <div class="item-actions">
                  <!-- SERVED -->
                  <button
                    v-if="item.status === 'DONE'"
                    class="btn serve"
                    @click="handleServe(item.id)"
                  >
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

                  <span v-if="item.status === 'SERVED'" class="done-text">Đã phục vụ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getKitchenGrouped, serveItem, cancelItem } from '@/services/kitchenApi'
import OvertimeAlertPanel from './OvertimeAlertPanel.vue'
import NoShowNotificationPanel from './NoShowNotificationPanel.vue'
import Swal from 'sweetalert2'

interface Item {
  id: number
  itemName: string
  quantity: number
  status: string
}

interface Table {
  tableId: number
  tableName: string
  customerName: string
  guestCount: number
  totalAmount: number
  items: Item[]
}

const tables = ref<Table[]>([])
const selectedTable = ref<Table | null>(null)

async function fetchData() {
  try {
    const data = await getKitchenGrouped()
    tables.value = data
  } catch (e) {
    console.error(e)
  }
}

function openDetailModal(table: Table) {
  selectedTable.value = table
}

function closeDetailModal() {
  selectedTable.value = null
}

async function handleServe(id: number) {
  try {
    await serveItem(id)
    await fetchData()
    // Update selectedTable nếu đang mở
    if (selectedTable.value) {
      const updated = tables.value.find((t) => t.tableId === selectedTable.value!.tableId)
      if (updated) selectedTable.value = updated
    }
  } catch (e) {
    console.error(e)
  }
}

async function handleCancel(id: number) {
  // Tìm item trong selectedTable
  let item: Item | undefined
  if (selectedTable.value) {
    item = selectedTable.value.items.find((i) => i.id === id)
  }

  if (!item) return

  // Nếu quantity = 1 → hủy toàn bộ
  if (item.quantity === 1) {
    const result = await Swal.fire({
      title: 'Xác nhận hủy món?',
      text: `Bạn có chắc muốn hủy món "${item.itemName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#718096',
      confirmButtonText: 'Hủy món',
      cancelButtonText: 'Không',
    })

    if (!result.isConfirmed) return

    try {
      await cancelItem(id)
      await fetchData()
      // Update selectedTable
      if (selectedTable.value) {
        const updated = tables.value.find((t) => t.tableId === selectedTable.value!.tableId)
        if (updated) selectedTable.value = updated
      }
      Swal.fire('Đã hủy!', 'Món đã được hủy thành công', 'success')
    } catch (e) {
      console.error(e)
      Swal.fire('Lỗi!', 'Không thể hủy món', 'error')
    }
    return
  }

  // Nếu quantity > 1 → cho phép chọn số lượng
  const result = await Swal.fire({
    title: `Hủy món "${item.itemName}"`,
    html: `
      <div style="text-align: left; margin-bottom: 16px;">
        <p style="margin-bottom: 8px;">Số lượng hiện tại: <strong>${item.quantity}</strong></p>
        <label for="quantity-input" style="display: block; margin-bottom: 4px;">Số lượng muốn hủy:</label>
        <input 
          id="quantity-input" 
          type="number" 
          min="1" 
          max="${item.quantity}" 
          value="${item.quantity}"
          class="swal2-input" 
          style="width: 100%; margin: 0;"
        />
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e53e3e',
    cancelButtonColor: '#718096',
    confirmButtonText: 'Hủy món',
    cancelButtonText: 'Không',
    preConfirm: () => {
      const input = document.getElementById('quantity-input') as HTMLInputElement
      const value = parseInt(input.value)

      if (isNaN(value) || value < 1) {
        Swal.showValidationMessage('Số lượng phải >= 1')
        return false
      }

      if (value > item.quantity) {
        Swal.showValidationMessage(`Số lượng không được vượt quá ${item.quantity}`)
        return false
      }

      return value
    },
  })

  if (!result.isConfirmed || !result.value) return

  const quantityToCancel = result.value

  try {
    await cancelItem(id, quantityToCancel)
    await fetchData()
    // Update selectedTable
    if (selectedTable.value) {
      const updated = tables.value.find((t) => t.tableId === selectedTable.value!.tableId)
      if (updated) selectedTable.value = updated
    }

    if (quantityToCancel >= item.quantity) {
      Swal.fire('Đã hủy!', 'Món đã được hủy toàn bộ', 'success')
    } else {
      Swal.fire(
        'Đã hủy!',
        `Đã hủy ${quantityToCancel} món. Còn lại ${item.quantity - quantityToCancel} món.`,
        'success',
      )
    }
  } catch (e) {
    console.error(e)
    Swal.fire('Lỗi!', 'Không thể hủy món', 'error')
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0)
}

onMounted(fetchData)
</script>

<style scoped>
.container {
  padding: 24px;
  min-height: 100vh;
  background: #f5f7fa;
}

.mb-4 {
  margin-bottom: 1rem;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  margin-bottom: 28px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e293b;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.refresh-btn .icon {
  font-size: 1.1rem;
}

/* CARDS GRID */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

/* TABLE CARD */
.table-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.table-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* CARD HEADER */
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.table-icon {
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.card-header h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* CARD BODY */
.card-body {
  padding: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row.total {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 2px solid #e2e8f0;
  border-bottom: none;
}

.info-row .label {
  font-size: 0.95rem;
  color: #64748b;
  font-weight: 500;
}

.info-row .value {
  font-size: 1rem;
  color: #1e293b;
  font-weight: 600;
}

.info-row.total .value {
  font-size: 1.25rem;
  color: #667eea;
  font-weight: 700;
}

/* CARD FOOTER */
.card-footer {
  padding: 16px 24px 20px;
}

.btn-detail {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-detail:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-detail .icon {
  font-size: 1.1rem;
}

/* EMPTY STATE */
.empty {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty p {
  margin: 0;
  color: #64748b;
  font-size: 1.125rem;
  font-weight: 500;
}

/* MODAL */
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: 28px;
  overflow-y: auto;
  flex: 1;
}

/* TABLE INFO SECTION */
.table-info-section {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.info-item:not(:last-child) {
  border-bottom: 1px solid #e2e8f0;
}

.info-label {
  font-size: 0.95rem;
  color: #64748b;
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: #1e293b;
  font-weight: 600;
}

.info-value.highlight {
  font-size: 1.25rem;
  color: #667eea;
  font-weight: 700;
}

/* ITEMS SECTION */
.items-section h4 {
  margin: 0 0 16px 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.item-row:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-weight: 600;
  font-size: 1rem;
  color: #1e293b;
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qty {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* STATUS BADGE */
.badge {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge.ordered {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.badge.in_progress {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.badge.done {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.badge.served {
  background: linear-gradient(135deg, #64748b, #475569);
  color: white;
}

.badge.cancelled {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

/* ITEM ACTIONS */
.item-actions {
  display: flex;
  align-items: center;
  margin-left: 16px;
}

/* BUTTONS */
.btn {
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn.serve {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.btn.cancel {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.done-text {
  color: #22c55e;
  font-weight: 600;
  font-size: 0.875rem;
}

/* SCROLLBAR */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    max-width: 100%;
    max-height: 95vh;
  }

  .item-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .item-actions {
    width: 100%;
    margin-left: 0;
  }

  .btn {
    width: 100%;
  }
}
</style>
