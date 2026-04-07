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
  rating: 5,
  content: '',
  visitType: 'Bạn bè',
  tip: '',
  serviceScore: 5,
  foodScore: 5,
  valueScore: 5,
  atmosphereScore: 5
})

// Lấy tên từ localStorage
const getUserName = () => {
  return localStorage.getItem('fullName') || localStorage.getItem('username') || ''
}
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
  const userName = getUserName()
  if (!userName) {
    alert('Vui lòng đăng nhập để đánh giá')
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
    const userName = getUserName()
    const payload = {
      ...form.value,
      name: userName // Lấy tên từ tài khoản
    }
    
    await createReview(payload)

    alert('Gửi thành công! Chờ admin duyệt')

    form.value = {
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
            <label class="form-label">Tên hiển thị</label>
            <input
              :value="getUserName() || 'Chưa đăng nhập'"
              class="custom-input"
              disabled
            />
            <small v-if="!getUserName()" class="text-danger" style="font-size: 12px; margin-top: 4px; display: block;">Vui lòng đăng nhập để đánh giá</small>
          </div>

          <div class="col-md-6">
            <label class="form-label">Bạn đi cùng ai?</label>
            <select v-model="form.visitType" class="custom-input">
              <option>Bạn bè</option>
              <option>Cặp đôi</option>
              <option>Gia đình</option>
              <option>Một mình</option>
              <option>Đồng nghiệp</option>
            </select>
          </div>

          <div class="col-12">
            <label class="form-label">Đánh giá chi tiết (Đánh giá chung sẽ tự động tính)</label>
            <div class="row g-3">
              <div class="col-6 col-md-3">
                <label class="form-label" style="font-size: 13px; font-weight: 500;">Dịch vụ</label>
                <select v-model="form.serviceScore" class="custom-input">
                  <option v-for="i in 5" :key="'s'+i" :value="i">{{ i }} ⭐</option>
                </select>
              </div>

              <div class="col-6 col-md-3">
                <label class="form-label" style="font-size: 13px; font-weight: 500;">Đồ ăn</label>
                <select v-model="form.foodScore" class="custom-input">
                  <option v-for="i in 5" :key="'f'+i" :value="i">{{ i }} ⭐</option>
                </select>
              </div>

              <div class="col-6 col-md-3">
                <label class="form-label" style="font-size: 13px; font-weight: 500;">Giá trị</label>
                <select v-model="form.valueScore" class="custom-input">
                  <option v-for="i in 5" :key="'v'+i" :value="i">{{ i }} ⭐</option>
                </select>
              </div>

              <div class="col-6 col-md-3">
                <label class="form-label" style="font-size: 13px; font-weight: 500;">Không gian</label>
                <select v-model="form.atmosphereScore" class="custom-input">
                  <option v-for="i in 5" :key="'a'+i" :value="i">{{ i }} ⭐</option>
                </select>
              </div>
            </div>
          </div>

          <div class="col-12">
            <div style="background: #f7f4ef; padding: 12px 16px; border-radius: 10px; border: 1.5px solid #e4d6c7;">
              <label class="form-label" style="margin-bottom: 4px;">Đánh giá chung</label>
              <div style="font-size: 28px; font-weight: 700; color: #8b1111;">
                {{ calculatedRating }} ⭐
              </div>
              <small style="color: #666; font-size: 12px;">Tự động tính từ 4 tiêu chí trên</small>
            </div>
          </div>

          <div class="col-12">
            <label class="form-label">Cảm nhận của bạn</label>
            <textarea
              v-model="form.content"
              class="custom-input"
              rows="4"
              placeholder="Chia sẻ trải nghiệm của bạn tại ByHat... (tối thiểu 10 ký tự)"
            />
          </div>

          <div class="col-12">
            <label class="form-label">Mẹo cho khách khác <span style="color: #999; font-weight: 400;">(không bắt buộc)</span></label>
            <input
              v-model="form.tip"
              class="custom-input"
              placeholder="Ví dụ: Nên đặt bàn trước vào cuối tuần"
            />
          </div>
        </div>

        <div class="form-submit">
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
  padding: 0;
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
  margin: 0;
}

.review-form-card {
  background: #fffdf9;
  padding: 20px;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 32px;
}

.form-title {
  font-size: 20px;
  font-weight: 800;
  color: #7b1111;
  margin-bottom: 18px;
}

.form-label {
  font-weight: 600;
  color: #4b2b2b;
  margin-bottom: 8px;
  font-size: 14px;
  display: block;
}

.custom-input {
  border-radius: 10px;
  border: 2px solid #e4d6c7;
  padding: 12px 16px;
  min-height: auto;
  box-shadow: none !important;
  font-size: 15px;
  width: 100%;
  transition: all 0.2s;
}

.custom-input:focus {
  border-color: #8b1e1e;
  box-shadow: 0 0 0 3px rgba(139, 30, 30, 0.1) !important;
  outline: none;
}

.custom-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-submit {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0e8dc;
}

.submit-btn {
  background: linear-gradient(135deg, #8b1111, #c52828);
  color: white;
  border: none;
  padding: 14px 48px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 16px;
  transition: all 0.3s;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(139, 17, 17, 0.2);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 17, 17, 0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.review-list-section {
  margin-top: 24px;
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
  .review-page {
    padding: 0;
  }

  .review-header {
    padding-top: 30px;
  }

  .review-title {
    font-size: 28px;
  }

  .big-score {
    font-size: 48px;
  }

  .review-form-card,
  .review-item {
    padding: 24px;
  }

  .form-title {
    font-size: 20px;
  }

  .list-title {
    font-size: 22px;
  }
}

@media (max-width: 576px) {
  .review-header {
    padding-top: 20px;
  }

  .review-title {
    font-size: 24px;
  }

  .big-score {
    font-size: 42px;
  }

  .review-form-card,
  .review-item {
    padding: 20px;
  }

  .score-grid {
    grid-template-columns: 1fr;
  }

  .form-submit {
    text-align: center;
  }

  .submit-btn {
    width: 100%;
    padding: 14px 24px;
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