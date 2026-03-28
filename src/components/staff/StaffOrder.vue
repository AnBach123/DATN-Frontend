<template>
  <div class="order-container">
    <!-- ALERT -->
    <div class="mb-4">
      <OvertimeAlertPanel />
    </div>

  <div class="container-fluid p-4">
    <!-- HEADER -->
    <div class="header-section">
      <div>
        <h2>Order món</h2>
        <p>
          Nhân viên: <strong>{{ staffName }}</strong>
        </p>
      </div>

      <input
        v-model="tableId"
        type="text"
        class="table-input"
        placeholder="Nhập mã bàn"
        @input="normalizeTableId"
      />
    </div>

    <!-- MAIN -->
    <div class="grid-container">
      <!-- PRODUCT -->
      <div class="panel">
        <div class="panel-header blue">Sản phẩm</div>

        <input v-model="productSearch" class="search-input" placeholder="Tìm sản phẩm..." />

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

          <button class="btn order-btn" :disabled="!tableId || cart.length === 0" @click="order">
            Order
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'

import { getProducts } from '@/services/productApi'
import { getAllProductCombos } from '@/services/productComboApi'
import { addItemsToTable, type OrderItemRequest } from '@/services/staffOrderApi'

/* STAFF */

const staffName = 'Staff'

/* TABLE */

const tableId = ref<string>('')

/* SEARCH */

const productSearch = ref('')
const comboSearch = ref('')

/* TYPES */

interface Product {
  id: number
  productName: string
  unitPrice: number
  availabilityStatus: string
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

onMounted(() => {
  fetchProducts()
  fetchCombos()
})

/* FILTER */

const filteredProducts = computed(() =>
  products.value.filter((p) =>
    p.productName.toLowerCase().includes(productSearch.value.toLowerCase()),
  ),
)

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

function normalizeTableId() {
  let value = String(tableId.value || '')

  // chỉ giữ số
  value = value.replace(/\D/g, '')

  // bỏ số 0 ở đầu
  value = value.replace(/^0+/, '')

  tableId.value = value
}
/* ORDER */

async function order() {
  if (!tableId.value) {
    alert('Vui lòng nhập ID bàn')
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

    await addItemsToTable(Number(tableId.value) || 1, items)

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
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
}

/* HEADER */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-section h2 {
  margin: 0;
  color: #2d3748;
}

.table-input {
  padding: 10px 16px;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  width: 200px;
}

/* GRID */
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* PANEL */
.panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 10px;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  margin-bottom: 10px;
}

.panel-header.blue {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.panel-header.green {
  background: linear-gradient(135deg, #38a169, #2f855a);
}

.panel-header.dark {
  background: linear-gradient(135deg, #2d3748, #1a202c);
}

/* INPUT */
.search-input {
  padding: 10px;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  margin-bottom: 10px;
}

/* LIST */
.scroll {
  max-height: 50vh;
  overflow-y: auto;
}

/* ITEM */
.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
  transition: 0.2s;
}

.item-card:hover {
  background: rgba(102, 126, 234, 0.08);
}

.item-name {
  font-weight: 600;
}

.item-price {
  font-size: 13px;
  color: #718096;
}

/* CART */
.cart-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

/* FOOTER */
.footer {
  margin-top: auto;
}

.total {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.total strong {
  color: #667eea;
}

/* BUTTON */
.btn {
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  cursor: pointer;
}

.btn.primary {
  background: #667eea;
  color: white;
}

.btn.success {
  background: #38a169;
  color: white;
}

.btn.small {
  margin-left: 5px;
  background: #edf2f7;
}

.order-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
}
.order-btn:disabled {
  background: #686868;
  color: white;
  cursor: not-allowed;
}

/* EMPTY */
.empty {
  text-align: center;
  color: #718096;
}
</style>
