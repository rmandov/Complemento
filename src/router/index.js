import { createRouter, createWebHashHistory } from "vue-router";

import HomeView from "@/modules/home/views/HomeView.vue";
import MapView from "@/modules/map/views/MapView.vue";
import FichaView from "@/modules/map/views/FichaView.vue";
import Test from "@/modules/test/test.vue";
import ViewMapa from "@/components/secciones/Mapa/ViewMapa.vue";

const routes = [
  { path: "/", component: HomeView },
  { path: "/mapa", component: MapView },
  { path: "/fichas", component: FichaView, children: [{ path: "test", component: Test }] },
  { path: "/mapav2", component: ViewMapa },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
