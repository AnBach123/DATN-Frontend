import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const EmployeeService = {
  async getEmployees() {
    const response = await api.get('/employees')
    return response.data
  },

  async searchEmployees(params: any) {
    const queryParams: any = {}

    if (params.keyword?.trim()) queryParams.keyword = params.keyword.trim()
    if (params.role) queryParams.role = params.role
    if (params.gender) queryParams.gender = params.gender
    if (params.fromDate) queryParams.fromDate = params.fromDate
    if (params.toDate) queryParams.toDate = params.toDate
    if (params.status !== '' && params.status != null) queryParams.status = params.status

    const response = await api.get('/employees/search', {
      params: queryParams
    })

    return response.data
  },

  async sortEmployees(sortBy: string, direction: string) {
    const response = await api.get('/employees/sort', {
      params: { sortBy, direction },
    })
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/employees/${id}`)
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

    const response = await api.post('/employees', payload)
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

    const response = await api.put(`/employees/${id}`, payload)
    return response.data
  },

  async toggleStatus(id: number) {
  const response = await api.put(`/employees/${id}/toggle-status`)
  return response.data
}
}

export default EmployeeService