import axiosInstance from './axiosInstance'

const PRODUCT_API = '/api/products'
const IMAGE_API = '/api/images/product'

export const getProducts = async () => {
  try {
    const res = await axiosInstance.get(PRODUCT_API)

    const products = res.data.data || []

    const result = await Promise.all(
      products.map(async (product: any) => {
        try {
          const imgRes = await axiosInstance.get(`${IMAGE_API}/${product.id}`)

          const images = imgRes.data.data || []

          const primaryImage = images.find((img: any) => img.isPrimary)

          return {
            ...product,
            imageUrl: primaryImage ? primaryImage.imageUrl : null,
          }
        } catch (error) {
          return {
            ...product,
            imageUrl: null,
          }
        }
      }),
    )

    return result
  } catch (error) {
    console.error('Load product lỗi:', error)

    return []
  }
}
