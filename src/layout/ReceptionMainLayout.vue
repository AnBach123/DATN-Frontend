<template>
  <div class="d-flex">
    <!-- Sidebar -->
    <ReceptionSidebar />

    <!-- Content -->
    <div class="flex-grow-1 p-4 bg-light min-vh-100">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import ReceptionSidebar from '@/components/ReceptionSidebar.vue'
</script>
