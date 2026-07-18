import { initUiTheme } from "@src/common/ui-theme";
import { createApp } from "vue";

import App from "./App.vue";
import "./index.css";
import router from "./router";

initUiTheme();

const app = createApp(App);
app.use(router);
app.mount("#app");
