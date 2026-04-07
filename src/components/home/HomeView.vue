<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getProducts } from '@/services/productApi'
import { getVoucherCombos, getVoucherProducts } from '@/services/voucherApi'
import { useBookingStore } from '@/composables/bookingStore'
import { getReviews, createReview } from '@/services/reviewApi'

interface Product {
  productId: number
  productName: string
  description?: string
  unitPrice: number
  imageUrl?: string | null
}

interface Voucher {
  voucherId: number
  voucherName: string
  description: string
}

const products = ref<Product[]>([])
const vouchers = ref<Voucher[]>([])
const loading = ref(true)
const visibleCount = ref(3)

interface Review {
  id: number
  name: string
  rating: number
  content: string
  avatar?: string
  createdAt?: string
  visitType?: string
  tip?: string
}

const reviews = ref<Review[]>([])
const showForm = ref(false)
const submitting = ref(false)
const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  const total = reviews.value.reduce((sum, r) => sum + r.rating, 0)
  return total / reviews.value.length
})

const form = ref({
  name: '',
  rating: 5,
  content: ''
})

const loadReviews = async () => {
  try {
    const res = await getReviews()
    reviews.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const submitReview = async () => {
  submitting.value = true
  try {
    await createReview(form.value)

    alert('Gửi thành công! Chờ duyệt')

    form.value = { name: '', rating: 5, content: '' }
    showForm.value = false

    await loadReviews()
  } catch (e: any) {
    alert(e.response?.data)
  } finally {
    submitting.value = false
  }
}

const { open: openBooking } = useBookingStore()

const loadProducts = async () => {
  try {
    const data = await getProducts()
    products.value = data.slice(0, 4)
  } catch (error) {
    // silent
  } finally {
    loading.value = false
  }
}

const loadVouchers = async () => {
  try {
    const combo = (await getVoucherCombos()) || []
    const product = (await getVoucherProducts()) || []
    vouchers.value = [...combo, ...product].slice(0, 3)
  } catch (error) {
    // silent
  }
}

const getImage = (item: Product) => {
  if (!item.imageUrl) return 'https://picsum.photos/400/300'
  if (item.imageUrl.startsWith('http')) return item.imageUrl
  return 'http://localhost:8080' + item.imageUrl
}

const getAvatar = (review: Review) => {
  if (review.avatar) return review.avatar
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=8B1E1E&color=fff`
}

const averageRating = computed(() => {
  if (!reviews.value.length) return 0
  const total = reviews.value.reduce((sum, r) => sum + r.rating, 0)
  return (total / reviews.value.length).toFixed(1)
})

const totalReviews = computed(() => reviews.value.length)
const visibleReviews = computed(() => {
  return reviews.value.slice(0, visibleCount.value)
})

const loadMore = () => {
  if (visibleCount.value >= reviews.value.length) {
    // 👉 Thu gọn lại
    visibleCount.value = 3
  } else {
    // 👉 Xem thêm
    visibleCount.value += 3
  }
}

const ratingCount = (star: number) => {
  return reviews.value.filter(r => r.rating === star).length
}

const ratingPercent = (star: number) => {
  if (!reviews.value.length) return 0
  return (ratingCount(star) / reviews.value.length) * 100
}

const formatDate = (date?: string) => {
  if (!date) return 'Gần đây'
  return new Date(date).toLocaleDateString('vi-VN')
}

// nếu backend chưa có visitType thì fake demo nhẹ cho đẹp
const getVisitType = (review: Review) => {
  return review.visitType || ['Bạn bè', 'Cặp đôi', 'Gia đình', 'Một mình'][review.id % 4]
}

onMounted(() => {
  loadProducts()
  loadVouchers()
  loadReviews()
})
</script>

<template>
  <div class="home">
    <section class="hero text-center text-white">
      <div class="overlay">
        <div class="container hero-content">
          <div class="rating">
            ⭐⭐⭐⭐⭐
            <p>4.5/5 - 1200+ Reviews</p>
          </div>

          <h1 class="title">TINH HOA LẨU VIỆT - ĂN THẢ GA, KHÔNG LO GIÁ</h1>

          <p class="sub">Thưởng thức lẩu cao cấp trong không gian sang trọng</p>

          <div class="mt-4">
            <button class="btn btn-light btn-lg me-3" @click="openBooking()">ĐẶT BÀN NGAY</button>

            <router-link to="/menu" class="btn btn-outline-light btn-lg">
              XEM THỰC ĐƠN
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="intro text-center text-white">
      <div class="intro-overlay">
        <div class="container">
          <h2>GIỚI THIỆU VỀ BYHAT</h2>
          <p>Trải nghiệm 6 loại nước dùng & hơn 60 món nhúng tươi ngon</p>
        </div>
      </div>
    </section>

    <section class="menu-section">
      <div class="container">
        <h2 class="text-center text-white mb-3">TINH HOA VỊ LẨU</h2>
        <p class="text-center text-white mb-5">Những món ngon bạn không thể bỏ lỡ tại ByHat</p>

        <div v-if="loading" class="text-center text-white">Đang tải món ăn...</div>
        <div v-else-if="products.length === 0" class="text-center text-white">
          Chưa có sản phẩm
        </div>

        <div v-else class="row g-4">
          <div class="col-lg-3 col-md-6" v-for="item in products" :key="item.productId">
            <div class="card menu-card h-100">
              <img :src="getImage(item)" class="card-img-top product-img" />

              <div class="card-body text-center">
                <h5 class="card-title">{{ item.productName }}</h5>

                <p class="card-text">
                  {{ item.description || 'Món ăn đặc biệt của ByHat' }}
                </p>

                <div class="price">{{ item.unitPrice.toLocaleString('vi-VN') }} đ</div>

                <router-link :to="'/product/' + item.productId" class="btn btn-danger btn-sm">
                  Chi tiết
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="promo-section">
      <div class="container">
        <h2 class="text-center text-white mb-5">ƯU ĐÃI ĐẶC BIỆT THÁNG NÀY</h2>

        <div v-if="vouchers.length === 0" class="text-center text-white">Chưa có ưu đãi</div>

        <div v-else class="row g-4">
          <div class="col-md-4" v-for="item in vouchers" :key="item.voucherId">
            <div class="promo-card">
              <div class="badge-sale">🔥 ƯU ĐÃI</div>

              <h4>{{ item.voucherName }}</h4>
              <p>{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

   <section class="review-section">
  <div class="container">
    <div class="review-header text-center">
      <p class="review-badge">Khách hàng nói gì về ByHat</p>
      <h2 class="review-main-title">ĐÁNH GIÁ TỪ THỰC KHÁCH</h2>
      <p class="review-subtitle">
        Trải nghiệm thật – cảm nhận thật – hương vị thật
      </p>
    </div>

    <!-- REVIEW SUMMARY -->
    <div class="review-summary-box">
      <div class="summary-left">
        <div class="summary-score">{{ averageRating }}</div>
        <div class="summary-label">Xuất sắc</div>

        <div class="summary-stars">
          <span v-for="i in 5" :key="i">●</span>
        </div>

        <div class="summary-total">({{ totalReviews }}) đánh giá</div>
      </div>

      <div class="summary-middle">
        <div class="rating-row" v-for="star in [5,4,3,2,1]" :key="star">
          <span class="rating-text">{{ star }} sao</span>
          <div class="rating-bar">
            <div class="rating-fill" :style="{ width: ratingPercent(star) + '%' }"></div>
          </div>
          <span class="rating-count">{{ ratingCount(star) }}</span>
        </div>
      </div>

      <div class="summary-right">
  <div class="category-score">
    <span>Phục vụ</span>
    <div class="mini-bar">
      <div class="mini-fill" :style="{ width: avgRating * 20 + '%' }"></div>
    </div>
    <b>{{ avgRating.toFixed(1) }}</b>
  </div>

  <div class="category-score">
    <span>Đặt bàn</span>
    <div class="mini-bar">
      <div class="mini-fill" :style="{ width: avgRating * 20 + '%' }"></div>
    </div>
    <b>{{ avgRating.toFixed(1) }}</b>
  </div>

  <div class="category-score">
    <span>Thời gian chờ</span>
    <div class="mini-bar">
      <div class="mini-fill" :style="{ width: avgRating * 20 + '%' }"></div>
    </div>
    <b>{{ avgRating.toFixed(1) }}</b>
  </div>

  <div class="category-score">
    <span>Trải nghiệm</span>
    <div class="mini-bar">
      <div class="mini-fill" :style="{ width: avgRating * 20 + '%' }"></div>
    </div>
    <b>{{ avgRating.toFixed(1) }}</b>
  </div>
</div>
    </div>

    <!-- CTA -->
    <div class="review-top-actions">
      <div class="tip-pill">
        💡 Mẹo của người trong cuộc: Đi nhóm đông để thử được nhiều món hơn
      </div>

      <router-link to="/review" class="write-review-btn">
        ✍️ Viết đánh giá
      </router-link>
    </div>

    <!-- REVIEW LIST -->
    <div class="review-list">
      <div class="review-item" v-for="item in visibleReviews" :key="item.id">
        <div class="review-user">
          <img :src="getAvatar(item)" alt="avatar" class="review-avatar" />

          <div class="review-user-info">
            <h5>{{ item.name }}</h5>
            <p>1 đóng góp</p>
          </div>
        </div>

       <div class="review-stars-line">
  <span 
    v-for="i in 5" 
    :key="i" 
    class="star"
    :class="{ active: i <= item.rating }"
  >
    ★
  </span>
</div>

        <div class="review-meta">
          {{ formatDate(item.createdAt) }} • {{ getVisitType(item) }}
        </div>

        <p class="review-content">
          {{ item.content }}
        </p>

        <div class="review-tip" v-if="item.tip">
          <span>💡 Mẹo của người trong cuộc:</span>
          {{ item.tip }}
        </div>

        <div class="review-tags">
          <div class="tag-score">
            <span>Giá trị</span>
            <div class="tag-dots">
              <span 
  v-for="i in 5" 
  :key="'value' + i" 
  class="star small"
  :class="{ active: i <= item.rating }"
>
  ★
</span>
            </div>
          </div>

          <div class="tag-score">
            <span>Dịch vụ</span>
            <div class="tag-dots">
             <span 
  v-for="i in 5" 
  :key="'value' + i" 
  class="star small"
  :class="{ active: i <= item.rating }"
>
  ★
</span>
            </div>
          </div>

          <div class="tag-score">
            <span>Đồ ăn</span>
            <div class="tag-dots">
             <span 
  v-for="i in 5" 
  :key="'value' + i" 
  class="star small"
  :class="{ active: i <= item.rating }"
>
  ★
</span>
            </div>
          </div>

          <div class="tag-score">
            <span>Không gian</span>
            <div class="tag-dots">
             <span 
  v-for="i in 5" 
  :key="'value' + i" 
  class="star small"
  :class="{ active: i <= item.rating }"
>
  ★
</span>
            </div>
          </div>
        </div>
      </div>
    </div>
     <div class="text-center mt-4" v-if="reviews.length > 3">
  <button class="btn-show-more" @click="loadMore">
    {{ visibleCount >= reviews.length ? 'Thu gọn' : 'Xem thêm đánh giá' }}
  </button>
</div>

    <div class="review-footer-action text-center">
      <p>Hôm nay bạn thấy món nào ngon nhất? Cùng chia sẻ trải nghiệm nhé!</p>
      <router-link to="/review" class="review-btn">
        VIẾT ĐÁNH GIÁ CỦA BẠN
      </router-link>
    </div>
  </div>
</section>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap');

.home {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #5a1515;
  font-family: 'Manrope', sans-serif;
}

.home::before {
  content: '';
  position: absolute;
  inset: -8%;
  background-image: url('https://lh3.googleusercontent.com/gg-dl/AOI_d_97GQT3cq5d1SzFbhiWQy8LLR-Q6gVvwLj1HDYDw4E7VPlYKbTNuP-cDdoR-IdOtGOy4ADjYskoaqbUQeWGuO6WCPlRzVs3urxT-uDdpRO030SMfAwSkFQJKcdygLsfxN0qVE0OlI6keT44oKioO0ZhNufY__mMi_7i3yEGLuIQ-utk=s1024-rj');
  background-size: cover;
  background-position: center;
  filter: blur(8px) saturate(0.9);
  opacity: 0.26;
  transform: scale(1.05);
  z-index: 0;
}

.home::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(90, 21, 21, 0.78) 0%, rgba(154, 59, 59, 0.7) 45%, rgba(116, 33, 33, 0.8) 100%);
  z-index: 0;
}

.home > * {
  position: relative;
  z-index: 1;
}

.hero {
  height: 560px;
  background: url('https://images.unsplash.com/photo-1559847844-5315695dadae') center/cover no-repeat;
  position: relative;
}

.overlay {
  background: rgba(0, 0, 0, 0.55);
  height: 100%;
  display: flex;
  align-items: center;
}

.hero-content {
  width: min(920px, 90%);
  margin: 0 auto;
}

.rating {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.35);
  padding: 10px 16px;
  border-radius: 999px;
  margin-bottom: 16px;
}

.title {
  font-family: 'Playfair Display', serif;
  font-size: 42px;
  font-weight: 700;
  letter-spacing: 1px;
}

.sub {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
}

.intro {
  background: url('https://images.unsplash.com/photo-1552566626-52f8b828add9') center/cover no-repeat;
}

.intro-overlay {
  background: rgba(0, 0, 0, 0.6);
  padding: 90px 0;
}

.menu-section,
.promo-section,
.review-section {
  padding: 80px 0;
}

.menu-card {
  border-radius: 24px;
  overflow: hidden;
  transition: 0.3s;
  background: #fff9f3;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
}

.menu-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.2);
}

.product-img {
  height: 200px;
  object-fit: cover;
}

.price {
  color: #b1120a;
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 10px;
}

.promo-card {
  background: #fff6ea;
  padding: 40px;
  border-radius: 22px;
  text-align: center;
  transition: 0.3s;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}

.promo-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);
}

.badge-sale {
  background: #d00000;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  display: inline-block;
  margin-bottom: 10px;
}

.review-title {
  color: white;
  font-weight: bold;
}

.star {
  font-size: 50px;
  color: #ffc107;
}

.score {
  color: white;
  font-size: 22px;
  font-weight: bold;
}

.review-card {
  background: #fff7f0;
  padding: 35px;
  border-radius: 22px;
  transition: 0.3s;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.14);
}

.review-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.18);
}

.avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
  border: 4px solid white;
}

.review-btn {
  background: #f1e7d0;
  color: #a80000;
  border: none;
  padding: 10px 25px;
  border-radius: 25px;
  font-weight: 600;
  margin-top: 10px;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.review-btn:hover {
  background: white;
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
}

.review-section {
  padding: 90px 0;
  background: linear-gradient(180deg, rgba(255, 248, 243, 0.06), rgba(255, 255, 255, 0.03));
}

.review-header {
  margin-bottom: 40px;
}

.review-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255, 244, 230, 0.14);
  color: #ffe4c2;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 14px;
  margin-bottom: 14px;
}

.review-main-title {
  color: #fff;
  font-family: 'Playfair Display', serif;
  font-size: 38px;
  font-weight: 700;
  margin-bottom: 10px;
}

.review-subtitle {
  color: rgba(255, 255, 255, 0.82);
  font-size: 16px;
}

/* SUMMARY */
.review-summary-box {
  display: grid;
  grid-template-columns: 260px 1fr 1fr;
  gap: 28px;
  background: #fdf8f3;
  border-radius: 28px;
  padding: 36px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  margin-bottom: 28px;
}

.summary-left {
  text-align: center;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  padding-right: 20px;
}

.summary-score {
  font-size: 68px;
  font-weight: 800;
  color: #153b28;
  line-height: 1;
}

.summary-label {
  font-size: 28px;
  font-weight: 700;
  color: #153b28;
  margin-top: 6px;
}

.summary-stars {
  margin: 18px 0 8px;
  color: #ffc107;
  font-size: 24px;
  letter-spacing: 4px;
  text-shadow: 0 2px 6px rgba(255, 193, 7, 0.5);
}
.summary-total {
  color: #555;
  font-size: 15px;
}

.summary-middle {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}

.rating-row {
  display: grid;
  grid-template-columns: 56px 1fr 50px;
  align-items: center;
  gap: 12px;
}

.rating-text {
  font-weight: 600;
  color: #333;
}

.rating-bar {
  height: 12px;
  border-radius: 999px;
  background: #e6e6e6;
  overflow: hidden;
}

.rating-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffb300);
}

.rating-count {
  font-weight: 700;
  color: #333;
  text-align: right;
}

.summary-right {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 28px;
  align-content: center;
}

.category-score {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-score span {
  font-weight: 700;
  color: #183c2b;
}

.mini-bar {
  height: 14px;
  border-radius: 999px;
  background: #ececec;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffb300);
}
.category-score b {
  color: #183c2b;
  font-size: 16px;
}

/* TOP ACTION */
.review-top-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.tip-pill {
  background: rgba(255, 248, 238, 0.95);
  color: #3b2c1e;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 14px 18px;
  border-radius: 999px;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.write-review-btn {
  background: #153b28;
  color: #fff;
  text-decoration: none;
  padding: 14px 24px;
  border-radius: 999px;
  font-weight: 700;
  transition: 0.25s;
}

.write-review-btn:hover {
  transform: translateY(-2px);
  background: #0f2d1f;
  color: white;
}

/* REVIEW LIST */
.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  background: #fffdf9;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.12);
  transition: 0.3s;
}

.review-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.16);
   border: 1px solid rgba(255, 193, 7, 0.3); 
}

.review-user {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.review-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f1e5d6;
}

.review-user-info h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #153b28;
}

.review-user-info p {
  margin: 2px 0 0;
  color: #666;
  font-size: 14px;
}

.review-stars-line {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.star {
  font-size: 16px;
  color: #dcdcdc;
  transition: 0.2s;
}

.star.active {
  color: #ffc107;
  text-shadow: 0 2px 6px rgba(255, 193, 7, 0.6);
}
.review-meta {
  color: #4e4e4e;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
}

.review-content {
  font-size: 15px;
  line-height: 1.6;
  color: #2b2b2b;
  margin-bottom: 20px;
}

.review-tip {
  background: #f7f4ef;
  border: 1px solid #d8d2c8;
  border-radius: 16px;
  padding: 16px 18px;
  color: #333;
  font-size: 15px;
  margin-bottom: 24px;
}

.review-tip span {
  font-weight: 800;
  color: #153b28;
  margin-right: 8px;
}

.review-tags {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-top: 12px;
}

.tag-score span {
  font-size: 13px;
}

.tag-dots i,
.star.small {
  font-size: 13px;
}

.tag-dots {
  display: flex;
  gap: 6px;
}

.tag-dots i {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #d9d9d9;
  display: inline-block;
}

.tag-dots i.active {
  background: linear-gradient(135deg, #ffd700, #ffb300);
}

/* FOOTER */
.review-footer-action {
  margin-top: 40px;
}

.review-footer-action p {
  color: #fff;
  font-size: 17px;
  margin-bottom: 14px;
}

.review-btn {
  display: inline-block;
  background: #f1e7d0;
  color: #8b1111;
  text-decoration: none;
  padding: 12px 28px;
  border-radius: 999px;
  font-weight: 700;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.review-btn:hover {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(0, 0, 0, 0.16);
  color: #8b1111;
}

/* RESPONSIVE */
@media (max-width: 992px) {
  .review-summary-box {
    grid-template-columns: 1fr;
  }

  .summary-left {
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    padding-right: 0;
    padding-bottom: 24px;
  }

  .summary-right {
    grid-template-columns: 1fr;
  }

  .review-tags {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .review-main-title {
    font-size: 28px;
  }

  .summary-score {
    font-size: 54px;
  }


  .review-content {
    font-size: 16px;
  }

  .review-tags {
    grid-template-columns: 1fr;
  }

  .tip-pill {
    border-radius: 18px;
  }
}
.btn-show-more {
  background: linear-gradient(135deg, #f7c782, #f2b565);
  border: none;
  padding: 10px 22px;
  border-radius: 999px;
  font-weight: 700;
  color: #3a1f12;
  cursor: pointer;
  transition: 0.2s;
}

.btn-show-more:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}
.review-item {
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}
</style>
