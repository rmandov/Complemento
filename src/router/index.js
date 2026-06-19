import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/modules/map/views/HomeView.vue'
import MapView from '@/modules/map/views/MapView.vue'
import FichaView from '@/modules/map/views/FichaView.vue'

const routes = [
  {path: '/', component: HomeView},
  {path: '/mapa', component: MapView},
  {path: '/fichas', component: FichaView},
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
