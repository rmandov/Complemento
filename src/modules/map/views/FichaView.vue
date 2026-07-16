<script setup>
import { RouterView, RouterLink } from 'vue-router'
import { ref } from 'vue'
import gsap from 'gsap'

// Configuración de los botones
const botones = [
  {
    to: '/fichas/test',
    img: new URL('../../../assets/img/img_circle.png', import.meta.url).href,
    label: 'Test',
  }
]

// Efecto magnético
const handleMouseMove = (e) => {
  const zone = e.currentTarget // .magnetic-zone
  const btn = zone.querySelector('.boton')
  const text = zone.querySelector('.boton-imgtxt')

  if (!btn || !text) return

  const rect = zone.getBoundingClientRect()

  const x = gsap.utils.mapRange(rect.left, rect.right, -rect.width / 2, rect.width / 2, e.clientX)

  const y = gsap.utils.mapRange(rect.top, rect.bottom, -rect.height / 2, rect.height / 2, e.clientY)

  // El botón se mueve suavemente
  gsap.to(btn, {
    x: x * 0.15,
    y: y * 0.15,
    duration: 0.4,
    ease: 'power2.out',
  })

  // El texto se mueve más para "rebotar" dentro del botón
  gsap.to(text, {
    x: x * 0.15,
    y: y * 0.15,
    duration: 0.5,
    ease: 'power2.out',
  })
}

const handleMouseLeave = (e) => {
  const zone = e.currentTarget
  const btn = zone.querySelector('.boton')
  const text = zone.querySelector('.boton-imgtxt')

  if (!btn || !text) return

  gsap.to([btn, text], {
    x: 0,
    y: 0,
    duration: 0.7,
    ease: 'elastic.out(1, 0.4)',
    overwrite: true,
  })
}

</script>
    
<template>
  <p>Soy una ficha</p>
  <p>hola</p>
  <section class="boton-section">
      <div
        v-for="(btn, index) in botones"
        :key="index"
        class="magnetic-zone"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <RouterLink class="boton" :to="btn.to">
          <div class="boton-contenido">
            <div class="boton-imgtxt">
              <img class="boton-imagen" :src="btn.img" :alt="btn.label" />
              <span class="boton-texto">{{ btn.label }}</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </section>
    <RouterView />
</template>

<style scoped>
.boton-section {
  display: flex;
  gap: 16rem;
  margin: 64px 0 64px 0;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.magnetic-zone {
  display: flex;
  justify-content: center;
  align-items: center;

  /* border: 1px dashed #ccc; */ /* Descomenta si quieres ver el área de captura */
}

.boton {
  flex: 1;
  min-width: 100%;
  display: flex;
  padding: 16px 38px 16px 40px;
  border-radius: 100px;
  text-decoration: none;
  color: inherit;
  /* ===== IMPORTANTE para el efecto magnético ===== */
  position: relative;
  overflow: hidden;
  will-change: transform;
  background-image: linear-gradient(
    144.02deg,
    /* rgb(10, 228, 72) 7.56%,
          rgb(171, 255, 132) 56.98% */ rgb(75, 95, 166),
    rgb(131, 202, 231)
  );
}

.boton-imgtxt {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 18px;
}
.boton-imgtxt {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.boton-contenido {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.boton-imagen {
  width: 40px;
  height: 40px;
  object-fit: cover;
  flex-shrink: 0;
  filter: brightness(1000);
  transform: translate(0, -2px);
}

.boton-texto {
  font-size: 1rem;
  /* ===== IMPORTANTE para que GSAP transforme el span ===== */
  display: inline-block;
  will-change: transform;
}

.boton-flecha {
  flex-shrink: 0;
}
p{
  width: 100%;
  height: 200px;
  background-color: aquamarine;
  flex: auto;
  text-align: center;
}
</style>