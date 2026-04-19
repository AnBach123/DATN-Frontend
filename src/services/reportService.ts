import axiosInstance from './axiosInstance'

export interface RevenueReport {
  startDate: string
  endDate: string
  totalRevenue: number
  totalInvoices: number
  averageOrderValue: number
  cashRevenue: number
  transferRevenue: number
  dailyRevenues: DailyRevenue[]
  paymentMethods: PaymentMethodBreakdown[]
  revenueGrowthPercentage: number | null
  invoiceGrowthPercentage: number | null
  hourlyRevenues: HourlyRevenue[]
  categoryBreakdown: CategoryBreakdown[]
  invoiceChannels?: InvoiceChannelBreakdown[]
}

export interface DailyRevenue {
  date: string
  revenue: number
  invoiceCount: number
}

export interface PaymentMethodBreakdown {
  method: string
  amount: number
  count: number
  percentage: number
}

export interface HourlyRevenue {
  hour: number
  revenue: number
  invoiceCount: number
}

export interface CategoryBreakdown {
  category: string
  revenue: number
  itemCount: number
  percentage: number
}

export interface InvoiceChannelBreakdown {
  channel: string
  amount: number
  count: number
  percentage: number
}

export interface ProductReport {
  startDate: string
  endDate: string
  topByRevenue: ProductSales[]
  topByQuantity: ProductSales[]
}

export interface ProductSales {
  productId: number
  productName: string
  category: string
  quantitySold: number
  revenue: number
  percentage: number
}

export const reportService = {
  async getRevenueReport(startDate: string, endDate: string): Promise<RevenueReport> {
    const response = await axiosInstance.get('/api/reports/revenue', {
      params: { startDate, endDate }
    })
    return response.data.data
  },

  async getProductReport(startDate: string, endDate: string, limit: number = 10): Promise<ProductReport> {
    const response = await axiosInstance.get('/api/reports/products', {
      params: { startDate, endDate, limit }
    })
    return response.data.data
  },

  async downloadRevenueExcel(startDate: string, endDate: string): Promise<void> {
    const response = await axiosInstance.get('/api/reports/revenue/export/excel', {
      params: { startDate, endDate },
      responseType: 'blob'
    })
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    link.download = `bao-cao-doanh-thu-${today}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  async downloadRevenuePdf(startDate: string, endDate: string): Promise<void> {
    const response = await axiosInstance.get('/api/reports/revenue/export/pdf', {
      params: { startDate, endDate },
      responseType: 'blob'
    })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    link.download = `bao-cao-doanh-thu-${today}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  async downloadProductExcel(startDate: string, endDate: string, limit: number = 10): Promise<void> {
    const response = await axiosInstance.get('/api/reports/products/export/excel', {
      params: { startDate, endDate, limit },
      responseType: 'blob'
    })
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    link.download = `bao-cao-mon-an-${today}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  async downloadProductPdf(startDate: string, endDate: string, limit: number = 10): Promise<void> {
    const response = await axiosInstance.get('/api/reports/products/export/pdf', {
      params: { startDate, endDate, limit },
      responseType: 'blob'
    })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    link.download = `bao-cao-mon-an-${today}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}
