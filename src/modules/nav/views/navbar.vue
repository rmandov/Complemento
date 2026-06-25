<script setup>
import { RouterView, useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

// Determina si estamos en home
const isHome = computed(() => route.path === '/')

// Función de regreso inteligente
const goBackPage = () => {
  // Si no estamos en home, siempre regresamos a home
  if (!isHome.value) {
    router.push('/')
  }
}
</script>

<template>
  <nav>
    <!-- Solo muestra el botón si NO estamos en home -->
    <button v-if="!isHome" @click="goBackPage">Regresar</button>
    <span>Complementarios</span>
  </nav>
</template>

<style scoped>
nav {
  border: solid 1px purple;
  height: var(--nav-height);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
}

button {
  cursor: pointer;
  padding: 6px 12px;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 4px;
}

span {
  font-weight: 600;
}
</style>
