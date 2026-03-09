import axios from 'axios'

const API_URL = 'http://localhost:8080/api/reservation'

export const createReservation = (data: any) => {
  return axios.post(API_URL, data)
}
