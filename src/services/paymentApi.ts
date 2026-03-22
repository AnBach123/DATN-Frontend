import axiosInstance from './axiosInstance'

const API_URL = '/api/reception/payment'

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken')
  const tokenType = localStorage.getItem('tokenType') || 'Bearer'
  if (!token) return {}
  return { Authorization: `${tokenType} ${token}` }
}

export const getPaymentByTable = (tableId: number) => {
  return axiosInstance.get(`${API_URL}/by-table/${tableId}`, {
    headers: getAuthHeader(),
  })
}

export const checkoutPayment = (payload: {
  tableId: number
  customerVoucherId?: number | null
  voucherCodes?: string[] | null
  usePoints?: number
  paymentMethod?: string
  cashReceived?: number
  manualDiscountPercent?: number
  manualDiscountAmount?: number
  taxPercent?: number
  serviceFeePercent?: number
  payments?: { method: string; amount: number; note?: string }[]
}) => {
  return axiosInstance.post(`${API_URL}/checkout`, payload, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  })
}

export const cancelPayment = (tableId: number) => {
  return axiosInstance.post(
    `${API_URL}/cancel`,
    { tableId },
    { headers: { 'Content-Type': 'application/json', ...getAuthHeader() } },
  )
}

export const updatePaymentItem = (itemId: number, quantity: number) => {
  return axiosInstance.patch(
    `${API_URL}/items/${itemId}`,
    { quantity },
    { headers: { 'Content-Type': 'application/json', ...getAuthHeader() } },
  )
}

export const deletePaymentItem = (itemId: number) => {
  return axiosInstance.delete(`${API_URL}/items/${itemId}`, {
    headers: getAuthHeader(),
  })
}
