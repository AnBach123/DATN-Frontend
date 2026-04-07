// src/services/image.ts
import axiosInstance from './axiosInstance'

const IMAGE_API = '/api/images'

export const getPrimaryComboImage = async (comboId: number) => {
  const res = await axiosInstance.get(`${IMAGE_API}/combo/${comboId}/primary`)
  return res.data.data
}