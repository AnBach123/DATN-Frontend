<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getProducts } from '@/services/productApi'
import { getVoucherProducts } from '@/services/voucherApi'
import { useBookingStore } from '@/composables/bookingStore'
import { useCartStore } from '@/composables/cartStore'
import { getReviews } from '@/services/reviewApi'
import axiosInstance from '@/services/axiosInstance'
import { getPublishedPosts } from '@/services/blogApi'

interface Product { productId: number; productName: string; description?: string; unitPrice: number; imageUrl?: string | null; productCategory?: string }
interface ProductVoucher { id: number; voucherName: string; discountPercent: number; productId: number; productName: string; remainingQuantity: number; validTo: string; isActive: boolean }
interface InvoiceVoucher { id: number; voucherName: string; voucherCode: string; discountPercent: number; minOrderAmount: number; voucherStatus: string; remainingQuantity: number; expiresAt: string }
interface Review { id: number; name: string; rating: number; content: string; avatar?: string; createdAt?: string; visitType?: string }

const products = ref<Product[]>([])
const allProducts = ref<Product[]>([])
const productVouchers = ref<ProductVoucher[]>([])
const invoiceVouchers = ref<InvoiceVoucher[]>([])
const reviews = ref<Review[]>([])
const latestPosts = ref<any[]>([])
const loading = ref(true)
const { open: openBookingModal } = useBookingStore()
const { cartItems, totalQty, totalPrice, addItem, increase, decrease, removeItem, clearCart, buildFoodNote } = useCartStore()

const openCart = ref(false)
const openDetailModal = ref(false)
const selectedItem = ref<any>(null)
const detailQty = ref(1)
const showCartBtn = ref(false)

const CATEGORY_LABELS: Record<string, string> = {
  RAW_FOOD: 'Món sống', COOKED_FOOD: 'Món chín', HOT_POT_BROTH: 'Nước lẩu',
  DRINK: 'Đồ uống', DESSERT: 'Tráng miệng',
}
const getCategoryName = (key: string) => CATEGORY_LABELS[key] || key

const openDetail = (item: Product) => {
  selectedItem.value = item
  detailQty.value = 1
  openDetailModal.value = true
}

const addFromDetail = () => {
  const item = selectedItem.value
  if (!item) return
  const pid = item.productId || item.id
  for (let i = 0; i < detailQty.value; i++) {
    addItem({ id: pid, productName: item.productName, unitPrice: item.unitPrice })
  }
  openDetailModal.value = false
}

const addToCart = (item: Product) => {
  const pid = item.productId || item.id
  addItem({ id: pid, productName: item.productName, unitPrice: item.unitPrice })
}

const openBooking = () => {
  openCart.value = false
  openBookingModal(buildFoodNote())
}

const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  return reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length
})
const totalReviews = computed(() => reviews.value.length)
const reviewPage = ref(1)
const REVIEW_PAGE_SIZE = 5
const totalReviewPages = computed(() => Math.ceil(reviews.value.length / REVIEW_PAGE_SIZE))
const visibleReviews = computed(() => {
  const start = (reviewPage.value - 1) * REVIEW_PAGE_SIZE
  return reviews.value.slice(start, start + REVIEW_PAGE_SIZE)
})
const ratingCount = (s: number) => reviews.value.filter(r => r.rating === s).length
const ratingPercent = (s: number) => reviews.value.length ? (ratingCount(s) / reviews.value.length) * 100 : 0

const getImage = (item: Product) => {
  if (!item.imageUrl) return ''
  if (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('data:')) return item.imageUrl
  return 'http://localhost:8080' + item.imageUrl
}
const getAvatar = (r: Review) => r.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=8B1E1E&color=fff`
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : 'Gần đây'
const formatMoney = (v: number) => v ? v.toLocaleString('vi-VN') + 'đ' : '0đ'

const getDiscount = (item: Product) => {
  const pid = (item as any).productId || (item as any).id
  return productVouchers.value.find(v => v.productId === pid) || null
}
const calcDiscountPrice = (price: number, percent: number) => Math.round(price * (100 - percent) / 100)

onMounted(async () => {
  setTimeout(() => { showCartBtn.value = true }, 300)
  try {
    allProducts.value = await getProducts()
    products.value = allProducts.value.slice(0, 8)
  } catch {}
  loading.value = false
  try {
    const pv = (await getVoucherProducts()) || []
    const today = new Date().toISOString().split('T')[0]
    productVouchers.value = pv.filter((v: ProductVoucher) =>
      v.isActive && v.remainingQuantity > 0 && (!v.validTo || v.validTo >= today)
    ).slice(0, 6)
  } catch {}
  try {
    const res = await axiosInstance.get('/api/customer-vouchers')
    const cvList = res.data.data || []
    invoiceVouchers.value = cvList.filter((v: InvoiceVoucher) =>
      v.voucherStatus === 'Hoạt động' && v.discountPercent > 0 && v.remainingQuantity > 0
    ).slice(0, 4)
  } catch {}
  try { reviews.value = (await getReviews()).data } catch {}
  try {
    const posts = await getPublishedPosts()
    latestPosts.value = posts.filter((p: { thumbnailUrl: string }) => p.thumbnailUrl).slice(0, 3)
  } catch {}
})
</script>

<template>
  <div class="home-page">

    <!-- ===== HERO ===== -->
    <section class="hero">
      <div class="hero-bg-img"></div>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <p class="hero-label">ByHat Hotpot Restaurant</p>
        <h1>Tinh hoa lẩu Việt<br/>Ăn thả ga, không lo giá</h1>
        <p class="hero-desc">Hơn 60 món nhúng tươi ngon · 6 loại nước dùng đặc biệt<br/>Phục vụ 9h sáng - 11h30 tối</p>
        <div class="hero-btns">
          <button class="btn-main hero-btn" @click="openBooking()">Đặt bàn ngay</button>
          <router-link to="/menu" class="btn-ghost">Xem thực đơn</router-link>
        </div>
      </div>
    </section>

    <!-- ===== GIỚI THIỆU ===== -->
    <section class="about-sec">
      <div class="about-inner">
        <div class="about-text">
          <h2>VỀ CHÚNG TÔI</h2>
          <p>ByHat mang đến trải nghiệm lẩu đa dạng với nguyên liệu tươi ngon mỗi ngày. Không gian thoải mái, giá hợp lý — phù hợp nhóm bạn, gia đình hay đồng nghiệp.</p>
          <p>Với hơn 60 món nhúng và 6 loại nước dùng đặc biệt, chúng tôi luôn cố gắng mang đến bữa ăn ngon nhất cho bạn. Đặt bàn online, tích điểm thành viên và nhận voucher giảm giá mỗi lần dùng bữa.</p>
          <button class="btn-about" @click="openBooking()">Đặt bàn ngay</button>
        </div>
        <div class="about-gallery">
          <div class="gallery-big">
            <img v-if="allProducts[0] && getImage(allProducts[0])" :src="getImage(allProducts[0]!)" alt="ByHat" />
            <div v-else class="gallery-ph"></div>
          </div>
          <div class="gallery-small">
            <img v-if="allProducts[1] && getImage(allProducts[1])" :src="getImage(allProducts[1]!)" alt="ByHat" />
            <div v-else class="gallery-ph"></div>
          </div>
          <div class="gallery-small">
            <img v-if="allProducts[2] && getImage(allProducts[2])" :src="getImage(allProducts[2]!)" alt="ByHat" />
            <div v-else class="gallery-ph"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== THỰC ĐƠN ===== -->
    <section class="menu-sec">
      <div class="wrap">
        <div class="sec-head"><h2>Món ngon tại ByHat</h2><p>Những món được yêu thích nhất</p></div>
        <div v-if="loading" class="empty-text">Đang tải...</div>
        <div v-else-if="products.length === 0" class="empty-text">Chưa có sản phẩm</div>
        <div v-else class="menu-grid">
          <div class="m-card" v-for="item in products" :key="item.productId" @click="openDetail(item)">
            <div class="m-img">
              <img v-if="getImage(item)" :src="getImage(item)" :alt="item.productName" />
              <div v-else class="m-ph">{{ item.productName.charAt(0) }}</div>
            </div>
            <div v-if="getDiscount(item)" class="m-sticker">
              <span class="sticker-text">GIẢM<br/>{{ getDiscount(item)!.discountPercent }}%</span>
            </div>
            <div class="m-body">
              <h4>{{ item.productName }}</h4>
              <p>{{ item.description || 'Món ngon tại ByHat' }}</p>
              <div class="m-bottom">
                <div class="m-price-row">
                  <template v-if="getDiscount(item)">
                    <span class="m-price-old">{{ formatMoney(item.unitPrice) }}</span>
                    <strong class="m-price-new">{{ formatMoney(calcDiscountPrice(item.unitPrice, getDiscount(item)!.discountPercent)) }}</strong>
                  </template>
                  <strong v-else>{{ formatMoney(item.unitPrice) }}</strong>
                </div>
                <button class="m-add-btn" @click.stop="addToCart(item)">Ghi chú món</button>
              </div>
            </div>
          </div>
        </div>
        <div class="sec-foot"><router-link to="/menu" class="btn-main">XEM THỰC ĐƠN</router-link></div>

        <!-- NÚT TẠM TÍNH NỔI -->
        <transition name="cart-pop">
          <button class="home-mini-cart" v-if="totalQty > 0 && showCartBtn" @click="openCart = true">
            <span class="hmc-count">{{ totalQty }} món</span>
            <span class="hmc-total">{{ formatMoney(totalPrice) }}</span>
          </button>
        </transition>
      </div>
    </section>

    <!-- ===== VOUCHER MARQUEE ===== -->
    <section class="marquee-sec" v-if="invoiceVouchers.length > 0">
      <div class="marquee-track">
        <div class="marquee-content" v-for="n in 4" :key="n">
          <span class="marquee-item" v-for="v in invoiceVouchers" :key="'m' + n + v.id">
            <svg class="marquee-fire" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffd700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            {{ v.voucherName }} — Giảm <strong>{{ v.discountPercent }}%</strong>
            <template v-if="v.minOrderAmount"> · Hóa đơn từ {{ formatMoney(v.minOrderAmount) }}</template>
            <template v-if="v.expiresAt"> · Kết thúc {{ formatDate(v.expiresAt) }}</template>
            <span class="marquee-divider">
              <span class="div-line"></span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffd700" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span class="div-line"></span>
            </span>
          </span>
        </div>
      </div>
    </section>

    <!-- ===== BÀI VIẾT MỚI ===== -->
    <section class="posts-sec" v-if="latestPosts.length > 0">
      <div class="wrap">
        <div class="sec-head">
          <h2>Bài viết mới nhất</h2>
          <p>Tin tức và ưu đãi từ ByHat</p>
        </div>
        <div class="posts-grid">
          <router-link
            v-for="post in latestPosts"
            :key="post.id"
            :to="`/posts/${post.id}`"
            class="post-card"
          >
            <div class="pc-img">
              <img :src="post.thumbnailUrl" :alt="post.title" />
              <span class="pc-cat">{{ post.category || 'Tin tức' }}</span>
            </div>
            <div class="pc-body">
              <h4>{{ post.title }}</h4>
              <p>{{ post.summary || '' }}</p>
              <span class="pc-readmore">Xem ngay →</span>
            </div>
          </router-link>
        </div>
        <div class="sec-foot">
          <router-link to="/posts" class="btn-main">XEM TẤT CẢ BÀI VIẾT</router-link>
        </div>
      </div>
    </section>

    <!-- ===== ĐÁNH GIÁ ===== -->
    <section class="review-sec">
      <div class="wrap">
        <div class="sec-head">
          <h2>Khách hàng nói gì về ByHat</h2>
          <p>Trải nghiệm thật — cảm nhận thật</p>
        </div>

        <div class="rv-layout">
          <!-- CỘT TRÁI: ĐIỂM + BARS -->
          <div class="rv-left">
            <div class="rv-num">{{ avgRating ? avgRating.toFixed(1) : '0' }}</div>
            <div class="rv-stars"><span v-for="i in 5" :key="i" :class="{ on: i <= Math.round(avgRating) }">★</span></div>
            <small>{{ totalReviews }} đánh giá</small>
            <div class="rv-bars">
              <div class="rv-row" v-for="s in [5,4,3,2,1]" :key="s">
                <span>{{ s }}★</span>
                <div class="bar"><div class="fill" :style="{ width: ratingPercent(s) + '%' }"></div></div>
              </div>
            </div>
          </div>

          <!-- CỘT PHẢI: DANH SÁCH REVIEW -->
          <div class="rv-right">
            <div class="rv-card" v-for="r in visibleReviews" :key="r.id">
              <div class="rv-card-top">
                <img :src="getAvatar(r)" class="rv-avatar" />
                <div class="rv-user">
                  <h5>{{ r.name }}</h5>
                  <div class="rv-st"><span v-for="i in 5" :key="i" :class="{ on: i <= r.rating }">★</span></div>
                </div>
                <small class="rv-date">{{ formatDate(r.createdAt) }}</small>
              </div>
              <p class="rv-text">{{ r.content }}</p>
            </div>
          </div>
        </div>

        <!-- PAGINATION -->
        <div class="rv-pagination" v-if="totalReviewPages > 1">
          <button :disabled="reviewPage === 1" @click="reviewPage--" class="pg-btn">&lsaquo;</button>
          <button
            v-for="p in totalReviewPages" :key="p"
            :class="['pg-btn', { active: p === reviewPage }]"
            @click="reviewPage = p"
          >{{ p }}</button>
          <button :disabled="reviewPage === totalReviewPages" @click="reviewPage++" class="pg-btn">&rsaquo;</button>
        </div>

        <div class="sec-foot">
          <router-link to="/review" class="btn-main">VIẾT ĐÁNH GIÁ</router-link>
          <router-link to="/reviews" class="btn-outline" v-if="reviews.length > 5">Xem tất cả</router-link>
        </div>
      </div>
    </section>

    <!-- ===== POPUP CHI TIẾT MÓN ===== -->
    <div v-if="openDetailModal && selectedItem" class="modal-overlay" @click.self="openDetailModal = false">
      <div class="detail-modal">
        <button class="dm-close" @click="openDetailModal = false">&times;</button>
        <div class="dm-img-wrap">
          <img v-if="getImage(selectedItem)" class="dm-img" :src="getImage(selectedItem)" />
        </div>
        <div class="dm-content">
          <h2 class="dm-name">{{ selectedItem.productName }}</h2>
          <div class="dm-price-row">
            <div class="dm-price-left">
              <div class="dm-prices">
              <template v-if="getDiscount(selectedItem)">
                <span class="dm-price-old">{{ formatMoney(selectedItem.unitPrice) }}</span>
                <span class="dm-price">{{ formatMoney(calcDiscountPrice(selectedItem.unitPrice, getDiscount(selectedItem)!.discountPercent)) }}</span>
                <span class="dm-discount-tag">-{{ getDiscount(selectedItem)!.discountPercent }}%</span>
              </template>
              <span v-else class="dm-price">{{ formatMoney(selectedItem.unitPrice) }}</span>
              </div>
              <span class="dm-vat">Giá chưa gồm VAT</span>
            </div>
            <div class="dm-qty">
              <button @click="detailQty > 1 && detailQty--">-</button>
              <span>{{ detailQty }}</span>
              <button @click="detailQty++">+</button>
            </div>
          </div>
          <div class="dm-cat" v-if="selectedItem.productCategory">
            <span class="dm-cat-label">Danh mục</span>
            <span class="dm-cat-value">{{ getCategoryName(selectedItem.productCategory) }}</span>
          </div>
          <div class="dm-desc" v-if="selectedItem.description">
            <h4>Mô tả</h4>
            <p>{{ selectedItem.description }}</p>
          </div>
          <div class="dm-footer">
            <button class="dm-add-btn" @click="addFromDetail">Ghi chú món</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== POPUP TẠM TÍNH ===== -->
    <div v-if="openCart" class="modal-overlay" @click.self="openCart = false">
      <div class="cart-panel">
        <div class="cart-top">
          <div class="cart-top-left">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <h3>Tạm tính</h3>
          </div>
          <button class="cart-close" @click="openCart = false">&times;</button>
        </div>
        <div class="ct-total-bar">
          <div><span class="ct-label">Tổng tiền</span><p class="ct-note">Đơn giá tạm tính chỉ mang tính tham khảo</p></div>
          <span class="ct-amount">{{ formatMoney(totalPrice) }}</span>
        </div>
        <div class="ct-clear-row" v-if="cartItems.length > 0">
          <button class="ct-clear" @click="clearCart">Xóa hết tạm tính</button>
        </div>
        <div v-if="cartItems.length === 0" class="ct-empty">Chưa có món nào</div>
        <div v-else class="ct-items">
          <div class="ct-item" v-for="ci in cartItems" :key="ci.id">
            <div class="ct-info"><h4>{{ ci.productName }}</h4><span>{{ formatMoney(ci.unitPrice) }}</span></div>
            <div class="ct-qty">
              <button @click="decrease(ci.id)">-</button>
              <span>{{ ci.qty }}</span>
              <button @click="increase(ci.id)">+</button>
            </div>
            <span class="ct-line-total">{{ formatMoney(ci.unitPrice * ci.qty) }}</span>
            <button class="ct-remove" @click="removeItem(ci.id)">&times;</button>
          </div>
        </div>
        <div class="ct-footer">
          <button class="ct-book" :disabled="cartItems.length === 0" @click="openBooking()">ĐẶT BÀN VỚI GHI CHÚ NÀY</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap');

.home-page { font-family: 'Manrope', sans-serif; color: #333; background: #f7f4f0; }
.wrap { max-width: 1140px; margin: 0 auto; padding: 0 20px; }
.empty-text { text-align: center; padding: 40px; color: #aaa; }

/* ===== SHARED ===== */
.tag { display: inline-block; padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #f5e6e6; color: #a80000; margin-bottom: 8px; }
.tag.light { background: rgba(255,255,255,0.15); color: #ffd6d6; }
.sec-head { text-align: center; margin-bottom: 40px; }
.sec-head h2 { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 800; color: #1a1a1a; margin: 6px 0; }
.sec-head p { font-size: 14px; color: #999; }
.sec-head.light h2 { color: white; }
.sec-head.light p { color: rgba(255,255,255,0.7); }
.sec-foot { text-align: center; margin-top: 36px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* ===== BUTTONS ===== */
.btn-main { display: inline-block; padding: 12px 28px; border-radius: 999px; font-weight: 700; font-size: 14px; border: none; cursor: pointer; text-decoration: none; background: #a80000; color: white; transition: 0.25s; }
.btn-main:hover { background: #8b0000; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(168,0,0,0.2); color: white; }
.btn-main.sm { padding: 8px 20px; font-size: 13px; }
.btn-ghost { display: inline-block; padding: 12px 28px; border-radius: 999px; font-weight: 700; font-size: 14px; border: 2px solid rgba(255,255,255,0.35); color: white; text-decoration: none; transition: 0.25s; }
.btn-ghost:hover { background: rgba(255,255,255,0.15); color: white; }
.btn-outline { display: inline-block; padding: 12px 28px; border-radius: 999px; font-weight: 700; font-size: 14px; border: 2px solid #c8bfb4; color: #555; text-decoration: none; transition: 0.25s; background: transparent; }
.btn-outline:hover { background: #333; color: white; border-color: #333; }
.btn-white { display: inline-block; padding: 14px 36px; border-radius: 999px; font-weight: 800; font-size: 15px; background: white; color: #a80000; border: none; cursor: pointer; transition: 0.25s; box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
.btn-white:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.18); }

/* ===== HERO ===== */
.hero {
  position: relative; overflow: hidden; background: #a80000;
  width: 100%;
  aspect-ratio: 27 / 9;
  display: flex; align-items: center; justify-content: center;
}

.hero-bg-img {
  position: absolute; inset: 0; z-index: 0;
  background: url('@/assets/images/hero-hotpot.png') center / cover no-repeat;
}

.hero-overlay {
  position: absolute; inset: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 1;
}

/* CONTENT */
.hero-content {
  position: relative; z-index: 2; text-align: center;
  max-width: 700px; padding: 50px 20px; color: white;
}
.hero-label { font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 600; letter-spacing: 1px; margin-bottom: 14px; }
.hero-content h1 {
  font-family: 'Playfair Display', serif; font-size: 44px; font-weight: 800;
  color: white; line-height: 1.2; margin-bottom: 16px;
  text-shadow: 0 2px 12px rgba(0,0,0,0.3);
}
.hero-desc { font-size: 15px; color: rgba(255,255,255,0.85); margin-bottom: 28px; line-height: 1.6; }
.hero-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.hero-btn { box-shadow: 0 4px 16px rgba(0,0,0,0.2); }

/* ===== ABOUT ===== */
.about-sec { padding: 0; background: #582020; }

.about-inner {
  display: grid; grid-template-columns: 1fr 1fr;
  max-width: 1140px; margin: 0 auto;
  min-height: 420px;
}

.about-text {
  padding: 60px 50px 60px 20px;
  display: flex; flex-direction: column; justify-content: center;
  color: white;
}
.about-text h2 {
  font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 800;
  margin-bottom: 20px; color: #e8a835; letter-spacing: 1px;
}
.about-text p {
  font-size: 14px; line-height: 1.8; color: rgba(255,255,255,0.78); margin-bottom: 16px;
}
.btn-about {
  display: inline-block; width: fit-content; margin-top: 8px;
  padding: 12px 28px; border: 2px solid #e8a835; border-radius: 999px;
  background: transparent; color: #e8a835; font-weight: 700; font-size: 14px;
  cursor: pointer; transition: 0.25s;
}
.btn-about:hover { background: #e8a835; color: #2a1a1a; }

.about-gallery {
  display: grid; grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr; gap: 4px;
}
.gallery-big {
  grid-row: 1 / 3; overflow: hidden;
}
.gallery-big img, .gallery-small img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  transition: transform 0.4s;
}
.gallery-big:hover img, .gallery-small:hover img { transform: scale(1.05); }
.gallery-small { overflow: hidden; }
.gallery-ph { width: 100%; height: 100%; background: #3a2a2a; }

/* ===== MENU ===== */
.menu-sec { padding: 70px 0; background: #f0ece6; }
.menu-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.m-card { background: white; border-radius: 12px; overflow: visible; position: relative; transition: 0.25s; box-shadow: 0 1px 8px rgba(0,0,0,0.04); cursor: pointer; display: flex; flex-direction: column; }
.m-img { border-radius: 12px 12px 0 0; overflow: hidden; }
.m-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.m-img { height: 150px; overflow: hidden; position: relative; }
.m-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.m-card:hover .m-img img { transform: scale(1.04); }
.m-ph { width: 100%; height: 100%; background: #ede8e0; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #c8b9a8; }
.m-body { padding: 12px 14px; display: flex; flex-direction: column; flex: 1; }
.m-body h4 { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.m-body p { font-size: 12px; color: #aaa; margin-bottom: 5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.m-body strong { font-size: 15px; color: #a80000; }

.m-sticker {
  position: absolute; top: -14px; right: -14px;
  width: 80px; height: 80px;
  background: #e53e3e;
  display: flex; align-items: center; justify-content: center;
  clip-path: polygon(
    50% 0%, 63% 10%, 80% 2%, 78% 20%, 98% 28%,
    88% 42%, 100% 56%, 85% 62%, 90% 80%,
    74% 78%, 65% 95%, 50% 84%, 35% 95%,
    26% 78%, 10% 80%, 15% 62%, 0% 56%,
    12% 42%, 2% 28%, 22% 20%, 20% 2%, 37% 10%
  );
  z-index: 2;
}
.m-sticker::after {
  content: '';
  position: absolute;
  inset: 3px;
  background: #ffe100;
  clip-path: polygon(
    50% 0%, 63% 10%, 80% 2%, 78% 20%, 98% 28%,
    88% 42%, 100% 56%, 85% 62%, 90% 80%,
    74% 78%, 65% 95%, 50% 84%, 35% 95%,
    26% 78%, 10% 80%, 15% 62%, 0% 56%,
    12% 42%, 2% 28%, 22% 20%, 20% 2%, 37% 10%
  );
}
.sticker-text {
  position: relative; z-index: 1;
  font-size: 15px; font-weight: 900; color: #e53e3e;
  text-align: center; line-height: 1.2;
  text-shadow: 0 1px 1px rgba(0,0,0,0.1);
}
.m-price-row { display: flex; align-items: center; gap: 8px; }
.m-price-old { font-size: 13px; color: #aaa; text-decoration: line-through; }
.m-price-new { font-size: 16px; color: #e53e3e; }

/* ===== DEAL MÓN ĂN ===== */
/* ===== VOUCHER MARQUEE ===== */
.marquee-sec {
  background: #a80000; overflow: hidden; padding: 22px 0;
  border-top: 3px solid #ffd700; border-bottom: 3px solid #ffd700;
}

.marquee-track {
  overflow: hidden; position: relative;
  display: flex;
}

.marquee-content {
  display: flex; white-space: nowrap; flex-shrink: 0;
  animation: marqueeScroll 30s linear infinite;
  gap: 0; padding: 0;
}

.marquee-item {
  display: inline-flex; align-items: center; gap: 6px;
  color: white; font-size: 22px; font-weight: 700;
  padding: 0 12px; letter-spacing: 0.3px;
  flex-shrink: 0;
}
.marquee-item strong { color: #ffd700; font-size: 24px; }
.marquee-fire { flex-shrink: 0; margin-right: 4px; }
.marquee-divider {
  display: inline-flex; align-items: center; gap: 8px;
  margin: 0 24px; flex-shrink: 0;
}
.div-line { width: 28px; height: 2px; background: #ffd700; border-radius: 2px; }

@keyframes marqueeScroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

/* ===== BÀI VIẾT ===== */
.posts-sec { padding: 70px 0; }
.posts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.post-card {
  background: white; border-radius: 14px; overflow: hidden; text-decoration: none; color: inherit;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05); transition: 0.25s; display: block;
}
.post-card:hover { transform: translateY(-4px); box-shadow: 0 10px 28px rgba(0,0,0,0.1); }
.pc-img { position: relative; height: 180px; overflow: hidden; }
.pc-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.post-card:hover .pc-img img { transform: scale(1.05); }
.pc-cat {
  position: absolute; top: 10px; left: 10px; padding: 4px 12px;
  background: rgba(0,0,0,0.5); color: white; border-radius: 999px;
  font-size: 11px; font-weight: 700; backdrop-filter: blur(4px);
}
.pc-body { padding: 16px; display: flex; flex-direction: column; flex: 1; }
.post-card { display: flex; flex-direction: column; }
.pc-body h4 {
  font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.pc-body p {
  font-size: 13px; color: #999; margin: 0 0 10px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.pc-readmore { font-size: 13px; font-weight: 600; color: #a80000; transition: 0.2s; margin-top: auto; }
.post-card:hover .pc-readmore { text-decoration: underline; }

/* ===== REVIEWS ===== */
.review-sec { padding: 70px 0; }

.rv-layout {
  display: grid; grid-template-columns: 280px 1fr; gap: 28px;
  margin-bottom: 32px; align-items: start;
}

.rv-left {
  background: white; border-radius: 16px; padding: 28px;
  border: 1px solid #eee8e0; text-align: center;
  align-self: stretch; display: flex; flex-direction: column; justify-content: center;
}
.rv-num { font-size: 52px; font-weight: 800; color: #a80000; line-height: 1; }
.rv-stars { margin: 8px 0 4px; font-size: 18px; }
.rv-stars span { color: #ddd; }
.rv-stars span.on { color: #ffc107; }
.rv-left small { color: #aaa; font-size: 13px; display: block; margin-bottom: 20px; }
.rv-bars { display: flex; flex-direction: column; gap: 8px; text-align: left; }
.rv-row { display: grid; grid-template-columns: 32px 1fr; align-items: center; gap: 8px; font-size: 13px; }
.rv-row span:first-child { font-weight: 600; color: #555; }
.bar { height: 8px; border-radius: 999px; background: #f0ebe5; overflow: hidden; }
.fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #ffc107, #ffb300); }

.rv-right { display: flex; flex-direction: column; gap: 12px; }
.rv-card { background: white; border-radius: 14px; padding: 20px; border: 1px solid #eee8e0; transition: 0.2s; }
.rv-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.05); border-color: #ffd70055; }
.rv-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.rv-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #ede8e0; flex-shrink: 0; }
.rv-user { flex: 1; }
.rv-user h5 { margin: 0; font-size: 14px; font-weight: 700; color: #1a1a1a; }
.rv-st { font-size: 14px; margin-top: 2px; }
.rv-st span { color: #ddd; }
.rv-st span.on { color: #ffc107; }
.rv-date { font-size: 12px; color: #bbb; flex-shrink: 0; }
.rv-text { font-size: 14px; color: #555; line-height: 1.6; margin: 0; }

.rv-pagination { display: flex; justify-content: center; gap: 6px; margin-bottom: 24px; }
.pg-btn { min-width: 36px; height: 36px; border: 1.5px solid #ddd; border-radius: 8px; background: white; color: #555; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 14px; }
.pg-btn:hover:not(:disabled) { border-color: #a80000; color: #a80000; }
.pg-btn.active { background: #a80000; color: white; border-color: #a80000; }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }


/* ===== NÚT GHI CHÚ & TẠM TÍNH NỔI ===== */
.m-bottom { display: flex; flex-direction: column; gap: 8px; margin-top: auto; }
.m-add-btn { align-self: flex-start; }
.m-add-btn {
  border: 2px solid #a80000; background: transparent; color: #a80000;
  padding: 5px 14px; border-radius: 999px; font-weight: 700; font-size: 12px;
  cursor: pointer; transition: 0.2s; flex-shrink: 0;
}
.m-add-btn:hover { background: #a80000; color: white; }

.home-mini-cart {
  position: fixed; right: 30px; top: 55%; transform: translateY(-50%); z-index: 999;
  background: #a80000; color: white; border: none; border-radius: 16px;
  padding: 14px 18px; box-shadow: 0 8px 24px rgba(168,0,0,0.25);
  display: flex; flex-direction: column; gap: 4px; cursor: pointer; transition: 0.2s;
}
.home-mini-cart:hover { box-shadow: 0 12px 30px rgba(168,0,0,0.3); }

.cart-pop-enter-active { animation: popIn 0.4s ease; }
.cart-pop-leave-active { animation: popIn 0.3s ease reverse; }
@keyframes popIn {
  0% { transform: translateY(-50%) scale(0); opacity: 0; }
  60% { transform: translateY(-50%) scale(1.1); opacity: 1; }
  100% { transform: translateY(-50%) scale(1); }
}
.hmc-count { font-weight: 700; }
.hmc-total { color: #ffd700; }

/* ===== MODAL OVERLAY ===== */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1200;
}

/* ===== DETAIL MODAL ===== */
.detail-modal {
  width: min(480px, 92vw); background: white; border-radius: 18px;
  overflow: hidden; max-height: 90vh; overflow-y: auto; position: relative;
}
.dm-close {
  position: absolute; top: 12px; right: 12px; z-index: 10;
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: rgba(0,0,0,0.35); color: white; font-size: 18px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.dm-close:hover { background: rgba(0,0,0,0.55); }
.dm-img-wrap { position: relative; width: 100%; height: 280px; overflow: hidden; }
.dm-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dm-discount-tag {
  padding: 3px 10px; background: #e53e3e; color: white;
  border-radius: 6px; font-size: 13px; font-weight: 800;
}
.dm-content { padding: 22px; }
.dm-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 800; color: #1a1a1a; margin: 0 0 12px; }
.dm-price-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #f0ebe5; }
.dm-price-left { display: flex; flex-direction: column; gap: 2px; }
.dm-prices { display: flex; align-items: center; gap: 8px; }
.dm-price { font-size: 20px; font-weight: 800; color: #a80000; }
.dm-price-old { font-size: 15px; color: #aaa; text-decoration: line-through; }
.dm-vat { font-size: 11px; color: #999; font-style: italic; width: 100%; }
.dm-qty {
  display: flex; align-items: center; border: 2px solid #e0d8ce; border-radius: 999px; overflow: hidden;
}
.dm-qty button { width: 36px; height: 36px; border: none; background: transparent; font-size: 17px; font-weight: 700; color: #a80000; cursor: pointer; }
.dm-qty button:hover { background: #f5f0eb; }
.dm-qty span { min-width: 30px; text-align: center; font-weight: 700; font-size: 15px; color: #1a1a1a; }
.dm-cat { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.dm-cat-label { font-size: 13px; color: #999; }
.dm-cat-value { font-size: 13px; font-weight: 600; color: #555; background: #f5f0eb; padding: 4px 12px; border-radius: 999px; }
.dm-desc { margin-bottom: 18px; }
.dm-desc h4 { font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px; }
.dm-desc p { font-size: 14px; line-height: 1.7; color: #555; margin: 0; }
.dm-footer { display: flex; justify-content: flex-end; }
.dm-add-btn {
  padding: 10px 28px; border: 2px solid #a80000; border-radius: 999px;
  background: transparent; color: #a80000; font-weight: 700; font-size: 14px;
  cursor: pointer; transition: 0.2s;
}
.dm-add-btn:hover { background: #a80000; color: white; }

/* ===== CART PANEL ===== */
.cart-panel {
  width: min(480px, 94vw); background: white; border-radius: 16px;
  max-height: 85vh; overflow: auto;
}
.cart-top {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; background: #a80000; border-radius: 16px 16px 0 0;
}
.cart-top-left { display: flex; align-items: center; gap: 8px; }
.cart-top h3 { margin: 0; font-size: 20px; font-weight: 800; color: white; }
.cart-close {
  width: 30px; height: 30px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.2); color: white; font-size: 18px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.cart-close:hover { background: rgba(255,255,255,0.35); }
.ct-total-bar { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f0ebe5; }
.ct-label { font-size: 16px; font-weight: 800; color: #1a1a1a; display: block; }
.ct-note { font-size: 11px; color: #aaa; margin: 2px 0 0; }
.ct-amount { font-size: 22px; font-weight: 800; color: #a80000; }
.ct-clear-row { display: flex; justify-content: flex-end; padding: 8px 20px 0; }
.ct-clear { border: none; background: none; color: #a80000; font-size: 13px; font-weight: 600; cursor: pointer; }
.ct-clear:hover { text-decoration: underline; }
.ct-empty { text-align: center; padding: 40px 20px; color: #bbb; font-size: 14px; }
.ct-items { padding: 8px 20px 0; }
.ct-item { display: grid; grid-template-columns: 1fr auto auto auto; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid #f5f0eb; }
.ct-item:last-child { border-bottom: none; }
.ct-info h4 { margin: 0; font-size: 14px; font-weight: 700; color: #1a1a1a; }
.ct-info span { font-size: 12px; color: #aaa; }
.ct-qty { display: flex; align-items: center; border: 1.5px solid #ddd; border-radius: 8px; overflow: hidden; }
.ct-qty button { border: none; background: none; font-size: 16px; font-weight: 700; width: 30px; height: 30px; color: #333; cursor: pointer; }
.ct-qty button:hover { background: #f5f0eb; }
.ct-qty span { min-width: 26px; text-align: center; font-weight: 700; font-size: 14px; }
.ct-line-total { font-weight: 700; font-size: 14px; color: #1a1a1a; min-width: 80px; text-align: right; }
.ct-remove { border: none; background: none; font-size: 16px; color: #ccc; cursor: pointer; }
.ct-remove:hover { color: #a80000; }
.ct-footer { padding: 16px 20px 20px; display: flex; justify-content: center; }
.ct-book {
  width: 100%; border: none; background: #a80000; color: white;
  padding: 14px; border-radius: 999px; font-weight: 800; font-size: 15px;
  cursor: pointer; transition: 0.2s;
}
.ct-book:hover { background: #8b0000; }
.ct-book:disabled { opacity: 0.4; cursor: not-allowed; }

/* ===== RESPONSIVE ===== */
@media (max-width: 992px) {
  .hero-content h1 { font-size: 34px; }
  .about-inner { grid-template-columns: 1fr; }
  .about-text { padding: 40px 20px; }
  .about-gallery { grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 200px; }
  .gallery-big { grid-row: auto; }
  .menu-grid { grid-template-columns: repeat(2, 1fr); }
  .rv-layout { grid-template-columns: 1fr; }
  .rv-left { position: static; }
}
@media (max-width: 576px) {
  .hero-content h1 { font-size: 26px; }
  .menu-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .sec-head h2 { font-size: 24px; }
}
</style>
