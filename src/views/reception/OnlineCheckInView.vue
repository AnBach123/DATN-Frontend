<template>
  <div class="online-checkin-container">
    <div class="header-section">
      <h2>Check-in Đặt bàn Online</h2>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        :class="['tab-btn', { active: activeTab === 'reserved' }]"
        @click="activeTab = 'reserved'"
      >
        Đã xác nhận ({{ allReservations.length }})
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'pending' }]"
        @click="activeTab = 'pending'"
      >
        Chờ xác nhận ({{ pendingReservations.length }})
      </button>
    </div>

    <!-- Search Section (only for reserved tab) -->
    <div v-if="activeTab === 'reserved'" class="filters-section">
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
    <div v-if="searched && activeTab === 'reserved'" class="table-container mb-4">
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
            <td @click="showDetail(reservation)"><strong class="phone-number">{{ reservation.guestPhone || reservation.phoneNumber }}</strong></td>
            <td @click="showDetail(reservation)">{{ reservation.guestName || reservation.fullName }}</td>
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

    <!-- Pending Confirmation Table -->
    <div v-if="activeTab === 'pending'" class="table-container mb-4">
      <div class="table-header">
        <h5>Đặt bàn chờ xác nhận ({{ pendingReservations.length }})</h5>
      </div>

      <div v-if="pendingReservations.length === 0" class="empty-state">
        Không có đặt bàn nào đang chờ xác nhận
      </div>

      <table v-else class="reservation-table">
        <thead>
          <tr>
            <th>Số điện thoại</th>
            <th>Tên khách hàng</th>
            <th>Thời gian đặt</th>
            <th>Số khách</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="reservation in pendingReservations" 
            :key="reservation.invoiceId"
            class="clickable-row pending-row"
          >
            <td @click="showDetail(reservation)"><strong class="phone-number">{{ reservation.guestPhone || reservation.phoneNumber }}</strong></td>
            <td @click="showDetail(reservation)">{{ reservation.guestName || reservation.fullName }}</td>
            <td @click="showDetail(reservation)">{{ formatDateTime(reservation.reservedAt) }}</td>
            <td @click="showDetail(reservation)">{{ reservation.guestCount }} người</td>
            <td>
              <div class="action-buttons">
                <button 
                  class="action-btn confirm-btn"
                  @click.stop="showConfirmModal(reservation)"
                  :disabled="actionLoading[reservation.invoiceId]"
                >
                  <span v-if="actionLoading[reservation.invoiceId]" class="spinner-border spinner-border-sm me-1"></span>
                  Xác nhận
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

    <!-- All Reservations Section (only for reserved tab) -->
    <div v-if="activeTab === 'reserved'" class="table-container">
      <div class="table-header">
        <h5>Tất cả đặt bàn đã xác nhận ({{ allReservations.length }})</h5>
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
            <td @click="showDetail(reservation)"><strong class="phone-number">{{ reservation.guestPhone || reservation.phoneNumber }}</strong></td>
            <td @click="showDetail(reservation)">{{ reservation.guestName || reservation.fullName }}</td>
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
              <span class="detail-value">{{ selectedReservation.guestName || selectedReservation.fullName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Số điện thoại</span>
              <span class="detail-value">{{ selectedReservation.guestPhone || selectedReservation.phoneNumber }}</span>
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
            <div v-if="selectedReservation.foodNote" class="detail-row full-width">
              <span class="detail-label">Món đặt trước</span>
              <div class="food-note-box">
                <div 
                  v-for="(item, index) in parseFoodNote(selectedReservation.foodNote)" 
                  :key="index"
                  class="food-item"
                >
                  <span class="bullet">•</span>
                  <span class="food-text">{{ item }}</span>
                </div>
              </div>
            </div>
            <div v-if="selectedReservation.tables && selectedReservation.tables.length > 0" class="detail-row full-width">
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
            <div v-if="selectedReservation.invoiceStatus === 'PENDING_CONFIRMATION'" class="detail-row full-width">
              <div class="pending-status-notice">
                <div class="notice-icon">⏳</div>
                <div class="notice-text">
                  <strong>Đang chờ xác nhận</strong>
                  <p>Đặt bàn này chưa được xếp bàn. Vui lòng gọi xác nhận với khách hàng.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="detail-footer">
          <button class="btn-secondary" @click="closeDetail">Đóng</button>
          <button 
            v-if="selectedReservation && selectedReservation.invoiceStatus === 'PENDING_CONFIRMATION'"
            class="action-btn confirm-btn"
            @click="showConfirmModal(selectedReservation)"
            :disabled="actionLoading[selectedReservation.invoiceId]"
          >
            <span v-if="actionLoading[selectedReservation.invoiceId]" class="spinner-border spinner-border-sm me-1"></span>
            Xác nhận
          </button>
          <button 
            v-if="selectedReservation && selectedReservation.invoiceStatus === 'RESERVED'"
            class="action-btn change-table-btn"
            @click="showTableChangeModalForReservation(selectedReservation)"
            :disabled="actionLoading[selectedReservation.invoiceId]"
          >
            <span v-if="actionLoading[selectedReservation.invoiceId]" class="spinner-border spinner-border-sm me-1"></span>
            Chuyển bàn khác
          </button>
          <button 
            v-if="selectedReservation && selectedReservation.invoiceStatus === 'RESERVED'"
            class="action-btn checkin-btn"
            @click="handleCheckIn(selectedReservation)"
            :disabled="actionLoading[selectedReservation.invoiceId]"
          >
            <span v-if="actionLoading[selectedReservation.invoiceId]" class="spinner-border spinner-border-sm me-1"></span>
            Check-in
          </button>
          <button
            v-if="selectedReservation && (selectedReservation.invoiceStatus === 'PENDING_CONFIRMATION' || selectedReservation.invoiceStatus === 'RESERVED')"
            class="action-btn cancel-btn"
            @click="handleCancel(selectedReservation)"
            :disabled="actionLoading[selectedReservation.invoiceId]"
          >
            <span v-if="actionLoading[selectedReservation.invoiceId]" class="spinner-border spinner-border-sm me-1"></span>
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

    <!-- Table Change Modal -->
    <div v-if="showTableChangeModal" class="detail-modal" @click.self="closeTableChangeModal">
      <div class="table-change-card">
        <div class="detail-header">
          <h5>Chọn bàn thay thế</h5>
          <button class="btn-close" @click="closeTableChangeModal"></button>
        </div>
        
        <!-- Guest Count Info -->
        <div v-if="selectedReservation" class="guest-count-info">
          <span class="guest-count-text">
            Số khách: <strong>{{ selectedReservation.guestCount }} người</strong>
          </span>
          <span class="capacity-divider">|</span>
          <span class="selected-capacity-text">
            Sức chứa đã chọn: <strong :class="getCapacityClass()">{{ selectedTablesCapacity }} chỗ</strong>
          </span>
        </div>
        
        <div class="table-change-body">
          <div v-if="loadingAlternatives" class="loading-state">
            <span class="spinner-border spinner-border-lg"></span>
            <p>Đang tìm bàn trống...</p>
          </div>

          <div v-else-if="alternativeTables.length === 0" class="empty-state">
            Không có bàn trống phù hợp
          </div>

          <div v-else class="tables-by-area">
            <div 
              v-for="(tables, area) in tablesByArea" 
              :key="area"
              class="area-group"
            >
              <div class="area-header">
                <div class="area-title">Khu vực {{ area }}</div>
                <div class="area-capacity">Tổng: {{ getAreaTotalCapacity(tables) }} chỗ</div>
              </div>
              <div class="area-tables">
                <div 
                  v-for="table in tables" 
                  :key="table.id"
                  :class="['table-card', { 
                    selected: selectedTableIds.includes(table.id),
                    'current-table': selectedReservation?.tables?.some(t => t.id === table.id)
                  }]"
                  @click="toggleTableSelection(table.id)"
                >
                  <div class="table-id">#{{ table.id }}</div>
                  <div class="table-info">
                    <div class="table-name">{{ table.tableName }}</div>
                    <div class="table-capacity">{{ table.seatingCapacity }} chỗ</div>
                    <div v-if="selectedReservation?.tables?.some(t => t.id === table.id)" class="current-badge">
                      Đang xếp
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-footer">
          <button class="btn-secondary" @click="closeTableChangeModal">Hủy</button>
          <button 
            class="action-btn confirm-btn"
            @click="confirmTableChange"
            :disabled="selectedTableIds.length === 0 || loadingAlternatives"
          >
            Xác nhận chuyển bàn
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { reservationService, type ReservationInfo, type TableInfo } from '@/services/reservationService';
import { ReservationWebSocket } from '@/services/websocket/ReservationWebSocket';

const activeTab = ref<'reserved' | 'pending'>('reserved');
const searchPhone = ref('');
const loading = ref(false);
const searched = ref(false);
const reservations = ref<ReservationInfo[]>([]);
const allReservations = ref<ReservationInfo[]>([]);
const pendingReservations = ref<ReservationInfo[]>([]);
const actionLoading = reactive<Record<number, boolean>>({});

const showDetailModal = ref(false);
const selectedReservation = ref<ReservationInfo | null>(null);
const showCancelConfirm = ref(false);
const reservationToCancel = ref<ReservationInfo | null>(null);

// Table change modal states
const showTableChangeModal = ref(false);
const alternativeTables = ref<TableInfo[]>([]);
const selectedTableIds = ref<number[]>([]);
const loadingAlternatives = ref(false);

let wsClient: ReservationWebSocket | null = null;

onMounted(() => {
  loadAllReservations();
  loadPendingReservations();
  
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
  loadPendingReservations();
};

const loadAllReservations = async () => {
  try {
    allReservations.value = await reservationService.getAllReservedReservations();
  } catch (error: any) {
    console.error('Load all reservations error:', error);
  }
};

const loadPendingReservations = async () => {
  try {
    pendingReservations.value = await reservationService.getPendingConfirmationReservations();
  } catch (error: any) {
    console.error('Load pending reservations error:', error);
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

const showConfirmModal = async (reservation: ReservationInfo) => {
  if (!confirm(`Xác nhận đặt bàn ${reservation.reservationCode}? Hệ thống sẽ tự động xếp bàn tốt nhất.`)) {
    return;
  }

  actionLoading[reservation.invoiceId] = true;
  
  try {
    await reservationService.confirmReservation(reservation.reservationCode);
    alert('Đã xác nhận đặt bàn thành công!');
    
    // Close modal if open
    closeDetail();
    
    // Reload data
    await loadAllReservations();
    await loadPendingReservations();
  } catch (error: any) {
    console.error('Confirm error:', error);
    alert(error.response?.data?.message || 'Lỗi khi xác nhận đặt bàn');
  } finally {
    actionLoading[reservation.invoiceId] = false;
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
    await loadPendingReservations();
    
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
    await loadPendingReservations();
    
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

const parseFoodNote = (note: string): string[] => {
  if (!note) return [];
  // Split by comma and clean up each item
  return note.split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
};

const showTableChangeModalForReservation = async (reservation: ReservationInfo) => {
  if (!reservation || reservation.invoiceStatus !== 'RESERVED') {
    alert('Chỉ có thể đổi bàn cho đặt bàn đã xác nhận');
    return;
  }

  loadingAlternatives.value = true;
  showTableChangeModal.value = true;
  alternativeTables.value = [];
  selectedTableIds.value = [];

  try {
    const tables = await reservationService.getAlternativeTables(reservation.reservationCode);
    alternativeTables.value = tables;
    
    // Pre-select current tables
    if (reservation.tables && reservation.tables.length > 0) {
      selectedTableIds.value = reservation.tables.map(t => t.id);
    }
    
    if (tables.length === 0) {
      alert('Không có bàn trống phù hợp');
      showTableChangeModal.value = false;
    }
  } catch (error: any) {
    console.error('Load alternatives error:', error);
    alert(error.response?.data?.message || 'Lỗi khi tải danh sách bàn trống');
    showTableChangeModal.value = false;
  } finally {
    loadingAlternatives.value = false;
  }
};

const closeTableChangeModal = () => {
  showTableChangeModal.value = false;
  alternativeTables.value = [];
  selectedTableIds.value = [];
};

const toggleTableSelection = (tableId: number) => {
  const index = selectedTableIds.value.indexOf(tableId);
  if (index > -1) {
    selectedTableIds.value.splice(index, 1);
  } else {
    selectedTableIds.value.push(tableId);
  }
};

const confirmTableChange = async () => {
  if (!selectedReservation.value || selectedTableIds.value.length === 0) {
    alert('Vui lòng chọn ít nhất một bàn');
    return;
  }

  const invoiceId = selectedReservation.value.invoiceId;
  actionLoading[invoiceId] = true;
  
  try {
    await reservationService.reassignTables(selectedReservation.value.reservationCode, selectedTableIds.value);
    
    // Close modals first
    closeTableChangeModal();
    closeDetail();
    
    // Reload data
    await Promise.all([
      loadAllReservations(),
      loadPendingReservations(),
      searched.value ? handleSearch() : Promise.resolve()
    ]);
    
    alert('Đã chuyển bàn thành công!');
  } catch (error: any) {
    console.error('Reassign tables error:', error);
    alert(error.response?.data?.message || 'Lỗi khi chuyển bàn');
  } finally {
    actionLoading[invoiceId] = false;
  }
};

const getTotalCapacity = (tables: TableInfo[]): number => {
  return tables.reduce((sum, table) => sum + table.seatingCapacity, 0);
};

// Computed property to group tables by area
const tablesByArea = computed(() => {
  const grouped: Record<string, TableInfo[]> = {};
  
  alternativeTables.value.forEach(table => {
    const area = (table as any).area || 'Không xác định';
    if (!grouped[area]) {
      grouped[area] = [];
    }
    grouped[area].push(table);
  });
  
  return grouped;
});

// Computed property to calculate total capacity of selected tables
const selectedTablesCapacity = computed(() => {
  return alternativeTables.value
    .filter(table => selectedTableIds.value.includes(table.id))
    .reduce((sum, table) => sum + table.seatingCapacity, 0);
});

// Function to get capacity class based on comparison with guest count
const getCapacityClass = () => {
  if (selectedTableIds.value.length === 0) {
    return 'capacity-none';
  }
  
  const guestCount = selectedReservation.value?.guestCount || 0;
  const capacity = selectedTablesCapacity.value;
  
  if (capacity < guestCount) {
    return 'capacity-insufficient'; // Red - not enough
  } else if (capacity >= guestCount) {
    return 'capacity-sufficient'; // Green - enough
  }
  
  return 'capacity-none';
};

// Function to calculate total capacity for an area
const getAreaTotalCapacity = (tables: TableInfo[]): number => {
  return tables.reduce((sum, table) => sum + table.seatingCapacity, 0);
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

.food-note-box {
  padding: 10px 20px;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border-left: 4px solid #f97316;
  border-radius: 13px;
  box-shadow: 0 4px 7px rgba(249, 115, 22, 0.1);
}

.food-text {
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.6;
  flex: 1;
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

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.tab-btn {
  flex: 1;
  padding: 14px 24px;
  background: white;
  color: #64748b;
  font-weight: 700;
  font-size: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* Pending Row Highlight */
.pending-row {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%) !important;
}

.pending-row:hover {
  background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%) !important;
}

/* Confirm Button */
.confirm-btn {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(37, 99, 235, 0.85) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}

/* Area Selection Modal */
.area-modal-card {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.area-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.area-modal-header h5 {
  margin: 0;
  font-weight: 800;
  font-size: 20px;
  color: #111827;
}

.area-modal-body {
  padding: 24px 32px;
  background: #fafbfc;
}

.area-instruction {
  font-size: 15px;
  color: #6b7280;
  font-weight: 500;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.area-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.area-btn {
  padding: 20px;
  background: white;
  color: #64748b;
  font-weight: 700;
  font-size: 18px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.area-btn:hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.area-btn.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.error-message {
  padding: 12px 16px;
  background: #fee2e2;
  border-left: 4px solid #ef4444;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
  font-weight: 600;
}

.area-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 32px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.area-modal-footer .btn-secondary {
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

.area-modal-footer .btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.area-modal-footer .btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 700;
  font-size: 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.area-modal-footer .btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.area-modal-footer .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Pending Status Notice in Detail Modal */
.pending-status-notice {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 16px 20px;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border-left: 4px solid #f97316;
  border-radius: 12px;
}

.pending-status-notice .notice-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.pending-status-notice .notice-text {
  flex: 1;
}

.pending-status-notice .notice-text strong {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.pending-status-notice .notice-text p {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

/* Change Table Button */
.change-table-btn {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.85) 0%, rgba(124, 58, 237, 0.85) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.25);
}

.change-table-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.95) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35);
}

/* Table Change Modal */
.table-change-card {
  width: 100%;
  max-width: 700px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

/* Guest Count Info */
.guest-count-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 32px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-bottom: 2px solid #3b82f6;
}

.guest-count-text {
  font-size: 15px;
  color: #1e293b;
  font-weight: 600;
}

.guest-count-text strong {
  color: #0369a1;
  font-size: 17px;
  font-weight: 800;
}

.capacity-divider {
  color: #94a3b8;
  font-size: 18px;
  font-weight: 300;
}

.selected-capacity-text {
  font-size: 15px;
  color: #1e293b;
  font-weight: 600;
}

.selected-capacity-text strong {
  font-size: 17px;
  font-weight: 800;
}

.selected-capacity-text strong.capacity-none {
  color: #64748b;
}

.selected-capacity-text strong.capacity-insufficient {
  color: #dc2626;
}

.selected-capacity-text strong.capacity-sufficient {
  color: #16a34a;
}

.table-change-body {
  padding: 24px 32px;
  max-height: 60vh;
  overflow-y: auto;
  background: #fafbfc;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
}

.loading-state .spinner-border-lg {
  width: 3rem;
  height: 3rem;
  border-width: 0.3em;
}

.loading-state p {
  font-size: 15px;
  color: #6b7280;
  font-weight: 600;
  margin: 0;
}

.alternatives-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alternative-option {
  padding: 20px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.alternative-option:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  transform: translateY(-2px);
}

.alternative-option.selected {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.option-radio {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-radio input[type="radio"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #8b5cf6;
}

.option-radio label {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  cursor: pointer;
  margin: 0;
}

.option-capacity {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  padding: 6px 12px;
  background: #f1f5f9;
  border-radius: 8px;
}

.option-tables {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.table-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border: 2px solid #818cf8;
  border-radius: 10px;
}

.table-badge .table-id {
  font-size: 18px;
  font-weight: 800;
  color: #6366f1;
  min-width: 35px;
}

.table-badge .table-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.table-badge .table-name {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.table-badge .table-capacity {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

/* Tables by area styles */
.tables-by-area {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.area-group {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid #e2e8f0;
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

.area-title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
}

.area-capacity {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  padding: 6px 12px;
  background: #f1f5f9;
  border-radius: 8px;
}

.area-tables {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.table-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.table-card:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  transform: translateY(-2px);
}

.table-card.selected {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
}

.table-card.current-table {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.table-card.current-table.selected {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
}

.table-card .table-id {
  font-size: 18px;
  font-weight: 800;
  color: #6366f1;
  min-width: 35px;
}

.table-card.current-table .table-id {
  color: #10b981;
}

.table-card.current-table.selected .table-id {
  color: #8b5cf6;
}

.table-card .table-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.table-card .table-name {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.table-card .table-capacity {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.current-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Tab navigation styles */
.tab-navigation {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  background: white;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tab-btn {
  flex: 1;
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.confirm-btn {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.85) 0%, rgba(124, 58, 237, 0.85) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.25);
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.95) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35);
}

.change-table-btn {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(37, 99, 235, 0.85) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.change-table-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}

</style>
