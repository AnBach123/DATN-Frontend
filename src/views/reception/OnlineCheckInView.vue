<template>
  <div class="online-checkin-container">
    <div class="header-section">
      <h2>Check-in Đặt bàn Online</h2>
    </div>

    <!-- Search Section -->
    <div class="filters-section">
      <div class="filter-row">
        <input
          v-model="searchPhone"
          type="text"
          class="search-input"
          placeholder="Nhập số điện thoại (10 số)"
          maxlength="10"
          @keyup.enter="handleSearch"
        />
        <button 
          class="search-btn" 
          @click="handleSearch"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          Tìm kiếm
        </button>
      </div>
    </div>

    <!-- Search Results Section -->
    <div v-if="searched" class="table-container mb-4">
      <div class="table-header">
        <h5>Kết quả tìm kiếm ({{ reservations.length }})</h5>
      </div>
      
      <div v-if="reservations.length === 0" class="empty-state">
        Không tìm thấy đặt bàn nào với số điện thoại này
      </div>

      <table v-else class="reservation-table">
        <thead>
          <tr>
            <th>Số điện thoại</th>
            <th>Tên khách hàng</th>
            <th>Thời gian đặt</th>
            <th>Số khách</th>
            <th>Bàn</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="reservation in reservations" 
            :key="reservation.invoiceId"
            class="clickable-row"
          >
            <td @click="showDetail(reservation)"><strong class="phone-number">{{ reservation.phoneNumber }}</strong></td>
            <td @click="showDetail(reservation)">{{ reservation.fullName }}</td>
            <td @click="showDetail(reservation)">{{ formatDateTime(reservation.reservedAt) }}</td>
            <td @click="showDetail(reservation)">{{ reservation.guestCount }} người</td>
            <td @click="showDetail(reservation)">
              <span 
                v-for="table in reservation.tables" 
                :key="table.id"
                class="table-name"
              >
                {{ table.tableName }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button 
                  class="action-btn checkin-btn"
                  @click.stop="handleCheckIn(reservation)"
                  :disabled="actionLoading[reservation.invoiceId]"
                >
                  <span v-if="actionLoading[reservation.invoiceId]" class="spinner-border spinner-border-sm me-1"></span>
                  Check-in
                </button>
                <button
                  class="action-btn cancel-btn"
                  @click.stop="handleCancel(reservation)"
                  :disabled="actionLoading[reservation.invoiceId]"
                >
                  <span v-if="actionLoading[reservation.invoiceId]" class="spinner-border spinner-border-sm me-1"></span>
                  Hủy
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- All Reservations Section -->
    <div class="table-container">
      <div class="table-header">
        <h5>Tất cả đặt bàn ({{ allReservations.length }})</h5>
      </div>

      <div v-if="allReservations.length === 0" class="empty-state">
        Không có đặt bàn nào
      </div>

      <table v-else class="reservation-table">
        <thead>
          <tr>
            <th>Số điện thoại</th>
            <th>Tên khách hàng</th>
            <th>Thời gian đặt</th>
            <th>Số khách</th>
            <th>Bàn</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="reservation in allReservations" 
            :key="reservation.invoiceId"
            class="clickable-row"
          >
            <td @click="showDetail(reservation)"><strong class="phone-number">{{ reservation.phoneNumber }}</strong></td>
            <td @click="showDetail(reservation)">{{ reservation.fullName }}</td>
            <td @click="showDetail(reservation)">{{ formatDateTime(reservation.reservedAt) }}</td>
            <td @click="showDetail(reservation)">{{ reservation.guestCount }} người</td>
            <td @click="showDetail(reservation)">
              <span 
                v-for="table in reservation.tables" 
                :key="table.id"
                class="table-name"
              >
                {{ table.tableName }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button 
                  class="action-btn checkin-btn"
                  @click.stop="handleCheckIn(reservation)"
                  :disabled="actionLoading[reservation.invoiceId]"
                >
                  <span v-if="actionLoading[reservation.invoiceId]" class="spinner-border spinner-border-sm me-1"></span>
                  Check-in
                </button>
                <button
                  class="action-btn cancel-btn"
                  @click.stop="handleCancel(reservation)"
                  :disabled="actionLoading[reservation.invoiceId]"
                >
                  <span v-if="actionLoading[reservation.invoiceId]" class="spinner-border spinner-border-sm me-1"></span>
                  Hủy
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetailModal" class="detail-modal" @click.self="closeDetail">
      <div class="detail-card">
        <div class="detail-header">
          <h5>Chi tiết đặt bàn</h5>
          <button class="btn-close" @click="closeDetail"></button>
        </div>
        <div class="detail-body" v-if="selectedReservation">
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">Mã đặt bàn</span>
              <span class="detail-value">{{ selectedReservation.reservationCode }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Tên khách</span>
              <span class="detail-value">{{ selectedReservation.fullName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Số điện thoại</span>
              <span class="detail-value">{{ selectedReservation.phoneNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Tổng khách</span>
              <span class="detail-value">{{ selectedReservation.guestCount }} khách</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Ngày & giờ đến</span>
              <span class="detail-value">{{ formatDateTime(selectedReservation.reservedAt) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Ưu đãi</span>
              <span class="detail-value">{{ selectedReservation.promotionType }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Ghi chú khách</span>
              <span class="detail-value">{{ selectedReservation.note }}</span>
            </div>
            <div class="detail-row full-width">
              <span class="detail-label">Bàn đã xếp</span>
              <div class="table-list">
                <div 
                  v-for="table in selectedReservation.tables" 
                  :key="table.id"
                  class="table-detail-badge"
                >
                  <div class="table-id">#{{ table.id }}</div>
                  <div class="table-info">
                    <div class="table-name">{{ table.tableName }}</div>
                    <div class="table-capacity">{{ table.seatingCapacity }} chỗ ngồi</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="detail-footer">
          <button class="btn-secondary" @click="closeDetail">Đóng</button>
          <button 
            class="action-btn checkin-btn"
            @click="selectedReservation && handleCheckIn(selectedReservation)"
            :disabled="!selectedReservation || actionLoading[selectedReservation.invoiceId]"
          >
            <span v-if="selectedReservation && actionLoading[selectedReservation.invoiceId]" class="spinner-border spinner-border-sm me-1"></span>
            Check-in
          </button>
          <button
            class="action-btn cancel-btn"
            @click="selectedReservation && handleCancel(selectedReservation)"
            :disabled="!selectedReservation || actionLoading[selectedReservation.invoiceId]"
          >
            <span v-if="selectedReservation && actionLoading[selectedReservation.invoiceId]" class="spinner-border spinner-border-sm me-1"></span>
            Hủy đặt bàn
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div v-if="showCancelConfirm" class="detail-modal" @click.self="closeCancelConfirm">
      <div class="confirm-card">
        <div class="confirm-icon">⚠️</div>
        <h5 class="confirm-title">Xác nhận hủy đặt bàn</h5>
        <p class="confirm-message">
          Bạn có chắc chắn muốn hủy đặt bàn này?
        </p>
        <div class="confirm-actions">
          <button class="btn-cancel-action" @click="closeCancelConfirm">Không</button>
          <button class="btn-confirm-action" @click="confirmCancel">Xác nhận hủy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { reservationService, type ReservationInfo } from '@/services/reservationService';
import { ReservationWebSocket } from '@/services/websocket/ReservationWebSocket';

const searchPhone = ref('');
const loading = ref(false);
const searched = ref(false);
const reservations = ref<ReservationInfo[]>([]);
const allReservations = ref<ReservationInfo[]>([]);
const actionLoading = reactive<Record<number, boolean>>({});

const showDetailModal = ref(false);
const selectedReservation = ref<ReservationInfo | null>(null);
const showCancelConfirm = ref(false);
const reservationToCancel = ref<ReservationInfo | null>(null);

let wsClient: ReservationWebSocket | null = null;

onMounted(() => {
  loadAllReservations();
  
  // Connect WebSocket
  const token = localStorage.getItem('accessToken');
  if (token) {
    wsClient = new ReservationWebSocket(import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws');
    wsClient.connect(token, handleTableStatusUpdate);
  }
});

onUnmounted(() => {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
});

const handleTableStatusUpdate = () => {
  // Reload all reservations when table status changes
  loadAllReservations();
};

const loadAllReservations = async () => {
  try {
    allReservations.value = await reservationService.getAllReservedReservations();
  } catch (error: any) {
    console.error('Load all reservations error:', error);
  }
};

const showDetail = (reservation: ReservationInfo) => {
  selectedReservation.value = reservation;
  showDetailModal.value = true;
};

const closeDetail = () => {
  showDetailModal.value = false;
  selectedReservation.value = null;
};

const handleSearch = async () => {
  if (!searchPhone.value || searchPhone.value.trim().length !== 10) {
    alert('Vui lòng nhập số điện thoại hợp lệ (10 số)');
    return;
  }

  loading.value = true;
  searched.value = false;
  
  try {
    reservations.value = await reservationService.searchByPhoneNumber(searchPhone.value.trim());
    searched.value = true;
  } catch (error: any) {
    console.error('Search error:', error);
    alert(error.response?.data?.message || 'Lỗi khi tìm kiếm đặt bàn');
    reservations.value = [];
    searched.value = true;
  } finally {
    loading.value = false;
  }
};

const handleCheckIn = async (reservation: ReservationInfo) => {
  if (!confirm(`Xác nhận check-in cho đặt bàn ${reservation.reservationCode}?`)) {
    return;
  }

  actionLoading[reservation.invoiceId] = true;
  
  try {
    await reservationService.checkInReservation(reservation.reservationCode);
    alert('Check-in thành công!');
    
    // Close modal if open
    closeDetail();
    
    // Reload immediately
    await loadAllReservations();
    
    // Also refresh search if active
    if (searched.value) {
      await handleSearch();
    }
  } catch (error: any) {
    console.error('Check-in error:', error);
    alert(error.response?.data?.message || 'Lỗi khi check-in');
  } finally {
    actionLoading[reservation.invoiceId] = false;
  }
};

const handleCancel = async (reservation: ReservationInfo) => {
  reservationToCancel.value = reservation;
  showCancelConfirm.value = true;
};

const confirmCancel = async () => {
  if (!reservationToCancel.value) return;
  
  const reservation = reservationToCancel.value;
  actionLoading[reservation.invoiceId] = true;
  showCancelConfirm.value = false;
  
  try {
    await reservationService.cancelReservation(reservation.invoiceId);
    alert('Đã hủy đặt bàn thành công!');
    
    // Close modal if open
    closeDetail();
    
    // Reload immediately
    await loadAllReservations();
    
    // Also refresh search if active
    if (searched.value) {
      await handleSearch();
    }
  } catch (error: any) {
    console.error('Cancel error:', error);
    alert(error.response?.data?.message || 'Lỗi khi hủy đặt bàn');
  } finally {
    actionLoading[reservation.invoiceId] = false;
    reservationToCancel.value = null;
  }
};

const closeCancelConfirm = () => {
  showCancelConfirm.value = false;
  reservationToCancel.value = null;
};

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

</script>

<style scoped>
.online-checkin-container {
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', 'Be Vietnam Pro', sans-serif;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h2 {
  font-size: 34px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.filters-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  transition: all 0.3s;
}

.search-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-btn {
  padding: 10px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.search-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.table-header {
  padding: 18px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.table-header h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #718096;
  font-style: italic;
}

.reservation-table {
  width: 100%;
  border-collapse: collapse;
}

.reservation-table thead {
  background: #f7fafc;
}

.reservation-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 700;
  font-size: 14px;
  color: #334155;
}

.reservation-table tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.reservation-table tbody tr.clickable-row {
  cursor: default;
}

.reservation-table tbody tr.clickable-row td:not(:last-child) {
  cursor: pointer;
}

.reservation-table tbody tr.clickable-row:hover {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);
  transform: translateY(-1px);
}

.reservation-table td {
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.phone-number {
  font-size: 16px;
  color: #667eea;
  font-weight: 800;
}

.table-name {
  display: inline-block;
  color: #64748b;
  font-size: 15px;
  font-weight: 600;
  margin-right: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.checkin-btn {
  background: linear-gradient(135deg, rgba(72, 187, 120, 0.85) 0%, rgba(56, 161, 105, 0.85) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(72, 187, 120, 0.25);
}

.checkin-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(72, 187, 120, 0.95) 0%, rgba(56, 161, 105, 0.95) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.35);
}

.cancel-btn {
  background: linear-gradient(135deg, rgba(245, 101, 101, 0.85) 0%, rgba(229, 62, 62, 0.85) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(245, 101, 101, 0.25);
}

.cancel-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(245, 101, 101, 0.95) 0%, rgba(229, 62, 62, 0.95) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.35);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Detail Modal */
.detail-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}

.detail-card {
  width: 100%;
  max-width: 650px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.3s ease;
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

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.detail-header h5 {
  margin: 0;
  font-weight: 800;
  font-size: 22px;
  color: #111827;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #374151;
  transform: scale(1.1);
}

.btn-close::before {
  content: '×';
}

.detail-body {
  padding: 24px 32px;
  max-height: 70vh;
  overflow-y: auto;
  background: #fafbfc;
}

.detail-grid {
  display: grid;
  gap: 12px;
}

.detail-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 16px;
  font-size: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #e8ecf0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row.full-width {
  grid-template-columns: 1fr;
  border-bottom: none;
  padding-bottom: 0;
}

.detail-row.full-width .detail-label {
  margin-bottom: 12px;
}

.detail-label {
  color: #6b7280;
  font-weight: 600;
}

.detail-value {
  color: #111827;
  font-weight: 700;
}

.table-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-detail-badge {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border: 2px solid #818cf8;
  border-radius: 12px;
}

.table-id {
  font-size: 22px;
  font-weight: 800;
  color: #6366f1;
  min-width: 45px;
}

.table-info {
  flex: 1;
}

.table-info .table-name {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2px;
}

.table-info .table-capacity {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 32px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.detail-footer .btn-secondary {
  padding: 12px 24px;
  background: white;
  color: #6b7280;
  font-weight: 700;
  font-size: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.detail-footer .btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

/* Cancel Confirmation Modal */
.confirm-card {
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  padding: 32px;
  text-align: center;
  animation: slideUp 0.3s ease;
}

.confirm-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.confirm-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px 0;
}

.confirm-message {
  font-size: 15px;
  color: #64748b;
  font-weight: 500;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel-action {
  padding: 12px 32px;
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
  font-size: 15px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel-action:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.btn-confirm-action {
  padding: 12px 32px;
  background: #ef4444;
  color: white;
  font-weight: 600;
  font-size: 15px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm-action:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.detail-footer .action-btn {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.detail-footer .checkin-btn {
  background: #10b981;
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.detail-footer .checkin-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.detail-footer .cancel-btn {
  background: #ef4444;
  color: white;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.detail-footer .cancel-btn:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.detail-footer .action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>
