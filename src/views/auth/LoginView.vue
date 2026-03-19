<script setup lang="ts">
import { callLogin } from '@/services/authApi'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const msg = ref('')

async function onSubmit() {
    loading.value = true
    msg.value = ''

    try {
        const res = await callLogin({
            email: email.value.trim(),
            password: password.value,
        })

        localStorage.setItem('accessToken', res.data.accessToken)
        localStorage.setItem('tokenType', res.data.tokenType)
        localStorage.setItem('email', res.data.email)

        msg.value = 'Đăng nhập thành công!'
        router.push('/home')
    } catch (e: any) {
        msg.value = e?.message || 'Đăng nhập thất bại'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <main class="auth-layout">
        <section class="auth-card">
            <h2>Đăng nhập</h2>
            
            <form @submit.prevent="onSubmit" class="auth-form">
                <label>Email</label>
                <input v-model="email" type="email" required/>

                <label>Mật khẩu</label>
                <input v-model="password" type="password" required/>
                
                <button :disabled="loading">{{  loading ? 'Đang xử lý...': 'Đăng nhập' }}</button>
            </form>

            <p class="switch">
                Chưa có tài khoản?
                <RouterLink to="/auth/register">Đăng ký</RouterLink>
            </p>

            <p class="message">{{ msg }}</p>
        </section>
    </main>
</template>
