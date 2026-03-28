<template>
  <div class="layout">
    <!-- NAVBAR -->
    <StaffNavbar />

    <!-- MAIN CONTENT -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import StaffNavbar from '@/components/staff/StaffNavbar.vue'
</script>

<style scoped>
/* ROOT */
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
}

/* CONTENT */
.main-content {
  flex: 1;
  padding: 20px 24px;
}
</style>
