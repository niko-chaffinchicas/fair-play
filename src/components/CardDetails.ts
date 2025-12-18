/**
 * Card details modal component
 * Displays full card information (planning, execution, MSC, etc.) in a modal dialog
 */

import type { Card, CardAssignment, PlayerNames } from "../types/index.js";

export interface CardDetailsProps {
  card: Card;
  playerNames: PlayerNames;
  onClose: () => void;
  onAssignmentChange?: (cardName: string, assignment: CardAssignment) => void;
  onNotesChange?: (cardName: string, notes: string) => void;
  onTrimChange?: (cardName: string, trimmed: boolean) => void;
}

export class CardDetails {
  private overlay: HTMLElement | null = null;
  private props: CardDetailsProps;

  constructor(props: CardDetailsProps) {
    this.props = props;
  }

  /**
   * Render the card details modal
   */
  render(): void {
    // Create overlay
    this.overlay = document.createElement("div");
    this.overlay.className = "dialog-overlay card-details-overlay";
    this.overlay.innerHTML = this.getModalHTML();

    document.body.appendChild(this.overlay);

    // Attach event listeners
    this.attachEventListeners();

    // Focus on close button for accessibility
    const closeBtn = this.overlay.querySelector(".dialog-close") as HTMLButtonElement;
    if (closeBtn) {
      setTimeout(() => closeBtn.focus(), 100);
    }

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
  }

  /**
   * Get the modal HTML content
   */
  private getModalHTML(): string {
    const { card, playerNames } = this.props;
    const categories = this.parseCategories(card.definition);
    const assignmentDisplayName = this.getAssignmentDisplayName(
      card.assignment,
      playerNames
    );

    return `
      <div class="dialog card-details-dialog">
        <div class="dialog-header">
          <h2 class="dialog-title">${this.escapeHtml(card.cardName)}</h2>
          <button class="dialog-close" aria-label="Close">×</button>
        </div>
        <div class="dialog-body card-details-body">
          <div class="card-details-header">
            <div class="card-details-categories">
              ${categories
                .map(
                  (cat) =>
                    `<span class="card-category-tag">${this.escapeHtml(cat)}</span>`
                )
                .join("")}
            </div>
            <div class="card-details-badges">
              ${card.trimmed ? '<span class="card-trimmed-badge">Trimmed</span>' : ""}
              <span class="card-assignment-badge card-assignment-${card.assignment}" title="${this.escapeHtml(assignmentDisplayName)}">
                <span class="card-assignment-icon">${this.getAssignmentIcon(card.assignment)}</span>
                <span class="card-assignment-text">${this.escapeHtml(assignmentDisplayName)}</span>
              </span>
            </div>
          </div>

          <div class="card-details-assignment">
            <label class="card-assignment-label">
              Assignment:
              <select class="card-assignment-select" data-card-name="${this.escapeHtml(card.cardName)}">
                ${this.renderAssignmentOptions(card.assignment, playerNames)}
              </select>
            </label>
          </div>

          <div class="card-details-actions">
            <button 
              type="button" 
              class="btn btn-trim ${card.trimmed ? "btn-trimmed" : ""}" 
              data-card-name="${this.escapeHtml(card.cardName)}"
              aria-label="${card.trimmed ? "Untrim" : "Trim"} card"
            >
              ${card.trimmed ? "✂️ Untrim" : "✂️ Trim"}
            </button>
          </div>

          <div class="card-details-content">
            <div class="card-section">
              <h3 class="card-section-title">Definition</h3>
              <p class="card-section-content">${this.formatMultilineText(card.definition)}</p>
            </div>

            <div class="card-section">
              <h3 class="card-section-title">Planning</h3>
              <p class="card-section-content">${this.formatMultilineText(card.planning)}</p>
            </div>

            <div class="card-section">
              <h3 class="card-section-title">Execution</h3>
              <p class="card-section-content">${this.formatMultilineText(card.execution)}</p>
            </div>

            <div class="card-section">
              <h3 class="card-section-title">Minimum Standard of Care</h3>
              <p class="card-section-content">${this.formatMultilineText(card.minimumStandardOfCare)}</p>
            </div>

            <div class="card-section">
              <h3 class="card-section-title">Question</h3>
              <p class="card-section-content">${this.formatMultilineText(card.minimumStandardOfCareQuestion)}</p>
            </div>

            <div class="card-details-notes">
              <h3 class="card-section-title">Notes</h3>
              <textarea 
                class="card-notes-textarea" 
                name="notes" 
                data-card-name="${this.escapeHtml(card.cardName)}"
                placeholder="Add notes about this card..."
                rows="6"
              >${card.notes ? this.escapeHtml(card.notes) : ""}</textarea>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Parse categories from definition string
   */
  private parseCategories(definition: string): string[] {
    return definition
      .split(",")
      .map((cat) => cat.trim())
      .filter((cat) => cat.length > 0);
  }

  /**
   * Get icon for assignment status
   */
  private getAssignmentIcon(assignment: CardAssignment): string {
    switch (assignment) {
      case "unassigned":
        return "○";
      case "player1":
        return "●";
      case "player2":
        return "●";
      case "shared":
        return "⚡";
      default:
        return "";
    }
  }

  /**
   * Get display name for assignment status
   */
  private getAssignmentDisplayName(
    assignment: CardAssignment,
    playerNames: PlayerNames
  ): string {
    switch (assignment) {
      case "unassigned":
        return "Unassigned";
      case "player1":
        return playerNames.player1;
      case "player2":
        return playerNames.player2;
      case "shared":
        return "Shared";
      default:
        return assignment;
    }
  }

  /**
   * Render assignment dropdown options
   */
  private renderAssignmentOptions(
    currentAssignment: CardAssignment,
    playerNames: PlayerNames
  ): string {
    const options: { value: CardAssignment; label: string }[] = [
      { value: "unassigned", label: "Unassigned" },
      { value: "player1", label: playerNames.player1 },
      { value: "player2", label: playerNames.player2 },
      { value: "shared", label: "Shared" },
    ];

    return options
      .map(
        (opt) =>
          `<option value="${opt.value}" ${opt.value === currentAssignment ? "selected" : ""}>${this.escapeHtml(opt.label)}</option>`
      )
      .join("");
  }

  /**
   * Format multiline text for display (preserve line breaks)
   */
  private formatMultilineText(text: string): string {
    return this.escapeHtml(text).replace(/\n/g, "<br>");
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
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.overlay) return;

    // Close button
    const closeBtn = this.overlay.querySelector(".dialog-close");
    closeBtn?.addEventListener("click", () => {
      this.close();
    });

    // Overlay click to close
    this.overlay.addEventListener("click", (e: MouseEvent) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Escape key to close
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.close();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);

    // Assignment dropdown change
    const assignmentSelect = this.overlay.querySelector(
      ".card-assignment-select"
    ) as HTMLSelectElement;
    if (assignmentSelect && this.props.onAssignmentChange) {
      assignmentSelect.addEventListener("change", (e: Event) => {
        const target = e.target as HTMLSelectElement;
        const cardName = target.getAttribute("data-card-name");
        const newAssignment = target.value as CardAssignment;
        if (cardName) {
          this.props.onAssignmentChange(cardName, newAssignment);
          // Update the card in props
          this.props.card.assignment = newAssignment;
        }
      });
    }

    // Trim button
    const trimBtn = this.overlay.querySelector(".btn-trim") as HTMLButtonElement;
    if (trimBtn && this.props.onTrimChange) {
      trimBtn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const cardName = trimBtn.getAttribute("data-card-name");
        if (cardName) {
          const newTrimmedState = !this.props.card.trimmed;
          this.props.onTrimChange(cardName, newTrimmedState);
          // Update the card in props
          this.props.card.trimmed = newTrimmedState;
          // Re-render to update UI
          this.updateCard(this.props.card);
        }
      });
    }

    // Notes textarea changes
    const notesTextarea = this.overlay.querySelector(
      ".card-notes-textarea"
    ) as HTMLTextAreaElement;
    if (notesTextarea && this.props.onNotesChange) {
      let debounceTimer: number | null = null;

      // Save on blur (immediate)
      notesTextarea.addEventListener("blur", () => {
        const cardName = notesTextarea.getAttribute("data-card-name");
        const notes = notesTextarea.value.trim();
        if (cardName) {
          this.props.onNotesChange?.(cardName, notes);
          this.props.card.notes = notes;
        }
      });

      // Debounced save on input
      notesTextarea.addEventListener("input", () => {
        if (debounceTimer !== null) {
          window.clearTimeout(debounceTimer);
        }
        debounceTimer = window.setTimeout(() => {
          const cardName = notesTextarea.getAttribute("data-card-name");
          const notes = notesTextarea.value.trim();
          if (cardName) {
            this.props.onNotesChange?.(cardName, notes);
            this.props.card.notes = notes;
          }
          debounceTimer = null;
        }, 1000);
      });
    }
  }

  /**
   * Update card data and re-render
   */
  updateCard(card: Card): void {
    this.props.card = card;
    if (this.overlay) {
      const dialogBody = this.overlay.querySelector(".card-details-body");
      if (dialogBody) {
        // Update the modal content
        this.overlay.innerHTML = this.getModalHTML();
        this.attachEventListeners();
      }
    }
  }

  /**
   * Update player names and re-render
   */
  updatePlayerNames(playerNames: PlayerNames): void {
    this.props.playerNames = playerNames;
    this.updateCard(this.props.card);
  }

  /**
   * Close the modal
   */
  close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    // Restore body scroll
    document.body.style.overflow = "";
    this.props.onClose();
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    this.close();
  }
}

