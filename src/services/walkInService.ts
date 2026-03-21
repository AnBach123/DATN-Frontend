import axios from 'axios'

const API_URL = 'http://localhost:8080/api/walk-in'

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
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
    const response = await axios.post(`${API_URL}/check-in`, request, {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    })
    return response.data.data
  }
}
