<script setup lang="ts">
import { callSendOtp, callVerifyOtp } from '@/services/authApi'
import Swal from 'sweetalert2'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const otpCode = ref('')
const loading = ref(false)
const resendLoading = ref(false)
const msg = ref('')

const secondsLeft = ref(0)
const endAtMs = ref<number | null>(null)
let timerId: number | null = null

const lockSecondsLeft = ref(0)
const lockEndAtMs = ref<number | null>(null)
let lockTimerId: number | null = null

type ApiErr = {
  message?: string
  errors?: Array<{ field: string; error: string }>
  lockRemainingSeconds?: number
  data?: {
    lockRemainingSeconds?: number
  }
}

function extractErrorMessage(error: unknown): string {
  const e = error as ApiErr
  if (e?.errors?.length) {
    return e.errors.map((x) => `${x.field}: ${x.error}`).join(' | ')
  }
  return e?.message ?? 'Có lỗi xảy ra'
}

function extractLockSeconds(error: unknown): number | null {
  const e = error as ApiErr

  if (
    typeof e?.lockRemainingSeconds === 'number' &&
    Number.isFinite(e.lockRemainingSeconds) &&
    e.lockRemainingSeconds > 0
  ) {
    return Math.floor(e.lockRemainingSeconds)
  }

  if (
    typeof e?.data?.lockRemainingSeconds === 'number' &&
    Number.isFinite(e.data.lockRemainingSeconds) &&
    e.data.lockRemainingSeconds > 0
  ) {
    return Math.floor(e.data.lockRemainingSeconds)
  }

  const text = extractErrorMessage(error)
  const match = text.match(/(\d+)\s*gi(?:ây|ay|a)y?/i)
  if (match) {
    return Number(match[1])
  }

  return null
}

const email = computed(() => {
  const qEmail = route.query.email
  if (typeof qEmail === 'string' && qEmail.trim()) return qEmail.trim()

  const storageEmail = sessionStorage.getItem('pending_email')
  return storageEmail?.trim() ?? ''
})

function clearTimer() {
  if (timerId !== null) {
    window.clearTimeout(timerId)
    timerId = null
  }
}

function updateSecondsLeft(): boolean {
  if (!endAtMs.value) {
    secondsLeft.value = 0
    return false
  }

  const msLeft = endAtMs.value - Date.now()
  const secLeft = Math.max(0, Math.ceil(msLeft / 1000))
  secondsLeft.value = secLeft
  return msLeft > 0
}

function scheduleNextTick() {
  clearTimer()

  const alive = updateSecondsLeft()
  if (!alive) return

  const msLeft = (endAtMs.value as number) - Date.now()
  const delay = Math.max(80, msLeft % 1000 || 1000)
  timerId = window.setTimeout(scheduleNextTick, delay)
}

function startCountdown(sec: number) {
  clearTimer()

  const safeSec = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0
  if (safeSec <= 0) {
    secondsLeft.value = 0
    endAtMs.value = null
    return
  }

  endAtMs.value = Date.now() + safeSec * 1000
  scheduleNextTick()
}

function clearLockTimer() {
  if (lockTimerId !== null) {
    window.clearTimeout(lockTimerId)
    lockTimerId = null
  }
}

function updateLockSecondsLeft(): boolean {
  if (!lockEndAtMs.value) {
    lockSecondsLeft.value = 0
    return false
  }

  const msLeft = lockEndAtMs.value - Date.now()
  const secLeft = Math.max(0, Math.ceil(msLeft / 1000))
  lockSecondsLeft.value = secLeft
  return msLeft > 0
}

function scheduleNextLockTick() {
  clearLockTimer()

  const alive = updateLockSecondsLeft()
  if (!alive) return

  const msLeft = (lockEndAtMs.value as number) - Date.now()
  const delay = Math.max(80, msLeft % 1000 || 1000)
  lockTimerId = window.setTimeout(scheduleNextLockTick, delay)
}

function startLockCountdown(sec: number) {
  clearLockTimer()

  const safeSec = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0
  if (safeSec <= 0) {
    lockSecondsLeft.value = 0
    lockEndAtMs.value = null
    return
  }

  lockEndAtMs.value = Date.now() + safeSec * 1000
  scheduleNextLockTick()
}

function onVisibilityChange() {
  if (document.visibilityState !== 'visible') return

  if (endAtMs.value) {
    scheduleNextTick()
  }
  if (lockEndAtMs.value) {
    scheduleNextLockTick()
  }
}

async function onVerifyOtp() {
  if (!email.value) {
    msg.value = 'Không có email pending. Vui lòng đăng ký lại.'
    return
  }

  if (lockSecondsLeft.value > 0) {
    msg.value = `Tài khoản OTP đang bị khóa, thử lại sau ${lockSecondsLeft.value} giây`
    return
  }

  loading.value = true
  msg.value = ''

  try {
    const res = await callVerifyOtp({
      email: email.value,
      otpCode: otpCode.value.trim(),
    })

    sessionStorage.removeItem('pending_email')
    startLockCountdown(0)

    await Swal.fire({
      icon: 'success',
      title: 'Xác minh thành công',
      text: `Tài khoản ${res.data.email} đã được kích hoạt`,
      timer: 1300,
      timerProgressBar: true,
      showConfirmButton: false,
    })

    await router.push('/auth/login')
  } catch (e: unknown) {
    const lockSec = extractLockSeconds(e)

    if (lockSec && lockSec > 0) {
      startLockCountdown(lockSec)
      msg.value = ''
      await Swal.fire({
        icon: 'error',
        title: 'OTP tạm thời bị khóa',
        text: `Vui lòng thử lại sau ${lockSec} giây`,
      })
    } else {
      msg.value = extractErrorMessage(e)
      await Swal.fire({
        icon: 'error',
        title: 'Xác minh OTP thất bại',
        text: msg.value,
      })
    }
  } finally {
    loading.value = false
  }
}

function onOtpInput(e: Event) {
  const target = e.target as HTMLInputElement
  otpCode.value = target.value.replace(/\D/g, '').slice(0, 6)
}

async function onResendOtp() {
  if (!email.value || secondsLeft.value > 0 || lockSecondsLeft.value > 0) return

  resendLoading.value = true
  msg.value = ''

  try {
    const res = await callSendOtp({ email: email.value })
    const wait = res.data?.resendAfterSeconds ?? 60
    startCountdown(wait)

    await Swal.fire({
      icon: 'success',
      title: 'Đã gửi lại OTP',
      text: `Vui lòng kiểm tra email ${email.value}`,
      timer: 1000,
      showConfirmButton: false,
    })
  } catch (e: unknown) {
    const lockSec = extractLockSeconds(e)

    if (lockSec && lockSec > 0) {
      startLockCountdown(lockSec)
      msg.value = ''
    } else {
      msg.value = extractErrorMessage(e)
    }
  } finally {
    resendLoading.value = false
  }
}

onMounted(() => {
  const qWaitRaw = route.query.wait
  const qWait = Array.isArray(qWaitRaw) ? qWaitRaw[0] : qWaitRaw
  const initialWait = Number(qWait ?? 0)
  startCountdown(Number.isFinite(initialWait) ? initialWait : 0)

  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  clearTimer()
  clearLockTimer()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <main class="auth-layout">
    <section class="auth-card">
      <h2>Xác minh OTP</h2>

      <p class="switch">Email: <strong>{{ email }}</strong></p>

      <form @submit.prevent="onVerifyOtp" class="auth-form">
        <label>Nhập mã OTP (6 số)</label>
        <input
          v-model="otpCode"
          type="text"
          inputmode="numeric"
          pattern="[0-9]{6}"
          maxlength="6"
          required
          :disabled="lockSecondsLeft > 0"
          @input="onOtpInput"
        />

        <button :disabled="loading || lockSecondsLeft > 0">
          {{ loading ? 'Đang xác minh...' : 'Xác minh OTP' }}
        </button>
      </form>

      <button
        style="margin-top: 10px; width: 100%"
        class="btn-resend"
        :disabled="resendLoading || secondsLeft > 0 || lockSecondsLeft > 0"
        @click="onResendOtp"
      >
        {{
          resendLoading
            ? 'Đang gửi lại...'
            : secondsLeft > 0
              ? `Gửi lại OTP sau ${secondsLeft}s`
              : 'Gửi lại OTP'
        }}
      </button>

      <p class="switch">
        Sai email?
        <RouterLink to="/auth/register">Đăng ký lại</RouterLink>
      </p>

      <p class="message" v-if="lockSecondsLeft > 0">
        Tài khoản OTP đang bị khóa, thử lại sau {{ lockSecondsLeft }} giây
      </p>
      <p class="message" v-else>{{ msg }}</p>
    </section>
  </main>
</template>
