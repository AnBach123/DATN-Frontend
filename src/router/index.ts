import ReservationForm from '@/components/reservation/ReservationForm.vue'
import HomeView from '@/components/home/HomeView.vue'
import MainLayout from '@/layout/MainLayout.vue'
import LoginView from '@/views/auth/LoginView.vue'
import OtpVerifyView from '@/views/auth/OtpVerifyView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import ReservationSuccessView from '@/views/reservation/ReservationSuccessView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import KitchenView from '@/components/kitchen/KitchenView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/auth/login' },

    { path: '/auth/login', name: 'login', component: LoginView },
    { path: '/auth/register', name: 'register', component: RegisterView },
    { path: '/auth/verify-otp', name: 'verify-otp', component: OtpVerifyView },

    {
      path: '/',
      component: MainLayout,
      children: [
        { path: 'home', name: 'home', component: HomeView },
        { path: 'reservation', name: 'reservation', component: ReservationForm },
        {
          path: 'reservation/success',
          name: 'reservation-success',
          component: ReservationSuccessView,
        },
      ],
    },
    { path: '/kitchen-view', name: 'kitchen-view', component: KitchenView },
  ],
})

export default router
