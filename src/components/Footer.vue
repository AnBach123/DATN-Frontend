<script setup lang="ts">
</script>

<template>

<footer class="footer text-white">

<div class="container">

<div class="row align-items-center text-center text-md-start">

<div class="col-md-2 mb-3">

<div class="circle mx-auto mx-md-0">
Logo
</div>

</div>

<div class="col-md-4">

<h5>ByHat Restaurant</h5>

<p>Số 1 Trịnh Văn Bô, Nam Từ Liêm</p>
<p>Số 3 Chùa Láng, Đống Đa</p>
<p>Số 271 Lê Quang Đạo, Mễ Trì</p>

</div>

<div class="col-md-3">

<p><b>Giờ mở cửa:</b></p>

<p>Mon - Fri: 10AM - 10PM</p>
<p>Sat - Sun: 9AM - 11PM</p>

</div>


<div class="col-md-3">

<p>Hotline: 0984653217</p>
<p>Email: inforByhat@gmail.com</p>

<div class="social">

<a 
href="https://www.instagram.com/bachzitt.172"
target="_blank"
class="icon instagram"
>
<i class="fa-brands fa-instagram"></i>
</a>

<a 
href="https://www.facebook.com/xuanbach.207"
target="_blank"
class="icon facebook"
>
<i class="fa-brands fa-facebook-f"></i>
</a>

<a 
href="https://www.tiktok.com/@lazaydooklaaa"
target="_blank"
class="icon tiktok"
>
<i class="fa-brands fa-tiktok"></i>
</a>

</div>

</div>

</div>

</div>

</footer>

</template>

<style scoped>

.footer{
background:#b30b00;
padding:40px 0;
}



.circle{
width:80px;
height:80px;
border-radius:50%;
border:2px solid white;
display:flex;
align-items:center;
justify-content:center;
font-weight:bold;
}



.social{
margin-top:10px;
}

.icon{
display:inline-flex;
align-items:center;
justify-content:center;
width:45px;
height:45px;
margin-right:10px;
border-radius:8px;
color:white;
font-size:20px;
transition:0.3s;
}

.icon:hover{
transform:translateY(-3px);
opacity:0.9;
}



.instagram{
background:linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7);
}

.facebook{
background:#1877f2;
border-radius:50%;
}

.tiktok{
background:#000;
border-radius:50%;
}

</style>