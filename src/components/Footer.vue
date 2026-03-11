<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="brand-block">
        <div class="brand-circle">ByHat</div>
        <p class="brand-tagline">Tinh hoa lẩu Việt, ấm vị bên bạn</p>
      </div>

      <div class="footer-col">
        <h5>Địa chỉ</h5>
        <p>Số 1 Trịnh Văn Bô, Nam Từ Liêm</p>
        <p>Số 3 Chùa Láng, Đống Đa</p>
        <p>Số 271 Lê Quang Đạo, Mễ Trì</p>
      </div>

      <div class="footer-col">
        <h5>Giờ mở cửa</h5>
        <p>Mon - Fri: 10AM - 10PM</p>
        <p>Sat - Sun: 9AM - 11PM</p>
      </div>

      <div class="footer-col">
        <h5>Liên hệ</h5>
        <p>Hotline: 0984653217</p>
        <p>Email: info@byhat.vn</p>
        <div class="social">
          <a href="https://www.instagram.com/bachzitt.172" target="_blank" class="icon instagram">
            <i class="fa-brands fa-instagram"></i>
          </a>
          <a href="https://www.facebook.com/xuanbach.207" target="_blank" class="icon facebook">
            <i class="fa-brands fa-facebook-f"></i>
          </a>
          <a href="https://www.tiktok.com/@lazaydooklaaa" target="_blank" class="icon tiktok">
            <i class="fa-brands fa-tiktok"></i>
          </a>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      © 2026 ByHat Restaurant. All rights reserved.
    </div>
  </footer>
</template>

<script setup lang="ts"></script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap');

.site-footer {
  background: linear-gradient(
    135deg,
    rgba(79, 11, 11, 0.88),
    rgba(125, 14, 14, 0.9) 45%,
    rgba(177, 18, 10, 0.9) 100%
  );
  color: #f9f4ee;
  padding: 50px 0 20px;
  font-family: 'Manrope', sans-serif;
  backdrop-filter: blur(6px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-inner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 28px;
  padding: 0 40px;
}

.brand-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.brand-circle {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  letter-spacing: 1px;
}

.brand-tagline {
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  max-width: 200px;
}

.footer-col h5 {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  margin-bottom: 10px;
}

.footer-col p {
  margin: 0 0 6px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
}

.social {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: white;
  font-size: 18px;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.icon:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.instagram {
  background: linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7);
}

.facebook {
  background: #1877f2;
}

.tiktok {
  background: #111;
}

.footer-bottom {
  text-align: center;
  margin-top: 28px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 768px) {
  .footer-inner {
    padding: 0 20px;
  }
}
</style>
