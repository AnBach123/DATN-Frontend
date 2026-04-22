<template>
  <div class="rsv-page">
    <div class="rsv-container">
      <div class="rsv-head">
        <h1>Đơn đặt bàn của tôi</h1>
        <p>Theo dõi trạng thái đơn đặt bàn tại ByHat</p>
      </div>

      <div v-if="loading" class="rsv-loading">Đang tải...</div>
      <div v-else-if="reservations.length === 0" class="rsv-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        <p>Bạn chưa có đơn đặt bàn nào</p>
        <button class="rsv-book-btn" @click="openBooking()">Đặt bàn ngay</button>
      </div>

      <div v-else class="rsv-list">
        <div class="rsv-card" v-for="r in pagedReservations" :key="r.id">
          <div class="rsv-card-left">
            <div class="rsv-date-box">
              <span class="rsv-day">{{ getDay(r.date) }}</span>
              <span class="rsv-month">{{ getMonth(r.date) }}</span>
            </div>
          </div>
          <div class="rsv-card-mid">
            <div class="rsv-card-row1">
              <span class="rsv-code">{{ r.code }}</span>
              <span class="rsv-status" :class="getStatusClass(r.status)">{{ getStatusText(r.status) }}</span>
            </div>
            <div class="rsv-card-details">
              <div class="rsv-detail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{{ getTime(r.date) }}</span>
              </div>
              <div class="rsv-detail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                <span>{{ r.guestCount }} khách</span>
              </div>
              <div class="rsv-detail" v-if="r.earnedPoints > 0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>+{{ r.earnedPoints }} điểm</span>
              </div>
            </div>
            <button
              v-if="canCancel(r.status)"
              class="rsv-cancel-btn"
              @click="confirmCancel(r)"
              :disabled="cancelling"
            >
              Hủy đơn
            </button>
          </div>
        </div>

        <!-- PAGINATION -->
        <div class="rsv-pagination" v-if="totalPages > 1">
          <button :disabled="page === 1" @click="page--" class="pg-btn">&lsaquo;</button>
          <button v-for="p in visiblePages" :key="p" :class="['pg-btn', { active: p === page }]" @click="page = p">{{ p }}</button>
          <button :disabled="page === totalPages" @click="page++" class="pg-btn">&rsaquo;</button>
        </div>
      </div>
    </div>

    <!-- CONFIRM CANCEL DIALOG -->
    <div v-if="showCancelDialog" class="cancel-overlay" @click.self="showCancelDialog = false">
      <div class="cancel-dialog">
        <div class="cancel-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a80000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3>Xác nhận hủy đơn đặt bàn?</h3>
        <p class="cancel-warning">Lưu ý: Sau khi hủy, bạn sẽ tạm thời không thể đặt bàn trong vòng <strong>1 tiếng</strong> để đảm bảo trải nghiệm tốt nhất cho tất cả khách hàng.</p>
        <p class="cancel-code">Mã đơn: <strong>{{ cancelTarget?.code }}</strong></p>
        <div class="cancel-actions">
          <button class="cancel-no" @click="showCancelDialog = false">Giữ đơn</button>
          <button class="cancel-yes" @click="doCancel" :disabled="cancelling">
            {{ cancelling ? 'Đang hủy...' : 'Xác nhận hủy' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/services/axiosInstance'
import { useBookingStore } from '@/composables/bookingStore'

const { open: openBooking } = useBookingStore()

interface Reservation {
  id: number
  code: string
  status: string
  date: string
  guestCount: number
  earnedPoints: number
}

const loading = ref(true)
const reservations = ref<Reservation[]>([])
const showCancelDialog = ref(false)
const cancelTarget = ref<Reservation | null>(null)
const cancelling = ref(false)

const canCancel = (status: string) => ['PENDING_CONFIRMATION', 'RESERVED', 'CONFIRMED'].includes(status)

const confirmCancel = (r: Reservation) => {
  cancelTarget.value = r
  showCancelDialog.value = true
}

const doCancel = async () => {
  if (!cancelTarget.value) return
  cancelling.value = true
  try {
    await axiosInstance.post(`/api/reservation/${cancelTarget.value.id}/cancel`)
    // Lưu cooldown 1 tiếng
    localStorage.setItem('byhat_cancel_cooldown', String(Date.now() + 60 * 60 * 1000))
    // Cập nhật trạng thái trong list
    const idx = reservations.value.findIndex(r => r.id === cancelTarget.value!.id)
    if (idx > -1) reservations.value[idx].status = 'CANCELLED'
    showCancelDialog.value = false
    alert('Đã hủy đơn đặt bàn thành công')
  } catch (e: any) {
    alert(e?.response?.data?.message || 'Hủy đơn thất bại')
  } finally {
    cancelling.value = false
  }
}
const page = ref(1)
const PAGE_SIZE = 5
const totalPages = computed(() => Math.ceil(reservations.value.length / PAGE_SIZE))
const visiblePages = computed(() => {
  const pages: number[] = []
  let start = Math.max(1, page.value - 2)
  let end = Math.min(totalPages.value, start + 4)
  if (end - start < 4) start = Math.max(1, end - 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})
const pagedReservations = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return reservations.value.slice(start, start + PAGE_SIZE)
})

const parseDate = (dateStr: string): Date => {
  const ddmm = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})([ T](\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (ddmm) {
    const [, dd, mm, yyyy, , hh = '00', min = '00', ss = '00'] = ddmm
    return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`)
  }
  return new Date(dateStr)
}

const getDay = (d: string) => {
  const date = parseDate(d)
  return isNaN(date.getTime()) ? '--' : String(date.getDate()).padStart(2, '0')
}
const getMonth = (d: string) => {
  const date = parseDate(d)
  if (isNaN(date.getTime())) return '--'
  return `Tháng ${date.getMonth() + 1}`
}
const getTime = (d: string) => {
  const date = parseDate(d)
  if (isNaN(date.getTime())) return '--'
  return date.toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit' }) +
    ' - ' + date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const getStatusClass = (s: string) => ({
  PENDING_CONFIRMATION: 'pending', RESERVED: 'reserved', CONFIRMED: 'reserved',
  IN_PROGRESS: 'active', PAID: 'paid', CANCELLED: 'cancelled', NO_SHOW: 'cancelled'
}[s] || 'pending')

const getStatusText = (s: string) => ({
  PENDING_CONFIRMATION: 'Chờ xác nhận', RESERVED: 'Đã xác nhận', CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang phục vụ', PAID: 'Đã thanh toán', CANCELLED: 'Đã hủy', NO_SHOW: 'Không đến'
}[s] || s)

onMounted(async () => {
  try {
    const res = await axiosInstance.get('/api/invoice/my')
    reservations.value = (res.data || [])
      .filter((i: any) => i.reservedAt)
      .map((i: any) => ({
        id: i.id,
        code: i.invoiceCode,
        status: i.status,
        date: i.reservedAt,
        guestCount: i.guestCount || 0,
        earnedPoints: i.earnedPoints || 0
      }))
      .sort((a: Reservation, b: Reservation) =>
        parseDate(b.date).getTime() - parseDate(a.date).getTime()
      )
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');

.rsv-page {
  min-height: 100vh; background: #f7f4f0; padding-top: 90px;
  font-family: 'Manrope', sans-serif;
}

.rsv-container { max-width: 700px; margin: 0 auto; padding: 0 20px 40px; }

.rsv-head { text-align: center; margin-bottom: 32px; }
.rsv-head h1 {
  font-family: 'Playfair Display', serif;
  font-size: 28px; font-weight: 800; color: #1a1a1a; margin-bottom: 6px;
}
.rsv-head p { font-size: 14px; color: #999; }

.rsv-loading { text-align: center; padding: 60px; color: #aaa; }

.rsv-empty {
  text-align: center; padding: 60px 20px;
  background: white; border-radius: 14px; border: 1px solid #ede8e0;
}
.rsv-empty p { color: #999; font-size: 15px; margin: 16px 0; }
.rsv-book-btn {
  padding: 10px 28px; border: none; border-radius: 999px;
  background: #a80000; color: white; font-weight: 700; font-size: 14px;
  cursor: pointer; transition: 0.2s;
}
.rsv-book-btn:hover { background: #8b0000; }

.rsv-list { display: flex; flex-direction: column; gap: 12px; }

.rsv-card {
  display: flex; gap: 16px; background: white;
  border-radius: 12px; padding: 16px; border: 1px solid #ede8e0;
  transition: 0.2s;
}
.rsv-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.05); }

/* DATE BOX */
.rsv-card-left { flex-shrink: 0; }
.rsv-date-box {
  width: 56px; height: 56px; border-radius: 12px;
  background: #a80000; color: white;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.rsv-day { font-size: 22px; font-weight: 800; line-height: 1; }
.rsv-month { font-size: 9px; font-weight: 600; text-transform: uppercase; opacity: 0.85; }

/* MIDDLE */
.rsv-card-mid { flex: 1; min-width: 0; }

.rsv-card-row1 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }

.rsv-code {
  font-family: 'Courier New', monospace; font-size: 12px; font-weight: 700;
  color: #a80000; background: #fff0f0; padding: 3px 8px; border-radius: 4px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;
}

.rsv-status {
  font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; flex-shrink: 0;
}
.rsv-status.pending { background: #fef3c7; color: #92400e; }
.rsv-status.reserved { background: #d1fae5; color: #065f46; }
.rsv-status.active { background: #dbeafe; color: #1e40af; }
.rsv-status.paid { background: #d1fae5; color: #065f46; }
.rsv-status.cancelled { background: #fee2e2; color: #991b1b; }

.rsv-card-details { display: flex; gap: 16px; flex-wrap: wrap; }
.rsv-detail { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #666; }
.rsv-detail svg { color: #999; flex-shrink: 0; }

/* CANCEL BTN */
.rsv-cancel-btn {
  margin-top: 10px; padding: 6px 18px; border: 1.5px solid #dc3545; border-radius: 999px;
  background: transparent; color: #dc3545; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: 0.2s;
}
.rsv-cancel-btn:hover { background: #dc3545; color: white; }
.rsv-cancel-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* CANCEL DIALOG */
.cancel-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1300;
}
.cancel-dialog {
  background: white; border-radius: 16px; padding: 28px; max-width: 400px; width: 90%;
  text-align: center; animation: slideUp 0.25s ease;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.cancel-icon { margin-bottom: 12px; }
.cancel-dialog h3 { font-size: 18px; font-weight: 800; color: #1a1a1a; margin: 0 0 12px; }
.cancel-warning {
  font-size: 13px; color: #666; line-height: 1.6; margin: 0 0 10px;
  background: #fff8f0; padding: 12px; border-radius: 10px; border-left: 3px solid #e8a835;
  text-align: left;
}
.cancel-code { font-size: 13px; color: #999; margin: 0 0 18px; }
.cancel-actions { display: flex; gap: 10px; justify-content: center; }
.cancel-no {
  padding: 10px 24px; border: 1.5px solid #ddd; border-radius: 999px;
  background: white; color: #555; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s;
}
.cancel-no:hover { border-color: #a80000; color: #a80000; }
.cancel-yes {
  padding: 10px 24px; border: none; border-radius: 999px;
  background: #dc3545; color: white; font-weight: 700; font-size: 14px; cursor: pointer; transition: 0.2s;
}
.cancel-yes:hover { background: #b02a37; }
.cancel-yes:disabled { opacity: 0.4; cursor: not-allowed; }

.rsv-pagination { display: flex; justify-content: center; gap: 6px; margin-top: 24px; }
.pg-btn {
  min-width: 36px; height: 36px; border: 1.5px solid #ddd; border-radius: 8px;
  background: white; color: #555; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 14px;
}
.pg-btn:hover:not(:disabled) { border-color: #a80000; color: #a80000; }
.pg-btn.active { background: #a80000; color: white; border-color: #a80000; }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 480px) {
  .rsv-card-details { flex-direction: column; gap: 4px; }
  .rsv-code { max-width: 140px; }
}
</style>
