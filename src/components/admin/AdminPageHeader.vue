<template>
  <div class="admin-page-header">
    <div class="admin-page-header-main">
      <h1 class="admin-page-title">{{ title }}</h1>
      <p v-if="subtitle" class="admin-page-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="admin-page-header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
}
defineProps<Props>()
</script>

<style scoped>
.admin-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.admin-page-header-main {
  flex: 1;
  min-width: 0;
}

.admin-page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}

.admin-page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.admin-page-header-actions {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
