<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getProducts } from '@/services/productApi'
import { getVoucherProducts } from '@/services/voucherApi'
import { useBookingStore } from '@/composables/bookingStore'
import { getReviews } from '@/services/reviewApi'
import axiosInstance from '@/services/axiosInstance'
import { getPublishedPosts } from '@/services/blogApi'

interface Product { productId: number; productName: string; description?: string; unitPrice: number; imageUrl?: string | null }
interface ProductVoucher { id: number; voucherName: string; discountPercent: number; productId: number; productName: string; remainingQuantity: number; validTo: string; isActive: boolean }
interface InvoiceVoucher { id: number; voucherName: string; voucherCode: string; discountPercent: number; minOrderAmount: number; voucherStatus: string; remainingQuantity: number }
interface Review { id: number; name: string; rating: number; content: string; avatar?: string; createdAt?: string; visitType?: string }

const products = ref<Product[]>([])
const allProducts = ref<Product[]>([])
const productVouchers = ref<ProductVoucher[]>([])
const invoiceVouchers = ref<InvoiceVoucher[]>([])
const reviews = ref<Review[]>([])
const latestPosts = ref<any[]>([])
const loading = ref(true)
const { open: openBooking } = useBookingStore()


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
          <div class="m-card" v-for="item in products" :key="item.productId">
            <div class="m-img">
              <img v-if="getImage(item)" :src="getImage(item)" :alt="item.productName" />
              <div v-else class="m-ph">{{ item.productName.charAt(0) }}</div>
              <div v-if="getDiscount(item)" class="m-discount-badge">-{{ getDiscount(item)!.discountPercent }}%</div>
            </div>
            <div class="m-body">
              <h4>{{ item.productName }}</h4>
              <p>{{ item.description || 'Món ngon tại ByHat' }}</p>
              <div class="m-price-row">
                <template v-if="getDiscount(item)">
                  <span class="m-price-old">{{ formatMoney(item.unitPrice) }}</span>
                  <strong class="m-price-new">{{ formatMoney(calcDiscountPrice(item.unitPrice, getDiscount(item)!.discountPercent)) }}</strong>
                </template>
                <strong v-else>{{ formatMoney(item.unitPrice) }}</strong>
              </div>
            </div>
          </div>
        </div>
        <div class="sec-foot"><router-link to="/menu" class="btn-outline">Xem toàn bộ thực đơn</router-link></div>
      </div>
    </section>

    <!-- ===== VOUCHER MARQUEE ===== -->
    <section class="marquee-sec" v-if="invoiceVouchers.length > 0">
      <div class="marquee-track">
        <div class="marquee-content" v-for="n in 4" :key="n">
          <span class="marquee-item" v-for="v in invoiceVouchers" :key="'m' + n + v.id">
            🔥 {{ v.voucherName }} — Giảm <strong>{{ v.discountPercent }}%</strong>
            <template v-if="v.minOrderAmount"> · Hóa đơn từ {{ formatMoney(v.minOrderAmount) }}</template>
            <span class="marquee-divider">✦</span>
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
          <router-link to="/posts" class="btn-outline">Xem tất cả bài viết</router-link>
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
          <router-link to="/review" class="btn-main">Viết đánh giá</router-link>
          <router-link to="/reviews" class="btn-outline" v-if="reviews.length > 5">Xem tất cả</router-link>
        </div>
      </div>
    </section>


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
.m-card { background: white; border-radius: 12px; overflow: hidden; transition: 0.25s; box-shadow: 0 1px 8px rgba(0,0,0,0.04); }
.m-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.m-img { height: 150px; overflow: hidden; position: relative; }
.m-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.m-card:hover .m-img img { transform: scale(1.04); }
.m-ph { width: 100%; height: 100%; background: #ede8e0; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #c8b9a8; }
.m-body { padding: 12px 14px; }
.m-body h4 { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.m-body p { font-size: 12px; color: #aaa; margin-bottom: 5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.m-body strong { font-size: 15px; color: #a80000; }

.m-discount-badge {
  position: absolute; top: 8px; right: 8px; padding: 4px 12px;
  background: #e53e3e; color: white; border-radius: 999px; font-size: 13px; font-weight: 800;
  box-shadow: 0 2px 8px rgba(229,62,62,0.35);
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
.marquee-divider { color: #ffd700; margin: 0 18px; font-size: 16px; flex-shrink: 0; }

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
