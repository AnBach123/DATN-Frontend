import axiosInstance from '../axiosInstance'

const PRODUCT_API = '/api/products'

export const getAllProducts = async () => {
  const res = await axiosInstance.get(PRODUCT_API)
  return res.data.data
}

export const createProduct = async (data: any) => {
  const res = await axiosInstance.post(PRODUCT_API, data)
  return res.data.data
}

export const updateProduct = async (id: number, data: any) => {
  const res = await axiosInstance.put(`${PRODUCT_API}/${id}`, data)
  return res.data.data
}

export const deleteProduct = async (id: number) => {
  const res = await axiosInstance.delete(`${PRODUCT_API}/${id}`)
  return res.data
}

export const searchProducts = async (params: {
  name?: string
  category?: string
  status?: string
}) => {
  const res = await axiosInstance.get(`${PRODUCT_API}/search`, { params })
  return res.data.data
}

export const sortProducts = async (field: string, direction: string) => {
  const res = await axiosInstance.get(`${PRODUCT_API}/sort`, {
    params: { field, direction }
  })
  return res.data.data
}
