<template>
  <div class="product-container">
    <div class="header-section">
      <h2>Quản lý sản phẩm</h2>
    </div>

    <!-- FILTER -->
    <div class="filters-section">
      <div class="filter-row">
        <input v-model="filters.name" placeholder="Tìm tên sản phẩm..." class="search-input" @input="handleSearch" />

        <select v-model="filters.category" class="filter-select" @change="searchProducts">
          <option value="">Danh mục</option>
          <option value="RAW_FOOD">Thực phẩm sống</option>
          <option value="COOKED_FOOD">Thực phẩm đã chế biến</option>
          <option value="HOT_POT_BROTH">Nước lẩu</option>
          <option value="DRINK">Đồ uống</option>
          <option value="DESSERT">Tráng miệng</option>
        </select>

        <select v-model="filters.status" class="filter-select" @change="searchProducts">
          <option value="">Trạng thái</option>
          <option value="AVAILABLE">Còn hàng</option>
          <option value="OUT_OF_STOCK">Hết hàng</option>
          <option value="DISCONTINUED">Ngừng bán</option>
        </select>

        <button class="add-btn" @click="openAddModal">
          + Thêm sản phẩm
        </button>

        <button class="clear-btn" @click="clearFilters">
          Xóa lọc
        </button>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-container">
      <table class="product-table">
        <thead>
          <tr>
            <th @click="sortBy('id')">
              ID
              <span v-if="sortField === 'id'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>

            <th @click="sortBy('name')">
              Tên
              <span v-if="sortField === 'name'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>

            <th @click="sortBy('price')">
              Giá
              <span v-if="sortField === 'price'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>

            <th>Danh mục</th>
            <th>Mô tả</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="loading-cell">Đang tải...</td>
          </tr>

          <tr v-else-if="products.length === 0">
            <td colspan="6" class="empty-cell">Không có sản phẩm</td>
          </tr>

          <tr v-else v-for="p in products" :key="p.id">
            <td>{{ p.id }}</td>
            <td class="name">{{ p.productName }}</td>
            <td>{{ formatCurrency(p.unitPrice) }}</td>

            <td>{{ getCategoryText(p.productCategory) }}</td>

            <td>{{ p.description }}</td>

            <td>
              <span :class="['status', getStatusClass(p.availabilityStatus)]">
                {{ getStatusText(p.availabilityStatus) }}
              </span>
            </td>

            <td>
              <button class="save-btn" @click="openEdit(p)">
                Sửa
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!--MODAL -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content" @click.stop>

        <div class="modal-header">
          <h2>{{ isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm' }}</h2>
          <button class="close-btn" @click="closeAddModal">✕</button>
        </div>

        <div class="modal-body">

          <div class="form-grid">

            <div class="form-group">
              <label>Tên sản phẩm</label>
              <input v-model="newProduct.productName" />
            </div>

            <div class="form-group">
              <label>Danh mục</label>
              <select v-model="newProduct.productCategory">
                <option value="RAW_FOOD">Thực phẩm sống</option>
                <option value="COOKED_FOOD">Món ăn chín</option>
                <option value="HOT_POT_BROTH">Nước lẩu</option>
                <option value="DRINK">Đồ uống</option>
                <option value="DESSERT">Tráng miệng</option>
              </select>
            </div>

            <div class="form-group">
              <label>Giá</label>
              <input type="number" v-model="newProduct.unitPrice" />
            </div>

            <div class="form-group">
              <label>Số lượng</label>
              <input type="number" v-model="newProduct.stockQuantity" />
            </div>

            <div class="form-group">
              <label>Trạng thái</label>
              <select v-model="newProduct.availabilityStatus">
                <option value="AVAILABLE">Còn hàng</option>
                <option value="OUT_OF_STOCK">Hết hàng</option>
                <option value="DISCONTINUED">Ngừng bán</option>
              </select>
            </div>

            <div class="form-group full">
              <label>Mô tả</label>
              <textarea v-model="newProduct.description"></textarea>
            </div>

          </div>

        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="closeAddModal">Hủy</button>
          <button class="save-btn" @click="handleSubmit">
            {{ isEdit ? 'Cập nhật' : 'Thêm mới' }}
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axiosInstance from '@/services/axiosInstance'

const products = ref<any[]>([])
const loading = ref(false)

const sortField = ref('')
const sortDirection = ref('asc')

const filters = ref({
  name: '',
  category: '',
  status: ''
})

const showAddModal = ref(false)

const newProduct = ref({
  productName: '',
  productCategory: 'RAW_FOOD',
  unitPrice: 0,
  description: '',
  availabilityStatus: 'AVAILABLE',
  stockQuantity: 0
})

let searchTimeout: any = null

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(searchProducts, 400)
}

const loadProducts = async () => {
  loading.value = true
  try {
    const res = await axiosInstance.get('/api/products')
    products.value = res.data.data
  } finally {
    loading.value = false
  }
}

const searchProducts = async () => {
  loading.value = true
  try {
    const res = await axiosInstance.get('/api/products/search', {
      params: {
        name: filters.value.name || undefined,
        category: filters.value.category || undefined,
        status: filters.value.status || undefined
      }
    })
    products.value = res.data.data
  } finally {
    loading.value = false
  }
}

const sortBy = async (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }

  const res = await axiosInstance.get('/api/products/sort', {
    params: {
      field: sortField.value,
      direction: sortDirection.value
    }
  })

  products.value = res.data.data
}

const clearFilters = () => {
  filters.value = { name: '', category: '', status: '' }
  loadProducts()
}

const openAddModal = () => {
  isEdit.value = false
  editingId.value = null

  newProduct.value = {
    productName: '',
    productCategory: 'RAW_FOOD',
    unitPrice: 0,
    description: '',
    availabilityStatus: 'AVAILABLE',
    stockQuantity: 0
  }

  showAddModal.value = true
}
const closeAddModal = () => showAddModal.value = false

const isEdit = ref(false)
const editingId = ref<number | null>(null)

const openEdit = (product: any) => {
  isEdit.value = true
  editingId.value = product.id

  // clone object tránh dính reference
  newProduct.value = {
    productName: product.productName,
    productCategory: product.productCategory,
    unitPrice: product.unitPrice,
    description: product.description,
    availabilityStatus: product.availabilityStatus,
    stockQuantity: product.stockQuantity
  }

  showAddModal.value = true
}

const createProduct = async () => {
  await axiosInstance.post('/api/products', newProduct.value)
  closeAddModal()
  loadProducts()
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const getStatusClass = (status: string) => ({
  AVAILABLE: 'available',
  OUT_OF_STOCK: 'out',
  DISCONTINUED: 'dis'
}[status])

const getCategoryText = (category: string) => ({
  RAW_FOOD: 'Thực phẩm sống',
  COOKED_FOOD: 'Món ăn chín',
  HOT_POT_BROTH: 'Nước lẩu',
  DRINK: 'Đồ uống',
  DESSERT: 'Tráng miệng'
}[category] || category)

const getStatusText = (status: string) => ({
  AVAILABLE: 'Còn hàng',
  OUT_OF_STOCK: 'Hết hàng',
  DISCONTINUED: 'Ngừng bán'
}[status] || status)

const handleSubmit = async () => {
  if (isEdit.value) {
    await axiosInstance.put(`/api/products/${editingId.value}`, newProduct.value)
  } else {
    await axiosInstance.post('/api/products', newProduct.value)
  }

  closeAddModal()
  loadProducts()
}

onMounted(loadProducts)
</script>

<style scoped>
.product-container {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  min-height: 100vh;
}

.header-section h2 {
  font-size: 26px;
  margin-bottom: 20px;
}

.filters-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  flex: 1;
  min-width: 250px;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s;
}

.clear-btn {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.product-table {
  width: 100%;
  border-collapse: collapse;
}

.product-table thead {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.product-table th,
.product-table td {
  padding: 12px;
}

.product-table tbody tr:hover {
  background: #f0f4ff;
}

.name {
  font-weight: 600;
}

.status {
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.available {
  background: #c6f6d5;
}

.out {
  background: #fed7d7;
}

.dis {
  background: #e2e8f0;
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 20px;
}

.add-btn {
  background: #38a169;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
}

/* ===== MODAL (CHUẨN - ĐÃ CLEAN) ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 520px;
  max-width: 95%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: slideUp 0.3s;
}

.modal-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  justify-content: space-between;
  border-radius: 20px 20px 0 0;
}

.close-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  color: white;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full {
  grid-column: span 2;
}

.form-group label {
  font-size: 12px;
  margin-bottom: 4px;
  color: #718096;
  font-weight: 600;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ddd;
}

.modal-footer {
  padding: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  background: #e2e8f0;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
}

.save-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

/* ANIMATION */
@keyframes slideUp {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>