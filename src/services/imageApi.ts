import axiosInstance from './axiosInstance'

export const getPrimaryComboImage = async (comboId:number) => {

  const res = await axiosInstance.get(
    `/api/images/combo/${comboId}/primary`
  )

  return res.data?.data ?? res.data
}