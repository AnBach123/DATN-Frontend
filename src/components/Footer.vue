<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <!-- CỘT 1: LOGO + ĐẶT BÀN -->
      <div class="footer-brand">
        <div class="brand-row">
          <div class="brand-circle">
            <img :src="logo" class="footer-logo" />
          </div>
          <div class="brand-name">
            <span class="name-main">ByHat</span>
            <span class="name-sub">Hotpot Restaurant</span>
          </div>
        </div>
        <button class="btn-footer-book" @click="openBooking()">ĐẶT BÀN</button>
      </div>

      <!-- CỘT 2: LIÊN KẾT -->
      <div class="footer-col">
        <a href="/menu">Thực đơn</a>
        <a href="/posts">Bài viết</a>
        <a href="/review">Đánh giá</a>
      </div>

      <!-- CỘT 3: LIÊN HỆ -->
      <div class="footer-col">
        <h5>Hotline</h5>
        <p class="highlight">0123456789</p>
        <h5>Email</h5>
        <p>anbach4865@gmail.com</p>
      </div>

      <!-- CỘT 4: SOCIAL + COPYRIGHT -->
      <div class="footer-col footer-right">
        <div class="social">
          <a href="https://www.facebook.com/xuanbach.207" target="_blank" class="s-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="https://www.tiktok.com/@lazaydooklaaa" target="_blank" class="s-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.05a6.33 6.33 0 0 0-.88-.05 6.34 6.34 0 1 0 6.34 6.34V9.5a8.16 8.16 0 0 0 3.76.92V6.69z"/></svg>
          </a>
          <a href="https://www.instagram.com/bachzitt.172" target="_blank" class="s-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
          </a>
          <a href="https://www.youtube.com" target="_blank" class="s-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7s-.3-2-1.2-2.9C20.7 3 19.5 3 19 3H5c-.5 0-1.7 0-2.8 1.1C1.3 5 1 7 1 7S.7 9.3.7 11.5v1c0 2.2.3 4.5.3 4.5s.3 2 1.2 2.9c1.1 1.1 2.3 1.1 2.8 1.1h14c.5 0 1.7 0 2.8-1.1.9-.9 1.2-2.9 1.2-2.9s.3-2.3.3-4.5v-1c0-2.2-.3-4.5-.3-4.5zM9.5 15.5V8l6.5 3.75-6.5 3.75z"/></svg>
          </a>
        </div>
        <p class="copyright">© 2026 ByHat Restaurant</p>
      </div>
    </div>

    <!-- SCROLL TO TOP -->
    <button class="scroll-top" @click="scrollToTop" v-show="showScrollTop">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
    </button>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import logo from '@/assets/logo.png'
import { useBookingStore } from '@/composables/bookingStore'

const { open: openBooking } = useBookingStore()
const showScrollTop = ref(false)

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 400
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', handleScroll))
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap');

.site-footer {
  background: #581e1e;
  color: #e8e0d8;
  padding: 32px 0 20px;
  font-family: 'Manrope', sans-serif;
  position: relative;
}

.footer-inner {
  display: grid;
  grid-template-columns: 280px 1fr 1fr 1fr;
  gap: 24px;
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 20px;
  align-items: start;
}

/* CỘT 1: BRAND */
.footer-brand { display: flex; flex-direction: column; gap: 16px; }
.brand-row { display: flex; align-items: center; gap: 12px; }
.brand-circle {
  width: 50px; height: 50px; border-radius: 50%; background: white;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.footer-logo { width: 42px; height: 42px; object-fit: contain; }
.name-main { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 800; color: white; display: block; line-height: 1; }
.name-sub { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #c8a87c; }

.btn-footer-book {
  padding: 10px 28px; border: 2px solid rgba(255,255,255,0.3); border-radius: 6px;
  background: transparent; color: white; font-weight: 700; font-size: 13px;
  cursor: pointer; transition: 0.25s; width: fit-content; letter-spacing: 1px;
}
.btn-footer-book:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.5); }

/* CỘT LINKS */
.footer-col { display: flex; flex-direction: column; gap: 8px; }
.footer-col a {
  color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px; transition: 0.2s;
}
.footer-col a:hover { color: #ffd700; }
.footer-col h5 { font-size: 12px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; margin: 0; }
.footer-col p { margin: 0 0 10px; font-size: 14px; color: rgba(255,255,255,0.8); }
.footer-col .highlight { color: #ffd700; font-weight: 700; font-size: 16px; }

/* CỘT SOCIAL */
.footer-right { align-items: flex-end; }
.social { display: flex; gap: 10px; margin-bottom: 14px; }
.s-icon {
  width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.7); transition: 0.25s; text-decoration: none;
}
.s-icon:hover { color: white; border-color: white; transform: translateY(-2px); }
.copyright { font-size: 12px; color: rgba(255,255,255,0.4); margin: 0; }

/* SCROLL TOP */
.scroll-top {
  position: fixed; bottom: 31px; right: 90px; z-index: 1101;
  width: 42px; height: 42px; border-radius: 50%; border: none;
  background: #c8a87c; color: white; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 14px rgba(0,0,0,0.2); transition: 0.25s;
}
.scroll-top:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }

/* RESPONSIVE */
@media (max-width: 768px) {
  .footer-inner { grid-template-columns: 1fr 1fr; gap: 28px; }
  .footer-right { align-items: flex-start; }
}
@media (max-width: 480px) {
  .footer-inner { grid-template-columns: 1fr; }
}
</style>
