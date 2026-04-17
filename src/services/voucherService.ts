import axiosInstance from './axiosInstance'

export interface ProductVoucherRequest {
  voucherCode?: string // Optional for update
  voucherName?: string // Optional for update
  discountPercent?: number // Optional for update
  productId?: number // Optional for update
  remainingQuantity?: number
  validFrom?: string
  validTo?: string
  isActive?: boolean
}

export interface CustomerVoucherRequest {
  // Mode 1: From template
  personalVoucherId?: number
  
  // Mode 2: Direct creation
  voucherCode?: string
  voucherName?: string
  discountPercent?: number
  minOrderAmount?: number
  
  // Common fields
  customerId?: number | null // Optional - null means voucher applies to all customers
  issuedAt?: string
  expiresAt?: string
  remainingQuantity?: number
  isActive?: boolean
}

const VoucherService = {
  // Product Vouchers
  getAllProductVouchers: () => axiosInstance.get('/api/product-vouchers'),
  createProductVoucher: (data: ProductVoucherRequest) => axiosInstance.post('/api/product-vouchers', data),
  updateProductVoucher: (id: number, data: ProductVoucherRequest) => axiosInstance.put(`/api/product-vouchers/${id}`, data),
  deleteProductVoucher: (id: number) => axiosInstance.delete(`/api/product-vouchers/${id}`),

  // Customer Vouchers
  getAllCustomerVouchers: () => axiosInstance.get('/api/customer-vouchers'),
  createCustomerVoucher: (data: CustomerVoucherRequest) => axiosInstance.post('/api/customer-vouchers', data),
  updateCustomerVoucher: (id: number, data: CustomerVoucherRequest) => axiosInstance.put(`/api/customer-vouchers/${id}`, data),
  deleteCustomerVoucher: (id: number) => axiosInstance.delete(`/api/customer-vouchers/${id}`),

  // Personal Vouchers (templates)
  getAllPersonalVouchers: () => axiosInstance.get('/api/personal-vouchers'),

  // Customers
  getAllCustomers: () => axiosInstance.get('/api/customers'),
}

export default VoucherService
