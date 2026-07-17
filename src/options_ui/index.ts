import { ConfirmationService, ToastService } from "primevue";
import PrimeVue from "primevue/config";
import { createApp } from "vue";

import "primeicons/primeicons.css";
import App from "./App.vue";
import "./index.css";
import router from "./router";

const app = createApp(App);
app.use(router);
app.use(PrimeVue, {
  theme: "none",
});
app.use(ToastService);
app.use(ConfirmationService);
app.mount("#app");
