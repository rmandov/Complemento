<script setup>
import { RouterView } from 'vue-router'
import Navbar from './modules/nav/views/navbar_ciclo.vue'
import logoImg from '@/assets/img/logo.png'
import Footer from './modules/footer/views/footer.vue'
</script>

<template>
  <main class="flex flex-col min-h-dvh">
    <Navbar :logoSrc="logoImg"></Navbar>
    <!-- <Navbar
    :logoSrc="logoImg"
    logoAlt="Logo Gobierno"
    logoHref="https://www.transparenciapresupuestaria.gob.mx/"
    :breakpoint="768"
  ></Navbar> -->
    <div class="flex-1">
      <RouterView />

    </div>
    <Footer></Footer>
  </main>
</template>

<style scoped></style>
