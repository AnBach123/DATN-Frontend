import axios from 'axios'

const API_URL = 'http://localhost:8080/api/admin/dashboard'

export const dashboardApi = {
  async getDashboard() {
    const res = await axios.get(API_URL)
    return res.data
  },
}
