<template>
  <div class="voucher-page">
    <div class="content">
      <div class="page-header">
        <h2 class="page-title">QUẢN LÝ VOUCHER</h2>
        <button class="add-btn" @click="handleAddVoucher">+ Thêm voucher</button>
      </div>

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
              <tr v-for="voucher in productVouchers" :key="voucher.id">
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
      </div>

      <!-- CUSTOMER VOUCHER TAB -->
      <div v-if="activeTab === 'customer'" class="tab-content">
        <div class="filter-bar">
          <input
            v-model="customerFilters.keyword"
            type="text"
            class="filter-input keyword-input"
            placeholder="Tìm theo mã voucher hoặc tên khách hàng..."
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
                <th>Khách hàng</th>
                <th>Ngày phát hành</th>
                <th>Ngày hết hạn</th>
                <th>SL còn lại</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="customerVouchers.length === 0">
                <td colspan="9" class="empty">Không có dữ liệu</td>
              </tr>
              <tr v-for="voucher in customerVouchers" :key="voucher.id">
                <td>{{ voucher.id }}</td>
                <td>{{ voucher.voucherCode }}</td>
                <td>{{ voucher.voucherName }}</td>
                <td>{{ voucher.customerFullName }}</td>
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
              <label>Sản phẩm *</label>
              <select v-model="productForm.productId">
                <option value="">-- Chọn sản phẩm --</option>
                <option v-for="product in products" :key="product.id" :value="product.id">
                  {{ product.productName }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Số lượng</label>
              <input v-model="productForm.remainingQuantity" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>Từ ngày</label>
              <input v-model="productForm.validFrom" type="date" />
            </div>
            <div class="form-group">
              <label>Đến ngày</label>
              <input v-model="productForm.validTo" type="date" />
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
          <h3>Thêm Voucher Khách Hàng</h3>
          <button class="close-btn" @click="closeAddCustomerModal">×</button>
        </div>

        <!-- MODE SELECTOR -->
        <div class="mode-selector">
          <button 
            :class="['mode-btn', { active: voucherCreationMode === 'template' }]"
            @click="voucherCreationMode = 'template'"
          >
            📋 Từ Template
          </button>
          <button 
            :class="['mode-btn', { active: voucherCreationMode === 'direct' }]"
            @click="voucherCreationMode = 'direct'"
          >
            ✏️ Tạo Trực Tiếp
          </button>
        </div>

        <div class="modal-body">
          <!-- MODE: FROM TEMPLATE -->
          <div v-if="voucherCreationMode === 'template'" class="form-grid">
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Voucher Template *</label>
              <select v-model="customerForm.personalVoucherId">
                <option value="">-- Chọn voucher template --</option>
                <option v-for="voucher in personalVouchers" :key="voucher.id" :value="voucher.id">
                  {{ voucher.voucherCode }} - {{ voucher.voucherName }} ({{ voucher.discountPercent }}%)
                </option>
              </select>
            </div>
            <div class="form-group customer-search-group" style="grid-column: 1 / -1;">
              <label>Khách hàng * <span v-if="customerForm.customerId" class="selected-badge">✓ Đã chọn</span></label>
              <div class="search-input-wrapper">
                <input 
                  v-model="customerSearchKeyword" 
                  type="text" 
                  placeholder="Nhập tên, SĐT hoặc email để tìm..."
                  @input="searchCustomers"
                  @focus="searchCustomers"
                />
                <button v-if="customerForm.customerId" class="clear-btn" @click="clearCustomerSelection" type="button">×</button>
              </div>
              <div v-if="showCustomerDropdown" class="customer-dropdown">
                <div 
                  v-for="customer in filteredCustomers" 
                  :key="customer.id"
                  class="customer-item"
                  @click="selectCustomer(customer)"
                >
                  <div class="customer-name">{{ customer.fullName }}</div>
                  <div class="customer-info">{{ customer.phoneNumber }} • {{ customer.email }}</div>
                </div>
              </div>
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
          </div>

          <!-- MODE: DIRECT CREATION -->
          <div v-else class="form-grid">
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
            <div class="form-group customer-search-group" style="grid-column: 1 / -1;">
              <label>Khách hàng * <span v-if="customerForm.customerId" class="selected-badge">✓ Đã chọn</span></label>
              <div class="search-input-wrapper">
                <input 
                  v-model="customerSearchKeyword" 
                  type="text" 
                  placeholder="Nhập tên, SĐT hoặc email để tìm..."
                  @input="searchCustomers"
                  @focus="searchCustomers"
                />
                <button v-if="customerForm.customerId" class="clear-btn" @click="clearCustomerSelection" type="button">×</button>
              </div>
              <div v-if="showCustomerDropdown" class="customer-dropdown">
                <div 
                  v-for="customer in filteredCustomers" 
                  :key="customer.id"
                  class="customer-item"
                  @click="selectCustomer(customer)"
                >
                  <div class="customer-name">{{ customer.fullName }}</div>
                  <div class="customer-info">{{ customer.phoneNumber }} • {{ customer.email }}</div>
                </div>
              </div>
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
            <div class="form-group">
              <label>Mã Voucher *</label>
              <input v-model="productForm.voucherCode" type="text" style="text-transform: uppercase" @input="productForm.voucherCode = productForm.voucherCode.toUpperCase()" />
            </div>
            <div class="form-group">
              <label>Tên Voucher *</label>
              <input v-model="productForm.voucherName" type="text" />
            </div>
            <div class="form-group">
              <label>Giảm giá (%) *</label>
              <input v-model="productForm.discountPercent" type="number" min="1" max="100" />
            </div>
            <div class="form-group">
              <label>Sản phẩm *</label>
              <select v-model="productForm.productId">
                <option value="">-- Chọn sản phẩm --</option>
                <option v-for="product in products" :key="product.id" :value="product.id">
                  {{ product.productName }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Số lượng</label>
              <input v-model="productForm.remainingQuantity" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>Từ ngày</label>
              <input v-model="productForm.validFrom" type="date" />
            </div>
            <div class="form-group">
              <label>Đến ngày</label>
              <input v-model="productForm.validTo" type="date" />
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
          <h3>Chi tiết Voucher Khách Hàng</h3>
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
              <label>Khách hàng</label>
              <input :value="customerForm.customerFullName" type="text" disabled />
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
              <input :value="formatStatus(customerForm.voucherStatus)" type="text" disabled />
            </div>
          </div>
        </div>
        <div class="detail-footer">
          <button class="reset-btn" @click="closeCustomerDetailModal">Đóng</button>
          <button class="save-btn" @click="updateCustomerVoucher">Cập nhật</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import VoucherService from '@/services/voucherService'
import axiosInstance from '@/services/axiosInstance'

const activeTab = ref('product')

// Product Voucher State
const productVouchers = ref<any[]>([])
const loadingProduct = ref(false)
const productFilters = ref({ keyword: '', status: '' })
const showAddModal = ref(false)
const showProductDetailModal = ref(false)
const selectedProductVoucher = ref<any | null>(null)
const products = ref<any[]>([])

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
const loadingCustomer = ref(false)
const customerFilters = ref({ keyword: '', status: '' })
const showCustomerDetailModal = ref(false)
const showAddCustomerModal = ref(false)
const selectedCustomerVoucher = ref<any | null>(null)
const personalVouchers = ref<any[]>([])
const customers = ref<any[]>([])
const voucherCreationMode = ref<'template' | 'direct'>('template') // New: track creation mode

// Customer search
const customerSearchKeyword = ref('')
const filteredCustomers = ref<any[]>([])
const showCustomerDropdown = ref(false)

const customerForm = ref({
  id: null as number | null,
  personalVoucherId: null as number | null,
  voucherCode: '',
  voucherName: '',
  discountPercent: 0,
  customerId: null as number | null,
  customerFullName: '',
  issuedAt: '',
  expiresAt: '',
  remainingQuantity: 0,
  voucherStatus: '',
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

// Load Personal Vouchers for dropdown
const loadPersonalVouchers = async () => {
  try {
    const response = await VoucherService.getAllPersonalVouchers()
    personalVouchers.value = response.data.data || []
  } catch (error) {
    console.error('Failed to load personal vouchers:', error)
  }
}

// Load Customers for dropdown
const loadCustomers = async () => {
  try {
    const response = await VoucherService.getAllCustomers()
    customers.value = response.data.data || []
  } catch (error) {
    console.error('Failed to load customers:', error)
  }
}

// Load Product Vouchers
const loadProductVouchers = async () => {
  try {
    loadingProduct.value = true
    const response = await VoucherService.getAllProductVouchers()
    productVouchers.value = response.data.data || []
    
    // Debug: Check data structure
    if (productVouchers.value.length > 0) {
      console.log('Sample voucher:', productVouchers.value[0])
      console.log('isActive type:', typeof productVouchers.value[0].isActive)
      console.log('isActive value:', productVouchers.value[0].isActive)
    }
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
  productTimeout = setTimeout(() => {
    const filtered = (productVouchers.value || []).filter((v: any) => {
      const matchKeyword = !productFilters.value.keyword ||
        v.voucherCode?.toLowerCase().includes(productFilters.value.keyword.toLowerCase()) ||
        v.voucherName?.toLowerCase().includes(productFilters.value.keyword.toLowerCase())
      
      const matchStatus = !productFilters.value.status ||
        String(v.isActive) === productFilters.value.status
      
      return matchKeyword && matchStatus
    })
    productVouchers.value = filtered
    if (!productFilters.value.keyword && !productFilters.value.status) {
      loadProductVouchers()
    }
  }, 400)
}

// Load Customer Vouchers
const loadCustomerVouchers = async () => {
  try {
    loadingCustomer.value = true
    const response = await VoucherService.getAllCustomerVouchers()
    customerVouchers.value = response.data.data || []
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
  customerTimeout = setTimeout(() => {
    const filtered = (customerVouchers.value || []).filter((v: any) => {
      const matchKeyword = !customerFilters.value.keyword ||
        v.voucherCode?.toLowerCase().includes(customerFilters.value.keyword.toLowerCase()) ||
        v.customerFullName?.toLowerCase().includes(customerFilters.value.keyword.toLowerCase())
      
      const matchStatus = !customerFilters.value.status ||
        v.voucherStatus === customerFilters.value.status
      
      return matchKeyword && matchStatus
    })
    customerVouchers.value = filtered
    if (!customerFilters.value.keyword && !customerFilters.value.status) {
      loadCustomerVouchers()
    }
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
    customerId: null,
    customerFullName: '',
    issuedAt: '',
    expiresAt: '',
    remainingQuantity: 0,
    voucherStatus: '',
  }
  voucherCreationMode.value = 'template' // Reset to default
  customerSearchKeyword.value = ''
  filteredCustomers.value = []
  showCustomerDropdown.value = false
}

// Customer search functionality
const searchCustomers = () => {
  const keyword = customerSearchKeyword.value.toLowerCase().trim()
  if (!keyword) {
    filteredCustomers.value = []
    showCustomerDropdown.value = false
    return
  }

  filteredCustomers.value = customers.value.filter((c: any) => 
    c.fullName?.toLowerCase().includes(keyword) ||
    c.phoneNumber?.includes(keyword) ||
    c.email?.toLowerCase().includes(keyword)
  ).slice(0, 10) // Limit to 10 results

  showCustomerDropdown.value = filteredCustomers.value.length > 0
}

const selectCustomer = (customer: any) => {
  customerForm.value.customerId = customer.id
  customerForm.value.customerFullName = customer.fullName
  customerSearchKeyword.value = `${customer.fullName} - ${customer.phoneNumber}`
  showCustomerDropdown.value = false
}

const clearCustomerSelection = () => {
  customerForm.value.customerId = null
  customerForm.value.customerFullName = ''
  customerSearchKeyword.value = ''
  filteredCustomers.value = []
  showCustomerDropdown.value = false
}

const closeAddCustomerModal = () => {
  showAddCustomerModal.value = false
  resetCustomerForm()
}

const submitAddCustomerVoucher = async () => {
  if (!customerForm.value.customerId) {
    alert('Vui lòng chọn khách hàng')
    return
  }

  // Validate based on mode
  if (voucherCreationMode.value === 'template') {
    if (!customerForm.value.personalVoucherId) {
      alert('Vui lòng chọn voucher template')
      return
    }
  } else {
    if (!customerForm.value.voucherCode || !customerForm.value.voucherName || !customerForm.value.discountPercent) {
      alert('Vui lòng nhập đầy đủ: mã voucher, tên voucher, % giảm giá')
      return
    }
    
    // Validate discount percent for direct mode
    const discount = Number(customerForm.value.discountPercent)
    if (discount < 1 || discount > 100) {
      alert('Giảm giá phải từ 1% đến 100%')
      return
    }
  }

  // FIX #7: Validate date range
  if (customerForm.value.issuedAt && customerForm.value.expiresAt) {
    if (new Date(customerForm.value.expiresAt) < new Date(customerForm.value.issuedAt)) {
      alert('Ngày hết hạn phải sau ngày phát hành')
      return
    }
  }

  // FIX #5: Validate expiry date must be in the future
  if (customerForm.value.expiresAt) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiryDate = new Date(customerForm.value.expiresAt)
    if (expiryDate < today) {
      alert('Ngày hết hạn phải trong tương lai')
      return
    }
  }

  // FIX #9: Validate remaining quantity
  const remainingQty = Number(customerForm.value.remainingQuantity)
  if (remainingQty < 0) {
    alert('Số lượng không được âm')
    return
  }

  try {
    const payload: any = {
      customerId: Number(customerForm.value.customerId),
      issuedAt: customerForm.value.issuedAt || undefined,
      expiresAt: customerForm.value.expiresAt || undefined,
      remainingQuantity: remainingQty,
      isActive: true,
    }

    // Add fields based on mode
    if (voucherCreationMode.value === 'template') {
      payload.personalVoucherId = Number(customerForm.value.personalVoucherId)
    } else {
      payload.voucherCode = customerForm.value.voucherCode
      payload.voucherName = customerForm.value.voucherName
      payload.discountPercent = Number(customerForm.value.discountPercent)
    }

    await VoucherService.createCustomerVoucher(payload)
    alert('Thêm voucher khách hàng thành công')
    closeAddCustomerModal()
    await loadCustomerVouchers()
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Thêm voucher khách hàng thất bại')
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
    customerId: voucher.customerId,
    customerFullName: voucher.customerFullName,
    issuedAt: voucher.issuedAt,
    expiresAt: voucher.expiresAt,
    remainingQuantity: voucher.remainingQuantity,
    voucherStatus: voucher.voucherStatus,
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

  try {
    const payload = {
      personalVoucherId: customerForm.value.personalVoucherId!,
      customerId: customerForm.value.customerId!,
      issuedAt: customerForm.value.issuedAt || undefined,
      expiresAt: customerForm.value.expiresAt || undefined,
      remainingQuantity: remainingQty,
    }
    await VoucherService.updateCustomerVoucher(customerForm.value.id, payload)
    alert('Cập nhật voucher khách hàng thành công')
    closeCustomerDetailModal()
    await loadCustomerVouchers()
  } catch (error: any) {
    alert(error?.response?.data?.message || 'Cập nhật voucher khách hàng thất bại')
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

onMounted(() => {
  loadProducts()
  loadPersonalVouchers()
  loadCustomers()
  loadProductVouchers()
  loadCustomerVouchers()
})
</script>

<style scoped>
.voucher-page {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.detail-modal-box {
  width: 900px;
  max-width: 92vw;
  max-height: 90vh;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.28);
  animation: slideUp 0.3s ease;
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
}

.detail-body {
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

.detail-body::-webkit-scrollbar {
  width: 8px;
}

.detail-body::-webkit-scrollbar-thumb {
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
</style>
