<script setup>
import { ref, onMounted } from 'vue'
import { useGeoJson } from '@/modules/map/composables/useGeoJson'

const { getGeoJson } = useGeoJson()
const cards = ref([])
const leyenda = ref('')

onMounted(async () => {
  const data = await getGeoJson('proyectos.json')

  if (data) {
    cards.value = data.cards
    leyenda.value = data.leyenda
  }
})
</script>

<template>
  <div class="cards">
    <div v-for="card in cards" :key="card.id" :class="['card', `card--${card.id}`]">
      <span class="card-valor">
        {{ card.valor }}
      </span>
      <p class="card-titulo">
        {{ card.titulo }}
      </p>
    </div>
  </div>
  <p class="cards-leyenda">
    {{ leyenda }}
  </p>
</template>

<style scoped>
.cards {
  display: flex;
  flex-direction: column;
  align-items: self-end;
  gap: 16px;
  padding: 20px;
  min-width: 180px;
}

.card {
  padding: 16px;
  border: 1px solid #2d2deb;
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  /* Por defecto: columna (cards 2, 3, etc.) */
  align-items: center;
  text-align: center;
}

.card-titulo {
  margin: 8px 0 0;
  /* Margen arriba para separar del valor en columna */
}

.card-valor {
  font-size: 2rem;
  font-weight: 700;
}

.cards-leyenda {
  font-size: 0.875rem;
  color: #000000;
  margin-top: 12px;
  text-align: center;
}

/* ─── Card 1 en fila (row) ─── */
.card--1 {
  flex-direction: row;
  /* Valor y título en línea horizontal */
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 200px;
}

.card--1 .card-titulo {
  margin: 0;
  /* Sin margen vertical en modo fila */
}

/* ─── Tamaños individuales ─── */
.card--2 {
  width: 120px;
}

.card--3 {
  width: 120px;
}

@media (max-width: 768px) {
  .cards {
    flex-direction: column;
    box-shadow: none;
    padding: 0;
    background-color: transparent;
    align-items: stretch;
  }

  .card,
  .card--1 {
    width: 100% !important;
    flex-direction: row;
    /* En móvil todas en fila para aprovechar el ancho */
    justify-content: space-between;
    gap: 12px;
  }

  .card .card-titulo,
  .card--1 .card-titulo {
    margin: 0;
  }
}
</style>
