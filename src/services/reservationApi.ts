import axiosInstance from './axiosInstance'

const API_URL = '/api/reservation'

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken')
  const tokenType = localStorage.getItem('tokenType') || 'Bearer'

  if (!token) return {}
  return { Authorization: `${tokenType} ${token}` }
}

export const getAvailableTables = (params: { reservedAt: string; guestCount: number }) => {
  return axiosInstance.get(`${API_URL}/available`, {
    params,
    headers: getAuthHeader(),
  })
}

export const createReservation = (data: any) => {
  return axiosInstance.post(API_URL, data, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  })
}

export const sendReservationEmail = (reservationCode: string) => {
  return axiosInstance.post(`${API_URL}/${reservationCode}/send-email`, null, {
    headers: getAuthHeader(),
  })
}

export const getReservationByCode = (reservationCode: string) => {
  return axiosInstance.get(`${API_URL}/${reservationCode}`, {
    headers: getAuthHeader(),
  })
}

export const checkInReservation = (reservationCode: string) => {
  return axiosInstance.post(`${API_URL}/${reservationCode}/check-in`, null, {
    headers: getAuthHeader(),
  })
}

export const getPendingReservations = () => {
  return axiosInstance.get(`${API_URL}/pending`, {
    headers: getAuthHeader(),
  })
}

export const confirmReservation = (reservationCode: string) => {
  return axiosInstance.post(`${API_URL}/${reservationCode}/confirm`, 
    {},
    {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    }
  )
}

export const getAllReservedReservations = () => {
  return axiosInstance.get(`${API_URL}/all`, {
    headers: getAuthHeader(),
  })
}

export const searchReservationsByPhone = (phoneNumber: string) => {
  return axiosInstance.get(`${API_URL}/search`, {
    params: { phoneNumber },
    headers: getAuthHeader(),
  })
}

export const cancelReservation = (invoiceId: number) => {
  return axiosInstance.post(`${API_URL}/${invoiceId}/cancel`, null, {
    headers: getAuthHeader(),
  })
}

export const getAlternativeTables = (reservationCode: string) => {
  return axiosInstance.get(`${API_URL}/${reservationCode}/alternative-tables`, {
    headers: getAuthHeader(),
  })
}

export const reassignTables = (reservationCode: string, tableIds: number[]) => {
  return axiosInstance.post(
    `${API_URL}/${reservationCode}/reassign-tables`,
    { tableIds },
    {
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    }
  )
}
