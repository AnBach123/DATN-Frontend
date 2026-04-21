<template>
  <div class="blog-container">
    <div class="page-header">
      <h2 class="page-title">Quản lý bài viết</h2>
      <button class="add-btn" @click="openAddModal">+ Thêm bài viết</button>
    </div>

    <!-- FILTER -->
    <div class="filters-section">
      <div class="filter-row">
        <input v-model="searchKeyword" placeholder="Tìm tiêu đề bài viết..." class="search-input" @input="handleSearch" />
        <select v-model="filterStatus" class="filter-select" @change="applyFilter">
          <option value="">Tất cả</option>
          <option value="published">Đã xuất bản</option>
          <option value="draft">Bản nháp</option>
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
            <th>Ngày tạo</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="9" class="loading-cell">Đang tải...</td>
          </tr>
          <tr v-else-if="pagedPosts.length === 0">
            <td colspan="9" class="empty-cell">Không có bài viết</td>
          </tr>
          <tr v-else v-for="post in pagedPosts" :key="post.id">
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
            <td>{{ formatDate(post.createdAt) }}</td>
            <td>
              <span :class="['status', post.isPublished ? 'published' : 'draft']">
                {{ post.isPublished ? 'Đã xuất bản' : 'Bản nháp' }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="edit-btn" @click="openEdit(post)">Sửa</button>
                <button class="delete-btn" @click="handleDelete(post.id)">Xóa</button>
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
              <select v-model="form.isPublished">
                <option :value="true">Xuất bản</option>
                <option :value="false">Bản nháp</option>
              </select>
            </div>

            <div class="form-group full">
              <label>Tóm tắt</label>
              <textarea v-model="form.summary" rows="2" placeholder="Tóm tắt ngắn gọn nội dung bài viết..."></textarea>
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
  createdAt: string
  updatedAt: string
  publishedAt: string
}

const allPosts = ref<Post[]>([])
const filteredPosts = ref<Post[]>([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const aiLoading = ref(false)

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
  isPublished: false
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

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) {
    const m = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})/)
    if (m) return `${m[1]}/${m[2]}/${m[3]}`
    return dateStr
  }
  return d.toLocaleDateString('vi-VN')
}

const loadPosts = async () => {
  loading.value = true
  try {
    allPosts.value = await blogApi.getAllPosts()
    applyFilter()
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  let result = [...allPosts.value]

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(p => p.title.toLowerCase().includes(kw))
  }

  if (filterStatus.value === 'published') {
    result = result.filter(p => p.isPublished)
  } else if (filterStatus.value === 'draft') {
    result = result.filter(p => !p.isPublished)
  }

  if (filterCategory.value) {
    result = result.filter(p => p.category === filterCategory.value)
  }

  filteredPosts.value = result
  currentPage.value = 1
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(applyFilter, 400)
}

const openAddModal = () => {
  isEdit.value = false
  editingId.value = null
  form.value = { title: '', summary: '', content: '', thumbnailUrl: '', category: 'Tin tức', isPublished: false }
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
    isPublished: post.isPublished
  }
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
  submitting.value = true
  try {
    let postId: number

    if (isEdit.value) {
      const updated = await blogApi.updatePost(editingId.value!, form.value)
      postId = updated.id
    } else {
      const created = await blogApi.createPost(form.value)
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

const handleDelete = async (id: number) => {
  if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return
  try {
    await blogApi.deletePost(id)
    loadPosts()
  } catch {
    alert('Lỗi khi xóa bài viết')
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
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body
    })

    if (!response.ok) throw new Error('API lỗi')

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) throw new Error('Không thể đọc stream')

    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const chunk = trimmed.substring(5)
        if (chunk === '[DONE]') continue
        // Backend gửi \n dạng escaped \\n, cần chuyển lại
        form.value.content += chunk.replace(/\\n/g, '\n')
      }
    }

    // Auto-fill summary nếu chưa có
    if (!form.value.summary && form.value.content) {
      form.value.summary = form.value.content.substring(0, 150).replace(/\n/g, ' ') + '...'
    }
  } catch {
    form.value.content = generateFallbackContent(form.value.title, form.value.category)
    if (!form.value.summary) {
      form.value.summary = form.value.content.substring(0, 150).replace(/\n/g, ' ') + '...'
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
.status { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.status.published { background: #c6f6d5; color: #22543d; }
.status.draft { background: #fefcbf; color: #744210; }

.text-center { text-align: center; }
.loading-cell, .empty-cell { text-align: center; padding: 20px; }

.action-btns { display: flex; gap: 6px; }
.edit-btn { padding: 5px 12px; border: none; border-radius: 6px; background: #667eea; color: white; font-size: 12px; cursor: pointer; }
.delete-btn { padding: 5px 12px; border: none; border-radius: 6px; background: #e53e3e; color: white; font-size: 12px; cursor: pointer; }

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
