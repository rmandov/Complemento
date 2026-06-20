// stores/map.js
import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useInfoStore = defineStore('santiago', () => {
  // State
  const information = ref({
    short_name: 'texto',
    id_municipio: 'numero',
  })

  // Actions
  function setShortName(short_name) {
    information.value.short_name = short_name
  }

  function setIdMunicipio(id_municipio) {
    information.value.id_municipio = id_municipio
  }

  function setInfo({ short_name, id_municipio }) {
    if (short_name) information.value.short_name = short_name
    if (id_municipio !== undefined) {
      information.value.id_municipio = id_municipio
    }
  }

  return {
    information,
    setShortName,
    setIdMunicipio,
    setInfo,
  }
})
