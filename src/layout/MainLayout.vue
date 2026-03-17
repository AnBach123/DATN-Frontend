<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import BookingModal from '@/components/reservation/BookingModal.vue'
</script>

<template>

<Navbar/>

<router-view/>

<Footer/>

<BookingModal/>

</template>
