// Mock authentication data
export interface MockUser {
  email: string
  password: string
  role: 'USER' | 'RECEPTION' | 'STAFF' | 'ADMIN' | 'KITCHEN'
  fullName: string
}

export const MOCK_USERS: MockUser[] = [
  {
    email: 'user@gmail.com',
    password: '123',
    role: 'USER',
    fullName: 'Khách hàng',
  },
  {
    email: 'reception@gmail.com',
    password: '123',
    role: 'RECEPTION',
    fullName: 'Nhân viên lễ tân',
  },
  {
    email: 'staff@gmail.com',
    password: '123',
    role: 'STAFF',
    fullName: 'Nhân viên phục vụ',
  },
  {
    email: 'admin@gmail.com',
    password: '123',
    role: 'ADMIN',
    fullName: 'Quản trị viên',
  },
  {
    email: 'kitchen@gmail.com',
    password: '123',
    role: 'KITCHEN',
    fullName: 'Nhân viên bếp',
  },
]

export const ROLE_ROUTES = {
  USER: '/home',
  RECEPTION: '/reception/check-in-offline',
  STAFF: '/staff/order',
  ADMIN: '/admin/dashboard',
  KITCHEN: '/kitchen',
}

export function authenticateMockUser(email: string, password: string): MockUser | null {
  const user = MOCK_USERS.find((u) => u.email === email && u.password === password)
  return user || null
}

export function getRedirectRoute(
  role: 'USER' | 'RECEPTION' | 'STAFF' | 'ADMIN' | 'KITCHEN',
): string {
  return ROLE_ROUTES[role]
}

/**
 * Generate mock JWT token with role for development
 * Format: header.payload.signature (Base64 encoded)
 * This is a MOCK token for frontend development only
 */
export function generateMockJWT(email: string, role: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const payload = {
    sub: email,
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  }

  // Base64 encode (mock signature, not cryptographically secure)
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const mockSignature = btoa(`mock-signature-${email}-${role}`)

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`
}
