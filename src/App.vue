<script setup>
import { RouterView, useRouter } from 'vue-router'
import Navbar from './modules/nav/views/navbar_ciclo.vue'
import logoImg from '@/assets/img/logo.png'
import footer from './modules/footer/views/footer.vue';
import Footer from './modules/footer/views/footer.vue';
</script>

<template>
  <Navbar
    :logoSrc="logoImg"
    logoAlt="Logo Gobierno"
    logoHref="https://www.transparenciapresupuestaria.gob.mx/"
    :breakpoint="768"
  ></Navbar>
  <RouterView />
  <Footer></Footer>
</template>

<style scoped></style>
