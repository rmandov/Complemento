<template>
  <nav class="navbar" @mouseleave="closeMenuDelayed">
    <div class="navbar-container">
      <!-- Logo -->
      <a href="/" class="navbar-logo">
        <span>Presupuesto</span>
      </a>

      <!-- Menú principal -->
      <ul class="navbar-menu">
        <li
          v-for="item in menuItems"
          :key="item.id"
          class="navbar-item"
          :class="{ 'has-dropdown': item.children && item.children.length > 0 }"
          @mouseenter="handleMouseEnter(item)"
        >
          <a :href="item.href" class="navbar-link">
            {{ item.label }}
            <span v-if="item.children && item.children.length" class="arrow">▾</span>
          </a>
        </li>
      </ul>
    </div>

    <!-- Dropdown Mega Menú -->
    <Transition name="fade">
      <div
        v-if="activeItem && activeItem.children && activeItem.children.length"
        class="mega-menu"
        @mouseenter="cancelClose"
        @mouseleave="closeMenuDelayed"
      >
        <div class="mega-menu-container">
          <!-- Columna 1: Sub-elementos -->
          <div class="column column-main">
            <h3 class="column-title">{{ activeItem.label }}</h3>
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
                  <span v-if="sub.children && sub.children.length" class="sub-arrow">→</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- Columna 2: Detalles / Sub-sub-elementos -->
          <div class="column column-detail">
            <template v-if="activeSubItem">
              <!-- Si tiene hijos: mostrar enlaces relacionados -->
              <div v-if="activeSubItem.children && activeSubItem.children.length" class="detail-children">
                <h4 class="detail-title">{{ activeSubItem.label }}</h4>
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

              <!-- Si NO tiene hijos: mostrar descripción + enlace principal -->
              <div v-else class="detail-empty">
                <h4 class="detail-title">{{ activeSubItem.label }}</h4>
                <p class="detail-desc">{{ activeSubItem.description || 'Sección informativa.' }}</p>
                <a :href="activeSubItem.href" class="detail-cta">
                  Ir a {{ activeSubItem.label }} →
                </a>
              </div>
            </template>

            <!-- Estado inicial: mensaje por defecto -->
            <div v-else class="detail-placeholder">
              <p>Selecciona una opción para ver más detalles.</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import menuData from './menuData.json'

const menuItems = ref(menuData)

const activeItem = ref(null)
const activeSubItem = ref(null)
let closeTimeout = null

const handleMouseEnter = (item) => {
  cancelClose()
  if (item.children && item.children.length > 0) {
    activeItem.value = item
    // Auto-seleccionar el primer sub-elemento al abrir
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
  }, 200) // 200ms de tolerancia para mover el mouse al dropdown
}

const cancelClose = () => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
}
</script>

<style scoped>
/* ===== Layout Principal ===== */
.navbar {
  position: relative;
  background: #1a365d;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.navbar-logo {
  color: #fff;
  font-size: 1.25rem;
  font-weight: 700;
  text-decoration: none;
}

.navbar-menu {
  display: flex;
  list-style: none;
  gap: 0.5rem;
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
  padding: 0.75rem 1rem;
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.navbar-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.arrow {
  font-size: 0.7rem;
  opacity: 0.7;
}

/* ===== Mega Menú ===== */
.mega-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: #fff;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-top: 3px solid #3b82f6;
  z-index: 1000;
}

.mega-menu-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 320px 1fr;
  min-height: 380px;
}

/* ===== Columna 1 ===== */
.column-main {
  background: #f8fafc;
  padding: 1.5rem;
  border-right: 1px solid #e2e8f0;
}

.column-title {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin: 0 0 1rem 0;
  font-weight: 600;
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
  border-radius: 6px;
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
  color: #334155;
  text-decoration: none;
  font-weight: 500;
  border-radius: 6px;
}

.submenu-link:hover {
  color: #1e40af;
}

.sub-arrow {
  font-size: 0.85rem;
  color: #94a3b8;
}

/* ===== Columna 2 ===== */
.column-detail {
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.detail-children,
.detail-empty,
.detail-placeholder {
  animation: fadeIn 0.2s ease;
}

.detail-title {
  font-size: 1.25rem;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
  font-weight: 700;
}

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
  background: #1a365d;
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

/* ===== Transiciones ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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
</style>