import axios from 'axios'

const API_URL = 'http://localhost:8080/api/tables'

export default {
  async getTables() {
    const res = await axios.get(API_URL)
    return res.data
  },

  async getTableById(id: number) {
    const res = await axios.get(`${API_URL}/detail/${id}`)
    return res.data
  },

  async createTable(data: any) {
    const res = await axios.post(API_URL, data)
    return res.data
  },

  async updateTable(id: number, data: any) {
    const res = await axios.put(`${API_URL}/${id}`, data)
    return res.data
  },

  async deleteTable(id: number) {
    const res = await axios.delete(`${API_URL}/${id}`)
    return res.data
  },

  async searchTables(filters: any) {
    const params = new URLSearchParams()

    if (filters.keyword) params.append('keyword', filters.keyword)
    if (filters.seatingCapacity) params.append('seatingCapacity', filters.seatingCapacity)
    if (filters.tableStatus) params.append('tableStatus', filters.tableStatus)
    if (filters.fromDate) params.append('fromDate', filters.fromDate)
    if (filters.toDate) params.append('toDate', filters.toDate)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.direction) params.append('direction', filters.direction)

    const res = await axios.get(`${API_URL}/search?${params.toString()}`)
    return res.data
  },
}