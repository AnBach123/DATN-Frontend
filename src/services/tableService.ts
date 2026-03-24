import axiosInstance from './axiosInstance';

export interface TableStatus {
  id: number;
  name: string;
  capacity: number;
  status: string;
  minutesSinceCheckIn?: number;
  reservedAt?: string;
  customerName?: string;
}

export const tableService = {
  async getAllTablesWithStatus(): Promise<TableStatus[]> {
    const token = localStorage.getItem('accessToken');
    const response = await axiosInstance.get('/api/dashboard/table-status', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }
};
