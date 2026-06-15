// stores/map.js
import { defineStore } from 'pinia'

export const useMapStore = defineStore('map', {
  state: () => ({
    view: {
      center: [23.6345, -102.5528],
      zoom: 5,
      bounds: null,
    },
  }),

  actions: {
    setCenter(center) {
      this.view.center = center
    },

    setZoom(zoom) {
      this.view.zoom = zoom
    },

    setBounds(bounds) {
      this.view.bounds = bounds
    },

    setView({ center, zoom, bounds }) {
      if (center) this.view.center = center
      if (zoom !== undefined) this.view.zoom = zoom
      if (bounds) this.view.bounds = bounds
    },
  },
})
