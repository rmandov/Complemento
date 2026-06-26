<script setup>
import { RouterView, useRouter } from 'vue-router'
import Navbar from './modules/nav/views/navbar.vue'
import logoImg from '@/assets/img/logo.png'
</script>

<template>
  <Navbar
    :logoSrc="logoImg"
    logoAlt="Logo Gobierno"
    logoHref="https://www.transparenciapresupuestaria.gob.mx/"
    :breakpoint="768"
  ></Navbar>
  <RouterView />
</template>

<style scoped></style>
