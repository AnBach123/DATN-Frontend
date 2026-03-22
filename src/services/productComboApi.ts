import axiosInstance from './axiosInstance'

const API_URL = '/api/product-combos'

export interface ProductComboResponse {
  id: number
  comboName: string
  description: string
  comboPrice: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Lấy danh sách product combo
 */
export const getAllProductCombos = async (): Promise<ProductComboResponse[]> => {
  try {
    const res = await axiosInstance.get(API_URL)

    return res.data.data || []
  } catch (error) {
    console.error('Load combo lỗi:', error)

    return []
  }
}
