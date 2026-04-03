import axiosInstance from '@/services/axiosInstance';

const API_URL = 'http://localhost:8080/api/customers';

export const customerApi = {
  getAllCustomers() {
    return axiosInstance.get('/api/customers');
  },

  searchCustomers(params: any = {}) {
    return axiosInstance.get('/api/customers/search', { params });
  },

  sortCustomers(sortBy: string, direction: string) {
    return axiosInstance.get('/api/customers/sort', {
      params: { sortBy, direction }
    });
  },

  getCustomersPaging(params: any) {
    return axiosInstance.get('/api/customers', { params })
  },

  updateStatus(id: number, isActive: boolean) {
    return axiosInstance.put(`/api/customers/${id}/status`, { isActive });
  }
};
export interface Customer {
  id: number
  name: string
  email: string
  phone: string
  loyaltyPoints: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
