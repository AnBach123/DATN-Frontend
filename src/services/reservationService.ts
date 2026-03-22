import axiosInstance from './axiosInstance';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface TableInfo {
  id: number;
  tableCode: string;
  tableName: string;
  seatingCapacity: number;
}

export interface ReservationInfo {
  invoiceId: number;
  reservationCode: string;
  reservedAt: string;
  guestCount: number;
  fullName: string;
  phoneNumber: string;
  invoiceStatus: string;
  promotionType: string;
  note: string;
  tables: TableInfo[];
}

export const reservationService = {
  async searchByPhoneNumber(phoneNumber: string): Promise<ReservationInfo[]> {
    const token = localStorage.getItem('accessToken');
    const response = await axiosInstance.get(`${API_BASE_URL}/api/reservation/search`, {
      params: { phoneNumber },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  async checkInReservation(reservationCode: string): Promise<any> {
    const token = localStorage.getItem('accessToken');
    const response = await axiosInstance.post(
      `${API_BASE_URL}/api/reservation/${reservationCode}/check-in`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async cancelReservation(invoiceId: number): Promise<any> {
    const token = localStorage.getItem('accessToken');
    const response = await axiosInstance.post(
      `${API_BASE_URL}/api/reservation/${invoiceId}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getAllReservedReservations(): Promise<ReservationInfo[]> {
    const token = localStorage.getItem('accessToken');
    const response = await axiosInstance.get(`${API_BASE_URL}/api/reservation/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }
};
