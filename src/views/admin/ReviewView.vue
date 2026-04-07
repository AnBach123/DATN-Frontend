<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  getAllReviewsAdmin,
  approveReview,
  rejectReview,
  deleteReview
} from '@/services/reviewApi'

interface Review {
  id: number
  name: string
  rating: number
  content: string
  status: string
  statusLabel?: string
  createdAt: string
  visitType?: string
  tip?: string
  serviceScore?: number
  foodScore?: number
  valueScore?: number
  atmosphereScore?: number
  avatarUrl?: string
}

const reviews = ref<Review[]>([])
const statusFilter = ref('ALL')
const loading = ref(false)
const actionLoadingId = ref<number | null>(null)

const showConfirm = ref(false)
const confirmAction = ref<null | (() => Promise<void>)>(null)
const confirmMessage = ref('')

const load = async () => {
  loading.value = true
  try {
    const res = await getAllReviewsAdmin(statusFilter.value)
    reviews.value = res.data
  } catch (e) {
    console.error('Lỗi load reviews:', e)
    alert('Không thể tải danh sách đánh giá')
  } finally {
    loading.value = false
  }
}

const openConfirm = (message: string, action: () => Promise<void>) => {
  confirmMessage.value = message
  confirmAction.value = action
  showConfirm.value = true
}

const approve = (id: number) => {
  openConfirm('Bạn có chắc muốn duyệt đánh giá này?', async () => {
    actionLoadingId.value = id
    try {
      await approveReview(id)
      await load()
    } catch (e) {
      console.error('Lỗi duyệt review:', e)
      alert('Không thể duyệt đánh giá')
    } finally {
      actionLoadingId.value = null
    }
  })
}
const selectedReview = ref<Review | null>(null)
const showDetail = ref(false)

const openDetail = (review: Review) => {
  selectedReview.value = review
  showDetail.value = true
}

const closeDetail = () => {
  showDetail.value = false
  selectedReview.value = null
}

const reject = (id: number) => {
  openConfirm('Bạn có chắc muốn từ chối đánh giá này?', async () => {
    actionLoadingId.value = id
    try {
      await rejectReview(id)
      await load()
    } catch (e) {
      console.error('Lỗi từ chối review:', e)
      alert('Không thể từ chối đánh giá')
    } finally {
      actionLoadingId.value = null
    }
  })
}

const removeReview = (id: number) => {
  openConfirm('Bạn có chắc muốn xóa đánh giá này?', async () => {
    actionLoadingId.value = id
    try {
      await deleteReview(id)
      await load()
    } catch (e) {
      console.error('Lỗi xóa review:', e)
      alert('Không thể xóa đánh giá')
    } finally {
      actionLoadingId.value = null
    }
  })
}

const handleConfirm = async () => {
  if (confirmAction.value) {
    await confirmAction.value()
  }
  showConfirm.value = false
  confirmAction.value = null
  confirmMessage.value = ''
}

const handleCancel = () => {
  showConfirm.value = false
  confirmAction.value = null
  confirmMessage.value = ''
}

const getStatusText = (s: string) =>
  ({
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối'
  }[s] || s)

const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleString('vi-VN')
}

const canApprove = (status: string) => status !== 'APPROVED'
const canReject = (status: string) => status !== 'REJECTED'

onMounted(load)
</script>

<template>
  <div class="review-container">
    <div class="header-section">
      <div>
        <h2>Quản lý đánh giá</h2>
        <p class="sub-title">Duyệt, từ chối và quản lý phản hồi khách hàng</p>
      </div>
    </div>

    <div class="filters-section">
      <div class="filter-row">
        <select v-model="statusFilter" class="filter-select" @change="load">
          <option value="ALL">Tất cả</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>

        <button class="refresh-btn" @click="load">Làm mới</button>
      </div>
    </div>

    <div class="table-container">
      <table class="review-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Đánh giá</th>
            <th>Nội dung</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Hành động</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="loading-cell">Đang tải dữ liệu...</td>
          </tr>

          <tr v-else-if="reviews.length === 0">
            <td colspan="6" class="empty-cell">Không có đánh giá nào</td>
          </tr>

        <tr 
  v-else 
  v-for="r in reviews" 
  :key="r.id"
  @click="openDetail(r)"
  style="cursor: pointer"
>
            <td class="name-cell">
              <div class="name">{{ r.name }}</div>
            </td>

            <td class="stars">
              <span v-for="i in 5" :key="i">
                {{ i <= r.rating ? '⭐' : '☆' }}
              </span>
            </td>

            <td class="content" :title="r.content">
              {{ r.content }}
            </td>

            <td>
              <span :class="['status', (r.status || '').toLowerCase()]">
                {{ r.statusLabel || getStatusText(r.status) }}
              </span>
            </td>

            <td>{{ formatDate(r.createdAt) }}</td>

            <td>
              <div class="action-group">
                <button
                  class="approve-btn"
                 @click.stop="approve(r.id)"
                  :disabled="!canApprove(r.status) || actionLoadingId === r.id"
                >
                  {{ actionLoadingId === r.id ? '...' : 'Duyệt' }}
                </button>

                <button
                  class="reject-btn"
                 @click.stop="reject(r.id)"
                  :disabled="!canReject(r.status) || actionLoadingId === r.id"
                >
                  {{ actionLoadingId === r.id ? '...' : 'Từ chối' }}
                </button>

                <button
                  class="delete-btn"
                 @click.stop="removeReview(r.id)"
                  :disabled="actionLoadingId === r.id"
                >
                  {{ actionLoadingId === r.id ? '...' : 'Xóa' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <h3>Xác nhận thao tác</h3>
        <p>{{ confirmMessage }}</p>

        <div class="confirm-actions">
          <button class="cancel-btn" @click="handleCancel">Hủy</button>
          <button class="ok-btn" @click="handleConfirm">Đồng ý</button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showDetail && selectedReview" class="detail-overlay">
  <div class="detail-box">
    
    <!-- HEADER -->
   <div class="detail-header">
  <div style="display:flex; align-items:center; gap:12px;">
    <img
      :src="selectedReview.avatarUrl || 'https://i.pravatar.cc/100'"
      style="width:40px; height:40px; border-radius:50%; object-fit:cover"
    />
    <h3>Chi tiết đánh giá</h3>
  </div>
      <button class="close-btn" @click="closeDetail">✕</button>
    </div>

    <!-- BODY -->
    <div class="detail-body">
      
      <div class="info-row">
        <div>
          <label>Tên</label>
          <input :value="selectedReview.name" disabled />
        </div>

        <div>
          <label>Ngày tạo</label>
          <input :value="formatDate(selectedReview.createdAt)" disabled />
        </div>
      </div>

      <div class="info-row">
        <div>
          <label>Đi cùng</label>
          <input :value="selectedReview.visitType || 'Khách hàng'" disabled />
        </div>

        <div>
          <label>Đánh giá</label>
          <div class="stars">
            <span v-for="i in 5" :key="i">
              {{ i <= selectedReview.rating ? '★' : '☆' }}
            </span>
          </div>
        </div>
      </div>

      <div class="full-width">
        <label>Nội dung</label>
        <textarea :value="selectedReview.content" disabled />
      </div>

      <div v-if="selectedReview.tip" class="full-width">
        <label>Mẹo</label>
        <input :value="selectedReview.tip" disabled />
      </div>

      <!-- SCORE -->
      <div class="score-grid">
  <div>Dịch vụ: <span class="star">★{{ selectedReview.serviceScore || 5 }}</span></div>
  <div>Đồ ăn: <span class="star">★{{ selectedReview.foodScore || 5 }}</span></div>
  <div>Giá trị: <span class="star">★{{ selectedReview.valueScore || 5 }}</span></div>
  <div>Không gian: <span class="star">★{{ selectedReview.atmosphereScore || 5 }}</span></div>
</div>

      <!-- ACTION -->
      <div class="detail-actions">
        <button class="cancel-btn" @click="closeDetail">Đóng</button>
      </div>

    </div>
  </div>
</div>
</template>

<style scoped>
.review-container {
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc, #eef2ff);
  min-height: 100vh;
}

.header-section {
  margin-bottom: 20px;
}

.header-section h2 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
  color: #1e293b;
}

.sub-title {
  color: #64748b;
  margin: 0;
}

.filters-section {
  background: white;
  padding: 18px 20px;
  border-radius: 16px;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select,
.refresh-btn {
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
}

.filter-select {
  border: 1px solid #dbe2ea;
  min-width: 180px;
}

.refresh-btn {
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  cursor: pointer;
  font-weight: 600;
}

.table-container {
  background: white;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.review-table {
  width: 100%;
  border-collapse: collapse;
}

.review-table thead {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.review-table th,
.review-table td {
  padding: 16px 14px;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
}

.review-table tbody tr:hover {
  background: #f8fbff;
}

.name {
  font-weight: 700;
  color: #1e293b;
}

.content {
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #475569;
}

.stars {
  font-size: 16px;
  white-space: nowrap;
}

.status {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  display: inline-block;
}

.status.pending {
  background: #fef3c7;
  color: #92400e;
}

.status.approved {
  background: #dcfce7;
  color: #166534;
}

.status.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.action-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.approve-btn,
.reject-btn,
.delete-btn {
  border: none;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: 0.2s;
}

.approve-btn {
  background: #22c55e;
  color: white;
}

.reject-btn {
  background: #ef4444;
  color: white;
}

.delete-btn {
  background: #334155;
  color: white;
}

.approve-btn:hover,
.reject-btn:hover,
.delete-btn:hover {
  transform: translateY(-1px);
  opacity: 0.95;
}

.approve-btn:disabled,
.reject-btn:disabled,
.delete-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 28px;
  color: #64748b;
  font-weight: 500;
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.confirm-box {
  background: white;
  border-radius: 18px;
  width: 360px;
  padding: 24px;
  text-align: center;
  animation: fadeIn 0.25s ease;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.confirm-box h3 {
  margin-bottom: 10px;
  color: #1e293b;
}

.confirm-box p {
  color: #64748b;
  margin-bottom: 22px;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.cancel-btn,
.ok-btn {
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.cancel-btn {
  background: #e2e8f0;
  color: #334155;
}

.ok-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

@keyframes fadeIn {
  from {
    transform: scale(0.92);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
    /* OVERLAY */
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

/* BOX */
.detail-box {
  width: 760px;
  max-width: 95%;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  animation: fadeIn 0.25s ease;
  box-shadow: 0 30px 80px rgba(0,0,0,0.35);
}

/* HEADER */
.detail-header {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.close-btn {
  border: none;
  background: rgba(255,255,255,0.2);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: 0.2s;
}

.close-btn:hover {
  background: rgba(255,255,255,0.35);
  transform: rotate(90deg);
}

/* BODY */
.detail-body {
  padding: 24px;
}

/* GRID */
.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

/* LABEL */
label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #64748b;
}

/* INPUT */
input,
textarea {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  font-size: 14px;
}

/* TEXTAREA */
textarea {
  min-height: 100px;
  resize: none;
  line-height: 1.6;
}

/* FULL WIDTH */
.full-width {
  margin-bottom: 16px;
}

/* STARS */
.stars {
  color: #facc15;
  font-size: 20px;
  letter-spacing: 2px;
  margin-top: 6px;
}

/* SCORE */
.score-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.score-grid div {
  background: #f1f5f9;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
}

/* 👇 THÊM MÀU VÀNG CHO SAO */
.score-grid div {
  color: #1e293b; /* chữ màu đen */
  font-weight: 600;
}

/* chỉ sao màu vàng */
.star {
  color: #ffc107;
  font-weight: 700;
}

/* FOOTER */
.detail-actions {
  margin-top: 24px;
  text-align: right;
}

.cancel-btn {
  background: #e2e8f0;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

.cancel-btn:hover {
  background: #cbd5f5;
}
</style>