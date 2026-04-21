<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getReviews } from '@/services/reviewApi'
import StarRating from '@/components/StarRating.vue'

interface Review {
  id: number
  name: string
  rating: number
  content: string
  visitType?: string
  tip?: string
  serviceScore?: number
  foodScore?: number
  valueScore?: number
  atmosphereScore?: number
  avatarUrl?: string
  createdAt?: string
  status?: string
  statusLabel?: string
}

const reviews = ref<Review[]>([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const res = await getReviews()
    reviews.value = res.data.sort(
      (a: Review, b: Review) =>
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    )
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const averageRating = computed(() => {
  if (!reviews.value.length) return 0
  const total = reviews.value.reduce((sum, r) => sum + r.rating, 0)
  return (total / reviews.value.length).toFixed(1)
})

const getAvatar = (review: Review) => {
  if (review.avatar) return review.avatar
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=8B1E1E&color=fff`
}

const formatDate = (date?: string) => {
  if (!date) return 'Gần đây'
  return new Date(date).toLocaleDateString('vi-VN')
}

const getScore = (score?: number) => score || 5

onMounted(load)
</script>

<template>
  <section class="all-reviews-page">
    <div class="container">
      <!-- HEADER -->
      <div class="review-header text-center">
        <p class="review-badge">Tất cả đánh giá</p>
        <h1 class="review-title">ĐÁNH GIÁ TỪ KHÁCH HÀNG</h1>
        <p class="review-subtitle">
          {{ reviews.length }} đánh giá từ thực khách đã trải nghiệm tại ByHat
        </p>
      </div>

      <!-- SUMMARY -->
      <div class="review-summary">
        <div class="summary-left">
          <div class="big-score">{{ averageRating }}</div>
          <p class="summary-label">Đánh giá trung bình</p>
          <div class="summary-stars">★★★★★</div>
          <span>{{ reviews.length }} đánh giá</span>
        </div>

        <div class="summary-right">
          <h4>Cảm ơn bạn đã tin tưởng ByHat</h4>
          <p>Mỗi đánh giá của bạn giúp chúng tôi phục vụ tốt hơn mỗi ngày.</p>
          <router-link to="/review" class="write-btn">Viết đánh giá</router-link>
        </div>
      </div>

      <!-- LIST -->
      <div class="review-list-section">
        <h3 class="list-title">Tất cả đánh giá ({{ reviews.length }})</h3>

        <div v-if="loading" class="text-center py-5 text-white">Đang tải đánh giá...</div>

        <div v-else-if="reviews.length === 0" class="empty-box">
          Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm nhé!
        </div>

        <div v-else class="review-list">
          <div class="review-item" v-for="r in reviews" :key="r.id">
            <div class="review-top">
              <div class="review-user">
                <img :src="getAvatar(r)" class="avatar" alt="avatar" />
                <div>
                  <h5>{{ r.name }}</h5>
                  <p>{{ formatDate(r.createdAt) }} • {{ r.visitType || 'Khách hàng' }}</p>
                </div>
              </div>

              <div class="main-stars">
                <StarRating :rating="r.rating" />
              </div>
            </div>

            <p class="review-text">{{ r.content }}</p>

            <div v-if="r.tip" class="tip-box">
              <span>Mẹo của người trong cuộc:</span>
              {{ r.tip }}
            </div>

            <div class="score-grid">
              <div class="score-item">
                <span>Dịch vụ</span>
                <StarRating :rating="getScore(r.serviceScore)" />
              </div>
              <div class="score-item">
                <span>Đồ ăn</span>
                <StarRating :rating="getScore(r.foodScore)" />
              </div>
              <div class="score-item">
                <span>Giá trị</span>
                <StarRating :rating="getScore(r.valueScore)" />
              </div>
              <div class="score-item">
                <span>Không gian</span>
                <StarRating :rating="getScore(r.atmosphereScore)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="back-action text-center">
        <router-link to="/" class="back-btn">Quay lại trang chủ</router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
.all-reviews-page {
  min-height: 100vh;
  padding: 0;
  padding-top: 100px;
  background: linear-gradient(180deg, #5a1515 0%, #7b2323 50%, #5a1515 100%);
  font-family: 'Manrope', sans-serif;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.review-header {
  padding-top: 0;
  margin-bottom: 28px;
}

.review-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255, 244, 230, 0.14);
  color: #ffe4c2;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 14px;
  margin-bottom: 16px;
}

.review-title {
  color: white;
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 12px;
  line-height: 1.2;
}

.review-subtitle {
  color: rgba(255, 255, 255, 0.82);
  font-size: 17px;
}

.review-summary {
  background: #fff8f2;
  border-radius: 16px;
  padding: 24px;
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
  align-items: center;
  margin-bottom: 28px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.summary-left {
  text-align: center;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  padding-right: 24px;
}

.big-score {
  font-size: 64px;
  font-weight: 800;
  color: #153b28;
  line-height: 1;
}

.summary-label {
  font-size: 16px;
  font-weight: 700;
  color: #153b28;
  margin-top: 8px;
}

.summary-stars {
  color: #ffc107;
  font-size: 24px;
  letter-spacing: 3px;
  margin: 10px 0;
  text-shadow: 0 2px 4px rgba(255, 193, 7, 0.4);
}

.summary-right h4 {
  font-size: 24px;
  font-weight: 800;
  color: #7b1111;
  margin-bottom: 8px;
}

.summary-right p {
  color: #444;
  font-size: 15px;
  margin: 0 0 16px 0;
}

.write-btn {
  display: inline-block;
  background: linear-gradient(135deg, #8b1111, #c52828);
  color: white;
  text-decoration: none;
  padding: 10px 24px;
  border-radius: 999px;
  font-weight: 700;
  transition: 0.2s;
}

.write-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(139, 17, 17, 0.25);
  color: white;
}

.review-list-section {
  margin-top: 24px;
  margin-bottom: 40px;
}

.list-title {
  color: white;
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 20px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-item {
  background: #fffdf9;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: 0.2s;
}

.review-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.review-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.review-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f1e5d6;
}

.review-user h5 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #153b28;
}

.review-user p {
  margin: 3px 0 0;
  color: #666;
  font-size: 13px;
}

.review-text {
  font-size: 15px;
  line-height: 1.7;
  color: #2b2b2b;
  margin-bottom: 14px;
}

.tip-box {
  background: #f7f4ef;
  border: 1px solid #d8d2c8;
  border-radius: 12px;
  padding: 12px 14px;
  color: #333;
  font-size: 14px;
  margin-bottom: 16px;
}

.tip-box span {
  font-weight: 700;
  color: #153b28;
  margin-right: 6px;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 10px;
}

.score-item {
  background: #fff7f0;
  border-radius: 12px;
  padding: 10px 12px;
}

.score-item span {
  display: block;
  font-weight: 600;
  color: #153b28;
  margin-bottom: 6px;
  font-size: 13px;
}

.empty-box {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  font-size: 15px;
}

.back-action {
  margin-top: 40px;
  padding-bottom: 40px;
}

.back-btn {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  text-decoration: none;
  padding: 12px 28px;
  border-radius: 999px;
  font-weight: 700;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  color: white;
}

/* responsive */
@media (max-width: 992px) {
  .review-summary {
    grid-template-columns: 1fr;
  }

  .summary-left {
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    padding-right: 0;
    padding-bottom: 16px;
  }

  .score-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .review-title {
    font-size: 28px;
  }

  .big-score {
    font-size: 48px;
  }

  .review-item {
    padding: 18px;
  }

  .list-title {
    font-size: 22px;
  }
}

@media (max-width: 576px) {
  .review-title {
    font-size: 24px;
  }

  .big-score {
    font-size: 42px;
  }

  .score-grid {
    grid-template-columns: 1fr;
  }

  .avatar {
    width: 44px;
    height: 44px;
  }

  .review-user h5 {
    font-size: 16px;
  }
}
</style>
