import axios from "axios"

const API_URL = "/api"

export const getVoucherCombos = async () => {

  const res = await axios.get(`${API_URL}/product-combo-vouchers`)

  return res.data.data

}

export const getVoucherProducts = async () => {

  const res = await axios.get(`${API_URL}/product-vouchers`)

  return res.data.data

}