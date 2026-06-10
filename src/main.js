import { createApp } from "vue";
import { createPinia } from "pinia";

// CSS
import "@/assets/main.css";
import "@/assets/mapaControl.css";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");
