<script setup>
import { ref, onMounted, computed } from 'vue'
import { useGeoJson } from '@/modules/map/composables/useGeoJson'
import NumberWheel from '@/modules/home/animations/NumberWheel.vue' // ajusta la ruta a tu estructura

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

const mainCard = computed(() => cards.value[0])
const groupedCards = computed(() => cards.value.slice(1))

function fluidFontSize(value, fallbackRem) {
  const max = value || `${fallbackRem}rem`
  return `clamp(${fallbackRem * 0.7}rem, 3vw, ${max})`
}
</script>

<template>
  <div class="cards">
    <!-- Card 1: valor total, en fila -->
    <div v-if="mainCard" :class="['card', 'card--main', `card--${mainCard.id}`]">
      <span class="card-valor" :style="{ fontSize: fluidFontSize(mainCard.fontSizeValor, 2) }">
        <NumberWheel :value="mainCard.valor" :line-height-ratio="1.1" />
      </span>
      <p class="card-titulo" :style="{ fontSize: fluidFontSize(mainCard.fontSizeTitulo, 1) }">
        {{ mainCard.titulo }}
      </p>
    </div>

    <!-- Cards 2, 3... agrupadas verticalmente -->
    <div v-if="groupedCards.length" class="card card--group">
      <div v-for="card in groupedCards" :key="card.id" class="card-group-item">
        <span class="card-valor" :style="{ fontSize: fluidFontSize(card.fontSizeValor, 1.6) }">
          <NumberWheel :value="card.valor" :line-height-ratio="1.1" />
        </span>
        <p class="card-titulo" :style="{ fontSize: fluidFontSize(card.fontSizeTitulo, 0.95) }">
          {{ card.titulo }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cards {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  /*  gap: clamp(0.75rem, 2vw, 1.25rem); */
  padding: clamp(0.75rem, 2vw, 1.25rem);
  width: fit-content;
  max-width: 100%;
  margin-left: auto;
  /* asegura que todo el bloque quede pegado a la derecha */
  position: relative;
  z-index: 200;
}

.card {
  box-sizing: border-box;
  background-color: #ffffff;
  border-radius: 20px;
  min-width: 0;
  /* permite que el contenido se ajuste sin desbordar */
  max-width: 100%;
}

.card-valor {
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
}

.card-titulo {
  margin: 0;
  font-weight: 500;
  color: #444;
  overflow-wrap: break-word;
  white-space: nowrap;
}

/* ─── Card principal (Total de PPI): número + etiqueta en fila ─── */
.card--main {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  width: fit-content;
}

/* ─── Card agrupada: cada item en columna, alineado a la izquierda ─── */
.card--group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: clamp(0.75rem, 1.5vw, 1rem);
  padding: 1rem 1.25rem;
  margin: -16px 0 0 0;
  width: fit-content;
  position: relative;
  z-index: 200;
}

.card-group-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  text-align: left;
  gap: 0.5rem;
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .cards {
    width: 100%;
    max-width: 100%;
    align-items: stretch;
    margin-left: 0;
    padding: 0;
    background-color: transparent;
  }

  .card--main,
  .card--group {
    width: 100%;
  }

  .card--main {
    justify-content: space-between;
  }

  .card-valor,
  .card-titulo {
    white-space: normal;
  }

  /* En móvil, cada item agrupado pasa a fila para aprovechar el ancho */
  .card-group-item {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    width: 100%;
  }
}
</style>
