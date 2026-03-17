<template>
  <div class="pos-page">
    <div class="pos-header">
      <div>
        <h3 class="pos-title">Thanh toán</h3>
        <p class="pos-sub">Reception / POS - ByHat</p>
      </div>
    </div>

    <div class="card pos-card mb-4">
      <div class="card-body">
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <input
            v-model.number="tableIdInput"
            type="number"
            min="1"
            class="form-control"
            style="max-width: 220px"
            placeholder="Nhập ID bàn"
          />
          <button class="btn btn-primary" :disabled="loading" @click="loadPayment">
            {{ loading ? 'Đang tải...' : 'Tải hóa đơn' }}
          </button>
          <span class="text-danger small" v-if="errorMsg">{{ errorMsg }}</span>
        </div>
      </div>
    </div>

    <div v-if="payment" class="row g-4">
      <div class="col-12">
        <div class="card pos-card h-100">
          <div class="card-body">
            <h5 class="section-title">Thông tin khách hàng</h5>
            <div class="info-grid">
              <div>
                <span>Tên khách</span><strong>{{ payment.customerName }}</strong>
              </div>
              <div>
                <span>Số điện thoại</span><strong>{{ payment.customerPhone }}</strong>
              </div>
              <div>
                <span>Loại khách</span><strong>{{ payment.customerType }}</strong>
              </div>
              <div>
                <span>Điểm tích lũy</span><strong>{{ payment.loyaltyPoints }}</strong>
              </div>
              <div>
                <span>Thời gian vào bàn</span
                ><strong>{{ formatDateTime(payment.reservedAt) }}</strong>
              </div>
              <div>
                <span>Mã hóa đơn</span><strong>{{ payment.invoiceCode }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="row g-4">
          <div class="col-12 col-lg-4">
            <div class="card pos-card h-100">
              <div class="card-body">
                <h5 class="section-title">Voucher hóa đơn</h5>
                <button class="btn btn-outline-primary w-100" @click="openVoucherModal">
                  Chọn voucher
                </button>
                <div class="d-flex gap-2 mt-3">
                  <input
                    v-model="voucherCodeInput"
                    class="form-control"
                    placeholder="Nhập mã voucher (nếu có)"
                  />
                  <button class="btn btn-outline-primary" @click="applyVoucherCode">Áp dụng</button>
                </div>
                <div class="mt-2 small text-muted">
                  Giảm hóa đơn:
                  <strong class="text-dark">{{ formatMoney(invoiceVoucherDiscount) }}</strong>
                </div>
                <div v-if="selectedVoucher" class="mt-2 small">
                  <span class="text-muted">Đang áp dụng:</span>
                  <strong class="text-dark"
                    >{{ selectedVoucher.name }} ({{ selectedVoucher.percent }}%)</strong
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-4">
            <div class="card pos-card h-100">
              <div class="card-body">
                <h5 class="section-title">Giảm giá</h5>
                <div class="row g-2">
                  <div class="col-6">
                    <label class="form-label">Hình thức giảm giá</label>
                    <select v-model="discountMode" class="form-select">
                      <option value="PERCENT">Theo %</option>
                      <option value="AMOUNT">Theo số tiền</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Giá trị giảm</label>
                    <input
                      v-if="discountMode === 'PERCENT'"
                      v-model.number="manualDiscountPercentInput"
                      type="number"
                      min="0"
                      max="100"
                      class="form-control"
                      placeholder="% giảm"
                    />
                    <input
                      v-else
                      v-model.number="manualDiscountAmountInput"
                      type="number"
                      min="0"
                      class="form-control"
                      placeholder="Số tiền giảm"
                    />
                  </div>
                </div>
                <div class="mt-2 small text-muted">
                  Giảm thủ công: <strong class="text-dark">{{ formatMoney(manualDiscount) }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-4">
            <div class="card pos-card h-100">
              <div class="card-body">
                <h5 class="section-title">Dùng điểm tích lũy</h5>
                <div class="d-flex align-items-center gap-2">
                  <input
                    v-model.number="usePoints"
                    type="number"
                    min="0"
                    :max="payment.loyaltyPoints"
                    class="form-control"
                    placeholder="Nhập số điểm"
                  />
                  <button class="btn btn-outline-primary" @click="useMaxPoints">Dùng tối đa</button>
                </div>
                <div class="mt-2 small text-muted">
                  Giảm từ điểm: <strong class="text-dark">{{ formatMoney(pointsDiscount) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="card pos-card h-100">
          <div class="card-body">
            <h5 class="section-title">Danh sách món ăn & combo</h5>
            <div class="table-responsive">
              <table class="table align-middle">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên món</th>
                    <th>Loại</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Giảm giá</th>
                    <th>Thành tiền</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in payment.items" :key="item.id">
                    <td>{{ index + 1 }}</td>
                    <td class="fw-semibold">{{ item.name }}</td>
                    <td>
                      <span
                        class="badge item-type-badge"
                        :class="item.type === 'PRODUCT' ? 'bg-primary-light' : 'bg-success-light'"
                      >
                        {{ item.type === 'PRODUCT' ? 'Món' : 'Combo' }}
                      </span>
                    </td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ formatMoney(item.unitPrice) }}</td>
                    <td class="text-danger">-{{ formatMoney(item.discount) }}</td>
                    <td class="fw-semibold">{{ formatMoney(item.lineTotal) }}</td>
                    <td>
                      <div class="item-actions">
                        <button
                          class="btn btn-sm btn-outline-secondary"
                          @click="updateItemQuantity(item.id, item.quantity - 1)"
                        >
                          -
                        </button>
                        <button
                          class="btn btn-sm btn-outline-secondary"
                          @click="updateItemQuantity(item.id, item.quantity + 1)"
                        >
                          +
                        </button>
                        <button class="btn btn-sm btn-outline-danger" @click="removeItem(item.id)">
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-6 d-flex">
        <div class="card pos-card h-100 flex-fill">
          <div class="card-body">
            <h5 class="section-title">Thanh toán chi tiết</h5>
            <div class="summary-grid">
              <div>
                <span>Tạm tính</span><strong>{{ formatMoney(subtotal) }}</strong>
              </div>
              <div>
                <span>Giảm voucher món</span
                ><strong>-{{ formatMoney(itemVoucherDiscount) }}</strong>
              </div>
              <div>
                <span>Giảm voucher hóa đơn</span
                ><strong>-{{ formatMoney(invoiceVoucherDiscount) }}</strong>
              </div>
              <div>
                <span>Giảm thủ công</span><strong>-{{ formatMoney(manualDiscount) }}</strong>
              </div>
              <div>
                <span>Giảm từ điểm</span><strong>-{{ formatMoney(pointsDiscount) }}</strong>
              </div>
              <div class="total-line">
                <span>TỔNG THANH TOÁN</span><strong>{{ formatMoney(totalPayable) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-6 d-flex">
        <div class="card pos-card h-100 flex-fill">
          <div class="card-body">
            <h5 class="section-title">Phương thức thanh toán</h5>
            <div class="payment-single">
              <select v-model="paymentMethod" class="form-select">
                <option value="CASH">Tiền mặt</option>
                <option value="TRANSFER">Chuyển khoản</option>
                <option value="EWALLET">Ví điện tử</option>
              </select>

              <div v-if="paymentMethod === 'CASH'" class="mt-2">
                <label class="form-label">Tiền khách đưa</label>
                <input
                  v-model.number="cashReceived"
                  type="number"
                  min="0"
                  class="form-control"
                  placeholder="Nhập số tiền khách đưa"
                />
                <div class="mt-2 small text-muted">
                  Tiền thối lại:
                  <strong class="text-success">{{ formatMoney(changeDue) }}</strong>
                </div>
              </div>

              <div v-else class="mt-2">
                <label class="form-label">Mã giao dịch (tùy chọn)</label>
                <input v-model="paymentNote" class="form-control" placeholder="Nhập mã giao dịch" />
              </div>
            </div>

            <div class="mt-3 small text-muted">
              Tổng cần thanh toán: <strong>{{ formatMoney(totalPayable) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 d-flex justify-content-end gap-2">
        <button class="btn btn-primary px-4" :disabled="checkingOut" @click="checkout">
          {{ checkingOut ? 'Đang thanh toán...' : 'Thanh toán' }}
        </button>
        <button class="btn btn-outline-secondary px-4" @click="printInvoice">In hóa đơn</button>
        <button class="btn btn-outline-danger px-4" @click="cancelInvoice">Hủy hóa đơn</button>
      </div>
    </div>
    <div v-else class="text-muted">Vui lòng nhập ID bàn để tải hóa đơn.</div>
    <div v-if="showVoucherModal" class="voucher-modal">
      <div class="voucher-card">
        <div class="voucher-header">
          <h6 class="mb-0">Chọn voucher khả dụng</h6>
          <button class="btn-close" @click="closeVoucherModal"></button>
        </div>
        <div class="voucher-body">
          <div v-if="!validVouchers.length" class="text-muted small">
            Hiện chưa có voucher hợp lệ.
          </div>
          <div v-else class="voucher-list">
            <div v-for="v in validVouchers" :key="v.id" class="voucher-item">
              <div>
                <div class="fw-semibold">{{ v.name }}</div>
                <div class="small text-muted">
                  {{ v.percent }}% · HSD {{ formatDateTime(v.expiresAt) }}
                </div>
              </div>
              <button class="btn btn-sm btn-primary" @click="selectVoucher(v.id)">Chọn</button>
            </div>
          </div>
        </div>
        <div class="voucher-footer">
          <button class="btn btn-light" @click="clearVoucher">Bỏ chọn</button>
          <button class="btn btn-outline-secondary" @click="closeVoucherModal">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  cancelPayment,
  checkoutPayment,
  deletePaymentItem,
  getPaymentByTable,
  updatePaymentItem,
} from '@/services/paymentApi'

type Payment = {
  invoiceId: number
  invoiceCode: string
  invoiceStatus: string
  customerType: string
  customerName: string
  customerPhone: string
  loyaltyPoints: number
  reservedAt: string
  checkedInAt: string
  guestCount: number
  staffName: string
  tables: { id: number; tableName: string; seatingCapacity: number }[]
  items: {
    id: number
    name: string
    type: string
    quantity: number
    unitPrice: number
    discount: number
    lineTotal: number
  }[]
  vouchers: {
    id: number
    code?: string
    name: string
    percent: number
    expiresAt: string
    remainingQuantity: number
    voucherStatus?: string
  }[]
  subtotal: number
  itemVoucherDiscount: number
  manualDiscountPercent: number | null
  manualDiscountAmount: number | null
  pointValue: number
}

const payment = ref<Payment | null>(null)
const tableIdInput = ref<number | null>(null)
const loading = ref(false)
const checkingOut = ref(false)
const errorMsg = ref('')

const selectedVoucherId = ref<number | ''>('')
const voucherCodeInput = ref('')
const usePoints = ref(0)

const discountMode = ref<'PERCENT' | 'AMOUNT'>('PERCENT')
const manualDiscountPercentInput = ref(0)
const manualDiscountAmountInput = ref(0)

const paymentMethod = ref<'CASH' | 'TRANSFER' | 'EWALLET'>('CASH')
const cashReceived = ref(0)
const paymentNote = ref('')

const showVoucherModal = ref(false)

const validVouchers = computed(() => {
  const list = payment.value.vouchers || []
  const now = new Date()
  return list.filter(
    (v) =>
      v.remainingQuantity > 0 &&
      new Date(v.expiresAt) >= now &&
      (!v.voucherStatus || v.voucherStatus === 'ACTIVE'),
  )
})
const selectedVoucher = computed(() =>
  validVouchers.value.find((v) => v.id === selectedVoucherId.value),
)

const subtotal = computed(() => payment.value.subtotal || 0)
const itemVoucherDiscount = computed(() => payment.value.itemVoucherDiscount || 0)

const invoiceVoucherDiscount = computed(() => {
  const voucher = validVouchers.value.find((v) => v.id === selectedVoucherId.value)
  if (!voucher) return 0
  const base = subtotal.value - itemVoucherDiscount.value
  if (base <= 0) return 0
  return Math.floor((base * voucher.percent) / 100)
})

const manualDiscount = computed(() => {
  const base = Math.max(
    0,
    subtotal.value - itemVoucherDiscount.value - invoiceVoucherDiscount.value,
  )
  if (discountMode.value === 'AMOUNT') {
    return Math.min(Math.max(0, manualDiscountAmountInput.value || 0), base)
  }
  const percent = Math.max(0, manualDiscountPercentInput.value || 0)
  return Math.floor((base * percent) / 100)
})

const pointsDiscount = computed(() => {
  const pointValue = payment.value.pointValue || 1000
  const maxByPoints = Math.max(0, usePoints.value) * pointValue
  const maxAllowed =
    subtotal.value - itemVoucherDiscount.value - invoiceVoucherDiscount.value - manualDiscount.value
  return Math.max(0, Math.min(maxByPoints, maxAllowed))
})

const totalPayable = computed(() =>
  Math.max(
    0,
    subtotal.value -
      itemVoucherDiscount.value -
      invoiceVoucherDiscount.value -
      manualDiscount.value -
      pointsDiscount.value,
  ),
)

const changeDue = computed(() =>
  paymentMethod.value === 'CASH' ? Math.max(0, cashReceived.value - totalPayable.value) : 0,
)

const tableText = computed(() => {
  if (!payment.value.tables.length) return 'Chưa có'
  return payment.value.tables.map((t) => `${t.tableName} (ID ${t.id})`).join(', ')
})

const loadPayment = async () => {
  errorMsg.value = ''
  if (!tableIdInput.value || tableIdInput.value < 1) {
    errorMsg.value = 'Vui lòng nhập ID bàn hợp lệ'
    return
  }
  loading.value = true
  try {
    const res = await getPaymentByTable(tableIdInput.value)
    payment.value = res.data.data
    selectedVoucherId.value = ''
    usePoints.value = 0
    voucherCodeInput.value = ''
    discountMode.value = 'PERCENT'
    manualDiscountPercentInput.value = payment.value.manualDiscountPercent || 0
    manualDiscountAmountInput.value = payment.value.manualDiscountAmount || 0
    paymentMethod.value = 'CASH'
    cashReceived.value = 0
    paymentNote.value = ''
    showVoucherModal.value = false
  } catch (error: any) {
    errorMsg.value = error.response.data.message || 'Không tải được hóa đơn'
    payment.value = null
  } finally {
    loading.value = false
  }
}

const useMaxPoints = () => {
  if (!payment.value) return
  usePoints.value = payment.value.loyaltyPoints || 0
}

const applyVoucherCode = () => {
  const code = voucherCodeInput.value.trim().toUpperCase()
  if (!code) {
    selectedVoucherId.value = ''
    return
  }
  const found = validVouchers.value.find((v) => (v.code || '').toUpperCase() === code)
  if (found) {
    selectedVoucherId.value = found.id
  } else {
    alert('Không tìm thấy voucher hợp lệ')
    selectedVoucherId.value = ''
  }
}

const openVoucherModal = () => {
  showVoucherModal.value = true
}

const closeVoucherModal = () => {
  showVoucherModal.value = false
}

const selectVoucher = (id: number) => {
  selectedVoucherId.value = id
  closeVoucherModal()
}

const clearVoucher = () => {
  selectedVoucherId.value = ''
  voucherCodeInput.value = ''
}

const updateItemQuantity = async (itemId: number, quantity: number) => {
  if (!payment.value) return
  try {
    await updatePaymentItem(itemId, Math.max(0, quantity))
    await loadPayment()
  } catch (error: any) {
    alert(error.response.data.message || 'Không cập nhật được món')
  }
}

const removeItem = async (itemId: number) => {
  if (!payment.value) return
  try {
    await deletePaymentItem(itemId)
    await loadPayment()
  } catch (error: any) {
    alert(error.response.data.message || 'Không xoá được món')
  }
}

const checkout = async () => {
  if (!payment.value) return
  if (totalPayable.value <= 0) {
    alert('Số tiền thanh toán không hợp lệ')
    return
  }
  if (paymentMethod.value === 'CASH' && cashReceived.value < totalPayable.value) {
    alert('Tiền khách đưa chưa đủ')
    return
  }
  checkingOut.value = true
  try {
    const res = await checkoutPayment({
      tableId: tableIdInput.value as number,
      customerVoucherId: selectedVoucherId.value ? Number(selectedVoucherId.value) : null,
      usePoints: usePoints.value,
      paymentMethod: paymentMethod.value,
      cashReceived: paymentMethod.value === 'CASH' ? cashReceived.value : 0,
      manualDiscountPercent:
        discountMode.value === 'PERCENT' ? manualDiscountPercentInput.value : 0,
      manualDiscountAmount:
        discountMode.value === 'AMOUNT' ? manualDiscountAmountInput.value : 0,
      payments: [
        {
          method: paymentMethod.value,
          amount: totalPayable.value,
          note: paymentNote.value,
        },
      ],
    })
    const data = res.data.data
    alert(`Thanh toán thành công. Tổng: ${formatMoney(data.totalPayable)}`)
    await loadPayment()
  } catch (error: any) {
    alert(error.response.data.message || 'Thanh toán thất bại')
  } finally {
    checkingOut.value = false
  }
}
const cancelInvoice = async () => {
  if (!tableIdInput.value) return
  try {
    await cancelPayment(tableIdInput.value)
    alert('Hóa đơn đã hủy')
    payment.value = null
  } catch (error: any) {
    alert(error.response.data.message || 'Hủy hóa đơn thất bại')
  }
}

const printInvoice = () => {
  if (!payment.value) return
  const items = payment.value.items || []
  const voucher = validVouchers.value.find((v) => v.id === selectedVoucherId.value)
  const voucherName = voucher ? voucher.name : 'Không áp dụng'
  const voucherPercent = voucher ? `${voucher.percent}%` : ''
  const printedAt = new Date().toLocaleString('vi-VN', { hour12: false })
  const printTitle = 'HÓA ĐƠN THANH TOÁN'
  const methodLabelMap: Record<string, string> = {
    CASH: 'Tiền mặt',
    TRANSFER: 'Chuyển khoản',
    EWALLET: 'Ví điện tử',
  }
  const paymentLabel = methodLabelMap[paymentMethod.value] || 'Thanh toán'
  const paymentSummary = `${paymentLabel}: ${formatMoney(totalPayable.value)}${
    paymentNote.value ? ` (${paymentNote.value})` : ''
  }`

  const rows = items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.name}</td>
          <td>${item.type === 'PRODUCT' ? 'Món' : 'Combo'}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${formatMoney(item.unitPrice)}</td>
          <td class="num">-${formatMoney(item.discount)}</td>
          <td class="num">${formatMoney(item.lineTotal)}</td>
        </tr>`,
    )
    .join('')

  const html = `
  <!doctype html>
  <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <title>Hóa đơn</title>
      <style>
        * { box-sizing: border-box; }
        @page { size: A4 portrait; margin: 4mm; }
        body {
          margin: 0;
          padding: 0;
          font-family: "Segoe UI", Arial, sans-serif;
          color: #222;
        }
        .receipt {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
        }
        h1 {
          font-size: 20px;
          text-align: center;
          margin: 0 0 6px;
          letter-spacing: 0.6px;
        }
        .sub { text-align: center; font-size: 12.5px; margin-bottom: 10px; color: #555; }
        .meta { font-size: 13px; margin-bottom: 10px; }
        .meta div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 2px;
        }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 6px 5px; border-bottom: 1px dashed #ccc; }
        th { text-align: left; font-weight: 600; }
        td.num { text-align: right; white-space: nowrap; }
        .totals { margin-top: 8px; font-size: 13px; }
        .totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .total {
          font-weight: 700;
          font-size: 15px;
          border-top: 1px solid #222;
          padding-top: 6px;
          margin-top: 6px;
        }
        .voucher {
          margin-top: 10px;
          font-size: 13px;
          border-top: 1px dashed #ccc;
          padding-top: 6px;
        }
        .center { text-align: center; margin-top: 10px; font-size: 11.5px; color: #666; }
        .copy-badge {
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 6px;
          color: #c0392b;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <h1>${printTitle}</h1>
        <div class="sub">ByHat - Reception/POS</div>
        <div class="meta">
          <div><span>Mã hóa đơn</span><span>${payment.value.invoiceCode}</span></div>
          <div><span>Bàn</span><span>${tableText.value}</span></div>
          <div><span>Khách</span><span>${payment.value.customerName}</span></div>
          <div><span>Thời gian</span><span>${printedAt}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Món</th>
              <th>Loại</th>
              <th class="num">SL</th>
              <th class="num">Đơn giá</th>
              <th class="num">Giảm</th>
              <th class="num">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7">Không có món</td></tr>'}
          </tbody>
        </table>
        <div class="voucher">
          <div><strong>Voucher hóa đơn</strong></div>
          <div>Tên: ${voucherName} ${voucherPercent}</div>
          <div>Giảm: -${formatMoney(invoiceVoucherDiscount.value)}</div>
        </div>
        <div class="totals">
          <div><span>Tạm tính</span><span>${formatMoney(subtotal.value)}</span></div>
          <div><span>Giảm voucher món</span><span>-${formatMoney(itemVoucherDiscount.value)}</span></div>
          <div><span>Giảm thủ công</span><span>-${formatMoney(manualDiscount.value)}</span></div>
          <div><span>Giảm từ điểm</span><span>-${formatMoney(pointsDiscount.value)}</span></div>
          <div class="total"><span>TỔNG THANH TOÁN</span><span>${formatMoney(totalPayable.value)}</span></div>
        </div>
        <div class="voucher">
          <div><strong>Thanh toán</strong></div>
          <div>${paymentSummary || 'Chưa có'}</div>
        </div>
        <div class="center">Cảm ơn quý khách!</div>
      </div>
    </body>
  </html>
  `

  const printWindow = window.open('', '_blank', 'width=760,height=900')
  if (!printWindow) return
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
}

const formatMoney = (value: number) => value.toLocaleString('vi-VN') + 'đ'

const formatDateTime = (value: string) => {
  if (!value) return ''
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
</script>

<style scoped>
.pos-page {
  padding: 24px;
  font-family: 'Be Vietnam Pro', 'Segoe UI', sans-serif;
  width: 100%;
  max-width: 100%;
}

.pos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pos-title {
  font-weight: 700;
  margin-bottom: 4px;
}

.pos-sub {
  color: #7c6f6f;
  margin: 0;
}

.pos-card {
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: none;
  overflow: hidden;
}

.pos-card .card-body {
  padding: 20px;
}

.table-responsive {
  border-radius: 12px;
  overflow: hidden;
}

.table {
  margin-bottom: 0;
}

.table th,
.table td {
  vertical-align: middle;
}

.table thead th {
  background: #f7f2ee;
}

.section-title {
  font-weight: 700;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  gap: 8px 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.info-grid div {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  align-items: center;
}

.info-grid span {
  color: #6b6b6b;
}

.info-grid span::after {
  content: ':';
  margin-left: 4px;
}


.info-grid strong {
  text-align: left;
  word-break: break-word;
}

.summary-grid {
  display: grid;
  gap: 10px;
}

.summary-grid div {
  display: flex;
  justify-content: space-between;
}

.total-line {
  padding-top: 12px;
  border-top: 1px dashed #d7c9c9;
  font-size: 18px;
}

.payment-single {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-actions {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}

.item-type-badge {
  min-width: 64px;
  text-align: center;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 999px;
}

.bg-primary-light {
  background: #e7f0ff;
  color: #1d5bd6;
}

.bg-success-light {
  background: #e8f8f0;
  color: #15803d;
}

.voucher-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  padding: 16px;
}

.voucher-card {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.voucher-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #eee;
}

.voucher-body {
  padding: 16px 18px;
  max-height: 360px;
  overflow: auto;
}

.voucher-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.voucher-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fafafa;
}

.voucher-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px 16px;
  border-top: 1px solid #eee;
}

@media (max-width: 1200px) {
  .pos-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 992px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
