<template>
  <div class="card kitchen-card mb-3">
    <div class="card-body">
      <div class="item-name">{{ item.quantity }}x {{ item.item_name }}</div>

      <div class="invoice">Invoice #{{ item.invoice_id }}</div>

      <div class="mt-3">
        <button
          v-if="item.status === 'ORDERED'"
          class="btn btn-warning w-100"
          @click="$emit('updateStatus')"
        >
          Start Cooking
        </button>

        <button
          v-if="item.status === 'IN_PROGRESS'"
          class="btn btn-success w-100"
          @click="$emit('updateStatus')"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  item: Object,
})
</script>

<style scoped>
.kitchen-card {
  border-left: 6px solid orange;
}

.item-name {
  font-size: 18px;
  font-weight: 600;
}

.invoice {
  font-size: 14px;
  color: gray;
}
</style>
