<script setup lang="ts">
defineProps<{ rating: number, size?: number }>()
</script>

<template>
  <div class="star-wrap">
    <span 
      v-for="i in 5" 
      :key="i"
      class="star"
      :class="{ active: i <= rating }"
      :style="{ fontSize: (size || 16) + 'px' }"
    >
      ★
    </span>
  </div>
</template>

<style scoped>
.star-wrap {
  display: flex;
  gap: 4px;
}

.star {
  color: #dcdcdc;
  transition: 0.2s;
}

.star.active {
  color: #ffc107;
  text-shadow: 0 2px 6px rgba(255, 193, 7, 0.6);
}
</style>