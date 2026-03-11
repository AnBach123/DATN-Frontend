import HomeView from '@/components/home/HomeView.vue'
import MenuView from '@/views/menu/MenuView.vue'
import MainLayout from '@/layout/MainLayout.vue'
import LoginView from '@/views/auth/LoginView.vue'
import OtpVerifyView from '@/views/auth/OtpVerifyView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import ReservationSuccessView from '@/views/reservation/ReservationSuccessView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import ReceptionMainLayout from '@/layout/ReceptionMainLayout.vue'
import CheckInOnl from '@/components/reception/CheckInOnl.vue'
import StaffOrder from '@/components/staff/StaffOrder.vue'

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
        { path: 'reservation', name: 'reservation', component: ReservationForm },
        {
          path: 'reservation/success',
          name: 'reservation-success',
          component: ReservationSuccessView,
        },
        { path: 'menu', name: 'menu', component: MenuView },
      ],
    },

    {
      path: '/reception',
      component: ReceptionMainLayout,
      children: [
        { path: '/reception/check-in-online', name: 'check-in-online', component: CheckInOnl },
      ],
    },

    { path: '/staff-order', name: 'staff-order', component: StaffOrder },
  ],
})

export default router
