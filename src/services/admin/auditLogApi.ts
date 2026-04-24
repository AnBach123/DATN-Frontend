import axiosInstance from '../axiosInstance'

export interface FieldChange {
  field: string
  fieldLabel: string
  oldValue: string
  newValue: string
}

export interface AuditLogResponse {
  id: string
  userEmail: string
  userRole: string
  userId: number
  userType: string
  userFullName: string
  actionType: string
  entityType: string
  entityId: string
  actionDescription: string
  ipAddress: string
  userAgent: string
  requestMethod: string
  requestEndpoint: string
  responseStatus: number
  responseMessage: string
  createdAt: string
  severity: string
  executionTimeMs: number
  changes?: FieldChange[]
}

export interface AuditLogSearchRequest {
  userEmail?: string
  userRole?: string
  actionType?: string
  /** Category filter — match substring (vd: "CREATE" match cả BLOG_CREATE, PRODUCT_CREATE...) */
  actionCategory?: string
  /** Full-text search — match trong actionDescription, userEmail, userFullName, entityId */
  keyword?: string
  entityType?: string
  severity?: string
  entityId?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export const auditLogApi = {
  search(searchRequest: AuditLogSearchRequest) {
    return axiosInstance.post<PageResponse<AuditLogResponse>>(
      '/api/audit-logs/search',
      searchRequest
    )
  },

  getByEntity(entityType: string, entityId: string) {
    return axiosInstance.get<AuditLogResponse[]>(
      `/api/audit-logs/entity/${entityType}/${entityId}`
    )
  },

  getRecentByUser(userEmail: string, limit: number = 10) {
    return axiosInstance.get<AuditLogResponse[]>(
      `/api/audit-logs/user/${userEmail}/recent`,
      { params: { limit } }
    )
  },

  getFailedLogins(hours: number = 24) {
    return axiosInstance.get<AuditLogResponse[]>(
      '/api/audit-logs/failed-logins',
      { params: { hours } }
    )
  },

  getCriticalEvents(page: number = 0, size: number = 20) {
    return axiosInstance.get<PageResponse<AuditLogResponse>>(
      '/api/audit-logs/critical',
      { params: { page, size } }
    )
  },

  getTodayLogs(page: number = 0, size: number = 20) {
    return axiosInstance.post<PageResponse<AuditLogResponse>>(
      '/api/audit-logs/today',
      null,
      { params: { page, size } }
    )
  },

  getByAction(actionType: string, page: number = 0, size: number = 20) {
    return axiosInstance.get<PageResponse<AuditLogResponse>>(
      `/api/audit-logs/action/${actionType}`,
      { params: { page, size } }
    )
  },

  getByRole(role: string, page: number = 0, size: number = 20) {
    return axiosInstance.get<PageResponse<AuditLogResponse>>(
      `/api/audit-logs/role/${role}`,
      { params: { page, size } }
    )
  },
}
