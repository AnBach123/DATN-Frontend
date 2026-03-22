import axiosInstance from './axiosInstance'

const API_URL = '/api/walk-in'

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface WalkInCheckInRequest {
  tableIds: number[]
  guestCount: number
}

export interface WalkInCheckInResponse {
  invoiceId: number
  invoiceCode: string
  message: string
}

export const walkInService = {
  async checkIn(request: WalkInCheckInRequest): Promise<WalkInCheckInResponse> {
    const response = await axiosInstance.post(`${API_URL}/check-in`, request, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    })
    return response.data.data
  }
}
