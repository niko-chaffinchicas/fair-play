/**
 * Individual card component
 * Displays card name, category tags, assignment dropdown, and basic structure
 */

import type { Card as CardType, CardAssignment, PlayerNames } from "../types/index.js";

export interface CardProps {
  card: CardType;
  playerNames: PlayerNames;
  onAssignmentChange?: (cardName: string, assignment: CardAssignment) => void;
  onNotesChange?: (cardName: string, notes: string) => void;
  onTrimChange?: (cardName: string, trimmed: boolean) => void;
  onClick?: (card: CardType) => void;
  compact?: boolean; // If true, show compact view (for list/grid)
}

export class Card {
  private container: HTMLElement | null = null;
  private props: CardProps;
  private notesExpanded: boolean = false;

  constructor(props: CardProps) {
    this.props = props;
  }

  /**
   * Render the card component
   * @param container - The container element to render into
   */
  render(container: HTMLElement): void {
    this.container = container;
    this.updateHTML();
    this.attachEventListeners();
  }

  /**
   * Update the HTML content
   */
  private updateHTML(): void {
    if (!this.container) return;

    const { card, playerNames, compact } = this.props;
    const categories = this.parseCategories(card.definition);
    const assignmentDisplayName = this.getAssignmentDisplayName(
      card.assignment,
      playerNames
    );

    if (compact) {
      this.renderCompact(card, categories, assignmentDisplayName);
    } else {
      this.renderFull(card, categories, assignmentDisplayName);
    }
  }

  /**
   * Render compact card view (for grid/list)
   */
  private renderCompact(
    card: CardType,
    categories: string[],
    assignmentDisplayName: string
  ): void {
    if (!this.container) return;

    this.container.className = "card card-compact";
    this.container.setAttribute("data-card-name", this.escapeHtml(card.cardName));
    this.container.setAttribute("data-assignment", card.assignment);

    this.container.innerHTML = `
      <div class="card-header">
        <h3 class="card-name">${this.escapeHtml(card.cardName)}</h3>
        ${card.trimmed ? '<span class="card-trimmed-badge">Trimmed</span>' : ""}
      </div>
      <div class="card-body">
        <div class="card-categories">
          ${categories
        .map(
          (cat) =>
            `<span class="card-category-tag">${this.escapeHtml(cat)}</span>`
        )
        .join("")}
        </div>
        <div class="card-assignment">
          <label class="card-assignment-label">
            Assignment:
            <select class="card-assignment-select" data-card-name="${this.escapeHtml(card.cardName)}">
              ${this.renderAssignmentOptions(card.assignment)}
            </select>
          </label>
          <span class="card-assignment-badge card-assignment-${card.assignment}" title="${this.escapeHtml(assignmentDisplayName)}">
            <span class="card-assignment-icon">${this.getAssignmentIcon(card.assignment)}</span>
            <span class="card-assignment-text">${this.escapeHtml(assignmentDisplayName)}</span>
          </span>
        </div>
        <div class="card-actions">
          <button 
            type="button" 
            class="btn btn-trim ${card.trimmed ? "btn-trimmed" : ""}" 
            data-card-name="${this.escapeHtml(card.cardName)}"
            aria-label="${card.trimmed ? "Untrim" : "Trim"} card"
            title="${card.trimmed ? "Click to untrim this card" : "Click to trim this card"}"
          >
            ${card.trimmed ? "✂️ Untrim" : "✂️ Trim"}
          </button>
        </div>
        ${this.renderNotesSection(card)}
      </div>
    `;
  }

  /**
   * Render full card view (for detail view/modal)
   */
  private renderFull(
    card: CardType,
    categories: string[],
    assignmentDisplayName: string
  ): void {
    if (!this.container) return;

    this.container.className = "card card-full";
    this.container.setAttribute("data-card-name", this.escapeHtml(card.cardName));
    this.container.setAttribute("data-assignment", card.assignment);

    this.container.innerHTML = `
      <div class="card-header">
        <h2 class="card-name">${this.escapeHtml(card.cardName)}</h2>
        ${card.trimmed ? '<span class="card-trimmed-badge">Trimmed</span>' : ""}
      </div>
      <div class="card-body">
        <div class="card-categories">
          ${categories
        .map(
          (cat) =>
            `<span class="card-category-tag">${this.escapeHtml(cat)}</span>`
        )
        .join("")}
        </div>
        <div class="card-assignment">
          <label class="card-assignment-label">
            Assignment:
            <select class="card-assignment-select" data-card-name="${this.escapeHtml(card.cardName)}">
              ${this.renderAssignmentOptions(card.assignment)}
            </select>
          </label>
        </div>
        <div class="card-actions">
          <button 
            type="button" 
            class="btn btn-trim ${card.trimmed ? "btn-trimmed" : ""}" 
            data-card-name="${this.escapeHtml(card.cardName)}"
            aria-label="${card.trimmed ? "Untrim" : "Trim"} card"
            title="${card.trimmed ? "Click to untrim this card" : "Click to trim this card"}"
          >
            ${card.trimmed ? "✂️ Untrim" : "✂️ Trim"}
          </button>
        </div>
        <div class="card-details">
          <div class="card-section">
            <h4 class="card-section-title">Planning</h4>
            <p class="card-section-content">${this.formatMultilineText(card.planning)}</p>
          </div>
          <div class="card-section">
            <h4 class="card-section-title">Execution</h4>
            <p class="card-section-content">${this.formatMultilineText(card.execution)}</p>
          </div>
          <div class="card-section">
            <h4 class="card-section-title">Minimum Standard of Care</h4>
            <p class="card-section-content">${this.formatMultilineText(card.minimumStandardOfCare)}</p>
          </div>
          <div class="card-section">
            <h4 class="card-section-title">Question</h4>
            <p class="card-section-content">${this.formatMultilineText(card.minimumStandardOfCareQuestion)}</p>
          </div>
        </div>
        ${this.renderNotesSection(card)}
      </div>
    `;
  }

  /**
   * Render expandable/collapsible notes section
   */
  private renderNotesSection(card: CardType): string {
    const hasNotes = card.notes && card.notes.trim().length > 0;
    const expandedClass = this.notesExpanded ? "expanded" : "";
    const cardNameAttr = this.escapeHtml(card.cardName);

    return `
      <div class="card-notes-section">
        <button 
          type="button" 
          class="card-notes-toggle ${expandedClass}" 
          data-card-name="${cardNameAttr}"
          aria-label="${this.notesExpanded ? "Collapse" : "Expand"} notes"
          aria-expanded="${this.notesExpanded}"
        >
          <span class="card-notes-toggle-icon">${this.notesExpanded ? "▼" : "▶"}</span>
          <span class="card-notes-toggle-text">Notes${hasNotes ? ` (${card.notes.length} chars)` : ""}</span>
          ${hasNotes ? '<span class="card-notes-indicator" title="Has notes">📝</span>' : ""}
        </button>
        <div class="card-notes-content ${expandedClass}" data-card-name="${cardNameAttr}">
          <textarea 
            class="card-notes-textarea" 
            name="notes" 
            data-card-name="${cardNameAttr}"
            placeholder="Add notes about this card..."
            rows="4"
          >${hasNotes ? this.escapeHtml(card.notes) : ""}</textarea>
          ${hasNotes && this.props.compact ? `<div class="card-notes-preview-text">${this.escapeHtml(card.notes.substring(0, 100))}${card.notes.length > 100 ? "..." : ""}</div>` : ""}
        </div>
      </div>
    `;
  }

  /**
   * Parse categories from definition string
   * Categories are comma-separated (e.g., "Magic, Happiness Trio")
   */
  private parseCategories(definition: string): string[] {
    return definition
      .split(",")
      .map((cat) => cat.trim())
      .filter((cat) => cat.length > 0);
  }

  /**
   * Render assignment dropdown options
   */
  private renderAssignmentOptions(currentAssignment: CardAssignment): string {
    const options: { value: CardAssignment; label: string }[] = [
      { value: "unassigned", label: "Unassigned" },
      { value: "player1", label: this.props.playerNames.player1 },
      { value: "player2", label: this.props.playerNames.player2 },
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
   * Get icon for assignment status
   */
  private getAssignmentIcon(assignment: CardAssignment): string {
    switch (assignment) {
      case "unassigned":
        return "○"; // Circle outline
      case "player1":
        return "●"; // Filled circle
      case "player2":
        return "●"; // Filled circle
      case "shared":
        return "⚡"; // Lightning bolt
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
    if (!this.container) return;

    // Assignment dropdown change
    const assignmentSelect = this.container.querySelector(
      ".card-assignment-select"
    ) as HTMLSelectElement;
    if (assignmentSelect && this.props.onAssignmentChange) {
      assignmentSelect.addEventListener("change", (e: Event) => {
        const target = e.target as HTMLSelectElement;
        const cardName = target.getAttribute("data-card-name");
        const newAssignment = target.value as CardAssignment;
        if (cardName) {
          this.props.onAssignmentChange?.(cardName, newAssignment);
        }
      });
    }

    // Card click handler (for opening detail view)
    if (this.props.onClick) {
      this.container.addEventListener("click", (e: MouseEvent) => {
        // Don't trigger if clicking on interactive elements
        if (
          (e.target as HTMLElement).closest(".card-assignment-select") ||
          (e.target as HTMLElement).closest(".card-notes-section")
        ) {
          return;
        }
        this.props.onClick?.(this.props.card);
      });
    }

    // Notes toggle button
    const notesToggle = this.container.querySelector(
      ".card-notes-toggle"
    ) as HTMLButtonElement;
    if (notesToggle) {
      notesToggle.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        this.toggleNotes();
      });
    }

    // Notes textarea changes
    const notesTextarea = this.container.querySelector(
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
        }
      });

      // Debounced save on input (after 1 second of no typing)
      notesTextarea.addEventListener("input", () => {
        if (debounceTimer !== null) {
          window.clearTimeout(debounceTimer);
        }
        debounceTimer = window.setTimeout(() => {
          const cardName = notesTextarea.getAttribute("data-card-name");
          const notes = notesTextarea.value.trim();
          if (cardName) {
            this.props.onNotesChange?.(cardName, notes);
          }
          debounceTimer = null;
        }, 1000);
      });
    }

    // Trim button
    const trimBtn = this.container.querySelector(
      ".btn-trim"
    ) as HTMLButtonElement;
    if (trimBtn && this.props.onTrimChange) {
      trimBtn.addEventListener("click", (e: Event) => {
        e.stopPropagation();
        const cardName = trimBtn.getAttribute("data-card-name");
        if (cardName) {
          const newTrimmedState = !this.props.card.trimmed;
          this.props.onTrimChange?.(cardName, newTrimmedState);
        }
      });
    }
  }

  /**
   * Toggle notes section expanded/collapsed
   */
  private toggleNotes(): void {
    this.notesExpanded = !this.notesExpanded;
    this.updateHTML();
    this.attachEventListeners();
  }

  /**
   * Update card data and re-render
   */
  updateCard(card: CardType): void {
    this.props.card = card;
    this.updateHTML();
    this.attachEventListeners();
  }

  /**
   * Update player names and re-render
   */
  updatePlayerNames(playerNames: PlayerNames): void {
    this.props.playerNames = playerNames;
    this.updateHTML();
    this.attachEventListeners();
  }

  /**
   * Update props
   */
  updateProps(newProps: Partial<CardProps>): void {
    this.props = { ...this.props, ...newProps };
    this.updateHTML();
    this.attachEventListeners();
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    this.container = null;
  }
}

