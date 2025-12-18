/**
 * Export/Import component
 * Handles exporting and importing user data
 */

import type { ExportData, PlayerNames, CardData } from "../types/index.js";
import { getAllCards, clearAllCards } from "../utils/db.js";
import { getPlayerNames, setPlayerNames } from "../utils/storage.js";
import { saveCardData } from "../utils/db.js";

export interface ExportImportProps {
  onExport?: () => void;
  onImport?: () => void;
  onImportSuccess?: () => void;
  onImportError?: (error: string) => void;
}

export class ExportImport {
  private props: ExportImportProps;
  private readonly VERSION = "1.0.0";

  constructor(props: ExportImportProps) {
    this.props = props;
  }

  /**
   * Export all user data to JSON file
   */
  async exportData(): Promise<void> {
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
          version: this.VERSION,
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

      this.props.onExport?.();
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    }
  }

  /**
   * Import data from JSON file
   */
  async importData(file: File): Promise<void> {
    try {
      // Read file
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;

      // Validate data structure
      this.validateImportData(data);

      // Show confirmation dialog
      const confirmed = await this.showImportConfirmation();
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

      this.props.onImportSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Import failed:", error);
      this.props.onImportError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Validate imported data structure
   */
  private validateImportData(data: unknown): void {
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
  private showImportConfirmation(): Promise<boolean> {
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
   * Show success message
   */
  showSuccessMessage(message: string): void {
    this.showMessage(message, "success");
  }

  /**
   * Show error message
   */
  showErrorMessage(message: string): void {
    this.showMessage(message, "error");
  }

  /**
   * Show a message (success or error)
   */
  private showMessage(message: string, type: "success" | "error"): void {
    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay message-overlay";
    const icon = type === "success" ? "✓" : "✗";
    const className = type === "success" ? "message-success" : "message-error";

    overlay.innerHTML = `
      <div class="dialog message-dialog ${className}">
        <div class="dialog-body">
          <div class="message-content">
            <span class="message-icon">${icon}</span>
            <p class="message-text">${this.escapeHtml(message)}</p>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-primary btn-close-message">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Handle close button
    const closeBtn = overlay.querySelector(".btn-close-message");
    closeBtn?.addEventListener("click", () => {
      overlay.remove();
    });

    // Auto-close after 3 seconds for success messages
    if (type === "success") {
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.remove();
        }
      }, 3000);
    }

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);
  }

  /**
   * Trigger file input for import
   */
  triggerImport(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.style.display = "none";

    input.addEventListener("change", async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        try {
          await this.importData(file);
          this.showSuccessMessage("Data imported successfully!");
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to import data. Please check the file format.";
          this.showErrorMessage(errorMessage);
        }
      }
      document.body.removeChild(input);
    });

    document.body.appendChild(input);
    input.click();
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

