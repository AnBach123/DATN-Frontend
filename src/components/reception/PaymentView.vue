<template>
  <div class="pos-page">
    <!-- Header (hidden when hideHeader prop is true) -->
    <div v-if="!hideHeader" class="pos-header">
      <div>
        <h3 class="pos-title">Thanh toán</h3>
        <p class="pos-sub">Reception / POS - ByHat</p>
      </div>
    </div>

    <!-- Search input (hidden when hideHeader prop is true) -->
    <div v-if="!hideHeader" class="card pos-card mb-4">
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
                  <span class="text-muted">Voucher hóa đơn:</span>
                  <strong class="text-dark"
                    >{{ selectedVoucher.name }} ({{ selectedVoucher.percent }}%)</strong
                  >
                </div>
                <div v-if="selectedProductVoucherCodes.length > 0" class="mt-3">
                  <div class="small text-muted mb-2">Voucher món/combo đã áp dụng:</div>
                  <div class="d-flex flex-wrap gap-2">
                    <span 
                      v-for="code in selectedProductVoucherCodes" 
                      :key="code"
                      class="badge bg-success"
                      style="cursor: pointer;"
                      @click="removeProductVoucher(code)"
                      title="Click để xóa"
                    >
                      {{ code }} ✕
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-4">
            <div class="card pos-card h-100">
              <div class="card-body">
                <h5 class="section-title">Thuế VAT</h5>
                <div class="tax-service-info">
                  <div class="info-row">
                    <span class="text-muted">VAT (8%): </span>
                    <strong class="text-dark">{{ formatMoney(vatAmount) }}</strong>
                  </div>
                  <div class="info-row mt-2 pt-2" style="border-top: 1px solid #dee2e6;">
                    <span class="fw-semibold">Tổng thuế: </span>
                    <strong class="text-primary">{{ formatMoney(vatAmount) }}</strong>
                  </div>
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
                    <th class="text-center">Số lượng</th>
                    <th class="text-end">Đơn giá</th>
                    <th class="text-end">Giảm giá</th>
                    <th class="text-end">Thành tiền</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in payment.items" :key="item.id">
                    <td>{{ index + 1 }}</td>
                    <td class="fw-semibold">
                      {{ item.name }}
                      <div v-if="item.voucherCode" class="small text-success">
                        🎫 {{ item.voucherCode }}
                      </div>
                    </td>
                    <td>
                      <span
                        class="badge item-type-badge"
                        :class="item.type === 'PRODUCT' ? 'bg-primary-light' : 'bg-success-light'"
                      >
                        {{ item.type === 'PRODUCT' ? 'Món' : 'Combo' }}
                      </span>
                    </td>
                    <td class="text-center">{{ item.quantity }}</td>
                    <td class="text-end">{{ formatMoney(item.unitPrice) }}</td>
                    <td class="text-danger text-end">-{{ formatMoney(item.discount) }}</td>
                    <td class="fw-semibold text-end">{{ formatMoney(item.lineTotal) }}</td>
                    <td>
                      <div class="item-actions">
                        <button
                          class="btn btn-sm btn-outline-secondary"
                          :disabled="updatingItem === item.id"
                          @click="updateItemQuantity(item.id, item.quantity - 1)"
                        >
                          {{ updatingItem === item.id ? '...' : '-' }}
                        </button>
                        <button
                          class="btn btn-sm btn-outline-secondary"
                          :disabled="updatingItem === item.id"
                          @click="updateItemQuantity(item.id, item.quantity + 1)"
                        >
                          {{ updatingItem === item.id ? '...' : '+' }}
                        </button>
                        <button 
                          class="btn btn-sm btn-outline-danger" 
                          :disabled="removingItem === item.id"
                          @click="removeItem(item.id)"
                        >
                          {{ removingItem === item.id ? 'Đang xóa...' : 'Xóa' }}
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
                <span>Giảm từ điểm</span><strong>-{{ formatMoney(pointsDiscount) }}</strong>
              </div>
              <div>
                <span>VAT (8%)</span><strong>+{{ formatMoney(vatAmount) }}</strong>
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

              <div v-else-if="paymentMethod === 'TRANSFER'" class="mt-2">
                <button 
                  class="btn btn-momo w-100" 
                  :disabled="loadingMomo || isProcessingPayment"
                  @click="generateMoMoQR"
                >
                  <span v-if="loadingMomo">Đang tạo mã QR...</span>
                  <span v-else>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px; vertical-align: middle;">
                      <path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z"/>
                    </svg>
                    Tạo mã QR chuyển khoản
                  </span>
                </button>
              </div>

              <div v-else class="mt-2">
              </div>
            </div>

            <div class="mt-3 small text-muted">
              Tổng cần thanh toán: <strong>{{ formatMoney(totalPayable) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 d-flex justify-content-end gap-2">
        <!-- Chỉ hiện nút Thanh toán khi chọn Tiền mặt -->
        <button 
          v-if="paymentMethod === 'CASH'" 
          class="btn btn-primary px-4" 
          :disabled="checkingOut || isProcessingPayment" 
          @click="checkout"
        >
          {{ checkingOut ? 'Đang thanh toán...' : 'Thanh toán' }}
        </button>
        <button class="btn btn-outline-secondary px-4" @click="printInvoice">In hóa đơn</button>
        <button class="btn btn-outline-danger px-4" @click="cancelInvoice">Hủy hóa đơn</button>
      </div>
    </div>
    <div v-else class="text-muted">Vui lòng nhập ID bàn để tải hóa đơn.</div>

    <!-- MoMo QR Modal -->
    <div v-if="showMomoQr" class="momo-qr-modal">
      <div class="momo-qr-card">
        <div class="momo-qr-header">
          <h5 class="mb-0">Quét mã QR để chuyển khoản</h5>
          <button class="btn-close" @click="closeMomoQr"></button>
        </div>
        <div class="momo-qr-body">
          <div class="text-center mb-3">
            <img 
              v-if="momoQrUrl" 
              :src="momoQrUrl" 
              alt="MoMo QR Code" 
              class="momo-qr-image"
              @error="handleQrImageError"
              @load="handleQrImageLoad"
            />
            <div v-else class="text-muted">Đang tạo mã QR...</div>
          </div>
          <div class="momo-qr-info">
            <div class="info-row">
              <span>Số tiền:</span>
              <strong class="text-danger">{{ formatMoney(totalPayable) }}</strong>
            </div>
            <div class="info-row">
              <span>Mã hóa đơn:</span>
              <strong>{{ payment?.invoiceCode }}</strong>
            </div>
            
            <!-- Display polling status -->
            <div class="info-row polling-status">
              <span style="color: #28a745; display: flex; align-items: center; gap: 8px;">
                <span class="polling-dot"></span>
                Đang chờ khách xác nhận...
              </span>
            </div>
          </div>
          
          <!-- Hướng dẫn -->
          <div class="alert alert-info mt-3 mb-0">
            <small>
              <strong>📱 Hướng dẫn quét QR:</strong><br/>
              1. Đảm bảo điện thoại và máy tính <strong>cùng mạng WiFi</strong><br/>
              2. Quét mã QR bằng camera điện thoại<br/>
              3. Mở trang chuyển khoản<br/>
              4. Nhấn "Xác nhận chuyển khoản"<br/>
              5. Hệ thống sẽ tự động in hóa đơn<br/>
              <br/>
              <strong>⚙️ Cấu hình:</strong><br/>
              Nếu không quét được, vào code sửa IP máy tính tại dòng:<br/>
              <code style="font-size: 11px;">const localIP = '192.168.31.151'</code>
            </small>
          </div>
        </div>
        <div class="momo-qr-footer">
          <button class="btn btn-outline-secondary" @click="closeMomoQr">Đóng</button>
        </div>
      </div>
    </div>

    <!-- Voucher Modal -->
    <div v-if="showVoucherModal" class="voucher-modal">
      <div class="voucher-card">
        <div class="voucher-header">
          <h6 class="mb-0">Chọn voucher khả dụng</h6>
          <button class="btn-close" @click="closeVoucherModal"></button>
        </div>
        <div class="voucher-body">
          <div v-if="!allVouchers.length" class="text-muted small">
            Hiện chưa có voucher.
          </div>
          <div v-else class="voucher-list">
            <div 
              v-for="v in allVouchers" 
              :key="v.id" 
              class="voucher-item"
              :class="{ 'voucher-disabled': v.isDisabled }"
            >
              <div>
                <div class="fw-semibold">
                  Giảm {{ v.percent }}%
                  <span v-if="v.code" class="badge bg-secondary ms-2">{{ v.code }}</span>
                  <span v-if="v.voucherType === 'PRODUCT'" class="badge bg-primary ms-2">Món</span>
                  <span v-else-if="v.voucherType === 'COMBO'" class="badge bg-success ms-2">Combo</span>
                  <span v-else-if="v.voucherType === 'CUSTOMER'" class="badge bg-info ms-2">Hóa đơn</span>
                  <span v-if="v.voucherStatus === 'USED'" class="badge bg-secondary ms-2">Đã sử dụng</span>
                  <span v-else-if="v.voucherStatus === 'EXPIRED'" class="badge bg-warning ms-2">Hết hạn</span>
                  <span v-else-if="v.voucherStatus === 'INACTIVE'" class="badge bg-dark ms-2">Vô hiệu</span>
                </div>
                <div class="small text-muted">
                  {{ v.percent }}% · HSD {{ formatDateTime(v.expiresAt) }}
                  <span v-if="v.remainingQuantity" class="ms-2">· Còn {{ v.remainingQuantity }} lượt</span>
                </div>
              </div>
              <button 
                class="btn btn-sm btn-primary" 
                @click="selectVoucher(v.id, v.voucherType, v.code)"
                :disabled="v.isDisabled"
              >
                Chọn
              </button>
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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  cancelPayment,
  checkoutPayment,
  deletePaymentItem,
  getPaymentByTable,
  updatePaymentItem,
} from '@/services/paymentApi'
import Swal from 'sweetalert2'
import QRCode from 'qrcode'

const props = defineProps<{
  initialTableId?: number
  hideHeader?: boolean
}>()

const emit = defineEmits<{
  paymentComplete: []
  cancelComplete: []
}>()

const router = useRouter()
const route = useRoute()

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
    voucherCode?: string
    productId?: number
    comboId?: number
  }[]
  vouchers: {
    id: number
    code?: string
    name: string
    percent: number
    expiresAt: string
    remainingQuantity: number
    voucherStatus?: string
    voucherType?: string
    applicableItemId?: number
    applicableItemName?: string
  }[]
  subtotal: number
  itemVoucherDiscount: number
  vatPercent: number
  serviceFeePercent: number
  pointValue: number
}

const payment = ref<Payment | null>(null)
const tableIdInput = ref<number | null>(null)
const loading = ref(false)
const checkingOut = ref(false)
const errorMsg = ref('')

// Race condition protection - Prevent duplicate payment processing
const isProcessingPayment = ref(false)

const selectedVoucherId = ref<number | ''>('')
const selectedProductVoucherCodes = ref<string[]>([]) // Product/Combo voucher codes
const voucherCodeInput = ref('')
const usePoints = ref(0)

const paymentMethod = ref<'CASH' | 'TRANSFER' | 'EWALLET'>('CASH')
const cashReceived = ref(0)
const paymentNote = ref('')

const showVoucherModal = ref(false)

// MoMo payment states
const momoQrUrl = ref('')
const showMomoQr = ref(false)
const loadingMomo = ref(false)

// Payment notification polling
let notificationInterval: number | null = null

// Loading states for item operations
const updatingItem = ref<number | null>(null)
const removingItem = ref<number | null>(null)

// Start polling for payment notifications
const startPolling = () => {
  stopPolling()
  
  notificationInterval = window.setInterval(async () => {
    if (!payment.value || !tableIdInput.value) {
      return
    }
    
    try {
      const response = await fetch(`/api/public/notification/check/${tableIdInput.value}`)
      const result = await response.json()
      
      if (result.success && result.hasNotification) {
        stopPolling()
        
        if (showMomoQr.value) {
          closeMomoQr()
        }
        
        await handlePaymentSuccess(result.amount)
      }
    } catch (error) {
      // Silently handle polling errors to avoid console spam
    }
  }, 3000)
}

// Stop polling for payment notifications
const stopPolling = () => {
  if (notificationInterval) {
    clearInterval(notificationInterval)
    notificationInterval = null
  }
}

onMounted(() => {
  // Check if initialTableId prop is provided
  if (props.initialTableId) {
    tableIdInput.value = props.initialTableId
    loadPayment()
  }
  
  // Check if reset query param is present
  if (route.query.reset === 'true') {
    payment.value = null
    tableIdInput.value = null
    errorMsg.value = ''
    router.replace({ query: {} })
  }
})

// Watch route query for reset
watch(() => route.query.reset, (newVal) => {
  if (newVal === 'true') {
    payment.value = null
    tableIdInput.value = null
    errorMsg.value = ''
    router.replace({ query: {} })
  }
})

onUnmounted(() => {
  stopPolling()
})

const handlePaymentSuccess = async (amount: number) => {
  // Stop polling immediately to prevent duplicates
  stopPolling()
  
  // Save invoice data before payment
  const savedPayment = payment.value ? { ...payment.value } : null
  const savedTotalPayable = totalPayable.value
  const savedSubtotal = subtotal.value
  const savedItemVoucherDiscount = itemVoucherDiscount.value
  const savedInvoiceVoucherDiscount = invoiceVoucherDiscount.value
  const savedVatAmount = vatAmount.value
  const savedServiceFeeAmount = serviceFeeAmount.value
  const savedPointsDiscount = pointsDiscount.value
  const savedTableText = tableText.value
  const savedSelectedVoucher = selectedVoucher.value
  
  // Show success notification
  Swal.fire({
    icon: 'success',
    title: 'Khách đã chuyển khoản!',
    html: `
      <div style="text-align: center; margin-top: 20px;">
        <p><strong>Số tiền:</strong> ${formatMoney(amount)}</p>
        <p style="color: #28a745; margin-top: 15px;">✓ Đang xử lý thanh toán...</p>
      </div>
    `,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  })
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Process payment with auto print
  await checkoutWithAutoPrint(savedPayment, savedTotalPayable, savedSubtotal, savedItemVoucherDiscount, savedInvoiceVoucherDiscount, savedVatAmount, savedServiceFeeAmount, savedPointsDiscount, savedTableText, savedSelectedVoucher)
}

const allVouchers = computed(() => {
  if (!payment.value) return []
  const list = payment.value.vouchers || []
  const items = payment.value.items || []
  
  return list.map((v) => {
    const isActive = v.voucherStatus === 'ACTIVE'
    
    // Filter Product/Combo vouchers - only show if invoice has matching item
    let hasMatchingItem = true
    if (v.voucherType === 'PRODUCT' && v.applicableItemId) {
      hasMatchingItem = items.some(item => item.productId === v.applicableItemId)
    } else if (v.voucherType === 'COMBO' && v.applicableItemId) {
      hasMatchingItem = items.some(item => item.comboId === v.applicableItemId)
    }
    
    return {
      ...v,
      isActive,
      isDisabled: !isActive || !hasMatchingItem,
      hasMatchingItem
    }
  }).filter(v => {
    // Hide Product/Combo vouchers that don't have matching items
    if ((v.voucherType === 'PRODUCT' || v.voucherType === 'COMBO') && !v.hasMatchingItem) {
      return false
    }
    return true
  }).sort((a, b) => {
    // Active vouchers first, then used/expired/inactive vouchers
    if (a.isActive && !b.isActive) return -1
    if (!a.isActive && b.isActive) return 1
    return 0
  })
})

const validVouchers = computed(() => {
  return allVouchers.value.filter(v => v.isActive)
})

const selectedVoucher = computed(() =>
  validVouchers.value.find((v) => v.id === selectedVoucherId.value),
)

const subtotal = computed(() => payment.value?.subtotal || 0)

// Calculate item voucher discount based on selected Product/Combo voucher codes
const itemVoucherDiscount = computed(() => {
  if (!payment.value || selectedProductVoucherCodes.value.length === 0) {
    return payment.value?.itemVoucherDiscount || 0
  }
  
  let totalDiscount = 0
  const items = payment.value.items || []
  
  // For each selected voucher code
  for (const code of selectedProductVoucherCodes.value) {
    // Find the voucher details
    const voucher = validVouchers.value.find(v => v.code === code)
    if (!voucher) continue
    
    // Find matching items
    for (const item of items) {
      let matches = false
      
      if (voucher.voucherType === 'PRODUCT' && item.productId === voucher.applicableItemId) {
        matches = true
      } else if (voucher.voucherType === 'COMBO' && item.comboId === voucher.applicableItemId) {
        matches = true
      }
      
      if (matches) {
        // Calculate discount for this item
        const itemTotal = item.unitPrice * item.quantity
        const discount = Math.floor((itemTotal * voucher.percent) / 100)
        totalDiscount += discount
      }
    }
  }
  
  return totalDiscount
})

const invoiceVoucherDiscount = computed(() => {
  const voucher = validVouchers.value.find((v) => v.id === selectedVoucherId.value)
  if (!voucher) return 0
  const base = subtotal.value - itemVoucherDiscount.value
  if (base <= 0) return 0
  return Math.floor((base * voucher.percent) / 100)
})

// Calculate taxable base (after all discounts except points)
const baseAfterVoucher = computed(() => {
  return Math.max(0, subtotal.value - itemVoucherDiscount.value - invoiceVoucherDiscount.value)
})

const pointsDiscount = computed(() => {
  if (!payment.value) return 0
  const pointValue = payment.value.pointValue || 1000
  const maxByPoints = Math.max(0, usePoints.value) * pointValue
  
  // Points can only reduce up to baseAfterVoucher
  const maxAllowed = baseAfterVoucher.value
  return Math.max(0, Math.min(maxByPoints, maxAllowed))
})

// Taxable base = baseAfterVoucher - pointsDiscount
const taxableBase = computed(() => {
  return Math.max(0, baseAfterVoucher.value - pointsDiscount.value)
})

// VAT amount (8% of taxable base)
const vatAmount = computed(() => {
  if (!payment.value) return 0
  const vatPercent = payment.value.vatPercent || 8
  return Math.floor((taxableBase.value * vatPercent) / 100)
})

// Service fee amount (0% of taxable base)
const serviceFeeAmount = computed(() => {
  if (!payment.value) return 0
  const serviceFeePercent = payment.value.serviceFeePercent || 0
  return Math.floor((taxableBase.value * serviceFeePercent) / 100)
})

const totalPayable = computed(() =>
  Math.max(0, taxableBase.value + vatAmount.value + serviceFeeAmount.value),
)

const changeDue = computed(() =>
  paymentMethod.value === 'CASH' ? Math.max(0, cashReceived.value - totalPayable.value) : 0,
)

const tableText = computed(() => {
  if (!payment.value || !payment.value.tables.length) return 'Chưa có'
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
    selectedProductVoucherCodes.value = []
    usePoints.value = 0
    voucherCodeInput.value = ''
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
    // Check voucher type
    if (found.voucherType === 'CUSTOMER') {
      // Customer voucher - select as invoice voucher
      selectedVoucherId.value = found.id
      voucherCodeInput.value = ''
    } else if (found.voucherType === 'PRODUCT' || found.voucherType === 'COMBO') {
      // Product/Combo voucher - add to list
      if (!selectedProductVoucherCodes.value.includes(code)) {
        selectedProductVoucherCodes.value.push(code)
        voucherCodeInput.value = ''
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          html: '<div style="font-family: Arial, sans-serif;">Đã áp dụng voucher thành công</div>',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        })
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          html: '<div style="font-family: Arial, sans-serif;">Voucher đã được áp dụng rồi</div>',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        })
      }
    }
  } else {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      html: '<div style="font-family: Arial, sans-serif;">Không tìm thấy voucher hợp lệ</div>',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    })
    selectedVoucherId.value = ''
  }
}

const openVoucherModal = () => {
  showVoucherModal.value = true
}

const closeVoucherModal = () => {
  showVoucherModal.value = false
}

const selectVoucher = (id: number, voucherType?: string, code?: string) => {
  if (voucherType === 'CUSTOMER') {
    // Customer voucher - select as invoice voucher
    selectedVoucherId.value = id
    closeVoucherModal()
  } else if (voucherType === 'PRODUCT' || voucherType === 'COMBO') {
    // Product/Combo voucher - add to list
    if (code && !selectedProductVoucherCodes.value.includes(code)) {
      selectedProductVoucherCodes.value.push(code)
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        html: '<div style="font-family: Arial, sans-serif;">Đã áp dụng voucher thành công</div>',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      })
    }
    closeVoucherModal()
  } else {
    // Fallback - treat as customer voucher
    selectedVoucherId.value = id
    closeVoucherModal()
  }
}

const clearVoucher = () => {
  selectedVoucherId.value = ''
  voucherCodeInput.value = ''
}

const removeProductVoucher = (code: string) => {
  selectedProductVoucherCodes.value = selectedProductVoucherCodes.value.filter(c => c !== code)
}

// Generate MoMo QR code for payment
const generateMoMoQR = async () => {
  if (!payment.value || !tableIdInput.value) return
  
  loadingMomo.value = true
  
  try {
    // Create payment URL - Update this IP if needed
    const localIP = '192.168.31.151'
    const url = `http://${localIP}:5173/mock-bank-transfer?tid=${tableIdInput.value}&iid=${payment.value.invoiceId}&amt=${totalPayable.value}`
    
    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    momoQrUrl.value = qrDataUrl
    showMomoQr.value = true
    
    // Start polling when QR modal opens
    startPolling()
    
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Không thể tạo mã QR',
      text: error.message || 'Có lỗi xảy ra khi tạo mã QR',
      confirmButtonText: 'Đóng'
    })
  } finally {
    loadingMomo.value = false
  }
}

const closeMomoQr = () => {
  showMomoQr.value = false
  momoQrUrl.value = ''
  stopPolling()
}

const handleQrImageError = () => {
  // QR image failed to load - handled silently
}

const handleQrImageLoad = () => {
  // QR image loaded successfully
}

const updateItemQuantity = async (itemId: number, quantity: number) => {
  if (!payment.value) return
  
  // Prevent multiple simultaneous updates
  if (updatingItem.value === itemId) {
    return
  }
  
  updatingItem.value = itemId
  try {
    await updatePaymentItem(itemId, Math.max(0, quantity))
    await loadPayment()
  } catch (error: any) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: error.response?.data?.message || 'Không cập nhật được món',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    })
  } finally {
    updatingItem.value = null
  }
}

const removeItem = async (itemId: number) => {
  if (!payment.value) return
  
  // Prevent multiple simultaneous removals
  if (removingItem.value === itemId) {
    return
  }
  
  removingItem.value = itemId
  try {
    await deletePaymentItem(itemId)
    await loadPayment()
  } catch (error: any) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: error.response?.data?.message || 'Không xoá được món',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    })
  } finally {
    removingItem.value = null
  }
}

const checkout = async () => {
  if (!payment.value) return
  
  // Check if payment is already being processed
  if (isProcessingPayment.value) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: 'Đang xử lý thanh toán, vui lòng đợi...',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    })
    return
  }
  
  // Validate invoice status
  if (payment.value.invoiceStatus === 'PAID') {
    Swal.fire({
      icon: 'warning',
      title: 'Hóa đơn đã thanh toán',
      text: 'Hóa đơn này đã được thanh toán rồi',
      confirmButtonText: 'Đóng',
    })
    return
  }
  
  if (payment.value.invoiceStatus === 'CANCELLED') {
    Swal.fire({
      icon: 'warning',
      title: 'Hóa đơn đã hủy',
      text: 'Không thể thanh toán hóa đơn đã hủy',
      confirmButtonText: 'Đóng',
    })
    return
  }
  
  // Validate payment amount
  if (totalPayable.value <= 0) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: 'Số tiền thanh toán không hợp lệ',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    })
    return
  }
  
  // Validate cash payment
  if (paymentMethod.value === 'CASH' && cashReceived.value < totalPayable.value) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: 'Tiền khách đưa chưa đủ',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    })
    return
  }
  
  // Validate loyalty points
  if (usePoints.value > (payment.value.loyaltyPoints || 0)) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: 'Số điểm sử dụng vượt quá điểm hiện có',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    })
    return
  }
  
  // Payment preview before confirmation
  const methodLabelMap: Record<string, string> = {
    CASH: 'Tiền mặt',
    TRANSFER: 'Chuyển khoản',
    EWALLET: 'Ví điện tử',
  }
  
  let previewHtml = `
    <div style="text-align: left; font-size: 15px; line-height: 1.8;">
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
        <span style="color: #666;">Mã hóa đơn:</span>
        <strong style="color: #333;">${payment.value.invoiceCode}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
        <span style="color: #666;">Phương thức:</span>
        <strong style="color: #333;">${methodLabelMap[paymentMethod.value]}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 2px solid #28a745;">
        <span style="color: #666;">Tổng tiền:</span>
        <strong style="color: #28a745; font-size: 18px;">${formatMoney(totalPayable.value)}</strong>
      </div>
  `
  
  if (paymentMethod.value === 'CASH') {
    previewHtml += `
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
        <span style="color: #666;">Khách đưa:</span>
        <strong style="color: #333;">${formatMoney(cashReceived.value)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px 0;">
        <span style="color: #666;">Tiền thối:</span>
        <strong style="color: #17a2b8;">${formatMoney(changeDue.value)}</strong>
      </div>
    `
  }
  
  if (usePoints.value > 0) {
    previewHtml += `
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid #dee2e6;">
        <span style="color: #666;">Điểm sử dụng:</span>
        <strong style="color: #ffc107;">${usePoints.value} điểm</strong>
      </div>
    `
  }
  
  if (selectedVoucher.value) {
    previewHtml += `
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid #dee2e6;">
        <span style="color: #666;">Voucher:</span>
        <strong style="color: #dc3545;">${selectedVoucher.value.name}</strong>
      </div>
    `
  }
  
  previewHtml += `</div>`
  
  const confirmResult = await Swal.fire({
    icon: 'question',
    title: '💳 Xác nhận thanh toán',
    html: `
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 15px 0;">
        ${previewHtml}
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '✅ Xác nhận thanh toán',
    cancelButtonText: '❌ Hủy',
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#6c757d',
    customClass: {
      popup: 'swal-wide',
      confirmButton: 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn'
    }
  })
  
  if (!confirmResult.isConfirmed) return
  
  // Lưu thông tin hóa đơn trước khi thanh toán (để in sau)
  const savedPayment = { ...payment.value }
  const savedTotalPayable = totalPayable.value
  const savedSubtotal = subtotal.value
  const savedItemVoucherDiscount = itemVoucherDiscount.value
  const savedInvoiceVoucherDiscount = invoiceVoucherDiscount.value
  const savedVatAmount = vatAmount.value
  const savedServiceFeeAmount = serviceFeeAmount.value
  const savedPointsDiscount = pointsDiscount.value
  const savedTableText = tableText.value
  const savedSelectedVoucher = selectedVoucher.value
  const savedPaymentMethod = paymentMethod.value
  const savedCashReceived = cashReceived.value
  const savedChangeDue = changeDue.value
  
  // Set flag to prevent duplicate processing
  isProcessingPayment.value = true
  checkingOut.value = true
  
  try {
    // Hiển thị thông báo đang xử lý
    Swal.fire({
      icon: 'info',
      title: 'Đang xử lý thanh toán...',
      html: `
        <div style="text-align: center; margin-top: 20px;">
          <p><strong>Phương thức:</strong> ${methodLabelMap[savedPaymentMethod]}</p>
          <p><strong>Số tiền:</strong> ${formatMoney(savedTotalPayable)}</p>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })
    
    const res = await checkoutPayment({
      tableId: tableIdInput.value as number,
      customerVoucherId: selectedVoucherId.value ? Number(selectedVoucherId.value) : null,
      voucherCodes: selectedProductVoucherCodes.value.length > 0 ? selectedProductVoucherCodes.value : null,
      usePoints: usePoints.value,
      paymentMethod: paymentMethod.value,
      cashReceived: paymentMethod.value === 'CASH' ? cashReceived.value : 0,
      payments: [
        {
          method: paymentMethod.value,
          amount: totalPayable.value,
          note: paymentNote.value,
        },
      ],
    } as any)
    const data = res.data.data
    
    // Wait 2 seconds for popup to display
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Close processing notification
    Swal.close()
    
    // Prepare payment method labels
    const paymentMethodLabels: Record<string, string> = {
      CASH: 'Tiền mặt',
      TRANSFER: 'Chuyển khoản',
      EWALLET: 'Ví điện tử',
    }
    
    // Show bill with Print button
    const billResult = await Swal.fire({
      icon: 'success',
      title: '✅ Thanh toán thành công!',
      html: `
        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 15px 0;">
          <div style="text-align: left; font-size: 15px; line-height: 1.8;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
              <span style="color: #666;">Mã hóa đơn:</span>
              <strong style="color: #333;">${savedPayment.invoiceCode}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
              <span style="color: #666;">Phương thức:</span>
              <strong style="color: #333;">${paymentMethodLabels[savedPaymentMethod]}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 2px solid #28a745;">
              <span style="color: #666;">Tổng tiền:</span>
              <strong style="color: #28a745; font-size: 18px;">${formatMoney(data.totalPayable)}</strong>
            </div>
            ${savedPaymentMethod === 'CASH' ? `
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                <span style="color: #666;">Khách đưa:</span>
                <strong style="color: #333;">${formatMoney(savedCashReceived)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                <span style="color: #666;">Tiền thối:</span>
                <strong style="color: #17a2b8;">${formatMoney(savedChangeDue)}</strong>
              </div>
            ` : ''}
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '🖨️ In hóa đơn',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#6c757d',
    })
    
    // Nếu nhân viên nhấn "In hóa đơn"
    if (billResult.isConfirmed) {
      // Hiển thị popup "Đang xuất bill..."
      Swal.fire({
        icon: 'info',
        title: '🖨️ Đang xuất hóa đơn...',
        html: `
          <div style="text-align: center; padding: 20px 0;">
            <div style="font-size: 48px; margin-bottom: 15px;">🖨️</div>
            <p style="font-size: 15px; color: #666; margin: 0;">Vui lòng chờ trong giây lát</p>
          </div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false,
        timer: 1500,
        timerProgressBar: true,
      })
      
      // Đợi 500ms rồi in
      await new Promise(resolve => setTimeout(resolve, 500))
      
      printInvoiceWithData(
        savedPayment,
        savedTotalPayable,
        savedSubtotal,
        savedItemVoucherDiscount,
        savedInvoiceVoucherDiscount,
        savedVatAmount,
        savedServiceFeeAmount,
        savedPointsDiscount,
        savedTableText,
        savedSelectedVoucher
      )
      
      // Wait for print to complete then show toast
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Show success toast notification
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: '✅ Đã xuất hóa đơn thành công!',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      })
    }
    
    // Reset form
    payment.value = null
    tableIdInput.value = null
    
    // Emit payment complete event
    emit('paymentComplete')
    
  } catch (error: any) {
    let errorMessage = 'Có lỗi xảy ra khi thanh toán'
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }
    
    Swal.fire({
      icon: 'error',
      title: 'Thanh toán thất bại',
      text: errorMessage,
      confirmButtonText: 'Đóng',
      confirmButtonColor: '#dc3545',
    })
  } finally {
    checkingOut.value = false
    // Reset flag after completion
    isProcessingPayment.value = false
  }
}

// Checkout with auto print (used for QR payment)
const checkoutWithAutoPrint = async (
  savedPayment: any,
  savedTotalPayable: number,
  savedSubtotal: number,
  savedItemVoucherDiscount: number,
  savedInvoiceVoucherDiscount: number,
  savedVatAmount: number,
  savedServiceFeeAmount: number,
  savedPointsDiscount: number,
  savedTableText: string,
  savedSelectedVoucher: any
) => {
  if (!savedPayment || !tableIdInput.value) return
  
  // Check if payment is already being processed
  if (isProcessingPayment.value) {
    return
  }
  
  // Validate invoice status
  if (savedPayment.invoiceStatus === 'PAID') {
    Swal.fire({
      icon: 'warning',
      title: 'Hóa đơn đã thanh toán',
      text: 'Hóa đơn này đã được thanh toán rồi',
    })
    return
  }
  
  if (savedPayment.invoiceStatus === 'CANCELLED') {
    Swal.fire({
      icon: 'warning',
      title: 'Hóa đơn đã hủy',
      text: 'Không thể thanh toán hóa đơn đã hủy',
    })
    return
  }
  
  // Set flag
  isProcessingPayment.value = true
  checkingOut.value = true
  
  try {
    // Call payment API
    const res = await checkoutPayment({
      tableId: tableIdInput.value as number,
      customerVoucherId: selectedVoucherId.value ? Number(selectedVoucherId.value) : null,
      voucherCodes: selectedProductVoucherCodes.value.length > 0 ? selectedProductVoucherCodes.value : null,
      usePoints: usePoints.value,
      paymentMethod: 'TRANSFER',
      cashReceived: 0,
      payments: [
        {
          method: 'TRANSFER',
          amount: savedTotalPayable,
          note: 'Chuyển khoản qua QR Code',
        },
      ],
    } as any)
    
    const data = res.data.data
    
    // Show bill with Print button (same as cash payment)
    const billResult = await Swal.fire({
      icon: 'success',
      title: '✅ Thanh toán thành công!',
      html: `
        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 15px 0;">
          <div style="text-align: left; font-size: 15px; line-height: 1.8;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
              <span style="color: #666;">Mã hóa đơn:</span>
              <strong style="color: #333;">${savedPayment.invoiceCode}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
              <span style="color: #666;">Phương thức:</span>
              <strong style="color: #333;">Chuyển khoản</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 2px solid #28a745;">
              <span style="color: #666;">Tổng tiền:</span>
              <strong style="color: #28a745; font-size: 18px;">${formatMoney(data.totalPayable)}</strong>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '🖨️ In hóa đơn',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#6c757d',
    })
    
    // If staff clicks "Print Invoice"
    if (billResult.isConfirmed) {
      // Show "Printing..." popup
      Swal.fire({
        icon: 'info',
        title: '🖨️ Đang xuất hóa đơn...',
        html: `
          <div style="text-align: center; padding: 20px 0;">
            <div style="font-size: 48px; margin-bottom: 15px;">🖨️</div>
            <p style="font-size: 15px; color: #666; margin: 0;">Vui lòng chờ trong giây lát</p>
          </div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false,
        timer: 1500,
        timerProgressBar: true,
      })
      
      // Wait 500ms then print
      await new Promise(resolve => setTimeout(resolve, 500))
      
      printInvoiceWithData(
        savedPayment,
        savedTotalPayable,
        savedSubtotal,
        savedItemVoucherDiscount,
        savedInvoiceVoucherDiscount,
        savedVatAmount,
        savedServiceFeeAmount,
        savedPointsDiscount,
        savedTableText,
        savedSelectedVoucher
      )
      
      // Wait for print to complete then show toast
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Show success toast notification
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: '✅ Đã xuất hóa đơn thành công!',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      })
    }
    
    // Reset form
    payment.value = null
    tableIdInput.value = null
    
    // Emit payment complete event
    emit('paymentComplete')
    
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Thanh toán thất bại',
      text: error.response?.data?.message || 'Có lỗi xảy ra khi thanh toán',
      confirmButtonText: 'Đóng',
      confirmButtonColor: '#dc3545',
    })
  } finally {
    checkingOut.value = false
    // Reset flag
    isProcessingPayment.value = false
  }
}

const cancelInvoice = async () => {
  if (!tableIdInput.value) return
  
  // Confirmation dialog before canceling
  const result = await Swal.fire({
    icon: 'warning',
    title: 'Xác nhận hủy hóa đơn',
    html: `
      <div style="text-align: left; margin-top: 15px;">
        <p><strong>Mã hóa đơn:</strong> ${payment.value?.invoiceCode || 'N/A'}</p>
        <p style="color: #dc3545; margin-top: 15px;">
          ⚠️ Hành động này không thể hoàn tác!
        </p>
        <p style="font-size: 14px; color: #666;">
          Tất cả thông tin món ăn, giảm giá sẽ bị xóa.
        </p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Hủy hóa đơn',
    cancelButtonText: 'Không',
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
  })
  
  if (!result.isConfirmed) return
  
  try {
    await cancelPayment(tableIdInput.value)
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Hóa đơn đã hủy',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    })
    payment.value = null
    emit('cancelComplete')
  } catch (error: any) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: error.response?.data?.message || 'Hủy hóa đơn thất bại',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    })
  }
}

const printInvoice = async () => {
  if (!payment.value) return
  
  // Show "Printing..." notification
  Swal.fire({
    icon: 'info',
    title: '🖨️ Đang in hóa đơn...',
    html: `
      <div style="text-align: center; padding: 20px 0;">
        <div style="font-size: 48px; margin-bottom: 15px;">🖨️</div>
        <p style="font-size: 15px; color: #666; margin: 0;">Vui lòng chờ trong giây lát</p>
      </div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    timer: 1500,
    timerProgressBar: true,
  })
  
  // Wait 500ms then print
  await new Promise(resolve => setTimeout(resolve, 500))
  
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
        @page { size: A4 portrait; margin: 8mm; }
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
          padding: 10px;
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
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 8px;
          margin-bottom: 2px;
        }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 10px 0; }
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
          <div><span>Giảm voucher hóa đơn</span><span>-${formatMoney(invoiceVoucherDiscount.value)}</span></div>
          <div><span>Giảm từ điểm</span><span>-${formatMoney(pointsDiscount.value)}</span></div>
          <div><span>VAT (8%)</span><span>+${formatMoney(vatAmount.value)}</span></div>
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

  // Tính toán kích thước và vị trí canh giữa màn hình
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  const popupWidth = 800
  const popupHeight = 900
  const left = Math.round((screenWidth - popupWidth) / 2)
  const top = Math.round((screenHeight - popupHeight) / 2)

  const printWindow = window.open(
    '', 
    '_blank', 
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
  )
  
  if (!printWindow) return
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
}

// Print invoice with saved data (used after payment)
const printInvoiceWithData = (
  savedPayment: Payment,
  savedTotalPayable: number,
  savedSubtotal: number,
  savedItemVoucherDiscount: number,
  savedInvoiceVoucherDiscount: number,
  savedVatAmount: number,
  savedServiceFeeAmount: number,
  savedPointsDiscount: number,
  savedTableText: string,
  savedSelectedVoucher: any
) => {
  const items = savedPayment.items || []
  const voucherName = savedSelectedVoucher ? savedSelectedVoucher.name : 'Không áp dụng'
  const voucherPercent = savedSelectedVoucher ? `${savedSelectedVoucher.percent}%` : ''
  const printedAt = new Date().toLocaleString('vi-VN', { hour12: false })
  const printTitle = 'HÓA ĐƠN THANH TOÁN'
  const paymentLabel = 'Chuyển khoản'
  const paymentSummary = `${paymentLabel}: ${formatMoney(savedTotalPayable)}`

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
        @page { size: A4 portrait; margin: 8mm; }
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
          padding: 10px;
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
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 8px;
          margin-bottom: 2px;
        }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 10px 0; }
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
      </style>
    </head>
    <body>
      <div class="receipt">
        <h1>${printTitle}</h1>
        <div class="sub">ByHat - Reception/POS</div>
        <div class="meta">
          <div><span>Mã hóa đơn</span><span>${savedPayment.invoiceCode}</span></div>
          <div><span>Bàn</span><span>${savedTableText}</span></div>
          <div><span>Khách</span><span>${savedPayment.customerName}</span></div>
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
          <div>Giảm: -${formatMoney(savedInvoiceVoucherDiscount)}</div>
        </div>
        <div class="totals">
          <div><span>Tạm tính</span><span>${formatMoney(savedSubtotal)}</span></div>
          <div><span>Giảm voucher món</span><span>-${formatMoney(savedItemVoucherDiscount)}</span></div>
          <div><span>Giảm voucher hóa đơn</span><span>-${formatMoney(savedInvoiceVoucherDiscount)}</span></div>
          <div><span>Giảm từ điểm</span><span>-${formatMoney(savedPointsDiscount)}</span></div>
          <div><span>VAT (8%)</span><span>+${formatMoney(savedVatAmount)}</span></div>
          <div class="total"><span>TỔNG THANH TOÁN</span><span>${formatMoney(savedTotalPayable)}</span></div>
        </div>
        <div class="voucher">
          <div><strong>Thanh toán</strong></div>
          <div>${paymentSummary}</div>
        </div>
        <div class="center">Cảm ơn quý khách!</div>
      </div>
    </body>
  </html>
  `

  // Tính toán kích thước và vị trí canh giữa màn hình
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  const popupWidth = 800
  const popupHeight = 900
  const left = Math.round((screenWidth - popupWidth) / 2)
  const top = Math.round((screenHeight - popupHeight) / 2)

  const printWindow = window.open(
    '', 
    '_blank', 
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
  )
  
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
  font-family: 'Inter', 'Be Vietnam Pro', sans-serif;
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
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 4px;
}

.pos-sub {
  color: #64748b;
  font-weight: 500;
  margin: 0;
}

.pos-card {
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
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
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
}

.table thead th {
  background: #f7fafc;
  font-weight: 700;
  color: #334155;
}

.table .fw-semibold {
  font-weight: 700;
  color: #0f172a;
}

.section-title {
  font-weight: 800;
  font-size: 20px;
  color: #0f172a;
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
  color: #475569;
  font-weight: 600;
  font-size: 15px;
}

.info-grid span::after {
  content: ':';
  margin-left: 4px;
}


.info-grid strong {
  text-align: left;
  word-break: break-word;
  font-weight: 700;
  font-size: 15px;
  color: #0f172a;
}

.summary-grid {
  display: grid;
  gap: 10px;
}

.summary-grid div {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 15px;
  color: #334155;
}

.summary-grid strong {
  font-weight: 700;
  color: #0f172a;
}

.total-line {
  padding-top: 12px;
  border-top: 1px dashed #d7c9c9;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
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
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 13px;
}

.bg-primary-light {
  background: #e7f0ff;
  color: #667eea;
  font-weight: 700;
}

.bg-success-light {
  background: #e8f8f0;
  color: #15803d;
  font-weight: 700;
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

.voucher-header h6 {
  font-weight: 800;
  font-size: 18px;
  color: #0f172a;
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
  transition: all 0.2s ease;
}

.voucher-item .fw-semibold {
  font-weight: 700;
  font-size: 15px;
  color: #0f172a;
}

.voucher-item .small {
  font-weight: 600;
  color: #64748b;
}

.voucher-item.voucher-disabled {
  opacity: 0.5;
  background: #f5f5f5;
  border-color: #ddd;
}

.voucher-item.voucher-disabled .fw-semibold {
  text-decoration: line-through;
  color: #999;
}

.voucher-item.voucher-disabled .text-muted {
  color: #bbb !important;
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

/* MoMo Button Styles */
.btn-momo {
  background: linear-gradient(135deg, rgba(30, 136, 229, 0.85) 0%, rgba(21, 101, 192, 0.85) 100%);
  color: white;
  font-weight: 600;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(30, 136, 229, 0.25);
}

.btn-momo:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(21, 101, 192, 0.95) 0%, rgba(13, 71, 161, 0.95) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 136, 229, 0.35);
  color: white;
}

.btn-momo:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* MoMo QR Modal Styles */
.momo-qr-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}

.momo-qr-card {
  width: 100%;
  max-width: 480px;
  background: #fff;
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

.momo-qr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  color: white;
}

.momo-qr-header h5 {
  margin: 0;
  font-weight: 600;
}

.momo-qr-header .btn-close {
  filter: brightness(0) invert(1);
}

.momo-qr-body {
  padding: 24px 20px;
}

.momo-qr-image {
  max-width: 350px;
  width: 100%;
  height: auto;
  border: 2px solid #eee;
  border-radius: 12px;
  padding: 12px;
  background: white;
}

.momo-qr-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.momo-qr-info .info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.momo-qr-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid #eee;
}

/* Polling status indicator */
.polling-status {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #eee;
}

.polling-dot {
  width: 8px;
  height: 8px;
  background: #28a745;
  border-radius: 50%;
  display: inline-block;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

/* Bootstrap Form Controls Override */
.form-control,
.form-select {
  font-family: 'Inter', 'Be Vietnam Pro', sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: #0f172a;
  border-color: #e2e8f0;
  transition: all 0.3s ease;
}

.form-control::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.form-control:focus,
.form-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-label {
  font-weight: 700;
  color: #334155;
  font-size: 15px;
}

.text-muted {
  color: #64748b !important;
  font-weight: 600;
}

.text-dark {
  color: #0f172a !important;
  font-weight: 700;
}

/* Bootstrap Button Overrides for Reception */
.btn-primary {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(37, 99, 235, 0.85) 100%) !important;
  border: none !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}

.btn-outline-primary {
  border-color: rgba(59, 130, 246, 0.5) !important;
  color: #3b82f6 !important;
  background: rgba(59, 130, 246, 0.05) !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.btn-outline-primary:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.15) !important;
  border-color: rgba(59, 130, 246, 0.7) !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.btn-outline-secondary {
  border-color: rgba(100, 116, 139, 0.3) !important;
  color: #64748b !important;
  background: rgba(241, 245, 249, 0.5) !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.btn-outline-secondary:hover:not(:disabled) {
  background: rgba(226, 232, 240, 0.7) !important;
  border-color: rgba(100, 116, 139, 0.5) !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-outline-danger {
  border-color: rgba(239, 68, 68, 0.5) !important;
  color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.05) !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.btn-outline-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15) !important;
  border-color: rgba(239, 68, 68, 0.7) !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.btn:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed;
}

</style>
