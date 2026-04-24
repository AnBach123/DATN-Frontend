<template>
  <div class="product-container">
    <div class="page-header">
      <h2 class="page-title">Quản lý sản phẩm</h2>
      <button class="add-btn" @click="openAddModal">
        + Thêm sản phẩm
      </button>
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
          <option value="">Tất cả</option>
          <option value="AVAILABLE">Kinh doanh</option>
          <option value="DISCONTINUED">Ngừng kinh doanh</option>
        </select>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-container">
      <table class="product-table">
        <thead>
          <tr>
            <th>Ảnh</th>
            <th @click="sortBy('id')">
              ID
              <span v-if="sortField === 'id'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>

            <th>Mã SP</th>

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
            <td colspan="9" class="loading-cell">Đang tải...</td>
          </tr>

          <tr v-else-if="products.length === 0">
            <td colspan="9" class="empty-cell">Không có sản phẩm</td>
          </tr>

          <tr v-else v-for="p in products" :key="p.id">
            <td>
              <img 
                v-if="p.imageUrl" 
                :src="p.imageUrl" 
                alt="Product" 
                class="product-thumbnail"
                @error="onImgError"
              />
              <div v-else class="no-image">📷</div>
            </td>
            <td>{{ p.id }}</td>
            <td class="code-cell">{{ p.productCode || '—' }}</td>
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
                Chi tiết
              </button>
            </td>
          </tr>
        </tbody>
      </table>
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

    <!--MODAL -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content" @click.stop>

        <div class="modal-header">
          <h2>{{ isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm' }}</h2>
          <button class="close-btn" @click="closeAddModal">✕</button>
        </div>

        <div class="modal-body">

          <div class="form-grid">

            <div class="form-group full">
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

            <div class="form-group full">
              <label>Trạng thái</label>
              <select v-model="newProduct.availabilityStatus">
                <option value="AVAILABLE">Kinh doanh</option>
                <option value="DISCONTINUED">Ngừng kinh doanh</option>
              </select>
            </div>

            <div class="form-group full">
              <label>Ảnh sản phẩm</label>
              <div class="image-upload-section">
                <input 
                  type="file" 
                  ref="imageInput" 
                  accept="image/*" 
                  @change="handleImageSelect"
                  style="display: none"
                />
                <button type="button" class="upload-btn" @click="triggerImageUpload">
                  Chọn ảnh
                </button>
                <div v-if="imagePreview" class="image-preview">
                  <img :src="imagePreview" alt="Preview" />
                  <button type="button" class="remove-image-btn" @click="removeImage">✕</button>
                </div>
              </div>
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
import { ref, computed, onMounted } from 'vue'
import * as productApi from '@/services/admin/productApi'
import axiosInstance from '@/services/axiosInstance'

const products = ref<any[]>([])
const allProductsData = ref<any[]>([])
const filteredData = ref<any[]>([])
const loading = ref(false)

const sortField = ref('')
const sortDirection = ref('asc')

const currentPage = ref(0)
const pageSize = ref(10)
const totalItems = ref(0)

const filters = ref({
  name: '',
  category: '',
  status: ''
})

const showAddModal = ref(false)

const newProduct = ref({
  productName: '',
  productCode: '',
  productCategory: 'RAW_FOOD',
  unitPrice: 0,
  description: '',
  availabilityStatus: 'AVAILABLE'
})

const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)

let searchTimeout: any = null

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(searchProducts, 400)
}

const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    imageFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  imageFile.value = null
  imagePreview.value = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

const loadProducts = async () => {
  loading.value = true
  try {
    allProductsData.value = await productApi.getAllProducts()
    
    // Sắp xếp: Kinh doanh lên trước
    allProductsData.value.sort((a: any, b: any) => {
      if (a.availabilityStatus === 'AVAILABLE' && b.availabilityStatus !== 'AVAILABLE') return -1
      if (a.availabilityStatus !== 'AVAILABLE' && b.availabilityStatus === 'AVAILABLE') return 1
      return 0
    })
    
    filteredData.value = allProductsData.value
    totalItems.value = filteredData.value.length
    currentPage.value = 0
    updateDisplayedProducts()
  } finally {
    loading.value = false
  }
}

const searchProducts = async () => {
  loading.value = true
  try {
    const results = await productApi.searchProducts({
      name: filters.value.name || undefined,
      category: filters.value.category || undefined,
      status: filters.value.status || undefined
    })
    
    // Sắp xếp: Kinh doanh lên trước
    results.sort((a: any, b: any) => {
      if (a.availabilityStatus === 'AVAILABLE' && b.availabilityStatus !== 'AVAILABLE') return -1
      if (a.availabilityStatus !== 'AVAILABLE' && b.availabilityStatus === 'AVAILABLE') return 1
      return 0
    })
    
    filteredData.value = results
    totalItems.value = filteredData.value.length
    currentPage.value = 0
    updateDisplayedProducts()
  } finally {
    loading.value = false
  }
}

const updateDisplayedProducts = () => {
  const start = currentPage.value * pageSize.value
  const end = start + pageSize.value
  products.value = filteredData.value.slice(start, end)
}

const sortBy = async (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }

  const sorted = await productApi.sortProducts(sortField.value, sortDirection.value)
  filteredData.value = sorted
  totalItems.value = filteredData.value.length
  currentPage.value = 0
  updateDisplayedProducts()
}

const goToPage = (page: number) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
    updateDisplayedProducts()
  }
}

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

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

const openAddModal = () => {
  isEdit.value = false
  editingId.value = null

  newProduct.value = {
    productName: '',
    productCode: '',
    productCategory: 'RAW_FOOD',
    unitPrice: 0,
    description: '',
    availabilityStatus: 'AVAILABLE'
  }

  removeImage()
  showAddModal.value = true
}

const closeAddModal = () => showAddModal.value = false

const isEdit = ref(false)
const editingId = ref<number | null>(null)

const openEdit = (product: any) => {
  isEdit.value = true
  editingId.value = product.id

  newProduct.value = {
    productName: product.productName,
    productCode: product.productCode || '',
    productCategory: product.productCategory,
    unitPrice: product.unitPrice,
    description: product.description,
    availabilityStatus: product.availabilityStatus
  }
  
  // Load existing image if available
  if (product.imageUrl) {
    imagePreview.value = product.imageUrl
  } else {
    removeImage()
  }

  showAddModal.value = true
}

const onImgError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = 'https://picsum.photos/100/100'
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const getStatusClass = (status: string) => ({
  AVAILABLE: 'available',
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
  AVAILABLE: 'Kinh doanh',
  DISCONTINUED: 'Ngừng kinh doanh'
}[status] || status)

const handleSubmit = async () => {
  try {
    let productId: number
    
    if (isEdit.value) {
      await productApi.updateProduct(editingId.value!, newProduct.value)
      productId = editingId.value!
    } else {
      const response = await productApi.createProduct(newProduct.value)
      productId = response.id
    }
    
    // Upload image if selected
    if (imageFile.value && productId) {
      const formData = new FormData()
      formData.append('file', imageFile.value)
      await axiosInstance.post(`/api/images/product/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    closeAddModal()
    loadProducts()
  } catch (error) {
    console.error('Error saving product:', error)
    alert('Lỗi khi lưu sản phẩm: ' + error)
  }
}

onMounted(loadProducts)
</script>

<style scoped>
.product-container {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
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

.add-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
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

.product-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.no-image {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7fafc;
  border-radius: 8px;
  border: 2px dashed #cbd5e0;
  font-size: 24px;
}

.name {
  font-weight: 600;
}

.uppercase-input {
  text-transform: uppercase;
}

.uppercase-input::placeholder {
  text-transform: none;
}

.status {
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.available {
  background: #c6f6d5;
  color: #22543d;
}

.dis {
  background: #fed7d7;
  color: #742a2a;
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 20px;
}

/* IMAGE UPLOAD */
.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-btn {
  padding: 9px 20px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.25s;
  width: fit-content;
}

.upload-btn:hover {
  background: #667eea;
  color: white;
}

.image-preview {
  position: relative;
  width: 200px;
  height: 200px;
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== MODAL (CHUẨN - ĐÃ CLEAN) ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 600px;
  max-width: 95%;
  max-height: 90vh;
  overflow-y: auto;
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
