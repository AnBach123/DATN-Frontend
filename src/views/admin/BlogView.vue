<template>
  <div class="blog-container">
    <div class="page-header">
      <h2 class="page-title">Quản lý bài viết</h2>
      <button v-if="currentTab === 'active'" class="add-btn" @click="openAddModal">+ Thêm bài viết</button>
    </div>

    <!-- BANNER sau khi vô hiệu hóa -->
    <transition name="slide-fade">
      <div v-if="banner" class="info-banner" :class="banner.type">
        <span class="banner-icon">{{ banner.type === 'success' ? '✓' : 'ℹ' }}</span>
        <div class="banner-content">
          <div class="banner-title">{{ banner.title }}</div>
          <div class="banner-message">{{ banner.message }}</div>
        </div>
        <div class="banner-actions">
          <button v-if="banner.undoId" class="banner-btn primary" @click="handleUndo(banner.undoId)">Kích hoạt lại</button>
          <button v-if="banner.type === 'success'" class="banner-btn" @click="switchTab('disabled')">Xem danh sách vô hiệu</button>
          <button class="banner-close" @click="banner = null">×</button>
        </div>
      </div>
    </transition>

    <!-- TABS -->
    <div class="tab-bar">
      <button
        :class="['tab-btn', { active: currentTab === 'active' }]"
        @click="switchTab('active')"
      >
        Bài đang quản lý
      </button>
      <button
        :class="['tab-btn', { active: currentTab === 'disabled' }]"
        @click="switchTab('disabled')"
      >
        Đã vô hiệu hóa
        <span v-if="disabledCount > 0" class="tab-count">{{ disabledCount }}</span>
      </button>
    </div>

    <!-- FILTER -->
    <div class="filters-section">
      <div class="filter-row">
        <input v-model="searchKeyword" placeholder="Tìm tiêu đề bài viết..." class="search-input" @input="handleSearch" />
        <select v-if="currentTab === 'active'" v-model="filterStatus" class="filter-select" @change="applyFilter">
          <option value="">Tất cả trạng thái</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="SCHEDULED">Đã lên lịch</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="EXPIRED">Đã hết hạn</option>
        </select>
        <select v-model="filterCategory" class="filter-select" @change="applyFilter">
          <option value="">Tất cả danh mục</option>
          <option value="Tin tức">Tin tức</option>
          <option value="Khuyến mãi">Khuyến mãi</option>
          <option value="Ẩm thực">Ẩm thực</option>
          <option value="Sự kiện">Sự kiện</option>
        </select>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-container">
      <table class="blog-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ảnh</th>
            <th>Tiêu đề</th>
            <th>Danh mục</th>
            <th>Tác giả</th>
            <th>Lượt xem</th>
            <th v-if="currentTab === 'active'">Ngày tạo</th>
            <th>Trạng thái</th>
            <th v-if="currentTab === 'active'">Thời hạn</th>
            <th v-if="currentTab === 'disabled'">Người vô hiệu</th>
            <th v-if="currentTab === 'disabled'">Ngày vô hiệu</th>
            <th v-if="currentTab === 'disabled'">Còn lại</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="tableColSpan" class="loading-cell">Đang tải...</td>
          </tr>
          <tr v-else-if="pagedPosts.length === 0">
            <td :colspan="tableColSpan" class="empty-cell">
              {{ currentTab === 'disabled' ? 'Không có bài nào trong danh sách vô hiệu' : 'Không có bài viết' }}
            </td>
          </tr>
          <tr v-else v-for="post in pagedPosts" :key="post.id" :class="{ 'row-disabled': post.status === 'DISABLED' }">
            <td>{{ post.id }}</td>
            <td>
              <img v-if="post.thumbnailUrl" :src="post.thumbnailUrl" class="post-thumb" />
              <div v-else class="no-thumb">--</div>
            </td>
            <td class="title-cell">{{ post.title }}</td>
            <td>
              <span class="category-tag">{{ post.category || 'Chung' }}</span>
            </td>
            <td>{{ post.author }}</td>
            <td class="text-center">{{ post.viewCount }}</td>

            <!-- ACTIVE TAB columns -->
            <td v-if="currentTab === 'active'">{{ formatDate(post.createdAt) }}</td>
            <td>
              <span :class="['status', statusClass(post.status)]">
                {{ statusLabel(post.status) }}
              </span>
            </td>
            <td v-if="currentTab === 'active'" class="schedule-cell">
              <div v-if="post.status === 'SCHEDULED'" class="schedule-info">
                <span class="schedule-icon">⏰</span> {{ formatDateTime(post.scheduledPublishAt) }}
              </div>
              <div v-else-if="post.expiresAt" class="schedule-info" :class="{ 'expired': post.status === 'EXPIRED' }">
                <span class="schedule-icon">⏳</span> {{ formatDateTime(post.expiresAt) }}
              </div>
              <span v-else class="no-expiry">Vô thời hạn</span>
            </td>

            <!-- DISABLED TAB columns -->
            <td v-if="currentTab === 'disabled'" class="audit-cell">{{ post.disabledBy || '--' }}</td>
            <td v-if="currentTab === 'disabled'" class="audit-cell">{{ formatDateTime(post.disabledAt) }}</td>
            <td v-if="currentTab === 'disabled'" class="audit-cell">
              <span :class="['days-left', daysLeftClass(post.disabledAt)]">
                {{ daysUntilCleanup(post.disabledAt) }} ngày
              </span>
            </td>

            <td>
              <div class="action-btns">
                <template v-if="currentTab === 'active'">
                  <button class="edit-btn" @click="openEdit(post)">Sửa</button>
                  <button class="disable-btn" @click="handleDisable(post)">Vô hiệu hóa</button>
                </template>
                <template v-else>
                  <button class="restore-btn" @click="handleRestore(post)">Kích hoạt lại</button>
                  <button class="permanent-btn" @click="openPermanentConfirm(post)">Xóa vĩnh viễn</button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINATION -->
    <div class="pagination-section" v-if="totalPages > 1">
      <button @click="currentPage--" :disabled="currentPage === 1" class="pagination-btn">&#8249; Trước</button>
      <button
        v-for="p in totalPages" :key="p"
        @click="currentPage = p"
        :class="['page-btn', { active: p === currentPage }]"
      >{{ p }}</button>
      <button @click="currentPage++" :disabled="currentPage === totalPages" class="pagination-btn">Sau &#8250;</button>
    </div>

    <!-- MODAL CONFIRM XÓA VĨNH VIỄN -->
    <div v-if="permanentConfirm" class="modal-overlay" @click="cancelPermanentConfirm">
      <div class="modal-content danger-modal" @click.stop>
        <div class="modal-header danger-header">
          <h2>⚠️ Xóa vĩnh viễn bài viết</h2>
          <button class="close-btn" @click="cancelPermanentConfirm">&times;</button>
        </div>
        <div class="modal-body">
          <div class="danger-warning">
            <p>Bạn sắp xóa <strong>vĩnh viễn</strong> bài viết:</p>
            <div class="post-preview">"{{ permanentConfirm.title }}"</div>
            <p class="warning-text">
              Hành động này <strong>KHÔNG THỂ hoàn tác</strong>. Toàn bộ dữ liệu bài viết và ảnh đính kèm
              sẽ bị xóa khỏi database. Dữ liệu không thể khôi phục sau khi xóa.
            </p>
            <p class="confirm-instruction">
              Để xác nhận, vui lòng gõ chính xác từ khóa <code>XOA</code> vào ô dưới:
            </p>
            <input
              v-model="permanentConfirmText"
              type="text"
              placeholder="Gõ XOA để xác nhận"
              class="confirm-input"
              @keyup.enter="doPermanentDelete"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="cancelPermanentConfirm">Hủy</button>
          <button
            class="danger-btn"
            :disabled="permanentConfirmText !== 'XOA' || permanentDeleting"
            @click="doPermanentDelete"
          >
            {{ permanentDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>{{ isEdit ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới' }}</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group full">
              <label>Tiêu đề</label>
              <input v-model="form.title" placeholder="Nhập tiêu đề bài viết" />
            </div>

            <div class="form-group">
              <label>Danh mục</label>
              <select v-model="form.category">
                <option value="Tin tức">Tin tức</option>
                <option value="Khuyến mãi">Khuyến mãi</option>
                <option value="Ẩm thực">Ẩm thực</option>
                <option value="Sự kiện">Sự kiện</option>
              </select>
            </div>

            <div class="form-group">
              <label>Trạng thái</label>
              <select v-model="form.isPublished" :disabled="publishMode === 'schedule'">
                <option :value="true">Xuất bản</option>
                <option :value="false">Bản nháp</option>
              </select>
              <span v-if="publishMode === 'schedule'" class="field-hint">Sẽ tự xuất bản khi đến giờ</span>
            </div>

            <div class="form-group full">
              <label>Tóm tắt</label>
              <textarea v-model="form.summary" rows="2" placeholder="Tóm tắt ngắn gọn nội dung bài viết..."></textarea>
            </div>

            <div class="form-group full schedule-section">
              <label class="section-label">Lịch đăng bài</label>
              <div class="publish-modes">
                <label class="radio-option">
                  <input type="radio" v-model="publishMode" value="now" />
                  <span>Đăng ngay / quản lý thủ công</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="publishMode" value="schedule" />
                  <span>Lên lịch đăng</span>
                </label>
              </div>

              <div v-if="publishMode === 'schedule'" class="schedule-grid">
                <div class="form-group">
                  <label>Thời gian đăng bài <span class="required">*</span></label>
                  <input type="datetime-local" v-model="form.scheduledPublishAt" :min="minDateTime" />
                </div>
              </div>

              <div class="expiry-toggle">
                <label class="checkbox-option">
                  <input type="checkbox" v-model="hasExpiry" />
                  <span>Đặt hạn kết thúc</span>
                </label>
              </div>
              <div v-if="hasExpiry" class="schedule-grid">
                <div class="form-group">
                  <label>Hạn kết thúc</label>
                  <input type="datetime-local" v-model="form.expiresAt" :min="minExpiryDateTime" />
                </div>
              </div>
            </div>

            <div class="form-group full">
              <label>Hình ảnh bài viết</label>
              <div class="image-upload-area">
                <input
                  type="file"
                  ref="imageInput"
                  accept="image/*"
                  multiple
                  @change="handleImageSelect"
                  style="display: none"
                />
                <button type="button" class="upload-btn" @click="($refs.imageInput as HTMLInputElement)?.click()">
                  Chọn ảnh
                </button>
                <span class="upload-hint">Ảnh đầu tiên sẽ là ảnh bìa. Có thể chọn nhiều ảnh.</span>
              </div>
              <div class="image-preview-list" v-if="imagePreviews.length > 0">
                <div v-for="(img, idx) in imagePreviews" :key="idx" class="preview-item">
                  <img :src="img.url" />
                  <span v-if="idx === 0" class="primary-badge">Ảnh bìa</span>
                  <button type="button" class="remove-img" @click="removeImage(idx)">&times;</button>
                </div>
              </div>
            </div>

            <div class="form-group full">
              <div class="content-header">
                <label>Nội dung</label>
                <button
                  type="button"
                  class="ai-btn"
                  @click="generateWithAI"
                  :disabled="aiLoading"
                >
                  {{ aiLoading ? 'AI đang viết...' : 'AI viết bài' }}
                </button>
              </div>
              <textarea
                v-model="form.content"
                rows="14"
                placeholder="Viết nội dung bài viết hoặc nhấn 'AI viết bài' để tự động tạo..."
                class="content-editor"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal">Hủy</button>
          <button class="save-btn" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Thêm mới') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as blogApi from '@/services/blogApi'
import axiosInstance from '@/services/axiosInstance'

type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'DISABLED'

type Post = {
  id: number
  title: string
  summary: string
  content: string
  thumbnailUrl: string
  category: string
  author: string
  isPublished: boolean
  viewCount: number
  status: PostStatus
  createdAt: string
  updatedAt: string
  publishedAt: string
  scheduledPublishAt: string | null
  expiresAt: string | null
  disabledAt: string | null
  disabledBy: string | null
}

type TabKey = 'active' | 'disabled'

type Banner = {
  type: 'success' | 'info'
  title: string
  message: string
  undoId?: number
} | null

const RETENTION_DAYS = 30

const currentTab = ref<TabKey>('active')
const allPosts = ref<Post[]>([])
const disabledPosts = ref<Post[]>([])
const disabledCount = ref(0)
const filteredPosts = ref<Post[]>([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const aiLoading = ref(false)

const banner = ref<Banner>(null)
let bannerTimer: ReturnType<typeof setTimeout> | null = null

// State cho modal xóa vĩnh viễn
const permanentConfirm = ref<Post | null>(null)
const permanentConfirmText = ref('')
const permanentDeleting = ref(false)

const tableColSpan = computed(() => currentTab.value === 'active' ? 10 : 10)

const searchKeyword = ref('')
const filterStatus = ref('')
const filterCategory = ref('')
const currentPage = ref(1)
const PAGE_SIZE = 8

let searchTimeout: ReturnType<typeof setTimeout>

const form = ref({
  title: '',
  summary: '',
  content: '',
  thumbnailUrl: '',
  category: 'Tin tức',
  isPublished: false,
  scheduledPublishAt: '' as string,
  expiresAt: '' as string
})

const publishMode = ref<'now' | 'schedule'>('now')
const hasExpiry = ref(false)

// Giới hạn tối thiểu cho datetime-local là hiện tại + 1 phút
const toLocalInputValue = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
const minDateTime = computed(() => toLocalInputValue(new Date(Date.now() + 60_000)))
const minExpiryDateTime = computed(() => {
  if (publishMode.value === 'schedule' && form.value.scheduledPublishAt) {
    return form.value.scheduledPublishAt
  }
  return toLocalInputValue(new Date(Date.now() + 60_000))
})

const imageInput = ref<HTMLInputElement | null>(null)
const imageFiles = ref<File[]>([])
const imagePreviews = ref<{ url: string; file?: File; existing?: boolean }[]>([])

const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    imageFiles.value.push(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreviews.value.push({ url: e.target?.result as string, file })
    }
    reader.readAsDataURL(file)
  }
  target.value = ''
}

const removeImage = (idx: number) => {
  const removed = imagePreviews.value.splice(idx, 1)
  if (removed[0]?.file) {
    const fileIdx = imageFiles.value.indexOf(removed[0].file)
    if (fileIdx > -1) imageFiles.value.splice(fileIdx, 1)
  }
}

const totalPages = computed(() => Math.ceil(filteredPosts.value.length / PAGE_SIZE))

const pagedPosts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredPosts.value.slice(start, start + PAGE_SIZE)
})

// Backend format: "dd-MM-yyyy HH:mm:ss" (timezone Asia/Ho_Chi_Minh)
const parseBackendDate = (dateStr: string): Date | null => {
  if (!dateStr) return null
  const m = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/)
  if (!m) {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? null : d
  }
  const [, dd, mm, yyyy, hh = '0', mi = '0', ss = '0'] = m
  return new Date(+yyyy, +mm - 1, +dd, +hh, +mi, +ss)
}

const formatDate = (dateStr: string) => {
  const d = parseBackendDate(dateStr)
  if (!d) return dateStr || ''
  return d.toLocaleDateString('vi-VN')
}

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return ''
  const d = parseBackendDate(dateStr)
  if (!d) return dateStr
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const statusLabel = (status?: PostStatus): string => {
  switch (status) {
    case 'PUBLISHED': return 'Đã xuất bản'
    case 'SCHEDULED': return 'Đã lên lịch'
    case 'EXPIRED': return 'Đã hết hạn'
    case 'DISABLED': return 'Đã vô hiệu hóa'
    case 'DRAFT':
    default: return 'Bản nháp'
  }
}

const statusClass = (status?: PostStatus): string => {
  switch (status) {
    case 'PUBLISHED': return 'published'
    case 'SCHEDULED': return 'scheduled'
    case 'EXPIRED': return 'expired'
    case 'DISABLED': return 'disabled'
    case 'DRAFT':
    default: return 'draft'
  }
}

// Chuyển chuỗi "dd-MM-yyyy HH:mm:ss" từ backend → giá trị input datetime-local "yyyy-MM-ddTHH:mm"
const backendToLocalInput = (dateStr: string | null | undefined): string => {
  if (!dateStr) return ''
  const d = parseBackendDate(dateStr)
  if (!d) return ''
  return toLocalInputValue(d)
}

// Chuyển giá trị input datetime-local (local time) → ISO UTC cho backend
const localInputToIso = (localStr: string): string | null => {
  if (!localStr) return null
  const d = new Date(localStr)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

const loadPosts = async () => {
  loading.value = true
  try {
    if (currentTab.value === 'active') {
      allPosts.value = await blogApi.getAllPosts()
    } else {
      disabledPosts.value = await blogApi.getDisabledPosts()
    }
    applyFilter()
    // Luôn refresh count thùng rác để cập nhật badge
    loadDisabledCount()
  } finally {
    loading.value = false
  }
}

const loadDisabledCount = async () => {
  try {
    const list = await blogApi.getDisabledPosts()
    disabledCount.value = list.length
    if (currentTab.value === 'disabled') {
      disabledPosts.value = list
    }
  } catch { /* ignore */ }
}

const switchTab = (tab: TabKey) => {
  if (currentTab.value === tab) return
  currentTab.value = tab
  searchKeyword.value = ''
  filterStatus.value = ''
  filterCategory.value = ''
  currentPage.value = 1
  loadPosts()
}

const applyFilter = () => {
  const source = currentTab.value === 'active' ? allPosts.value : disabledPosts.value
  let result = [...source]

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(p => p.title.toLowerCase().includes(kw))
  }

  // Chỉ filter theo status khi ở tab active (disabled tab tất cả đều DISABLED)
  if (currentTab.value === 'active' && filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value)
  }

  if (filterCategory.value) {
    result = result.filter(p => p.category === filterCategory.value)
  }

  filteredPosts.value = result
  currentPage.value = 1
}

const showBanner = (b: Banner) => {
  if (bannerTimer) clearTimeout(bannerTimer)
  banner.value = b
  if (b) {
    bannerTimer = setTimeout(() => { banner.value = null }, 6000)
  }
}

const daysUntilCleanup = (disabledAt: string | null | undefined): number => {
  if (!disabledAt) return RETENTION_DAYS
  const d = parseBackendDate(disabledAt)
  if (!d) return RETENTION_DAYS
  const elapsed = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, RETENTION_DAYS - elapsed)
}

const daysLeftClass = (disabledAt: string | null | undefined): string => {
  const left = daysUntilCleanup(disabledAt)
  if (left <= 3) return 'critical'
  if (left <= 7) return 'warning'
  return ''
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(applyFilter, 400)
}

const openAddModal = () => {
  isEdit.value = false
  editingId.value = null
  form.value = {
    title: '', summary: '', content: '', thumbnailUrl: '',
    category: 'Tin tức', isPublished: true,
    scheduledPublishAt: '', expiresAt: ''
  }
  publishMode.value = 'now'
  hasExpiry.value = false
  imageFiles.value = []
  imagePreviews.value = []
  showModal.value = true
}

const openEdit = async (post: Post) => {
  isEdit.value = true
  editingId.value = post.id
  form.value = {
    title: post.title,
    summary: post.summary || '',
    content: post.content,
    thumbnailUrl: post.thumbnailUrl || '',
    category: post.category || 'Tin tức',
    isPublished: post.isPublished,
    scheduledPublishAt: backendToLocalInput(post.scheduledPublishAt),
    expiresAt: backendToLocalInput(post.expiresAt)
  }
  publishMode.value = post.status === 'SCHEDULED' ? 'schedule' : 'now'
  hasExpiry.value = !!post.expiresAt
  imageFiles.value = []
  imagePreviews.value = []

  // Load ảnh hiện có
  try {
    const res = await axiosInstance.get(`/api/images/blog/${post.id}`)
    const images = res.data.data || []
    imagePreviews.value = images.map((img: any) => ({ url: img.imageUrl, existing: true }))
  } catch { /* không có ảnh */ }

  showModal.value = true
}

const closeModal = () => { showModal.value = false }

const handleSubmit = async () => {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    alert('Vui lòng nhập tiêu đề và nội dung')
    return
  }

  // Chuẩn hoá lịch đăng / hạn kết thúc
  let scheduledIso: string | null = null
  let expiresIso: string | null = null

  if (publishMode.value === 'schedule') {
    if (!form.value.scheduledPublishAt) {
      alert('Vui lòng chọn thời gian đăng bài')
      return
    }
    scheduledIso = localInputToIso(form.value.scheduledPublishAt)
    if (!scheduledIso || new Date(scheduledIso).getTime() <= Date.now()) {
      alert('Thời gian đăng bài phải ở tương lai')
      return
    }
  }

  if (hasExpiry.value) {
    if (!form.value.expiresAt) {
      alert('Vui lòng chọn hạn kết thúc hoặc bỏ tick "Đặt hạn kết thúc"')
      return
    }
    expiresIso = localInputToIso(form.value.expiresAt)
    if (!expiresIso) {
      alert('Hạn kết thúc không hợp lệ')
      return
    }
    const expiresMs = new Date(expiresIso).getTime()
    const lowerBound = scheduledIso ? new Date(scheduledIso).getTime() : Date.now()
    if (expiresMs <= lowerBound) {
      alert('Hạn kết thúc phải sau ' + (scheduledIso ? 'thời gian đăng bài' : 'hiện tại'))
      return
    }
  }

  // Nếu lên lịch → luôn lưu dưới dạng chưa xuất bản (scheduler sẽ đăng khi đến giờ)
  const payload = {
    title: form.value.title,
    summary: form.value.summary,
    content: form.value.content,
    thumbnailUrl: form.value.thumbnailUrl,
    category: form.value.category,
    isPublished: publishMode.value === 'schedule' ? false : form.value.isPublished,
    scheduledPublishAt: scheduledIso,
    expiresAt: expiresIso
  }

  submitting.value = true
  try {
    let postId: number

    if (isEdit.value) {
      const updated = await blogApi.updatePost(editingId.value!, payload)
      postId = updated.id
    } else {
      const created = await blogApi.createPost(payload)
      postId = created.id
    }

    // Upload ảnh mới (chỉ upload file mới, bỏ qua ảnh existing)
    const newImages = imagePreviews.value.filter(img => img.file)
    for (let i = 0; i < newImages.length; i++) {
      const formData = new FormData()
      formData.append('file', newImages[i].file!)
      // Ảnh đầu tiên và không có ảnh existing nào → là ảnh bìa
      const hasExistingPrimary = imagePreviews.value.some((img, idx) => img.existing && idx === 0)
      const isPrimary = i === 0 && !hasExistingPrimary
      formData.append('isPrimary', String(isPrimary))
      await axiosInstance.post(`/api/images/blog/${postId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    closeModal()
    loadPosts()
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi khi lưu bài viết')
  } finally {
    submitting.value = false
  }
}

// Vô hiệu hóa (soft delete)
const handleDisable = async (post: Post) => {
  if (!confirm(`Vô hiệu hóa bài "${post.title}"?\n\nBài sẽ được chuyển sang danh sách vô hiệu.\nDữ liệu vẫn được lưu trữ và có thể kích hoạt lại trong 30 ngày.`)) return
  try {
    await blogApi.disablePost(post.id)
    showBanner({
      type: 'success',
      title: 'Đã vô hiệu hóa bài viết',
      message: `"${post.title}" đã được chuyển sang danh sách vô hiệu. Dữ liệu vẫn được lưu trong database.`,
      undoId: post.id
    })
    loadPosts()
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi khi vô hiệu hóa bài viết')
  }
}

// Kích hoạt lại bài đã vô hiệu hóa (từ banner undo HOẶC từ tab disabled)
const handleUndo = async (id: number) => {
  try {
    await blogApi.restorePost(id)
    showBanner({
      type: 'info',
      title: 'Đã kích hoạt lại',
      message: 'Bài viết quay về trạng thái bản nháp. Bạn có thể chỉnh sửa và xuất bản lại.'
    })
    currentTab.value = 'active'
    loadPosts()
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi khi kích hoạt lại')
  }
}

const handleRestore = async (post: Post) => {
  if (!confirm(`Kích hoạt lại bài "${post.title}"?\n\nBài sẽ quay về trạng thái bản nháp để admin tự xuất bản lại.`)) return
  await handleUndo(post.id)
}

// Mở modal xác nhận xóa vĩnh viễn
const openPermanentConfirm = (post: Post) => {
  permanentConfirm.value = post
  permanentConfirmText.value = ''
}

const cancelPermanentConfirm = () => {
  permanentConfirm.value = null
  permanentConfirmText.value = ''
}

const doPermanentDelete = async () => {
  if (!permanentConfirm.value) return
  if (permanentConfirmText.value !== 'XOA') return
  permanentDeleting.value = true
  try {
    await blogApi.permanentDeletePost(permanentConfirm.value.id)
    showBanner({
      type: 'info',
      title: 'Đã xóa vĩnh viễn',
      message: `Bài "${permanentConfirm.value.title}" cùng ảnh đính kèm đã bị xóa khỏi database.`
    })
    cancelPermanentConfirm()
    loadPosts()
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Lỗi khi xóa vĩnh viễn')
  } finally {
    permanentDeleting.value = false
  }
}

const generateWithAI = async () => {
  if (!form.value.title.trim()) {
    alert('Vui lòng nhập tiêu đề trước khi dùng AI viết bài')
    return
  }
  aiLoading.value = true
  form.value.content = ''

  try {
    const token = localStorage.getItem('accessToken')
    const email = localStorage.getItem('email')
    const username = localStorage.getItem('username')
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
    const body = JSON.stringify({
      title: form.value.title,
      summary: form.value.summary || '',
      category: form.value.category
    })

    const response = await fetch(`${baseUrl}/api/blog/admin/ai-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Audit log cần header này khi security.api.enabled=false
        ...(username ? { 'X-Employee-Username': username } : {}),
        ...(email ? { 'X-Customer-Email': email } : {})
      },
      body
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`HTTP ${response.status}: ${errText || 'không rõ lỗi'}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) throw new Error('Không thể đọc stream')

    let buffer = ''
    let isErrorEvent = false
    let aiErrorMessage = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        // Detect SSE event: error
        if (trimmed.startsWith('event:')) {
          isErrorEvent = trimmed.substring(6).trim() === 'error'
          continue
        }
        if (!trimmed.startsWith('data:')) continue
        const chunk = trimmed.substring(5)
        if (chunk === '[DONE]') continue

        if (isErrorEvent) {
          aiErrorMessage += chunk
          continue
        }
        // Backend gửi \n dạng escaped \\n, cần chuyển lại
        form.value.content += chunk.replace(/\\n/g, '\n')
      }
    }

    if (aiErrorMessage) {
      throw new Error(aiErrorMessage)
    }

    if (!form.value.content.trim()) {
      throw new Error('AI không trả về nội dung (stream rỗng)')
    }

    // Auto-fill summary nếu chưa có
    if (!form.value.summary && form.value.content) {
      form.value.summary = form.value.content.substring(0, 150).replace(/\n/g, ' ') + '...'
    }
  } catch (err: any) {
    console.error('[AI generate] lỗi:', err)
    const reason = err?.message || 'Không rõ lý do'
    const useFallback = confirm(
      `Lỗi gọi AI: ${reason}\n\nDùng mẫu viết sẵn thay thế? (Nhấn Cancel để tự viết tay)`
    )
    if (useFallback) {
      form.value.content = generateFallbackContent(form.value.title, form.value.category)
      if (!form.value.summary) {
        form.value.summary = form.value.content.substring(0, 150).replace(/\n/g, ' ') + '...'
      }
    }
  } finally {
    aiLoading.value = false
  }
}

const generateFallbackContent = (title: string, category: string): string => {
  const templates: Record<string, string> = {
    'Khuyến mãi': `🔥 ${title}\n\nByHat gửi tới các bạn chương trình ưu đãi mới!\n\n🎉 Ưu đãi lần này:\n- Giảm giá lên đến 20% toàn bộ thực đơn\n- Tặng kèm tráng miệng khi dùng bữa từ 2 người\n- Free nước uống cho mọi khách\n\n⏰ Áp dụng từ nay đến hết tháng\n\n💡 Đặt bàn sớm để có chỗ nhé, cuối tuần quán hay đông lắm!\n\nĐặt bàn online hoặc gọi trực tiếp cho quán.`,
    'Ẩm thực': `🍲 ${title}\n\nỞ ByHat, mình luôn cố gắng giữ nguyên liệu tươi ngon mỗi ngày.\n\n🥘 Mấy thứ hay được gọi nhiều:\n- Nước lẩu nhiều vị, ai thích cay hay thanh đều có\n- Thịt bò, hải sản, rau nấm đủ loại\n- Nước chấm pha sẵn theo công thức riêng\n\nĂn lẩu vui nhất là đi đông đông, gọi mỗi người mỗi vị rồi chia nhau nếm thử 😄\n\nGhé ByHat thử nhé!`,
    'Sự kiện': `🎊 ${title}\n\nByHat có chương trình đặc biệt nè!\n\n📅 Chi tiết:\n- Quán trang trí riêng cho dịp này\n- Thực đơn có thêm món mới\n- Có quà tặng và voucher cho khách tham gia\n\nĐến vui chơi rồi ăn lẩu, còn gì bằng 😆\n\nĐặt bàn trước cho chắc nhé!`,
  }
  return templates[category] || `📰 ${title}\n\nByHat xin gửi đến mọi người thông tin mới.\n\n✨ Quán luôn cố gắng cải thiện để mọi người có bữa ăn ngon và thoải mái nhất. Nguyên liệu tươi, giá hợp lý, không gian chill.\n\n🍜 Ghé ByHat dùng bữa nhé!\n\nByHat Hotpot`
}

onMounted(loadPosts)
</script>

<style scoped>
.blog-container { padding: 24px; background: linear-gradient(135deg, #f5f7fa, #c3cfe2); min-height: 100vh; }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 28px; font-weight: 700; color: #2d3748; }
.add-btn { padding: 10px 18px; border: none; border-radius: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; cursor: pointer; transition: 0.3s; }
.add-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4); }

.filters-section { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
.filter-row { display: flex; gap: 10px; flex-wrap: wrap; }
.search-input, .filter-select { flex: 1; min-width: 200px; padding: 10px 16px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 14px; }

.table-container { background: white; border-radius: 12px; overflow: hidden; }
.blog-table { width: 100%; border-collapse: collapse; }
.blog-table thead { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
.blog-table th, .blog-table td { padding: 12px; }
.blog-table tbody tr:hover { background: #f0f4ff; }

.post-thumb { width: 60px; height: 40px; object-fit: cover; border-radius: 6px; }
.no-thumb { width: 60px; height: 40px; display: flex; align-items: center; justify-content: center; background: #f7fafc; border-radius: 6px; border: 1px dashed #cbd5e0; color: #a0aec0; font-size: 12px; }

.title-cell { font-weight: 600; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.category-tag { padding: 4px 10px; background: #eef2ff; color: #667eea; border-radius: 999px; font-size: 12px; font-weight: 600; }
.status { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.status.published { background: #c6f6d5; color: #22543d; }
.status.draft { background: #fefcbf; color: #744210; }
.status.scheduled { background: #bee3f8; color: #2a4365; }
.status.expired { background: #e2e8f0; color: #4a5568; }
.status.disabled { background: #fed7d7; color: #742a2a; }

/* TABS */
.tab-bar { display: flex; gap: 4px; background: white; border-radius: 12px 12px 0 0; padding: 6px 6px 0 6px; margin-bottom: -1px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.tab-btn { padding: 10px 20px; background: transparent; border: none; border-bottom: 3px solid transparent; font-size: 14px; font-weight: 600; color: #718096; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; border-radius: 8px 8px 0 0; }
.tab-btn:hover { background: #f7fafc; color: #2d3748; }
.tab-btn.active { color: #667eea; border-bottom-color: #667eea; background: #f0f4ff; }
.tab-count { background: #edf2f7; color: #4a5568; font-size: 12px; font-weight: 600; padding: 1px 9px; border-radius: 999px; min-width: 22px; text-align: center; line-height: 1.6; transition: all 0.2s; }
.tab-btn.active .tab-count { background: #667eea; color: white; }

/* BANNER */
.info-banner { display: flex; align-items: flex-start; gap: 12px; padding: 14px 18px; border-radius: 10px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.info-banner.success { background: #f0fff4; border-left: 4px solid #38a169; color: #22543d; }
.info-banner.info { background: #ebf8ff; border-left: 4px solid #3182ce; color: #2a4365; }
.banner-icon { font-size: 20px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
.banner-content { flex: 1; }
.banner-title { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
.banner-message { font-size: 13px; line-height: 1.5; }
.banner-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.banner-btn { padding: 6px 14px; border: 1px solid currentColor; background: transparent; color: inherit; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.banner-btn.primary { background: currentColor; }
.banner-btn.primary span, .banner-btn.primary { color: white; background: #22543d; }
.info-banner.info .banner-btn.primary { background: #2a4365; }
.banner-close { background: transparent; border: none; font-size: 22px; color: inherit; cursor: pointer; padding: 0 6px; opacity: 0.6; }
.banner-close:hover { opacity: 1; }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(-10px); opacity: 0; }

/* DISABLED ROW */
.row-disabled { background: #fefefe; opacity: 0.85; }
.row-disabled .title-cell { color: #718096; }
.audit-cell { font-size: 12px; color: #4a5568; white-space: nowrap; }

/* DAYS LEFT BADGE */
.days-left { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #e6fffa; color: #234e52; }
.days-left.warning { background: #fefcbf; color: #744210; }
.days-left.critical { background: #fed7d7; color: #742a2a; }

.schedule-cell { font-size: 12px; color: #4a5568; white-space: nowrap; }
.schedule-info { display: inline-flex; align-items: center; gap: 4px; }
.schedule-info.expired { color: #a0aec0; text-decoration: line-through; }
.schedule-icon { font-size: 13px; }
.no-expiry { color: #a0aec0; font-style: italic; }

.text-center { text-align: center; }
.loading-cell, .empty-cell { text-align: center; padding: 20px; }

.action-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.edit-btn { padding: 5px 12px; border: none; border-radius: 6px; background: #667eea; color: white; font-size: 12px; cursor: pointer; }
.edit-btn:hover { background: #5568d3; }
.disable-btn { padding: 5px 12px; border: none; border-radius: 6px; background: #ed8936; color: white; font-size: 12px; cursor: pointer; }
.disable-btn:hover { background: #dd6b20; }
.restore-btn { padding: 5px 12px; border: none; border-radius: 6px; background: #38a169; color: white; font-size: 12px; cursor: pointer; }
.restore-btn:hover { background: #2f855a; }
.permanent-btn { padding: 5px 12px; border: 1px solid #e53e3e; border-radius: 6px; background: white; color: #e53e3e; font-size: 12px; cursor: pointer; }
.permanent-btn:hover { background: #e53e3e; color: white; }

/* DANGER MODAL */
.danger-modal { width: 520px; }
.danger-header { background: linear-gradient(135deg, #e53e3e, #c53030) !important; }
.danger-warning p { margin: 10px 0; font-size: 14px; line-height: 1.6; color: #2d3748; }
.post-preview { padding: 12px 16px; background: #fef2f2; border-left: 3px solid #e53e3e; border-radius: 4px; font-weight: 600; color: #742a2a; font-style: italic; margin: 12px 0; }
.warning-text { background: #fffaf0; padding: 10px 14px; border-radius: 6px; font-size: 13px !important; color: #744210 !important; line-height: 1.6 !important; }
.confirm-instruction { margin-top: 16px !important; font-size: 13px !important; }
.confirm-instruction code { background: #fed7d7; padding: 2px 8px; border-radius: 4px; font-weight: 700; color: #742a2a; font-family: monospace; font-size: 14px; }
.confirm-input { width: 100%; padding: 10px 14px; border: 2px solid #fed7d7; border-radius: 8px; font-size: 15px; font-family: monospace; text-transform: uppercase; margin-top: 8px; }
.confirm-input:focus { outline: none; border-color: #e53e3e; }
.danger-btn { background: #e53e3e; color: white; border: none; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.danger-btn:hover:not(:disabled) { background: #c53030; }
.danger-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* MODAL */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; border-radius: 20px; width: 520px; max-width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s; }
.modal-content.large { width: 850px; }
.modal-header { padding: 20px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; display: flex; justify-content: space-between; border-radius: 20px 20px 0 0; position: sticky; top: 0; z-index: 10; }
.close-btn { background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 35px; height: 35px; color: white; cursor: pointer; font-size: 20px; }
.modal-body { padding: 20px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.form-group { display: flex; flex-direction: column; }
.form-group.full { grid-column: span 2; }
.form-group label { font-size: 12px; margin-bottom: 4px; color: #718096; font-weight: 600; }
.form-group input, .form-group select, .form-group textarea { padding: 10px; border-radius: 10px; border: 1px solid #ddd; font-size: 14px; }
.form-group input:disabled, .form-group select:disabled { background: #f7fafc; cursor: not-allowed; opacity: 0.7; }
.field-hint { font-size: 11px; color: #4299e1; margin-top: 3px; font-style: italic; }

/* SCHEDULE SECTION */
.schedule-section { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
.section-label { display: block; font-size: 13px; font-weight: 700; color: #2d3748; margin-bottom: 10px; }
.publish-modes { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 12px; }
.radio-option, .checkbox-option { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #4a5568; cursor: pointer; }
.radio-option input, .checkbox-option input { cursor: pointer; }
.schedule-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
.expiry-toggle { margin: 8px 0 6px; }
.hint-text { font-size: 12px; color: #718096; font-style: italic; }
.required { color: #e53e3e; }

.content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.content-header label { margin-bottom: 0; }
.ai-btn { padding: 6px 16px; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.25s; }
.ai-btn:hover:not(:disabled) { background: #667eea; color: white; }
.ai-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.content-editor { font-family: inherit; line-height: 1.7; resize: vertical; min-height: 250px; }

/* IMAGE UPLOAD */
.image-upload-area { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.upload-btn { padding: 9px 20px; background: white; color: #667eea; border: 2px solid #667eea; border-radius: 10px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.25s; }
.upload-btn:hover { background: #667eea; color: white; }
.upload-hint { font-size: 12px; color: #a0aec0; }

.image-preview-list { display: flex; gap: 12px; flex-wrap: wrap; }
.preview-item { position: relative; width: 120px; height: 90px; border-radius: 10px; overflow: hidden; border: 2px solid #e2e8f0; }
.preview-item img { width: 100%; height: 100%; object-fit: cover; }
.primary-badge { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(102,126,234,0.85); color: white; text-align: center; font-size: 10px; font-weight: 700; padding: 2px 0; }
.remove-img { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; border: none; background: rgba(229,62,62,0.9); color: white; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; }

.modal-footer { padding: 15px 20px; display: flex; justify-content: flex-end; gap: 10px; position: sticky; bottom: 0; background: white; border-top: 1px solid #e2e8f0; }
.cancel-btn { background: #e2e8f0; border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; }
.save-btn { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* PAGINATION */
.pagination-section { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 24px; }
.pagination-btn { padding: 8px 16px; border: 2px solid #e2e8f0; border-radius: 10px; background: white; color: #4a5568; font-weight: 600; cursor: pointer; }
.pagination-btn:hover:not(:disabled) { border-color: #667eea; color: #667eea; }
.pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-btn { width: 40px; height: 40px; border: 2px solid #e2e8f0; border-radius: 10px; background: white; color: #4a5568; font-weight: 600; cursor: pointer; }
.page-btn.active { background: linear-gradient(135deg, #667eea, #764ba2); border-color: #667eea; color: white; }

@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
</style>
