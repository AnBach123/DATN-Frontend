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

export interface StaffTable {
  tableId: number
  tableName: string
  floor: number
  seatingCapacity: number
  tableStatus: string
}

export interface TableInfo {
  tableId: number
  tableName: string
  floor: number
  area: string
}

export interface InvoiceGroup {
  invoiceId: number
  invoiceCode: string
  customerName: string
  guestCount: number
  subtotalAmount: number
  checkedInAt: string
  tables: TableInfo[]
  servingStaffId?: number | null
  servingStaffName?: string | null
}

export interface InvoiceItemResponse {
  id: number
  itemName: string
  quantity: number
  price: number
  status: string
}

export const getInProgressInvoices = async (): Promise<InvoiceGroup[]> => {
  const res = await axiosInstance.get('/api/invoices/in-progress', { headers: getAuthHeader() })
  return res.data.data
}

export const getInvoiceItems = async (invoiceId: number): Promise<InvoiceItemResponse[]> => {
  const res = await axiosInstance.get(`/api/invoices/${invoiceId}/items`, { headers: getAuthHeader() })
  return res.data.data
}

export const addItemsToInvoice = async (invoiceId: number, items: OrderItemRequest[]) => {
  const res = await axiosInstance.post(
    `/api/invoices/${invoiceId}/order-items`,
    { items },
    { headers: getAuthHeader() },
  )
  return res.data
}

export const getServingTables = async (): Promise<StaffTable[]> => {
  const res = await axiosInstance.get('/api/tables/serving', { headers: getAuthHeader() })
  return res.data.data
}

export const getTableById = async (tableId: number): Promise<StaffTable> => {
  const res = await axiosInstance.get(`/api/tables/staff/${tableId}`, { headers: getAuthHeader() })
  return res.data.data
}

export const addItemsToTable = async (tableId: number, items: OrderItemRequest[]) => {
  const res = await axiosInstance.post(
    `/api/tables/${tableId}/order-items`,
    { items },
    { headers: getAuthHeader() },
  )
  return res.data
}
