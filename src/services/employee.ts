// Dùng axiosInstance dùng chung — đã có interceptor gắn JWT token,
// X-Employee-Username, X-Customer-Email cho audit log định danh.
import api from './axiosInstance'

const EmployeeService = {
  async getEmployees() {
    const response = await api.get('/api/employees')
    return response.data
  },

  async searchEmployees(params: any) {
    const queryParams: any = {}

    if (params.keyword?.trim()) queryParams.keyword = params.keyword.trim()
    if (params.role) queryParams.role = params.role
    if (params.gender) queryParams.gender = params.gender
    if (params.fromDate) queryParams.fromDate = params.fromDate
    if (params.toDate) queryParams.toDate = params.toDate

    const response = await api.get('/api/employees/search', {
      params: queryParams
    })

    return response.data
  },

  async sortEmployees(sortBy: string, direction: string) {
    const response = await api.get('/api/employees/sort', {
      params: { sortBy, direction },
    })
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/api/employees/${id}`)
    return response.data
  },

  async createEmployee(data: any) {
    const payload = {
      fullName: data.fullName,
      username: data.username,
      password: '123',
      role: data.role,
      gender: data.gender || null,
      phoneNumber: data.phoneNumber,
      email: data.email,
      address: data.address,
      isActive: data.isActive ?? true,
    }

    const response = await api.post('/api/employees', payload)
    return response.data
  },

  async updateEmployee(id: number, data: any) {
    const payload: any = {
      fullName: data.fullName,
      username: data.username,
      role: data.role,
      gender: data.gender || null,
      phoneNumber: data.phoneNumber,
      email: data.email,
      address: data.address,
      isActive: data.isActive ?? true,
    }

    const response = await api.put(`/api/employees/${id}`, payload)
    return response.data
  },

  async deleteEmployee(id: number) {
    const response = await api.delete(`/api/employees/${id}`)
    return response.data
  },
}

export default EmployeeService