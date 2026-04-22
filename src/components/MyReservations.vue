<template>
  <div v-if="isOpen" class="rsv-overlay" @click.self="isOpen = false">
    <div class="rsv-panel">
      <div class="rsv-header">
        <h3>Đơn đặt bàn của tôi</h3>
        <button class="rsv-close" @click="isOpen = false">&times;</button>
      </div>

      <div class="rsv-body">
        <div v-if="loading" class="rsv-loading">Đang tải...</div>
        <div v-else-if="reservations.length === 0" class="rsv-empty">Bạn chưa có đơn đặt bàn nào</div>

        <div v-else class="rsv-list">
          <div class="rsv-card" v-for="r in reservations" :key="r.id">
            <div class="rsv-card-top">
              <span class="rsv-code">{{ r.code }}</span>
              <span class="rsv-status" :class="getStatusClass(r.status)">{{ getStatusText(r.status) }}</span>
            </div>
            <div class="rsv-card-info">
              <div class="rsv-info-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <span>{{ formatDateTime(r.date) }}</span>
              </div>
              <div class="rsv-info-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                <span>{{ r.guestCount }} khách</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import axiosInstance from '@/services/axiosInstance'

interface Reservation {
  id: number
  code: string
  status: string
  date: string
  guestCount: number
}

const isOpen = ref(false)
const loading = ref(false)
const reservations = ref<Reservation[]>([])

const open = () => {
  isOpen.value = true
  loadReservations()
}

const loadReservations = async () => {
  loading.value = true
  try {
    const res = await axiosInstance.get('/api/invoice/my')
    const all = res.data || []
    // Lấy đơn có reservedAt (là đặt bàn), sắp xếp mới nhất
    reservations.value = all
      .filter((i: any) => i.reservedAt && i.status !== 'PAID')
      .map((i: any) => ({
        id: i.id,
        code: i.invoiceCode,
        status: i.status,
        date: i.reservedAt,
        guestCount: i.guestCount || 0
      }))
      .sort((a: Reservation, b: Reservation) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
  } catch (e) {
    console.error('Load reservations error:', e)
  } finally {
    loading.value = false
  }
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  // Handle dd-MM-yyyy HH:mm:ss format
  const ddmm = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})([ T](\d{2}):(\d{2}))?/)
  if (ddmm) {
    const [, dd, mm, yyyy, , hh = '00', min = '00'] = ddmm
    return `${hh}:${min} - ${dd}/${mm}/${yyyy}`
  }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const time = d.toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit' })
  const day = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${time} - ${day}`
}

const getStatusClass = (s: string) => {
  const map: Record<string, string> = {
    PENDING_CONFIRMATION: 'pending',
    RESERVED: 'reserved',
    CONFIRMED: 'reserved',
    IN_PROGRESS: 'active',
    CANCELLED: 'cancelled',
    NO_SHOW: 'cancelled'
  }
  return map[s] || 'pending'
}

const getStatusText = (s: string) => {
  const map: Record<string, string> = {
    PENDING_CONFIRMATION: 'Chờ xác nhận',
    RESERVED: 'Đã xác nhận',
    CONFIRMED: 'Đã xác nhận',
    IN_PROGRESS: 'Đang phục vụ',
    CANCELLED: 'Đã hủy',
    NO_SHOW: 'Không đến'
  }
  return map[s] || s
}

defineExpose({ open, reservations })
</script>

<style scoped>
.rsv-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: flex-start; justify-content: flex-end;
  z-index: 1200; padding: 80px 20px 20px;
}

.rsv-panel {
  width: 380px; max-height: 80vh; background: #faf8f5;
  border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; overflow: hidden;
  animation: slideIn 0.25s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.rsv-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; background: #a80000;
}
.rsv-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: white; }
.rsv-close {
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.2); color: white; font-size: 16px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.rsv-body { flex: 1; overflow-y: auto; padding: 14px; }
.rsv-loading, .rsv-empty { text-align: center; padding: 30px; color: #aaa; font-size: 14px; }

.rsv-list { display: flex; flex-direction: column; gap: 10px; }

.rsv-card {
  background: white; border-radius: 10px; padding: 14px;
  border: 1px solid #ede8e0; transition: 0.2s;
}
.rsv-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.05); }

.rsv-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }

.rsv-code {
  font-family: 'Courier New', monospace; font-size: 12px; font-weight: 700;
  color: #a80000; background: #fff0f0; padding: 3px 8px; border-radius: 4px;
}

.rsv-status {
  font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px;
}
.rsv-status.pending { background: #fef3c7; color: #92400e; }
.rsv-status.reserved { background: #d1fae5; color: #065f46; }
.rsv-status.active { background: #dbeafe; color: #1e40af; }
.rsv-status.cancelled { background: #fee2e2; color: #991b1b; }

.rsv-card-info { display: flex; flex-direction: column; gap: 6px; }
.rsv-info-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; }
.rsv-info-row svg { color: #999; flex-shrink: 0; }

@media (max-width: 480px) {
  .rsv-panel { width: 100%; }
  .rsv-overlay { padding: 70px 10px 10px; }
}
</style>
