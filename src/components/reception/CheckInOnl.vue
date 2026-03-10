<!-- only frontend -->
<template>
  <div>
    <h3 class="mb-4">Check In Khách Hàng</h3>

    ```
    <!-- Search reservation -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row">
          <div class="col-md-4">
            <input v-model="reservationCode" class="form-control" placeholder="Nhập mã đặt bàn" />
          </div>

          <div class="col-md-2">
            <button class="btn btn-danger w-100" @click="searchReservation">Tìm</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reservation info -->
    <div v-if="reservation" class="card">
      <div class="card-body">
        <p><b>Tên khách:</b> {{ reservation.name }}</p>
        <p><b>Thời gian:</b> {{ reservation.time }}</p>
        <p><b>Số khách:</b> {{ reservation.guests }}</p>

        <span class="badge bg-warning mb-3">
          {{ reservation.status }}
        </span>

        <br />

        <button class="btn btn-success" @click="checkIn">Check-in</button>
      </div>
    </div>
    ```
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Reservation {
  name: string
  time: string
  guests: number
  status: string
}

const reservationCode = ref<string>('')

const reservation = ref<Reservation | null>(null)

function searchReservation() {
  reservation.value = {
    name: 'Nguyễn Văn A',
    time: '18:00',
    guests: 4,
    status: 'CONFIRMED',
  }
}

function checkIn() {
  if (!reservation.value) return

  reservation.value.status = 'IN_PROGRESS'
  alert('Check-in thành công')
}
</script>
