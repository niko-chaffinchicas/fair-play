/**
 * Application entry point
 * Initializes the app and loads data
 */

import "./styles/main.css";
import { loadAllCardData } from "./utils/data.js";
import { getPlayerNames } from "./utils/storage.js";
import { App } from "./App.js";

/**
 * Mount the application to the DOM
 */
async function mountApp(): Promise<void> {
  try {
    // Ensure the app root element exists
    const appRoot = document.getElementById("app");
    if (!appRoot) {
      throw new Error("App root element '#app' not found in DOM");
    }

    // Load card data and player names
    const [cards, playerNames] = await Promise.all([
      loadAllCardData(),
      Promise.resolve(getPlayerNames()),
    ]);

    console.log("Fair Play Card Manager initialized");
    console.log(`Loaded ${cards.length} cards`);
    console.log(`Player names: ${playerNames.player1}, ${playerNames.player2}`);

    // Initialize and mount App component
    const app = new App({ cards, playerNames });
    app.render();

    console.log("App mounted successfully");
  } catch (error) {
    console.error("Failed to mount app:", error);
    // Display error message in the DOM if mounting fails
    const appRoot = document.getElementById("app");
    if (appRoot) {
      appRoot.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
          <h1>Error Loading Application</h1>
          <p>${error instanceof Error ? error.message : "Unknown error occurred"}</p>
          <p>Please refresh the page to try again.</p>
        </div>
      `;
    }
  }
}

// Mount app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountApp);
} else {
  mountApp();
}
