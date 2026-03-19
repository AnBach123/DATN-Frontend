<template>
  <div class="invoice-page">
    <div class="invoice-container">
      <!-- Header -->
      <div class="invoice-header">
        <div class="restaurant-info">
          <h1>HÓA ĐƠN THANH TOÁN</h1>
          <p class="restaurant-name">ByHat Restaurant - Reception/POS</p>
        </div>
        <div class="invoice-status">
          <span class="status-badge paid">ĐÃ THANH TOÁN</span>
        </div>
      </div>

      <!-- Invoice Info -->
      <div class="invoice-info-section">
        <div class="info-row">
          <div class="info-item">
            <label>Mã hóa đơn:</label>
            <strong>{{ invoiceData.invoiceCode }}</strong>
          </div>
          <div class="info-item">
            <label>Thời gian:</label>
            <strong>{{ formatDateTime(invoiceData.paidAt) }}</strong>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <label>Bàn:</label>
            <strong>{{ invoiceData.tableText }}</strong>
          </div>
          <div class="info-item">
            <label>Khách hàng:</label>
            <strong>{{ invoiceData.customerName }}</strong>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <label>Phương thức:</label>
            <strong>{{ getPaymentMethodLabel(invoiceData.paymentMethod) }}</strong>
          </div>
          <div class="info-item" v-if="invoiceData.paymentMethod === 'CASH'">
            <label>Tiền khách đưa:</label>
            <strong>{{ formatMoney(invoiceData.cashReceived) }}</strong>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="invoice-items">
        <h3>Chi tiết món ăn</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên món</th>
              <th>Loại</th>
              <th class="text-right">SL</th>
              <th class="text-right">Đơn giá</th>
              <th class="text-right">Giảm giá</th>
              <th class="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in invoiceData.items" :key="index">
              <td>{{ index + 1 }}</td>
              <td class="item-name">{{ item.name }}</td>
              <td>
                <span class="item-type-badge" :class="item.type === 'PRODUCT' ? 'product' : 'combo'">
                  {{ item.type === 'PRODUCT' ? 'Món' : 'Combo' }}
                </span>
              </td>
              <td class="text-right">{{ item.quantity }}</td>
              <td class="text-right">{{ formatMoney(item.unitPrice) }}</td>
              <td class="text-right text-danger">-{{ formatMoney(item.discount) }}</td>
              <td class="text-right fw-bold">{{ formatMoney(item.lineTotal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Voucher Info -->
      <div class="voucher-section" v-if="invoiceData.selectedVoucher">
        <h4>Voucher áp dụng</h4>
        <div class="voucher-info">
          <span>{{ invoiceData.selectedVoucher.name }}</span>
          <span class="voucher-discount">-{{ formatMoney(invoiceData.invoiceVoucherDiscount) }}</span>
        </div>
      </div>

      <!-- Summary -->
      <div class="invoice-summary">
        <div class="summary-row">
          <span>Tạm tính:</span>
          <strong>{{ formatMoney(invoiceData.subtotal) }}</strong>
        </div>
        <div class="summary-row">
          <span>Giảm voucher món:</span>
          <strong class="text-danger">-{{ formatMoney(invoiceData.itemVoucherDiscount) }}</strong>
        </div>
        <div class="summary-row">
          <span>Giảm voucher hóa đơn:</span>
          <strong class="text-danger">-{{ formatMoney(invoiceData.invoiceVoucherDiscount) }}</strong>
        </div>
        <div class="summary-row">
          <span>Giảm thủ công:</span>
          <strong class="text-danger">-{{ formatMoney(invoiceData.manualDiscount) }}</strong>
        </div>
        <div class="summary-row">
          <span>Giảm từ điểm:</span>
          <strong class="text-danger">-{{ formatMoney(invoiceData.pointsDiscount) }}</strong>
        </div>
        <div class="summary-row total-row">
          <span>TỔNG THANH TOÁN:</span>
          <strong class="total-amount">{{ formatMoney(invoiceData.totalPayable) }}</strong>
        </div>
        <div class="summary-row" v-if="invoiceData.paymentMethod === 'CASH'">
          <span>Tiền thối lại:</span>
          <strong class="text-success">{{ formatMoney(invoiceData.changeDue) }}</strong>
        </div>
      </div>

      <!-- Footer -->
      <div class="invoice-footer">
        <p class="thank-you">Cảm ơn quý khách! Hẹn gặp lại!</p>
        <p class="footer-note">Hóa đơn được xuất tự động bởi hệ thống POS</p>
      </div>

      <!-- Actions -->
      <div class="invoice-actions">
        <button class="btn btn-print" @click="printInvoice">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
          </svg>
          In hóa đơn
        </button>
        <button class="btn btn-back" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Thanh toán bàn mới
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const invoiceData = ref<any>({})

onMounted(() => {
  // Lấy dữ liệu từ route state
  const state = history.state as any
  if (state && state.invoiceData) {
    invoiceData.value = state.invoiceData
  } else {
    // Nếu không có data, redirect về trang payment
    router.push('/payment')
  }
})

const formatMoney = (value: number) => {
  return value.toLocaleString('vi-VN') + 'đ'
}

const formatDateTime = (value: string) => {
  if (!value) return new Date().toLocaleString('vi-VN', { hour12: false })
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    CASH: 'Tiền mặt',
    TRANSFER: 'Chuyển khoản',
    EWALLET: 'Ví điện tử',
  }
  return labels[method] || method
}

const printInvoice = () => {
  window.print()
}

const goBack = () => {
  // Quay về trang payment và reset form để thanh toán bàn mới
  // Sử dụng query param để trigger reset
  router.push({ 
    path: '/reception/payment',
    query: { reset: 'true' }
  })
}
</script>

<style scoped>
.invoice-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40px 20px;
}

.invoice-container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 30px;
  border-bottom: 3px solid #667eea;
  margin-bottom: 30px;
}

.restaurant-info h1 {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
  margin: 0 0 8px 0;
}

.restaurant-name {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.status-badge.paid {
  background: #d4edda;
  color: #155724;
}

.invoice-info-section {
  margin-bottom: 30px;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  gap: 10px;
}

.info-item label {
  color: #666;
  min-width: 120px;
}

.info-item strong {
  color: #222;
}

.invoice-items {
  margin-bottom: 30px;
}

.invoice-items h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table thead {
  background: #f8f9fa;
}

.items-table th,
.items-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.items-table th {
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

.items-table td {
  color: #333;
}

.text-right {
  text-align: right !important;
}

.item-name {
  font-weight: 500;
}

.item-type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.item-type-badge.product {
  background: #e7f0ff;
  color: #1d5bd6;
}

.item-type-badge.combo {
  background: #e8f8f0;
  color: #15803d;
}

.voucher-section {
  background: #fff9e6;
  border: 1px dashed #ffc107;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 30px;
}

.voucher-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #856404;
  margin: 0 0 10px 0;
}

.voucher-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.voucher-discount {
  font-weight: 600;
  color: #dc3545;
}

.invoice-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.summary-row:not(:last-child) {
  border-bottom: 1px dashed #dee2e6;
}

.total-row {
  border-top: 2px solid #667eea !important;
  padding-top: 15px !important;
  margin-top: 10px;
  font-size: 18px;
}

.total-amount {
  color: #667eea;
  font-size: 24px;
}

.text-danger {
  color: #dc3545;
}

.text-success {
  color: #28a745;
}

.fw-bold {
  font-weight: 600;
}

.invoice-footer {
  text-align: center;
  padding: 30px 0;
  border-top: 2px dashed #dee2e6;
}

.thank-you {
  font-size: 20px;
  font-weight: 600;
  color: #667eea;
  margin: 0 0 10px 0;
}

.footer-note {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.invoice-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-print {
  background: #667eea;
  color: white;
}

.btn-print:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-back {
  background: #6c757d;
  color: white;
}

.btn-back:hover {
  background: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
}

/* Print styles */
@media print {
  .invoice-page {
    background: white;
    padding: 0;
  }

  .invoice-container {
    box-shadow: none;
    padding: 20px;
  }

  .invoice-actions {
    display: none;
  }

  .btn {
    display: none;
  }
}
</style>
