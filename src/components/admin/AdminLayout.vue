<template>
  <div class="admin-layout">
    <AdminSidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
    <div class="admin-main" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <AdminHeader @toggle-sidebar="toggleSidebar" />
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AdminSidebar from './AdminSidebar.vue'
import AdminHeader from './AdminHeader.vue'

const sidebarCollapsed = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #fdfbfb 0%, #f6f9fc 100%);
}

.admin-main {
  flex: 1;
  margin-left: 240px;
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-main.sidebar-collapsed {
  margin-left: 80px;
}

.admin-content {
  padding: 32px;
  min-height: calc(100vh - 64px);
}

@media (max-width: 768px) {
  .admin-main {
    margin-left: 0;
  }
  
  .admin-main.sidebar-collapsed {
    margin-left: 0;
  }
  
  .admin-content {
    padding: 20px;
  }
}
</style>
