<script setup lang="ts">
import { ref, onMounted } from "vue"
import { getProducts } from "@/services/productApi"
import { getVoucherCombos, getVoucherProducts } from "@/services/voucherApi"

interface Product {
  productId: number
  productName: string
  description?: string
  unitPrice: number
  imageUrl?: string | null
}

interface Voucher {
  voucherId: number
  voucherName: string
  description: string
}

const products = ref<Product[]>([])
const vouchers = ref<Voucher[]>([])
const loading = ref(true)

const reviews = ref([
{
id:1,
name:"Nguyễn Thị Hồng",
avatar:"https://randomuser.me/api/portraits/women/65.jpg",
content:"Thịt tươi, nước lẩu đậm vị. Tomyum chua cay rất ngon. Nhân viên phục vụ nhanh và nhiệt tình."
},
{
id:2,
name:"Trần Minh Quân",
avatar:"https://randomuser.me/api/portraits/men/32.jpg",
content:"Không gian đẹp, món ăn lên nhanh. Lẩu hải sản ở đây cực kỳ ngon."
},
{
id:3,
name:"Lê Thu Trang",
avatar:"https://randomuser.me/api/portraits/women/44.jpg",
content:"Giá hợp lý, đồ ăn sạch sẽ. Mình sẽ quay lại cùng bạn bè."
}
])

const loadProducts = async () => {
  try {
    const data = await getProducts()
    products.value = data.slice(0,4)
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false
  }
}

const loadVouchers = async () => {
  try {
    const combo = await getVoucherCombos() || []
    const product = await getVoucherProducts() || []
    vouchers.value = [...combo,...product].slice(0,3)
  } catch (error) {
    console.log(error)
  }
}

const getImage = (item: Product) => {

if(!item.imageUrl){
return "https://picsum.photos/400/300"
}

if(item.imageUrl.startsWith("http")){
return item.imageUrl
}

return "http://localhost:8080" + item.imageUrl
}

onMounted(()=>{
loadProducts()
loadVouchers()
})
</script>

<template>

<div class="home">

<!-- HERO -->
<section class="hero text-center text-white">

<div class="overlay">

<div class="container hero-content">

<div class="rating">
⭐⭐⭐⭐⭐
<p>4.5/5 - 1200+ Reviews</p>
</div>

<h1 class="title">
TINH HOA LẨU VIỆT - ĂN THẢ GA, KHÔNG LO GIÁ
</h1>

<p class="sub">
Thưởng thức lẩu cao cấp trong không gian sang trọng
</p>

<div class="mt-4">

<button class="btn btn-light btn-lg me-3">
ĐẶT BÀN NGAY
</button>

<router-link to="/menu" class="btn btn-outline-light btn-lg">
XEM THỰC ĐƠN
</router-link>

</div>

</div>

</div>

</section>

<!-- INTRO -->
<section class="intro text-center text-white">

<div class="intro-overlay">

<div class="container">

<h2>GIỚI THIỆU VỀ BYHAT</h2>

<p>
Trải nghiệm 6 loại nước dùng & hơn 60 món nhúng tươi ngon
</p>

</div>

</div>

</section>

<!-- PRODUCTS -->
<section class="menu-section">

<div class="container">

<h2 class="text-center text-white mb-3">
TINH HOA VỊ LẨU
</h2>

<p class="text-center text-white mb-5">
Những món ngon bạn không thể bỏ lỡ tại ByHat
</p>

<div v-if="loading" class="text-center text-white">
Đang tải món ăn...
</div>

<div v-else-if="products.length===0" class="text-center text-white">
Chưa có sản phẩm
</div>

<div v-else class="row g-4">

<div
class="col-lg-3 col-md-6"
v-for="item in products"
:key="item.productId"
>

<div class="card menu-card h-100">

<img
:src="getImage(item)"
class="card-img-top product-img"
onerror="this.src='https://picsum.photos/400/300'"
>

<div class="card-body text-center">

<h5 class="card-title">
{{ item.productName }}
</h5>

<p class="card-text">
{{ item.description || "Món ăn đặc biệt của ByHat" }}
</p>

<div class="price">
{{ item.unitPrice.toLocaleString('vi-VN') }} đ
</div>

<router-link
:to="'/product/' + item.productId"
class="btn btn-danger btn-sm"
>
Chi tiết
</router-link>

</div>

</div>

</div>

</div>

</div>

</section>

<!-- PROMOTION -->
<section class="promo-section">

<div class="container">

<h2 class="text-center text-white mb-5">
ƯU ĐÃI ĐẶC BIỆT THÁNG NÀY
</h2>

<div v-if="vouchers.length===0" class="text-center text-white">
Chưa có ưu đãi
</div>

<div v-else class="row g-4">

<div
class="col-md-4"
v-for="item in vouchers"
:key="item.voucherId"
>

<div class="promo-card">

<div class="badge-sale">
🔥 ƯU ĐÃI
</div>

<h4>{{ item.voucherName }}</h4>

<p>
{{ item.description }}
</p>

</div>

</div>

</div>

</div>

</section>

<!-- REVIEW -->
<section class="review-section">

<div class="container text-center">

<h2 class="review-title">
Ý KIẾN KHÁCH HÀNG
</h2>

<div class="review-rating">

<div class="star">⭐</div>

<div class="score">
4.9 / 5
</div>

<p>1200+ đánh giá tích cực</p>

</div>

<div class="row g-4 mt-4">

<div
class="col-lg-4 col-md-6"
v-for="item in reviews"
:key="item.id"
>

<div class="review-card">

<img
:src="item.avatar"
class="avatar"
/>

<h5 class="review-name">
{{ item.name }}
</h5>

<p class="review-text">
{{ item.content }}
</p>

</div>

</div>

</div>

<div class="review-action">

<p>
Hôm nay bạn thấy món nào ngon nhất? Cùng chia sẻ nhé!
</p>

<button class="review-btn">
VIẾT ĐÁNH GIÁ CỦA BẠN!
</button>

</div>

</div>

</section>

</div>

</template>

<style scoped>

.home{
background:#a80000;
}

.hero{
height:550px;
background:url("https://images.unsplash.com/photo-1559847844-5315695dadae") center/cover no-repeat;
}

.overlay{
background:rgba(0,0,0,0.55);
height:100%;
display:flex;
align-items:center;
}

.title{
font-size:40px;
font-weight:bold;
}

.sub{
font-size:18px;
}

.intro{
background:url("https://images.unsplash.com/photo-1552566626-52f8b828add9") center/cover no-repeat;
}

.intro-overlay{
background:rgba(0,0,0,0.6);
padding:90px 0;
}

.menu-section{
padding:80px 0;
}

.menu-card{
border-radius:18px;
overflow:hidden;
transition:0.3s;
}

.menu-card:hover{
transform:translateY(-8px);
box-shadow:0 15px 30px rgba(0,0,0,0.25);
}

.product-img{
height:200px;
object-fit:cover;
}

.price{
color:#d00000;
font-weight:bold;
font-size:18px;
margin-bottom:10px;
}

.promo-section{
padding:80px 0;
}

.promo-card{
background:#f1e7d0;
padding:40px;
border-radius:15px;
text-align:center;
transition:0.3s;
}

.promo-card:hover{
transform:translateY(-6px);
box-shadow:0 10px 20px rgba(0,0,0,0.25);
}

.badge-sale{
background:#d00000;
color:white;
padding:6px 12px;
border-radius:20px;
font-size:14px;
display:inline-block;
margin-bottom:10px;
}

.review-section{
padding:80px 0;
}

.review-title{
color:white;
font-weight:bold;
}

.star{
font-size:50px;
color:#ffc107;
}

.score{
color:white;
font-size:22px;
font-weight:bold;
}

.review-card{
background:#f1e7d0;
padding:35px;
border-radius:18px;
transition:0.3s;
}

.review-card:hover{
transform:translateY(-6px);
box-shadow:0 10px 25px rgba(0,0,0,0.3);
}

.avatar{
width:90px;
height:90px;
border-radius:50%;
object-fit:cover;
margin-bottom:15px;
border:4px solid white;
}

.review-btn{
background:#f1e7d0;
color:#a80000;
border:none;
padding:10px 25px;
border-radius:25px;
font-weight:600;
margin-top:10px;
}

.review-btn:hover{
background:white;
}

</style>