import axios from 'axios'

const API_URL = '/api/invoice-items'

export interface CreateInvoiceItemRequest {
  invoiceId: number
  itemType: 'PRODUCT' | 'COMBO'
  productId?: number
  productComboId?: number
  quantity: number
}

export const addItemToInvoice = async (data: CreateInvoiceItemRequest) => {
  const res = await axios.post(API_URL, data)

  return res.data
}
