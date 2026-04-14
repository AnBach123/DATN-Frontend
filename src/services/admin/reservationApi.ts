import axiosInstance from '../axiosInstance'

export interface Reservation {
  reservationCode: string
  customerName: string
  phoneNumber: string
  email: string
  guestCount: number
  reservedAt: string
  status: string
  tables: TableInfo[]
  specialRequests?: string
  createdAt: string
}

export interface TableInfo {
  tableId: number
  tableCode: string
  tableName: string
  seatingCapacity: number
  area: string
  floor: number
}

export const reservationApi = {
  // Get all reservations
  getAllReservations: async (): Promise<Reservation[]> => {
    const response = await axiosInstance.get('/api/reservation/all')
    return response.data.data
  },

  // Get pending confirmation reservations
  getPendingReservations: async (): Promise<Reservation[]> => {
    const response = await axiosInstance.get('/api/reservation/pending')
    return response.data.data
  },

  // Get reservation by code
  getReservationByCode: async (code: string): Promise<Reservation> => {
    const response = await axiosInstance.get(`/api/reservation/${code}`)
    return response.data.data
  },

  // Confirm reservation
  confirmReservation: async (code: string): Promise<Reservation> => {
    const response = await axiosInstance.post(`/api/reservation/${code}/confirm`)
    return response.data.data
  },

  // Cancel reservation
  cancelReservation: async (invoiceId: number): Promise<void> => {
    await axiosInstance.post(`/api/reservation/${invoiceId}/cancel`)
  },

  // Check-in reservation
  checkInReservation: async (code: string): Promise<Reservation> => {
    const response = await axiosInstance.post(`/api/reservation/${code}/check-in`)
    return response.data.data
  },

  // Search by phone number
  searchByPhone: async (phoneNumber: string): Promise<Reservation[]> => {
    const response = await axiosInstance.get('/api/reservation/search', {
      params: { phoneNumber }
    })
    return response.data.data
  },

  // Get alternative tables for reassignment
  getAlternativeTables: async (code: string): Promise<TableInfo[]> => {
    const response = await axiosInstance.get(`/api/reservation/${code}/alternative-tables`)
    return response.data.data
  },

  // Reassign tables
  reassignTables: async (code: string, tableIds: number[]): Promise<Reservation> => {
    const response = await axiosInstance.post(`/api/reservation/${code}/reassign-tables`, {
      tableIds
    })
    return response.data.data
  },

  // Send email
  sendEmail: async (code: string): Promise<void> => {
    await axiosInstance.post(`/api/reservation/${code}/send-email`)
  }
}
