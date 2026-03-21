<template>
  <div class="sidebar bg-dark text-white p-3 d-flex flex-column">
    <div class="sidebar-nav flex-grow-1">
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
          <router-link class="nav-link text-white" to="/reception/check-in-offline">
            Check in Offline
          </router-link>
        </li>

        <li class="nav-item mb-2">
          <router-link class="nav-link text-white" to="/reception/payment"> Thanh toán </router-link>
        </li>

        <li class="nav-item mb-2">
          <router-link class="nav-link text-white" to="/invoice-list"> Danh sách Hóa đơn </router-link>
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

    <div class="mt-auto d-flex justify-content-center pt-3">
      <RouterLink to="/auth/login">
        <button class="btn btn-outline-light">Logout</button>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  position: sticky;
  top: 0;
  align-self: stretch;
  overflow: hidden;
}

.sidebar-nav {
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sidebar-nav::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
