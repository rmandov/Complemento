<script setup>
import { RouterView, useRouter } from 'vue-router'
import Navbar from './modules/nav/views/navbar.vue'
</script>

<template>
  <Navbar></Navbar>
  <RouterView />
</template>

<style scoped></style>
