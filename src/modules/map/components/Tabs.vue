<template>
  <div class="tabs-wrapper">
    <nav class="tabs-nav">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ 'tab-btn--active': modelValue === tab.id }"
        @click="$emit('update:modelValue', tab.id)">
        {{ tab.label }}
      </button>
    </nav>

    <div class="tabs-content">
      <!-- Todos los paneles se renderizan una sola vez y se ocultan con v-show -->
      <div v-for="tab in tabs" :key="tab.id" v-show="modelValue === tab.id" class="tab-panel">
        <slot :name="tab.id" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  },
  tabs: {
    type: Array,
    required: true
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.tabs-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.tabs-nav {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e5e7eb;
  padding: 0 16px;
  background: #fff;
  flex-shrink: 0;
  /* La barra de tabs nunca se encoge */
}

.tab-btn {
  padding: 12px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #111827;
}

.tab-btn--active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tabs-content {
  flex: 1;
  position: relative;
  /*
    IMPORTANTE: sin overflow:auto aquí.
    Si algún tab necesita scroll, ponlo en el componente interno
    de ese tab, no en este contenedor general.
  */
}

.tab-panel {
  height: 100%;
  width: 100%;
}
</style>
