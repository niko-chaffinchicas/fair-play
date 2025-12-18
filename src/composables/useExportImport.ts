/**
 * Export/Import composable
 * Handles exporting and importing user data
 */

import { ref, type Ref } from "vue";
import type { ExportData, PlayerNames, CardData } from "../types/index.js";
import { getAllCards, clearAllCards, saveCardData } from "../utils/db.js";
import { getPlayerNames, setPlayerNames } from "../utils/storage.js";

const VERSION = "1.0.0";

/**
 * Composable for export/import functionality
 */
export function useExportImport() {
  const isExporting: Ref<boolean> = ref(false);
  const isImporting: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  /**
   * Export all user data to JSON file
   */
  async function exportData(): Promise<void> {
    isExporting.value = true;
    error.value = null;
    try {
      // Collect all data
      const playerNames = getPlayerNames();
      const cards = await getAllCards();

      // Create export data structure
      const exportData: ExportData = {
        playerNames,
        cards,
        metadata: {
          exportedAt: new Date().toISOString(),
          version: VERSION,
        },
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create blob and download
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fair-play-cards-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      error.value = errorMessage;
      throw err;
    } finally {
      isExporting.value = false;
    }
  }

  /**
   * Validate imported data structure
   */
  function validateImportData(data: unknown): void {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid import file: data is not an object");
    }

    const exportData = data as Partial<ExportData>;

    // Validate playerNames
    if (!exportData.playerNames) {
      throw new Error("Invalid import file: missing playerNames");
    }
    if (
      typeof exportData.playerNames.player1 !== "string" ||
      typeof exportData.playerNames.player2 !== "string"
    ) {
      throw new Error("Invalid import file: invalid playerNames structure");
    }

    // Validate cards
    if (!Array.isArray(exportData.cards)) {
      throw new Error("Invalid import file: cards must be an array");
    }

    // Validate each card
    for (const card of exportData.cards) {
      if (!card.cardName || typeof card.cardName !== "string") {
        throw new Error("Invalid import file: card missing cardName");
      }
      if (
        !card.assignment ||
        !["unassigned", "player1", "player2", "shared"].includes(card.assignment)
      ) {
        throw new Error("Invalid import file: invalid card assignment");
      }
      if (typeof card.notes !== "string") {
        throw new Error("Invalid import file: invalid card notes");
      }
      if (typeof card.trimmed !== "boolean") {
        throw new Error("Invalid import file: invalid card trimmed state");
      }
    }

    // Validate metadata (optional but nice to have)
    if (exportData.metadata) {
      if (typeof exportData.metadata.exportedAt !== "string") {
        throw new Error("Invalid import file: invalid metadata.exportedAt");
      }
    }
  }

  /**
   * Show confirmation dialog before importing
   */
  function showImportConfirmation(): Promise<boolean> {
    return new Promise((resolve) => {
      // Create confirmation dialog
      const overlay = document.createElement("div");
      overlay.className = "dialog-overlay";
      overlay.innerHTML = `
        <div class="dialog import-confirmation-dialog">
          <div class="dialog-header">
            <h2 class="dialog-title">Confirm Import</h2>
            <button class="dialog-close" aria-label="Close">×</button>
          </div>
          <div class="dialog-body">
            <p>This will replace all your current card assignments, notes, and trimmed states with the imported data.</p>
            <p><strong>This action cannot be undone.</strong></p>
            <p>Are you sure you want to continue?</p>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-secondary btn-cancel">Cancel</button>
            <button class="btn btn-primary btn-confirm">Import</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      // Handle close button
      const closeBtn = overlay.querySelector(".dialog-close");
      closeBtn?.addEventListener("click", () => {
        overlay.remove();
        resolve(false);
      });

      // Handle cancel button
      const cancelBtn = overlay.querySelector(".btn-cancel");
      cancelBtn?.addEventListener("click", () => {
        overlay.remove();
        resolve(false);
      });

      // Handle confirm button
      const confirmBtn = overlay.querySelector(".btn-confirm");
      confirmBtn?.addEventListener("click", () => {
        overlay.remove();
        resolve(true);
      });

      // Handle overlay click
      overlay.addEventListener("click", (e: MouseEvent) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(false);
        }
      });

      // Handle Escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          overlay.remove();
          document.removeEventListener("keydown", handleEscape);
          resolve(false);
        }
      };
      document.addEventListener("keydown", handleEscape);
    });
  }

  /**
   * Import data from JSON file
   */
  async function importData(file: File): Promise<void> {
    isImporting.value = true;
    error.value = null;
    try {
      // Read file
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;

      // Validate data structure
      validateImportData(data);

      // Show confirmation dialog
      const confirmed = await showImportConfirmation();
      if (!confirmed) {
        return;
      }

      // Clear existing data
      await clearAllCards();

      // Import player names
      setPlayerNames(data.playerNames);

      // Import card data
      for (const cardData of data.cards) {
        await saveCardData(cardData.cardName, cardData);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      error.value = errorMessage;
      throw err;
    } finally {
      isImporting.value = false;
    }
  }

  return {
    // State
    isExporting,
    isImporting,
    error,
    // Functions
    exportData,
    importData,
    validateImportData,
    showImportConfirmation,
  };
}

