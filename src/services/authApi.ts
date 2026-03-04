
export type ApiResponse<T> = {
    message: string
    data: T
    errors?: Array<{field: string; error: string}>
}

export type RegisterPayload = {
    fullName: string
    email: string
    password: string
    phoneNumber?: string
    dateOfBirth?: string
}

export type SendOtpPayload = {
    email: string
}

export type VerifyOtpPayload = {
    email: string
    otpCode: string
}

export type RegisterOtpData = {
    email: string
    expiresAt: string
    resendAfterSeconds: number
}

export type RegisterDoneData = {
    customerId: number
    email: string
}

export type LoginPayload = {
    email: string
    password: string
}

export type LoginData = {
    accessToken: string
    tokenType: string
    email: string
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })

    const text = await res.text()
    const data = text ? JSON.parse(text) : {}

    if (!res.ok) throw data
    return data as T
}

export function callRegister(payload: RegisterPayload) {
    return postJson<ApiResponse<RegisterOtpData>>('/api/auth/register', payload)
}

export function callSendOtp(payload: SendOtpPayload) {
    return postJson<ApiResponse<RegisterOtpData>>('/api/auth/otp/send',payload)
}

export function callVerifyOtp(payload: VerifyOtpPayload) {
    return postJson<ApiResponse<RegisterDoneData>>('/api/auth/otp/verify',payload)
}

export function callLogin(payload: LoginPayload) {
    return postJson<ApiResponse<LoginData>>('/api/auth/login', payload)
}