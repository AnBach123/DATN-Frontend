<template>
  <div class="profile-page">
    <div class="overlay">
      <div class="profile-wrapper">
        <!-- PAGE HEADER -->
        <div class="page-head">
          <h2 class="title text-center">THÔNG TIN CÁ NHÂN</h2>
          <p class="subtitle text-center">
            Quản lý tài khoản, điểm tích lũy và lịch sử sử dụng dịch vụ
          </p>
        </div>

        <!-- LOADING -->
        <div v-if="loading" class="text-center text-white py-5">Đang tải...</div>

        <!-- MAIN PROFILE -->
        <div v-else class="profile-card">
          <!-- LEFT SIDEBAR -->
          <div class="profile-left">
            <div class="avatar-wrap">
              <img v-if="previewAvatar" :src="previewAvatar" class="avatar-img" />
              <div v-else class="avatar">{{ avatarText }}</div>

              <label class="upload-btn">
                Tải ảnh đại diện
                <input type="file" accept="image/*" hidden @change="handleAvatarChange" />
              </label>
            </div>

            <h4 class="customer-name">{{ profile?.fullName || 'Khách hàng' }}</h4>
            <p class="email">{{ profile?.email || 'Chưa có email' }}</p>

            <div class="loyalty-card">
  <div class="loyalty-header">
    <span class="loyalty-label">⭐ Điểm thành viên</span>
    <span class="loyalty-rank">{{ memberLevel }}</span>
  </div>

  <div class="loyalty-score">
    <strong>{{ profile?.loyaltyPoints || 0 }}</strong>
    <span>điểm</span>
  </div>

  <div class="progress-bar-custom">
    <div
      class="progress-fill"
      :style="{ width: progressPercent + '%' }"
    ></div>
  </div>

  <div class="loyalty-footer">
    <small>{{ progressPercent.toFixed(0) }}% tiến tới hạng tiếp theo</small>

    <small v-if="nextLevelTarget">
      Còn {{ pointsToNextLevel }} điểm để đạt {{ nextLevelTarget }} điểm
    </small>

    <small v-else>Đã đạt hạng cao nhất</small>
  </div>
</div>
            <div class="quick-menu">
              <button
                :class="['quick-btn', activeTab === 'profile' ? 'active' : '']"
                @click="handleTabChange('profile')"
              >
                Thông tin cá nhân
              </button>

              <button
                :class="['quick-btn', activeTab === 'invoice' ? 'active' : '']"
                @click="handleTabChange('invoice')"
              >
                Lịch sử hóa đơn
              </button>

              <button
                :class="['quick-btn', activeTab === 'password' ? 'active' : '']"
                @click="handleTabChange('password')"
              >
                Đổi mật khẩu
              </button>
            </div>
          </div>

          <!-- RIGHT CONTENT -->
          <div class="profile-right">
            <!-- TAB: PROFILE -->
            <form
              v-if="activeTab === 'profile'"
              class="content-card"
              @submit.prevent="handleUpdate"
            >
              <h3 class="section-title">Thông tin cá nhân</h3>

              <div class="form-grid">
                <div class="form-group">
                  <label>Họ tên</label>
                  <input v-model="form.fullName" />
                </div>

                <div class="form-group">
                  <label>Số điện thoại</label>
                  <input v-model="form.phoneNumber" />
                </div>

                <div class="form-group">
                  <label>Email</label>
                  <input v-model="form.email" />
                </div>

                <div class="form-group">
                  <label>Ngày sinh</label>
                  <input type="date" v-model="form.dateOfBirth" />
                </div>

                <div class="form-group">
                  <label>Ngày tạo</label>
                  <input :value="formatDate(profile?.createdAt)" disabled />
                </div>

                <div class="form-group">
                  <label>Hạng thành viên</label>
                  <input :value="memberLevel" disabled />
                </div>
              </div>

              <button class="btn-save" type="submit">CẬP NHẬT THÔNG TIN</button>
            </form>

            <!-- TAB: INVOICE -->
            <div v-if="activeTab === 'invoice'" class="content-card">
              <h3 class="section-title">Lịch sử hóa đơn</h3>

              <div v-if="invoiceHistory.length === 0" class="empty-box">
                Chưa có hóa đơn nào
              </div>

              <div v-else class="history-list">
                <div class="history-item" v-for="item in pagedInvoices" :key="item.id">
                  <div>
                    <h5>Mã hóa đơn: {{ item.code }}</h5>
                    <p class="date">📅 {{ formatDate(item.date) }}</p>
                  </div>

                  <div>
                    <p class="money">{{ formatMoney(item.total) }}</p>
                  </div>

                  <div class="points-col">
                    <span v-if="item.earnedPoints > 0" class="point-tag earned">
                      +{{ item.earnedPoints }} điểm
                    </span>
                    <span v-if="item.usedPoints > 0" class="point-tag used">
                      -{{ item.usedPoints }} điểm
                    </span>
                    <span v-if="item.earnedPoints === 0 && item.usedPoints === 0" class="point-tag none">
                      0 điểm
                    </span>
                  </div>

                  <div>
                    <span class="status-badge" :class="getStatusClass(item.status)">
                      {{ translateStatus(item.status) }}
                    </span>
                  </div>

                  <div>
                    <button class="view-detail-btn" @click="openInvoiceDetail(item)">
                      Xem chi tiết
                    </button>
                  </div>
                </div>

                <!-- PAGINATION -->
                <div class="invoice-pagination" v-if="totalInvoicePages > 1">
                  <button
                    class="page-btn"
                    :disabled="invoicePage === 1"
                    @click="invoicePage--"
                  >‹</button>

                  <button
                    v-for="p in totalInvoicePages"
                    :key="p"
                    class="page-btn"
                    :class="{ active: p === invoicePage }"
                    @click="invoicePage = p"
                  >{{ p }}</button>

                  <button
                    class="page-btn"
                    :disabled="invoicePage === totalInvoicePages"
                    @click="invoicePage++"
                  >›</button>
                </div>
              </div>
            </div>


            <!-- TAB: PASSWORD -->
            <div v-if="activeTab === 'password'" class="content-card">
              <h3 class="section-title">Đổi mật khẩu</h3>

              <div class="form-grid single-col">
                <div class="form-group">
                  <label>Mật khẩu hiện tại</label>
                  <input type="password" v-model="passwordForm.oldPassword" />
                </div>

                <div class="form-group">
                  <label>Mật khẩu mới</label>
                  <input type="password" v-model="passwordForm.newPassword" />
                </div>

                <div class="form-group">
                  <label>Xác nhận mật khẩu mới</label>
                  <input type="password" v-model="passwordForm.confirmPassword" />
                </div>
              </div>

              <button class="btn-save" type="button" @click="handleChangePassword">
                ĐỔI MẬT KHẨU
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- INVOICE DETAIL MODAL -->
    <div v-if="showInvoiceModal" class="modal-overlay" @click="closeInvoiceModal">
      <div class="modal-content" @click.stop>
        <!-- MODAL HEADER -->
        <div class="modal-header">
          <h2>Chi tiết hóa đơn</h2>
          <button @click="closeInvoiceModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body" v-if="selectedInvoice">
          <!-- THÔNG TIN CHUNG -->
          <div class="detail-section">
            <h3>Thông tin chung</h3>

            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Mã hóa đơn:</span>
                <span class="value">{{ selectedInvoice.code }}</span>
              </div>

              <div class="detail-item">
                <span class="label">Bàn:</span>
                <span class="value">
                  {{ invoiceDetail?.tables?.join(', ') || '---' }}
                </span>
              </div>

              <div class="detail-item">
                <span class="label">Thời gian:</span>
                <span class="value">{{ formatDateTime(selectedInvoice?.date) }}</span>
              </div>

              <div class="detail-item">
                <span class="label">Trạng thái:</span>
                <span :class="['status-badge', getStatusClass(selectedInvoice.status)]">
                  {{ translateStatus(selectedInvoice.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- THÔNG TIN KHÁCH HÀNG -->
          <div class="detail-section">
            <h3>Thông tin khách hàng</h3>

            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">Tên khách hàng:</span>
                <span class="value">{{ invoiceDetail?.customerName }}</span>
              </div>

              <div class="detail-item">
                <span class="label">Số điện thoại:</span>
                <span class="value">{{ invoiceDetail?.phone }}</span>
              </div>

              <div class="detail-item">
                <span class="label">Email:</span>
                <span class="value">{{ invoiceDetail?.email }}</span>
              </div>
            </div>
          </div>

          <!-- DANH SÁCH MÓN -->
          <div class="detail-section">
            <h3>Danh sách món</h3>

            <div v-if="loadingInvoiceDetail">Đang tải...</div>

            <table v-else class="items-table">
              <thead>
                <tr>
                  <th>Tên món</th>
                  <th>SL</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="item in invoiceDetail?.items" :key="item.id">
                  <td>{{ item.name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ formatMoney(item.unitPrice) }}</td>
                  <td>{{ formatMoney(item.lineTotal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- THANH TOÁN -->
          <div class="payment-details">
            <div class="pay-row">
              <span>Tạm tính:</span>
              <span>{{ formatMoney(invoiceDetail?.subtotal) }}</span>
            </div>

            <div class="pay-row">
              <span>Giảm giá:</span>
              <span>-{{ formatMoney(invoiceDetail?.discount) }}</span>
            </div>

            <div class="pay-row">
              <span>Phí dịch vụ:</span>
              <span>{{ formatMoney(invoiceDetail?.serviceFee) }}</span>
            </div>

            <div class="pay-row">
              <span>Thuế:</span>
              <span>{{ formatMoney(invoiceDetail?.tax) }}</span>
            </div>

            <div class="pay-row total">
              <span>Tổng cộng:</span>
              <span>{{ formatMoney(invoiceDetail?.finalAmount) }}</span>
            </div>

            <div class="pay-row">
              <span>Phương thức thanh toán:</span>
              {{ formatPaymentMethod(invoiceDetail?.paymentMethod) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import axiosInstance from '@/services/axiosInstance'
import { getProfile, updateProfile } from '@/services/customer/profileApi'

const changePasswordApi = async (payload: {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}) => {
  const res = await axiosInstance.put('/api/customers/profile/change-password', payload)
  return res.data
}
/* ================= TYPES ================= */
type RecentInvoice = {
  id: number
  code: string
  total: number
  status: string
  date: string
  earnedPoints: number
  usedPoints: number
}

type InvoiceItem = {
  id: number
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

type InvoiceDetail = {
  id: number
  code: string
  tables: string[]
  customerName: string
  phone: string
  email: string
  subtotal: number
  discount: number
  serviceFee: number
  tax: number
  finalAmount: number
  paymentMethod: string
  items: InvoiceItem[]
}

/* ================= STATE ================= */
const loading = ref(true)
const profile = ref<any | null>(null)
const activeTab = ref('profile')
const previewAvatar = ref('')

const form = ref({
  fullName: '',
  phoneNumber: '',
  email: '',
  dateOfBirth: ''
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const invoiceHistory = ref<any[]>([])
const invoicePage = ref(1)
const INVOICE_PAGE_SIZE = 5

const showInvoiceModal = ref(false)
const selectedInvoice = ref<RecentInvoice | null>(null)
const invoiceDetail = ref<InvoiceDetail | null>(null)
const loadingInvoiceDetail = ref(false)

/* ================= COMPUTED ================= */
const avatarText = computed(() => profile.value?.fullName?.charAt(0).toUpperCase() || 'U')

const totalInvoicePages = computed(() =>
  Math.ceil(invoiceHistory.value.length / INVOICE_PAGE_SIZE)
)

const pagedInvoices = computed(() => {
  const start = (invoicePage.value - 1) * INVOICE_PAGE_SIZE
  return invoiceHistory.value.slice(start, start + INVOICE_PAGE_SIZE)
})

const memberLevel = computed(() => {
  const points = profile.value?.loyaltyPoints || 0

  if (points >= 2000) return 'Hạng Kim Cương'
  if (points >= 1000) return 'Hạng Bạch Kim'
  if (points >= 500) return 'Hạng Vàng'
  if (points >= 200) return 'Hạng Bạc'
  return 'Hạng Đồng'
})

const nextLevelTarget = computed(() => {
  const points = profile.value?.loyaltyPoints || 0

  if (points < 200) return 200
  if (points < 500) return 500
  if (points < 1000) return 1000
  if (points < 2000) return 2000
  return null
})

const pointsToNextLevel = computed(() => {
  if (!nextLevelTarget.value) return 0
  return nextLevelTarget.value - (profile.value?.loyaltyPoints || 0)
})
const progressPercent = computed(() => {
  const points = profile.value?.loyaltyPoints || 0

  if (points < 200) {
    return Math.min((points / 200) * 100, 100)
  }

  if (points < 500) {
    return Math.min(((points - 200) / (500 - 200)) * 100, 100)
  }

  if (points < 1000) {
    return Math.min(((points - 500) / (1000 - 500)) * 100, 100)
  }

  if (points < 2000) {
    return Math.min(((points - 1000) / (2000 - 1000)) * 100, 100)
  }

  return 100
})

/* ================= HELPERS ================= */

// Parse "dd-MM-yyyy HH:mm:ss" hoặc ISO — backend trả dd-MM-yyyy HH:mm:ss
const parseBackendDate = (value: string): Date => {
  // Format: dd-MM-yyyy HH:mm:ss
  const ddmmyyyy = value.match(/^(\d{2})-(\d{2})-(\d{4})([ T](\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (ddmmyyyy) {
    const [, dd, mm, yyyy, , hh = '00', min = '00', ss = '00'] = ddmmyyyy
    return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`)
  }
  return new Date(value)
}

const formatDate = (date?: string | null) => {
  if (!date) return ''
  const d = parseBackendDate(date)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN')
}

const formatDateTime = (time?: string) => {
  if (!time) return ''
  const date = parseBackendDate(time)
  if (isNaN(date.getTime())) return time
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatMoney = (value?: number | null) => {
  if (!value) return '0 đ'
  return value.toLocaleString('vi-VN') + ' đ'
}

const formatPaymentMethod = (method?: string) => {
  switch (method) {
    case 'CASH':
      return 'Tiền mặt'
    case 'BANK':
      return 'Chuyển khoản'
    case 'MOMO':
      return 'Ví MoMo'
    case 'VNPAY':
      return 'VNPay'
    default:
      return method || ''
  }
}

const statusMap: Record<string, string> = {
  PAID: 'success',
  PENDING: 'warning',
  CANCELLED: 'danger',
  COMPLETED: 'success'
}

const getStatusClass = (status: string) => statusMap[status] || 'success'

const translateStatus = (status: string) => {
  const map: Record<string, string> = {
    PAID: 'Đã thanh toán',
    PENDING: 'Chờ thanh toán',
    CANCELLED: 'Đã hủy',
    COMPLETED: 'Hoàn thành'
  }
  return map[status] || status
}

/* ================= PROFILE ================= */
const loadProfile = async () => {
  try {
    const data = await getProfile()
    profile.value = data

    form.value = {
      fullName: data.fullName || '',
      phoneNumber: data.phoneNumber || '',
      email: data.email || '',
      dateOfBirth: data.dateOfBirth || ''
    }

    const savedAvatar = localStorage.getItem('userAvatar')
    previewAvatar.value = savedAvatar || ''
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleUpdate = async () => {
  if (!confirm('Bạn có chắc chắn muốn cập nhật thông tin không?')) return

  try {
    const res = await updateProfile(form.value)
    alert('Cập nhật thành công')

    if (res.accessToken) localStorage.setItem('accessToken', res.accessToken)

    await loadProfile()
    
    // Cập nhật localStorage với thông tin mới để form đặt bàn hiển thị đúng
    const updatedUser = {
      fullName: form.value.fullName,
      phoneNumber: form.value.phoneNumber,
      email: form.value.email,
      dateOfBirth: form.value.dateOfBirth
    }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    localStorage.setItem('fullName', form.value.fullName)
    localStorage.setItem('phoneNumber', form.value.phoneNumber)
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      alert(err.response?.data?.message || 'Lỗi')
    } else {
      alert('Lỗi')
    }
  }
}

/* ================= AVATAR ================= */
const handleAvatarChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = (e) => {
    const base64 = e.target?.result as string
    previewAvatar.value = base64
    localStorage.setItem('userAvatar', base64)
  }

  reader.readAsDataURL(file)
}

/* ================= INVOICE ================= */
const loadInvoices = async () => {
  try {
    const res = await axiosInstance.get('/api/invoice/my')

    invoiceHistory.value = res.data
      .filter((item: any) => item.status === 'PAID')
      .map((item: any) => ({
        id: item.id,
        code: item.invoiceCode,
        total: item.finalAmount || 0,
        status: item.status,
        date: item.reservedAt,
        earnedPoints: item.earnedPoints || 0,
        usedPoints: item.usedPoints || 0,
      }))
      .sort((a: RecentInvoice, b: RecentInvoice) => parseBackendDate(b.date).getTime() - parseBackendDate(a.date).getTime())
    invoicePage.value = 1
  } catch (err) {
    console.error('Load invoice error:', err)
  }
}

const openInvoiceDetail = async (invoice: RecentInvoice) => {
  selectedInvoice.value = invoice
  showInvoiceModal.value = true
  loadingInvoiceDetail.value = true
  invoiceDetail.value = null

  try {
    const res = await axiosInstance.get(`/api/invoice/${invoice.id}`)
    invoiceDetail.value = res.data
  } catch (error) {
    console.error('Load invoice detail error:', error)
  } finally {
    loadingInvoiceDetail.value = false
  }
}

const closeInvoiceModal = () => {
  showInvoiceModal.value = false
  selectedInvoice.value = null
  invoiceDetail.value = null
}

/* ================= PASSWORD ================= */
const handleChangePassword = async () => {
  const p = passwordForm.value

  if (!p.oldPassword || !p.newPassword || !p.confirmPassword) {
    return alert('Vui lòng nhập đầy đủ thông tin')
  }

  if (p.newPassword !== p.confirmPassword) {
    return alert('Mật khẩu xác nhận không khớp')
  }

  if (p.newPassword.length < 6) {
    return alert('Mật khẩu mới phải có ít nhất 6 ký tự')
  }

  if (p.oldPassword === p.newPassword) {
    return alert('Mật khẩu mới không được trùng mật khẩu cũ')
  }

  if (!confirm('Bạn có chắc chắn muốn đổi mật khẩu không?')) return

  try {
    const res = await changePasswordApi({
      oldPassword: p.oldPassword,
      newPassword: p.newPassword,
      confirmPassword: p.confirmPassword
    })

    alert(res?.message || 'Đổi mật khẩu thành công')

    // reset form sau khi đổi xong
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    // nếu backend có trả token mới thì lưu lại
    if (res?.accessToken) {
      localStorage.setItem('accessToken', res.accessToken)
    }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      alert(err.response?.data?.message || err.response?.data || 'Đổi mật khẩu thất bại')
    } else {
      alert('Đổi mật khẩu thất bại')
    }
  }
}
/* ================= TAB ================= */
const handleTabChange = (tab: string) => {
  activeTab.value = tab
  if (tab === 'invoice') loadInvoices()
}

/* ================= LIFECYCLE ================= */
onMounted(loadProfile)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

/* ================= PAGE ================= */
.profile-page {
  min-height: 100vh;
  background: #5a1515;
  position: relative;
  overflow: hidden;
  padding-top: 114px;
  font-family: 'Manrope', sans-serif;
}

.profile-page::before {
  content: '';
  position: absolute;
  inset: -8%;
  background-image: url('https://images.unsplash.com/photo-1555992336-03a23c7b20ee');
  background-size: cover;
  background-position: center;
  filter: blur(10px);
  opacity: 0.25;
  z-index: 0;
}

.overlay {
  position: relative;
  z-index: 1;
  background: rgba(0, 0, 0, 0.65);
  min-height: 100vh;
  padding: 0;
}

.profile-wrapper {
  width: 100%;
  margin: 0;
}

/* ================= HEADER ================= */
.title {
  color: #ffffff;
  font-weight: 800;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.subtitle {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

/* ================= MAIN LAYOUT ================= */
.profile-card {
  display: flex;
  width: 100%;
  min-height: calc(100vh - 120px);
  background: #fff7f0;
}

.profile-left {
  width: 300px;
  background: linear-gradient(180deg, #a80000, #8d0000);
  color: white;
  padding: 36px 24px;
}

.profile-right {
  flex: 1;
  padding: 32px;
  background: #fafafa;

  display: flex;
  align-items: center;      
  justify-content: center;  
}
.profile-right .content-card {
  width: 100%;
  max-width: 980px;
}

/* ================= LABEL ================= */
label {
  font-weight: 600;
  color: #5a3b2e;
  margin-bottom: 6px;
  display: block;
}

/* ================= AVATAR ================= */
.avatar-wrap {
  text-align: center;
}

.avatar,
.avatar-img {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: #f2b565;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  margin: 0 auto 16px;
  border: 4px solid white;
  object-fit: cover;
}

.upload-btn {
  background: #fff2da;
  color: #8d0000;
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}

/* ================= USER INFO ================= */
.customer-name {
  text-align: center;
  font-size: 22px;
  font-weight: bold;
}

.email {
  text-align: center;
  font-size: 14px;
}


/* ================= LOYALTY ================= */
.loyalty-card {
  margin-top: 24px;
  padding: 20px 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
}

.loyalty-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  gap: 10px;
}

.loyalty-label {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
}

.loyalty-rank {
  background: rgba(255, 255, 255, 0.18);
  color: #fff6cc;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid rgba(255,255,255,0.2);
}

.loyalty-score {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.loyalty-score strong {
  font-size: 34px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
}

.loyalty-score span {
  font-size: 14px;
  color: rgba(255,255,255,0.85);
  font-weight: 600;
}

.progress-bar-custom {
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ffd54f, #ffb300);
  transition: width 0.4s ease;
  box-shadow: 0 0 12px rgba(255, 213, 79, 0.45);
}

.loyalty-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: rgba(255,255,255,0.82);
  flex-wrap: wrap;
}

/* ================= QUICK MENU ================= */
.quick-menu {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 12px;
  border-radius: 10px;
  color: white;
}

.quick-btn.active {
  background: white;
  color: #a80000;
}

/* ================= TABS ================= */
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  background: #f1e6dc;
  color: #7a0000;
  font-weight: 700;
  transition: 0.2s;
}

.tab-btn:hover {
  transform: translateY(-2px);
}

.tab-btn.active {
  background: #a80000;
  color: white;
}

/* ================= CARD ================= */
.content-card {
  background: #fff;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
}


/* ================= FORM ================= */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid #e5d6c8;
  background: #ffffff;
  transition: all 0.25s ease;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #a80000;
  box-shadow: 0 0 0 3px rgba(168, 0, 0, 0.12);
}

.btn-save {
  margin-top: 20px;
  width: 100%;
  background: linear-gradient(135deg, #a80000, #d10000);
  color: white;
  padding: 14px;
  border-radius: 14px;
  font-weight: 700;
  transition: 0.2s;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(168, 0, 0, 0.25);
}

/* ================= HISTORY ================= */
.history-item {
  display: grid;
  grid-template-columns: 2fr 1fr auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 15px 20px;
  background: #fff3ea;
  border-radius: 10px;
  margin-bottom: 10px;
}

.history-item h5 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #5a3b2e;
  word-break: break-word;
}

.history-item > div:nth-child(2) {
  text-align: center;
}

.points-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.point-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.point-tag.earned {
  background: #e8f7ee;
  color: #1c8c4d;
}

.point-tag.used {
  background: #ffeaea;
  color: #a80000;
}

.point-tag.none {
  background: #f3f3f3;
  color: #aaa;
  font-weight: 500;
}

.date {
  font-size: 13px;
  color: #777;
  margin-top: 4px;
}

.money {
  font-weight: 700;
  color: #a80000;
  text-align: right;
}

/* ================= STATUS ================= */
.status-badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
}

.status-badge.success {
  background: #e8f7ee;
  color: #1c8c4d;
}

.status-badge.danger {
  background: #ffeaea;
  color: #c30000;
}

.status-badge.success {
  color: green;
}

.status-badge.danger {
  color: red;
}

/* ================= POPUP (OLD) ================= */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-box {
  background: white;
  padding: 30px;
  border-radius: 16px;
  width: 420px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
}

/* ================= MODAL ================= */
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
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #a80000;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: none;
  border: none;
  font-size: 24px;
}

/* ================= DETAIL SECTION ================= */
.detail-section {
  margin-bottom: 25px;
}

.detail-section h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #7a0000;
  border-left: 4px solid #a80000;
  padding-left: 10px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  background: #fafafa;
  padding: 15px;
  border-radius: 10px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  font-size: 13px;
  color: #777;
}

.detail-item .value {
  font-weight: 600;
  color: #333;
}

/* ================= TABLE ================= */
.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.items-table th {
  background: #a80000;
  color: white;
  padding: 10px;
  font-size: 14px;
}

.items-table td {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.items-table tr:hover {
  background: #fff6f6;
}

/* ================= PAYMENT ================= */
.payment-details {
  margin-top: 10px;
  background: #fff3ea;
  border-radius: 12px;
  padding: 18px;
}

.pay-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.pay-row.total {
  font-size: 16px;
  font-weight: 700;
  border-top: 1px dashed #ccc;
  padding-top: 10px;
  margin-top: 10px;
  color: #a80000;
}

/* ================= BUTTON ================= */
.view-detail-btn {
  background-color: #a80000;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
}

.view-detail-btn:hover {
  background-color: #d40000;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.view-detail-btn:active {
  transform: scale(0.96);
}

/* ================= PAGINATION ================= */
.invoice-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #e5d6c8;
  border-radius: 8px;
  background: #fff;
  color: #5a3b2e;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #a80000;
  color: #fff;
  border-color: #a80000;
}

.page-btn.active {
  background: #a80000;
  color: #fff;
  border-color: #a80000;
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ================= MOBILE ================= */
@media (max-width: 992px) {
  .profile-card {
    flex-direction: column;
  }

  .profile-left {
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .history-item {
    grid-template-columns: 1fr 1fr;
  }
}
  .loyalty-header,
  .loyalty-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .loyalty-score strong {
    font-size: 28px;
  }
</style>