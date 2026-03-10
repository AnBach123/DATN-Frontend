<template>
  <div class="container-fluid p-4">
    <!-- HEADER -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h5 class="mb-0">
          Nhân viên phục vụ: <strong>{{ staffName }}</strong>
        </h5>
      </div>

      <div style="width: 200px">
        <input v-model="tableId" type="number" class="form-control" placeholder="Nhập ID bàn" />
      </div>
    </div>

    <div class="row">
      <!-- PRODUCT -->
      <div class="col-md-4">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-primary text-white">Product</div>

          <div class="p-2">
            <input
              v-model="productSearch"
              class="form-control form-control-sm"
              placeholder="Tìm sản phẩm..."
            />
          </div>

          <div class="card-body product-scroll">
            <div v-for="p in filteredProducts" :key="p.id" class="card mb-2 product-item">
              <div class="card-body p-2 d-flex justify-content-between align-items-center">
                <div>
                  <div class="fw-bold">{{ p.productName }}</div>
                  <small class="text-muted">
                    {{ formatPrice(p.unitPrice) }}
                  </small>
                </div>

                <button class="btn btn-sm btn-primary" @click="addProduct(p)">+</button>
              </div>
            </div>

            <div v-if="filteredProducts.length === 0" class="text-muted">
              Không tìm thấy sản phẩm
            </div>
          </div>
        </div>
      </div>

      <!-- COMBO -->
      <div class="col-md-4">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-success text-white">Combo</div>

          <div class="p-2">
            <input
              v-model="comboSearch"
              class="form-control form-control-sm"
              placeholder="Tìm combo..."
            />
          </div>

          <div class="card-body product-scroll">
            <div v-for="c in filteredCombos" :key="c.id" class="card mb-2 product-item">
              <div class="card-body p-2 d-flex justify-content-between align-items-center">
                <div>
                  <div class="fw-bold">{{ c.comboName }}</div>
                  <small class="text-muted">
                    {{ formatPrice(c.comboPrice) }}
                  </small>
                </div>

                <button class="btn btn-sm btn-success" @click="addCombo(c)">+</button>
              </div>
            </div>

            <div v-if="filteredCombos.length === 0" class="text-muted">Không tìm thấy combo</div>
          </div>
        </div>
      </div>

      <!-- ORDER -->
      <div class="col-md-4">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-dark text-white">Order</div>

          <div class="card-body order-scroll">
            <div v-if="cart.length === 0" class="text-muted">Chưa có món</div>

            <div
              v-for="item in cart"
              :key="item.key"
              class="d-flex justify-content-between align-items-center mb-2"
            >
              <div>
                <strong>{{ item.quantity }}x</strong>
                {{ item.name }}
              </div>

              <div>
                <button class="btn btn-sm btn-outline-secondary me-1" @click="decrease(item)">
                  -
                </button>

                <button class="btn btn-sm btn-outline-secondary" @click="increase(item)">+</button>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="d-flex justify-content-between mb-3">
              <strong>Tạm tính</strong>
              <strong class="text-danger">
                {{ formatPrice(subtotal) }}
              </strong>
            </div>

            <button
              class="btn btn-primary w-100"
              :disabled="!tableId || cart.length === 0"
              @click="order"
            >
              Order
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- LOGOUT -->
    <button class="btn btn-danger logout-btn" @click="logout">Logout</button>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'

import { getProducts } from '@/services/productApi'
import { getAllProductCombos } from '@/services/productComboApi'
import { addItemToInvoice } from '@/services/staffOrderApi'

/* STAFF */

const staffName = 'Nguyễn Văn A'

/* TABLE */

const tableId = ref<number | null>(null)

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
    const res = await getProducts()

    const data = res.data || res

    products.value = data.filter((p: Product) => p.availabilityStatus === 'AVAILABLE')
  } catch (error) {
    console.error('Load product error', error)
  }
}

/* FETCH COMBOS */

async function fetchCombos() {
  try {
    const res = await getAllProductCombos()

    const data = res.data || res

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

/* ORDER */

async function order() {
  if (!tableId.value) {
    alert('Vui lòng nhập ID bàn')
    return
  }

  try {
    for (const item of cart.value) {
      if (item.key.startsWith('product')) {
        const productId = Number(item.key.split('-')[1])

        await addItemToInvoice({
          invoiceId: tableId.value,
          itemType: 'PRODUCT',
          productId,
          quantity: item.quantity,
        })
      } else {
        const comboId = Number(item.key.split('-')[1])

        await addItemToInvoice({
          invoiceId: tableId.value,
          itemType: 'COMBO',
          productComboId: comboId,
          quantity: item.quantity,
        })
      }
    }

    alert('Order thành công')

    cart.value = []
  } catch (error: any) {
    console.error(error)

    const errorMsg = error?.response?.data?.message || 'Order thất bại'
    alert(errorMsg)
  }
}

/* LOGOUT */

function logout() {
  const confirmLogout = confirm('Bạn có chắc muốn logout?')

  if (confirmLogout) {
    alert('Đã logout')
  }
}

/* FORMAT PRICE */

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ'
}
</script>

<style scoped>
.product-scroll {
  max-height: 60vh;
  overflow-y: auto;
}

.order-scroll {
  max-height: 45vh;
  overflow-y: auto;
}

.product-item:hover {
  background: #f8f9fa;
}

.logout-btn {
  position: fixed;
  bottom: 20px;
  left: 20px;
}
</style>
