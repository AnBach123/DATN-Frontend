<template>
  <div class="d-flex flex-column vh-100 bg-dark text-white p-3 sidebar-fixed" style="width: 250px">
    <!-- Logo / Title -->
    <div class="mb-4 text-center">
      <h4>Restaurant</h4>
    </div>

    <!-- Menu -->
    <ul class="nav nav-pills flex-column mb-auto">
      <li class="nav-item">
        <router-link to="/dashboard" class="nav-link text-white">
          <i class="bi bi-speedometer2 me-2"></i>
          Dashboard
        </router-link>
      </li>

      <li>
        <router-link to="/tables" class="nav-link text-white">
          <i class="bi bi-grid me-2"></i>
          Bàn ăn
        </router-link>
      </li>

      <li>
        <router-link to="/orders" class="nav-link text-white">
          <i class="bi bi-receipt me-2"></i>
          Order
        </router-link>
      </li>

      <li>
        <router-link to="/customers" class="nav-link text-white">
          <i class="bi bi-people me-2"></i>
          Khách hàng
        </router-link>
      </li>
    </ul>

    <!-- Logout -->
    <div class="mt-auto">
      <hr />
      <button class="btn btn-danger w-100" @click="logout">
        <i class="bi bi-box-arrow-right me-2"></i>
        Logout
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const logout = () => {
  localStorage.removeItem('token')
  router.push('/auth/login')
}
</script>

<style scoped>
.nav-link:hover {
  background: linear-gradient(
    120deg,
    rgba(96, 15, 15, 0.92) 0%,
    rgba(132, 36, 36, 0.92) 45%,
    rgba(166, 48, 48, 0.92) 100%
  );
}
</style>
