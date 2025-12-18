/**
 * Player name editor component
 * Supports inline editing and dialog/modal mode
 */

import type { PlayerNames } from "../types/index.js";

export interface PlayerNameEditorProps {
  playerNames: PlayerNames;
  onSave: (playerNames: PlayerNames) => void;
  onCancel?: () => void;
  mode?: "inline" | "dialog";
  inlineTarget?: HTMLElement; // For inline mode, the element to replace
}

export class PlayerNameEditor {
  private container: HTMLElement | null = null;
  private props: PlayerNameEditorProps;
  private dialogOverlay: HTMLElement | null = null;

  constructor(props: PlayerNameEditorProps) {
    this.props = {
      mode: "dialog",
      ...props,
    };
  }

  /**
   * Render the player name editor
   * @param container - The container element to render into (for dialog mode)
   */
  render(container?: HTMLElement): void {
    if (this.props.mode === "inline" && this.props.inlineTarget) {
      this.renderInline(this.props.inlineTarget);
    } else {
      if (container) {
        this.container = container;
      } else {
        this.renderDialog();
      }
    }
  }

  /**
   * Render inline editor (replaces target element)
   */
  private renderInline(target: HTMLElement): void {
    const originalContent = target.innerHTML;
    target.innerHTML = this.getEditorHTML();
    this.container = target;

    // Attach event listeners
    this.attachEventListeners();

    // Focus on first input
    const firstInput = target.querySelector(
      'input[name="player1"]'
    ) as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
      firstInput.select();
    }

    // Handle Escape key to cancel
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        target.innerHTML = originalContent;
        this.props.onCancel?.();
        this.container = null;
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);
  }

  /**
   * Render dialog/modal editor
   */
  private renderDialog(): void {
    // Create overlay
    this.dialogOverlay = document.createElement("div");
    this.dialogOverlay.className = "dialog-overlay";
    this.dialogOverlay.innerHTML = `
      <div class="dialog player-name-editor-dialog">
        <div class="dialog-header">
          <h2 class="dialog-title">Edit Player Names</h2>
          <button class="dialog-close" aria-label="Close">×</button>
        </div>
        <div class="dialog-body">
          ${this.getEditorHTML()}
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary btn-cancel">Cancel</button>
          <button class="btn btn-primary btn-save">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.dialogOverlay);
    this.container = this.dialogOverlay.querySelector(".dialog-body");

    // Attach event listeners
    this.attachEventListeners();

    // Close button
    const closeBtn = this.dialogOverlay.querySelector(".dialog-close");
    closeBtn?.addEventListener("click", () => {
      this.close();
    });

    // Overlay click to close
    this.dialogOverlay.addEventListener("click", (e) => {
      if (e.target === this.dialogOverlay) {
        this.close();
      }
    });

    // Focus on first input
    const firstInput = this.dialogOverlay.querySelector(
      'input[name="player1"]'
    ) as HTMLInputElement;
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  /**
   * Get the editor HTML (form inputs)
   */
  private getEditorHTML(): string {
    return `
      <form class="player-name-editor-form">
        <div class="form-group">
          <label for="player1-input">Player 1 Name:</label>
          <input
            type="text"
            id="player1-input"
            name="player1"
            class="player-name-input"
            value="${this.escapeHtml(this.props.playerNames.player1)}"
            placeholder="Enter Player 1 name"
            maxlength="50"
            required
          />
        </div>
        <div class="form-group">
          <label for="player2-input">Player 2 Name:</label>
          <input
            type="text"
            id="player2-input"
            name="player2"
            class="player-name-input"
            value="${this.escapeHtml(this.props.playerNames.player2)}"
            placeholder="Enter Player 2 name"
            maxlength="50"
            required
          />
        </div>
      </form>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    const form = this.container.querySelector(".player-name-editor-form");
    if (!form) return;

    // Handle form submission
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSave();
    });

    // Save button (for dialog mode)
    const saveBtn = this.dialogOverlay?.querySelector(".btn-save");
    saveBtn?.addEventListener("click", () => {
      this.handleSave();
    });

    // Cancel button (for dialog mode)
    const cancelBtn = this.dialogOverlay?.querySelector(".btn-cancel");
    cancelBtn?.addEventListener("click", () => {
      this.close();
    });

    // Enter key to save (when not in textarea)
    const inputs = this.container.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.handleSave();
        }
      });
    });
  }

  /**
   * Handle save action
   */
  private handleSave(): void {
    if (!this.container) return;

    const form = this.container.querySelector(
      ".player-name-editor-form"
    ) as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const player1 = (formData.get("player1") as string)?.trim() || "Player 1";
    const player2 = (formData.get("player2") as string)?.trim() || "Player 2";

    const newPlayerNames: PlayerNames = {
      player1,
      player2,
    };

    this.props.onSave(newPlayerNames);
    this.close();
  }

  /**
   * Close the editor (for dialog mode)
   */
  private close(): void {
    if (this.dialogOverlay) {
      this.dialogOverlay.remove();
      this.dialogOverlay = null;
    }
    this.container = null;
    this.props.onCancel?.();
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Update player names
   */
  updatePlayerNames(playerNames: PlayerNames): void {
    this.props.playerNames = playerNames;
    if (this.container) {
      const player1Input = this.container.querySelector(
        'input[name="player1"]'
      ) as HTMLInputElement;
      const player2Input = this.container.querySelector(
        'input[name="player2"]'
      ) as HTMLInputElement;

      if (player1Input) player1Input.value = playerNames.player1;
      if (player2Input) player2Input.value = playerNames.player2;
    }
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    this.close();
  }
}

