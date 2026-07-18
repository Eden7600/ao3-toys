import { initUiTheme } from "@src/common/ui-theme";
import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";

initUiTheme();

const app = createApp(App);
app.mount("#app");
