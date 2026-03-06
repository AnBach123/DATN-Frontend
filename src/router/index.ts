import LoginView from '@/views/auth/LoginView.vue'
import OtpVerifyView from '@/views/auth/OtpVerifyView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/auth/login'},
    { path: '/auth/login', name: 'login', component: LoginView},
    { path: '/auth/register', name: 'register', component: RegisterView},
    { path: '/auth/verify-otp', name: 'verify-otp', component: OtpVerifyView},
  ],
})

export default router

