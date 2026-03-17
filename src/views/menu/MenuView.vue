<template>
  <div class="menu-page">
    <section class="menu-hero">
      <div class="hero-overlay">
        <div class="hero-content">
          <p class="hero-sub">Thực đơn</p>
          <h1>Những món ngon bạn không thể bỏ lỡ tại ByHat</h1>
          <p>Chọn món yêu thích, thêm vào tạm tính và đặt bàn ngay tại đây.</p>
        </div>
      </div>
    </section>

    <section class="category-bar">
      <button
        v-for="c in categories"
        :key="c.key"
        class="cat-pill"
        :class="{ active: activeCategory === c.key }"
        @click="activeCategory = c.key"
      >
        {{ c.label }}
      </button>
    </section>

    <section class="menu-list container">
      <div v-if="loading" class="text-center text-white">Đang tải món ăn...</div>
      <div v-else-if="filteredProducts.length === 0" class="text-center text-white">
        Chưa có sản phẩm
      </div>
      <div v-else class="menu-grid">
        <div class="menu-card" v-for="item in filteredProducts" :key="item.id">
          <img
            class="menu-img"
            :src="getImage(item)"
            @error="onImgError"
            alt="food"
          />
          <div class="menu-info">
            <h3>{{ item.productName }}</h3>
            <p>{{ item.description || 'Món ăn đặc biệt của ByHat' }}</p>
            <div class="menu-bottom">
              <span class="price">{{ formatPrice(item.unitPrice) }}</span>
              <button class="btn-add" @click="addItem(item)">+ Đặt</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <button class="mini-cart" v-if="totalQty > 0" @click="openCart = true">
      <div class="mini-count">{{ totalQty }} món</div>
      <div class="mini-total">{{ formatPrice(totalPrice) }}</div>
    </button>

    <div v-if="openCart" class="cart-overlay" @click.self="openCart = false">
      <div class="cart-panel">
        <div class="cart-header">
          <div>
            <h3>Tạm tính</h3>
            <p class="cart-sub">Đơn giá tạm tính chỉ mang tính tham khảo</p>
          </div>
          <button class="icon-btn" @click="openCart = false">×</button>
        </div>

        <div class="cart-total">
          <span>Tổng tiền</span>
          <strong>{{ formatPrice(totalPrice) }}</strong>
        </div>

        <div class="cart-actions">
          <button class="text-btn" @click="clearCart">Xóa hết tạm tính</button>
        </div>

        <div v-if="cartItems.length === 0" class="empty-cart">Chưa có món nào.</div>

        <div v-else class="cart-items">
          <div class="cart-item" v-for="ci in cartItems" :key="ci.id">
            <div>
              <h4>{{ ci.productName }}</h4>
              <p>{{ formatPrice(ci.unitPrice) }}</p>
            </div>
            <div class="qty-box">
              <button @click="decrease(ci.id)">-</button>
              <span>{{ ci.qty }}</span>
              <button @click="increase(ci.id)">+</button>
            </div>
            <div class="item-total">
              {{ formatPrice(ci.unitPrice * ci.qty) }}
            </div>
            <button class="remove" @click="removeItem(ci.id)">×</button>
          </div>
        </div>

        <div class="cart-footer">
          <button class="btn-primary" :disabled="cartItems.length === 0" @click="openBooking()">
            Đặt bàn
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getProducts } from '@/services/productApi'
import { useBookingStore } from '@/composables/bookingStore'

interface Product {
  id: number
  productName: string
  description?: string
  unitPrice: number
  imageUrl?: string | null
  productCategory?: string
}

const { open: openBookingModal } = useBookingStore()

const products = ref<Product[]>([])
const loading = ref(true)

const activeCategory = ref('ALL')
const categories = ref([{ key: 'ALL', label: 'Tất cả' }])

const filteredProducts = computed(() => {
  if (activeCategory.value === 'ALL') return products.value
  return products.value.filter((p) => p.productCategory === activeCategory.value)
})

const cart = ref<Record<number, { product: Product; qty: number }>>({})
const openCart = ref(false)

const cartItems = computed(() =>
  Object.values(cart.value).map((c) => ({
    id: c.product.id,
    productName: c.product.productName,
    unitPrice: c.product.unitPrice,
    qty: c.qty,
  }))
)

const totalQty = computed(() => cartItems.value.reduce((s, i) => s + i.qty, 0))
const totalPrice = computed(() => cartItems.value.reduce((s, i) => s + i.qty * i.unitPrice, 0))

const addItem = (product: Product) => {
  const exist = cart.value[product.id]
  if (exist) {
    exist.qty += 1
  } else {
    cart.value[product.id] = { product, qty: 1 }
  }
}

const increase = (id: number) => {
  const item = cart.value[id]
  if (item) item.qty += 1
}

const decrease = (id: number) => {
  const item = cart.value[id]
  if (!item) return
  item.qty -= 1
  if (item.qty <= 0) delete cart.value[id]
}

const removeItem = (id: number) => {
  delete cart.value[id]
}

const clearCart = () => {
  cart.value = {}
}

const buildFoodNote = () => {
  if (cartItems.value.length === 0) return ''
  const lines = cartItems.value.map((i) => `${i.productName} x ${i.qty}`)
  return `Món đặt tham khảo: ${lines.join(', ')}`
}

const openBooking = () => {
  openCart.value = false
  openBookingModal(buildFoodNote())
}

const formatPrice = (value: number) => value.toLocaleString('vi-VN') + ' đ'

const CATEGORY_LABELS: Record<string, string> = {
  RAW_FOOD: 'Món sống',
  COOKED_FOOD: 'Món chín',
  HOT_POT_BROTH: 'Nước lẩu',
  DRINK: 'Đồ uống',
  DESSERT: 'Tráng miệng',
  GRILL: 'Đồ nướng',
  SEAFOOD: 'Hải sản',
  SALAD: 'Salad',
  VEGETABLE: 'Rau xanh',
}

const formatCategoryLabel = (key: string) => {
  return CATEGORY_LABELS[key] || key.replace(/_/g, ' ')
}

const buildCategories = (items: Product[]) => {
  const keys = Array.from(
    new Set(items.map((p) => p.productCategory).filter((v): v is string => !!v))
  )
  const mapped = keys.map((key) => ({
    key,
    label: formatCategoryLabel(key),
  }))
  categories.value = [{ key: 'ALL', label: 'Tất cả' }, ...mapped]
}

const getImage = (item: Product) => {
  if (!item.imageUrl) return 'https://picsum.photos/400/300'
  if (item.imageUrl.startsWith('http')) return item.imageUrl
  return 'http://localhost:8080' + item.imageUrl
}

const onImgError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = 'https://picsum.photos/400/300'
}

onMounted(async () => {
  try {
    const data = await getProducts()
    products.value = data.map((p: any) => ({
      id: p.id ?? p.productId,
      productName: p.productName,
      description: p.description,
      unitPrice: p.unitPrice,
      imageUrl: p.imageUrl,
      productCategory: p.productCategory,
    }))
    buildCategories(products.value)
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap');

.menu-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #5a1515;
  color: #fff;
  font-family: 'Manrope', sans-serif;
}

.menu-page::before {
  content: '';
  position: absolute;
  inset: -8%;
  background-image: url('https://lh3.googleusercontent.com/gg-dl/AOI_d_97GQT3cq5d1SzFbhiWQy8LLR-Q6gVvwLj1HDYDw4E7VPlYKbTNuP-cDdoR-IdOtGOy4ADjYskoaqbUQeWGuO6WCPlRzVs3urxT-uDdpRO030SMfAwSkFQJKcdygLsfxN0qVE0OlI6keT44oKioO0ZhNufY__mMi_7i3yEGLuIQ-utk=s1024-rj');
  background-size: cover;
  background-position: center;
  filter: blur(8px) saturate(0.95);
  opacity: 0.26;
  transform: scale(1.05);
  z-index: 0;
}

.menu-page::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
      circle at 50% 20%,
      rgba(255, 230, 200, 0.18),
      transparent 45%
    ),
    linear-gradient(
      180deg,
      rgba(90, 21, 21, 0.78) 0%,
      rgba(154, 59, 59, 0.7) 45%,
      rgba(116, 33, 33, 0.8) 100%
    );
  z-index: 0;
}

.menu-page > * {
  position: relative;
  z-index: 1;
}

.menu-hero {
  height: 260px;
  background: url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5') center/cover no-repeat;
}

.hero-overlay {
  height: 100%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
}

.hero-content {
  width: min(900px, 90%);
  margin: 0 auto;
  text-align: center;
}

.hero-sub {
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #f0b66a;
  font-size: 12px;
}

.category-bar {
  width: min(1100px, 92vw);
  margin: 18px auto 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 16px;
  background: #f4b457;
  color: #2b1c12;
  justify-content: center;
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
}

.cat-pill {
  border: none;
  background: rgba(255, 255, 255, 0.55);
  padding: 7px 14px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.cat-pill.active {
  background: #ffffff;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.cat-pill:hover {
  background: #fff7ec;
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.18);
}

.menu-list {
  padding: 40px 0 80px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.menu-card {
  background: #fff9f3;
  color: #2a1f1a;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
}

.menu-img {
  height: 180px;
  object-fit: cover;
}

.menu-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.menu-bottom {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price {
  color: #b1120a;
  font-weight: 700;
}

.btn-add {
  border: none;
  background: #f0b66a;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 700;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.btn-add:hover {
  transform: translateY(-1px);
  background: #f4c07a;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.18);
}

.mini-cart {
  position: fixed;
  right: 30px;
  top: 55%;
  transform: translateY(-50%);
  background: #1d5b40;
  color: #fff;
  border: none;
  border-radius: 16px;
  padding: 14px 18px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.mini-cart:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.25);
}

.mini-count {
  font-weight: 700;
}

.mini-total {
  color: #f0b66a;
}

.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.cart-panel {
  width: min(760px, 94vw);
  background: #fff;
  color: #2a1f1a;
  border-radius: 18px;
  padding: 24px;
  max-height: 85vh;
  overflow: auto;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.cart-sub {
  color: #6b5f57;
  font-size: 13px;
}

.icon-btn {
  border: none;
  background: #eee;
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  margin: 16px 0;
  font-size: 18px;
}

.cart-actions {
  display: flex;
  justify-content: flex-end;
}

.text-btn {
  border: none;
  background: none;
  color: #b1120a;
  font-weight: 600;
  transition: color 0.15s ease;
}

.text-btn:hover {
  color: #d14a1f;
}

.cart-items {
  display: grid;
  gap: 12px;
}

.cart-item {
  display: grid;
  grid-template-columns: 1.2fr auto auto auto;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.qty-box {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #ddd;
  padding: 4px 10px;
  border-radius: 12px;
}

.qty-box button {
  border: none;
  background: none;
  font-size: 16px;
}

.item-total {
  font-weight: 700;
}

.remove {
  border: none;
  background: none;
  font-size: 18px;
  color: #999;
}

.cart-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  border: none;
  background: #f0b66a;
  padding: 10px 20px;
  border-radius: 999px;
  font-weight: 700;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  background: #f4c07a;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
}

.empty-cart {
  color: #6b5f57;
}
</style>
