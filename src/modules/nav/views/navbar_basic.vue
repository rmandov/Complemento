<script setup>
import { useRouter, useRoute } from 'vue-router'
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
  <nav class="sticky top-0 z-20 bg-[#f5f5f5] shadow-sm">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 md:!pl-16">
      <!-- Solo muestra el botón si NO estamos en home -->
      <button v-if="!isHome" @click="goBackPage">Regresar</button>
      <div class="contenedor">
        <span>Complementarios</span>
        <div class="group flex h-full items-center">
          <button
            @click="show = !show"
            class="flex h-full items-center px-2 text-lg font-bold text-[#9055a2] transition-all duration-200 group-hover:scale-105 group-hover:bg-[#9055a2] group-hover:px-4 group-hover:text-white"
          >
            Ingreso
          </button>
          <div
            class="invisible absolute top-[62px] z-50 flex w-[200px] flex-col bg-transparent opacity-0 transition-all group-hover:visible group-hover:opacity-100"
          >
            <a
              href="/Ingresos-Federales"
              class="mb-1 flex h-12 items-center bg-[#9055a2] px-2 text-lg font-bold text-white transition-colors hover:bg-white hover:text-[#9055a2]"
            >
              <p>Ingresos federales</p>
            </a>
            <a
              href="/Recaudacion-Local"
              class="mb-1 flex h-12 items-center bg-[#7a4a8c] px-2 text-lg font-bold text-white transition-colors hover:bg-white hover:text-[#7a4a8c]"
            >
              <p>Recaudación local</p>
            </a>
          </div>
        </div>
        <div>Datos Abiertos</div>
        <div>Capacitación</div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav {
  font-family: 'Patria';
}

button {
  cursor: pointer;
  padding: 6px 12px;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 4px;
}

.contenedor {
  display: flex;
  gap: 16px;
}

span {
  font-weight: 600;
}
</style>
