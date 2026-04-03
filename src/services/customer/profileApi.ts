import axiosInstance from '../axiosInstance'

export type CustomerProfile = {
  id: number
  fullName: string
  phoneNumber: string
  email: string
  dateOfBirth: string
  loyaltyPoints: number
  createdAt: string
  isActive: boolean
}

export type UpdateProfilePayload = {
  fullName?: string
  phoneNumber?: string
  email?: string
  dateOfBirth?: string
}

export const getProfile = async () => {
  const res = await axiosInstance.get('/api/customers/profile')
  return res.data as CustomerProfile
}

export const updateProfile = async (payload: UpdateProfilePayload) => {
  const res = await axiosInstance.put('/api/customers/profile', payload)
  return res.data
}
