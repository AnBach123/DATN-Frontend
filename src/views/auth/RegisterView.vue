<script setup lang="ts">
import router from '@/router';
import { callRegister } from '@/services/authApi';
import Swal from 'sweetalert2';
import { ref } from 'vue';

const fullName = ref('')
const email = ref('')
const password = ref('')
const phoneNumber = ref('')
const dateOfBirth = ref('')
const loading = ref(false)
const msg = ref('')

async function onSubmit() {
    loading.value = true
    msg.value = ''

    try {
        const res = await callRegister({
            fullName: fullName.value.trim(),
            email: email.value.trim(),
            password: password.value,
            phoneNumber: phoneNumber.value,
            dateOfBirth: dateOfBirth.value,
        })

        await Swal.fire({
            icon: 'success',
            title: 'Đăng ký thành công',
            text:`Tài khoản: ${res.data.email}`,
            timer: 1300,
            timerProgressBar: true,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
        })

        await router.push('/auth/login')
    } catch (e: any) {
        await Swal.fire({
            icon: 'error',
            title: 'Đăng ký thất bại',
            text: e?.message || 'Có lỗi xảy ra',
        })
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <main class="auth-layout">
        <section class="auth-card">
            <h2>Đăng ký</h2>
            
            <form @submit.prevent="onSubmit" class="auth-form">
                <label>Họ và tên</label>
                <input v-model="fullName" type="text" required/>

                <label>Email</label>
                <input v-model="email" type="email" required/>

                <label>Mật khẩu</label>
                <input v-model="password" type="password" required/>

                 <label>Số điện thoại</label>
                <input v-model="phoneNumber" type="text" />

                <label>Ngày sinh</label>
                <input v-model="dateOfBirth" type="date" />

                <button :disabled="loading">{{ loading ? 'Đang xử lý...': 'Đăng ký' }}</button>
            </form>

            <p class="switch">
                Đã có tài khoản?
                <RouterLink to="/auth/login">Đăng nhập</RouterLink>
            </p>

            <p class="message">{{ msg }}</p>
        </section>
    </main>
</template>
