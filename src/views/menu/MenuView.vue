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
      <div v-if="loading" class="text-center" style="color:#999;padding:40px">Đang tải món ăn...</div>
      <div v-else-if="filteredProducts.length === 0 && activeCategory !== 'COMBO'">
  Chưa có sản phẩm
</div>
<!-- COMBO -->
<div v-if="(activeCategory === 'COMBO' || activeCategory === 'ALL') && combos.length > 0">
  <h2 class="section-title">Combo</h2>

  <div class="menu-grid">
    <div class="menu-card" v-for="c in combos" :key="c.id"
     @click="openDetail(c, 'combo')">
      <img
  class="menu-img"
  :src="c.imageUrl || 'https://picsum.photos/400/300'"
  @error="onImgError"
/>

      <div class="menu-info">
        <h3>{{ c.comboName }}</h3>

        <div class="menu-bottom">
          <span class="price">{{ formatPrice(c.comboPrice) }}</span>
          <button class="btn-add" @click.stop="addCombo(c)">Ghi chú món</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- MÓN ĂN -->
<div v-if="activeCategory !== 'COMBO' && filteredProducts.length > 0">
  <h2 class="section-title">Món ăn</h2>

 <div class="menu-grid product-grid">
    <div class="menu-card" v-for="item in filteredProducts" :key="item.id"
     @click="openDetail(item, 'product')">
      <img
        class="menu-img"
        :src="getImage(item)"
        @error="onImgError"
      />

      <div class="menu-info">
        <h3>{{ item.productName }}</h3>

        <div class="menu-bottom">
          <span class="price">{{ formatPrice(item.unitPrice) }}</span>
          <button class="btn-add" @click.stop="addItem(item)">Ghi chú món</button>
        </div>
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
        <!-- HEADER -->
        <div class="cart-top">
          <div class="cart-top-left">
            <svg class="cart-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <h3>Tạm tính</h3>
          </div>
          <button class="cart-close" @click="openCart = false">&times;</button>
        </div>

        <!-- TỔNG TIỀN -->
        <div class="cart-total-bar">
          <div class="ct-left">
            <span class="ct-label">Tổng tiền</span>
            <p class="ct-note">Đơn giá tạm tính chỉ mang tính tham khảo</p>
          </div>
          <span class="ct-amount">{{ formatPrice(totalPrice) }}</span>
        </div>

        <!-- XÓA -->
        <div class="cart-clear-row" v-if="cartItems.length > 0">
          <button class="cart-clear" @click="clearCart">Xóa hết tạm tính</button>
        </div>

        <!-- DANH SÁCH MÓN -->
        <div v-if="cartItems.length === 0" class="empty-cart">Chưa có món nào</div>

        <div v-else class="cart-items">
          <div class="cart-item" v-for="ci in cartItems" :key="ci.id">
            <div class="ci-info">
              <h4>{{ ci.productName }}</h4>
              <span class="ci-unit">{{ formatPrice(ci.unitPrice) }}</span>
            </div>
            <div class="qty-box">
              <button @click="decrease(ci.id)">-</button>
              <span>{{ ci.qty }}</span>
              <button @click="increase(ci.id)">+</button>
            </div>
            <span class="item-total">{{ formatPrice(ci.unitPrice * ci.qty) }}</span>
            <button class="remove" @click="removeItem(ci.id)">&times;</button>
          </div>
        </div>

        <!-- ĐẶT BÀN -->
        <div class="cart-footer">
          <button class="cart-book" :disabled="cartItems.length === 0" @click="openBooking()">
            ĐẶT BÀN VỚI GHI CHÚ NÀY
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="openDetailModal" class="cart-overlay" @click.self="openDetailModal = false">
  <div class="detail-modal">
    <button class="detail-close" @click="openDetailModal = false">&times;</button>

    <!-- ẢNH -->
    <div class="detail-img-wrap">
      <img
        class="detail-img"
        :src="detailType === 'combo' ? (selectedItem.imageUrl || '') : getImage(selectedItem)"
      />
    </div>

    <!-- CONTENT -->
    <div class="detail-content">
      <!-- TÊN -->
      <h2 class="detail-name">
        {{ detailType === 'combo' ? selectedItem.comboName : selectedItem.productName }}
      </h2>

      <!-- GIÁ + VAT + SỐ LƯỢNG -->
      <div class="detail-price-row">
        <div class="detail-price-left">
          <span class="detail-price">
            {{ detailType === 'combo' ? formatPrice(selectedItem.comboPrice) : formatPrice(selectedItem.unitPrice) }}
          </span>
          <span class="detail-vat">Giá chưa gồm VAT</span>
        </div>
        <div class="detail-qty">
          <button class="qty-btn" @click="detailQty > 1 && detailQty--">-</button>
          <span class="qty-num">{{ detailQty }}</span>
          <button class="qty-btn" @click="detailQty++">+</button>
        </div>
      </div>

      <!-- DANH MỤC -->
      <div class="detail-category" v-if="detailType === 'product' && selectedItem.productCategory">
        <span class="detail-cat-label">Danh mục</span>
        <span class="detail-cat-value">{{ getCategoryName(selectedItem.productCategory) }}</span>
      </div>
      <div class="detail-category" v-else-if="detailType === 'combo'">
        <span class="detail-cat-label">Loại</span>
        <span class="detail-cat-value">Combo</span>
      </div>

      <!-- MÔ TẢ -->
      <div class="detail-desc" v-if="selectedItem.description">
        <h4>Mô tả</h4>
        <p v-for="line in selectedItem.description.split('\n')" :key="line">{{ line }}</p>
      </div>

      <!-- BUTTON -->
      <div class="detail-footer">
        <button class="detail-add-btn" @click="addFromDetail">
          Ghi chú món
        </button>
      </div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getActiveProducts } from '@/services/productApi'
import { useBookingStore } from '@/composables/bookingStore'
import { getActiveProductCombos } from '@/services/productComboApi'
import { getPrimaryComboImage } from '@/services/imageApi'

interface Product {
  id: number
  productName: string
  description?: string
  unitPrice: number
  imageUrl?: string | null
  productCategory?: string
}
interface Combo {
  id: number
  comboName: string
  description?: string
  comboPrice: number
  imageUrl?: string | null
}

const combos = ref<Combo[]>([])

const { open: openBookingModal } = useBookingStore()

const products = ref<Product[]>([])
const loading = ref(true)

const activeCategory = ref('ALL')
const categories = ref([
  { key: 'ALL', label: 'Tất cả' },
  { key: 'COMBO', label: 'Combo' }
])

const selectedItem = ref<any>(null)
const detailType = ref<'product' | 'combo' | null>(null)
const openDetailModal = ref(false)
const detailQty = ref(1)

const openDetail = (item: any, type: 'product' | 'combo') => {
  selectedItem.value = item
  detailType.value = type
  detailQty.value = 1
  openDetailModal.value = true
}

const addFromDetail = () => {
  for (let i = 0; i < detailQty.value; i++) {
    if (detailType.value === 'combo') {
      addCombo(selectedItem.value)
    } else {
      addItem(selectedItem.value)
    }
  }
  openDetailModal.value = false
}

const filteredProducts = computed(() => {
  if (activeCategory.value === 'COMBO') return []
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
const addCombo = (combo: Combo) => {
  const fakeProduct = {
    id: combo.id + 100000,
    productName: combo.comboName,
    unitPrice: combo.comboPrice,
  }

  addItem(fakeProduct as any)
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
const formatPrice = (value: number | null | undefined) => {
  if (!value) return '0 đ'
  return value.toLocaleString('vi-VN') + ' đ'
}

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

const getCategoryName = (key: string) => CATEGORY_LABELS[key] || key.replace(/_/g, ' ')

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
  categories.value = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'COMBO', label: 'Combo' }, // 👈 THÊM DÒNG NÀY
  ...mapped
]
}

const loadComboImages = async (comboData:any[]) => {

  return Promise.all(

    comboData.map(async (c) => {

      try{

        const img = await getPrimaryComboImage(c.id)

        return {
          ...c,
          imageUrl: img?.imageUrl
        }

      }catch{

        return {
          ...c,
          imageUrl: null
        }

      }

    })

  )

}
const getImage = (item: Product) => {
  if (!item.imageUrl) return 'https://picsum.photos/400/300'
  if (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('data:')) return item.imageUrl
  return 'http://localhost:8080' + item.imageUrl
}

const onImgError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = 'https://picsum.photos/400/300'
}
onMounted(async () => {
  try {
    const [productData, comboData] = await Promise.all([
      getActiveProducts(),
      getActiveProductCombos()

      
    ])

combos.value = await loadComboImages(comboData)

products.value = productData.map((p: any) => ({
  id: p.id ?? p.productId,
  productName: p.productName,
  description: p.description,
  unitPrice: p.unitPrice,
  imageUrl: p.imageUrl,
  productCategory: p.productCategory,
}))
      
    buildCategories(products.value)
  } catch (error) {
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap');

.menu-page {
  min-height: 100vh;
  background: #f7f4f0;
  padding-top: 113px;
  color: #333;
  font-family: 'Manrope', sans-serif;
}

.menu-hero {
  background: url('@/assets/images/menu-hero.png') center / cover no-repeat;
  position: relative;
}

.hero-overlay {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  padding: 50px 20px;
}

.hero-content {
  width: min(900px, 90%);
  margin: 0 auto;
  text-align: center;
  color: white;
}

.hero-content h1 {
  font-family: 'Playfair Display', serif;
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 8px;
}

.hero-content p {
  color: rgba(255,255,255,0.8);
  font-size: 15px;
}

.hero-sub {
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #ffd700;
  font-size: 12px;
  margin-bottom: 8px;
}

.category-bar {
  width: min(1100px, 92vw);
  margin: 24px auto 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
  justify-content: center;
}

.cat-pill {
  border: 1.5px solid #d0c8be;
  background: white;
  color: #555;
  padding: 8px 20px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-pill.active {
  background: #a80000;
  color: white;
  border-color: #a80000;
}

.cat-pill:hover:not(.active) {
  border-color: #a80000;
  color: #a80000;
}

.menu-list {
  padding: 40px 0 80px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
   margin-bottom: 40px; 
}

.menu-card {
  background: white;
  color: #2a1f1a;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #eee8e0;
  display: flex;
  flex-direction: column;
  transition: 0.25s;
  cursor: pointer;
}

.menu-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
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
  color: #a80000;
  font-weight: 800;
  font-size: 16px;
}

.btn-add {
  border: 2px solid #a80000;
  background: transparent;
  color: #a80000;
  padding: 6px 16px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #a80000;
  color: white;
}

.mini-cart {
  position: fixed;
  right: 30px;
  top: 55%;
  transform: translateY(-50%);
  background: #a80000;
  color: #fff;
  border: none;
  border-radius: 16px;
  padding: 14px 18px;
  box-shadow: 0 8px 24px rgba(168, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.mini-cart:hover {
  box-shadow: 0 12px 30px rgba(168, 0, 0, 0.3);
}

.mini-count {
  font-weight: 700;
}

.mini-total {
  color: #ffd700;
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
  width: min(480px, 94vw);
  background: #fff;
  color: #2a1f1a;
  border-radius: 16px;
  max-height: 85vh;
  overflow: auto;
  box-shadow: 0 20px 50px rgba(0,0,0,0.18);
}

/* TOP */
.cart-top {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; background: #a80000; border-radius: 16px 16px 0 0;
}
.cart-top-left { display: flex; align-items: center; gap: 8px; }
.cart-icon { flex-shrink: 0; }
.cart-top h3 { margin: 0; font-size: 20px; font-weight: 800; color: white; }
.cart-close {
  width: 30px; height: 30px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.2); color: white; font-size: 18px;
  cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s;
}
.cart-close:hover { background: rgba(255,255,255,0.35); }

/* TỔNG TIỀN */
.cart-total-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid #f0ebe5;
}
.ct-left { flex: 1; }
.ct-label { font-size: 16px; font-weight: 800; color: #1a1a1a; display: block; }
.ct-note { font-size: 11px; color: #aaa; margin: 2px 0 0; }
.ct-amount { font-size: 22px; font-weight: 800; color: #a80000; }

/* XÓA */
.cart-clear-row { display: flex; justify-content: flex-end; padding: 8px 20px 0; }
.cart-clear {
  border: none; background: none; color: #a80000; font-size: 13px;
  font-weight: 600; cursor: pointer; transition: 0.2s;
}
.cart-clear:hover { text-decoration: underline; }

.empty-cart { text-align: center; padding: 40px 20px; color: #bbb; font-size: 14px; }

/* DANH SÁCH MÓN */
.cart-items { padding: 8px 20px 0; }

.cart-item {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 12px; align-items: center;
  padding: 12px 0; border-bottom: 1px solid #f5f0eb;
}
.cart-item:last-child { border-bottom: none; }

.ci-info h4 { margin: 0; font-size: 14px; font-weight: 700; color: #1a1a1a; }
.ci-unit { font-size: 12px; color: #aaa; }

.qty-box {
  display: flex; align-items: center;
  border: 1.5px solid #ddd; border-radius: 8px; overflow: hidden;
}
.qty-box button {
  border: none; background: none; font-size: 16px; font-weight: 700;
  width: 30px; height: 30px; color: #333; cursor: pointer; transition: 0.15s;
}
.qty-box button:hover { background: #f5f0eb; }
.qty-box span { min-width: 26px; text-align: center; font-weight: 700; font-size: 14px; color: #1a1a1a; }

.item-total { font-weight: 700; font-size: 14px; color: #1a1a1a; min-width: 80px; text-align: right; }

.remove {
  border: none; background: none; font-size: 16px; color: #ccc;
  cursor: pointer; transition: 0.2s;
}
.remove:hover { color: #a80000; }

/* FOOTER */
.cart-footer {
  padding: 16px 20px 20px; display: flex; justify-content: center;
}
.cart-book {
  width: 100%; border: none;
  background: #a80000; color: white;
  padding: 14px; border-radius: 999px;
  font-weight: 800; font-size: 15px; letter-spacing: 0.5px;
  cursor: pointer; transition: 0.2s;
}
.cart-book:hover { background: #8b0000; }
.cart-book:disabled { opacity: 0.4; cursor: not-allowed; }

.empty-cart {
  color: #6b5f57;
}
.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  font-weight: 800;
  text-align: center;
  margin: 40px 0 24px;
  color: #1a1a1a;
  text-transform: uppercase;
  position: relative;
}

.section-title::after {
  content: "";
  display: block;
  width: 50px;
  height: 3px;
  background: #a80000;
  margin: 10px auto 0;
  border-radius: 2px;
}

/* GRID MÓN NHỎ LẠI */
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 👈 4 món mỗi hàng */
  gap: 24px;
}


/* CARD MÓN DẠNG NGANG */
.product-grid .menu-card {
  aspect-ratio: 1 / 1;   /* 👈 giữ hình vuông */
  display: flex;
  flex-direction: column;
}
.product-grid .price {
  font-size: 16px;
}

/* ẢNH NHỎ LẠI */
.product-grid .menu-img {
  width: 100%;
  height: 65%;
  object-fit: cover;
}

/* INFO GỌN LẠI */
.product-grid .menu-info {
  padding: 12px;
  height: 35%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-grid .menu-info h3 {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}
/* MÔ TẢ NHỎ */
.product-grid .menu-info p {
  font-size: 12px;
  color: #666;
}

.product-grid .menu-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-grid .btn-add {
  padding: 6px 12px;
  font-size: 13px;
}
.desc {
  white-space: pre-line;
  line-height: 1.6;
}
/* MODAL BOX */
.detail-modal {
  width: min(500px, 92vw);
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  animation: fadeIn 0.25s ease;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.detail-close {
  position: absolute; top: 14px; right: 14px; z-index: 10;
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: rgba(0,0,0,0.4); color: white; font-size: 20px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px); transition: 0.2s;
}
.detail-close:hover { background: rgba(0,0,0,0.6); }

.detail-img-wrap { width: 100%; height: 280px; overflow: hidden; flex-shrink: 0; }
.detail-img { width: 100%; height: 280px; object-fit: cover; display: block; }

.detail-content { padding: 24px; }

.detail-name {
  font-family: 'Playfair Display', serif;
  font-size: 24px; font-weight: 800; color: #1a1a1a;
  margin: 0 0 12px;
}

.detail-price-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f0ebe5;
}
.detail-price-left { display: flex; flex-direction: column; gap: 2px; }
.detail-price {
  font-size: 22px; font-weight: 800; color: #a80000;
}
.detail-vat {
  font-size: 12px; color: #999; font-style: italic;
}

.detail-category {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px;
}
.detail-cat-label { font-size: 13px; color: #999; }
.detail-cat-value {
  font-size: 13px; font-weight: 600; color: #555;
  background: #f5f0eb; padding: 4px 12px; border-radius: 999px;
}

.detail-desc {
  margin-bottom: 20px;
}
.detail-desc h4 {
  font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px;
}
.detail-desc p {
  font-size: 14px; line-height: 1.7; color: #555; margin: 0 0 4px;
}

.detail-footer {
  display: flex; justify-content: flex-end;
}
.detail-qty {
  display: flex; align-items: center; gap: 0;
  border: 2px solid #e0d8ce; border-radius: 999px; overflow: hidden;
}
.qty-btn {
  width: 38px; height: 38px; border: none; background: transparent;
  font-size: 18px; font-weight: 700; color: #a80000; cursor: pointer; transition: 0.2s;
}
.qty-btn:hover { background: #f5f0eb; }
.qty-num { min-width: 36px; text-align: center; font-size: 16px; font-weight: 700; color: #1a1a1a; }
.detail-add-btn {
  padding: 10px 28px; border: 2px solid #a80000; border-radius: 999px;
  background: transparent; color: #a80000; font-weight: 700; font-size: 14px;
  cursor: pointer; transition: 0.2s;
}
.detail-add-btn:hover { background: #a80000; color: white; }

/* ANIMATION */
@keyframes fadeIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@media (max-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
