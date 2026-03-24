import axiosInstance from './axiosInstance'

export interface DashboardStats {
  todayRevenue: {
    amount: number
    percentChange: number
    trend: 'up' | 'down' | 'neutral'
  }
  todayInvoices: {
    count: number
    percentChange: number
    trend: 'up' | 'down' | 'neutral'
  }
  todayCustomers: {
    count: number
    percentChange: number
    trend: 'up' | 'down' | 'neutral'
  }
  activeTables: {
    occupied: number
    total: number
    percentOccupied: number
  }
}

export interface TopProduct {
  id: number
  name: string
  category: string
  quantity: number
  revenue: number
  percentage: number
}

export interface RecentInvoice {
  id: number
  code: string
  table: string
  time: string
  subtotal: number
  discount: number
  serviceFee: number
  tax: number
  finalAmount: number
  status: string
  paymentMethod: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
}

export interface TableStatus {
  id: number
  name: string
  capacity: number
  status: string
  minutesSinceCheckIn?: number | null
  reservedAt?: string | null
}

export interface TableDetail {
  tableId: number
  tableName: string
  capacity: number
  status: string
  invoiceId: number | null
  invoiceCode: string | null
  invoiceStatus: string | null
  checkedInAt: string | null
  reservedAt: string | null
  guestCount: number | null
  customerName: string | null
  customerPhone: string | null
  subtotal: number | null
  finalAmount: number | null
  minutesSinceCheckIn: number | null
  staffName: string | null
}

export interface RevenueChart {
  labels: string[]
  data: number[]
}

export const dashboardService = {
  async getStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    const params: any = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    const response = await axiosInstance.get('/api/dashboard/stats', { params })
    return response.data.data
  },

  async getTopProducts(startDate?: string, endDate?: string, limit: number = 5): Promise<TopProduct[]> {
    const params: any = { limit }
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    const response = await axiosInstance.get('/api/dashboard/top-products', { params })
    return response.data.data
  },

  async getRecentInvoices(limit: number = 5): Promise<RecentInvoice[]> {
    const response = await axiosInstance.get('/api/dashboard/recent-invoices', { params: { limit } })
    return response.data.data
  },

  async getTableStatus(): Promise<TableStatus[]> {
    const response = await axiosInstance.get('/api/dashboard/table-status')
    return response.data.data
  },

  async getTableDetail(tableId: number): Promise<TableDetail> {
    const response = await axiosInstance.get(`/api/dashboard/table-detail/${tableId}`)
    return response.data.data
  },

  async getRevenueChart(startDate?: string, endDate?: string): Promise<RevenueChart> {
    const params: any = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    const response = await axiosInstance.get('/api/dashboard/revenue-chart', { params })
    return response.data.data
  }
}

export interface InvoicePageResponse {
  content: RecentInvoice[]
  totalElements: number
  totalPages: number
  currentPage: number
  size: number
}

export interface InvoiceItem {
  id: number
  name: string
  type: string
  quantity: number
  unitPrice: number
  discount: number
  lineTotal: number
}

export interface InvoiceDetail {
  invoiceId: number
  invoiceCode: string
  invoiceStatus: string
  customerType: string | null
  customerName: string | null
  customerPhone: string | null
  loyaltyPoints: number | null
  reservedAt: string | null
  checkedInAt: string | null
  guestCount: number | null
  staffName: string | null
  tables: Array<{
    id: number
    tableName: string
    seatingCapacity: number
  }>
  items: InvoiceItem[]
  subtotal: number
  itemVoucherDiscount: number | null
  manualDiscountPercent: number | null
  manualDiscountAmount: number | null
  taxPercent: number | null
  serviceFeePercent: number | null
  pointValue: number | null
}

export const invoiceService = {
  async getAllInvoices(params: {
    page?: number
    size?: number
    status?: string
    startDate?: string
    endDate?: string
    search?: string
    paymentMethod?: string
    sortBy?: string
    sortDirection?: string
  }): Promise<InvoicePageResponse> {
    const response = await axiosInstance.get('/api/dashboard/invoices', { params })
    return response.data.data
  },

  async getInvoiceDetail(invoiceId: number): Promise<InvoiceDetail> {
    const response = await axiosInstance.get(`/api/dashboard/invoice-detail/${invoiceId}`)
    return response.data.data
  }
}
