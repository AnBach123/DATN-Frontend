<template>
  <div class="payment-container">
    <!-- Header and Search (hidden when in payment mode) -->
    <div v-if="!showPaymentForm" class="header-section">
      <h2>Thanh toán</h2>
    </div>

    <!-- Search by Table ID (hidden when in payment mode) -->
    <div v-if="!showPaymentForm" class="filters-section">
      <div class="filter-row">
        <input
          v-model.number="searchTableId"
          type="number"
          class="search-input"
          placeholder="Nhập ID bàn"
          min="1"
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

    <!-- Invoice List (shown when not in payment mode) -->
    <div v-if="!showPaymentForm" class="table-container">
      <div class="table-header">
        <h5>Danh sách hóa đơn đang phục vụ ({{ invoices.length }})</h5>
      </div>

      <div v-if="loading" class="empty-state">
        Đang tải...
      </div>

      <div v-else-if="invoices.length === 0" class="empty-state">
        Không có hóa đơn nào đang phục vụ
      </div>

      <table v-else class="invoice-table">
        <thead>
          <tr>
            <th>Mã hóa đơn</th>
            <th>Khách hàng</th>
            <th>Số khách</th>
            <th>Bàn</th>
            <th>Tạm tính</th>
            <th>Thời gian vào</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="invoice in invoices" 
            :key="invoice.invoiceId"
            class="clickable-row"
          >
            <td @click="showInvoiceDetail(invoice)"><strong class="invoice-code">{{ invoice.invoiceCode }}</strong></td>
            <td @click="showInvoiceDetail(invoice)">{{ invoice.customerName }}</td>
            <td @click="showInvoiceDetail(invoice)">{{ invoice.guestCount }} người</td>
            <td @click="showInvoiceDetail(invoice)">
              <span 
                v-for="table in invoice.tables" 
                :key="table.id"
                class="table-name"
              >
                {{ table.tableName }}
              </span>
            </td>
            <td @click="showInvoiceDetail(invoice)"><strong class="amount">{{ formatMoney(invoice.subtotal) }}</strong></td>
            <td @click="showInvoiceDetail(invoice)">{{ formatDateTime(invoice.checkedInAt) }}</td>
            <td>
              <button 
                class="btn-pay-now"
                @click.stop="proceedToPaymentDirect(invoice)"
              >
                Thanh toán
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Payment Form (shown when in payment mode) -->
    <div v-if="showPaymentForm && selectedInvoice">
      <div class="back-button-section">
        <button class="btn-back" @click="backToList">
          ← Quay lại danh sách
        </button>
      </div>
      
      <PaymentViewComponent 
        :initial-table-id="selectedInvoice.tables[0]?.id"
        :hide-header="true"
        @payment-complete="handlePaymentComplete"
        @cancel-complete="handleCancelComplete"
      />
    </div>

    <!-- Invoice Detail Modal -->
    <div v-if="showDetailModal" class="detail-modal" @click.self="closeDetail">
      <div class="detail-card">
        <div class="detail-header">
          <h5>Chi tiết hóa đơn</h5>
          <button class="btn-close" @click="closeDetail"></button>
        </div>
        <div class="detail-body" v-if="selectedInvoice">
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">Mã hóa đơn</span>
              <span class="detail-value">{{ selectedInvoice.invoiceCode }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Khách hàng</span>
              <span class="detail-value">{{ selectedInvoice.customerName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Số điện thoại</span>
              <span class="detail-value">{{ selectedInvoice.customerPhone || 'Không có' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Số khách</span>
              <span class="detail-value">{{ selectedInvoice.guestCount }} khách</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Thời gian vào</span>
              <span class="detail-value">{{ formatDateTime(selectedInvoice.checkedInAt) }}</span>
            </div>
            <div class="detail-row full-width">
              <span class="detail-label">Danh sách món</span>
              <div class="items-list">
                <div 
                  v-for="(item, index) in selectedInvoice.items" 
                  :key="item.id"
                  class="item-row"
                >
                  <span class="item-index">{{ index + 1 }}</span>
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-quantity">x{{ item.quantity }}</span>
                  <span class="item-price">{{ formatMoney(item.lineTotal) }}</span>
                </div>
              </div>
            </div>
            <div class="detail-row full-width">
              <span class="detail-label">Bàn đang phục vụ</span>
              <div class="table-list">
                <div 
                  v-for="table in selectedInvoice.tables" 
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
            <div class="detail-row subtotal-row">
              <span class="detail-label">Tạm tính</span>
              <span class="detail-value amount-highlight">{{ formatMoney(selectedInvoice.subtotal) }}</span>
            </div>
          </div>
        </div>
        <div class="detail-footer">
          <button class="btn-secondary" @click="closeDetail">Đóng</button>
          <button 
            class="btn-payment"
            @click="proceedToPayment"
          >
            Thanh toán
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PaymentViewComponent from '@/components/reception/PaymentView.vue';
import { paymentService, type InvoiceSummary } from '@/services/paymentService';

const searchTableId = ref<number | null>(null);
const loading = ref(false);
const invoices = ref<InvoiceSummary[]>([]);
const showDetailModal = ref(false);
const selectedInvoice = ref<InvoiceSummary | null>(null);
const showPaymentForm = ref(false);

onMounted(() => {
  loadAllInvoices();
});

const loadAllInvoices = async () => {
  loading.value = true;
  
  try {
    invoices.value = await paymentService.getAllInProgressInvoices();
  } catch (error: any) {
    console.error('Load invoices error:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  if (!searchTableId.value || searchTableId.value < 1) {
    alert('Vui lòng nhập ID bàn hợp lệ');
    return;
  }

  loading.value = true;
  
  try {
    selectedInvoice.value = await paymentService.getInvoiceByTable(searchTableId.value);
    showDetailModal.value = true;
  } catch (error: any) {
    console.error('Search error:', error);
    alert('Không tìm thấy hóa đơn cho bàn này');
  } finally {
    loading.value = false;
  }
};

const showInvoiceDetail = (invoice: InvoiceSummary) => {
  selectedInvoice.value = invoice;
  showDetailModal.value = true;
};

const closeDetail = () => {
  showDetailModal.value = false;
  selectedInvoice.value = null;
};

const proceedToPayment = () => {
  showDetailModal.value = false;
  showPaymentForm.value = true;
};

const proceedToPaymentDirect = (invoice: InvoiceSummary) => {
  selectedInvoice.value = invoice;
  showPaymentForm.value = true;
};

const backToList = () => {
  showPaymentForm.value = false;
  selectedInvoice.value = null;
  loadAllInvoices();
};

const handlePaymentComplete = () => {
  showPaymentForm.value = false;
  selectedInvoice.value = null;
  loadAllInvoices();
};

const handleCancelComplete = () => {
  showPaymentForm.value = false;
  selectedInvoice.value = null;
  loadAllInvoices();
};

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};
</script>

<style scoped>
.payment-container {
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

.invoice-table {
  width: 100%;
  border-collapse: collapse;
}

.invoice-table thead {
  background: #f7fafc;
}

.invoice-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 700;
  font-size: 14px;
  color: #334155;
}

.invoice-table tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s;
  cursor: pointer;
}

.invoice-table tbody tr:hover {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.08);
  transform: translateY(-1px);
}

.invoice-table td {
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.invoice-code {
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

.amount {
  color: #10b981;
  font-size: 16px;
}

.back-button-section {
  margin-bottom: 20px;
}

.btn-back {
  padding: 10px 20px;
  background: white;
  color: #475569;
  font-weight: 600;
  font-size: 15px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-back:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateX(-2px);
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
  max-width: 700px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.3s ease;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
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
  overflow-y: auto;
  background: #fafbfc;
  flex: 1;
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

.detail-row.subtotal-row {
  grid-template-columns: 1fr auto;
  padding-top: 16px;
  margin-top: 8px;
  border-top: 2px solid #e5e7eb;
}

.detail-label {
  color: #6b7280;
  font-weight: 600;
}

.detail-value {
  color: #111827;
  font-weight: 700;
}

.amount-highlight {
  color: #10b981;
  font-size: 18px;
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

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row {
  display: grid;
  grid-template-columns: 40px 1fr 80px 120px;
  gap: 12px;
  padding: 10px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  align-items: center;
}

.item-index {
  font-size: 14px;
  font-weight: 600;
  color: #9ca3af;
}

.item-name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.item-quantity {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  text-align: right;
}

.item-price {
  font-size: 15px;
  font-weight: 700;
  color: #10b981;
  text-align: right;
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 32px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.btn-secondary {
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

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.btn-payment {
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-weight: 700;
  font-size: 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-payment:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-pay-now {
  padding: 8px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-weight: 700;
  font-size: 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
  white-space: nowrap;
}

.btn-pay-now:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
}
</style>
