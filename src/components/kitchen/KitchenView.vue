<template>
  <div class="container-fluid p-4">
    <h3 class="mb-4">Kitchen Display</h3>

    <div class="row">
      <KitchenColumn title="ORDERED" :items="orderedItems" @updateStatus="updateStatus" />

      <KitchenColumn title="IN PROGRESS" :items="inProgressItems" @updateStatus="updateStatus" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import KitchenColumn from './KitchenColumn.vue'

/* MOCK DATA */

const items = ref([
  {
    invoice_item_id: 1,
    invoice_id: 12,
    item_name: 'Bò lúc lắc',
    item_type: 'PRODUCT',
    quantity: 2,
    status: 'ORDERED',
  },
  {
    invoice_item_id: 2,
    invoice_id: 12,
    item_name: 'Combo Lẩu Thái',
    item_type: 'COMBO',
    quantity: 1,
    status: 'ORDERED',
  },
  {
    invoice_item_id: 3,
    invoice_id: 10,
    item_name: 'Cá hấp',
    item_type: 'PRODUCT',
    quantity: 1,
    status: 'IN_PROGRESS',
  },
  {
    invoice_item_id: 4,
    invoice_id: 11,
    item_name: 'Tôm chiên',
    item_type: 'PRODUCT',
    quantity: 3,
    status: 'ORDERED',
  },
])

const orderedItems = computed(() => items.value.filter((i) => i.status === 'ORDERED'))

const inProgressItems = computed(() => items.value.filter((i) => i.status === 'IN_PROGRESS'))

const updateStatus = (item: any) => {
  if (item.status === 'ORDERED') {
    item.status = 'IN_PROGRESS'
  } else if (item.status === 'IN_PROGRESS') {
    /* DONE → remove khỏi kitchen */

    items.value = items.value.filter((i) => i.invoice_item_id !== item.invoice_item_id)
  }
}
</script>
