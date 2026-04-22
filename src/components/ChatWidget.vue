<template>
  <div class="chat-widget">
    <!-- NÚT MỞ CHAT -->
    <button class="chat-toggle" @click="isOpen = !isOpen" :class="{ open: isOpen }">
      <svg v-if="!isOpen" width="30" height="30" viewBox="0 0 40 52" fill="white">
        <!-- Ăng-ten -->
        <circle cx="20" cy="2.5" r="2.2"/>
        <rect x="19" y="4.5" width="2" height="4" rx="1"/>
        <!-- Đầu -->
        <rect x="5" y="8" width="30" height="22" rx="11"/>
        <!-- Tai trái -->
        <rect x="1" y="15" width="4" height="8" rx="2"/>
        <!-- Tai phải -->
        <rect x="35" y="15" width="4" height="8" rx="2"/>
        <!-- Mắt kính (visor) -->
        <rect x="10" y="14" width="20" height="9" rx="4.5" fill="#a80000"/>
        <!-- Mắt trái -->
        <circle cx="16" cy="18.5" r="2.8" fill="white"/>
        <!-- Mắt phải -->
        <circle cx="24" cy="18.5" r="2.8" fill="white"/>
        <!-- Thân -->
        <path d="M12 33 C12 31 14 31 20 31 C26 31 28 31 28 33 L28 44 C28 48 24 51 20 51 C16 51 12 48 12 44 Z"/>
        <!-- Chữ AI -->
        <text x="20" y="45" text-anchor="middle" fill="#a80000" font-size="10" font-weight="800" font-family="Arial">AI</text>
      </svg>
      <svg v-else width="28" height="28" viewBox="0 0 40 52" fill="white" style="opacity: 0.9;">
        <circle cx="20" cy="2.5" r="2.2"/>
        <rect x="19" y="4.5" width="2" height="4" rx="1"/>
        <rect x="5" y="8" width="30" height="22" rx="11"/>
        <rect x="1" y="15" width="4" height="8" rx="2"/>
        <rect x="35" y="15" width="4" height="8" rx="2"/>
        <rect x="10" y="14" width="20" height="5" rx="2.5" fill="#a80000"/>
        <line x1="14" y1="16.5" x2="26" y2="16.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M12 33 C12 31 14 31 20 31 C26 31 28 31 28 33 L28 44 C28 48 24 51 20 51 C16 51 12 48 12 44 Z"/>
        <text x="20" y="45" text-anchor="middle" fill="#a80000" font-size="10" font-weight="800" font-family="Arial">AI</text>
      </svg>
    </button>

    <!-- KHUNG CHAT -->
    <transition name="chat-slide">
      <div v-if="isOpen" class="chat-box">
        <div class="chat-header">
          <div class="ch-left">
            <div class="ch-avatar">
              <svg width="24" height="24" viewBox="0 0 40 32" fill="white">
                <circle cx="20" cy="2.5" r="2.2"/>
                <rect x="19" y="4.5" width="2" height="4" rx="1"/>
                <rect x="5" y="8" width="30" height="22" rx="11"/>
                <rect x="1" y="15" width="4" height="8" rx="2"/>
                <rect x="35" y="15" width="4" height="8" rx="2"/>
                <rect x="10" y="14" width="20" height="9" rx="4.5" fill="#a80000"/>
                <circle cx="16" cy="18.5" r="2.8" fill="white"/>
                <circle cx="24" cy="18.5" r="2.8" fill="white"/>
              </svg>
            </div>
            <div>
              <h4>ByHat Assistant</h4>
              <small>Hỗ trợ trực tuyến</small>
            </div>
          </div>
          <div class="ch-actions">
            <button class="ch-refresh" @click="messages = []" title="Làm mới">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
            <button class="ch-close" @click="isOpen = false">&times;</button>
          </div>
        </div>

        <div class="chat-messages" ref="messagesRef">
          <div class="msg bot" v-if="messages.length === 0">
            <div class="msg-bubble">
              Xin chào! Mình là trợ lý ByHat 😊<br/>Bạn muốn hỏi về thực đơn, ưu đãi, hay đặt bàn?
            </div>
          </div>

          <template v-for="(m, i) in messages" :key="i">
            <div :class="['msg', m.role]">
              <div class="msg-bubble" v-html="formatMsg(m.content)"></div>
            </div>

            <!-- FORM ĐẶT BÀN inline -->
            <div v-if="m.role === 'bot' && m.booking" class="msg bot">
              <div class="booking-form-card">
                <h4>Xác nhận đặt bàn</h4>
                <div class="bf-grid">
                  <div class="bf-field">
                    <label>Ngày</label>
                    <input type="date" v-model="m.booking.date" :min="todayStr" />
                  </div>
                  <div class="bf-field">
                    <label>Giờ</label>
                    <input type="time" v-model="m.booking.time" />
                  </div>
                  <div class="bf-field">
                    <label>Số khách</label>
                    <input type="number" v-model.number="m.booking.guestCount" min="1" />
                  </div>
                  <div class="bf-field full">
                    <label>Ghi chú</label>
                    <input v-model="m.booking.note" placeholder="Không bắt buộc" />
                  </div>
                </div>

                <!-- ĐẶT HỘ -->
                <div class="bf-guest-toggle">
                  <label class="bf-checkbox">
                    <input type="checkbox" v-model="m.booking._isGuest" />
                    <span>Đặt hộ người khác</span>
                  </label>
                </div>
                <div class="bf-grid" v-if="m.booking._isGuest || m.booking.guestName">
                  <div class="bf-field">
                    <label>Tên người dùng bữa</label>
                    <input v-model="m.booking.guestName" placeholder="Họ và tên" />
                  </div>
                  <div class="bf-field">
                    <label>SĐT người dùng bữa</label>
                    <input v-model="m.booking.guestPhone" placeholder="0xxxxxxxxx" />
                  </div>
                </div>

                <div class="bf-actions">
                  <button
                    class="bf-confirm"
                    @click="confirmBooking(m.booking, i)"
                    :disabled="bookingLoading"
                  >
                    {{ bookingLoading ? 'Đang đặt...' : 'Xác nhận đặt bàn' }}
                  </button>
                </div>
              </div>
            </div>
          </template>

          <div v-if="streaming" class="msg bot">
            <div class="msg-bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <div class="chat-quick" v-if="messages.length === 0">
          <button @click="sendQuick('Có những món gì đang giảm giá?')">Món giảm giá?</button>
          <button @click="sendQuick('Tôi muốn đặt bàn')">Đặt bàn</button>
          <button @click="sendQuick('Giờ mở cửa và địa chỉ quán')">Giờ mở cửa</button>
        </div>

        <div class="chat-input">
          <input
            v-model="input"
            placeholder="Hỏi về thực đơn, giá cả, ưu đãi..."
            @keydown.enter="send"
            :disabled="streaming"
          />
          <button @click="send" :disabled="!input.trim() || streaming" class="send-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { createReservation } from '@/services/reservationApi'

interface BookingData {
  date: string
  time: string
  guestCount: number
  note: string
  guestName: string
  guestPhone: string
}

interface ChatMsg {
  role: 'user' | 'bot'
  content: string
  booking?: BookingData | null
}

const router = useRouter()
const isOpen = ref(false)
const input = ref('')
const streaming = ref(false)
const bookingLoading = ref(false)
const messages = ref<ChatMsg[]>([])
const messagesRef = ref<HTMLElement | null>(null)
const todayStr = new Date().toISOString().split('T')[0]

const scrollBottom = () => {
  nextTick(() => {
    if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  })
}

const formatMsg = (text: string) => {
  let clean = text.replace(/```booking\s*\n?\{[\s\S]*?\}\s*\n?```/g, '')
  return clean
    .replace(/\[([^\]]+)\]\((\/posts\/\d+)\)/g, '<a href="$2" class="chat-link" target="_self">$1 →</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

const extractBooking = (text: string): BookingData | null => {
  const match = text.match(/```booking\s*\n?(\{[\s\S]*?\})\s*\n?```/)
  if (!match) return null
  try {
    const data = JSON.parse(match[1])
    if (data.date && data.time && data.guestCount) {
      return {
        date: data.date,
        time: data.time,
        guestCount: Number(data.guestCount),
        note: data.note || '',
        guestName: data.guestName || '',
        guestPhone: data.guestPhone || '',
        _isGuest: !!(data.guestName || data.guestPhone)
      } as any
    }
  } catch { /* invalid JSON */ }
  return null
}

const sendQuick = (text: string) => {
  input.value = text
  send()
}

const send = async () => {
  const q = input.value.trim()
  if (!q || streaming.value) return

  messages.value.push({ role: 'user', content: q, booking: null })
  input.value = ''
  streaming.value = true
  scrollBottom()

  messages.value.push({ role: 'bot', content: '', booking: null })
  const botIdx = messages.value.length - 1

  try {
    const token = localStorage.getItem('accessToken')
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

    const historyToSend = messages.value.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }))

    const response = await fetch(`${baseUrl}/api/chatbot/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ messages: historyToSend })
    })

    if (!response.ok) throw new Error('API error')

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) throw new Error('No reader')

    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const chunk = line.substring(5)
        if (chunk.trim() === '[DONE]') continue
        messages.value[botIdx].content += chunk.replace(/\\n/g, '\n')
        scrollBottom()
      }
    }

    // Check có booking JSON trong response không
    const bookingData = extractBooking(messages.value[botIdx].content)
    if (bookingData) {
      messages.value[botIdx].booking = bookingData
      scrollBottom()
    }
  } catch {
    messages.value[botIdx].content = 'Xin lỗi, mình gặp lỗi rồi. Bạn thử lại nhé!'
  } finally {
    streaming.value = false
    scrollBottom()
  }
}

const confirmBooking = async (booking: BookingData, msgIdx: number) => {
  if (!booking.date || !booking.time || !booking.guestCount) {
    alert('Vui lòng điền đầy đủ thông tin')
    return
  }

  bookingLoading.value = true
  try {
    const userStr = localStorage.getItem('user')
    let fullName = localStorage.getItem('fullName') || ''
    let phoneNumber = localStorage.getItem('phoneNumber') || ''

    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        fullName = user.fullName || fullName
        phoneNumber = user.phoneNumber || phoneNumber
      } catch { /* ignore */ }
    }

    const payload = {
      fullName,
      phoneNumber,
      guestCount: booking.guestCount,
      reservedAt: `${booking.date}T${booking.time}`,
      note: booking.note || '',
      foodNote: '',
      guestName: booking.guestName || null,
      guestPhone: booking.guestPhone || null,
    }

    const res = await createReservation(payload)
    const data = res.data?.data
    if (!data) throw new Error('Failed')

    // Xóa form booking, thêm message thành công
    messages.value[msgIdx].booking = null
    let successMsg = `Đặt bàn thành công! 🎉\n\nMã đặt bàn: **${data.reservationCode}**\nNgày: **${formatDateVN(booking.date)}**\nGiờ: **${booking.time}**\nSố khách: **${booking.guestCount}**`
    if (booking.guestName) {
      successMsg += `\nĐặt hộ: **${booking.guestName}** - ${booking.guestPhone}`
    }
    successMsg += `\n\nCảm ơn bạn đã đặt bàn tại ByHat! Hẹn gặp bạn nhé! 😊`
    messages.value.push({ role: 'bot', content: successMsg, booking: null })

    sessionStorage.setItem('reservationSuccess', JSON.stringify(data))
    scrollBottom()
  } catch (e: any) {
    const errMsg = e?.response?.data?.message || 'Đặt bàn thất bại, bạn thử lại nhé!'
    messages.value.push({ role: 'bot', content: errMsg, booking: null })
    scrollBottom()
  } finally {
    bookingLoading.value = false
  }
}

const formatDateVN = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
</script>

<style scoped>
.chat-widget { position: fixed; bottom: 24px; right: 24px; z-index: 1100; }

.chat-toggle {
  width: 58px; height: 58px; border-radius: 50%; border: none;
  background: linear-gradient(135deg, #e53e3e, #a80000);
  color: white; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(168,0,0,0.35), 0 0 20px rgba(229,62,62,0.2);
  transition: 0.3s;
  animation: chatFloat 2.5s ease-in-out infinite;
}
.chat-toggle:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(168,0,0,0.45), 0 0 30px rgba(229,62,62,0.3);
  animation: none;
}
.chat-toggle.open {
  background: linear-gradient(135deg, #e53e3e, #a80000);
  box-shadow: 0 4px 14px rgba(168,0,0,0.3);
  animation: none;
}

@keyframes chatFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.chat-box {
  position: absolute; bottom: 70px; right: 0;
  width: 380px; height: 540px;
  background: #faf8f5; border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; overflow: hidden;
}

.chat-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; background: #a80000;
}
.ch-left { display: flex; align-items: center; gap: 10px; }
.ch-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.chat-header h4 { margin: 0; font-size: 14px; color: white; font-weight: 700; }
.chat-header small { font-size: 11px; color: rgba(255,255,255,0.7); }
.ch-actions { display: flex; gap: 6px; }

.ch-refresh {
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.15); color: white;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: 0.2s;
}
.ch-refresh:hover { background: rgba(255,255,255,0.3); transform: rotate(180deg); }

.ch-close {
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.15); color: white; font-size: 16px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.chat-messages {
  flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px;
}

.msg { display: flex; }
.msg.user { justify-content: flex-end; }
.msg.bot { justify-content: flex-start; }

.msg-bubble {
  max-width: 85%; padding: 10px 14px; border-radius: 14px;
  font-size: 13px; line-height: 1.55; word-break: break-word;
}
.msg.user .msg-bubble { background: #a80000; color: white; border-bottom-right-radius: 4px; }
.msg.bot .msg-bubble { background: white; color: #333; border: 1px solid #ede8e0; border-bottom-left-radius: 4px; }

.msg-bubble :deep(.chat-link) {
  display: inline-block; margin-top: 6px;
  padding: 4px 12px; background: #a80000; color: white;
  border-radius: 999px; font-size: 12px; font-weight: 600;
  text-decoration: none; transition: 0.2s;
}
.msg-bubble :deep(.chat-link:hover) { background: #8b0000; }

.msg-bubble.typing { display: flex; gap: 4px; padding: 12px 18px; }
.msg-bubble.typing span {
  width: 7px; height: 7px; border-radius: 50%; background: #ccc;
  animation: typeBounce 1.2s infinite;
}
.msg-bubble.typing span:nth-child(2) { animation-delay: 0.2s; }
.msg-bubble.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typeBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* BOOKING FORM */
.booking-form-card {
  background: white; border: 2px solid #a80000; border-radius: 12px;
  padding: 12px; width: 100%; box-sizing: border-box;
}
.booking-form-card h4 {
  margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #a80000;
}
.bf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.bf-field { display: flex; flex-direction: column; gap: 3px; }
.bf-field.full { grid-column: span 2; }
.bf-field label { font-size: 11px; font-weight: 600; color: #888; }
.bf-field input {
  border: 1.5px solid #e0d6ca; border-radius: 6px; padding: 7px 8px;
  font-size: 12px; font-family: inherit; width: 100%; box-sizing: border-box;
}
.bf-field input:focus { border-color: #a80000; outline: none; }
.bf-guest-toggle { margin: 10px 0 6px; }
.bf-checkbox {
  display: flex; align-items: center; gap: 6px; cursor: pointer;
  font-size: 12px; font-weight: 600; color: #555;
}
.bf-checkbox input { accent-color: #a80000; cursor: pointer; }

.bf-actions { margin-top: 10px; }
.bf-confirm {
  width: 100%; padding: 9px; border: none; border-radius: 999px;
  background: #a80000; color: white; font-weight: 700; font-size: 13px;
  cursor: pointer; transition: 0.2s;
}
.bf-confirm:hover:not(:disabled) { background: #8b0000; }
.bf-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

/* QUICK */
.chat-quick { display: flex; gap: 6px; padding: 0 14px 10px; flex-wrap: wrap; }
.chat-quick button {
  padding: 6px 12px; border: 1.5px solid #d8cfc2; border-radius: 999px;
  background: white; color: #555; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: 0.2s;
}
.chat-quick button:hover { border-color: #a80000; color: #a80000; }

/* INPUT */
.chat-input {
  display: flex; gap: 8px; padding: 12px 14px;
  background: white; border-top: 1px solid #ede8e0;
}
.chat-input input {
  flex: 1; border: 1.5px solid #e0d6ca; border-radius: 999px;
  padding: 9px 14px; font-size: 13px; font-family: inherit;
}
.chat-input input:focus { border-color: #a80000; outline: none; }

.send-btn {
  width: 38px; height: 38px; border-radius: 50%; border: none;
  background: #a80000; color: white; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: 0.2s;
}
.send-btn:hover:not(:disabled) { background: #8b0000; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.chat-slide-enter-active { animation: slideUp 0.3s ease; }
.chat-slide-leave-active { animation: slideUp 0.2s ease reverse; }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 480px) {
  .chat-box { width: calc(100vw - 32px); right: -8px; height: 70vh; }
}
</style>
