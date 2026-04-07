import axiosInstance from '@/services/axiosInstance'

export interface ReviewPayload {
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
}

// =========================
// KHÁCH HÀNG
// =========================

// ✅ FIX: thêm /api
export const getReviews = async () => {
  return await axiosInstance.get('/api/reviews')
}

// ✅ FIX
export const createReview = async (data: ReviewPayload) => {
  return await axiosInstance.post('/api/reviews', data)
}

// =========================
// ADMIN
// =========================

// ✅ FIX
export const getAllReviewsAdmin = async (status?: string) => {
  return await axiosInstance.get('/api/reviews/admin', {
    params: status && status !== 'ALL' ? { status } : {}
  })
}

// ✅ FIX
export const approveReview = async (id: number) => {
  return await axiosInstance.put(`/api/reviews/admin/${id}/approve`)
}

// ✅ FIX
export const rejectReview = async (id: number) => {
  return await axiosInstance.put(`/api/reviews/admin/${id}/reject`)
}

// ✅ FIX
export const deleteReview = async (id: number) => {
  return await axiosInstance.delete(`/api/reviews/admin/${id}`)
}