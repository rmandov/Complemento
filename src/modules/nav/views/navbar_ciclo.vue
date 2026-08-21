<script setup lang="ts">
//@ts-ignore
import logoImg from '@/assets/img/logo.png'
import { onMounted, onUnmounted, ref } from 'vue'
import breadcrumb from '../components/breadcrumb.vue'
export interface MenuItem {
  id: number
  label: string
  texto: string
  href: string
  description?: string
  children?: MenuItem[]
}

const menu = ref<MenuItem[] | null>(null)
const itemActivo = ref<number | null>(null)
//@ts-ignore
const urlBase = import.meta.env.BASE_URL

const obtenerNav = async () => {
  try {
    const response = await fetch(urlBase + 'nav.json')
    menu.value = await response.json()
    /* console.log(menu.value) */
  } catch (error) {
    console.log(error)
  }
}
const handleClickItem = (id: number) => {
  if (id === itemActivo.value) {
    itemActivo.value = null
    return
  }
  itemActivo.value = id
}
const leaveMouse = () => {
  itemActivo.value = null
}
const enterMouse = (id: number, event: PointerEvent) => {
  if (event.pointerType !== 'mouse') return

  itemActivo.value = id
}

const menuAbierto = ref<boolean>(false)
const handleAbrirMenu = () => {
  menuAbierto.value = !menuAbierto.value
  itemActivo.value = null
}
const handleResize = () => {
  menuAbierto.value = false
}
onMounted(() => {
  obtenerNav()
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
<template>
  <header class="navbar shadow-sm">
    <div class="flex items-center justify-center lg:justify-start flex-1">
      <a href="https://www.transparenciapresupuestaria.gob.mx/" class="navbar-logo">
        <img :src="logoImg" alt="Logo Gobierno" class="logo-img" />
      </a>
      <breadcrumb></breadcrumb>
    </div>
    <!-- Botón hamburguesa (solo móvil) -->
    <button
      class="flex lg:hidden hamburger-btn"
      aria-label="Abrir menú"
      @click="handleAbrirMenu"
      :class="{ open: menuAbierto }"
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
    <nav class="nav-contenedor" :class="{ open: menuAbierto }">
      <ul class="nav">
        <li
          v-for="item in menu"
          :key="item.id"
          class="nav-item"
          :class="{ 'nav-item-boton': item.children?.length }"
        >
          <div v-if="item.children?.length" class="flex flex-col lg:flex-row gap-2 w-full">
            <div class="flex items-center">{{ item.label }}</div>
            <nav v-if="item.children" class="subnav-contenedor">
              <ul class="subnav">
                <li
                  v-for="(subitem, idx) in item.children"
                  :key="subitem.id"
                  class="subnav-item"
                  @mouseleave="leaveMouse"
                >
                  <button
                    type="button"
                    class="subnav-boton"
                    :class="{ 'subnav-boton-activo': itemActivo === subitem.id }"
                    @click="handleClickItem(subitem.id)"
                    :style="{ '--color-borde-btn': subitem.texto }"
                  >
                    <span style="flex: 1">{{ idx + 1 }}</span>

                    <div
                      class="etiqueta-conenedor"
                      :class="{ 'subnav-activo': itemActivo === subitem.id }"
                      :style="{ '--etiqueta-tam': subitem.label.length }"
                    >
                      {{ subitem.label }}
                    </div>
                  </button>

                  <div
                    class="submenu-contenedor"
                    :class="{ 'subnav-activo': itemActivo === subitem.id }"
                  >
                    <p v-html="subitem.description" class="submenu-descripcion"></p>
                    <ul class="detail-list" v-if="subitem.children?.length">
                      <li v-for="submenu in subitem.children" :key="submenu.id" class="detail-item">
                        <a :href="submenu.href" target="_blank" class="detail-link">
                          <span class="detail-dot"></span>

                          {{ submenu.label }}</a
                        >
                      </li>
                    </ul>
                    <a v-else :href="subitem.href" class="detail-cta">
                      Ir a {{ subitem.label }} →
                    </a>
                  </div>
                </li>
              </ul>
            </nav>
          </div>
          <a v-else target="_blank" :href="item.href" class="nav-boton">{{ item.label }} </a>
        </li>
      </ul>
    </nav>
  </header>
</template>
<style scoped>
@supports (backdrop-filter: blur(10px)) {
  .subnav-boton {
    backdrop-filter: blur(10px);
  }
}
.navbar {
  display: flex;
  flex-direction: column;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: #fff;
  border-bottom: 1px solid #f1f5f9;
  --color-borde-activo: #1a365d;
  --sombra-boton-nav: none; /* 0 1px 3px rgba(0, 0, 0, 0.15), inset 0 4px 30px rgba(255, 255, 255, 0.1); */
  --sombra-boton-nav-hover: 0 2px 3px rgba(0, 0, 0, 0.15);
  --color-borde-boton: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}
.nav-contenedor {
  max-height: 0px;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  padding: 0 1rem;
}
.nav-contenedor.open {
  max-height: 100dvh;
  overflow: auto;
  height: 100dvh;
}
.nav {
  display: flex;
  gap: 0.5rem;
  flex-direction: column;
}
.nav-item {
  border-radius: 999px;
  padding: 0 0.5rem;
  display: flex;
  gap: 0.5rem;
}
.nav-item-boton {
  box-shadow: var(--sombra-boton-nav);
  border: 1px solid var(--color-borde-boton);
  border-radius: 12px;
}

.subnav {
  display: flex;
  align-items: start;
  gap: 0.5rem;
  flex-direction: column;
}

.subnav-item {
  position: relative;
  flex: 0 0 auto;
  width: auto;
}
.subnav-boton.subnav-boton-activo::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;

  /* mismo ancho que el submenú */
  width: 100%;

  /* alto máximo del submenú */
  height: 100%;

  background: transparent;
}

.subnav-boton {
  display: flex;
  align-items: center;
  gap: 0;

  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;

  border-radius: 999px;
  cursor: pointer;

  box-shadow: var(--sombra-boton-nav);

  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  transition:
    transform 0.3s ease-in-out,
    border-radius 0.3s ease-in-out,
    box-shadow 0.3s ease-in-out,
    border-color 0.3s ease-in-out,
    border 0.3s ease-in-out;
  border: 3px solid var(--color-borde-btn, --color-borde-boton);
}

.subnav-boton:hover,
.subnav-boton-activo {
  transform: scaleY(1.1);
  border-color: var(--color-borde-activo);
  box-shadow: var(--sombra-boton-nav-hover);
}
.subnav-boton-activo {
  gap: 0.5rem;
}

.submenu-contenedor {
  position: absolute;
  top: 0;
  left: 100%;
  min-width: 50dvw;
  max-width: 20rem;
  max-height: 0;

  overflow: hidden;

  border: 0 solid transparent;

  transition:
    max-height 0.3s ease-in-out,
    border-color 0.3s ease-in-out;
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
  opacity: 0;
  pointer-events: none;
  border-radius: 0 0 12px 12px;
  background-color: white;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.submenu-contenedor.subnav-activo {
  max-height: 50dvh;
  opacity: 1;
  pointer-events: all;
}

.etiqueta-conenedor {
  overflow: hidden;
  white-space: nowrap;
  margin-left: 0.5rem;
  max-width: none;
  opacity: 1;

  transition:
    max-width 0.3s ease-in-out,
    opacity 0.3s ease-in-out;
}

.etiqueta-conenedor.subnav-activo {
  max-width: calc(var(--etiqueta-tam) * 1ch);
  opacity: 1;
}
.submenu-descripcion {
  text-align: justify;
  color: #64748b;
  margin-bottom: 1rem;
}
.detail-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.detail-item {
  display: flex;
}

.detail-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f1f5f9;
  color: #334155;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  width: 100%;
  transition: all 0.2s ease;
}

.detail-link:hover {
  background: #3b82f6;
  color: #fff;
  transform: translateX(4px);
}

.detail-dot {
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
  flex-shrink: 0;
}

.detail-link:hover .detail-dot {
  background: #fff;
}
.detail-cta {
  display: inline-flex;
  align-self: flex-start;
  margin-top: auto;
  padding: 0.875rem 1.5rem;
  background: var(--color-borde-activo);
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: background 0.2s ease;
}

.detail-cta:hover {
  background: #3b82f6;
}

.detail-placeholder {
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-style: italic;
}
.nav-boton {
  display: flex;
  align-items: center;

  height: 2rem;
  padding: 3px 0.5rem;

  border-radius: 999px;
  cursor: pointer;

  background: rgba(255, 255, 255, 0.3);
  box-shadow: var(--sombra-boton-nav);
  border: 3px solid var(--color-borde-boton);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  transition:
    transform 0.3s ease-in-out,
    border-radius 0.3s ease-in-out,
    box-shadow 0.3s ease-in-out,
    border-color 0.3s ease-in-out;
}
.nav-boton:hover {
  transform: scaleY(1.1);
  border-color: var(--color-borde-activo);
  box-shadow: var(--sombra-boton-nav-hover);
}
.logo-img {
  height: 40px;
  width: auto;
  max-width: 180px;
  object-fit: contain;
  transition: opacity 0.2s ease;
}

.logo-img:hover {
  opacity: 0.85;
}
@media (min-width: 1024px) {
  .nav-contenedor {
    max-height: none;
    overflow: visible;
    padding: 0;
  }
  .navbar {
    padding: 0.5rem 10dvw;
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
  }
  .nav-contenedor.open {
    max-height: none;
    overflow: visible;
    min-height: none;
  }
  .nav {
    flex-direction: row;
  }
  .subnav {
    flex-direction: row;
  }
  .nav-item-boton {
    border-radius: 999px;
  }
  .subnav {
    align-items: center;
  }
  .subnav-item {
    width: auto;
  }
  .submenu-contenedor {
    top: calc(100% + 1rem);
    left: 0;
    min-width: 20rem;
  }
  .etiqueta-conenedor {
    overflow: hidden;
    white-space: nowrap;

    max-width: 0;
    opacity: 0;
    margin-left: 0;
  }
}
.hamburger-btn {
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  cursor: pointer;
  gap: 5px;
  padding: 0;
  z-index: 1100;
  position: absolute;
  right: 0.5rem;
  cursor: pointer;
}

.hamburger-line {
  display: block;
  width: 24px;
  height: 2px;
  background: #000;
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.hamburger-btn.open .hamburger-line:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger-btn.open .hamburger-line:nth-child(2) {
  opacity: 0;
}

.hamburger-btn.open .hamburger-line:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}
</style>
