<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark" ,>
    <div class="container-fluid">
      <RouterLink class="navbar-brand fw-bold" to="/"> ByHat </RouterLink>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item"><RouterLink class="nav-link" to="/menu"> Thực đơn </RouterLink></li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/reservation"> Đặt bàn </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/reviews"> Đánh giá </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/contact"> Liên hệ </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/auth/login">
              <button class="btn btn-outline-light ms-3">Logout</button>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts"></script>
