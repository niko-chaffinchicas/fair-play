/**
 * Application entry point
 * Initializes Vue app and Pinia store
 */

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./styles/main.css";

// Create Pinia instance
const pinia = createPinia();

// Create and mount Vue app
const app = createApp(App);
app.use(pinia);
app.mount("#app");

console.log("Vue app initialized");
