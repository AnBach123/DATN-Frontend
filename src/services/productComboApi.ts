import axios from 'axios'

const API_URL = 'http://localhost:8080/api/product-combos'

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
    const res = await axios.get(API_URL)

    return res.data.data || []
  } catch (error) {
    console.error('Load combo lỗi:', error)

    return []
  }
}
