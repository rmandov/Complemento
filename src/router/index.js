import { createRouter, createWebHashHistory } from 'vue-router'

import HomeView from '@/modules/home/views/HomeView.vue'
import MapView from '@/modules/map/views/MapView.vue'
import FichaView from '@/modules/map/views/FichaView.vue'
import Test from '@/modules/test/test.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/mapa', component: MapView },
  { path: '/fichas', component: FichaView, children: [{ path: 'test', component: Test }] },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
