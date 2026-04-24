import axiosInstance from './axiosInstance'

const BLOG_API = '/api/blog'

// Admin
export const getAllPosts = async () => {
  const res = await axiosInstance.get(`${BLOG_API}/admin`)
  return res.data.data
}

export const createPost = async (data: any) => {
  const res = await axiosInstance.post(`${BLOG_API}/admin`, data)
  return res.data.data
}

export const updatePost = async (id: number, data: any) => {
  const res = await axiosInstance.put(`${BLOG_API}/admin/${id}`, data)
  return res.data.data
}

// Vô hiệu hóa (soft delete)
export const disablePost = async (id: number) => {
  const res = await axiosInstance.put(`${BLOG_API}/admin/${id}/disable`)
  return res.data
}

// Kích hoạt lại bài đã vô hiệu hóa
export const restorePost = async (id: number) => {
  const res = await axiosInstance.put(`${BLOG_API}/admin/${id}/restore`)
  return res.data
}

// Danh sách bài đã vô hiệu hóa
export const getDisabledPosts = async () => {
  const res = await axiosInstance.get(`${BLOG_API}/admin/disabled`)
  return res.data.data
}

// Xóa vĩnh viễn (chỉ dùng khi bài đã bị vô hiệu hóa)
export const permanentDeletePost = async (id: number) => {
  const res = await axiosInstance.delete(`${BLOG_API}/admin/${id}/permanent`)
  return res.data
}

export const searchPosts = async (keyword: string) => {
  const res = await axiosInstance.get(`${BLOG_API}/admin/search`, { params: { keyword } })
  return res.data.data
}

// Customer (public)
export const getPublishedPosts = async () => {
  const res = await axiosInstance.get(`${BLOG_API}/published`)
  return res.data.data
}

export const getPostsByCategory = async (category: string) => {
  const res = await axiosInstance.get(`${BLOG_API}/published/category`, { params: { category } })
  return res.data.data
}

export const getPostDetail = async (id: number) => {
  const res = await axiosInstance.get(`${BLOG_API}/${id}`)
  return res.data.data
}
