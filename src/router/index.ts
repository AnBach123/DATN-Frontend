import HomeView from '@/components/home/HomeView.vue'
import MenuView from '@/views/menu/MenuView.vue'
import MainLayout from '@/layout/MainLayout.vue'
import LoginView from '@/views/auth/LoginView.vue'
import OtpVerifyView from '@/views/auth/OtpVerifyView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import ReservationSuccessView from '@/views/reservation/ReservationSuccessView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import ReceptionMainLayout from '@/layout/ReceptionMainLayout.vue'
import OnlineCheckInView from '@/views/reception/OnlineCheckInView.vue'
import WalkInCheckInView from '@/views/reception/WalkInCheckInView.vue'
import StaffOrder from '@/components/staff/StaffOrder.vue'
import PaymentListView from '@/views/reception/PaymentListView.vue'
import InvoiceHistoryView from '@/views/reception/InvoiceHistoryView.vue'
import MockBankTransfer from '@/views/MockBankTransfer.vue'
import InvoiceView from '@/views/InvoiceView.vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import DashboardView from '@/views/admin/DashboardView.vue'
import InvoiceListView from '@/views/admin/InvoiceListView.vue'
import KitchenBoard from '@/views/kitchen/KitchenBoard.vue'
import StaffMainLayout from '@/layout/StaffMainLayout.vue'
import StaffViewOrder from '@/components/staff/StaffViewOrder.vue'

// Route guard helper
function checkRole(allowedRoles: string[]) {
  return () => {
    // Check if role-based routing is enabled
    const roleCheckEnabled = import.meta.env.VITE_ENABLE_AUTO_LOGOUT === 'true';
    
    // If role check is disabled (development mode), allow all routes
    if (!roleCheckEnabled) {
      console.log('🔓 Role check disabled - allowing access to route');
      return true;
    }
    
    // Role check enabled (production mode)
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      return '/auth/login'
    }
    if (!allowedRoles.includes(userRole)) {
      return '/auth/login'
    }
    return true
  }
}

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
      beforeEnter: checkRole(['USER']),
      children: [
        { path: 'home', name: 'home', component: HomeView },
        { path: 'menu', name: 'menu', component: MenuView },
      ],
    },

    {
      path: '/reservation',
      redirect: { path: '/home' },
      beforeEnter: checkRole(['USER']),
    },
    {
      path: '/reservation/success',
      name: 'reservation-success',
      component: ReservationSuccessView,
      beforeEnter: checkRole(['USER']),
    },

    {
      path: '/reception',
      component: ReceptionMainLayout,
      beforeEnter: checkRole(['RECEPTION']),
      children: [
        { path: '', redirect: '/reception/check-in-offline' },
        { path: 'check-in-offline', name: 'check-in-offline', component: WalkInCheckInView },
        { path: 'check-in-online', name: 'check-in-online', component: OnlineCheckInView },
        { path: 'payment', name: 'reception-payment', component: PaymentListView },
        { path: 'invoice-history', name: 'invoice-history', component: InvoiceHistoryView },
      ],
    },

    {
      path: '/admin',
      component: AdminLayout,
      beforeEnter: checkRole(['ADMIN']),
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: DashboardView,
        },
        {
          path: 'invoices',
          name: 'admin-invoices',
          component: InvoiceListView,
        },
        {
          path: '',
          redirect: '/admin/dashboard',
        },
      ],
    },

    {
      path: '/staff',
      component: StaffMainLayout,
      beforeEnter: checkRole(['STAFF']),
      children: [
        { path: 'order', name: 'staff-order', component: StaffOrder },
        { path: 'view-orders', name: 'staff-view-orders', component: StaffViewOrder },
      ],
    },
    { 
      path: '/mock-bank-transfer', 
      name: 'mock-bank-transfer', 
      component: MockBankTransfer
    },
    {
      path: '/invoice',
      name: 'invoice',
      component: InvoiceView,
      beforeEnter: checkRole(['USER', 'RECEPTION']),
    },

    {
      path: '/kitchen',
      name: 'kitchen',
      component: KitchenBoard,
      beforeEnter: checkRole(['KITCHEN']),
    },
  ],
})

export default router
