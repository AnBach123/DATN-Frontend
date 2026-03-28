import axiosInstance from './axiosInstance'

export interface OvertimeAlert {
  id: string
  tables: Array<{
    id: number
    name: string
    status: string
  }>
  diningDuration: number
  nextReservationTime: string | null
  invoiceCode: string
  urgency: string | null
  generatedAt: string
}

export const overtimeAlertService = {
  async getActiveAlerts(): Promise<OvertimeAlert[]> {
    const response = await axiosInstance.get('/api/overtime/alerts')
    return response.data
  },

  async acknowledgeAlert(alertId: string): Promise<void> {
    await axiosInstance.post(`/api/overtime/alerts/${alertId}/acknowledge`)
  }
}
