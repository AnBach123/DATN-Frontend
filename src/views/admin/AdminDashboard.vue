<template>
  <div class="container-fluid">
    <!-- PAGE TITLE -->

    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-bold">Admin Dashboard</h3>
      <span class="text-muted">Hôm nay: {{ today }}</span>
    </div>

    <!-- KPI -->

    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card shadow-sm">
          <div class="card-body text-center">
            <h6 class="text-muted">Đặt bàn hôm nay</h6>
            <h3 class="fw-bold">{{ summary.todayReservations }}</h3>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card shadow-sm">
          <div class="card-body text-center">
            <h6 class="text-muted">Bàn đang phục vụ</h6>
            <h3 class="fw-bold">{{ summary.occupiedTables }}</h3>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card shadow-sm">
          <div class="card-body text-center">
            <h6 class="text-muted">Bàn trống</h6>
            <h3 class="fw-bold">{{ summary.availableTables }}</h3>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card shadow-sm">
          <div class="card-body text-center">
            <h6 class="text-muted">Doanh thu hôm nay</h6>
            <h3 class="fw-bold">
              {{ new Intl.NumberFormat('vi-VN').format(summary.todayRevenue) }}đ
            </h3>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN GRID -->

    <div class="row g-4">
      <!-- RESERVATIONS -->

      <div class="col-lg-6">
        <div class="card shadow-sm">
          <div class="card-header fw-bold">Đặt bàn sắp tới</div>

          <div class="card-body p-0">
            <table class="table mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th>Giờ</th>
                  <th>Khách</th>
                  <th>Số khách</th>
                  <th>Bàn</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="r in reservations" :key="r.id" class="hover-row">
                  <td>{{ r.time }}</td>
                  <td>{{ r.name }}</td>
                  <td>{{ r.guests }}</td>
                  <td>{{ r.table }}</td>
                </tr>

                <tr v-if="reservations.length === 0">
                  <td colspan="4" class="text-center text-muted py-3">Không có dữ liệu</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ACTIVE ORDERS -->

      <div class="col-lg-6">
        <div class="card shadow-sm">
          <div class="card-header fw-bold">Đơn hàng đang phục vụ</div>

          <div class="card-body p-0">
            <table class="table mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th>Bàn</th>
                  <th>Số món</th>
                  <th>Thời gian</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="o in activeOrders" :key="o.table" class="hover-row">
                  <td>{{ o.table }}</td>
                  <td>{{ o.items }}</td>
                  <td>{{ o.time }} phút</td>
                </tr>

                <tr v-if="activeOrders.length === 0">
                  <td colspan="3" class="text-center text-muted py-3">Không có đơn hàng</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TOP DISHES -->

      <div class="col-lg-12">
        <div class="card shadow-sm">
          <div class="card-header fw-bold">Món bán chạy</div>

          <div class="card-body p-0">
            <div
              v-for="dish in topDishes"
              :key="dish.name"
              class="hover-row d-flex justify-content-between align-items-center px-3 py-2"
            >
              <span>{{ dish.name }}</span>
              <span class="fw-bold">{{ dish.count }}</span>
            </div>

            <div v-if="topDishes.length === 0" class="text-center text-muted py-3">
              Không có dữ liệu
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dashboardApi } from '@/services/dashboardApi'

/* ===== TYPES ===== */

type Summary = {
  todayReservations: number
  occupiedTables: number
  availableTables: number
  todayRevenue: number
}

type Reservation = {
  id: number
  time: string
  name: string
  guests: number
  table: string
}

type ActiveOrder = {
  table: string
  items: number
  time: number
}

type TopDish = {
  name: string
  count: number
}

/* ===== DATE ===== */

const today = new Date().toLocaleDateString()

/* ===== SUMMARY ===== */

const summary = ref<Summary>({
  todayReservations: 0,
  occupiedTables: 0,
  availableTables: 0,
  todayRevenue: 0,
})

/* ===== DATA ===== */

const reservations = ref<Reservation[]>([])
const activeOrders = ref<ActiveOrder[]>([])
const topDishes = ref<TopDish[]>([])

/* ===== LOAD DASHBOARD ===== */

const loadDashboard = async () => {
  try {
    const data = await dashboardApi.getDashboard()

    console.log('Dashboard API:', data)

    /* SUMMARY */

    summary.value = {
      todayReservations: data.todayReservations ?? 0,
      occupiedTables: data.occupiedTables ?? 0,
      availableTables: data.availableTables ?? 0,
      todayRevenue: data.todayRevenue ?? 0,
    }

    /* RESERVATIONS */

    reservations.value = (data.reservations ?? []).map((r: any, index: number) => ({
      id: index,
      time: r.time,
      name: r.name,
      guests: r.guests,
      table: r.table,
    }))

    /* ACTIVE ORDERS */

    activeOrders.value = (data.activeOrders ?? []).map((o: any) => ({
      table: o.table ?? '',
      items: o.items ?? 0,
      time: o.time ?? 0,
    }))

    /* TOP DISHES */

    topDishes.value = (data.topDishes ?? []).map((d: any) => ({
      name: d.name,
      count: d.count,
    }))
  } catch (err) {
    console.error('Dashboard load error:', err)
  }
}

/* ===== INIT ===== */

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.card {
  border: none;
}

.card-header {
  background: #f8f9fa;
}

.hover-row {
  transition: all 0.2s ease;
}

.hover-row:hover {
  background-color: #eef5ff;
  transform: translateX(4px);
  box-shadow: inset 4px 0 0 #0d6efd;
  cursor: pointer;
}

.table tbody tr.hover-row:hover td {
  background-color: #eef5ff;
}

.table tbody tr.hover-row:hover td:first-child {
  box-shadow: inset 4px 0 0 #0d6efd;
}

.table tbody tr {
  border-bottom: 1px solid #f1f1f1;
}
</style>
