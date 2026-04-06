<template>
  <div class="order-container">
    <!-- ALERT -->
    <div class="mb-4">
      <OvertimeAlertPanel />
      <NoShowNotificationPanel />
    </div>

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
import OvertimeAlertPanel from './OvertimeAlertPanel.vue'
import NoShowNotificationPanel from './NoShowNotificationPanel.vue'
import { getInProgressInvoices } from '@/services/staffOrderApi'

const route = useRoute()
const router = useRouter()

/* STAFF */

const staffName = 'Staff'

/* INVOICE */

const invoiceId = ref<number>(0)
const invoiceInfo = ref<InvoiceGroup | null>(null)

const tableNames = computed(() => {
  if (!invoiceInfo.value) return ''
  return invoiceInfo.value.tables.map(t => t.tableName).join(', ')
})

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
    
    if (!invoiceInfo.value) {
      alert('Không tìm thấy hóa đơn')
      router.push({ name: 'staff-tables' })
      return
    }
    
    console.log('Invoice info loaded:', invoiceInfo.value)
  } catch (error) {
    console.error('Load invoice error', error)
    alert('Không thể tải thông tin hóa đơn')
    router.push({ name: 'staff-tables' })
  }
}

onMounted(() => {
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
    console.error(error)

    const errorMsg = error?.response?.data?.message || 'Order thất bại'
    alert(errorMsg)
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
