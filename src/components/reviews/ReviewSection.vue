<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getReviews, createReview } from '@/services/reviewApi'
import StarRating from '@/components/StarRating.vue'
import { watch } from 'vue'



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
const submitting = ref(false)

const form = ref({
  name: '',
  rating: 5,
  content: '',
  visitType: 'Bạn bè',
  tip: '',
  serviceScore: 5,
  foodScore: 5,
  valueScore: 5,
  atmosphereScore: 5
})
const calculatedRating = computed(() => {
  const { serviceScore, foodScore, valueScore, atmosphereScore } = form.value

  const avg =
    (serviceScore + foodScore + valueScore + atmosphereScore) / 4

  return Math.round(avg) // hoặc giữ .toFixed(1) nếu muốn lẻ
})
watch(calculatedRating, (val) => {
  form.value.rating = val
})
// load reviews
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

// validate
const validate = () => {
  if (!form.value.name.trim()) {
    alert('Vui lòng nhập tên')
    return false
  }
  if (!form.value.content.trim()) {
    alert('Vui lòng nhập nội dung đánh giá')
    return false
  }
  if (form.value.content.trim().length < 10) {
    alert('Nội dung đánh giá phải từ 10 ký tự trở lên')
    return false
  }
  return true
}

// submit review
const submit = async () => {
  if (!validate()) return

  submitting.value = true
  try {
    await createReview(form.value)

    alert('Gửi thành công! Chờ admin duyệt')

    form.value = {
      name: '',
      rating: 5,
      content: '',
      visitType: 'Bạn bè',
      tip: '',
      serviceScore: 5,
      foodScore: 5,
      valueScore: 5,
      atmosphereScore: 5
    }

    await load()
  } catch (e: any) {
    alert(e.response?.data || 'Có lỗi xảy ra')
  } finally {
    submitting.value = false
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
  <section class="review-page">
    <div class="container">
      <!-- HEADER -->
      <div class="review-header text-center">
        <p class="review-badge">Khách hàng nói gì về ByHat</p>
        <h1 class="review-title">ĐÁNH GIÁ & CHIA SẺ TRẢI NGHIỆM</h1>
        <p class="review-subtitle">
          Cảm nhận thật từ những thực khách đã trải nghiệm tại ByHat
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
          <h4>Hãy để lại đánh giá của bạn</h4>
          <p>Ý kiến của bạn sẽ giúp ByHat phục vụ tốt hơn mỗi ngày.</p>
        </div>
      </div>

      <!-- FORM -->
      <div class="review-form-card">
        <h3 class="form-title">Viết đánh giá của bạn</h3>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Tên của bạn</label>
            <input
              v-model="form.name"
              class="form-control custom-input"
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </div>

          <div class="col-md-6">
            <label class="form-label">Bạn đi cùng ai?</label>
            <select v-model="form.visitType" class="form-control custom-input">
              <option>Bạn bè</option>
              <option>Cặp đôi</option>
              <option>Gia đình</option>
              <option>Một mình</option>
              <option>Đồng nghiệp</option>
            </select>
          </div>

          <div class="col-12">
            <label class="form-label">Đánh giá chung</label>
           <select v-model="form.rating" class="form-control custom-input" disabled>
  <option v-for="i in 5" :key="i" :value="i">
    {{ i }} ⭐
  </option>
</select>
          </div>

          <!-- CHI TIẾT -->
          <div class="col-md-6">
            <label class="form-label">Dịch vụ</label>
            <select v-model="form.serviceScore" class="form-control custom-input">
              <option v-for="i in 5" :key="'s'+i" :value="i">{{ i }} ⭐</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Đồ ăn</label>
            <select v-model="form.foodScore" class="form-control custom-input">
              <option v-for="i in 5" :key="'f'+i" :value="i">{{ i }} ⭐</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Giá trị</label>
            <select v-model="form.valueScore" class="form-control custom-input">
              <option v-for="i in 5" :key="'v'+i" :value="i">{{ i }} ⭐</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">Không gian</label>
            <select v-model="form.atmosphereScore" class="form-control custom-input">
              <option v-for="i in 5" :key="'a'+i" :value="i">{{ i }} ⭐</option>
            </select>
          </div>

          <div class="col-12">
            <label class="form-label">Cảm nhận của bạn</label>
            <textarea
              v-model="form.content"
              class="form-control custom-input"
              rows="5"
              placeholder="Ví dụ: Nhân viên rất nhiệt tình, món ăn ngon, không gian ấm cúng..."
            />
          </div>

          <div class="col-12">
            <label class="form-label">Mẹo cho khách khác (không bắt buộc)</label>
            <input
              v-model="form.tip"
              class="form-control custom-input"
              placeholder="Ví dụ: Nên đặt bàn trước vào cuối tuần"
            />
          </div>
        </div>

        <div class="form-submit mt-4">
          <button class="submit-btn" @click="submit" :disabled="submitting">
            {{ submitting ? 'Đang gửi...' : 'Gửi đánh giá' }}
          </button>
        </div>
      </div>

      <!-- LIST -->
      <div class="review-list-section">
        <h3 class="list-title">Đánh giá gần đây</h3>

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
              <span>💡 Mẹo của người trong cuộc:</span>
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
    </div>
  </section>
</template>
<style scoped>
.review-page {
  min-height: 100vh;
  padding: 80px 0;
  background: linear-gradient(180deg, #5a1515 0%, #7b2323 50%, #5a1515 100%);
  font-family: 'Manrope', sans-serif;
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

.review-title {
  color: white;
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 10px;
}

.review-subtitle {
  color: rgba(255, 255, 255, 0.82);
  font-size: 16px;
}

.review-summary {
  background: #fff8f2;
  border-radius: 28px;
  padding: 32px;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 28px;
  align-items: center;
  margin-bottom: 36px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.16);
}

.summary-left {
  text-align: center;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  padding-right: 24px;
}

.big-score {
  font-size: 68px;
  font-weight: 800;
  color: #153b28;
  line-height: 1;
}

.summary-label {
  font-size: 18px;
  font-weight: 700;
  color: #153b28;
  margin-top: 10px;
}
.summary-stars {
  color: #ffc107; /* vàng chuẩn giống toàn site */
  font-size: 28px;
  letter-spacing: 4px;
  margin: 12px 0;
  text-shadow: 0 2px 6px rgba(255, 193, 7, 0.6); /* thêm glow cho đẹp */
}

.summary-right h4 {
  font-size: 28px;
  font-weight: 800;
  color: #7b1111;
  margin-bottom: 10px;
}

.summary-right p {
  color: #444;
  font-size: 16px;
  margin: 0;
}

.review-form-card {
  background: #fffdf9;
  padding: 36px;
  border-radius: 28px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.14);
  margin-bottom: 48px;
}

.form-title {
  font-size: 30px;
  font-weight: 800;
  color: #7b1111;
  margin-bottom: 24px;
}

.form-label {
  font-weight: 700;
  color: #4b2b2b;
  margin-bottom: 8px;
}

.custom-input {
  border-radius: 16px;
  border: 1px solid #e4d6c7;
  padding: 14px 16px;
  min-height: 52px;
  box-shadow: none !important;
}

.custom-input:focus {
  border-color: #8b1e1e;
  box-shadow: 0 0 0 0.2rem rgba(139, 30, 30, 0.12) !important;
}

.form-submit {
  text-align: right;
}

.submit-btn {
  background: linear-gradient(135deg, #8b1111, #c52828);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 16px;
  transition: 0.25s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(139, 17, 17, 0.25);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.review-list-section {
  margin-top: 30px;
}

.list-title {
  color: white;
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 24px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.review-item {
  background: #fffdf9;
  border-radius: 26px;
  padding: 30px;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.12);
  transition: 0.25s;
}

.review-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.16);
}

.review-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.review-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f1e5d6;
}

.review-user h5 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #153b28;
}

.review-user p {
  margin: 4px 0 0;
  color: #666;
  font-size: 14px;
}

.review-text {
  font-size: 17px;
  line-height: 1.8;
  color: #2b2b2b;
  margin-bottom: 18px;
}

.tip-box {
  background: #f7f4ef;
  border: 1px solid #d8d2c8;
  border-radius: 16px;
  padding: 14px 18px;
  color: #333;
  font-size: 15px;
  margin-bottom: 20px;
}

.tip-box span {
  font-weight: 800;
  color: #153b28;
  margin-right: 8px;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-top: 12px;
}

.score-item {
  background: #fff7f0;
  border-radius: 16px;
  padding: 14px 16px;
}

.score-item span {
  display: block;
  font-weight: 700;
  color: #153b28;
  margin-bottom: 8px;
}

.empty-box {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  padding: 28px;
  border-radius: 20px;
  text-align: center;
  font-size: 16px;
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
    padding-bottom: 20px;
  }

  .score-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .review-title {
    font-size: 30px;
  }

  .big-score {
    font-size: 54px;
  }

  .review-form-card,
  .review-item {
    padding: 22px;
  }

  .score-grid {
    grid-template-columns: 1fr;
  }

  .form-submit {
    text-align: center;
  }

  .submit-btn {
    width: 100%;
  }
}
</style>