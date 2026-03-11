<template>
  <nav class="site-nav navbar navbar-expand-lg">
    <div class="container-fluid nav-shell">
      <RouterLink class="brand" to="/home">
        <span class="brand-mark">ByHat</span>
        <span class="brand-sub">Quán nhậu tự do</span>
      </RouterLink>

      <button
        class="navbar-toggler nav-toggle"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse nav-collapse" id="navbarNav">
        <ul class="nav-list ms-auto">
          <li class="nav-item"><RouterLink class="nav-link" to="/menu">Thực đơn</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" to="/reviews">Đánh giá</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" to="/contact">Liên hệ</RouterLink></li>
        </ul>

        <div class="nav-actions">
          <button class="btn-reserve" @click="openBooking()">Đặt bàn ngay</button>
          <RouterLink class="btn-ghost" to="/auth/login">
            <button class="btn btn-outline-light ms-2">Logout</button>
          </RouterLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useBookingStore } from '@/composables/bookingStore'

const { open: openBooking } = useBookingStore()
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap');

.site-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: linear-gradient(
    120deg,
    rgba(96, 15, 15, 0.92) 0%,
    rgba(132, 36, 36, 0.92) 45%,
    rgba(166, 48, 48, 0.92) 100%
  );
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
}

.nav-shell {
  padding: 14px 28px;
  align-items: center;
}

.brand {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: #fff;
}

.brand-mark {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  letter-spacing: 1px;
}

.brand-sub {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #f0b66a;
}

.nav-list {
  display: flex;
  gap: 18px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.nav-link {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.btn-link {
  background: none;
  border: none;
  padding: 0;
}

.nav-link:hover {
  color: #fff;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 20px;
}

.btn-reserve {
  border: none;
  background: linear-gradient(135deg, #f7c782 0%, #f2b565 100%);
  color: #3a1f12;
  padding: 10px 22px;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: 0.2px;
  text-decoration: none;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-reserve:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 24px rgba(0, 0, 0, 0.22);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.nav-toggle {
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.nav-toggle .navbar-toggler-icon {
  filter: invert(1);
}

@media (max-width: 991px) {
  .nav-collapse {
    padding-top: 12px;
  }

  .nav-actions {
    margin: 12px 0 8px;
    justify-content: flex-start;
  }

  .nav-list {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
