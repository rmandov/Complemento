<script setup>
/* Aquí se tendrá mandará a llamar un .json donde vendrá los números
de los proyectos. Además la información actualizada (leyenda)*/
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
    <div v-for="card in cards" :key="card.id" class="card">
      <p class="card-titulo">
        {{ card.titulo }}
      </p>

      <span class="card-valor">
        {{ card.valor }}
      </span>
    </div>
  </div>
  <p class="cards-leyenda">
    {{ leyenda }}
  </p>
</template>

<style scoped>
.cards {
  display: flex;
  flex-direction: row;
  gap: 16px;
}

.card {
  padding: 16px;
  border: 1px solid #dcdce6;
  border-radius: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.card-titulo {
  margin: 0 0 8px;
}

.card-valor {
  font-size: 2rem;
  font-weight: 700;
}

.cards-leyenda {
  font-size: 0.875rem;
  color: #666;
}

@media (max-width: 768px) {
  .cards {
    flex-direction: column;
  }
}
</style>
