<template>
  <div class="reception-layout">
    <ReceptionSidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
    <div class="reception-main" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <main class="reception-content">
        <!-- OVERTIME ALERT PANEL -->
        <div class="mb-4">
          <OvertimeAlertPanel />
        </div>
        
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ReceptionSidebar from '@/components/ReceptionSidebar.vue'
import OvertimeAlertPanel from '@/components/staff/OvertimeAlertPanel.vue'

const sidebarCollapsed = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<style scoped>
.reception-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #fdfbfb 0%, #f6f9fc 100%);
}

.reception-main {
  flex: 1;
  margin-left: 240px;
  transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.reception-main.sidebar-collapsed {
  margin-left: 80px;
}

.reception-content {
  padding: 32px;
  min-height: calc(100vh - 64px);
}

@media (max-width: 768px) {
  .reception-main {
    margin-left: 0;
  }
  
  .reception-main.sidebar-collapsed {
    margin-left: 0;
  }
  
  .reception-content {
    padding: 20px;
  }
}
</style>
