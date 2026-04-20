import axiosInstance from './axiosInstance'

// ============================================
// INTERFACES - Match backend DTOs
// ============================================

export interface TableMetadata {
  tableName: string
  displayName: string
  columns: ColumnMetadata[]
  relationships: RelationshipMetadata[]
}

export interface ColumnMetadata {
  columnName: string
  displayName: string
  dataType: string
  nullable: boolean
  primaryKey: boolean
  foreignKey: boolean
  referencedTable: string | null
  referencedColumn: string | null
}

export interface RelationshipMetadata {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  relationshipType: 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'ONE_TO_ONE'
}

export interface ColumnSelection {
  tableName: string
  columnName: string
  aggregation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | null
  alias: string | null
}

export interface FilterCondition {
  tableName: string
  columnName: string
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'BETWEEN'
  value: any
  value2?: any // for BETWEEN
  logicalOperator: 'AND' | 'OR' | null
}

export interface JoinClause {
  joinType: 'INNER' | 'LEFT' | 'RIGHT'
  tableName: string
  onColumn: string
  withTable: string
  withColumn: string
}

export interface OrderByClause {
  tableName: string
  columnName: string
  direction: 'ASC' | 'DESC'
}

export interface VisualQuery {
  tableName: string
  columns: ColumnSelection[]
  filters: FilterCondition[]
  joins: JoinClause[]
  groupBy: string[]
  orderBy: OrderByClause[]
  limit: number | null
}

export interface QueryRequest {
  queryType: 'VISUAL' | 'SQL'
  visualQuery: VisualQuery | null
  sqlQuery: string | null
}

export interface ColumnInfo {
  name: string
  displayName: string
  dataType: string
}

export interface QueryResponse {
  columns: ColumnInfo[]
  rows: Record<string, any>[]
  totalRows: number
  executionTimeMs: number
  generatedSql: string
}

export interface SavedQuery {
  id: number
  name: string
  description: string | null
  queryDefinition: string // JSON string
  visualizationType: 'TABLE' | 'BAR' | 'LINE' | 'PIE' | 'DOUGHNUT'
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface SavedQueryRequest {
  name: string
  description: string | null
  query: QueryRequest
  visualizationType: 'TABLE' | 'BAR' | 'LINE' | 'PIE' | 'DOUGHNUT'
}

export interface AiQueryRequest {
  question: string
}

export interface AiQueryResponse {
  generatedSql: string
  explanation: string
  originalQuestion: string
}

export interface DashboardLayoutRequest {
  savedQueryId: number
  x: number
  y: number
  w: number
  h: number
}

export interface DashboardLayoutResponse {
  id: number
  savedQueryId: number
  x: number
  y: number
  w: number
  h: number
  i?: string
}

export interface DashboardRequest {
  dashboardName: string
  description: string | null
}

export interface DashboardResponse {
  id: number
  dashboardName: string
  description: string | null
  createdAt: string
  updatedAt: string
}

// ============================================
// API SERVICE
// ============================================

export const queryBuilderService = {
  // Get all table metadata
  async getAllTables(): Promise<TableMetadata[]> {
    const response = await axiosInstance.get('/api/query-builder/metadata/tables')
    return response.data.data
  },

  // Get specific table metadata
  async getTableMetadata(tableName: string): Promise<TableMetadata> {
    const response = await axiosInstance.get(`/api/query-builder/metadata/tables/${tableName}`)
    return response.data.data
  },

  // Execute a query
  async executeQuery(request: QueryRequest): Promise<QueryResponse> {
    const response = await axiosInstance.post('/api/query-builder/execute', request)
    return response.data.data
  },

  // Save a new query
  async saveQuery(request: SavedQueryRequest): Promise<SavedQuery> {
    const response = await axiosInstance.post('/api/query-builder/saved-queries', request)
    return response.data.data
  },

  // Update an existing query
  async updateQuery(queryId: number, request: SavedQueryRequest): Promise<SavedQuery> {
    const response = await axiosInstance.put(`/api/query-builder/saved-queries/${queryId}`, request)
    return response.data.data
  },

  // Delete a query
  async deleteQuery(queryId: number): Promise<void> {
    await axiosInstance.delete(`/api/query-builder/saved-queries/${queryId}`)
  },

  // Get all saved queries
  async getAllQueries(): Promise<SavedQuery[]> {
    const response = await axiosInstance.get('/api/query-builder/saved-queries')
    return response.data.data
  },

  // Get my saved queries
  async getMyQueries(): Promise<SavedQuery[]> {
    const response = await axiosInstance.get('/api/query-builder/saved-queries/my')
    return response.data.data
  },

  // Get a specific query
  async getQuery(queryId: number): Promise<SavedQuery> {
    const response = await axiosInstance.get(`/api/query-builder/saved-queries/${queryId}`)
    return response.data.data
  },

  // Get query definition
  async getQueryDefinition(queryId: number): Promise<QueryRequest> {
    const response = await axiosInstance.get(`/api/query-builder/saved-queries/${queryId}/definition`)
    return response.data.data
  },

  // Execute a saved query
  async executeSavedQuery(queryId: number): Promise<QueryResponse> {
    const response = await axiosInstance.post(`/api/query-builder/saved-queries/${queryId}/execute`)
    return response.data.data
  },

  // AI: Generate SQL from natural language question
  async generateSqlFromQuestion(request: AiQueryRequest): Promise<AiQueryResponse> {
    const response = await axiosInstance.post('/api/query-builder/ai/generate-sql', request)
    return response.data.data
  },

  // ============================================
  // DASHBOARD MANAGEMENT API METHODS
  // ============================================

  // Get my dashboards
  async getMyDashboards(): Promise<DashboardResponse[]> {
    const response = await axiosInstance.get('/api/query-builder/dashboards')
    return response.data.data
  },

  // Create a new dashboard
  async createDashboard(request: DashboardRequest): Promise<DashboardResponse> {
    const response = await axiosInstance.post('/api/query-builder/dashboards', request)
    return response.data.data
  },

  // Update a dashboard
  async updateDashboard(dashboardId: number, request: DashboardRequest): Promise<DashboardResponse> {
    const response = await axiosInstance.put(`/api/query-builder/dashboards/${dashboardId}`, request)
    return response.data.data
  },

  // Delete a dashboard
  async deleteDashboard(dashboardId: number): Promise<void> {
    await axiosInstance.delete(`/api/query-builder/dashboards/${dashboardId}`)
  },

  // Get a specific dashboard
  async getDashboard(dashboardId: number): Promise<DashboardResponse> {
    const response = await axiosInstance.get(`/api/query-builder/dashboards/${dashboardId}`)
    return response.data.data
  },

  // ============================================
  // DASHBOARD LAYOUT API METHODS
  // ============================================

  // Get layouts for a specific dashboard
  async getDashboardLayouts(dashboardId: number): Promise<DashboardLayoutResponse[]> {
    const response = await axiosInstance.get(`/api/query-builder/dashboards/${dashboardId}/layouts`)
    return response.data.data
  },

  // Save layouts for a specific dashboard
  async saveDashboardLayouts(dashboardId: number, layouts: DashboardLayoutRequest[]): Promise<void> {
    await axiosInstance.post(`/api/query-builder/dashboards/${dashboardId}/layouts`, layouts)
  },

  // Remove a widget from a specific dashboard
  async removeDashboardLayout(dashboardId: number, savedQueryId: number): Promise<void> {
    await axiosInstance.delete(`/api/query-builder/dashboards/${dashboardId}/layouts/${savedQueryId}`)
  },

  // Legacy methods (without dashboard ID) - for backward compatibility
  async getMyLayouts(): Promise<DashboardLayoutResponse[]> {
    const response = await axiosInstance.get('/api/query-builder/dashboard/layouts')
    return response.data.data
  },

  async saveLayouts(layouts: DashboardLayoutRequest[]): Promise<void> {
    await axiosInstance.post('/api/query-builder/dashboard/layouts', layouts)
  },

  async removeLayout(savedQueryId: number): Promise<void> {
    await axiosInstance.delete(`/api/query-builder/dashboard/layouts/${savedQueryId}`)
  },

  // ============================================
  // CUSTOM DASHBOARD EXPORT
  // ============================================

  async downloadCustomDashboardExcel(dashboardId: number): Promise<void> {
    const response = await axiosInstance.get(
      `/api/query-builder/dashboards/${dashboardId}/export/excel`,
      { responseType: 'blob' }
    )
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const filename = response.headers['content-disposition']
      ?.split('filename=')[1]
      ?.replace(/"/g, '') || `custom-dashboard-${new Date().toISOString().split('T')[0]}.xlsx`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  async downloadCustomDashboardPdf(dashboardId: number): Promise<void> {
    const response = await axiosInstance.get(
      `/api/query-builder/dashboards/${dashboardId}/export/pdf`,
      { responseType: 'blob' }
    )
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const filename = response.headers['content-disposition']
      ?.split('filename=')[1]
      ?.replace(/"/g, '') || `custom-dashboard-${new Date().toISOString().split('T')[0]}.pdf`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }
}
