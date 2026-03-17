<template>
  <div class="d-flex min-vh-100 align-items-stretch reception-layout">
    <!-- Sidebar -->
    <ReceptionSidebar class="reception-sidebar" />

    <!-- Content -->
    <div class="reception-content p-4 bg-light">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import ReceptionSidebar from '@/components/ReceptionSidebar.vue'
</script>

<style scoped>
.reception-layout {
  width: 100%;
}

.reception-sidebar {
  flex: 0 0 25%;
  min-width: 200px;
  max-width: 280px;
}

.reception-content {
  flex: 1 1 75%;
  min-width: 0;
}

@media (max-width: 992px) {
  .reception-layout {
    flex-direction: column;
  }

  .reception-sidebar {
    width: 100%;
    max-width: none;
  }
}
</style>
