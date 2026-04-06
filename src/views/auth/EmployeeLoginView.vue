<script setup lang="ts">
import { callEmployeeLogin } from '@/services/authApi'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRedirectRoute } from '@/mock/mockAuth'

const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)
const msg = ref('')
const cardRef = ref<HTMLElement | null>(null)

async function onSubmit() {
    loading.value = true
    msg.value = ''

    try {
        // Use employee-specific login endpoint
        const res = await callEmployeeLogin({
            email: username.value.trim(), // Backend expects 'email' field but uses it as username
            password: password.value,
        })

        localStorage.setItem('accessToken', res.data.accessToken)
        localStorage.setItem('tokenType', res.data.tokenType)
        localStorage.setItem('email', res.data.email)
        localStorage.setItem('userRole', res.data.role)
        
        // Only save if fields exist (for backward compatibility)
        if (res.data.userId) {
            localStorage.setItem('userId', res.data.userId.toString())
        }
        if (res.data.fullName) {
            localStorage.setItem('fullName', res.data.fullName)
        }
        if (res.data.username) {
            localStorage.setItem('username', res.data.username)
        }

        msg.value = 'Đăng nhập thành công!'
        
        // Redirect based on role
        const userRole = res.data.role as 'USER' | 'RECEPTION' | 'ADMIN' | 'STAFF' | 'KITCHEN'
        const redirectRoute = getRedirectRoute(userRole)
        router.push(redirectRoute)
    } catch (e: unknown) {
        const error = e as { message?: string }
        msg.value = error?.message || 'Đăng nhập thất bại'
    } finally {
        loading.value = false
    }
}

// Mouse tracking for spotlight effect
function handleMouseMove(e: MouseEvent) {
    if (!cardRef.value) return
    
    const rect = cardRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    cardRef.value.style.setProperty('--mouse-x', `${x}px`)
    cardRef.value.style.setProperty('--mouse-y', `${y}px`)
}

onMounted(() => {
    if (cardRef.value) {
        cardRef.value.addEventListener('mousemove', handleMouseMove)
    }
})

onUnmounted(() => {
    if (cardRef.value) {
        cardRef.value.removeEventListener('mousemove', handleMouseMove)
    }
})

</script>

<template>
    <main class="auth-layout">
        <section ref="cardRef" class="auth-card">
            <!-- Icon Badge -->
            <div class="icon-badge">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            </div>

            <!-- Header -->
            <div class="header">
                <h2>Đăng nhập Nhân viên</h2>
                <p class="subtitle">Hệ thống quản lý nội bộ</p>
            </div>
            
            <!-- Form -->
            <form @submit.prevent="onSubmit" class="auth-form">
                <div class="input-wrapper">
                    <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <input 
                        v-model="username" 
                        type="text" 
                        placeholder="Tên đăng nhập"
                        required
                    />
                </div>

                <div class="input-wrapper">
                    <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input 
                        v-model="password" 
                        type="password" 
                        placeholder="Mật khẩu"
                        required
                    />
                </div>
                
                <button type="submit" :disabled="loading">
                    <span v-if="!loading">Đăng nhập</span>
                    <span v-else class="loading-spinner">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                        </svg>
                        Đang xử lý...
                    </span>
                    <svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>

                <p v-if="msg" class="message" :class="{ 'success': msg.includes('thành công'), 'error': !msg.includes('thành công') }">
                    {{ msg }}
                </p>
            </form>
        </section>
    </main>
</template>

<style scoped>
.auth-layout {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    position: relative;
    overflow: hidden;
}

/* Subtle background pattern */
.auth-layout::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
        radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
    pointer-events: none;
}

.auth-card {
    --mouse-x: 50%;
    --mouse-y: 50%;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 48px 40px;
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 1;
    animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}

/* Spotlight effect that follows mouse */
.auth-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        600px circle at var(--mouse-x) var(--mouse-y),
        rgba(255, 255, 255, 0.15),
        transparent 40%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: -1;
}

.auth-card:hover::before {
    opacity: 1;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Icon Badge */
.icon-badge {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #a78bfa, #8b5cf6);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.6);
    color: white;
}

/* Header */
.header {
    text-align: center;
    margin-bottom: 32px;
}

.header h2 {
    margin: 0 0 8px 0;
    color: white;
    font-size: 26px;
    font-weight: 700;
}

.subtitle {
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;
    margin: 0;
    font-weight: 500;
}

/* Form */
.auth-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* Input wrapper with icon */
.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 16px;
    color: rgba(255, 255, 255, 0.6);
    pointer-events: none;
    z-index: 1;
}

.input-wrapper input {
    width: 100%;
    padding: 16px 16px 16px 48px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    font-size: 15px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-sizing: border-box;
    color: white;
}

.input-wrapper input::placeholder {
    color: rgba(255, 255, 255, 0.6);
}

.input-wrapper input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
}

.input-wrapper input:focus + .input-icon {
    color: white;
}

/* Submit button */
.auth-form button {
    padding: 16px 24px;
    background: linear-gradient(135deg, #a78bfa, #8b5cf6);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-top: 8px;
    box-shadow: 0 4px 16px rgba(139, 92, 246, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    position: relative;
}

.arrow-icon {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.auth-form button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.6);
}

.auth-form button:hover:not(:disabled) .arrow-icon {
    transform: translateX(4px);
}

.auth-form button:active:not(:disabled) {
    transform: translateY(0);
}

.auth-form button:disabled {
    background: rgba(255, 255, 255, 0.2);
    cursor: not-allowed;
    box-shadow: none;
}

.loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.loading-spinner svg {
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* Message */
.message {
    margin-top: 8px;
    text-align: center;
    font-size: 14px;
    padding: 12px 16px;
    border-radius: 10px;
    font-weight: 500;
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message.error {
    background: rgba(220, 38, 38, 0.2);
    color: #fee2e2;
    border: 1px solid rgba(220, 38, 38, 0.3);
}

.message.success {
    background: rgba(5, 150, 105, 0.2);
    color: #d1fae5;
    border: 1px solid rgba(5, 150, 105, 0.3);
}

/* Responsive */
@media (max-width: 480px) {
    .auth-card {
        padding: 36px 28px;
    }
    
    .header h2 {
        font-size: 24px;
    }

    .icon-badge {
        width: 70px;
        height: 70px;
    }
}
</style>
