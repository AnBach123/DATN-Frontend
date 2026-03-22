import axiosInstance from './axiosInstance'

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken')
  const tokenType = localStorage.getItem('tokenType') || 'Bearer'
  if (!token) return {}
  return { Authorization: `${tokenType} ${token}` }
}

export interface OrderItemRequest {
  itemType: 'PRODUCT' | 'COMBO'
  productId?: number
  productComboId?: number
  quantity: number
}

export const addItemsToTable = async (tableId: number, items: OrderItemRequest[]) => {
  const res = await axiosInstance.post(
    `/api/tables/${tableId}/order-items`,
    { items },
    { headers: getAuthHeader() },
  )
  return res.data
}
