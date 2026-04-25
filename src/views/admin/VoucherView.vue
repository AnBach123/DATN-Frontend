<template>
  <div class="voucher-page">
    <div class="content">
      <AdminPageHeader title="Quản lý voucher">
        <template #actions>
          <button class="add-btn" @click="handleAddVoucher">+ Thêm voucher</button>
        </template>
      </AdminPageHeader>

      <!-- TABS -->
      <div class="tabs">
        <button
          :class="['tab-btn', { active: activeTab === 'product' }]"
          @click="activeTab = 'product'"
        >
          Voucher Sản Phẩm
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'customer' }]"
          @click="activeTab = 'customer'"
        >
          Voucher Hóa Đơn
        </button>
      </div>

      <!-- PRODUCT VOUCHER TAB -->
      <div v-if="activeTab === 'product'" class="tab-content">
        <div class="filter-bar">
          <input
            v-model="productFilters.keyword"
            type="text"
            class="filter-input keyword-input"
            placeholder="Tìm theo mã hoặc tên voucher..."
            @input="searchProductVouchers"
          />
          <select v-model="productFilters.status" class="filter-input" @change="searchProductVouchers">
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hoạt động</option>
            <option value="false">Không hoạt động</option>
          </select>
        </div>

        <div v-if="loadingProduct" class="loading">Đang tải dữ liệu...</div>
        <div v-else class="table-wrapper">
          <table class="voucher-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mã Voucher</th>
                <th>Tên Voucher</th>
                <th>Giảm giá</th>
                <th>Sản phẩm</th>
                <th>SL còn lại</th>
                <th>Từ ngày</th>
                <th>Đến ngày</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="productVouchers.length === 0">
                <td colspan="10" class="empty">Không có dữ liệu</td>
              </tr>
              <tr
                v-for="voucher in productVouchers"
                :key="voucher.id"
                :class="{ 'row-discontinued': !voucher.isActive }"
              >
                <td>{{ voucher.id }}</td>
                <td>{{ voucher.voucherCode }}</td>
                <td>{{ voucher.voucherName }}</td>
                <td>
                  <span class="discount-badge">{{ voucher.discountPercent }}%</span>
                </td>
                <td>{{ voucher.productName }}</td>
                <td>{{ voucher.remainingQuantity }}</td>
                <td>{{ formatDate(voucher.validFrom) }}</td>
                <td>{{ formatDate(voucher.validTo) }}</td>
                <td>
                  <span :class="getProductStatusClass(voucher.isActive)">
                    {{ formatProductStatus(voucher.isActive) }}
                  </span>
                </td>
                <td>
                  <button class="detail-btn" @click="openProductDetailModal(voucher)">Chi tiết</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION FOR PRODUCT VOUCHERS -->
        <div class="pagination-section" v-if="productTotalPages > 1">
          <button
            @click="goToProductPage(productCurrentPage - 1)"
            :disabled="productCurrentPage === 0"
            class="pagination-btn"
          >
            ‹ Trước
          </button>
          
          <div class="page-numbers">
            <button
              v-for="page in productVisiblePages"
              :key="page"
              @click="goToProductPage(page - 1)"
              :class="['page-btn', { active: page - 1 === productCurrentPage }]"
            >
              {{ page }}
            </button>
          </div>

          <button
            @click="goToProductPage(productCurrentPage + 1)"
            :disabled="productCurrentPage >= productTotalPages - 1"
            class="pagination-btn"
          >
            Sau ›
          </button>
        </div>
      </div>

      <!-- CUSTOMER VOUCHER TAB -->
      <div v-if="activeTab === 'customer'" class="tab-content">
        <div class="filter-bar">
          <input
            v-model="customerFilters.keyword"
            type="text"
            class="filter-input keyword-input"
            placeholder="Tìm theo mã voucher..."
            @input="searchCustomerVouchers"
          />
          <select v-model="customerFilters.status" class="filter-input" @change="searchCustomerVouchers">
            <option value="">Tất cả trạng thái</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Đã dùng">Đã dùng</option>
            <option value="Hết hạn">Hết hạn</option>
            <option value="Không hoạt động">Không hoạt động</option>
          </select>
        </div>

        <div v-if="loadingCustomer" class="loading">Đang tải dữ liệu...</div>
        <div v-else class="table-wrapper">
          <table class="voucher-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mã Voucher</th>
                <th>Tên Voucher</th>
                <th>Ngày phát hành</th>
                <th>Ngày hết hạn</th>
                <th>SL còn lại</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="customerVouchers.length === 0">
                <td colspan="8" class="empty">Không có dữ liệu</td>
              </tr>
              <tr
                v-for="voucher in customerVouchers"
                :key="voucher.id"
                :class="{ 'row-discontinued': voucher.voucherStatus !== 'Hoạt động' && voucher.voucherStatus !== 'ACTIVE' }"
              >
                <td>{{ voucher.id }}</td>
                <td>{{ voucher.voucherCode }}</td>
                <td>{{ voucher.voucherName }}</td>
                <td>{{ formatDate(voucher.issuedAt) }}</td>
                <td>{{ formatDate(voucher.expiresAt) }}</td>
                <td>{{ voucher.remainingQuantity }}</td>
                <td>
                  <span :class="getStatusClass(voucher.voucherStatus)">
                    {{ formatStatus(voucher.voucherStatus) }}
                  </span>
                </td>
                <td>
                  <button class="detail-btn" @click="openCustomerDetailModal(voucher)">Chi tiết</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION FOR CUSTOMER VOUCHERS -->
        <div class="pagination-section" v-if="customerTotalPages > 1">
          <button
            @click="goToCustomerPage(customerCurrentPage - 1)"
            :disabled="customerCurrentPage === 0"
            class="pagination-btn"
          >
            ‹ Trước
          </button>
          
          <div class="page-numbers">
            <button
              v-for="page in customerVisiblePages"
              :key="page"
              @click="goToCustomerPage(page - 1)"
              :class="['page-btn', { active: page - 1 === customerCurrentPage }]"
            >
              {{ page }}
            </button>
          </div>

          <button
            @click="goToCustomerPage(customerCurrentPage + 1)"
            :disabled="customerCurrentPage >= customerTotalPages - 1"
            class="pagination-btn"
          >
            Sau ›
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL THÊM PRODUCT VOUCHER -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Thêm Voucher Sản Phẩm</h3>
          <button class="close-btn" @click="closeAddModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Sản phẩm *</label>
              <select v-model="productForm.productId" class="product-select">
                <option value="">-- Chọn sản phẩm --</option>
                <optgroup label="━━━ Sản phẩm chưa có voucher ━━━">
                  <option 
                    v-for="product in productsWithVoucherStatus.filter(p => !p.hasActiveVoucher)" 
                    :key="product.id" 
                    :value="product.id"
                  >
                    {{ product.productName }}
                  </option>
                </optgroup>
                <optgroup label="━━━ Sản phẩm đã có voucher ━━━" v-if="productsWithVoucherStatus.filter(p => p.hasActiveVoucher).length > 0">
                  <option 
                    v-for="product in productsWithVoucherStatus.filter(p => p.hasActiveVoucher)" 
                    :key="product.id" 
                    :value="product.id"
                    disabled
                  >
                    {{ product.productName }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="form-group">
              <label>Mã Voucher *</label>
              <input v-model="productForm.voucherCode" type="text" placeholder="VD: SALE20" style="text-transform: uppercase" @input="productForm.voucherCode = productForm.voucherCode.toUpperCase()" />
            </div>
            <div class="form-group">
              <label>Tên Voucher *</label>
              <input v-model="productForm.voucherName" type="text" placeholder="VD: Giảm 20%" />
            </div>
            <div class="form-group">
              <label>Giảm giá (%) *</label>
              <input v-model="productForm.discountPercent" type="number" min="1" max="100" />
            </div>
            <div class="form-group">
              <label>Số lượng</label>
              <input v-model="productForm.remainingQuantity" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>Từ ngày</label>
              <input 
                v-model="productForm.validFrom" 
                type="date"
                :class="{ 'input-error': productFormErrors.validFrom }"
              />
              <span v-if="productFormErrors.validFrom" class="error-message">{{ productFormErrors.validFrom }}</span>
            </div>
            <div class="form-group">
              <label>Đến ngày</label>
              <input 
                v-model="productForm.validTo" 
                type="date"
                :class="{ 'input-error': productFormErrors.validTo }"
              />
              <span v-if="productFormErrors.validTo" class="error-message">{{ productFormErrors.validTo }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="reset-btn" @click="closeAddModal">Hủy</button>
          <button class="save-btn" @click="submitAddProductVoucher">Thêm mới</button>
        </div>
      </div>
    </div>

    <!-- MODAL THÊM CUSTOMER VOUCHER -->
    <div v-if="showAddCustomerModal" class="modal-overlay" @click.self="closeAddCustomerModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Thêm Voucher Hóa Đơn</h3>
          <button class="close-btn" @click="closeAddCustomerModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Mã Voucher * (tối đa 8 ký tự)</label>
              <input v-model="customerForm.voucherCode" type="text" placeholder="VD: VIP50" maxlength="8" style="text-transform: uppercase" @input="customerForm.voucherCode = customerForm.voucherCode.toUpperCase()" />
            </div>
            <div class="form-group">
              <label>Tên Voucher *</label>
              <input v-model="customerForm.voucherName" type="text" placeholder="VD: Giảm 50% VIP" />
            </div>
            <div class="form-group">
              <label>Giảm giá (%) *</label>
              <input v-model="customerForm.discountPercent" type="number" min="1" max="100" />
            </div>
            <div class="form-group">
              <label>Số tiền tối thiểu (VNĐ)</label>
              <input v-model="customerForm.minOrderAmount" type="number" min="0" step="1000" placeholder="VD: 100000" />
            </div>
            <div class="form-group">
              <label>Ngày phát hành</label>
              <input 
                v-model="customerForm.issuedAt" 
                type="date"
                :class="{ 'input-error': customerFormErrors.issuedAt }"
              />
              <span v-if="customerFormErrors.issuedAt" class="error-message">{{ customerFormErrors.issuedAt }}</span>
            </div>
            <div class="form-group">
              <label>Ngày hết hạn</label>
              <input 
                v-model="customerForm.expiresAt" 
                type="date"
                :class="{ 'input-error': customerFormErrors.expiresAt }"
              />
              <span v-if="customerFormErrors.expiresAt" class="error-message">{{ customerFormErrors.expiresAt }}</span>
            </div>
            <div class="form-group">
              <label>Số lượng còn lại</label>
              <input v-model="customerForm.remainingQuantity" type="number" min="0" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="reset-btn" @click="closeAddCustomerModal">Hủy</button>
          <button class="save-btn" @click="submitAddCustomerVoucher">Thêm mới</button>
        </div>
      </div>
    </div>

    <!-- MODAL CHI TIẾT PRODUCT VOUCHER -->
    <div v-if="showProductDetailModal" class="modal-overlay" @click.self="closeProductDetailModal">
      <div class="detail-modal-box">
        <div class="modal-header">
          <h3>Chi tiết Voucher Sản Phẩm</h3>
          <button class="close-btn" @click="closeProductDetailModal">×</button>
        </div>
        <div class="detail-body">
          <div class="form-grid">
            <div class="form-group">
              <label>ID</label>
              <input :value="productForm.id" type="text" disabled />
            </div>
            <div class="form-group">
              <label>Ngày tạo</label>
              <input :value="selectedProductVoucher ? formatDateTime(selectedProductVoucher.createdAt) : ''" type="text" disabled />
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Sản phẩm *</label>
              <input :value="selectedProductVoucher ? selectedProductVoucher.productName : ''" type="text" disabled />
            </div>
            <div class="form-group">
              <label>Mã Voucher *</label>
              <input :value="productForm.voucherCode" type="text" disabled />
            </div>
            <div class="form-group">
              <label>Tên Voucher *</label>
              <input :value="productForm.voucherName" type="text" disabled />
            </div>
            <div class="form-group">
              <label>Giảm giá (%) *</label>
              <input :value="productForm.discountPercent" type="text" disabled />
            </div>
            <div class="form-group">
              <label>Số lượng</label>
              <input v-model="productForm.remainingQuantity" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>Từ ngày</label>
              <input 
                v-model="productForm.validFrom" 
                type="date"
                :class="{ 'input-error': productFormErrors.validFrom }"
              />
              <span v-if="productFormErrors.validFrom" class="error-message">{{ productFormErrors.validFrom }}</span>
            </div>
            <div class="form-group">
              <label>Đến ngày</label>
              <input 
                v-model="productForm.validTo" 
                type="date"
                :class="{ 'input-error': productFormErrors.validTo }"
              />
              <span v-if="productFormErrors.validTo" class="error-message">{{ productFormErrors.validTo }}</span>
            </div>
            <div class="form-group">
              <label>Trạng thái</label>
              <select v-model="productForm.isActive">
                <option :value="true">Hoạt động</option>
                <option :value="false">Không hoạt động</option>
              </select>
            </div>
          </div>
        </div>
        <div class="detail-footer">
          <button class="reset-btn" @click="closeProductDetailModal">Đóng</button>
          <button class="save-btn" @click="updateProductVoucher">Cập nhật</button>
          <button class="lock-btn" @click="disableProductVoucher">Vô hiệu hóa</button>
        </div>
      </div>
    </div>

    <!-- MODAL CHI TIẾT CUSTOMER VOUCHER -->
    <div v-if="showCustomerDetailModal" class="modal-overlay" @click.self="closeCustomerDetailModal">
      <div class="detail-modal-box">
        <div class="modal-header">
          <h3>Chi tiết Voucher Hóa Đơn</h3>
          <button class="close-btn" @click="closeCustomerDetailModal">×</button>
        </div>
        <div class="detail-body">
          <div class="form-grid">
            <div class="form-group">
              <label>ID</label>
              <input :value="customerForm.id" type="text" disabled />
            </div>
            <div class="form-group">
              <label>Ngày tạo</label>
              <input :value="selectedCustomerVoucher ? formatDateTime(selectedCustomerVoucher.createdAt) : ''" type="text" disabled />
            </div>
            <div class="form-group">
              <label>Mã Voucher</label>
              <input :value="customerForm.voucherCode" type="text" disabled />
            </div>
            <div class="form-group">
              <label>Tên Voucher</label>
              <input :value="customerForm.voucherName" type="text" disabled />
            </div>
            <div class="form-group">
              <label>Giảm giá (%)</label>
              <input :value="customerForm.discountPercent" type="text" disabled />
            </div>
            <div class="form-group">
              <label>Số tiền tối thiểu (VNĐ)</label>
              <input :value="customerForm.minOrderAmount ? customerForm.minOrderAmount.toLocaleString('vi-VN') : '0'" type="text" disabled />
            </div>
            <div class="form-group">
              <label>Ngày phát hành</label>
              <input v-model="customerForm.issuedAt" type="date" />
            </div>
            <div class="form-group">
              <label>Ngày hết hạn</label>
              <input v-model="customerForm.expiresAt" type="date" />
            </div>
            <div class="form-group">
              <label>Số lượng còn lại</label>
              <input v-model="customerForm.remainingQuantity" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>Trạng thái</label>
              <select v-model="customerForm.isActive">
                <option :value="true">Hoạt động</option>
                <option :value="false">Không hoạt động</option>
              </select>
            </div>
          </div>
        </div>
        <div class="detail-footer">
          <button class="reset-btn" @click="closeCustomerDetailModal">Đóng</button>
          <button class="save-btn" @click="updateCustomerVoucher">Cập nhật</button>
          <button class="lock-btn" @click="disableCustomerVoucher">Vô hiệu hóa</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import VoucherService from '@/services/voucherService'
import axiosInstance from '@/services/axiosInstance'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'

const activeTab = ref('product')

// Validation errors for customer voucher form
const customerFormErrors = ref({
  issuedAt: '',
  expiresAt: '',
})

// Validation errors for product voucher form
const productFormErrors = ref({
  validFrom: '',
  validTo: '',
})

// Product Voucher State
const productVouchers = ref<any[]>([])
const allProductVouchers = ref<any[]>([])
const loadingProduct = ref(false)
const productFilters = ref({ keyword: '', status: '' })
const showAddModal = ref(false)
const showProductDetailModal = ref(false)
const selectedProductVoucher = ref<any | null>(null)
const products = ref<any[]>([])

// Computed: Products with voucher status
const productsWithVoucherStatus = computed(() => {
  return products.value
    .filter(product => product.availabilityStatus === 'AVAILABLE') // Only show available products
    .map(product => {
      // Find if this product has an ACTIVE voucher
      const activeVoucher = allProductVouchers.value.find(
        v => v.productId === product.id && v.isActive === true
      )
      
      return {
        ...product,
        hasActiveVoucher: !!activeVoucher,
        activeVoucherCode: activeVoucher?.voucherCode || null,
        activeVoucherName: activeVoucher?.voucherName || null,
      }
    })
})

const productCurrentPage = ref(0)
const productPageSize = ref(10)

const productForm = ref({
  id: null as number | null,
  voucherCode: '',
  voucherName: '',
  discountPercent: 0,
  productId: '',
  remainingQuantity: 0,
  validFrom: '',
  validTo: '',
  isActive: true,
})

// Customer Voucher State
const customerVouchers = ref<any[]>([])
const allCustomerVouchers = ref<any[]>([])
const loadingCustomer = ref(false)
const customerFilters = ref({ keyword: '', status: '' })
const showCustomerDetailModal = ref(false)
const showAddCustomerModal = ref(false)
const selectedCustomerVoucher = ref<any | null>(null)

const customerCurrentPage = ref(0)
const customerPageSize = ref(10)

const customerForm = ref({
  id: null as number | null,
  personalVoucherId: null as number | null,
  voucherCode: '',
  voucherName: '',
  discountPercent: 0,
  minOrderAmount: 0,
  issuedAt: '',
  expiresAt: '',
  remainingQuantity: 0,
  voucherStatus: '',
  isActive: true, // Add isActive field for status control
})

// Load Products for dropdown
const loadProducts = async () => {
  try {
    const response = await axiosInstance.get('/api/products')
    products.value = response.data.data || []
  } catch (error) {
    console.error('Failed to load products:', error)
  }
}

// Load Product Vouchers
const loadProductVouchers = async () => {
  try {
    loadingProduct.value = true
    const response = await VoucherService.getAllProductVouchers()
    allProductVouchers.value = response.data.data || []
    productCurrentPage.value = 0
    productVouchers.value = paginateProductData(allProductVouchers.value)
  } catch (error) {
    console.error('Failed to load product vouchers:', error)
  } finally {
    loadingProduct.value = false
  }
}

// Search Product Vouchers
let productTimeout: any = null
const searchProductVouchers = () => {
  clearTimeout(productTimeout)
  productTimeout = setTimeout(async () => {
    if (!productFilters.value.keyword && !productFilters.value.status) {
      await loadProductVouchers()
      return
    }
    
    const response = await VoucherService.getAllProductVouchers()
    const allData = response.data.data || []
    
    const filtered = allData.filter((v: any) => {
      const matchKeyword = !productFilters.value.keyword ||
        v.voucherCode?.toLowerCase().includes(productFilters.value.keyword.toLowerCase()) ||
        v.voucherName?.toLowerCase().includes(productFilters.value.keyword.toLowerCase())
      
      const matchStatus = !productFilters.value.status ||
        String(v.isActive) === productFilters.value.status
      
      return matchKeyword && matchStatus
    })
    
    allProductVouchers.value = filtered
    productCurrentPage.value = 0
    productVouchers.value = paginateProductData(filtered)
  }, 400)
}

// Load Customer Vouchers
const loadCustomerVouchers = async () => {
  try {
    loadingCustomer.value = true
    const response = await VoucherService.getAllCustomerVouchers()
    allCustomerVouchers.value = response.data.data || []
    customerCurrentPage.value = 0
    customerVouchers.value = paginateCustomerData(allCustomerVouchers.value)
  } catch (error) {
    console.error('Failed to load customer vouchers:', error)
  } finally {
    loadingCustomer.value = false
  }
}

// Search Customer Vouchers
let customerTimeout: any = null
const searchCustomerVouchers = () => {
  clearTimeout(customerTimeout)
  customerTimeout = setTimeout(async () => {
    if (!customerFilters.value.keyword && !customerFilters.value.status) {
      await loadCustomerVouchers()
      return
    }
    
    const response = await VoucherService.getAllCustomerVouchers()
    const allData = response.data.data || []
    
    const filtered = allData.filter((v: any) => {
      const matchKeyword = !customerFilters.value.keyword ||
        v.voucherCode?.toLowerCase().includes(customerFilters.value.keyword.toLowerCase())
      
      const matchStatus = !customerFilters.value.status ||
        v.voucherStatus === customerFilters.value.status
      
      return matchKeyword && matchStatus
    })
    
    allCustomerVouchers.value = filtered
    customerCurrentPage.value = 0
    customerVouchers.value = paginateCustomerData(filtered)
  }, 400)
}

// Handle Add Voucher Button
const handleAddVoucher = () => {
  if (activeTab.value === 'customer') {
    resetCustomerForm()
    showAddCustomerModal.value = true
    return
  }
  resetProductForm()
  showAddModal.value = true
}

// Product Voucher Modals
const resetProductForm = () => {
  productForm.value = {
    id: null,
    voucherCode: '',
    voucherName: '',
    discountPercent: 0,
    productId: '',
    remainingQuantity: 0,
    validFrom: '',
    validTo: '',
    isActive: true,
  }
  // Reset validation errors
  productFormErrors.value = {
    validFrom: '',
    validTo: '',
  }
}

// Real-time validation for product voucher validFrom
watch(() => productForm.value.validFrom, (newValue) => {
  if (!newValue) {
    productFormErrors.value.validFrom = ''
    return
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fromDate = new Date(newValue)
  
  if (fromDate < today) {
    productFormErrors.value.validFrom = 'Ngày bắt đầu không được ở quá khứ'
  } else {
    productFormErrors.value.validFrom = ''
  }
  
  // Also validate validTo if both dates are set
  if (productForm.value.validTo) {
    validateProductValidTo()
  }
})

// Real-time validation for product voucher validTo
watch(() => productForm.value.validTo, () => {
  validateProductValidTo()
})

const validateProductValidTo = () => {
  if (!productForm.value.validTo) {
    productFormErrors.value.validTo = ''
    return
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const toDate = new Date(productForm.value.validTo)
  
  if (toDate < today) {
    productFormErrors.value.validTo = 'Ngày kết thúc phải trong tương lai'
    return
  }
  
  if (productForm.value.validFrom) {
    const fromDate = new Date(productForm.value.validFrom)
    if (toDate < fromDate) {
      productFormErrors.value.validTo = 'Ngày kết thúc phải sau ngày bắt đầu'
      return
    }
  }
  
  productFormErrors.value.validTo = ''
}

const closeAddModal = () => {
  showAddModal.value = false
  resetProductForm()
}

const openProductDetailModal = (voucher: any) => {
  selectedProductVoucher.value = voucher
  productForm.value = {
    id: voucher.id,
    voucherCode: voucher.voucherCode,
    voucherName: voucher.voucherName,
    discountPercent: voucher.discountPercent,
    productId: voucher.productId,
    remainingQuantity: voucher.remainingQuantity,
    validFrom: voucher.validFrom,
    validTo: voucher.validTo,
    isActive: voucher.isActive,
  }
  showProductDetailModal.value = true
}

const closeProductDetailModal = () => {
  showProductDetailModal.value = false
  selectedProductVoucher.value = null
}

// Submit Add Product Voucher
const submitAddProductVoucher = async () => {
  // Check for validation errors first
  if (productFormErrors.value.validFrom || productFormErrors.value.validTo) {
    alert('Vui lòng sửa các lỗi trước khi tiếp tục')
    return
  }
  
  if (!productForm.value.voucherCode || !productForm.value.voucherName || 
      !productForm.value.discountPercent || !productForm.value.productId) {
    alert('Vui lòng nhập đầy đủ thông tin bắt buộc')
    return
  }

  // Validate discount percent
  const discount = Number(productForm.value.discountPercent)
  if (discount < 1 || discount > 100) {
    alert('Giảm giá phải từ 1% đến 100%')
    return
  }

  // FIX #7: Validate date range
  if (productForm.value.validFrom && productForm.value.validTo) {
    if (new Date(productForm.value.validTo) < new Date(productForm.value.validFrom)) {
      alert('Ngày kết thúc phải sau ngày bắt đầu')
      return
    }
  }

  // FIX #9: Validate remaining quantity
  const remainingQty = Number(productForm.value.remainingQuantity)
  if (remainingQty < 0) {
    alert('Số lượng không được âm')
    return
  }

  try {
    const payload = {
      voucherCode: productForm.value.voucherCode,
      voucherName: productForm.value.voucherName,
      discountPercent: discount,
      productId: Number(productForm.value.productId),
      remainingQuantity: remainingQty,
      validFrom: productForm.value.validFrom || undefined,
      validTo: productForm.value.validTo || undefined,
      // isActive is auto-set to true by backend, no need to send
    }
    await VoucherService.createProductVoucher(payload)
    alert('Thêm voucher thành công')
    closeAddModal()
    await loadProductVouchers()
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Thêm voucher thất bại')
  }
}

// Update Product Voucher
const updateProductVoucher = async () => {
  if (!productForm.value.id) return
  
  // Check for validation errors first
  if (productFormErrors.value.validFrom || productFormErrors.value.validTo) {
    alert('Vui lòng sửa các lỗi trước khi tiếp tục')
    return
  }

  // FIX #7: Validate date range
  if (productForm.value.validFrom && productForm.value.validTo) {
    if (new Date(productForm.value.validTo) < new Date(productForm.value.validFrom)) {
      alert('Ngày kết thúc phải sau ngày bắt đầu')
      return
    }
  }

  // FIX #9: Validate remaining quantity
  const remainingQty = Number(productForm.value.remainingQuantity)
  if (remainingQty < 0) {
    alert('Số lượng không được âm')
    return
  }

  try {
    // Only send fields that are allowed to be updated
    // Backend will ignore voucherCode, voucherName, discountPercent, productId
    const payload = {
      remainingQuantity: remainingQty,
      validFrom: productForm.value.validFrom || undefined,
      validTo: productForm.value.validTo || undefined,
      isActive: productForm.value.isActive,
    }
    await VoucherService.updateProductVoucher(productForm.value.id, payload)
    alert('Cập nhật voucher thành công')
    closeProductDetailModal()
    await loadProductVouchers()
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Cập nhật voucher thất bại')
  }
}

// Disable Product Voucher
const disableProductVoucher = async () => {
  if (!productForm.value.id) return
  
  if (!confirm('Bạn có chắc muốn vô hiệu hóa voucher này?')) return

  try {
    await VoucherService.deleteProductVoucher(productForm.value.id)
    alert('Vô hiệu hóa voucher thành công')
    closeProductDetailModal()
    await loadProductVouchers()
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Vô hiệu hóa voucher thất bại')
  }
}

// Customer Voucher Modals
const resetCustomerForm = () => {
  customerForm.value = {
    id: null,
    personalVoucherId: null,
    voucherCode: '',
    voucherName: '',
    discountPercent: 0,
    minOrderAmount: 0,
    issuedAt: '',
    expiresAt: '',
    remainingQuantity: 0,
    voucherStatus: '',
    isActive: true, // Default to active
  }
  // Reset validation errors
  customerFormErrors.value = {
    issuedAt: '',
    expiresAt: '',
  }
}

// Real-time validation for issued date
watch(() => customerForm.value.issuedAt, (newValue) => {
  if (!newValue) {
    customerFormErrors.value.issuedAt = ''
    return
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const issuedDate = new Date(newValue)
  
  if (issuedDate < today) {
    customerFormErrors.value.issuedAt = 'Ngày phát hành không được ở quá khứ'
  } else {
    customerFormErrors.value.issuedAt = ''
  }
  
  // Also validate expiry date if both dates are set
  if (customerForm.value.expiresAt) {
    validateExpiryDate()
  }
})

// Real-time validation for expiry date
watch(() => customerForm.value.expiresAt, () => {
  validateExpiryDate()
})

const validateExpiryDate = () => {
  if (!customerForm.value.expiresAt) {
    customerFormErrors.value.expiresAt = ''
    return
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiryDate = new Date(customerForm.value.expiresAt)
  
  if (expiryDate < today) {
    customerFormErrors.value.expiresAt = 'Ngày hết hạn phải trong tương lai'
    return
  }
  
  if (customerForm.value.issuedAt) {
    const issuedDate = new Date(customerForm.value.issuedAt)
    if (expiryDate < issuedDate) {
      customerFormErrors.value.expiresAt = 'Ngày hết hạn phải sau ngày phát hành'
      return
    }
  }
  
  customerFormErrors.value.expiresAt = ''
}

const closeAddCustomerModal = () => {
  showAddCustomerModal.value = false
  resetCustomerForm()
}

const submitAddCustomerVoucher = async () => {
  // Check for validation errors first
  if (customerFormErrors.value.issuedAt || customerFormErrors.value.expiresAt) {
    alert('Vui lòng sửa các lỗi trước khi tiếp tục')
    return
  }
  
  // Validate required fields for direct creation
  if (!customerForm.value.voucherCode || !customerForm.value.voucherName || !customerForm.value.discountPercent) {
    alert('Vui lòng nhập đầy đủ: mã voucher, tên voucher, % giảm giá')
    return
  }
  
  // Validate discount percent
  const discount = Number(customerForm.value.discountPercent)
  if (discount < 1 || discount > 100) {
    alert('Giảm giá phải từ 1% đến 100%')
    return
  }

  // Validate minOrderAmount
  const minAmount = Number(customerForm.value.minOrderAmount)
  if (minAmount < 0) {
    alert('Số tiền tối thiểu không được âm')
    return
  }

  // Validate date range
  if (customerForm.value.issuedAt && customerForm.value.expiresAt) {
    if (new Date(customerForm.value.expiresAt) < new Date(customerForm.value.issuedAt)) {
      alert('Ngày hết hạn phải sau ngày phát hành')
      return
    }
  }

  // Validate expiry date must be in the future
  if (customerForm.value.expiresAt) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiryDate = new Date(customerForm.value.expiresAt)
    if (expiryDate < today) {
      alert('Ngày hết hạn phải trong tương lai')
      return
    }
  }

  // Validate remaining quantity
  const remainingQty = Number(customerForm.value.remainingQuantity)
  if (remainingQty < 0) {
    alert('Số lượng không được âm')
    return
  }

  try {
    const payload: any = {
      voucherCode: customerForm.value.voucherCode,
      voucherName: customerForm.value.voucherName,
      discountPercent: discount,
      minOrderAmount: minAmount,
      issuedAt: customerForm.value.issuedAt || undefined,
      expiresAt: customerForm.value.expiresAt || undefined,
      remainingQuantity: remainingQty,
      isActive: true,
    }

    await VoucherService.createCustomerVoucher(payload)
    alert('Thêm voucher hóa đơn thành công')
    closeAddCustomerModal()
    await loadCustomerVouchers()
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Thêm voucher hóa đơn thất bại')
  }
}

const openCustomerDetailModal = (voucher: any) => {
  selectedCustomerVoucher.value = voucher
  customerForm.value = {
    id: voucher.id,
    personalVoucherId: voucher.personalVoucherId,
    voucherCode: voucher.voucherCode,
    voucherName: voucher.voucherName,
    discountPercent: voucher.discountPercent || 0,
    minOrderAmount: voucher.minOrderAmount || 0,
    issuedAt: voucher.issuedAt,
    expiresAt: voucher.expiresAt,
    remainingQuantity: voucher.remainingQuantity,
    voucherStatus: voucher.voucherStatus,
    // Map voucherStatus to isActive
    isActive: voucher.voucherStatus === 'Hoạt động',
  }
  showCustomerDetailModal.value = true
}

const closeCustomerDetailModal = () => {
  showCustomerDetailModal.value = false
  selectedCustomerVoucher.value = null
}

// Update Customer Voucher
const updateCustomerVoucher = async () => {
  if (!customerForm.value.id) return

  // FIX #7: Validate date range
  if (customerForm.value.issuedAt && customerForm.value.expiresAt) {
    if (new Date(customerForm.value.expiresAt) < new Date(customerForm.value.issuedAt)) {
      alert('Ngày hết hạn phải sau ngày phát hành')
      return
    }
  }

  // FIX #9: Validate remaining quantity
  const remainingQty = Number(customerForm.value.remainingQuantity)
  if (remainingQty < 0) {
    alert('Số lượng không được âm')
    return
  }

  // NEW FIX: If trying to activate voucher, validate expiry date is not in the past
  const wasInactive = selectedCustomerVoucher.value?.voucherStatus !== 'Hoạt động'
  const tryingToActivate = customerForm.value.isActive === true
  
  if (wasInactive && tryingToActivate && customerForm.value.expiresAt) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiryDate = new Date(customerForm.value.expiresAt)
    
    if (expiryDate < today) {
      alert('Không thể kích hoạt voucher đã hết hạn. Vui lòng cập nhật ngày hết hạn trước.')
      return
    }
  }

  try {
    const payload: any = {
      personalVoucherId: customerForm.value.personalVoucherId!,
      issuedAt: customerForm.value.issuedAt || undefined,
      expiresAt: customerForm.value.expiresAt || undefined,
      remainingQuantity: remainingQty,
      isActive: customerForm.value.isActive, // Add isActive to payload
    }
    await VoucherService.updateCustomerVoucher(customerForm.value.id, payload)
    alert('Cập nhật voucher khách hàng thành công')
    closeCustomerDetailModal()
    await loadCustomerVouchers()
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Cập nhật voucher khách hàng thất bại')
  }
}

// Disable Customer Voucher
const disableCustomerVoucher = async () => {
  if (!customerForm.value.id) return
  
  if (!confirm('Bạn có chắc muốn vô hiệu hóa voucher này?')) return

  try {
    await VoucherService.deleteCustomerVoucher(customerForm.value.id)
    alert('Vô hiệu hóa voucher thành công')
    closeCustomerDetailModal()
    await loadCustomerVouchers()
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Vô hiệu hóa voucher thất bại')
  }
}

// Format helpers
const formatDate = (date: string) => {
  if (!date) return '---'
  const d = new Date(date)
  return d.toLocaleDateString('vi-VN')
}

const formatDateTime = (datetime: string) => {
  if (!datetime) return '---'
  const d = new Date(datetime)
  return d.toLocaleString('vi-VN')
}

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'Hoạt động': 'Hoạt động',
    'Đã dùng': 'Đã dùng',
    'Hết hạn': 'Hết hạn',
    'Không hoạt động': 'Không hoạt động',
    // Fallback cho trường hợp còn data cũ
    'ACTIVE': 'Hoạt động',
    'USED': 'Đã dùng',
    'EXPIRED': 'Hết hạn',
    'INACTIVE': 'Không hoạt động',
  }
  return statusMap[status] || status
}

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    'Hoạt động': 'status-active',
    'Đã dùng': 'status-used',
    'Hết hạn': 'status-expired',
    'Không hoạt động': 'status-inactive',
    // Fallback cho trường hợp còn data cũ
    'ACTIVE': 'status-active',
    'USED': 'status-used',
    'EXPIRED': 'status-expired',
    'INACTIVE': 'status-inactive',
  }
  return classMap[status] || 'status-inactive'
}

// Format Product Voucher Status (handle both Boolean and String)
const formatProductStatus = (isActive: any) => {
  if (typeof isActive === 'boolean') {
    return isActive ? 'Hoạt động' : 'Không hoạt động'
  }
  if (typeof isActive === 'string') {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'Hoạt động',
      'INACTIVE': 'Không hoạt động',
      'true': 'Hoạt động',
      'false': 'Không hoạt động',
    }
    return statusMap[isActive] || 'Không hoạt động'
  }
  return isActive ? 'Hoạt động' : 'Không hoạt động'
}

const getProductStatusClass = (isActive: any) => {
  if (typeof isActive === 'boolean') {
    return isActive ? 'status-active' : 'status-inactive'
  }
  if (typeof isActive === 'string') {
    return (isActive === 'ACTIVE' || isActive === 'true') ? 'status-active' : 'status-inactive'
  }
  return isActive ? 'status-active' : 'status-inactive'
}

// Pagination helpers
const paginateProductData = (data: any[]) => {
  const start = productCurrentPage.value * productPageSize.value
  const end = start + productPageSize.value
  return data.slice(start, end)
}

const paginateCustomerData = (data: any[]) => {
  const start = customerCurrentPage.value * customerPageSize.value
  const end = start + customerPageSize.value
  return data.slice(start, end)
}

const productTotalPages = computed(() => Math.ceil(allProductVouchers.value.length / productPageSize.value))
const customerTotalPages = computed(() => Math.ceil(allCustomerVouchers.value.length / customerPageSize.value))

const goToProductPage = (page: number) => {
  if (page >= 0 && page < productTotalPages.value) {
    productCurrentPage.value = page
    productVouchers.value = paginateProductData(allProductVouchers.value)
  }
}

const goToCustomerPage = (page: number) => {
  if (page >= 0 && page < customerTotalPages.value) {
    customerCurrentPage.value = page
    customerVouchers.value = paginateCustomerData(allCustomerVouchers.value)
  }
}

const productVisiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, productCurrentPage.value - Math.floor(maxVisible / 2) + 1)
  let end = Math.min(productTotalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const customerVisiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, customerCurrentPage.value - Math.floor(maxVisible / 2) + 1)
  let end = Math.min(customerTotalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

onMounted(() => {
  loadProducts()
  loadProductVouchers()
  loadCustomerVouchers()
})
</script>

<style scoped>
.voucher-page {
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

/* TABS */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.tab-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #4a5568;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.tab-btn:hover:not(.active) {
  background: rgba(102, 126, 234, 0.1);
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* FILTER BAR */
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

/* TABLE */
.table-wrapper {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.voucher-table {
  width: 100%;
  border-collapse: collapse;
}

.voucher-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.voucher-table th {
  padding: 14px;
  text-align: left;
  font-size: 14px;
  white-space: nowrap;
}

.voucher-table td {
  padding: 14px;
  font-size: 14px;
  color: #4a5568;
}

.voucher-table tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.3s;
}

.voucher-table tbody tr:hover {
  background: rgba(102, 126, 234, 0.05);
}

/* Voucher đã ngừng / hết hạn / đã dùng — làm xám mờ để dễ phân biệt */
.voucher-table tbody tr.row-discontinued {
  background: #f8fafc;
  color: #94a3b8;
}

.voucher-table tbody tr.row-discontinued td {
  color: #94a3b8;
}

.voucher-table tbody tr.row-discontinued .discount-badge {
  opacity: 0.55;
  filter: grayscale(70%);
}

.voucher-table tbody tr.row-discontinued:hover {
  background: #f1f5f9;
}

.empty {
  text-align: center;
  padding: 30px;
  color: #718096;
}

/* BADGES */
.discount-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  font-size: 12px;
  font-weight: 700;
}

.status-active {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #c6f6d5;
  color: #22543d;
}

.status-inactive {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #fed7d7;
  color: #742a2a;
}

.status-used {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #bee3f8;
  color: #2c5282;
}

.status-expired {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #e2e8f0;
  color: #4a5568;
}

/* BUTTONS */
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

.loading {
  text-align: center;
  padding: 30px;
  color: #718096;
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
  animation: fadeIn 0.2s ease;
}

.modal-box {
  width: 700px;
  max-width: 92vw;
  max-height: 75vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  top: -5vh;
}

.detail-modal-box {
  width: 900px;
  max-width: 92vw;
  max-height: 80vh;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.28);
  animation: slideUp 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  top: -5vh;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 22px;
  cursor: pointer;
  transition: 0.2s;
}

.close-btn:hover {
  transform: scale(1.1);
}

.modal-body,
.detail-body {
  padding: 24px;
  background: #f8fafc;
  overflow-y: auto;
}

.modal-body {
  max-height: 50vh;
}

.detail-body {
  max-height: 55vh;
}

.detail-body::-webkit-scrollbar,
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.detail-body::-webkit-scrollbar-thumb,
.modal-body::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 10px;
}

/* FORM */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

input:disabled {
  background: #f7fafc;
  color: #718096;
  cursor: not-allowed;
}

/* Product select with better optgroup styling */
.product-select {
  font-size: 14px;
  max-height: 200px;
}

.product-select optgroup {
  font-weight: 700;
  font-size: 13px;
  color: #2d3748;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  padding: 8px 4px;
  margin: 4px 0;
  border-top: 2px solid #667eea;
  border-bottom: 2px solid #667eea;
}

.product-select optgroup[label*="đã có"] {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  border-top: 2px solid #e53e3e;
  border-bottom: 2px solid #e53e3e;
  color: #742a2a;
}

.product-select option {
  padding: 10px 12px;
  font-size: 14px;
  background: white;
}

/* Disabled option styling */
.product-select option:disabled {
  color: #a0aec0;
  font-style: italic;
  background: #f7fafc;
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

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
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

.lock-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  background: #e53e3e;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
}

.lock-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(229, 62, 62, 0.4);
}

/* MODE SELECTOR */
.mode-selector {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.mode-btn {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #4a5568;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.mode-btn:hover:not(.active) {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

/* CUSTOMER SEARCH */
.customer-search-group {
  position: relative;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-wrapper input {
  flex: 1;
  padding-right: 40px;
}

.clear-btn {
  position: absolute;
  right: 10px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #e2e8f0;
  color: #4a5568;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #cbd5e0;
  color: #2d3748;
}

.customer-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 2px solid #667eea;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 100;
  margin-top: 4px;
}

.customer-dropdown::-webkit-scrollbar {
  width: 6px;
}

.customer-dropdown::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 10px;
}

.customer-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.customer-item:last-child {
  border-bottom: none;
}

.customer-item:hover {
  background: rgba(102, 126, 234, 0.08);
}

.customer-name {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
}

.customer-info {
  font-size: 12px;
  color: #718096;
}

.selected-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: #c6f6d5;
  color: #22543d;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
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

/* ERROR STYLING */
.input-error {
  border-color: #e53e3e !important;
  background-color: #fff5f5;
}

.input-error:focus {
  border-color: #e53e3e !important;
  box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1) !important;
}

.error-message {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #e53e3e;
  font-weight: 500;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>