<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import BookingModal from '@/components/reservation/BookingModal.vue'
import BookingModalCustom from '@/components/reservation/BookingModalCustom.vue'
import ChatWidget from '@/components/ChatWidget.vue'
</script>

<template>

<Navbar/>

<router-view/>

<Footer/>

<BookingModal/>
<BookingModalCustom/>
<ChatWidget/>

</template>
