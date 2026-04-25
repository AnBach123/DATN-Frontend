<template>
  <div class="query-builder-container">
    <AdminPageHeader title="Truy vấn dữ liệu" />

    <!-- Tab Navigation -->
    <div class="tabs-container">
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'ai' }"
        @click="handleTabChange('ai')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
          <circle cx="9" cy="14" r="1"/>
          <circle cx="15" cy="14" r="1"/>
        </svg>
        AI Assistant
      </button>
      <!-- <button 
        class="tab-button" 
        :class="{ active: activeTab === 'visual' }"
        @click="handleTabChange('visual')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
        Truy vấn trực quan
      </button> -->
      <!-- <button 
        class="tab-button" 
        :class="{ active: activeTab === 'sql' }"
        @click="handleTabChange('sql')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
        SQL Editor
      </button> -->
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'saved' }"
        @click="handleTabChange('saved')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        Dashboard & Truy vấn
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- AI Assistant Tab -->
      <div v-if="activeTab === 'ai'" class="ai-assistant-tab">
        <div class="ai-container">
          <div class="ai-header">
            <div class="ai-header-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                <circle cx="9" cy="14" r="1"/>
                <circle cx="15" cy="14" r="1"/>
              </svg>
              <div>
                <h3>AI Assistant</h3>
                <p>AI hỗ trợ truy xuất dữ liệu</p>
              </div>
            </div>
            <button class="btn-history-toggle" @click="showHistory = !showHistory">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Lịch sử{{ aiHistory.length > 0 ? ` (${aiHistory.length})` : '' }}
            </button>
          </div>

          <!-- History Panel -->
          <div v-if="showHistory" class="ai-history-panel">
            <div class="ai-history-panel-header">
              <span>Lịch sử câu hỏi</span>
              <button v-if="aiHistory.length > 0" class="btn-clear-history" @click="clearHistory">Xóa tất cả</button>
            </div>
            <div v-if="aiHistory.length === 0" class="ai-history-empty">Chưa có câu hỏi nào.</div>
            <div v-else class="ai-history-list">
              <div
                v-for="item in aiHistory"
                :key="item.id"
                class="ai-history-item"
                @click="restoreFromHistory(item)"
              >
                <div class="ai-history-item-content">
                  <p class="ai-history-question">{{ item.question }}</p>
                  <span class="ai-history-time">{{ formatHistoryTime(item.timestamp) }}</span>
                </div>
                <button class="btn-delete-history" @click.stop="deleteHistoryItem(item.id)" title="Xóa">×</button>
              </div>
            </div>
          </div>

          <div class="ai-question-section">
            <label class="ai-label">Câu hỏi của bạn</label>
            <textarea 
              v-model="aiQuestion" 
              class="ai-question-input"
              placeholder="Nhập dữ liệu bạn muốn truy xuất..."
              rows="4"
              :disabled="aiLoading"
            ></textarea>
            <button 
              class="btn-generate-sql" 
              @click="askAiQuestion"
              :disabled="aiLoading || !aiQuestion.trim()"
            >
              <svg v-if="!aiLoading" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <svg v-else class="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"/>
                <line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                <line x1="2" y1="12" x2="6" y2="12"/>
                <line x1="18" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
              </svg>
              {{ aiLoading ? 'Loading...' : 'Tạo truy vấn' }}
            </button>
          </div>

          <!-- AI Response -->
          <div v-if="aiResponse" class="ai-response-section">
            <div class="ai-explanation">
              <h4>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Giải thích
              </h4>
              <p>{{ aiResponse.explanation }}</p>
            </div>

            <div class="ai-sql-section">
              <div class="ai-sql-header">
                <h4>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                  SQL đã tạo
                </h4>
                <div class="ai-sql-actions">
                  <label class="sql-toggle-label">
                    <input type="checkbox" v-model="showAiSql" class="sql-toggle-checkbox" />
                    <span>{{ showAiSql ? 'Ẩn SQL' : 'Hiện SQL' }}</span>
                  </label>
                  <button class="btn-ai-action" @click="executeAiGeneratedSql" :disabled="aiExecuting">
                    <svg v-if="!aiExecuting" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    <svg v-else class="spinner-small" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="2" x2="12" y2="6"/>
                      <line x1="12" y1="18" x2="12" y2="22"/>
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                      <line x1="2" y1="12" x2="6" y2="12"/>
                      <line x1="18" y1="12" x2="22" y2="12"/>
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                    </svg>
                    {{ aiExecuting ? 'Đang thực thi...' : 'Thực thi' }}
                  </button>
                  <button class="btn-ai-action" @click="openSaveDialogForAi" :disabled="aiExecuting">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Lưu
                  </button>
                </div>
              </div>
              <pre v-show="showAiSql" class="ai-sql-code"><code>{{ aiResponse.generatedSql }}</code></pre>
            </div>

            <!-- AI Query Results -->
            <div v-if="aiQueryResult" class="results-container">
              <div class="results-header">
                <h3>Kết quả truy vấn</h3>
                <div class="results-meta">
                  <span class="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                    {{ aiQueryResult.totalRows }} dòng
                  </span>
                  <span class="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ aiQueryResult.executionTimeMs }}ms
                  </span>
                </div>
              </div>

              <!-- Visualization Type Selector -->
              <div class="visualization-selector">
                <label>Hiển thị:</label>
                <div class="viz-buttons">
                  <button 
                    :class="['viz-btn', { active: aiVisualizationType === 'TABLE' }]"
                    @click="aiVisualizationType = 'TABLE'"
                  >
                    Bảng
                  </button>
                  <button 
                    :class="['viz-btn', { active: aiVisualizationType === 'BAR' }]"
                    @click="aiVisualizationType = 'BAR'; renderAiChart()"
                  >
                    Biểu đồ cột
                  </button>
                  <button 
                    :class="['viz-btn', { active: aiVisualizationType === 'LINE' }]"
                    @click="aiVisualizationType = 'LINE'; renderAiChart()"
                  >
                    Biểu đồ đường
                  </button>
                  <button 
                    :class="['viz-btn', { active: aiVisualizationType === 'PIE' }]"
                    @click="aiVisualizationType = 'PIE'; renderAiChart()"
                  >
                    Biểu đồ tròn
                  </button>
                  <button 
                    :class="['viz-btn', { active: aiVisualizationType === 'DOUGHNUT' }]"
                    @click="aiVisualizationType = 'DOUGHNUT'; renderAiChart()"
                  >
                    Biểu đồ vòng
                  </button>
                </div>
              </div>

              <!-- Chart Visualization -->
              <div v-if="aiVisualizationType !== 'TABLE'" class="chart-visualization">
                <canvas ref="aiChartCanvas"></canvas>
              </div>

              <!-- Table View -->
              <div v-if="aiVisualizationType === 'TABLE'" class="table-wrapper">
                <table class="results-table">
                  <thead>
                    <tr>
                      <th v-for="col in aiQueryResult.columns" :key="col.name">
                        {{ col.displayName }}
                        <span class="column-type">{{ col.dataType }}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, index) in aiQueryResult.rows" :key="index">
                      <td v-for="col in aiQueryResult.columns" :key="col.name">
                        {{ formatValue(row[col.name]) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- AI Error Display -->
          <div v-if="aiError" class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ aiError }}
          </div>
        </div>
      </div>

      <!-- Visual Query Builder Tab -->
      <div v-if="activeTab === 'visual'" class="visual-query-tab">
        <div class="coming-soon-card">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <h2>Truy vấn trực quan</h2>
          <p>Tính năng này đang được phát triển. Bạn có thể sử dụng SQL Editor để tạo truy vấn tùy chỉnh.</p>
        </div>
      </div>

      <!-- SQL Editor Tab -->
      <div v-if="activeTab === 'sql'" class="sql-editor-tab">
        <div class="sql-editor-layout">
          <!-- Database Schema Sidebar -->
          <div v-if="showSchemaSidebar" class="schema-sidebar">
            <div class="schema-header">
              <h4>Database Schema</h4>
              <button class="btn-close-sidebar" @click="showSchemaSidebar = false" title="Ẩn sidebar">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="schema-search">
              <input 
                v-model="schemaSearchQuery" 
                type="text" 
                class="schema-search-input" 
                placeholder="Tìm kiếm bảng..."
              />
            </div>

            <div v-if="loadingSchema" class="schema-loading">
              <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"/>
                <line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                <line x1="2" y1="12" x2="6" y2="12"/>
                <line x1="18" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
              </svg>
              <p>Đang tải schema...</p>
            </div>

            <div v-else class="tables-list">
              <div v-for="table in filteredTables" :key="table.tableName" class="table-item">
                <div class="table-header" @click="toggleTableExpansion(table.tableName)">
                  <svg 
                    class="expand-icon" 
                    :class="{ expanded: expandedTables.has(table.tableName) }"
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  <span class="table-name" @click.stop="insertIntoEditor(table.tableName)">
                    {{ table.tableName }}
                  </span>
                  <span class="column-count">{{ table.columns.length }}</span>
                </div>

                <div v-if="expandedTables.has(table.tableName)" class="columns-list">
                  <div 
                    v-for="column in table.columns" 
                    :key="column.columnName"
                    class="column-item"
                    @click="insertIntoEditor(column.columnName)"
                  >
                    <svg 
                      v-if="column.primaryKey" 
                      class="key-icon" 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="12" 
                      height="12" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      stroke-width="2" 
                      stroke-linecap="round" 
                      stroke-linejoin="round"
                    >
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                    </svg>
                    <span class="column-name">{{ column.columnName }}</span>
                    <span class="column-type">{{ column.dataType }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Editor Area -->
          <div class="editor-main">
            <div class="editor-container">
              <div class="editor-header">
                <h3>
                  <button 
                    v-if="!showSchemaSidebar" 
                    class="btn-show-sidebar" 
                    @click="showSchemaSidebar = true"
                    title="Hiện sidebar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="9" y1="3" x2="9" y2="21"/>
                    </svg>
                  </button>
                  SQL Query Editor
                </h3>
                <div class="editor-toolbar">
                  <!-- Templates Dropdown -->
                  <div class="dropdown-wrapper">
                    <button 
                      class="btn-toolbar" 
                      @click="showTemplatesDropdown = !showTemplatesDropdown"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                      </svg>
                      Templates
                    </button>
                    <div v-if="showTemplatesDropdown" class="dropdown-menu">
                      <div class="dropdown-header">
                        <span>SQL Templates</span>
                        <button class="btn-close-sidebar" @click="showTemplatesDropdown = false">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                      <div class="dropdown-body">
                        <button 
                          v-for="template in sqlTemplates" 
                          :key="template.name"
                          class="template-item"
                          @click="loadTemplate(template)"
                        >
                          <div>
                            <div style="font-weight: 600; margin-bottom: 4px;">{{ template.name }}</div>
                            <div style="font-size: 11px; color: #999;">{{ template.description }}</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- History Dropdown -->
                  <div class="dropdown-wrapper">
                    <button 
                      class="btn-toolbar" 
                      @click="showHistoryDropdown = !showHistoryDropdown"
                      :disabled="queryHistory.length === 0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      History
                    </button>
                    <div v-if="showHistoryDropdown" class="dropdown-menu">
                      <div class="dropdown-header">
                        <span>Query History</span>
                        <div style="display: flex; gap: 8px;">
                          <button class="btn-close-sidebar" @click="clearQueryHistory" title="Xóa tất cả">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                          <button class="btn-close-sidebar" @click="showHistoryDropdown = false">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div class="dropdown-body">
                        <button 
                          v-for="(item, index) in queryHistory" 
                          :key="index"
                          class="history-item"
                          @click="loadFromHistory(item)"
                        >
                          <div style="flex: 1;">
                            <div class="history-sql">{{ item.sql.substring(0, 60) }}{{ item.sql.length > 60 ? '...' : '' }}</div>
                            <div class="history-meta">
                              <span>{{ formatHistoryTime(item.timestamp) }}</span>
                              <span>{{ item.executionTime }}ms</span>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="toolbar-divider"></div>

                  <!-- Format Button -->
                  <button 
                    class="btn-toolbar" 
                    @click="formatSqlCode"
                    :disabled="!sqlQuery.trim()"
                    title="Format SQL"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="16 18 22 12 16 6"/>
                      <polyline points="8 6 2 12 8 18"/>
                    </svg>
                    Format
                  </button>

                  <!-- Copy SQL Button -->
                  <button 
                    class="btn-toolbar" 
                    @click="copySqlToClipboard"
                    :disabled="!sqlQuery.trim()"
                    title="Copy SQL"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy
                  </button>

                  <!-- Clear Button -->
                  <button 
                    class="btn-toolbar" 
                    @click="clearSqlEditor"
                    :disabled="!sqlQuery.trim()"
                    title="Clear editor"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Clear
                  </button>

                  <div class="toolbar-divider"></div>

                  <!-- Save Button -->
                  <button class="btn-save" @click="openSaveDialog" :disabled="!sqlQuery.trim()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Lưu
                  </button>

                  <!-- Execute Button -->
                  <button class="btn-execute" @click="executeQuery" :disabled="loading || !sqlQuery.trim()">
                    <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    <svg v-else class="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="2" x2="12" y2="6"/>
                      <line x1="12" y1="18" x2="12" y2="22"/>
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                      <line x1="2" y1="12" x2="6" y2="12"/>
                      <line x1="18" y1="12" x2="22" y2="12"/>
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                    </svg>
                    {{ loading ? 'Đang thực thi...' : 'Thực thi' }}
                  </button>
                </div>
              </div>
              
              <textarea 
                ref="sqlTextarea"
                v-model="sqlQuery" 
                class="sql-textarea"
                placeholder="Nhập lệnh truy vấn..."
                spellcheck="false"
              ></textarea>

          <!-- Error Display -->
          <div v-if="error" class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>

          <!-- Query Results -->
          <div v-if="queryResult" class="results-container">
            <div class="results-header">
              <div>
                <h3>Kết quả truy vấn</h3>
                <div class="results-meta">
                  <span class="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                    {{ queryResult.totalRows }} dòng
                  </span>
                  <span class="meta-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ queryResult.executionTimeMs }}ms
                  </span>
                </div>
              </div>
              <div class="results-actions">
                <button class="btn-copy-results" @click="copyResultsAsCSV" title="Copy as CSV">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy CSV
                </button>
              </div>
            </div>

            <!-- Visualization Type Selector -->
            <div class="visualization-selector">
              <label>Hiển thị:</label>
              <div class="viz-buttons">
                <button 
                  :class="['viz-btn', { active: currentVisualizationType === 'TABLE' }]"
                  @click="currentVisualizationType = 'TABLE'"
                >
                  Bảng
                </button>
                <button 
                  :class="['viz-btn', { active: currentVisualizationType === 'BAR' }]"
                  @click="currentVisualizationType = 'BAR'; renderQueryChart()"
                >
                  Biểu đồ cột
                </button>
                <button 
                  :class="['viz-btn', { active: currentVisualizationType === 'LINE' }]"
                  @click="currentVisualizationType = 'LINE'; renderQueryChart()"
                >
                  Biểu đồ đường
                </button>
                <button 
                  :class="['viz-btn', { active: currentVisualizationType === 'PIE' }]"
                  @click="currentVisualizationType = 'PIE'; renderQueryChart()"
                >
                  Biểu đồ tròn
                </button>
                <button 
                  :class="['viz-btn', { active: currentVisualizationType === 'DOUGHNUT' }]"
                  @click="currentVisualizationType = 'DOUGHNUT'; renderQueryChart()"
                >
                  Biểu đồ vòng
                </button>
              </div>
            </div>

            <!-- Chart Visualization -->
            <div v-if="currentVisualizationType !== 'TABLE'" class="chart-visualization">
              <canvas ref="queryChartCanvas"></canvas>
            </div>

            <!-- Table View -->
            <div v-if="currentVisualizationType === 'TABLE'" class="table-wrapper">
              <table class="results-table">
                <thead>
                  <tr>
                    <th v-for="col in queryResult.columns" :key="col.name">
                      {{ col.displayName }}
                      <span class="column-type">{{ col.dataType }}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in queryResult.rows" :key="index">
                    <td v-for="col in queryResult.columns" :key="col.name">
                      {{ formatValue(row[col.name]) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Generated SQL -->
            <details class="generated-sql">
              <summary>SQL đã tạo</summary>
              <pre><code>{{ queryResult.generatedSql }}</code></pre>
            </details>
          </div>
            </div>
          </div>
        </div>

        <!-- Copy Success Toast -->
        <div v-if="showCopySuccess" class="copy-success-toast">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Đã copy vào clipboard!
        </div>
      </div>

      <!-- Saved Queries Tab -->
      <div v-if="activeTab === 'saved'" class="saved-queries-tab">
        <div class="saved-queries-header">
          <button 
            class="btn-manage-queries" 
            @click="openManageQueriesModal"
            title="Quản lý truy vấn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Quản lý truy vấn
          </button>
          <button 
            class="btn-create-dashboard" 
            @click="openCreateDashboardModal"
            title="Tạo dashboard mới"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tạo Dashboard
          </button>
        </div>
        
        <div v-if="loadingSavedQueries" class="loading-container">
          <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
            <line x1="2" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
          </svg>
          <p>Đang tải danh sách truy vấn...</p>
        </div>

        <div v-else-if="savedQueries.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <h2>Chưa có truy vấn đã lưu</h2>
          <p>Tạo truy vấn trong SQL Editor và nhấn "Lưu truy vấn" để lưu lại.</p>
        </div>

        <div v-else class="saved-queries-content">
          <!-- Dashboards List -->
          <div v-if="loadingDashboards" class="loading-container">
            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
            </svg>
            <p>Đang tải dashboards...</p>
          </div>

          <div v-else-if="dashboards.length === 0" class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <h2>Chưa có dashboard nào</h2>
            <p>Tạo dashboard đầu tiên của bạn để bắt đầu trực quan hóa dữ liệu</p>
            <button class="btn-create-first" @click="openCreateDashboardModal">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tạo Dashboard Đầu Tiên
            </button>
          </div>

          <div v-else class="dashboards-grid">
            <div 
              v-for="dashboard in dashboards" 
              :key="dashboard.id"
              class="dashboard-card"
              @click="openDashboard(dashboard.id)"
            >
              <div class="dashboard-card-header">
                <div class="dashboard-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </div>
                <button 
                  class="btn-delete-card" 
                  @click.stop="deleteDashboard(dashboard.id)"
                  title="Xóa dashboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
              <div class="dashboard-card-body">
                <h3>{{ dashboard.dashboardName }}</h3>
                <p v-if="dashboard.description">{{ dashboard.description }}</p>
                <p v-else class="no-description">Chưa có mô tả</p>
              </div>
              <div class="dashboard-card-footer">
                <span class="dashboard-date">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ formatDate(dashboard.updatedAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Query Dialog -->
    <div v-if="showSaveDialog" class="modal-overlay" @click="closeSaveDialog">

      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Lưu truy vấn</h2>
          <button class="btn-close" @click="closeSaveDialog">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Tên truy vấn <span class="required">*</span></label>
            <input 
              v-model="saveQueryName" 
              type="text" 
              placeholder="Ví dụ: Báo cáo doanh thu tháng"
              class="form-input"
              maxlength="100"
            />
          </div>

          <div class="form-group">
            <label>Mô tả</label>
            <textarea 
              v-model="saveQueryDescription" 
              placeholder="Mô tả ngắn gọn về truy vấn này..."
              class="form-textarea"
              rows="3"
              maxlength="500"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Loại hiển thị</label>
            <select v-model="saveVisualizationType" class="form-select">
              <option value="TABLE">Bảng</option>
              <option value="BAR">Biểu đồ cột</option>
              <option value="LINE">Biểu đồ đường</option>
              <option value="PIE">Biểu đồ tròn</option>
              <option value="DOUGHNUT">Biểu đồ vòng</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeSaveDialog" :disabled="savingQuery">
            Hủy
          </button>
          <button class="btn-confirm" @click="saveQuery" :disabled="savingQuery || !saveQueryName.trim()">
            <svg v-if="!savingQuery" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else class="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
            </svg>
            {{ savingQuery ? 'Đang lưu...' : 'Lưu truy vấn' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Detail View Modal -->
    <div v-if="showDetailModal && detailQuery" class="modal-overlay detail-modal-overlay" @click="closeDetailView">
      <div class="detail-modal-content" @click.stop>
        <div class="detail-modal-header">
          <div class="detail-header-info">
            <h2>{{ detailQuery.name }}</h2>
            <span class="detail-viz-badge">{{ detailQuery.visualizationType }}</span>
          </div>
          <button class="btn-close" @click="closeDetailView">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div v-if="detailQuery.description" class="detail-description">
          {{ detailQuery.description }}
        </div>

        <div v-if="detailQueryResult" class="detail-modal-body">
          <div class="detail-stats">
            <span class="detail-stat">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
              {{ detailQueryResult.totalRows }} dòng
            </span>
            <span class="detail-stat">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {{ detailQueryResult.executionTimeMs }}ms
            </span>
          </div>

          <!-- Chart View -->
          <div v-if="detailQuery.visualizationType !== 'TABLE'" class="detail-chart-container">
            <canvas ref="detailChartCanvas"></canvas>
          </div>

          <!-- Table View -->
          <div v-if="detailQuery.visualizationType === 'TABLE'" class="detail-table-wrapper">
            <table class="detail-table">
              <thead>
                <tr>
                  <th v-for="col in detailQueryResult.columns" :key="col.name">
                    {{ col.displayName }}
                    <span class="column-type">{{ col.dataType }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in detailQueryResult.rows" :key="index">
                  <td v-for="col in detailQueryResult.columns" :key="col.name">
                    {{ formatValue(row[col.name]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="detail-loading">
          <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
            <line x1="2" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
          </svg>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Create Dashboard Modal -->
  <div v-if="showCreateDashboardModal" class="modal-overlay" @click="showCreateDashboardModal = false">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Tạo Dashboard Mới</h3>
        <button class="btn-close" @click="showCreateDashboardModal = false">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label>Tên Dashboard *</label>
          <input 
            v-model="newDashboardName" 
            type="text" 
            placeholder="Ví dụ: Báo cáo doanh thu"
            class="form-input"
            @keyup.enter="createDashboard"
          />
        </div>
        
        <div class="form-group">
          <label>Mô tả</label>
          <textarea 
            v-model="newDashboardDescription" 
            placeholder="Mô tả ngắn gọn về dashboard này"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="showCreateDashboardModal = false">
          Hủy
        </button>
        <button 
          class="btn-save" 
          @click="createDashboard"
          :disabled="creatingDashboard || !newDashboardName.trim()"
        >
          {{ creatingDashboard ? 'Đang tạo...' : 'Tạo Dashboard' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Manage Queries Modal -->
  <div v-if="showManageQueriesModal" class="modal-overlay" @click="closeManageQueriesModal">
    <div class="modal-content modal-large" @click.stop>
      <div class="modal-header">
        <h3>Quản lý truy vấn</h3>
        <button class="btn-close" @click="closeManageQueriesModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div v-if="loadingSavedQueries" class="loading-container">
          <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
            <line x1="2" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
          </svg>
          <p>Đang tải danh sách truy vấn...</p>
        </div>

        <div v-else-if="savedQueries.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <h2>Chưa có truy vấn đã lưu</h2>
          <p>Tạo truy vấn trong SQL Editor hoặc AI Assistant và nhấn "Lưu" để lưu lại.</p>
        </div>

        <div v-else class="queries-list">
          <div 
            v-for="query in savedQueries" 
            :key="query.id"
            class="query-item"
          >
            <div class="query-item-header">
              <div class="query-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
              </div>
              <div class="query-info">
                <input 
                  v-if="editingQueryId === query.id"
                  v-model="editQueryName"
                  type="text"
                  class="query-name-input"
                  placeholder="Tên truy vấn"
                  @keyup.enter="saveQueryEdit(query.id)"
                  @keyup.esc="cancelQueryEdit"
                />
                <h4 v-else>{{ query.name }}</h4>
                
                <textarea 
                  v-if="editingQueryId === query.id"
                  v-model="editQueryDescription"
                  class="query-description-input"
                  placeholder="Mô tả truy vấn"
                  rows="2"
                ></textarea>
                <p v-else>{{ query.description || 'Chưa có mô tả' }}</p>
                
                <div class="query-meta">
                  <span class="query-type-badge">{{ getVisualizationTypeLabel(query.visualizationType) }}</span>
                  <span class="query-date">{{ formatDate(query.updatedAt) }}</span>
                </div>
              </div>
            </div>
            
            <div class="query-actions">
              <button 
                v-if="editingQueryId === query.id"
                class="btn-action btn-save-edit"
                @click="saveQueryEdit(query.id)"
                :disabled="updatingQueryId === query.id"
                title="Lưu thay đổi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
              <button 
                v-if="editingQueryId === query.id"
                class="btn-action btn-cancel-edit"
                @click="cancelQueryEdit"
                title="Hủy"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              
              <button 
                v-if="editingQueryId !== query.id"
                class="btn-action btn-edit"
                @click="startEditQuery(query)"
                title="Chỉnh sửa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button 
                v-if="editingQueryId !== query.id"
                class="btn-action btn-delete"
                @click="deleteQueryFromManage(query.id)"
                :disabled="deletingQueryId === query.id"
                title="Xóa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="closeManageQueriesModal">
          Đóng
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import { queryBuilderService, type QueryRequest, type QueryResponse, type SavedQuery, type SavedQueryRequest, type AiQueryRequest, type AiQueryResponse, type DashboardLayoutRequest, type DashboardRequest, type DashboardResponse, type TableMetadata } from '@/services/queryBuilderService'
import { Chart, registerables } from 'chart.js'
import { GridLayout, GridItem } from 'vue-grid-layout'
import { format as formatSql } from 'sql-formatter'

Chart.register(...registerables)

const router = useRouter()

const activeTab = ref<'ai' | 'visual' | 'sql' | 'saved'>('ai')
const sqlQuery = ref('')
const sqlTextarea = ref<HTMLTextAreaElement | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const queryResult = ref<QueryResponse | null>(null)

// Database Schema Sidebar
const showSchemaSidebar = ref(true)
const databaseTables = ref<TableMetadata[]>([])
const loadingSchema = ref(false)
const schemaSearchQuery = ref('')
const expandedTables = ref<Set<string>>(new Set())

// SQL Templates
const showTemplatesDropdown = ref(false)
const sqlTemplates: Array<{ name: string; description: string; sql: string }> = [
  {
    name: 'Top 10 hóa đơn cao nhất',
    description: 'Xem 10 hóa đơn có giá trị cao nhất đã thanh toán',
    sql: `SELECT TOP 10
  invoice_code AS [Mã Hóa Đơn],
  total_amount AS [Tổng Tiền],
  created_at AS [Ngày Tạo]
FROM Invoice
WHERE invoice_status = 'PAID'
ORDER BY total_amount DESC`
  },
  {
    name: 'Doanh thu theo ngày',
    description: 'Thống kê doanh thu và số hóa đơn theo từng ngày (30 ngày gần nhất)',
    sql: `SELECT 
  CAST(created_at AS DATE) AS [Ngày],
  SUM(total_amount) AS [Tổng Doanh Thu],
  COUNT(*) AS [Số Hóa Đơn]
FROM Invoice
WHERE invoice_status = 'PAID'
  AND created_at >= DATEADD(DAY, -30, GETDATE())
GROUP BY CAST(created_at AS DATE)
ORDER BY [Ngày] DESC`
  },
  {
    name: 'Sản phẩm bán chạy',
    description: 'Top 10 sản phẩm có số lượng bán nhiều nhất (30 ngày gần nhất)',
    sql: `SELECT TOP 10
  p.product_name AS [Tên Sản Phẩm],
  SUM(ii.quantity) AS [Số Lượng Bán],
  SUM(ii.quantity * ii.price) AS [Doanh Thu]
FROM InvoiceItem ii
JOIN Product p ON ii.product_id = p.id
JOIN Invoice i ON ii.invoice_id = i.id
WHERE i.invoice_status = 'PAID'
  AND i.created_at >= DATEADD(DAY, -30, GETDATE())
GROUP BY p.product_name
ORDER BY [Số Lượng Bán] DESC`
  },
  {
    name: 'Khách hàng thân thiết',
    description: 'Top 10 khách hàng có tổng chi tiêu cao nhất',
    sql: `SELECT TOP 10
  c.full_name AS [Tên Khách Hàng],
  c.phone_number AS [Số Điện Thoại],
  COUNT(i.id) AS [Số Lần Đặt],
  SUM(i.total_amount) AS [Tổng Chi Tiêu]
FROM Customer c
JOIN Invoice i ON c.id = i.customer_id
WHERE i.invoice_status = 'PAID'
GROUP BY c.full_name, c.phone_number
ORDER BY [Tổng Chi Tiêu] DESC`
  },
  {
    name: 'Trạng thái bàn hiện tại',
    description: 'Xem trạng thái hiện tại của tất cả các bàn',
    sql: `SELECT 
  table_number AS [Số Bàn],
  capacity AS [Sức Chứa],
  CASE status
    WHEN 'AVAILABLE' THEN N'Trống'
    WHEN 'OCCUPIED' THEN N'Đang Dùng'
    WHEN 'RESERVED' THEN N'Đã Đặt'
    WHEN 'CLEANING' THEN N'Đang Dọn'
    ELSE N'Không Xác Định'
  END AS [Trạng Thái]
FROM DiningTable
ORDER BY table_number`
  },
  {
    name: 'Doanh thu theo kênh',
    description: 'Thống kê doanh thu theo từng kênh bán hàng',
    sql: `SELECT 
  CASE invoice_channel
    WHEN 'WALK_IN' THEN N'Khách Vãng Lai'
    WHEN 'ONLINE_RESERVATION' THEN N'Đặt Bàn Online'
    WHEN 'PHONE_RESERVATION' THEN N'Đặt Bàn Điện Thoại'
    ELSE N'Khác'
  END AS [Kênh],
  COUNT(*) AS [Số Hóa Đơn],
  SUM(total_amount) AS [Doanh Thu]
FROM Invoice
WHERE invoice_status = 'PAID'
GROUP BY invoice_channel
ORDER BY [Doanh Thu] DESC`
  }
]

// Query History
const queryHistory = ref<Array<{sql: string, timestamp: number, executionTime: number}>>([])
const showHistoryDropdown = ref(false)
const MAX_HISTORY_ITEMS = 20

// Copy to clipboard
const showCopySuccess = ref(false)

// AI Assistant State
const aiQuestion = ref('')
const aiLoading = ref(false)
const aiError = ref<string | null>(null)
const aiResponse = ref<AiQueryResponse | null>(null)
const aiExecuting = ref(false)
const showAiSql = ref(false)
const showHistory = ref(false)

interface AiHistoryItem {
  id: number
  question: string
  response: AiQueryResponse
  timestamp: number
}

const HISTORY_KEY = 'ai_query_history'
const MAX_HISTORY = 20

const loadHistory = (): AiHistoryItem[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch { return [] }
}

const aiHistory = ref<AiHistoryItem[]>(loadHistory())

const saveHistory = () => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(aiHistory.value))
}

const formatHistoryTime = (timestamp: number): string => {
  const d = new Date(timestamp)
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60000) return 'Vừa xong'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const restoreFromHistory = (item: AiHistoryItem) => {
  aiQuestion.value = item.question
  aiResponse.value = item.response
  aiQueryResult.value = null
  showHistory.value = false
  showAiSql.value = false
}

const deleteHistoryItem = (id: number) => {
  aiHistory.value = aiHistory.value.filter(h => h.id !== id)
  saveHistory()
}

const clearHistory = () => {
  aiHistory.value = []
  localStorage.removeItem(HISTORY_KEY)
}
const aiQueryResult = ref<QueryResponse | null>(null)

// Save Query Dialog
const showSaveDialog = ref(false)
const saveQueryName = ref('')
const saveQueryDescription = ref('')
const saveVisualizationType = ref<'TABLE' | 'BAR' | 'LINE' | 'PIE' | 'DOUGHNUT'>('TABLE')
const savingQuery = ref(false)

// Saved Queries
const savedQueries = ref<SavedQuery[]>([])
const loadingSavedQueries = ref(false)
const executingQueryId = ref<number | null>(null)
const deletingQueryId = ref<number | null>(null)

// Saved query results cache
const savedQueryResults = ref<Map<number, QueryResponse>>(new Map())
const savedQueryCharts = ref<Map<number, Chart>>(new Map())

// Dashboard state
const dashboardEditMode = ref(false)
const dashboardLayouts = ref<any[]>([])
const gridLayout = ref<any[]>([])
const widgetCharts = ref<Map<string, Chart>>(new Map())

// Dashboard management state
const dashboards = ref<DashboardResponse[]>([])
const selectedDashboardId = ref<number | null>(null)
const showCreateDashboardModal = ref(false)
const newDashboardName = ref('')
const newDashboardDescription = ref('')
const creatingDashboard = ref(false)
const loadingDashboards = ref(false)

// Manage Queries Modal state
const showManageQueriesModal = ref(false)
const editingQueryId = ref<number | null>(null)
const editQueryName = ref('')
const editQueryDescription = ref('')
const updatingQueryId = ref<number | null>(null)

// Detail view modal
const showDetailModal = ref(false)
const detailQuery = ref<SavedQuery | null>(null)
const detailQueryResult = ref<QueryResponse | null>(null)
const detailChartCanvas = ref<HTMLCanvasElement | null>(null)
let detailChart: Chart | null = null

// Chart instances
const queryChartCanvas = ref<HTMLCanvasElement | null>(null)
const aiChartCanvas = ref<HTMLCanvasElement | null>(null)
let queryChart: Chart | null = null
let aiChart: Chart | null = null

// Current visualization type for executed queries
const currentVisualizationType = ref<'TABLE' | 'BAR' | 'LINE' | 'PIE' | 'DOUGHNUT'>('TABLE')
const aiVisualizationType = ref<'TABLE' | 'BAR' | 'LINE' | 'PIE' | 'DOUGHNUT'>('TABLE')

const askAiQuestion = async () => {
  if (!aiQuestion.value.trim()) return

  aiLoading.value = true
  aiError.value = null
  aiResponse.value = null
  aiQueryResult.value = null

  try {
    const request: AiQueryRequest = {
      question: aiQuestion.value
    }

    const result = await queryBuilderService.generateSqlFromQuestion(request)
    aiResponse.value = result
    // Lưu vào lịch sử
    aiHistory.value.unshift({ id: Date.now(), question: aiQuestion.value, response: result, timestamp: Date.now() })
    if (aiHistory.value.length > MAX_HISTORY) aiHistory.value = aiHistory.value.slice(0, MAX_HISTORY)
    saveHistory()
  } catch (err: any) {
    aiError.value = err.response?.data?.message || 'Lỗi khi tạo SQL từ câu hỏi'
    console.error('AI query generation error:', err)
  } finally {
    aiLoading.value = false
  }
}

const executeAiGeneratedSql = async () => {
  if (!aiResponse.value?.generatedSql) return

  aiExecuting.value = true
  aiError.value = null
  aiQueryResult.value = null

  try {
    const request: QueryRequest = {
      queryType: 'SQL',
      visualQuery: null,
      sqlQuery: aiResponse.value.generatedSql
    }

    const result = await queryBuilderService.executeQuery(request)
    aiQueryResult.value = result
    aiVisualizationType.value = saveVisualizationType.value
    
    // Render chart if visualization type is not TABLE
    if (aiVisualizationType.value !== 'TABLE') {
      await nextTick()
      renderAiChart()
    }
  } catch (err: any) {
    aiError.value = err.response?.data?.message || 'Lỗi khi thực thi truy vấn AI'
    console.error('AI query execution error:', err)
  } finally {
    aiExecuting.value = false
  }
}

const openSaveDialogForAi = () => {
  if (!aiResponse.value?.generatedSql) {
    aiError.value = 'Không có SQL để lưu'
    return
  }
  
  // Set SQL query from AI response
  sqlQuery.value = aiResponse.value.generatedSql
  
  // Pre-fill save dialog with AI question as name
  saveQueryName.value = aiQuestion.value.substring(0, 100)
  saveQueryDescription.value = aiResponse.value.explanation || ''
  saveVisualizationType.value = 'TABLE'
  showSaveDialog.value = true
}

const executeQuery = async () => {
  if (!sqlQuery.value.trim()) return

  loading.value = true
  error.value = null
  queryResult.value = null

  try {
    const request: QueryRequest = {
      queryType: 'SQL',
      visualQuery: null,
      sqlQuery: sqlQuery.value
    }

    const result = await queryBuilderService.executeQuery(request)
    queryResult.value = result
    currentVisualizationType.value = saveVisualizationType.value
    
    // Save to history
    saveToHistory(sqlQuery.value, result.executionTimeMs)
    
    // Render chart if visualization type is not TABLE
    if (currentVisualizationType.value !== 'TABLE') {
      await nextTick()
      renderQueryChart()
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Lỗi khi thực thi truy vấn'
    console.error('Query execution error:', err)
  } finally {
    loading.value = false
  }
}

const openSaveDialog = () => {
  if (!sqlQuery.value.trim()) {
    error.value = 'Vui lòng nhập câu lệnh SQL trước khi lưu'
    return
  }
  saveQueryName.value = ''
  saveQueryDescription.value = ''
  saveVisualizationType.value = 'TABLE'
  showSaveDialog.value = true
}

const closeSaveDialog = () => {
  showSaveDialog.value = false
  saveQueryName.value = ''
  saveQueryDescription.value = ''
}

const saveQuery = async () => {
  if (!saveQueryName.value.trim()) {
    alert('Vui lòng nhập tên truy vấn')
    return
  }

  savingQuery.value = true
  try {
    const request: SavedQueryRequest = {
      name: saveQueryName.value,
      description: saveQueryDescription.value || null,
      query: {
        queryType: 'SQL',
        visualQuery: null,
        sqlQuery: sqlQuery.value
      },
      visualizationType: saveVisualizationType.value
    }

    await queryBuilderService.saveQuery(request)
    closeSaveDialog()
    
    // Show success message
    error.value = null
    aiError.value = null
    alert('Lưu truy vấn thành công!')
    
    // Reload saved queries if on that tab
    if (activeTab.value === 'saved') {
      await loadSavedQueries()
    }
  } catch (err: any) {
    alert(err.response?.data?.message || 'Lỗi khi lưu truy vấn')
    console.error('Save query error:', err)
  } finally {
    savingQuery.value = false
  }
}

const loadSavedQueries = async () => {
  loadingSavedQueries.value = true
  try {
    savedQueries.value = await queryBuilderService.getMyQueries()
    
    // Auto-execute all saved queries to show preview
    for (const query of savedQueries.value) {
      executeQueryPreview(query)
    }
  } catch (err: any) {
    console.error('Load saved queries error:', err)
    error.value = err.response?.data?.message || 'Lỗi khi tải danh sách truy vấn'
  } finally {
    loadingSavedQueries.value = false
  }
}

const executeQueryPreview = async (query: SavedQuery) => {
  try {
    const result = await queryBuilderService.executeSavedQuery(query.id)
    savedQueryResults.value.set(query.id, result)
    
    // Render chart preview after a short delay
    await nextTick()
    renderSavedQueryChart(query.id, query.visualizationType as any)
  } catch (err: any) {
    console.error(`Error executing preview for query ${query.id}:`, err)
  }
}

const renderSavedQueryChart = (queryId: number, vizType: string) => {
  if (vizType === 'TABLE') return
  
  const canvasId = `saved-chart-${queryId}`
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement
  if (!canvas) return
  
  const result = savedQueryResults.value.get(queryId)
  if (!result) return
  
  // Destroy existing chart
  const existingChart = savedQueryCharts.value.get(queryId)
  if (existingChart) {
    existingChart.destroy()
  }
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  renderChart(ctx, result, vizType, (chart) => {
    savedQueryCharts.value.set(queryId, chart)
  })
}

const openDetailView = (query: SavedQuery) => {
  detailQuery.value = query
  detailQueryResult.value = savedQueryResults.value.get(query.id) || null
  showDetailModal.value = true
  
  // Render detail chart
  if (query.visualizationType !== 'TABLE' && detailQueryResult.value) {
    nextTick(() => {
      renderDetailChart()
    })
  }
}

const closeDetailView = () => {
  showDetailModal.value = false
  detailQuery.value = null
  detailQueryResult.value = null
  if (detailChart) {
    detailChart.destroy()
    detailChart = null
  }
}

const renderDetailChart = () => {
  if (!detailChartCanvas.value || !detailQueryResult.value || !detailQuery.value) return
  
  if (detailChart) {
    detailChart.destroy()
  }
  
  const ctx = detailChartCanvas.value.getContext('2d')
  if (!ctx) return
  
  renderChart(ctx, detailQueryResult.value, detailQuery.value.visualizationType, (chart) => {
    detailChart = chart
  })
}

const renderQueryChart = () => {
  if (!queryChartCanvas.value || !queryResult.value || currentVisualizationType.value === 'TABLE') return
  
  // Destroy existing chart
  if (queryChart) {
    queryChart.destroy()
  }
  
  const ctx = queryChartCanvas.value.getContext('2d')
  if (!ctx) return
  
  renderChart(ctx, queryResult.value, currentVisualizationType.value, (chart) => {
    queryChart = chart
  })
}

const renderAiChart = () => {
  if (!aiChartCanvas.value || !aiQueryResult.value || aiVisualizationType.value === 'TABLE') return
  
  // Destroy existing chart
  if (aiChart) {
    aiChart.destroy()
  }
  
  const ctx = aiChartCanvas.value.getContext('2d')
  if (!ctx) return
  
  renderChart(ctx, aiQueryResult.value, aiVisualizationType.value, (chart) => {
    aiChart = chart
  })
}

const renderChart = (ctx: CanvasRenderingContext2D, data: QueryResponse, vizType: string, setChart: (chart: Chart) => void) => {
  if (!data.rows || data.rows.length === 0) return
  
  // Extract labels and values from first two columns
  const firstCol = data.columns[0]?.name
  const secondCol = data.columns[1]?.name
  
  if (!firstCol || !secondCol) return
  
  const labels = data.rows.map(row => String(row[firstCol]))
  const values = data.rows.map(row => {
    const val = row[secondCol]
    return typeof val === 'number' ? val : parseFloat(String(val)) || 0
  })
  
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe', 
    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
  ]
  
  let chartConfig: any = {
    data: {
      labels,
      datasets: [{
        label: secondCol,
        data: values,
        backgroundColor: vizType === 'PIE' || vizType === 'DOUGHNUT' 
          ? colors 
          : 'rgba(102, 126, 234, 0.8)',
        borderColor: vizType === 'PIE' || vizType === 'DOUGHNUT'
          ? '#fff'
          : '#667eea',
        borderWidth: vizType === 'PIE' || vizType === 'DOUGHNUT' ? 3 : 2,
        borderRadius: vizType === 'BAR' ? 6 : 0,
        tension: 0.4,
        fill: vizType === 'LINE',
        pointRadius: vizType === 'LINE' ? 4 : 0,
        pointHoverRadius: vizType === 'LINE' ? 6 : 0,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: vizType === 'PIE' || vizType === 'DOUGHNUT',
          position: 'bottom',
          labels: {
            padding: 15,
            font: { size: 13, weight: '600' },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          callbacks: {
            label: (context: any) => {
              const label = context.label || ''
              const value = typeof context.parsed === 'number' 
                ? context.parsed.toLocaleString('vi-VN')
                : (context.parsed.y || context.parsed).toLocaleString('vi-VN')
              return `${label}: ${value}`
            }
          }
        }
      }
    }
  }
  
  // Type-specific configuration
  if (vizType === 'BAR') {
    chartConfig.type = 'bar'
    chartConfig.options.scales = {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        grid: { display: false }
      }
    }
  } else if (vizType === 'LINE') {
    chartConfig.type = 'line'
    chartConfig.data.datasets[0].backgroundColor = 'rgba(102, 126, 234, 0.1)'
    chartConfig.options.scales = {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        grid: { display: false }
      }
    }
  } else if (vizType === 'PIE') {
    chartConfig.type = 'pie'
  } else if (vizType === 'DOUGHNUT') {
    chartConfig.type = 'doughnut'
  }
  
  const chart = new Chart(ctx, chartConfig)
  setChart(chart)
}

const loadAndExecuteSavedQuery = async (query: SavedQuery) => {
  executingQueryId.value = query.id
  error.value = null
  queryResult.value = null

  try {
    // Load query definition
    const queryDef = await queryBuilderService.getQueryDefinition(query.id)
    
    // Set SQL query in editor
    if (queryDef.sqlQuery) {
      sqlQuery.value = queryDef.sqlQuery
    }
    
    // Set visualization type from saved query
    currentVisualizationType.value = query.visualizationType as any
    saveVisualizationType.value = query.visualizationType as any
    
    // Execute the query
    const result = await queryBuilderService.executeSavedQuery(query.id)
    queryResult.value = result
    
    // Render chart if visualization type is not TABLE
    if (currentVisualizationType.value !== 'TABLE') {
      await nextTick()
      renderQueryChart()
    }
    
    // Switch to SQL tab to show results
    activeTab.value = 'sql'
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Lỗi khi thực thi truy vấn đã lưu'
    console.error('Execute saved query error:', err)
  } finally {
    executingQueryId.value = null
  }
}

const deleteSavedQuery = async (queryId: number) => {
  if (!confirm('Bạn có chắc chắn muốn xóa truy vấn này?')) {
    return
  }

  deletingQueryId.value = queryId
  try {
    await queryBuilderService.deleteQuery(queryId)
    await loadSavedQueries()
  } catch (err: any) {
    alert(err.response?.data?.message || 'Lỗi khi xóa truy vấn')
    console.error('Delete query error:', err)
  } finally {
    deletingQueryId.value = null
  }
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const getVisualizationIcon = (type: string): string => {
  switch (type) {
    case 'BAR': return '📊'
    case 'LINE': return '📈'
    case 'PIE': return '🥧'
    case 'DOUGHNUT': return '🍩'
    default: return '📋'
  }
}

// ========================================
// SQL EDITOR IMPROVEMENTS - NEW FUNCTIONS
// ========================================

// Load database schema
const loadDatabaseSchema = async () => {
  loadingSchema.value = true
  try {
    databaseTables.value = await queryBuilderService.getAllTables()
  } catch (err: any) {
    console.error('Load schema error:', err)
  } finally {
    loadingSchema.value = false
  }
}

// Toggle table expansion
const toggleTableExpansion = (tableName: string) => {
  if (expandedTables.value.has(tableName)) {
    expandedTables.value.delete(tableName)
  } else {
    expandedTables.value.add(tableName)
  }
}

// Insert text into editor at cursor position
const insertIntoEditor = (text: string) => {
  if (!sqlTextarea.value) return
  
  const textarea = sqlTextarea.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const currentValue = sqlQuery.value
  
  sqlQuery.value = currentValue.substring(0, start) + text + currentValue.substring(end)
  
  nextTick(() => {
    textarea.focus()
    const newPosition = start + text.length
    textarea.setSelectionRange(newPosition, newPosition)
  })
}

// Filtered tables based on search
const filteredTables = computed(() => {
  if (!schemaSearchQuery.value.trim()) return databaseTables.value
  
  const search = schemaSearchQuery.value.toLowerCase()
  return databaseTables.value.filter(table => {
    const tableMatch = table.tableName.toLowerCase().includes(search)
    const columnMatch = table.columns.some(col => 
      col.columnName.toLowerCase().includes(search)
    )
    return tableMatch || columnMatch
  })
})

// Load SQL template
const loadTemplate = (template: typeof sqlTemplates[0]) => {
  sqlQuery.value = template.sql
  showTemplatesDropdown.value = false
}

// Format SQL code
const formatSqlCode = () => {
  if (!sqlQuery.value.trim()) return
  
  try {
    sqlQuery.value = formatSql(sqlQuery.value, {
      language: 'tsql',
      tabWidth: 2,
      keywordCase: 'upper'
    })
  } catch (err) {
    console.error('Format error:', err)
  }
}

// Copy SQL to clipboard
const copySqlToClipboard = async () => {
  if (!sqlQuery.value.trim()) return
  
  try {
    await navigator.clipboard.writeText(sqlQuery.value)
    showCopySuccess.value = true
    setTimeout(() => {
      showCopySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Copy error:', err)
  }
}

// Copy results as CSV
const copyResultsAsCSV = async () => {
  if (!queryResult.value) return
  
  try {
    const headers = queryResult.value.columns.map(col => col.displayName).join(',')
    const rows = queryResult.value.rows.map(row => 
      queryResult.value!.columns.map(col => {
        const value = row[col.name]
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      }).join(',')
    )
    
    const csv = [headers, ...rows].join('\n')
    await navigator.clipboard.writeText(csv)
    
    showCopySuccess.value = true
    setTimeout(() => {
      showCopySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Copy CSV error:', err)
  }
}

// Load query history from localStorage
const loadQueryHistory = () => {
  try {
    const stored = localStorage.getItem('queryHistory')
    if (stored) {
      queryHistory.value = JSON.parse(stored)
    }
  } catch (err) {
    console.error('Load history error:', err)
  }
}

// Save query to history
const saveToHistory = (sql: string, executionTime: number) => {
  const newItem = {
    sql,
    timestamp: Date.now(),
    executionTime
  }
  
  queryHistory.value = [newItem, ...queryHistory.value].slice(0, MAX_HISTORY_ITEMS)
  
  try {
    localStorage.setItem('queryHistory', JSON.stringify(queryHistory.value))
  } catch (err) {
    console.error('Save history error:', err)
  }
}

// Load query from history
const loadFromHistory = (historyItem: typeof queryHistory.value[0]) => {
  sqlQuery.value = historyItem.sql
  showHistoryDropdown.value = false
}

// Clear query history
const clearQueryHistory = () => {
  queryHistory.value = []
  try {
    localStorage.removeItem('queryHistory')
  } catch (err) {
    console.error('Clear history error:', err)
  }
  showHistoryDropdown.value = false
}

// Clear SQL editor
const clearSqlEditor = () => {
  sqlQuery.value = ''
  error.value = null
  queryResult.value = null
}

// Load saved queries when component mounts or when switching to saved tab
onMounted(() => {
  // Always load saved queries on mount for dashboard
  loadSavedQueries()
  // Load database schema for SQL Editor
  loadDatabaseSchema()
  // Load query history from localStorage
  loadQueryHistory()
})

onUnmounted(() => {
  if (queryChart) {
    queryChart.destroy()
  }
  if (aiChart) {
    aiChart.destroy()
  }
  if (detailChart) {
    detailChart.destroy()
  }
  // Cleanup all saved query charts
  savedQueryCharts.value.forEach(chart => chart.destroy())
  savedQueryCharts.value.clear()
  // Cleanup all widget charts
  widgetCharts.value.forEach(chart => chart.destroy())
  widgetCharts.value.clear()
})

// Watch for tab changes
const handleTabChange = (tab: 'ai' | 'visual' | 'sql' | 'saved') => {
  activeTab.value = tab
  if (tab === 'saved' && savedQueries.value.length === 0) {
    loadSavedQueries()
  }
  if (tab === 'saved') {
    loadMyDashboards()
  }
}

// Dashboard functions
const loadMyDashboards = async () => {
  loadingDashboards.value = true
  try {
    dashboards.value = await queryBuilderService.getMyDashboards()
    
    // Auto-select first dashboard if none selected
    if (dashboards.value.length > 0 && !selectedDashboardId.value) {
      selectedDashboardId.value = dashboards.value[0].id
      await loadDashboardLayouts()
    }
  } catch (err: any) {
    console.error('Load dashboards error:', err)
  } finally {
    loadingDashboards.value = false
  }
}

const selectDashboard = async (dashboardId: number) => {
  selectedDashboardId.value = dashboardId
  await loadDashboardLayouts()
}

const openCreateDashboardModal = () => {
  newDashboardName.value = ''
  newDashboardDescription.value = ''
  showCreateDashboardModal.value = true
}

const createDashboard = async () => {
  if (!newDashboardName.value.trim()) {
    alert('Vui lòng nhập tên dashboard')
    return
  }
  
  creatingDashboard.value = true
  try {
    const request: DashboardRequest = {
      dashboardName: newDashboardName.value,
      description: newDashboardDescription.value || null
    }
    
    const newDashboard = await queryBuilderService.createDashboard(request)
    showCreateDashboardModal.value = false
    
    // Redirect to the new dashboard page
    router.push(`/admin/custom-dashboard/${newDashboard.id}`)
  } catch (err: any) {
    console.error('Create dashboard error:', err)
    alert('Lỗi khi tạo dashboard: ' + (err.response?.data?.message || err.message))
  } finally {
    creatingDashboard.value = false
  }
}

const deleteDashboard = async (dashboardId: number) => {
  if (!confirm('Bạn có chắc muốn xóa dashboard này? Tất cả widget trong dashboard sẽ bị xóa.')) {
    return
  }
  
  try {
    await queryBuilderService.deleteDashboard(dashboardId)
    dashboards.value = dashboards.value.filter(d => d.id !== dashboardId)
    await loadMyDashboards()
  } catch (err: any) {
    console.error('Delete dashboard error:', err)
    alert('Lỗi khi xóa dashboard')
  }
}

const openDashboard = (dashboardId: number) => {
  router.push(`/admin/custom-dashboard/${dashboardId}`)
}

// ============================================
// MANAGE QUERIES MODAL METHODS
// ============================================

const openManageQueriesModal = async () => {
  showManageQueriesModal.value = true
  await loadSavedQueries()
}

const closeManageQueriesModal = () => {
  showManageQueriesModal.value = false
  editingQueryId.value = null
  editQueryName.value = ''
  editQueryDescription.value = ''
}

const startEditQuery = (query: SavedQuery) => {
  editingQueryId.value = query.id
  editQueryName.value = query.name
  editQueryDescription.value = query.description || ''
}

const cancelQueryEdit = () => {
  editingQueryId.value = null
  editQueryName.value = ''
  editQueryDescription.value = ''
}

const saveQueryEdit = async (queryId: number) => {
  if (!editQueryName.value.trim()) {
    alert('Vui lòng nhập tên truy vấn')
    return
  }

  updatingQueryId.value = queryId
  try {
    const query = savedQueries.value.find(q => q.id === queryId)
    if (!query) return

    // Parse the existing query definition
    const queryDefinition = JSON.parse(query.queryDefinition)

    const request: SavedQueryRequest = {
      name: editQueryName.value,
      description: editQueryDescription.value || null,
      query: queryDefinition,
      visualizationType: query.visualizationType
    }

    await queryBuilderService.updateQuery(queryId, request)
    await loadSavedQueries()
    
    editingQueryId.value = null
    editQueryName.value = ''
    editQueryDescription.value = ''
  } catch (err: any) {
    console.error('Update query error:', err)
    alert('Lỗi khi cập nhật truy vấn: ' + (err.response?.data?.message || err.message))
  } finally {
    updatingQueryId.value = null
  }
}

const deleteQueryFromManage = async (queryId: number) => {
  if (!confirm('Bạn có chắc muốn xóa truy vấn này?')) {
    return
  }

  deletingQueryId.value = queryId
  try {
    await queryBuilderService.deleteQuery(queryId)
    await loadSavedQueries()
  } catch (err: any) {
    console.error('Delete query error:', err)
    alert('Lỗi khi xóa truy vấn')
  } finally {
    deletingQueryId.value = null
  }
}

const getVisualizationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'TABLE': 'Bảng',
    'BAR': 'Biểu đồ cột',
    'LINE': 'Biểu đồ đường',
    'PIE': 'Biểu đồ tròn',
    'DOUGHNUT': 'Biểu đồ vòng'
  }
  return labels[type] || type
}

// ============================================
// END MANAGE QUERIES MODAL METHODS
// ============================================

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  
  return date.toLocaleDateString('vi-VN')
}

const loadDashboardLayouts = async () => {
  if (!selectedDashboardId.value) {
    gridLayout.value = []
    return
  }
  
  try {
    const layouts = await queryBuilderService.getDashboardLayouts(selectedDashboardId.value)
    dashboardLayouts.value = layouts
    
    // Convert to grid layout format
    gridLayout.value = layouts.map(layout => ({
      i: `widget-${layout.savedQueryId}`,
      x: layout.x,
      y: layout.y,
      w: layout.w,
      h: layout.h,
      savedQueryId: layout.savedQueryId
    }))
    
    // Execute queries for widgets
    await nextTick()
    for (const layout of layouts) {
      const query = savedQueries.value.find(q => q.id === layout.savedQueryId)
      if (query) {
        await executeWidgetQuery(query)
      }
    }
  } catch (err: any) {
    console.error('Load dashboard layouts error:', err)
  }
}

const saveDashboardLayouts = async () => {
  if (!selectedDashboardId.value) {
    alert('Vui lòng chọn dashboard trước')
    return
  }
  
  try {
    const layoutRequests: DashboardLayoutRequest[] = gridLayout.value.map(item => ({
      savedQueryId: item.savedQueryId,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h
    }))
    
    await queryBuilderService.saveDashboardLayouts(selectedDashboardId.value, layoutRequests)
    dashboardEditMode.value = false
  } catch (err: any) {
    console.error('Save dashboard layouts error:', err)
    alert('Lỗi khi lưu bố cục dashboard')
  }
}

const onLayoutUpdated = (newLayout: any[]) => {
  // Update grid layout when user drags/resizes
  gridLayout.value = newLayout.map(item => ({
    ...item,
    savedQueryId: gridLayout.value.find(g => g.i === item.i)?.savedQueryId
  }))
}

const addWidgetToDashboard = async (query: SavedQuery) => {
  // Check if widget already exists
  if (gridLayout.value.some(item => item.savedQueryId === query.id)) {
    alert('Widget này đã có trong dashboard')
    return
  }
  
  // Find next available position
  const maxY = gridLayout.value.length > 0 
    ? Math.max(...gridLayout.value.map(item => item.y + item.h))
    : 0
  
  // Add new widget
  const newWidget = {
    i: `widget-${query.id}`,
    x: 0,
    y: maxY,
    w: 6,
    h: 4,
    savedQueryId: query.id
  }
  
  gridLayout.value.push(newWidget)
  
  // Execute query for the new widget
  await executeWidgetQuery(query)
  
  // Auto-save
  await saveDashboardLayouts()
}

const removeWidgetFromDashboard = async (queryId: number) => {
  if (!confirm('Bạn có chắc muốn xóa widget này khỏi dashboard?')) {
    return
  }
  
  if (!selectedDashboardId.value) {
    alert('Vui lòng chọn dashboard trước')
    return
  }
  
  try {
    await queryBuilderService.removeDashboardLayout(selectedDashboardId.value, queryId)
    
    // Remove from grid layout
    gridLayout.value = gridLayout.value.filter(item => item.savedQueryId !== queryId)
    
    // Destroy chart
    const chartKey = `widget-${queryId}`
    const chart = widgetCharts.value.get(chartKey)
    if (chart) {
      chart.destroy()
      widgetCharts.value.delete(chartKey)
    }
  } catch (err: any) {
    console.error('Remove widget error:', err)
    alert('Lỗi khi xóa widget')
  }
}

const executeWidgetQuery = async (query: SavedQuery) => {
  try {
    const result = await queryBuilderService.executeSavedQuery(query.id)
    savedQueryResults.value.set(query.id, result)
    
    // Render chart
    await nextTick()
    renderWidgetChart(query.id, query.visualizationType as any)
  } catch (err: any) {
    console.error(`Error executing widget query ${query.id}:`, err)
  }
}

const renderWidgetChart = (queryId: number, vizType: string) => {
  const canvasId = `widget-chart-${queryId}`
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement
  if (!canvas) {
    console.warn(`Canvas not found for widget ${queryId}`)
    return
  }
  
  const result = savedQueryResults.value.get(queryId)
  if (!result) {
    console.warn(`No result found for widget ${queryId}`)
    return
  }
  
  // Destroy existing chart
  const chartKey = `widget-${queryId}`
  const existingChart = widgetCharts.value.get(chartKey)
  if (existingChart) {
    existingChart.destroy()
  }
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  renderChart(ctx, result, vizType, (chart) => {
    widgetCharts.value.set(chartKey, chart)
  })
}

const toggleEditMode = () => {
  dashboardEditMode.value = !dashboardEditMode.value
  if (!dashboardEditMode.value) {
    // Save when exiting edit mode
    saveDashboardLayouts()
  }
}
</script>

<style scoped>
.query-builder-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.query-builder-header {
  margin-bottom: 32px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px 0;
}

.page-title svg {
  color: #667eea;
}

.page-subtitle {
  color: #718096;
  font-size: 15px;
  margin: 0;
}

.tabs-container {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 24px;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: #718096;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.tab-button.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-content {
  min-height: 500px;
}

.coming-soon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 16px;
  border: 2px dashed #cbd5e0;
  text-align: center;
}

.coming-soon-card svg {
  color: #667eea;
  margin-bottom: 24px;
  opacity: 0.6;
}

.coming-soon-card h2 {
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 12px 0;
}

.coming-soon-card p {
  font-size: 15px;
  color: #718096;
  max-width: 500px;
  margin: 0;
}

.editor-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.editor-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.editor-actions {
  display: flex;
  gap: 12px;
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-execute {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-execute:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-execute:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.sql-textarea {
  width: 100%;
  min-height: 150px;
  max-height: 250px;
  padding: 20px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  border: none;
  resize: vertical;
  background: #1e293b;
  color: #e2e8f0;
  overflow-y: auto;
}

.sql-textarea:focus {
  outline: none;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fff5f5;
  border-left: 4px solid #fc8181;
  color: #c53030;
  font-size: 14px;
}

.results-container {
  border-top: 1px solid #e2e8f0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f7fafc;
}

.results-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.results-meta {
  display: flex;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #718096;
}

.meta-item svg {
  color: #667eea;
}

.table-wrapper {
  overflow-x: auto;
  max-height: 500px;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.results-table thead {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.results-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.column-type {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  background: #edf2f7;
  color: #718096;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
}

.results-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
}

.results-table tbody tr:hover {
  background: #f7fafc;
}

.generated-sql {
  padding: 16px 20px;
  background: #f7fafc;
  border-top: 1px solid #e2e8f0;
}

.generated-sql summary {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  cursor: pointer;
  user-select: none;
}

.generated-sql pre {
  margin: 12px 0 0 0;
  padding: 16px;
  background: #1e293b;
  border-radius: 8px;
  overflow-x: auto;
}

.generated-sql code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #e2e8f0;
  line-height: 1.6;
}

/* Saved Queries Tab Styles */
.saved-queries-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.btn-manage-queries {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-manage-queries:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-create-dashboard {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-dashboard:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Manage Queries Modal Styles */
.modal-large {
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-large .modal-body {
  overflow-y: auto;
  max-height: calc(80vh - 140px);
}

.queries-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;
}

.query-item:hover {
  border-color: #cbd5e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.query-item-header {
  display: flex;
  gap: 12px;
  flex: 1;
}

.query-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.query-info {
  flex: 1;
  min-width: 0;
}

.query-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 6px 0;
}

.query-info p {
  font-size: 14px;
  color: #718096;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.query-name-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #667eea;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
  font-family: inherit;
}

.query-name-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.query-description-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #667eea;
  border-radius: 6px;
  font-size: 14px;
  color: #2d3748;
  margin-bottom: 8px;
  font-family: inherit;
  resize: vertical;
}

.query-description-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.query-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.query-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: #667eea;
  color: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.query-date {
  font-size: 12px;
  color: #a0aec0;
}

.query-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-action {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #edf2f7;
  color: #4a5568;
}

.btn-edit:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.btn-delete {
  background: #fed7d7;
  color: #c53030;
}

.btn-delete:hover:not(:disabled) {
  background: #fc8181;
  color: white;
}

.btn-save-edit {
  background: #c6f6d5;
  color: #22543d;
}

.btn-save-edit:hover:not(:disabled) {
  background: #48bb78;
  color: white;
}

.btn-cancel-edit {
  background: #fed7d7;
  color: #c53030;
}

.btn-cancel-edit:hover:not(:disabled) {
  background: #fc8181;
  color: white;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Saved Queries Tab Styles */
.saved-queries-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
}

.loading-container svg {
  color: #667eea;
  margin-bottom: 16px;
}

.loading-container p {
  font-size: 15px;
  color: #718096;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 16px;
  border: 2px dashed #cbd5e0;
  text-align: center;
}

.empty-state svg {
  color: #667eea;
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 12px 0;
}

.empty-state p {
  font-size: 15px;
  color: #718096;
  max-width: 500px;
  margin: 0;
}

/* Saved Queries Dashboard Styles */
.saved-queries-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  padding: 4px;
}

.dashboard-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  cursor: pointer;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
}

.dashboard-card:hover {
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-title-section {
  flex: 1;
  min-width: 0;
}

.card-title-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.viz-badge {
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-card-delete {
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-card-delete:hover:not(:disabled) {
  background: #fff5f5;
  color: #e53e3e;
}

.btn-card-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-description {
  font-size: 13px;
  color: #718096;
  margin: 0 0 16px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

.card-preview {
  flex: 1;
  min-height: 200px;
  background: #f7fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-chart canvas {
  max-height: 180px !important;
  width: 100% !important;
}

.preview-table {
  width: 100%;
}

.mini-table {
  width: 100%;
}

.mini-table-row {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

.mini-table-row:last-child {
  border-bottom: none;
}

.mini-table-cell {
  flex: 1;
  font-size: 12px;
  color: #4a5568;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-loading {
  font-size: 13px;
  color: #a0aec0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.card-date {
  font-size: 12px;
  color: #a0aec0;
}

.card-rows {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
}

/* Detail Modal Styles */
.detail-modal-overlay {
  z-index: 1001;
}

.detail-modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.2s ease-out;
}

.detail-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.detail-header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-header-info h2 {
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.detail-viz-badge {
  display: inline-block;
  padding: 6px 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-description {
  padding: 16px 32px;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
}

.detail-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.detail-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.detail-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

.detail-stat svg {
  color: #667eea;
}

.detail-chart-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f7fafc;
  border-radius: 12px;
}

.detail-chart-container canvas {
  max-height: 500px !important;
  width: 100% !important;
}

.detail-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.detail-table thead {
  background: #f7fafc;
  position: sticky;
  top: 0;
  z-index: 10;
}

.detail-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.detail-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
}

.detail-table tbody tr:hover {
  background: #f7fafc;
}

.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
}

.detail-loading svg {
  color: #667eea;
  margin-bottom: 16px;
}

.detail-loading p {
  font-size: 15px;
  color: #718096;
  margin: 0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.2s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f7fafc;
  color: #2d3748;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.required {
  color: #e53e3e;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #2d3748;
  transition: all 0.2s;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px 24px;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f7fafc;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.btn-cancel:hover:not(:disabled) {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-cancel:disabled,
.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
  animation: spin 1s linear infinite;
}

/* AI Assistant Tab Styles */
.ai-assistant-tab {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.ai-container {
  padding: 24px;
}

.ai-header {
  margin-bottom: 16px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 12px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-history-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  color: #667eea;
  border: 1.5px solid #667eea;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s;
}
.btn-history-toggle:hover {
  background: #667eea;
  color: white;
}

.ai-history-panel {
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.ai-history-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f7f8fc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}

.btn-clear-history {
  font-size: 12px;
  color: #e53e3e;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}
.btn-clear-history:hover { background: #fff5f5; }

.ai-history-empty {
  padding: 16px;
  font-size: 13px;
  color: #a0aec0;
  text-align: center;
}

.ai-history-list {
  max-height: 260px;
  overflow-y: auto;
}

.ai-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.15s;
}
.ai-history-item:last-child { border-bottom: none; }
.ai-history-item:hover { background: #f7f8fc; }

.ai-history-item-content {
  flex: 1;
  min-width: 0;
}

.ai-history-question {
  margin: 0 0 2px 0;
  font-size: 13px;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-history-time {
  font-size: 11px;
  color: #a0aec0;
}

.btn-delete-history {
  flex-shrink: 0;
  margin-left: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: none;
  color: #a0aec0;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-delete-history:hover { background: #fed7d7; color: #e53e3e; }

.ai-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ai-header-content svg {
  color: #667eea;
  flex-shrink: 0;
}

.ai-header-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 4px 0;
}

.ai-header-content p {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.ai-question-section {
  margin-bottom: 32px;
}

.ai-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 12px;
}

.ai-question-input {
  width: 100%;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.6;
  color: #2d3748;
  resize: vertical;
  transition: all 0.2s;
  font-family: inherit;
  margin-bottom: 16px;
}

.ai-question-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.ai-question-input:disabled {
  background: #f7fafc;
  cursor: not-allowed;
}

.btn-generate-sql {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-generate-sql:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-generate-sql:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-response-section {
  margin-top: 32px;
}

.ai-explanation {
  padding: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12px;
  border-left: 4px solid #667eea;
  margin-bottom: 24px;
}

.ai-explanation h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 12px 0;
}

.ai-explanation h4 svg {
  color: #667eea;
}

.ai-explanation p {
  font-size: 15px;
  line-height: 1.6;
  color: #4a5568;
  margin: 0;
}

.ai-sql-section {
  background: #f7fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.ai-sql-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ai-sql-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.ai-sql-header h4 svg {
  color: #667eea;
}

.ai-sql-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sql-toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #667eea;
  user-select: none;
}

.sql-toggle-checkbox {
  width: 15px;
  height: 15px;
  accent-color: #667eea;
  cursor: pointer;
}

.btn-ai-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ai-action:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-ai-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-sql-code {
  margin: 0;
  padding: 16px;
  background: #1e293b;
  border-radius: 8px;
  overflow-x: auto;
}

.ai-sql-code code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  color: #e2e8f0;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Responsive Design */
@media (max-width: 768px) {
  .saved-queries-grid {
    grid-template-columns: 1fr;
  }

  .editor-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-save,
  .btn-execute {
    width: 100%;
  }

  .ai-header-content {
    flex-direction: column;
    text-align: center;
  }

  .ai-sql-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .ai-sql-actions {
    width: 100%;
  }

  .btn-ai-action {
    flex: 1;
  }
  
  .viz-buttons {
    flex-wrap: wrap;
  }
  
  .viz-btn {
    flex: 1 1 calc(50% - 6px);
    min-width: 100px;
  }
}

/* Visualization Selector */
.visualization-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #f7fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.visualization-selector label {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
}

.viz-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.viz-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  color: #718096;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.viz-btn:hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-1px);
}

.viz-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

/* Chart Visualization */
.chart-visualization {
  padding: 32px;
  background: white;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-visualization canvas {
  max-height: 400px;
  width: 100% !important;
  height: auto !important;
}

/* Dashboard Grid Layout Styles */
.dashboard-container {
  display: flex;
  gap: 24px;
  min-height: 600px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dashboard-title-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 4px 0;
}

.dashboard-title-section p {
  font-size: 13px;
  color: #718096;
  margin: 0;
}

.dashboard-actions {
  display: flex;
  gap: 12px;
}

.btn-edit-mode {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit-mode:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-edit-mode.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.available-queries-sidebar {
  width: 300px;
  flex-shrink: 0;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

.available-queries-sidebar h3 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.sidebar-hint {
  font-size: 12px;
  color: #718096;
  margin: 0 0 16px 0;
}

.available-queries-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.available-query-item {
  padding: 12px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.available-query-item:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  transform: translateX(4px);
}

.available-query-item.in-dashboard {
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
  cursor: default;
}

.available-query-item.in-dashboard:hover {
  transform: none;
}

.query-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.query-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.query-item-badge {
  font-size: 9px;
  font-weight: 600;
  padding: 3px 6px;
  background: #667eea;
  color: white;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.query-item-desc {
  font-size: 11px;
  color: #718096;
  margin: 4px 0 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.query-item-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #667eea;
  font-weight: 600;
  margin-top: 6px;
}

.dashboard-grid-wrapper {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

.dashboard-grid-wrapper.edit-mode {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 79px,
    rgba(102, 126, 234, 0.1) 79px,
    rgba(102, 126, 234, 0.1) 80px
  ),
  repeating-linear-gradient(
    90deg,
    transparent,
    transparent 79px,
    rgba(102, 126, 234, 0.1) 79px,
    rgba(102, 126, 234, 0.1) 80px
  );
}

.empty-dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  min-height: 500px;
}

.empty-dashboard svg {
  color: #cbd5e0;
  margin-bottom: 24px;
}

.empty-dashboard h3 {
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.empty-dashboard p {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.grid-widget {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 2px solid #e2e8f0;
  transition: all 0.2s;
}

.grid-widget:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.widget-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

.widget-title-section {
  flex: 1;
  min-width: 0;
}

.widget-title-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.widget-viz-badge {
  display: inline-block;
  padding: 3px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 9px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.widget-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.btn-widget-remove,
.btn-widget-expand {
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-widget-remove:hover {
  background: #fff5f5;
  color: #e53e3e;
}

.btn-widget-expand:hover {
  background: #f7fafc;
  color: #667eea;
}

.widget-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
}

.widget-visualization {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.widget-table {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.widget-mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.widget-mini-table thead {
  background: #f7fafc;
  position: sticky;
  top: 0;
}

.widget-mini-table th {
  padding: 8px;
  text-align: left;
  font-weight: 600;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  font-size: 10px;
}

.widget-mini-table td {
  padding: 8px;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.widget-mini-table tbody tr:hover {
  background: #f7fafc;
}

.widget-chart {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.widget-chart canvas {
  max-width: 100% !important;
  max-height: 100% !important;
  width: auto !important;
  height: auto !important;
}

.widget-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #a0aec0;
}

.widget-loading p {
  font-size: 12px;
  margin: 0;
}

.widget-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #e2e8f0;
  font-size: 11px;
}

.widget-rows {
  font-weight: 600;
  color: #667eea;
}

.widget-time {
  color: #a0aec0;
}

/* Responsive Dashboard */
@media (max-width: 1024px) {
  .dashboard-container {
    flex-direction: column;
  }

  .available-queries-sidebar {
    width: 100%;
    max-height: 300px;
  }

  .dashboard-grid-wrapper {
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .dashboard-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .btn-edit-mode {
    width: 100%;
    justify-content: center;
  }
  
  .dashboard-selector {
    width: 100%;
  }
}

/* Dashboard Management Styles */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dashboard-header h2 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.dashboard-header h2 svg {
  color: #667eea;
}

.dashboard-header p {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.dashboards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.dashboard-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.dashboard-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dashboard-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard-icon svg {
  color: #667eea;
}

.btn-delete-card {
  width: 32px;
  height: 32px;
  background: #fff5f5;
  color: #e53e3e;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0;
}

.dashboard-card:hover .btn-delete-card {
  opacity: 1;
}

.btn-delete-card:hover {
  background: #e53e3e;
  color: white;
}

.dashboard-card-body h3 {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.dashboard-card-body p {
  font-size: 14px;
  color: #718096;
  margin: 0;
  line-height: 1.5;
}

.dashboard-card-body .no-description {
  font-style: italic;
  opacity: 0.6;
}

.dashboard-card-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.dashboard-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #718096;
}

.dashboard-date svg {
  opacity: 0.6;
}

.btn-create-first {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-first:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
}

.dashboard-selector {
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 200px;
}

.dashboard-selector:hover {
  border-color: #667eea;
}

.dashboard-selector:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-create-dashboard {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-create-dashboard:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-create-dashboard:active {
  transform: translateY(0);
}

.btn-delete-dashboard {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: #fff;
  color: #e53e3e;
  border: 2px solid #e53e3e;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 40px;
}

.btn-delete-dashboard:hover {
  background: #e53e3e;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
}

.btn-delete-dashboard:active {
  transform: translateY(0);
}

.btn-edit-mode {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-edit-mode:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-edit-mode.active {
  background: #48bb78;
  border-color: #48bb78;
  color: white;
}

.btn-edit-mode.active:hover {
  background: #38a169;
  border-color: #38a169;
}

.btn-edit-mode:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-edit-mode:disabled:hover {
  transform: none;
  box-shadow: none;
  background: white;
  color: #667eea;
}

/* Empty Dashboard State */
.empty-dashboard-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 16px;
  border: 2px dashed #cbd5e0;
  text-align: center;
  margin-top: 40px;
}

.empty-dashboard-state svg {
  color: #667eea;
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-dashboard-state h3 {
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 12px 0;
}

.empty-dashboard-state p {
  font-size: 15px;
  color: #718096;
  max-width: 500px;
  margin: 0 0 32px 0;
}

.btn-create-first-dashboard {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-create-first-dashboard:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-create-first-dashboard:active {
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .btn-text {
    display: none;
  }
  
  .btn-create-dashboard,
  .btn-edit-mode {
    padding: 10px;
    min-width: 40px;
  }
  
  .dashboard-selector {
    min-width: 150px;
    flex: 1;
  }
}

/* ========================================
   SQL EDITOR IMPROVEMENTS - NEW STYLES
   ======================================== */

/* SQL Editor Layout */
.sql-editor-layout {
  display: flex;
  gap: 0;
  min-height: 400px;
}

/* Schema Sidebar */
.schema-sidebar {
  width: 280px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.schema-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schema-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.schema-search {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.schema-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  transition: border-color 0.2s;
}

.schema-search-input:focus {
  outline: none;
  border-color: #667eea;
}

.schema-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
}

.schema-loading p {
  margin-top: 12px;
  font-size: 13px;
}

.tables-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.table-item {
  margin-bottom: 4px;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.table-header:hover {
  background: #e8eaf0;
}

.expand-icon {
  transition: transform 0.2s;
  flex-shrink: 0;
  color: #666;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.table-name {
  font-weight: 600;
  font-size: 13px;
  color: #2c3e50;
  flex: 1;
  cursor: pointer;
}

.table-name:hover {
  color: #667eea;
  text-decoration: underline;
}

.column-count {
  font-size: 11px;
  color: #999;
  background: #e8eaf0;
  padding: 2px 6px;
  border-radius: 10px;
}

.columns-list {
  padding-left: 32px;
  margin-top: 4px;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.column-item:hover {
  background: #e8eaf0;
}

.key-icon {
  color: #f39c12;
  flex-shrink: 0;
}

.column-name {
  font-size: 12px;
  color: #34495e;
  flex: 1;
}

.column-type {
  font-size: 10px;
  color: #999;
  text-transform: uppercase;
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Editor Main Area */
.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Toolbar */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #2c3e50;
}

.btn-toolbar:hover:not(:disabled) {
  background: #e8eaf0;
  border-color: #667eea;
  color: #667eea;
}

.btn-toolbar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e0e0e0;
  margin: 0 4px;
}

/* Dropdowns */
.dropdown-wrapper {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 1000;
  min-width: 320px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  font-size: 13px;
  color: #2c3e50;
}

.dropdown-body {
  overflow-y: auto;
  padding: 8px;
}

.template-item,
.history-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
  width: 100%;
  border: none;
  background: none;
  font-size: 13px;
  color: #2c3e50;
}

.template-item:hover,
.history-item:hover {
  background: #f0f2f5;
}

.history-sql {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #2c3e50;
  margin-bottom: 4px;
  word-break: break-all;
}

.history-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #999;
}

/* Copy Success Toast */
.copy-success-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #10b981;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  animation: slideIn 0.3s ease;
  z-index: 9999;
  font-size: 14px;
  font-weight: 500;
}

@keyframes slideIn {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Show/Hide Sidebar Button */
.btn-show-sidebar {
  padding: 8px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-show-sidebar:hover {
  background: #e8eaf0;
  border-color: #667eea;
}

.btn-close-sidebar {
  padding: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-close-sidebar:hover {
  color: #e74c3c;
}

/* Results Actions */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
}

.results-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-copy-results {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #2c3e50;
  font-weight: 500;
}

.btn-copy-results:hover {
  background: #e8eaf0;
  border-color: #667eea;
  color: #667eea;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .schema-sidebar {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .sql-editor-layout {
    flex-direction: column;
  }
  
  .schema-sidebar {
    width: 100%;
    max-height: 300px;
  }
  
  .editor-toolbar {
    flex-wrap: wrap;
  }
  
  .dropdown-menu {
    min-width: 280px;
  }
}

</style>


