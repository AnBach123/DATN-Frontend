<template>
  <div class="combo-container">
    <div class="page-header">
      <h2 class="page-title">Quản lý combo</h2>
      <button class="add-btn" @click="openAddModal">
        + Thêm combo
      </button>
    </div>

    <!-- FILTER -->
    <div class="filters-section">
      <div class="filter-row">
        <input v-model="filters.name" placeholder="Tìm tên combo..." class="search-input" @input="handleSearch" />

        <select v-model="filters.status" class="filter-select" @change="searchCombos">
          <option value="">Trạng thái</option>
          <option value="true">Kinh doanh</option>
          <option value="false">Ngừng kinh doanh</option>
        </select>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-container">
      <table class="combo-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên combo</th>
            <th>Giá</th>
            <th>Số món</th>
            <th>Mô tả</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="loading-cell">Đang tải...</td>
          </tr>

          <tr v-else-if="combos.length === 0">
            <td colspan="6" class="empty-cell">Không có combo</td>
          </tr>

          <tr v-else v-for="c in combos" :key="c.id">
            <td>{{ c.id }}</td>
            <td class="name">{{ c.comboName }}</td>
            <td>{{ formatCurrency(c.comboPrice) }}</td>
            <td>{{ c.itemCount || 0 }} món</td>
            <td class="description-cell" :title="c.description">{{ c.description }}</td>
            <td>
              <span :class="['status', c.isActive ? 'active' : 'inactive']">
                {{ c.isActive ? 'Kinh doanh' : 'Ngừng kinh doanh' }}
              </span>
            </td>
            <td>
              <button class="save-btn" @click="openEdit(c)">
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

    <!-- MODAL -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content large" @click.stop>

        <div class="modal-header">
          <h2>{{ isEdit ? 'Chỉnh sửa combo' : 'Thêm combo' }}</h2>
          <button class="close-btn" @click="closeAddModal">✕</button>
        </div>

        <div class="modal-body">

          <div class="form-grid">

            <div class="form-group full">
              <label>Tên combo</label>
              <input v-model="newCombo.comboName" placeholder="Nhập tên combo" />
            </div>

            <div class="form-group full">
              <label>Giá combo</label>
              <div class="price-section">
                <input 
                  type="number" 
                  v-model="newCombo.comboPrice" 
                  placeholder="0"
                  :class="{ 'price-warning': isPriceInvalid }"
                />
                <div class="price-info">
                  <div class="price-row">
                    <span>Tổng giá món:</span>
                    <strong>{{ formatCurrency(totalProductPrice) }}</strong>
                  </div>
                  <div v-if="totalProductPrice > 0" class="price-row">
                    <span>Giá combo:</span>
                    <strong :class="{ 'text-danger': isPriceInvalid }">
                      {{ formatCurrency(newCombo.comboPrice) }}
                    </strong>
                  </div>
                  <div v-if="totalProductPrice > 0 && newCombo.comboPrice > 0" class="price-row discount">
                    <span>Giảm giá:</span>
                    <strong :class="discountClass">
                      {{ formatCurrency(totalProductPrice - newCombo.comboPrice) }}
                      ({{ discountPercent }}%)
                    </strong>
                  </div>
                  <div v-if="isPriceInvalid" class="price-warning-text">
                    ⚠️ Giá combo phải rẻ hơn tổng giá món!
                  </div>
                  <div v-if="suggestedPrice > 0 && newCombo.comboPrice === 0" class="price-suggestion">
                    💡 Gợi ý: {{ formatCurrency(suggestedPrice) }} (giảm 15%)
                    <button type="button" @click="applySuggestedPrice" class="apply-btn">Áp dụng</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Trạng thái</label>
              <select v-model="newCombo.isActive">
                <option :value="true">Kinh doanh</option>
                <option :value="false">Ngừng kinh doanh</option>
              </select>
            </div>

            <div class="form-group full">
              <label>Mô tả</label>
              <textarea v-model="newCombo.description" placeholder="Nhập mô tả combo"></textarea>
            </div>

            <!-- Upload Image Section -->
            <div class="form-group full">
              <label>Hình ảnh combo</label>
              <div class="image-upload-section">
                <input 
                  type="file" 
                  ref="imageInput" 
                  @change="handleImageSelect" 
                  accept="image/*"
                  style="display: none"
                />
                <button type="button" class="upload-btn" @click="$refs.imageInput.click()">
                  📷 Chọn ảnh
                </button>
                <div v-if="imagePreview" class="image-preview">
                  <img :src="imagePreview" alt="Preview" />
                  <button type="button" class="remove-img-btn" @click="removeImage">✕</button>
                </div>
                <span v-if="!imagePreview" class="upload-hint">Chưa có ảnh</span>
              </div>
            </div>

            <!-- Product Selection Section -->
            <div class="form-group full">
              <label>Chọn món trong combo</label>
              <div class="product-selection">
                <div class="product-search">
                  <input 
                    v-model="productSearchQuery" 
                    placeholder="Tìm món ăn..." 
                    @input="filterProducts"
                  />
                </div>
                
                <div class="product-list">
                  <div 
                    v-for="product in filteredProducts" 
                    :key="product.id"
                    class="product-item"
                    @click="toggleProduct(product)"
                  >
                    <input 
                      type="checkbox" 
                      :checked="isProductSelected(product.id)"
                      @click.stop="toggleProduct(product)"
                    />
                    <span class="product-name">{{ product.productName }}</span>
                    <span class="product-price">{{ formatCurrency(product.unitPrice) }}</span>
                    <input 
                      v-if="isProductSelected(product.id)"
                      type="number" 
                      min="1"
                      :value="getProductQuantity(product.id)"
                      @input="updateProductQuantity(product.id, $event)"
                      @click.stop
                      class="quantity-input"
                      placeholder="SL"
                    />
                  </div>
                </div>

                <div class="selected-products-summary">
                  <strong>Đã chọn: {{ selectedProducts.length }} món</strong>
                  <div v-for="item in selectedProducts" :key="item.productId" class="selected-item">
                    {{ getProductName(item.productId) }} - SL: {{ item.quantity }}
                  </div>
                </div>
              </div>
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
import axiosInstance from '@/services/axiosInstance'

const combos = ref<any[]>([])
const loading = ref(false)
const allProducts = ref<any[]>([])
const filteredProducts = ref<any[]>([])
const productSearchQuery = ref('')

const currentPage = ref(0)
const pageSize = ref(10)
const totalItems = ref(0)

const filters = ref({
  name: '',
  status: ''
})

const showAddModal = ref(false)

const newCombo = ref({
  comboName: '',
  comboPrice: 0,
  description: '',
  isActive: true
})

const selectedProducts = ref<Array<{ productId: number; quantity: number }>>([])
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)

let searchTimeout: any = null

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(searchCombos, 400)
}

const loadProducts = async () => {
  try {
    const response = await axiosInstance.get('/api/products')
    allProducts.value = response.data.data
    filteredProducts.value = allProducts.value
  } catch (error) {
    console.error('Error loading products:', error)
  }
}

const filterProducts = () => {
  const query = productSearchQuery.value.toLowerCase()
  filteredProducts.value = allProducts.value.filter((p: any) =>
    p.productName.toLowerCase().includes(query)
  )
}

let allCombosData = ref<any[]>([])
let filteredData = ref<any[]>([])

const loadCombos = async () => {
  loading.value = true
  try {
    const response = await axiosInstance.get('/api/product-combos')
    const allCombos = response.data.data
    
    // Load item count for each combo
    for (const combo of allCombos) {
      try {
        const itemsResponse = await axiosInstance.get('/api/product-combo-items')
        const items = itemsResponse.data.data.filter((item: any) => item.productComboId === combo.id)
        combo.itemCount = items.length
      } catch {
        combo.itemCount = 0
      }
    }
    
    allCombosData.value = allCombos
    applyFilters()
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  let results = [...allCombosData.value]

  // Lọc theo tên
  if (filters.value.name) {
    results = results.filter((c: any) => 
      c.comboName.toLowerCase().includes(filters.value.name.toLowerCase())
    )
  }

  // Lọc theo trạng thái
  if (filters.value.status !== '') {
    const isActive = filters.value.status === 'true'
    results = results.filter((c: any) => c.isActive === isActive)
  }

  // Sắp xếp: combo đang hoạt động lên trước
  results.sort((a: any, b: any) => {
    if (a.isActive === b.isActive) return 0
    return a.isActive ? -1 : 1
  })

  filteredData.value = results
  totalItems.value = results.length
  currentPage.value = 0
  updateDisplayedCombos()
}

const updateDisplayedCombos = () => {
  const start = currentPage.value * pageSize.value
  const end = start + pageSize.value
  combos.value = filteredData.value.slice(start, end)
}

const searchCombos = () => {
  applyFilters()
}

const paginateData = (data: any[]) => {
  const start = currentPage.value * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
}

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

const goToPage = (page: number) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
    updateDisplayedCombos()
  }
}

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2) + 1)
  const end = Math.min(totalPages.value, start + maxVisible - 1)
  
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

  newCombo.value = {
    comboName: '',
    comboPrice: 0,
    description: '',
    isActive: true
  }
  
  selectedProducts.value = []
  imageFile.value = null
  imagePreview.value = null
  productSearchQuery.value = ''
  filteredProducts.value = allProducts.value

  showAddModal.value = true
}

const closeAddModal = () => showAddModal.value = false

const isEdit = ref(false)
const editingId = ref<number | null>(null)

const openEdit = async (combo: any) => {
  isEdit.value = true
  editingId.value = combo.id

  newCombo.value = {
    comboName: combo.comboName,
    comboPrice: combo.comboPrice,
    description: combo.description,
    isActive: combo.isActive
  }
  
  // Load existing combo items
  try {
    const response = await axiosInstance.get('/api/product-combo-items')
    const items = response.data.data.filter((item: any) => item.productComboId === combo.id)
    selectedProducts.value = items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity
    }))
  } catch (error) {
    console.error('Error loading combo items:', error)
    selectedProducts.value = []
  }
  
  // Load existing image
  try {
    const imgResponse = await axiosInstance.get(`/api/images/combo/${combo.id}/primary`)
    if (imgResponse.data.data) {
      imagePreview.value = imgResponse.data.data.imageUrl
    }
  } catch {
    imagePreview.value = null
  }
  
  productSearchQuery.value = ''
  filteredProducts.value = allProducts.value

  showAddModal.value = true
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

const toggleProduct = (product: any) => {
  const index = selectedProducts.value.findIndex(p => p.productId === product.id)
  if (index > -1) {
    selectedProducts.value.splice(index, 1)
  } else {
    selectedProducts.value.push({ productId: product.id, quantity: 1 })
  }
}

const isProductSelected = (productId: number) => {
  return selectedProducts.value.some(p => p.productId === productId)
}

const getProductQuantity = (productId: number) => {
  const item = selectedProducts.value.find(p => p.productId === productId)
  return item?.quantity || 1
}

const updateProductQuantity = (productId: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const quantity = parseInt(target.value) || 1
  const item = selectedProducts.value.find(p => p.productId === productId)
  if (item) {
    item.quantity = Math.max(1, quantity)
  }
}

const getProductName = (productId: number) => {
  const product = allProducts.value.find(p => p.id === productId)
  return product?.productName || ''
}

const totalProductPrice = computed(() => {
  return selectedProducts.value.reduce((total, item) => {
    const product = allProducts.value.find(p => p.id === item.productId)
    if (product) {
      return total + (product.unitPrice * item.quantity)
    }
    return total
  }, 0)
})

const isPriceInvalid = computed(() => {
  if (totalProductPrice.value === 0) return false
  return newCombo.value.comboPrice >= totalProductPrice.value
})

const discountPercent = computed(() => {
  if (totalProductPrice.value === 0) return 0
  const discount = ((totalProductPrice.value - newCombo.value.comboPrice) / totalProductPrice.value) * 100
  return Math.round(discount)
})

const discountClass = computed(() => {
  const percent = discountPercent.value
  if (percent < 0) return 'text-danger'
  if (percent < 10) return 'text-warning'
  return 'text-success'
})

const suggestedPrice = computed(() => {
  if (totalProductPrice.value === 0) return 0
  // Suggest 15% discount
  return Math.round(totalProductPrice.value * 0.85)
})

const applySuggestedPrice = () => {
  newCombo.value.comboPrice = suggestedPrice.value
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

const handleSubmit = async () => {
  // Validate: Must have at least 1 product
  if (selectedProducts.value.length === 0) {
    alert('Vui lòng chọn ít nhất 1 món cho combo!')
    return
  }

  // Validate: Combo price must be less than total product price
  if (isPriceInvalid.value) {
    alert('Giá combo phải rẻ hơn tổng giá các món!')
    return
  }

  // Validate: Combo price must be greater than 0
  if (newCombo.value.comboPrice <= 0) {
    alert('Vui lòng nhập giá combo!')
    return
  }

  // Validate: Must have image
  if (!imageFile.value && !imagePreview.value) {
    alert('Vui lòng chọn ảnh cho combo!')
    return
  }

  try {
    let comboId: number

    // Step 1: Create or update combo
    if (isEdit.value) {
      await axiosInstance.put(`/api/product-combos/${editingId.value}`, newCombo.value)
      comboId = editingId.value!
      
      // Delete old combo items before adding new ones
      await axiosInstance.delete(`/api/product-combo-items/combo/${comboId}`)
    } else {
      const response = await axiosInstance.post('/api/product-combos', newCombo.value)
      comboId = response.data.data.id
    }

    // Step 2: Add combo items
    for (const item of selectedProducts.value) {
      await axiosInstance.post('/api/product-combo-items', {
        productComboId: comboId,
        productId: item.productId,
        quantity: item.quantity
      })
    }

    // Step 3: Upload image (only if new image selected)
    if (imageFile.value) {
      const formData = new FormData()
      formData.append('image', imageFile.value)
      
      await axiosInstance.post(`/api/images/combo/${comboId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    }

    closeAddModal()
    loadCombos()
  } catch (error) {
    console.error('Error submitting combo:', error)
    alert('Có lỗi xảy ra khi lưu combo')
  }
}

onMounted(() => {
  loadProducts()
  loadCombos()
})
</script>

<style scoped>
.combo-container {
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

.combo-table {
  width: 100%;
  border-collapse: collapse;
}

.combo-table thead {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.combo-table th,
.combo-table td {
  padding: 12px;
}

.combo-table tbody tr:hover {
  background: #f0f4ff;
}

.name {
  font-weight: 600;
}

.description-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}

.status {
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.active {
  background: #c6f6d5;
}

.inactive {
  background: #fed7d7;
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 20px;
}

/* ===== MODAL ===== */
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
  width: 520px;
  max-width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: slideUp 0.3s;
}

.modal-content.large {
  width: 800px;
}

.modal-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  justify-content: space-between;
  border-radius: 20px 20px 0 0;
  position: sticky;
  top: 0;
  z-index: 10;
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

.form-group input.price-warning {
  border-color: #ef4444;
  background: #fef2f2;
}

/* Price Section */
.price-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.price-info {
  padding: 12px;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.price-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.price-row.discount {
  border-top: 1px solid #e2e8f0;
  margin-top: 6px;
  padding-top: 10px;
}

.text-danger {
  color: #ef4444;
}

.text-warning {
  color: #f59e0b;
}

.text-success {
  color: #10b981;
}

.price-warning-text {
  color: #ef4444;
  font-size: 13px;
  margin-top: 8px;
  padding: 8px;
  background: #fef2f2;
  border-radius: 6px;
  border-left: 3px solid #ef4444;
}

.price-suggestion {
  margin-top: 8px;
  padding: 8px;
  background: #eff6ff;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.apply-btn {
  padding: 4px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
}

.apply-btn:hover {
  background: #2563eb;
}

/* Image Upload */
.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-btn {
  padding: 10px 16px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  width: fit-content;
}

.image-preview {
  position: relative;
  width: 200px;
  height: 200px;
  border: 2px dashed #ddd;
  border-radius: 10px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-img-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  cursor: pointer;
}

.upload-hint {
  font-size: 12px;
  color: #a0aec0;
}

/* Product Selection */
.product-selection {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 15px;
  background: #f7fafc;
}

.product-search input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 10px;
}

.product-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  margin-bottom: 15px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.product-item:hover {
  background: #f7fafc;
}

.product-item input[type="checkbox"] {
  cursor: pointer;
}

.product-name {
  flex: 1;
  font-weight: 500;
}

.product-price {
  color: #667eea;
  font-weight: 600;
  font-size: 14px;
}

.quantity-input {
  width: 60px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 5px;
  text-align: center;
}

.selected-products-summary {
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.selected-item {
  padding: 5px 0;
  font-size: 13px;
  color: #4a5568;
}

.modal-footer {
  padding: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.cancel-btn {
  background: #e2e8f0;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
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
