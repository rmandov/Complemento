<script setup>
import { RouterView, useRouter } from 'vue-router'
import Navbar from './modules/nav/views/navbar_ciclo.vue'
import navbar_basic from './modules/nav/views/navbar.vue'
import logoImg from '@/assets/img/logo.png'
import Footer from './modules/footer/views/footer.vue'
</script>

<template>
  <navbar_basic :logoSrc="logoImg"></navbar_basic>
  <!-- <Navbar
    :logoSrc="logoImg"
    logoAlt="Logo Gobierno"
    logoHref="https://www.transparenciapresupuestaria.gob.mx/"
    :breakpoint="768"
  ></Navbar> -->
  <RouterView />
  <Footer></Footer>
</template>

<style scoped></style>
