import axiosInstance from "./axiosInstance"

const API_URL = "/api"

export const getVoucherCombos = async () => {

  const res = await axiosInstance.get(`${API_URL}/product-combo-vouchers`)

  return res.data.data

}

export const getVoucherProducts = async () => {

  const res = await axiosInstance.get(`${API_URL}/product-vouchers`)

  return res.data.data

}