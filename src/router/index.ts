import HomeView from '@/components/home/HomeView.vue'
import MenuView from '@/views/menu/MenuView.vue'
import MainLayout from '@/layout/MainLayout.vue'
import LoginView from '@/views/auth/LoginView.vue'
import OtpVerifyView from '@/views/auth/OtpVerifyView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import ReservationSuccessView from '@/views/reservation/ReservationSuccessView.vue'
import ReservationLookupView from '@/views/staff/ReservationLookupView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/auth/login' },

    { path: '/auth/login', name: 'login', component: LoginView },
    { path: '/auth/register', name: 'register', component: RegisterView },
    { path: '/auth/verify-otp', name: 'verify-otp', component: OtpVerifyView },
    { path: '/reservation', redirect: { path: '/home' } },
    { path: '/reservation/success', name: 'reservation-success', component: ReservationSuccessView },

    {
      path: '/',
      component: MainLayout,
      children: [
        { path: 'home', name: 'home', component: HomeView },
        { path: 'menu', name: 'menu', component: MenuView },
        { path: 'staff/checkin', name: 'staff-checkin', component: ReservationLookupView },
      ],
    },
  ],
})

export default router
