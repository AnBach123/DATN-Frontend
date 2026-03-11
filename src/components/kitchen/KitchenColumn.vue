<template>
  <div class="col-md-6">
    <h5 class="text-center mb-3">
      {{ title }}
    </h5>

    <div class="column">
      <KitchenItem
        v-for="item in items"
        :key="item.invoice_item_id"
        :item="item"
        @updateStatus="$emit('updateStatus', item)"
      />

      <div v-if="items.length === 0" class="empty">No items</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KitchenItem from './KitchenItem.vue'

defineProps({
  title: String,
  items: Array,
})
</script>

<style scoped>
.column {
  min-height: 600px;
  background: #f5f6f7;
  padding: 12px;
  border-radius: 8px;
}

.empty {
  text-align: center;
  color: gray;
  padding: 40px;
}
</style>
