import axios from 'axios'

const API_URL = '/api/reservation'

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken')
  const tokenType = localStorage.getItem('tokenType') || 'Bearer'

  if (!token) return {}
  return { Authorization: `${tokenType} ${token}` }
}

export const getAvailableTables = (params: { reservedAt: string; guestCount: number }) => {
  return axios.get(`${API_URL}/available`, {
    params,
    headers: getAuthHeader(),
  })
}

export const createReservation = (data: any) => {
  return axios.post(API_URL, data, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  })
}

export const sendReservationEmail = (reservationCode: string) => {
  return axios.post(`${API_URL}/${reservationCode}/send-email`, null, {
    headers: getAuthHeader(),
  })
}

export const getReservationByCode = (reservationCode: string) => {
  return axios.get(`${API_URL}/${reservationCode}`, {
    headers: getAuthHeader(),
  })
}

export const checkInReservation = (reservationCode: string) => {
  return axios.post(`${API_URL}/${reservationCode}/check-in`, null, {
    headers: getAuthHeader(),
  })
}
