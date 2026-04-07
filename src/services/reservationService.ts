import axiosInstance from './axiosInstance';

export interface TableInfo {
  id: number;
  tableCode: string;
  tableName: string;
  seatingCapacity: number;
  area?: string;
  floor?: number;
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
  foodNote: string;
  tables: TableInfo[];
  guestName?: string;
  guestPhone?: string;
}

export const reservationService = {
  async searchByPhoneNumber(phoneNumber: string): Promise<ReservationInfo[]> {
    const response = await axiosInstance.get('/api/reservation/search', {
      params: { phoneNumber }
    });
    return response.data.data;
  },

  async checkInReservation(reservationCode: string): Promise<any> {
    const response = await axiosInstance.post(
      `/api/reservation/${reservationCode}/check-in`,
      {}
    );
    return response.data;
  },

  async cancelReservation(invoiceId: number): Promise<any> {
    const response = await axiosInstance.post(
      `/api/reservation/${invoiceId}/cancel`,
      {}
    );
    return response.data;
  },

  async getAllReservedReservations(): Promise<ReservationInfo[]> {
    const response = await axiosInstance.get('/api/reservation/all');
    return response.data.data;
  },

  async getPendingConfirmationReservations(): Promise<ReservationInfo[]> {
    const response = await axiosInstance.get('/api/reservation/pending');
    return response.data.data;
  },

  async confirmReservation(reservationCode: string): Promise<any> {
    const response = await axiosInstance.post(
      `/api/reservation/${reservationCode}/confirm`,
      {}
    );
    return response.data;
  },

  async getAlternativeTables(reservationCode: string): Promise<TableInfo[]> {
    const response = await axiosInstance.get(
      `/api/reservation/${reservationCode}/alternative-tables`
    );
    return response.data.data;
  },

  async reassignTables(reservationCode: string, tableIds: number[]): Promise<any> {
    const response = await axiosInstance.post(
      `/api/reservation/${reservationCode}/reassign-tables`,
      { tableIds }
    );
    return response.data;
  }
};
