<template>
  <div class="employee-page">
    <div class="content">
      <AdminPageHeader title="Quản lý nhân viên">
        <template #actions>
          <button class="add-btn" @click="openAddModal">+ Thêm nhân viên</button>
        </template>
      </AdminPageHeader>

      <div class="filter-bar">
        <input
          v-model="filters.keyword"
          type="text"
          class="filter-input keyword-input"
          placeholder="Tìm username, SĐT hoặc email..."
          @input="searchEmployees"
        />
        <select v-model="filters.role" class="filter-input" @change="searchEmployees">
          <option value="">Tất cả vai trò</option>
          <option value="STAFF">Nhân viên</option>
          <option value="RECEPTION">Lễ tân</option>
          <option value="KITCHEN">Nhà bếp</option>
        </select>
        <select v-model="filters.gender" class="filter-input" @change="searchEmployees">
          <option value="">Tất cả giới tính</option>
          <option value="MALE">Nam</option>
          <option value="FEMALE">Nữ</option>
          <option value="OTHER">Khác</option>
        </select>
        <input
          v-model="filters.fromDate"
          type="date"
          class="filter-input date-input"
          @change="searchEmployees"
        />
        <span class="date-separator">đến</span>
        <input
          v-model="filters.toDate"
          type="date"
          class="filter-input date-input"
          @change="searchEmployees"
        />
      </div>

      <!-- EMPLOYEE TABLE -->
      <div v-if="loading" class="loading">Đang tải dữ liệu...</div>
      <div v-else class="table-wrapper">
        <table class="employee-table">
          <thead>
            <tr>
              <th class="sortable" @click="handleSort('id')">
                ID <span>{{ sortIcon('id') }}</span>
              </th>
              <th>Họ tên</th>
              <th>Username</th>
              <th>Số điện thoại</th>
              <th>Email</th>
              <th>Giới tính</th>
              <th class="sortable" @click="handleSort('createdAt')">
                Ngày tạo <span>{{ sortIcon('createdAt') }}</span>
              </th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="employees.length === 0">
              <td colspan="10" class="empty">Không có dữ liệu</td>
            </tr>
            <tr v-for="employee in employees" :key="employee.id">
              <td>{{ employee.id }}</td>
              <td>{{ employee.fullName }}</td>
              <td>{{ employee.username }}</td>
              <td>{{ employee.phoneNumber || '---' }}</td>
              <td>{{ employee.email }}</td>
              <td>{{ formatGender(employee.gender) }}</td>
              <td>{{ formatDate(employee.createdAt) }}</td>
              <td>
                <span class="role-badge" :class="employee.role?.toLowerCase()">
                  {{ formatRole(employee.role) }}
                </span>
              </td>
              <td>
                <span :class="employee.isActive ? 'status-active' : 'status-inactive'">{{
                  employee.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'
                }}</span>
              </td>
              <td>
                <div class="action-group">
                  <button class="detail-btn" @click="openDetailModal(employee)">Chi tiết</button>
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

    <!-- MODAL THÊM / CẬP NHẬT -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3>{{ isEdit ? 'Cập nhật nhân viên' : 'Thêm nhân viên' }}</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Họ tên *</label><input v-model="form.fullName" type="text" />
            </div>
            <div class="form-group">
              <label>Username *</label><input v-model="form.username" type="text" />
            </div>
            <div class="form-group">
              <label>Số điện thoại *</label><input v-model="form.phoneNumber" type="text" />
            </div>
            <div class="form-group">
              <label>Giới tính</label>
              <select v-model="form.gender">
                <option value="">-- Chọn giới tính --</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div class="form-group">
              <label>Địa chỉ</label><input v-model="form.address" type="text" />
            </div>
            <div class="form-group">
              <label>Vai trò *</label>
              <select v-model="form.role">
                <option value="">-- Chọn vai trò --</option>
                <option value="STAFF">Nhân viên</option>
                <option value="RECEPTION">Lễ tân</option>
                <option value="KITCHEN">Nhà bếp</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="reset-btn" @click="closeModal">Hủy</button>
          <button class="save-btn" @click="submitForm">
            {{ isEdit ? 'Cập nhật' : 'Thêm mới' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL CHI TIẾT -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="detail-modal-box">
        <div class="modal-header">
          <h3>Chi tiết / Cập nhật nhân viên</h3>
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>
        <div class="detail-body">
          <div class="form-grid">
            <div class="form-group">
              <label>ID</label><input :value="form.id" type="text" disabled />
            </div>
            <div class="form-group">
              <label>Ngày tạo</label
              ><input
                :value="selectedEmployee ? formatDate(selectedEmployee.createdAt) : ''"
                type="text"
                disabled
              />
            </div>
            <div class="form-group">
              <label>Họ tên *</label><input v-model="form.fullName" type="text" />
            </div>
            <div class="form-group">
              <label>Username *</label><input v-model="form.username" type="text" />
            </div>
            <div class="form-group">
              <label>Số điện thoại *</label><input v-model="form.phoneNumber" type="text" />
            </div>
            <div class="form-group">
              <label>Email *</label><input v-model="form.email" type="email" />
            </div>
            <div class="form-group">
              <label>Giới tính</label>
              <select v-model="form.gender">
                <option value="">-- Chọn giới tính --</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div class="form-group">
              <label>Vai trò *</label>
              <select v-model="form.role">
                <option value="">-- Chọn vai trò --</option>
                <option value="STAFF">Nhân viên</option>
                <option value="RECEPTION">Lễ tân</option>
                <option value="KITCHEN">Nhà bếp</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label>Địa chỉ</label><input v-model="form.address" type="text" />
            </div>
            <div class="form-group">
              <label>Trạng thái</label
              ><input
                :value="form.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'"
                type="text"
                disabled
              />
            </div>
          </div>
        </div>
        <div class="detail-footer">
          <button class="reset-btn" @click="closeDetailModal">Đóng</button>
          <button class="save-btn" @click="openDetailConfirm">Cập nhật</button>
          <button class="lock-btn" @click="lockEmployeeFromDetail">
            {{ form.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản' }}
          </button>
        </div>
      </div>
    </div>

    <!-- CONFIRM MODAL -->
    <div v-if="showConfirm || showDetailConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <h3>
          {{
            showConfirm
              ? confirmAction === 'edit'
                ? 'Xác nhận cập nhật?'
                : 'Xác nhận thêm mới?'
              : 'Xác nhận cập nhật?'
          }}
        </h3>
        <p>
          {{
            showConfirm
              ? confirmAction === 'edit'
                ? 'Bạn có chắc muốn cập nhật nhân viên này không?'
                : 'Bạn có chắc muốn thêm nhân viên mới không?'
              : 'Bạn có chắc chắn muốn cập nhật nhân viên này không?'
          }}
        </p>
        <div class="confirm-actions">
          <button
            class="cancel-btn"
            @click="
              showConfirm = false ;
              showDetailConfirm = false
            "
          >
            Hủy
          </button>
          <button class="ok-btn" @click="showConfirm ? handleConfirm() : handleDetailConfirm()">
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import EmployeeService from '@/services/employee'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'

const employees = ref<any[]>([])
const allEmployees = ref<any[]>([])
const loading = ref(false)
const errorMessage = ref('')
const filters = ref({ keyword: '', role: '', gender: '', fromDate: '', toDate: '' })
const sortBy = ref('')
const direction = ref('asc')

const currentPage = ref(0)
const pageSize = ref(10)

const showModal = ref(false)
const isEdit = ref(false)
const showDetailModal = ref(false)
const showConfirm = ref(false)
const showDetailConfirm = ref(false)
const confirmAction = ref<'add' | 'edit' | null>(null)
const selectedEmployee = ref<any | null>(null)

const form = ref({
  id: null as number | null,
  fullName: '',
  username: '',
  phoneNumber: '',
  email: '',
  gender: '',
  address: '',
  role: '',
  isActive: true,
  password: '' as string | undefined,
})

const loadEmployees = async () => {
  try {
    loading.value = true
    const res = await EmployeeService.getEmployees()
    allEmployees.value = res || []
    employees.value = paginateData(allEmployees.value)
  } catch {
    errorMessage.value = 'Không thể tải danh sách nhân viên'
  } finally {
    loading.value = false
  }
}

let timeout: any = null
const searchEmployees = () => {
  clearTimeout(timeout)
  timeout = setTimeout(async () => {
    if (
      filters.value.fromDate &&
      filters.value.toDate &&
      filters.value.fromDate > filters.value.toDate
    ) {
      errorMessage.value = 'Từ ngày không được lớn hơn đến ngày'
      employees.value = []
      return
    }
    const hasFilter =
      filters.value.keyword ||
      filters.value.role ||
      filters.value.gender ||
      filters.value.fromDate ||
      filters.value.toDate
    if (!hasFilter) return await loadEmployees()
    try {
      loading.value = true
      const res = await EmployeeService.searchEmployees(filters.value)
      allEmployees.value = res || []
      currentPage.value = 0
      employees.value = paginateData(allEmployees.value)
    } catch {
      errorMessage.value = 'Không thể tìm kiếm nhân viên'
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
      return await loadEmployees()
    }
  } else {
    sortBy.value = field
    direction.value = 'asc'
  }
  if (sortBy.value) {
    loading.value = true
    const res = await EmployeeService.sortEmployees(sortBy.value, direction.value)
    allEmployees.value = res || []
    currentPage.value = 0
    employees.value = paginateData(allEmployees.value)
    loading.value = false
  }
}

const paginateData = (data: any[]) => {
  const start = currentPage.value * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
}

const totalPages = computed(() => Math.ceil(allEmployees.value.length / pageSize.value))

const goToPage = (page: number) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
    employees.value = paginateData(allEmployees.value)
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
  isEdit.value = false
  showModal.value = true
}
const openDetailModal = (employee: any) => {
  selectedEmployee.value = employee
  form.value = { ...employee }
  showDetailModal.value = true
}
const closeDetailModal = () => (showDetailModal.value = false)
const closeModal = () => (showModal.value = false)

const submitForm = () => {
  if (
    !form.value.fullName ||
    !form.value.username ||
    !form.value.phoneNumber ||
    !form.value.role
  ) {
    alert('Vui lòng nhập đầy đủ thông tin')
    return
  }
  confirmAction.value = isEdit.value ? 'edit' : 'add'
  showConfirm.value = true
}

const handleConfirm = async () => {
  showConfirm.value = false
  try {
    if (confirmAction.value === 'edit' && form.value.id) {
      // When updating, don't send password field to avoid overwriting
      const { password, ...updatePayload } = form.value
      await EmployeeService.updateEmployee(form.value.id, updatePayload)
      alert('Cập nhật thành công')
    } else if (confirmAction.value === 'add') {
      // When creating, always set default password
      const payload = { ...form.value, password: '123' }
      await EmployeeService.createEmployee(payload)
      alert('Thêm thành công')
    }
    closeModal()
    loadEmployees()
  } catch (error: any) {
    alert(error?.response?.data || 'Thao tác thất bại')
  }
}

const openDetailConfirm = () => {
  if (
    !form.value.fullName ||
    !form.value.username ||
    !form.value.phoneNumber ||
    !form.value.role
  ) {
    alert('Vui lòng nhập đầy đủ thông tin')
    return
  }
  showDetailConfirm.value = true
}

const handleDetailConfirm = async () => {
  showDetailConfirm.value = false
  if (!form.value.id) return
  try {
    // When updating from detail modal, don't send password field
    const { password, ...updatePayload } = form.value
    await EmployeeService.updateEmployee(form.value.id, updatePayload)
    alert('Cập nhật thành công')
    closeDetailModal()
    await loadEmployees()
  } catch (error: any) {
    alert(error?.response?.data || 'Cập nhật thất bại')
  }
}

const lockEmployeeFromDetail = async () => {
  if (!form.value.id) return
  const actionText = form.value.isActive ? 'khóa' : 'mở khóa'
  if (!confirm(`Bạn có chắc muốn ${actionText} tài khoản này?`)) return
  try {
    await EmployeeService.deleteEmployee(form.value.id)
    alert(`${actionText === 'khóa' ? 'Khóa' : 'Mở khóa'} thành công`)
    closeDetailModal()
    await loadEmployees()
  } catch (error: any) {
    alert(error?.response?.data || 'Thao tác thất bại')
  }
}

const formatGender = (g: string) => ({ MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' })[g] || '---'
const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')

onMounted(loadEmployees)

const formatRole = (role: string) =>
  ({
    STAFF: 'Nhân viên',
    RECEPTION: 'Lễ tân',
    KITCHEN: 'Nhà bếp',
  })[role] || '---'
</script>
<style scoped>
/* PAGE BACKGROUND */
.employee-page {
  padding: 24px;
  min-height: 100vh;
}

/* HEADER */
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

/* CARD */
.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #2d3748;
}

/* GRID */
.search-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 13px;
  margin-bottom: 6px;
  color: #4a5568;
}

/* INPUT */
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

/* BUTTONS */
.add-btn,
.search-btn,
.sort-btn,
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

.add-btn:hover,
.search-btn:hover,
.sort-btn:hover,
.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.reset-btn {
  padding: 10px 18px;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  background: white;
  font-weight: 600;
  cursor: pointer;
}

.reset-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

/* ===== EMPLOYEE TABLE CONTAINER ===== */
.table-wrapper {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

/* ===== EMPLOYEE TABLE ===== */
.employee-table {
  width: 100%;
  border-collapse: collapse;
}

.employee-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.employee-table th {
  padding: 14px;
  text-align: left;
  font-size: 14px;
  white-space: nowrap;
}
.sortable {
  cursor: pointer;
  user-select: none;
  transition: 0.2s;
}

.sortable:hover {
  background: rgba(255, 255, 255, 0.08);
}

.sort-icon {
  margin-left: 6px;
  font-size: 12px;
  opacity: 0.9;
}

.employee-table td {
  padding: 14px;
  font-size: 14px;
  color: #4a5568;
}

.employee-table tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.3s;
}

.employee-table tbody tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

.empty {
  text-align: center;
  padding: 30px;
  color: #718096;
}

/* ROLE BADGE */
.role-badge {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.role-badge.staff {
  background: #bee3f8;
  color: #2c5282;
}

.role-badge.reception {
  background: #ffb6c1; 
  color: #c71585;       
}

.role-badge.kitchen {
  background: #fbd38d;
  color: #7b341e;
}

.status-active,
.status-inactive {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  min-width: 130px;
  text-align: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background: #c6f6d5;
  color: #22543d;
}

.status-inactive {
  background: #fed7d7;
  color: #742a2a;
}

/* ACTION */
.action-group {
  display: flex;
  gap: 8px;
}

.edit-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: #3182ce;
  color: white;
  cursor: pointer;
}

.lock-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: #e53e3e;
  color: white;
  cursor: pointer;
}

/* MODAL */
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
  width: 700px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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

.modal-body {
  padding: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 30px;
  color: #718096;
}

.error-message {
  color: red;
  margin-top: 10px;
}

/* CONFIRM MODAL */
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
/* ===== DETAIL BUTTON ===== */
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

/* ===== DETAIL MODAL ===== */
.detail-modal-box {
  width: 900px;
  max-width: 92vw;
  max-height: 90vh;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.28);
  animation: fadeInScale 0.22s ease;
}

.detail-body {
  padding: 28px;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
  background: #f8fafc;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.detail-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  min-width: 0;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  display: block;
  font-size: 13px;
  color: #718096;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.detail-value {
  display: block;
  font-size: 16px;
  color: #1f2937;
  font-weight: 600;
  line-height: 1.6;
  word-break: break-word;
  white-space: normal;
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 24px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
}

/* Scroll đẹp hơn */
.detail-body::-webkit-scrollbar {
  width: 8px;
}

.detail-body::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 10px;
}

.detail-body::-webkit-scrollbar-track {
  background: transparent;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
/* ===== FILTER BAR ===== */
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

.date-input {
  min-width: 160px;
}

.date-separator {
  font-weight: 500;
  font-size: 14px;
  color: #000;
}

.clear-filter-btn {
  height: 42px;
  padding: 0 18px;
  border: none;
  border-radius: 12px;
  background: #e53e3e;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s;
}

.clear-filter-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(229, 62, 62, 0.25);
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
