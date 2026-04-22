<template>
  <div class="order-container">
    <div class="container-fluid p-4">
      <!-- BACK BUTTON -->
      <button class="btn-back-top" @click="goBack">← Chọn bàn khác</button>

      <!-- TABLE INFO BANNER - CENTERED -->
      <div v-if="invoiceInfo" class="table-info-banner">
        <div class="banner-content">
          <span class="info-label">Khách hàng:</span>
          <span class="info-value">{{ invoiceInfo.customerName }}</span>
          <span class="divider">|</span>
          <span class="info-label">Khu vực:</span>
          <span class="info-value">{{ invoiceInfo.tables[0]?.area || 'N/A' }}</span>
          <span class="divider">|</span>
          <span class="info-label">Bàn:</span>
          <span class="info-value">{{ tableNames }}</span>
          <span class="divider">|</span>
          <span class="info-label">Tầng:</span>
          <span class="info-value">{{ invoiceInfo.tables[0]?.floor }}</span>
        </div>
      </div>

      <!-- GHI CHÚ MÓN TỪ KHÁCH -->
      <div v-if="invoiceInfo?.foodNote && !foodNoteDismissed" class="food-note-banner">
        <div class="fn-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8a835" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <strong>Khách ghi chú món đặt trước</strong>
          <button class="fn-dismiss" @click="foodNoteDismissed = true">&times;</button>
        </div>
        <div class="fn-items">
          <div class="fn-item" v-for="(item, idx) in parsedFoodNotes" :key="idx">
            <label class="fn-check">
              <input type="checkbox" v-model="item.selected" />
              <span>{{ item.text }}</span>
            </label>
          </div>
        </div>
        <div class="fn-actions">
          <button class="fn-btn fn-add" @click="addFoodNotes" :disabled="selectedFoodNotes.length === 0">
            Order {{ selectedFoodNotes.length }} món đã chọn
          </button>
          <button class="fn-btn fn-skip" @click="foodNoteDismissed = true">Bỏ qua</button>
        </div>
      </div>

      <!-- HEADER -->
      <div class="header-section">
        <div>
          <h2>Order món</h2>
          <p>Nhân viên: <strong>{{ staffName }}</strong></p>
        </div>
      </div>

      <!-- MAIN -->
      <div class="grid-container">
        <!-- PRODUCT -->
        <div class="panel">
          <div class="panel-header blue">Sản phẩm</div>

          <input v-model="productSearch" class="search-input" placeholder="Tìm sản phẩm..." />

          <!-- CATEGORY FILTER -->
          <div class="category-filter">
            <button 
              :class="['filter-btn', { active: selectedCategory === null }]" 
              @click="selectedCategory = null"
            >
              Tất cả
            </button>
            <button 
              :class="['filter-btn', { active: selectedCategory === 'RAW_FOOD' }]" 
              @click="selectedCategory = 'RAW_FOOD'"
            >
              Sống
            </button>
            <button 
              :class="['filter-btn', { active: selectedCategory === 'COOKED_FOOD' }]" 
              @click="selectedCategory = 'COOKED_FOOD'"
            >
              Chín
            </button>
            <button 
              :class="['filter-btn', { active: selectedCategory === 'HOT_POT_BROTH' }]" 
              @click="selectedCategory = 'HOT_POT_BROTH'"
            >
              Nước lẩu
            </button>
            <button 
              :class="['filter-btn', { active: selectedCategory === 'DRINK' }]" 
              @click="selectedCategory = 'DRINK'"
            >
              Đồ uống
            </button>
            <button 
              :class="['filter-btn', { active: selectedCategory === 'DESSERT' }]" 
              @click="selectedCategory = 'DESSERT'"
            >
              Tráng miệng
            </button>
          </div>

          <div class="scroll">
            <div v-for="p in filteredProducts" :key="p.id" class="item-card">
              <div>
                <div class="item-name">{{ p.productName }}</div>
                <div class="item-price">{{ formatPrice(p.unitPrice) }}</div>
              </div>

              <button class="btn primary" @click="addProduct(p)">+</button>
            </div>
          </div>
        </div>

        <!-- COMBO -->
        <div class="panel">
          <div class="panel-header green">Combo</div>

          <input v-model="comboSearch" class="search-input" placeholder="Tìm combo..." />

          <div class="scroll">
            <div v-for="c in filteredCombos" :key="c.id" class="item-card">
              <div>
                <div class="item-name">{{ c.comboName }}</div>
                <div class="item-price">{{ formatPrice(c.comboPrice) }}</div>
              </div>

              <button class="btn success" @click="addCombo(c)">+</button>
            </div>
          </div>
        </div>

        <!-- ORDER -->
        <div class="panel">
          <div class="panel-header dark">Order</div>

          <div class="scroll">
            <div v-if="cart.length === 0" class="empty">Chưa có món</div>

            <div v-for="item in cart" :key="item.key" class="cart-item">
              <div>
                <strong>{{ item.quantity }}x</strong> {{ item.name }}
              </div>

              <div>
                <button class="btn small" @click="decrease(item)">-</button>
                <button class="btn small" @click="increase(item)">+</button>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="total">
              <span>Tạm tính</span>
              <strong>{{ formatPrice(subtotal) }}</strong>
            </div>

            <button class="btn order-btn" :disabled="cart.length === 0" @click="order">
              Order
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getProducts } from '@/services/productApi'
import { getAllProductCombos } from '@/services/productComboApi'
import { addItemsToInvoice, type OrderItemRequest, type InvoiceGroup } from '@/services/staffOrderApi'
import { getInProgressInvoices } from '@/services/staffOrderApi'

const route = useRoute()
const router = useRouter()

/* STAFF */

const staffName = 'Staff'

/* INVOICE */

const invoiceId = ref<number>(0)
const invoiceInfo = ref<InvoiceGroup | null>(null)
const currentStaffId = ref<number | null>(null)

const tableNames = computed(() => {
  if (!invoiceInfo.value) return ''
  return invoiceInfo.value.tables.map(t => t.tableName).join(', ')
})

// ===== GHI CHÚ MÓN =====
const foodNoteDismissed = ref(false)

interface FoodNoteItem { text: string; selected: boolean; productName: string; quantity: number }

const parsedFoodNotes = ref<FoodNoteItem[]>([])

const selectedFoodNotes = computed(() => parsedFoodNotes.value.filter(i => i.selected))

const parseFoodNote = (note: string) => {
  // Format: "Món đặt tham khảo: Tên món x 2, Tên món 2 x 1"
  const clean = note.replace(/^Món đặt tham khảo:\s*/i, '')
  const items = clean.split(',').map(s => s.trim()).filter(Boolean)
  parsedFoodNotes.value = items.map(item => {
    const match = item.match(/^(.+?)\s*x\s*(\d+)$/i)
    return {
      text: item,
      selected: true,
      productName: match ? match[1].trim() : item,
      quantity: match ? parseInt(match[2]) : 1
    }
  })
}

const addFoodNotes = async () => {
  if (selectedFoodNotes.value.length === 0) return

  const items: OrderItemRequest[] = []

  for (const fn of selectedFoodNotes.value) {
    // Tìm product/combo match theo tên
    const product = products.value.find((p: any) =>
      p.productName.toLowerCase() === fn.productName.toLowerCase()
    )
    const combo = combos.value.find((c: any) =>
      c.comboName?.toLowerCase() === fn.productName.toLowerCase()
    )

    if (product) {
      items.push({ itemType: 'PRODUCT', productId: product.id ?? product.productId, quantity: fn.quantity })
    } else if (combo) {
      items.push({ itemType: 'COMBO', productComboId: combo.id, quantity: fn.quantity })
    }
  }

  if (items.length === 0) {
    alert('Không tìm thấy sản phẩm phù hợp với ghi chú')
    return
  }

  try {
    await addItemsToInvoice(invoiceId.value, items)
    foodNoteDismissed.value = true
    alert(`Đã order ${items.length} món từ ghi chú khách!`)
    // Reload trang
    router.go(0)
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Order thất bại')
  }
}

// Get current staff ID from JWT token or localStorage
function getCurrentStaffId(): number | null {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) return null
    
    // Decode JWT token to get staff ID
    const payload = JSON.parse(atob(parts[1]))
    return payload.employeeId || payload.id || null
  } catch (error) {
    console.error('Failed to get staff ID from token:', error)
    return null
  }
}

/* SEARCH */

const productSearch = ref('')
const comboSearch = ref('')
const selectedCategory = ref<string | null>(null)

/* TYPES */

interface Product {
  id: number
  productName: string
  unitPrice: number
  availabilityStatus: string
  productCategory?: string
}

interface Combo {
  id: number
  comboName: string
  comboPrice: number
  isActive: boolean
}

interface CartItem {
  key: string
  name: string
  price: number
  quantity: number
}

/* DATA */

const products = ref<Product[]>([])
const combos = ref<Combo[]>([])

/* FETCH PRODUCTS */

async function fetchProducts() {
  try {
    const data = await getProducts()
    products.value = data.filter((p: Product) => p.availabilityStatus === 'AVAILABLE')
  } catch (error) {
    console.error('Load product error', error)
  }
}

/* FETCH COMBOS */

async function fetchCombos() {
  try {
    const data = await getAllProductCombos()
    combos.value = data.filter((c: Combo) => c.isActive === true)
  } catch (error) {
    console.error('Load combo error', error)
  }
}

/* LOAD DATA */

async function loadInvoiceInfo() {
  const paramInvoiceId = route.params.invoiceId
  console.log('Route params:', route.params)
  console.log('Param invoiceId:', paramInvoiceId, 'Type:', typeof paramInvoiceId)
  
  if (!paramInvoiceId) {
    alert('Không có thông tin hóa đơn')
    router.push({ name: 'staff-tables' })
    return
  }

  try {
    invoiceId.value = Number(paramInvoiceId)
    console.log('Loading invoice info for:', invoiceId.value)
    
    // Get all in-progress invoices and find the matching one
    const invoices = await getInProgressInvoices()
    invoiceInfo.value = invoices.find(inv => inv.invoiceId === invoiceId.value) || null

    // Parse ghi chú món nếu có
    if (invoiceInfo.value?.foodNote) {
      parseFoodNote(invoiceInfo.value.foodNote)
    }

    if (!invoiceInfo.value) {
      alert('Không tìm thấy hóa đơn')
      router.push({ name: 'staff-tables' })
      return
    }
    
    console.log('Invoice info loaded:', invoiceInfo.value)
    
    // Check permission: if invoice is claimed by another staff, redirect
    if (invoiceInfo.value.servingStaffId && 
        currentStaffId.value && 
        invoiceInfo.value.servingStaffId !== currentStaffId.value) {
      alert(`Bàn này đang được phục vụ bởi ${invoiceInfo.value.servingStaffName}. Vui lòng chọn bàn khác.`)
      router.push({ name: 'staff-tables' })
      return
    }
  } catch (error) {
    console.error('Load invoice error', error)
    alert('Không thể tải thông tin hóa đơn')
    router.push({ name: 'staff-tables' })
  }
}

onMounted(() => {
  // Get current staff ID first
  currentStaffId.value = getCurrentStaffId()
  console.log('Current staff ID:', currentStaffId.value)
  
  loadInvoiceInfo()
  fetchProducts()
  fetchCombos()
})

function goBack() {
  router.push({ name: 'staff-tables' })
}

/* FILTER */

const filteredProducts = computed(() => {
  let result = products.value.filter((p) =>
    p.productName.toLowerCase().includes(productSearch.value.toLowerCase()),
  )
  
  if (selectedCategory.value) {
    result = result.filter((p) => p.productCategory === selectedCategory.value)
  }
  
  return result
})

const filteredCombos = computed(() =>
  combos.value.filter((c) => c.comboName.toLowerCase().includes(comboSearch.value.toLowerCase())),
)

/* CART */

const cart = ref<CartItem[]>([])

/* ADD PRODUCT */

function addProduct(p: Product) {
  const key = 'product-' + p.id
  const existing = cart.value.find((i) => i.key === key)

  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({
      key,
      name: p.productName,
      price: p.unitPrice,
      quantity: 1,
    })
  }
}

/* ADD COMBO */

function addCombo(c: Combo) {
  const key = 'combo-' + c.id
  const existing = cart.value.find((i) => i.key === key)

  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({
      key,
      name: c.comboName,
      price: c.comboPrice,
      quantity: 1,
    })
  }
}

/* INCREASE */

function increase(item: CartItem) {
  item.quantity++
}

/* DECREASE */

function decrease(item: CartItem) {
  item.quantity--

  if (item.quantity <= 0) {
    cart.value = cart.value.filter((i) => i.key !== item.key)
  }
}

/* SUBTOTAL */

const subtotal = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
)

/* ORDER */

async function order() {
  if (!invoiceId.value) {
    alert('Không có thông tin hóa đơn')
    return
  }

  try {
    const items: OrderItemRequest[] = cart.value.map((item) => {
      if (item.key.startsWith('product')) {
        return {
          itemType: 'PRODUCT',
          productId: Number(item.key.split('-')[1]),
          quantity: item.quantity,
        }
      }
      return {
        itemType: 'COMBO',
        productComboId: Number(item.key.split('-')[1]),
        quantity: item.quantity,
      }
    })

    await addItemsToInvoice(invoiceId.value, items)

    alert('Order thành công')
    cart.value = []
  } catch (error: any) {
    console.error('Order error:', error)

    const status = error?.response?.status
    const errorMsg = error?.response?.data?.message || 'Order thất bại'
    
    if (status === 403) {
      // Table claimed by another staff
      alert(`Bàn này đang được staff khác phục vụ. Vui lòng chọn bàn khác.\n\n${errorMsg}`)
      router.push({ name: 'staff-tables' })
    } else if (status === 404) {
      // Table or invoice not found
      alert('Không tìm thấy bàn hoặc hóa đơn. Vui lòng quay lại.')
      router.push({ name: 'staff-tables' })
    } else {
      // Other errors
      alert(errorMsg)
    }
  }
}

/* FORMAT PRICE */

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ'
}
</script>

<style scoped>
.order-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 20px;
}

/* BACK BUTTON TOP */
.btn-back-top {
  padding: 10px 20px;
  margin-bottom: 16px;
  border-radius: 12px;
  border: none;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #718096;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-back-top:hover {
  background: #f7fafc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
}

/* TABLE INFO BANNER */
.table-info-banner {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 32px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: none;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: #718096;
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: #2d3748;
}

.divider {
  color: #cbd5e0;
  font-weight: 300;
  font-size: 16px;
}

/* HEADER */
/* ===== FOOD NOTE BANNER ===== */
.food-note-banner {
  background: #fffbf0; border: 2px solid #e8a835; border-radius: 12px;
  padding: 16px; margin-bottom: 16px;
}
.fn-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
}
.fn-header strong { flex: 1; font-size: 15px; color: #1a1a1a; }
.fn-dismiss {
  width: 26px; height: 26px; border-radius: 50%; border: none;
  background: #f0e8d8; color: #999; font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.fn-items { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.fn-item { padding: 8px 12px; background: white; border-radius: 8px; border: 1px solid #ede8e0; }
.fn-check { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; }
.fn-check input { accent-color: #a80000; cursor: pointer; width: 16px; height: 16px; }
.fn-actions { display: flex; gap: 8px; }
.fn-btn {
  padding: 8px 20px; border-radius: 999px; font-weight: 700; font-size: 13px;
  cursor: pointer; transition: 0.2s; border: none;
}
.fn-add { background: #a80000; color: white; }
.fn-add:hover { background: #8b0000; }
.fn-add:disabled { opacity: 0.4; cursor: not-allowed; }
.fn-skip { background: #eee; color: #666; }
.fn-skip:hover { background: #ddd; }

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-section h2 {
  margin: 0 0 8px 0;
  color: #1a202c;
  font-size: 24px;
  font-weight: 600;
}

.header-section p {
  margin: 0;
  color: #718096;
  font-size: 14px;
}

/* GRID */
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* PANEL */
.panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: none;
  display: flex;
  flex-direction: column;
  height: 600px;
}

.panel-header {
  padding: 12px 16px;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  margin-bottom: 16px;
  font-size: 15px;
  text-align: center;
}

.panel-header.blue {
  background: #4299e1;
}

.panel-header.green {
  background: #48bb78;
}

.panel-header.dark {
  background: #4a5568;
}

/* INPUT */
.search-input {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  margin-bottom: 12px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

/* CATEGORY FILTER */
.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-btn {
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  font-size: 12px;
  color: #718096;
  transition: all 0.2s ease;
  font-weight: 500;
}

.filter-btn:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.filter-btn.active {
  background: #4299e1;
  color: white;
  border-color: #4299e1;
}

/* LIST */
.scroll {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;
}

/* ITEM */
.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.2s ease;
  margin-bottom: 12px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #4299e1;
}

.item-name {
  font-weight: 600;
  font-size: 15px;
  color: #2d3748;
}

.item-price {
  font-size: 13px;
  color: #718096;
  margin-top: 4px;
}

/* CART */
.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  background: white;
  border-radius: 12px;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  color: #2d3748;
}

/* FOOTER */
.footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.total {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
  color: #718096;
}

.total strong {
  color: #2b6cb0;
  font-size: 16px;
  font-weight: 600;
}

/* BUTTON */
.btn {
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.btn.primary {
  background: #4299e1;
  color: white;
}

.btn.primary:hover {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn.success {
  background: #48bb78;
  color: white;
}

.btn.success:hover {
  background: #38a169;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn.small {
  margin-left: 6px;
  background: #edf2f7;
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 6px;
  color: #4a5568;
}

.btn.small:hover {
  background: #e2e8f0;
}

.order-btn {
  width: 100%;
  padding: 12px;
  background: #4299e1;
  color: white;
  font-weight: 600;
  font-size: 15px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.order-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.order-btn:disabled {
  background: #cbd5e0;
  color: #a0aec0;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

/* EMPTY */
.empty {
  text-align: center;
  color: #718096;
  padding: 60px 20px;
  font-size: 14px;
}
</style>
