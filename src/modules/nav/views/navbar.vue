<template>
  <nav class="navbar" @mouseleave="closeMenuDelayed">
    <div class="navbar-container">
      <!-- Logo como imagen -->

      <a :href="logoHref" class="navbar-logo">
        <img :src="logoSrc" :alt="logoAlt" class="logo-img" @error="handleLogoError" />
      </a>

      <breadcrumb></breadcrumb>

      <!-- Botón hamburguesa (solo móvil) -->
      <button
        class="hamburger-btn"
        :class="{ open: mobileOpen }"
        @click="toggleMobile"
        aria-label="Abrir menú"
        aria-expanded="mobileOpen"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

      <!-- Menú principal (desktop) -->
      <ul class="navbar-menu desktop-only">
        <li
          v-for="item in menuItems"
          :key="item.id"
          class="navbar-item"
          :class="{ 'has-dropdown': item.children && item.children.length > 0 }"
          @mouseenter="handleMouseEnter(item)"
        >
          <a :href="item.href" class="navbar-link">
            {{ item.label }}
          </a>
        </li>
      </ul>
    </div>

    <!-- Dropdown Mega Menú (desktop) -->
    <Transition name="fade">
      <div
        v-if="activeItem && activeItem.children && activeItem.children.length && !isMobile"
        class="mega-menu"
        @mouseenter="cancelClose"
        @mouseleave="closeMenuDelayed"
      >
        <div class="mega-menu-container">
          <!-- Columna 1: Sub-elementos -->
          <div class="column column-main">
            <!-- <h3 class="column-title">{{ activeItem.label }}</h3> -->
            <ul class="submenu-list">
              <li
                v-for="sub in activeItem.children"
                :key="sub.id"
                class="submenu-item"
                :class="{ active: activeSubItem?.id === sub.id }"
                @mouseenter="handleSubMouseEnter(sub)"
              >
                <a
                  :href="sub.href"
                  class="submenu-link"
                  :class="{ 'has-children': sub.children && sub.children.length }"
                >
                  <span class="submenu-label">{{ sub.label }}</span>
                  <!-- <span v-if="sub.children && sub.children.length" class="sub-arrow">→</span> -->
                </a>
              </li>
            </ul>
          </div>

          <!-- Columna 2: Detalles / Sub-sub-elementos -->
          <div class="column column-detail">
            <template v-if="activeSubItem">
              <div
                v-if="activeSubItem.children && activeSubItem.children.length"
                class="detail-children"
              >
                <!-- SE ENCUENTRA COMENTADO EL TÍTULO -->

                <!-- <h4 class="detail-title">{{ activeSubItem.label }}</h4> -->
                <p class="detail-desc">{{ activeSubItem.description }}</p>
                <ul class="detail-list">
                  <li v-for="child in activeSubItem.children" :key="child.id" class="detail-item">
                    <a :href="child.href" class="detail-link">
                      <span class="detail-dot"></span>
                      {{ child.label }}
                    </a>
                  </li>
                </ul>
              </div>
              <div v-else class="detail-empty">
                <!-- SE ENCUENTRA COMENTADO EL TÍTULO  -->

                <!-- <h4 class="detail-title">{{ activeSubItem.label }}</h4> -->
                <p class="detail-desc">{{ activeSubItem.description || 'Sección informativa.' }}</p>
                <a :href="activeSubItem.href" class="detail-cta">
                  Ir a {{ activeSubItem.label }}
                </a>
              </div>
            </template>
            <div v-else class="detail-placeholder">
              <p>Selecciona una opción para ver más detalles.</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Menú móvil (overlay) -->
    <Transition name="slide">
      <div v-if="mobileOpen && isMobile" class="mobile-menu" @click.self="closeMobile">
        <div class="mobile-menu-panel">
          <div class="mobile-header">
            <span class="mobile-title">Menú</span>
            <button class="mobile-close" @click="closeMobile" aria-label="Cerrar menú">✕</button>
          </div>

          <ul class="mobile-list">
            <li v-for="item in menuItems" :key="item.id" class="mobile-item">
              <!-- Sin hijos -->
              <a
                v-if="!item.children || !item.children.length"
                :href="item.href"
                class="mobile-link"
                @click="closeMobile"
              >
                {{ item.label }}
              </a>

              <!-- Con hijos: acordeón -->
              <div v-else class="mobile-accordion">
                <button
                  class="mobile-accordion-btn"
                  :class="{ open: openAccordion === item.id }"
                  @click="toggleAccordion(item.id)"
                >
                  {{ item.label }}
                  <span class="mobile-arrow">▾</span>
                </button>

                <Transition name="expand">
                  <div v-if="openAccordion === item.id" class="mobile-accordion-body">
                    <div v-for="sub in item.children" :key="sub.id" class="mobile-sub-section">
                      <a :href="sub.href" class="mobile-sub-link" @click="closeMobile">
                        {{ sub.label }}
                      </a>

                      <!-- Sub-sub elementos -->
                      <ul v-if="sub.children && sub.children.length" class="mobile-grand-list">
                        <li v-for="child in sub.children" :key="child.id">
                          <a :href="child.href" class="mobile-grand-link" @click="closeMobile">
                            {{ child.label }}
                          </a>
                        </li>
                      </ul>

                      <!-- Descripción si no tiene hijos -->
                      <p v-else-if="sub.description" class="mobile-sub-desc">
                        {{ sub.description }}
                      </p>
                    </div>
                  </div>
                </Transition>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import menuData from './menuData.json'
import breadcrumb from '../components/breadcrumb.vue'

// ===== Props =====
const props = defineProps({
  logoSrc: {
    type: String,
    default: '/logo.png',
  },
  logoAlt: {
    type: String,
    default: 'Logo',
  },
  logoHref: {
    type: String,
    default: '/',
  },
  breakpoint: {
    type: Number,
    default: 768,
  },
})

// ===== Estado =====
const menuItems = ref(menuData)
const activeItem = ref(null)
const activeSubItem = ref(null)
const mobileOpen = ref(false)
const openAccordion = ref(null)
const isMobile = ref(false)
let closeTimeout = null

// ===== Métodos Desktop =====
const handleMouseEnter = (item) => {
  cancelClose()
  if (item.children && item.children.length > 0) {
    activeItem.value = item
    activeSubItem.value = item.children[0]
  } else {
    activeItem.value = null
    activeSubItem.value = null
  }
}

const handleSubMouseEnter = (sub) => {
  activeSubItem.value = sub
}

const closeMenuDelayed = () => {
  closeTimeout = setTimeout(() => {
    activeItem.value = null
    activeSubItem.value = null
  }, 200)
}

const cancelClose = () => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
}

// ===== Métodos Móvil =====
const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value
  if (mobileOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
    openAccordion.value = null
  }
}

const closeMobile = () => {
  mobileOpen.value = false
  document.body.style.overflow = ''
  openAccordion.value = null
}

const toggleAccordion = (id) => {
  openAccordion.value = openAccordion.value === id ? null : id
}

// ===== Responsive =====
const checkMobile = () => {
  isMobile.value = window.innerWidth < props.breakpoint
  if (!isMobile.value) {
    closeMobile()
  }
}

const handleLogoError = (e) => {
  // Fallback: si la imagen falla, muestra texto
  e.target.style.display = 'none'
  const fallback = document.createElement('span')
  fallback.textContent = props.logoAlt
  fallback.style.color = '#fff'
  fallback.style.fontWeight = '700'
  fallback.style.fontSize = '1.25rem'
  e.target.parentNode.appendChild(fallback)
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* =============================
   NAVBAR PRINCIPAL
   ============================= */
.navbar {
  position: relative;
  background: #f5f5f5;
  font-family: 'NotoSans';
}

.navbar-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
}

/* ===== Logo ===== */
.navbar-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-img {
  height: 28px;
  width: auto;
  max-width: 180px;
  object-fit: contain;
  transition: opacity 0.2s ease;
}

.logo-img:hover {
  opacity: 0.85;
}

/* ===== Menú Desktop ===== */
.navbar-menu {
  display: flex;
  list-style: none;
  gap: 1rem;
  margin: 0;
  padding: 0;
}

.navbar-item {
  position: relative;
}

.navbar-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1rem 0.5rem;
  color: #575757;
  text-decoration: none;
  font-size: 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.navbar-link:hover,
.navbar-link:active {
  color: #000000;
  background: rgba(180, 180, 180, 0.904);
}

/* =============================
   HAMBURGUESA
   ============================= */
.hamburger-btn {
  display: none;
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
}

.hamburger-line {
  display: block;
  width: 24px;
  height: 2px;
  background: #fff;
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

/* =============================
   MEGA MENÚ (Desktop)
   ============================= */
.mega-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 700px;
  background: rgba(255, 255, 255);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  border-radius: 0 0 12px 12px;
}

.mega-menu-container {
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 380px;
  padding: 0;
}

/* Columna 1 */
.column-main {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 0 0 0 12px;
  /* border-right: 1px solid #e2e8f0; */
}

.column-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  margin: 0 0 1rem 0;
}

.submenu-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.submenu-item {
  border-radius: 12px;
  transition: background 0.15s ease;
}

.submenu-item.active {
  background: #e0e7ff;
}

.submenu-item:hover:not(.active) {
  background: #e2e8f0;
}

.submenu-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  color: #000000;
  text-decoration: none;
  font-weight: 500;
  border-radius: 12px;
  font-size: 0.95rem;
}

.submenu-item.active .submenu-link {
  font-weight: 700;
}

.sub-arrow {
  font-size: 0.85rem;
  color: #94a3b8;
}

/* Columna 2 */
.column-detail {
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.detail-children,
.detail-empty,
.detail-placeholder {
  animation: fadeIn 0.25s ease;
}
/* Título */
.detail-title {
  font-size: 1.25rem;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  font-weight: 700;
}
/* Descripcion */
.detail-desc {
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
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
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f1f5f9;
  color: #000000;
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

/* Puntos del enlistado */

/* .detail-dot {
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
  flex-shrink: 0;
} */

.detail-link:hover .detail-dot {
  background: #fff;
}

.detail-cta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f1f5f9;
  color: #000000;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  width: 100%;
  transition: all 0.2s ease;
}

.detail-cta:hover {
  background: #3b82f6;
  color: #fff;
  transform: translateX(4px);
}

.detail-placeholder {
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-style: italic;
}

/* =============================
   MENÚ MÓVIL (Overlay)
   ============================= */
.mobile-menu {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1050;
  display: flex;
  justify-content: flex-end;
}

.mobile-menu-panel {
  width: 85%;
  max-width: 360px;
  height: 100%;
  background: #fff;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
}

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #1a365d;
}

.mobile-title {
  color: #fff;
  font-weight: 600;
  font-size: 1.1rem;
}

.mobile-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.mobile-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mobile-item {
  border-bottom: 1px solid #f1f5f9;
}

.mobile-link {
  display: block;
  padding: 1rem 1.5rem;
  color: #334155;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  transition: background 0.15s ease;
}

.mobile-link:hover,
.mobile-link:active {
  background: #f8fafc;
  color: #1e40af;
}

/* Acordeón móvil */
.mobile-accordion-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  color: #334155;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.15s ease;
}

.mobile-accordion-btn:hover {
  background: #f8fafc;
}

.mobile-accordion-btn.open {
  background: #eff6ff;
  color: #1e40af;
}

.mobile-arrow {
  font-size: 0.75rem;
  transition: transform 0.2s ease;
  color: #94a3b8;
}

.mobile-accordion-btn.open .mobile-arrow {
  transform: rotate(180deg);
  color: #1e40af;
}

.mobile-accordion-body {
  background: #f8fafc;
  overflow: hidden;
}

.mobile-sub-section {
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.mobile-sub-section:last-child {
  border-bottom: none;
}

.mobile-sub-link {
  display: block;
  color: #1e40af;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.5rem 0;
}

.mobile-grand-list {
  list-style: none;
  margin: 0.25rem 0 0 0;
  padding: 0 0 0 1rem;
  border-left: 2px solid #cbd5e1;
}

.mobile-grand-link {
  display: block;
  padding: 0.5rem 0;
  color: #475569;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.15s ease;
}

.mobile-grand-link:hover {
  color: #1e40af;
}

.mobile-sub-desc {
  margin: 0.5rem 0 0 0;
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.5;
  font-style: italic;
}

/* =============================
   TRANSICIONES
   ============================= */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}

.slide-enter-active .mobile-menu-panel,
.slide-leave-active .mobile-menu-panel {
  transition: transform 0.3s ease;
}

.slide-enter-from .mobile-menu-panel,
.slide-leave-to .mobile-menu-panel {
  transform: translateX(100%);
}

.expand-enter-active,
.expand-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
  max-height: 800px;
  opacity: 1;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =============================
   RESPONSIVE
   ============================= */
@media (max-width: 767px) {
  .desktop-only {
    display: none;
  }

  .hamburger-btn {
    display: flex;
  }

  .navbar-container {
    height: 56px;
    padding: 0 1rem;
  }

  .logo-img {
    height: 32px;
  }
}

@media (min-width: 768px) {
  .mobile-menu {
    display: none;
  }
}
</style>
