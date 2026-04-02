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

export interface SuggestedTableInfo {
  id: number
  tableName: string
  seatingCapacity: number
  area: string
  floor: number
}

export interface SuggestTablesResponse {
  suggestedTables: SuggestedTableInfo[]
  totalCapacity: number
  message: string
}

export const walkInService = {
  async checkIn(request: WalkInCheckInRequest): Promise<WalkInCheckInResponse> {
    const response = await axiosInstance.post(`${API_URL}/check-in`, request)
    return response.data.data
  },

  async cancelTable(invoiceCode: string): Promise<void> {
    await axiosInstance.post(`${API_URL}/cancel/${invoiceCode}`, {})
  },

  async suggestTables(guestCount: number): Promise<SuggestTablesResponse> {
    const response = await axiosInstance.get(`${API_URL}/suggest-tables`, {
      params: { guestCount }
    })
    return response.data.data
  }
}
