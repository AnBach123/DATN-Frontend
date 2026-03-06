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

let timerId: number | null = null

type ApiErr = {
  message?: string
  errors?: Array<{ field: string; error: string }>
}

function extractErrorMessage(error: unknown): string {
  const e = error as ApiErr
  if (e?.errors?.length) return e.errors.map((x) => `${x.field}: ${x.error}`).join(' | ')
  return e?.message ?? 'Có lỗi xảy ra'
}

const email = computed(() => {
  const qEmail = route.query.email
  if (typeof qEmail === 'string' && qEmail.trim()) return qEmail.trim()
  const storageEmail = sessionStorage.getItem('pending_email')
  return storageEmail?.trim() ?? ''
})

function clearTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId)
    timerId = null
  }
}

function startCountdown(sec: number) {
  clearTimer()
  secondsLeft.value = sec
  if (secondsLeft.value <= 0) return

  timerId = window.setInterval(() => {
    if (secondsLeft.value <= 1) {
      clearTimer()
      secondsLeft.value = 0
      return
    }
    secondsLeft.value -= 1
  }, 1000)
}

async function onVerifyOtp() {
  if (!email.value) {
    msg.value = 'Không có email pending. Vui lòng đăng ký lại.'
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
    msg.value = extractErrorMessage(e)
    await Swal.fire({
      icon: 'error',
      title: 'Xác minh OTP thất bại',
      text: msg.value,
    })
  } finally {
    loading.value = false
  }
}

function onOtpInput(e: Event) {
    const target = e.target as HTMLInputElement
    otpCode.value = target.value.replace(/\D/g, '').slice(0, 6)
}

async function onResendOtp() {
  if (!email.value || secondsLeft.value > 0) return

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
    msg.value = extractErrorMessage(e)
  } finally {
    resendLoading.value = false
  }
}

onMounted(() => {
  const qWait = route.query.wait
  const initialWait = typeof qWait === 'string' ? Number(qWait) : 0
  startCountdown(Number.isFinite(initialWait) ? initialWait : 0)
})

onBeforeUnmount(() => {
  clearTimer()
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
        v-model="otpCode" type="text" inputmode="numeric"
        pattern="[0-9]{6}"
        maxlength="6"
        required
        @input="onOtpInput"
        />

        <button :disabled="loading">{{ loading ? 'Đang xác minh...' : 'Xác minh OTP' }}</button>
      </form>

      <button
        style="margin-top: 10px; width: 100%"
        class="btn-resend"
        :disabled="resendLoading || secondsLeft > 0"
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

      <p class="message">{{ msg }}</p>
    </section>
  </main>
</template>
