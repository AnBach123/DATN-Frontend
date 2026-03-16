<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import BookingModal from '@/components/reservation/BookingModal.vue'
import SidebarAdmin from '@/components/SidebarAdmin.vue'
</script>

<template>
  <div class="d-flex">
    <!-- Sidebar -->
    <SidebarAdmin />

    <!-- Main content -->
    <div class="flex-grow-1 d-flex flex-column min-vh-100">
      <!-- Page Content -->
      <main class="flex-grow-1 p-4">
        <router-view />
      </main>
    </div>
  </div>

  <!-- Modal global -->
  <BookingModal />
</template>
