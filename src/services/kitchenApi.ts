import axiosInstance from './axiosInstance'

/* ========================
   AUTH HEADER
======================== */

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken')
  const tokenType = localStorage.getItem('tokenType') || 'Bearer'

  if (!token) return {}

  return {
    Authorization: `${tokenType} ${token}`,
  }
}

/* ========================
   TYPES
======================== */

export type KitchenStatus = 'PENDING' | 'ORDERED' | 'IN_PROGRESS' | 'DONE' | 'SERVED' | 'CANCELLED'

export interface KitchenItem {
  id: number // 🔥 FIX: BE trả id (không phải invoiceItemId)
  itemName: string
  quantity: number
  status: KitchenStatus
  itemType: string // PRODUCT | COMBO
}

export interface KitchenTable {
  tableId: number
  tableName: string
  customerName: string
  guestCount: number
  totalAmount: number
  totalItems: number
  items: KitchenItem[]
  servingStaffId?: number
  servingStaffName?: string
}

/* ========================
   GET KITCHEN DATA
======================== */

/**
 * Lấy danh sách món theo bàn
 * @param statuses optional filter status
 */
export const getKitchenGrouped = async (statuses?: KitchenStatus[]): Promise<KitchenTable[]> => {
  let url = '/api/kitchen/tables'
  if (statuses && statuses.length > 0) {
    url += '?' + statuses.map(s => `statuses=${encodeURIComponent(s)}`).join('&')
  }
  const res = await axiosInstance.get(url, { headers: getAuthHeader() })
  return res.data.data
}

/* ========================
   START COOKING
======================== */

export const startCooking = async (id: number) => {
  const res = await axiosInstance.put(`/api/kitchen/items/${id}/start`, null, {
    headers: getAuthHeader(),
  })
  return res.data
}

/* ========================
   DONE COOKING
======================== */

export const doneCooking = async (id: number) => {
  const res = await axiosInstance.put(`/api/kitchen/items/${id}/done`, null, {
    headers: getAuthHeader(),
  })
  return res.data
}

/* ========================
   SERVE (STAFF)
======================== */

export const serveItem = async (id: number) => {
  const res = await axiosInstance.put(`/api/kitchen/items/${id}/serve`, null, {
    headers: getAuthHeader(),
  })
  return res.data
}

/* ========================
   CANCEL
======================== */

export const cancelItem = async (id: number, quantityToCancel?: number) => {
  const params = quantityToCancel ? { quantityToCancel } : {}
  
  const res = await axiosInstance.put(`/api/kitchen/items/${id}/cancel`, null, {
    headers: getAuthHeader(),
    params,
  })
  return res.data
}
