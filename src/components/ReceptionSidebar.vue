<template>
  <div class="bg-dark text-white p-3 vh-100 d-flex flex-column" style="width: 220px">
    <div>
      <h4 class="mb-4">ByHat</h4>

      <ul class="nav flex-column">
        <li class="nav-item mb-2">
          <router-link class="nav-link text-white" to="/dashboard"> Dashboard </router-link>
        </li>

        <li class="nav-item mb-2">
          <router-link class="nav-link text-white" to="/reception/check-in-online">
            Check in Online
          </router-link>
        </li>

        <li class="nav-item mb-2">
          <router-link class="nav-link text-white" to="/check-in-offline">
            Check in Offline
          </router-link>
        </li>

        <li class="nav-item mb-2">
          <router-link class="nav-link text-white" to="/payment"> Thanh toán </router-link>
        </li>

        <li class="nav-item mb-2">
          <router-link class="nav-link text-white" to="/invoice-list">
            Danh sách Hóa đơn
          </router-link>
        </li>

        <li class="nav-item mb-2">
          <router-link class="nav-link text-white" to="/table"> Danh sách Bàn </router-link>
        </li>

        <li class="nav-item mb-2">
          <router-link class="nav-link text-white" to="/reservation-list">
            Danh sách Đặt bàn
          </router-link>
        </li>
      </ul>
    </div>

    <!-- Logout button -->
    <div class="mt-auto d-flex justify-content-center">
      <RouterLink to="/auth/login">
        <button class="btn btn-outline-light">Logout</button>
      </RouterLink>
    </div>
  </div>
</template>
