import axiosInstance from './axiosInstance'

const API_URL = '/api/walk-in'

export interface WalkInCheckInRequest {
  tableIds: number[]
  guestCount: number
  customerName?: string
}

export interface WalkInCheckInResponse {
  invoiceId: number
  invoiceCode: string
  message: string
}

export const walkInService = {
  async checkIn(request: WalkInCheckInRequest): Promise<WalkInCheckInResponse> {
    const response = await axiosInstance.post(`${API_URL}/check-in`, request)
    return response.data.data
  },

  async cancelTable(invoiceCode: string): Promise<void> {
    await axiosInstance.post(`${API_URL}/cancel/${invoiceCode}`, {})
  }
}
