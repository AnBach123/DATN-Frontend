<template>
  <div class="table-page">
    <div class="content">
      <AdminPageHeader title="Quản lý bàn">
        <template #actions>
          <button class="add-btn" @click="openAddModal">+ Thêm bàn</button>
        </template>
      </AdminPageHeader>

      <!-- FILTER BAR -->
      <div class="filter-bar">
        <input
          v-model="filters.keyword"
          type="text"
          class="filter-input keyword-input"
          placeholder="Tìm tên bàn..."
          @input="searchTables"
        />

        <select v-model="filters.seatingCapacity" class="filter-input" @change="searchTables">
          <option value="">Tất cả sức chứa</option>
          <option value="2">2 người</option>
          <option value="4">4 người</option>
          <option value="6">6 người</option>
          <option value="8">8 người</option>
          <option value="10">10 người</option>
        </select>

        <select v-model="filters.tableStatus" class="filter-input" @change="searchTables">
          <option value="">Tất cả trạng thái</option>
          <option value="AVAILABLE">Còn trống</option>
          <option value="RESERVED">Đã đặt</option>
          <option value="OCCUPIED">Đang sử dụng</option>
          <option value="CLEANING">Đang dọn</option>
          <option value="OUT_OF_SERVICE">Ngưng phục vụ</option>
        </select>

        <input
          v-model="filters.fromDate"
          type="date"
          class="filter-input"
          @change="searchTables"
        />

        <input
          v-model="filters.toDate"
          type="date"
          class="filter-input"
          @change="searchTables"
        />

      </div>

      <div v-if="loading" class="loading">Đang tải dữ liệu...</div>
      <div v-else class="table-wrapper">
        <table class="table-list">
          <thead>
          <tr>
  <th class="sortable" @click="handleSort('id')">
    ID <span>{{ sortIcon('id') }}</span>
  </th>
  <th>Tên bàn</th>
  <th>Khu vực</th>
  <th>Tầng</th>
  <th class="sortable" @click="handleSort('seatingCapacity')">
    Sức chứa <span>{{ sortIcon('seatingCapacity') }}</span>
  </th>
  <th>Trạng thái</th>
  <th class="sortable" @click="handleSort('createdAt')">
    Ngày tạo <span>{{ sortIcon('createdAt') }}</span>
  </th>
  <th>Hành động</th>
</tr>
          </thead>
          <tbody>
            <tr v-if="tables.length === 0">
              <td colspan="8" class="empty">Không có dữ liệu</td>
            </tr>

            <tr v-for="table in tables" :key="table.id">
  <td>{{ table.id }}</td>
  <td>{{ table.tableName }}</td>
  <td>Khu {{ table.area || '---' }}</td>
  <td>{{ table.floor ? 'Tầng ' + table.floor : '---' }}</td>
  <td>{{ table.seatingCapacity }} người</td>
  <td>
    <span class="status-badge" :class="table.tableStatus?.toLowerCase()">
      {{ formatTableStatus(table.tableStatus) }}
    </span>
  </td>
  <td>{{ formatDate(table.createdAt) }}</td>
  <td>
    <div class="action-group">
      <button class="detail-btn" @click="openDetailModal(table)">Chi tiết</button>
    </div>
  </td>
</tr>
          </tbody>
        </table>
      </div>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>

    <!-- PAGINATION -->
    <div class="pagination-section" v-if="totalPages > 1">
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 0"
        class="pagination-btn"
      >
        ‹ Trước
      </button>
      
      <div class="page-numbers">
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="goToPage(page - 1)"
          :class="['page-btn', { active: page - 1 === currentPage }]"
        >
          {{ page }}
        </button>
      </div>

      <button
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage >= totalPages - 1"
        class="pagination-btn"
      >
        Sau ›
      </button>
    </div>

    <!-- MODAL THÊM -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Thêm bàn</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Tên bàn *</label>
              <input v-model="form.tableName" type="text" placeholder="Nhập tên bàn" />
            </div>

       <div class="form-group">
  <label>Sức chứa *</label>
  <select v-model="form.seatingCapacity">
    <option value="">-- Chọn sức chứa --</option>
    <option value="2">2 người</option>
    <option value="4">4 người</option>
    <option value="6">6 người</option>
    <option value="8">8 người</option>
    <option value="10">10 người</option>
  </select>
</div>

            <div class="form-group">
  <label>Khu vực *</label>
  <select v-model="form.area" @change="updateFloorByArea">
    <option value="">-- Chọn khu vực --</option>
    <option value="A">Khu A</option>
    <option value="B">Khu B</option>
    <option value="C">Khu C</option>
    <option value="D">Khu D</option>
    <option value="E">Khu E</option>
    <option value="F">Khu F</option>
  </select>
</div>
  
<div class="form-group">
  <label>Tầng</label>
  <input v-model="form.floor" type="text" disabled />
</div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="reset-btn" @click="closeModal">Hủy</button>
          <button class="save-btn" @click="submitAddForm">Thêm mới</button>
        </div>
      </div>
    </div>

    <!-- MODAL CHI TIẾT / CẬP NHẬT -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="detail-modal-box">
        <div class="modal-header">
          <h3>Chi tiết / Cập nhật bàn</h3>
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>

        <div class="detail-body">
          <div class="form-grid">
            <div class="form-group">
              <label>ID</label>
              <input :value="form.id" type="text" disabled />
            </div>

            <div class="form-group">
              <label>Ngày tạo</label>
              <input :value="selectedTable ? formatDate(selectedTable.createdAt) : ''" disabled />
            </div>

            <div class="form-group">
              <label>Tên bàn *</label>
              <input v-model="form.tableName" type="text" />
            </div>

       <div class="form-group">
  <label>Sức chứa *</label>
  <select v-model="form.seatingCapacity">
    <option value="">-- Chọn sức chứa --</option>
    <option value="2">2 người</option>
    <option value="4">4 người</option>
    <option value="6">6 người</option>
    <option value="8">8 người</option>
    <option value="10">10 người</option>
  </select>
</div>
<div class="form-group">
  <label>Khu vực *</label>
  <select v-model="form.area" @change="updateFloorByArea">
    <option value="">-- Chọn khu vực --</option>
    <option value="A">Khu A</option>
    <option value="B">Khu B</option>
    <option value="C">Khu C</option>
    <option value="D">Khu D</option>
    <option value="E">Khu E</option>
    <option value="F">Khu F</option>
  </select>
</div>

<div class="form-group">
  <label>Tầng</label>
  <input v-model="form.floor" type="text" disabled />
</div>

          </div>
        </div>

        <div class="detail-footer">
          <button class="reset-btn" @click="closeDetailModal">Đóng</button>
          <button class="save-btn" @click="openUpdateConfirm">Cập nhật</button>
          <button class="lock-btn" @click="disableTable">
            {{ form.tableStatus === 'OUT_OF_SERVICE' ? 'Mở lại bàn' : 'Ngưng phục vụ' }}
          </button>
        </div>
      </div>
    </div>

    <!-- CONFIRM MODAL -->
    <div v-if="showConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <h3>{{ confirmType === 'add' ? 'Xác nhận thêm mới?' : 'Xác nhận cập nhật?' }}</h3>
        <p>
          {{
            confirmType === 'add'
              ? 'Bạn có chắc muốn thêm bàn mới không?'
              : 'Bạn có chắc muốn cập nhật bàn này không?'
          }}
        </p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="showConfirm = false">Hủy</button>
          <button class="ok-btn" @click="handleConfirm">Đồng ý</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DiningTableService from '@/services/diningTable'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'

const tables = ref<any[]>([])
const allTables = ref<any[]>([])
const loading = ref(false)
const errorMessage = ref('')

const filters = ref({
  keyword: '',
  seatingCapacity: '',
  tableStatus: '',
  fromDate: '',
  toDate: '',
})

const sortBy = ref('')
const direction = ref('asc')

const currentPage = ref(0)
const pageSize = ref(10)

const showModal = ref(false)
const showDetailModal = ref(false)
const showConfirm = ref(false)
const confirmType = ref<'add' | 'edit' | null>(null)

const selectedTable = ref<any | null>(null)

const form = ref({
  id: null as number | null,
  tableName: '',
  seatingCapacity: '',
  tableStatus: 'AVAILABLE',
  area: '',
  floor: '',
})

const resetForm = () => {
  form.value = {
    id: null,
    tableName: '',
    seatingCapacity: '',
    tableStatus: 'AVAILABLE',
    area: '',
    floor: '',
  }
}

const updateFloorByArea = () => {
  if (['A', 'B', 'C', 'D'].includes(form.value.area)) {
    form.value.floor = '1'
  } else if (['E', 'F'].includes(form.value.area)) {
    form.value.floor = '2'
  } else {
    form.value.floor = ''
  }
}

const loadTables = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    const res = await DiningTableService.getTables()
    allTables.value = res || []
    tables.value = paginateData(allTables.value)
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Không thể tải danh sách bàn'
  } finally {
    loading.value = false
  }
}

let timeout: any = null

const searchTables = () => {
  clearTimeout(timeout)

  timeout = setTimeout(async () => {
    try {
      loading.value = true
      errorMessage.value = ''

      if (
        filters.value.fromDate &&
        filters.value.toDate &&
        filters.value.fromDate > filters.value.toDate
      ) {
        errorMessage.value = 'Ngày bắt đầu không được lớn hơn ngày kết thúc'
        tables.value = []
        loading.value = false
        return
      }

      const hasFilter =
        filters.value.keyword ||
        filters.value.seatingCapacity ||
        filters.value.tableStatus ||
        filters.value.fromDate ||
        filters.value.toDate

      if (!hasFilter && !sortBy.value) {
        return await loadTables()
      }

      const res = await DiningTableService.searchTables({
        keyword: filters.value.keyword,
        seatingCapacity: filters.value.seatingCapacity || null,
        tableStatus: filters.value.tableStatus,
        fromDate: filters.value.fromDate || null,
        toDate: filters.value.toDate || null,
        sortBy: sortBy.value,
        direction: direction.value,
      })

      allTables.value = res || []
      currentPage.value = 0
      tables.value = paginateData(allTables.value)
    } catch (error) {
      console.error(error)
      errorMessage.value = 'Không thể tìm kiếm bàn'
    } finally {
      loading.value = false
    }
  }, 400)
}

const handleSort = async (field: string) => {
  if (sortBy.value === field) {
    direction.value = direction.value === 'asc' ? 'desc' : ''
    if (!direction.value) {
      sortBy.value = ''
      return await searchTables()
    }
  } else {
    sortBy.value = field
    direction.value = 'asc'
  }

  await searchTables()
}

const paginateData = (data: any[]) => {
  const start = currentPage.value * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
}

const totalPages = computed(() => Math.ceil(allTables.value.length / pageSize.value))

const goToPage = (page: number) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
    tables.value = paginateData(allTables.value)
  }
}

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2) + 1)
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const sortIcon = (field: string) =>
  sortBy.value === field
    ? direction.value === 'asc'
      ? '▲'
      : direction.value === 'desc'
        ? '▼'
        : '↕'
    : '↕'

const openAddModal = () => {
  resetForm()
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}
const openDetailModal = (table: any) => {
  selectedTable.value = table
  form.value = {
    id: table.id,
    tableName: table.tableName,
    seatingCapacity: String(table.seatingCapacity),
    tableStatus:
      table.tableStatus === 'OUT_OF_SERVICE' ? 'AVAILABLE' : table.tableStatus,
    area: table.area || '',
    floor: table.floor ? String(table.floor) : '',
  }
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedTable.value = null
}

const submitAddForm = () => {
  if (!form.value.tableName || !form.value.seatingCapacity || !form.value.tableStatus || !form.value.area) {
    alert('Vui lòng nhập đầy đủ thông tin')
    return
  }

  confirmType.value = 'add'
  showConfirm.value = true
}

const openUpdateConfirm = () => {
  if (!form.value.tableName || !form.value.seatingCapacity || !form.value.tableStatus || !form.value.area) {
    alert('Vui lòng nhập đầy đủ thông tin')
    return
  }

  confirmType.value = 'edit'
  showConfirm.value = true
}

const handleConfirm = async () => {
  showConfirm.value = false

  const payload = {
  tableName: form.value.tableName,
  seatingCapacity: Number(form.value.seatingCapacity),
  tableStatus: form.value.tableStatus,
  area: form.value.area,
}

  try {
    if (confirmType.value === 'add') {
      await DiningTableService.createTable(payload)
      alert('Thêm bàn thành công')
      closeModal()
    } else if (confirmType.value === 'edit' && form.value.id) {
      await DiningTableService.updateTable(form.value.id, payload)
      alert('Cập nhật bàn thành công')
      closeDetailModal()
    }

    await searchTables()
  } catch (error: any) {
    console.error(error)
    alert(error?.response?.data || 'Thao tác thất bại')
  }
}

const disableTable = async () => {
  if (!form.value.id) return

  const isDisabled = form.value.tableStatus === 'OUT_OF_SERVICE'
  const confirmText = isDisabled
    ? 'Bạn có chắc muốn mở lại bàn này không?'
    : 'Bạn có chắc muốn ngưng phục vụ bàn này không?'

  if (!confirm(confirmText)) return

  try {
   const payload = {
  tableName: form.value.tableName,
  seatingCapacity: Number(form.value.seatingCapacity),
  tableStatus: isDisabled ? 'AVAILABLE' : 'OUT_OF_SERVICE',
  area: form.value.area,
}
    await DiningTableService.updateTable(form.value.id, payload)
    alert(isDisabled ? 'Mở lại bàn thành công' : 'Ngưng phục vụ thành công')
    closeDetailModal()
    await searchTables()
  } catch (error: any) {
    console.error(error)
    alert(error?.response?.data || 'Thao tác thất bại')
  }
}
const formatDate = (date: string) => {
  if (!date) return ''
  return date.split(' ')[0]
}

const formatTableStatus = (status: string) =>
  (
    {
      AVAILABLE: 'Còn trống',
      RESERVED: 'Đã đặt',
      OCCUPIED: 'Đang sử dụng',
      CLEANING: 'Đang dọn',
      OUT_OF_SERVICE: 'Ngưng phục vụ',
    } as Record<string, string>
  )[status] || '---'

onMounted(loadTables)
</script>

<style scoped>
.table-page {
  padding: 24px;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.filter-input {
  height: 42px;
  padding: 0 14px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  transition: all 0.25s ease;
}

.filter-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12);
}

.keyword-input {
  flex: 1;
  min-width: 260px;
}

.add-btn,
.save-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}
.reset-btn {
  padding: 10px 18px;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  background: white;
  color: #4a5568;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.reset-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f8faff;
  transform: translateY(-1px);
}

.reset-btn:active {
  transform: scale(0.98);
}

.add-btn:hover,
.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}


.table-wrapper {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.table-list {
  width: 100%;
  border-collapse: collapse;
}

.table-list thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.table-list th {
  padding: 14px;
  text-align: left;
  font-size: 14px;
  white-space: nowrap;
}

.table-list td {
  padding: 14px;
  font-size: 14px;
  color: #4a5568;
}

.table-list tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.3s;
}

.table-list tbody tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

.sortable {
  cursor: pointer;
  user-select: none;
  transition: 0.2s;
}

.sortable:hover {
  background: rgba(255, 255, 255, 0.08);
}

.empty {
  text-align: center;
  padding: 30px;
  color: #718096;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  min-width: 120px;
  text-align: center;
}

.status-badge.available {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge.reserved {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.occupied {
  background: #fed7d7;
  color: #742a2a;
}

.status-badge.cleaning {
  background: #bee3f8;
  color: #2c5282;
}

.status-badge.out_of_service {
  background: #e2e8f0;
  color: #4a5568;
}

.action-group {
  display: flex;
  gap: 8px;
}

.detail-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: #805ad5;
  color: white;
  cursor: pointer;
  transition: 0.2s;
}

.detail-btn:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

.lock-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  background: #e53e3e;
  color: white;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-box {
  width: 650px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.detail-modal-box {
  width: 820px;
  max-width: 92vw;
  max-height: 90vh;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.28);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 22px;
  cursor: pointer;
}

.modal-body,
.detail-body {
  padding: 24px;
  background: #f8fafc;
}

.detail-body {
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 13px;
  margin-bottom: 6px;
  color: #4a5568;
  font-weight: 600;
}

input,
select {
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s;
}

input:focus,
select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-footer,
.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.loading {
  text-align: center;
  padding: 30px;
  color: #718096;
}

.error-message {
  color: red;
  margin-top: 10px;
  font-weight: 500;
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.confirm-box {
  width: 360px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
}

.cancel-btn {
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
}

.ok-btn {
  padding: 8px 16px;
  border: none;
  background: #667eea;
  color: white;
  border-radius: 8px;
  cursor: pointer;
}

/* PAGINATION */
.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.pagination-btn {
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #4a5568;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 8px;
}

.page-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #4a5568;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.page-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}
</style>