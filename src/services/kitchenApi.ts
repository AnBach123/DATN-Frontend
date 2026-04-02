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

export type KitchenStatus = 'ORDERED' | 'IN_PROGRESS' | 'DONE' | 'SERVED' | 'CANCELLED'

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
  totalItems: number // 🔥 thêm
  items: KitchenItem[]
}

/* ========================
   GET KITCHEN DATA
======================== */

/**
 * Lấy danh sách món theo bàn
 * @param statuses optional filter status
 */
export const getKitchenGrouped = async (statuses?: KitchenStatus[]): Promise<KitchenTable[]> => {
  const res = await axiosInstance.get('/api/kitchen/tables', {
    headers: getAuthHeader(),
    params: {
      statuses, // 🔥 BE sẽ nhận ?statuses=ORDERED&statuses=IN_PROGRESS
    },
  })

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

export const cancelItem = async (id: number) => {
  const res = await axiosInstance.put(`/api/kitchen/items/${id}/cancel`, null, {
    headers: getAuthHeader(),
  })
  return res.data
}
