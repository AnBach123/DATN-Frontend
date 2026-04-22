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

const getUserName = () => {
  return localStorage.getItem('fullName') || localStorage.getItem('username') || ''
}
const calculatedRating = computed(() => {
  const { serviceScore, foodScore, valueScore, atmosphereScore } = form.value
  const avg = (serviceScore + foodScore + valueScore + atmosphereScore) / 4
  return Math.round(avg)
})
watch(calculatedRating, (val) => { form.value.rating = val })

const load = async () => {
  loading.value = true
  try {
    const res = await getReviews()
    reviews.value = res.data.sort(
      (a: Review, b: Review) =>
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    )
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const validate = () => {
  const userName = getUserName()
  if (!userName) { alert('Vui lòng đăng nhập để đánh giá'); return false }
  if (!form.value.content.trim()) { alert('Vui lòng nhập nội dung đánh giá'); return false }
  if (form.value.content.trim().length < 10) { alert('Nội dung đánh giá phải từ 10 ký tự trở lên'); return false }
  return true
}

const submit = async () => {
  if (!validate()) return
  submitting.value = true
  try {
    await createReview({ ...form.value, name: getUserName() })
    alert('Gửi thành công! Chờ admin duyệt')
    form.value = { rating: 5, content: '', visitType: 'Bạn bè', tip: '', serviceScore: 5, foodScore: 5, valueScore: 5, atmosphereScore: 5 }
    await load()
  } catch (e: any) { alert(e.response?.data || 'Có lỗi xảy ra') } finally { submitting.value = false }
}

const averageRating = computed(() => {
  if (!reviews.value.length) return 0
  return (reviews.value.reduce((sum, r) => sum + r.rating, 0) / reviews.value.length).toFixed(1)
})

const getAvatar = (review: Review) => {
  if (review.avatar) return review.avatar
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=8B1E1E&color=fff`
}
const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('vi-VN') : 'Gần đây'
const getScore = (score?: number) => score || 5

onMounted(load)
</script>

<template>
  <section class="review-page">
    <div class="rv-container">
      <!-- HEADER -->
      <div class="rv-header">
        <h1>ĐÁNH GIÁ VÀ CHIA SẺ TRẢI NGHIỆM</h1>
        <p>Cảm nhận thật từ những thực khách đã trải nghiệm tại ByHat</p>
      </div>

      <div class="rv-layout">
        <!-- CỘT TRÁI: SUMMARY + FORM -->
        <div class="rv-left-col">
          <!-- SUMMARY -->
          <div class="rv-summary">
            <div class="rv-score-box">
              <div class="rv-big">{{ averageRating }}</div>
              <div class="rv-stars">★★★★★</div>
              <span>{{ reviews.length }} đánh giá</span>
            </div>
            <div class="rv-summary-text">
              <h4>Hãy để lại đánh giá của bạn</h4>
              <p>Ý kiến của bạn sẽ giúp ByHat phục vụ tốt hơn mỗi ngày</p>
            </div>
          </div>

          <!-- FORM -->
          <div class="rv-form">
            <h3>Viết đánh giá</h3>

            <div class="rv-form-grid">
              <div class="rv-field">
                <label>Tên hiển thị</label>
                <input :value="getUserName() || 'Chưa đăng nhập'" class="rv-input" disabled />
              </div>
              <div class="rv-field">
                <label>Bạn đi cùng ai?</label>
                <select v-model="form.visitType" class="rv-input">
                  <option>Bạn bè</option><option>Cặp đôi</option><option>Gia đình</option><option>Một mình</option><option>Đồng nghiệp</option>
                </select>
              </div>
            </div>

            <label class="rv-label">Đánh giá chi tiết</label>
            <div class="rv-scores-grid">
              <div class="rv-score-field">
                <span>Dịch vụ</span>
                <select v-model="form.serviceScore" class="rv-input sm"><option v-for="i in 5" :key="'s'+i" :value="i">{{ i }} ★</option></select>
              </div>
              <div class="rv-score-field">
                <span>Đồ ăn</span>
                <select v-model="form.foodScore" class="rv-input sm"><option v-for="i in 5" :key="'f'+i" :value="i">{{ i }} ★</option></select>
              </div>
              <div class="rv-score-field">
                <span>Giá trị</span>
                <select v-model="form.valueScore" class="rv-input sm"><option v-for="i in 5" :key="'v'+i" :value="i">{{ i }} ★</option></select>
              </div>
              <div class="rv-score-field">
                <span>Không gian</span>
                <select v-model="form.atmosphereScore" class="rv-input sm"><option v-for="i in 5" :key="'a'+i" :value="i">{{ i }} ★</option></select>
              </div>
            </div>

            <div class="rv-calc">
              <span>Đánh giá chung:</span>
              <strong>{{ calculatedRating }} ★</strong>
            </div>

            <div class="rv-field full">
              <label>Cảm nhận của bạn</label>
              <textarea v-model="form.content" class="rv-input" rows="3" placeholder="Chia sẻ trải nghiệm tại ByHat... (tối thiểu 10 ký tự)"></textarea>
            </div>

            <div class="rv-field full">
              <label>Mẹo cho khách khác <small>(không bắt buộc)</small></label>
              <input v-model="form.tip" class="rv-input" placeholder="VD: Nên đặt bàn trước vào cuối tuần" />
            </div>

            <div class="rv-submit">
              <button class="rv-submit-btn" @click="submit" :disabled="submitting">
                {{ submitting ? 'Đang gửi...' : 'Gửi đánh giá' }}
              </button>
            </div>
          </div>
        </div>

        <!-- CỘT PHẢI: DANH SÁCH ĐÁNH GIÁ -->
        <div class="rv-right-col">
          <h3>Đánh giá gần đây</h3>

          <div v-if="loading" class="rv-loading">Đang tải...</div>
          <div v-else-if="reviews.length === 0" class="rv-empty">Chưa có đánh giá nào</div>

          <div v-else class="rv-list">
            <div class="rv-card" v-for="r in reviews" :key="r.id">
              <div class="rv-card-top">
                <img :src="getAvatar(r)" class="rv-avatar" />
                <div class="rv-user">
                  <h5>{{ r.name }}</h5>
                  <small>{{ formatDate(r.createdAt) }} · {{ r.visitType || 'Khách hàng' }}</small>
                </div>
                <div class="rv-card-stars"><StarRating :rating="r.rating" /></div>
              </div>

              <p class="rv-text">{{ r.content }}</p>

              <div v-if="r.tip" class="rv-tip">
                <span>💡</span> {{ r.tip }}
              </div>

              <div class="rv-score-tags">
                <div class="rv-tag"><span>Dịch vụ</span><StarRating :rating="getScore(r.serviceScore)" /></div>
                <div class="rv-tag"><span>Đồ ăn</span><StarRating :rating="getScore(r.foodScore)" /></div>
                <div class="rv-tag"><span>Giá trị</span><StarRating :rating="getScore(r.valueScore)" /></div>
                <div class="rv-tag"><span>Không gian</span><StarRating :rating="getScore(r.atmosphereScore)" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap');

.review-page { min-height: 100vh; background: #f7f4f0; font-family: 'Manrope', sans-serif; padding-bottom: 40px; }
.rv-container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }

/* HEADER */
.rv-header { text-align: center; margin-bottom: 32px; }
.rv-header h1 { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 800; color: #1a1a1a; margin-bottom: 6px; }
.rv-header p { color: #999; font-size: 14px; }

/* LAYOUT 2 CỘT */
.rv-layout { display: grid; grid-template-columns: 420px 1fr; gap: 28px; align-items: start; }

/* CỘT TRÁI */
.rv-left-col { display: flex; flex-direction: column; gap: 16px; }

.rv-summary {
  display: flex; align-items: center; gap: 20px;
  background: white; border-radius: 12px; padding: 18px; border: 1px solid #ede8e0;
}
.rv-score-box { text-align: center; padding-right: 18px; border-right: 1px solid #f0ebe5; flex-shrink: 0; }
.rv-big { font-size: 42px; font-weight: 800; color: #a80000; line-height: 1; }
.rv-stars { color: #ffc107; font-size: 16px; margin: 4px 0 2px; }
.rv-score-box span { font-size: 12px; color: #aaa; }
.rv-summary-text h4 { font-size: 15px; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; }
.rv-summary-text p { font-size: 12px; color: #888; margin: 0; }

/* FORM */
.rv-form {
  background: white; border-radius: 12px; padding: 20px; border: 1px solid #ede8e0;
}
.rv-form h3 { font-size: 16px; font-weight: 800; color: #a80000; margin: 0 0 14px; }

.rv-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.rv-field { display: flex; flex-direction: column; gap: 4px; }
.rv-field.full { margin-top: 8px; }
.rv-field label, .rv-label { font-size: 12px; font-weight: 600; color: #5a4a38; }
.rv-field small { color: #aaa; font-weight: 400; }

.rv-input {
  border: 1.5px solid #e0d6ca; border-radius: 8px; padding: 8px 10px;
  font-size: 13px; width: 100%; transition: 0.2s; font-family: inherit;
}
.rv-input:focus { border-color: #a80000; outline: none; }
.rv-input:disabled { background: #f8f5f0; opacity: 0.7; cursor: not-allowed; }
.rv-input.sm { padding: 6px 8px; }

.rv-scores-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 6px 0 10px; }
.rv-score-field { display: flex; flex-direction: column; gap: 3px; }
.rv-score-field span { font-size: 11px; font-weight: 600; color: #8a7a68; }

.rv-calc {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  background: #faf6f0; border-radius: 8px; border: 1px solid #e8dfd0; margin-bottom: 10px;
}
.rv-calc span { font-size: 12px; color: #888; }
.rv-calc strong { font-size: 18px; color: #a80000; }

.rv-submit { text-align: center; margin-top: 14px; padding-top: 12px; border-top: 1px solid #f0e8dc; }
.rv-submit-btn {
  background: #a80000; color: white; border: none;
  padding: 10px 36px; border-radius: 999px; font-weight: 700; font-size: 14px;
  cursor: pointer; transition: 0.2s;
}
.rv-submit-btn:hover:not(:disabled) { background: #8b0000; }
.rv-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* CỘT PHẢI */
.rv-right-col h3 { font-size: 16px; font-weight: 800; color: #1a1a1a; margin: 0 0 14px; }
.rv-loading, .rv-empty { text-align: center; padding: 30px; color: #aaa; font-size: 13px; }

.rv-list { display: flex; flex-direction: column; gap: 10px; max-height: 700px; overflow-y: auto; padding-right: 4px; }

.rv-card {
  background: white; border-radius: 10px; padding: 14px; border: 1px solid #ede8e0; transition: 0.2s;
}
.rv-card:hover { border-color: #ffd70055; box-shadow: 0 4px 14px rgba(0,0,0,0.04); }

.rv-card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.rv-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid #ede8e0; flex-shrink: 0; }
.rv-user { flex: 1; }
.rv-user h5 { margin: 0; font-size: 13px; font-weight: 700; color: #1a1a1a; }
.rv-user small { font-size: 11px; color: #bbb; }
.rv-card-stars { flex-shrink: 0; }

.rv-text { font-size: 13px; line-height: 1.55; color: #555; margin: 0 0 8px; }

.rv-tip {
  background: #faf6f0; border: 1px solid #e8dfd0; border-radius: 6px;
  padding: 8px 10px; font-size: 12px; color: #555; margin-bottom: 8px;
}
.rv-tip span { margin-right: 4px; }

.rv-score-tags { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.rv-tag { background: #faf6f0; border-radius: 6px; padding: 6px 8px; }
.rv-tag span { display: block; font-size: 11px; font-weight: 600; color: #8a7a68; margin-bottom: 2px; }

@media (max-width: 900px) {
  .rv-layout { grid-template-columns: 1fr; }
  .rv-list { max-height: none; }
  .rv-scores-grid { grid-template-columns: repeat(2, 1fr); }
  .rv-score-tags { grid-template-columns: repeat(2, 1fr); }
}
</style>
