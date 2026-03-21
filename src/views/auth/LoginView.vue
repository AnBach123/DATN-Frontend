<script setup lang="ts">
import { callLogin } from '@/services/authApi'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { authenticateMockUser, getRedirectRoute, generateMockJWT } from '@/mock/mockAuth'

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const msg = ref('')
const useMockAuth = ref(false) // Toggle này để bật/tắt mock auth - TẮT để dùng API thật

async function onSubmit() {
    loading.value = true
    msg.value = ''

    try {
        // Check if using mock authentication
        if (useMockAuth.value) {
            const mockUser = authenticateMockUser(email.value.trim(), password.value)
            
            if (mockUser) {
                // Generate mock JWT token with role
                const mockJWT = generateMockJWT(mockUser.email, mockUser.role)
                
                // Store mock user data with JWT
                localStorage.setItem('accessToken', mockJWT)
                localStorage.setItem('tokenType', 'Bearer')
                localStorage.setItem('email', mockUser.email)
                localStorage.setItem('userRole', mockUser.role)
                localStorage.setItem('fullName', mockUser.fullName)

                msg.value = 'Đăng nhập thành công!'
                
                // Redirect based on role
                const redirectRoute = getRedirectRoute(mockUser.role)
                setTimeout(() => {
                    router.push(redirectRoute)
                }, 500)
            } else {
                msg.value = 'Email hoặc mật khẩu không đúng'
            }
        } else {
            // Use real API authentication
            const res = await callLogin({
                email: email.value.trim(),
                password: password.value,
            })

            localStorage.setItem('accessToken', res.data.accessToken)
            localStorage.setItem('tokenType', res.data.tokenType)
            localStorage.setItem('email', res.data.email)
            localStorage.setItem('userRole', res.data.role)

            msg.value = 'Đăng nhập thành công!'
            
            // Redirect based on role
            const redirectRoute = getRedirectRoute(res.data.role)
            router.push(redirectRoute)
        }
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


<style scoped>
</style>
