/**
 * Trimmed cards section component
 * Displays cards that have been marked as trimmed
 */

import type { Card, CardAssignment, PlayerNames } from "../types/index.js";
import { Card as CardComponent } from "./Card.js";

export interface TrimmedCardsSectionProps {
  cards: Card[];
  playerNames: PlayerNames;
  onCardClick?: (card: Card) => void;
  onAssignmentChange?: (cardName: string, assignment: CardAssignment) => void;
  onNotesChange?: (cardName: string, notes: string) => void;
  onTrimChange?: (cardName: string, trimmed: boolean) => void;
}

export class TrimmedCardsSection {
  private container: HTMLElement | null = null;
  private props: TrimmedCardsSectionProps;
  private cardComponents: Map<string, CardComponent> = new Map();
  private isExpanded: boolean = false;

  constructor(props: TrimmedCardsSectionProps) {
    this.props = props;
  }

  /**
   * Render the trimmed cards section
   * @param container - The container element to render into
   */
  render(container: HTMLElement): void {
    this.container = container;
    this.updateHTML();
  }

  /**
   * Update the HTML content
   */
  private updateHTML(): void {
    if (!this.container) return;

    const trimmedCards = this.props.cards.filter((card) => card.trimmed);
    const hasTrimmedCards = trimmedCards.length > 0;
    const expandedClass = this.isExpanded ? "expanded" : "";

    if (!hasTrimmedCards) {
      this.container.innerHTML = "";
      return;
    }

    this.container.innerHTML = `
      <div class="trimmed-cards-section">
        <button 
          class="trimmed-cards-toggle ${expandedClass}" 
          type="button"
          aria-label="${this.isExpanded ? "Collapse" : "Expand"} trimmed cards"
          aria-expanded="${this.isExpanded}"
        >
          <span class="trimmed-cards-toggle-icon">${this.isExpanded ? "▼" : "▶"}</span>
          <span class="trimmed-cards-toggle-text">Trimmed Cards (${trimmedCards.length})</span>
        </button>
        <div class="trimmed-cards-content ${expandedClass}">
          <div class="trimmed-cards-grid"></div>
        </div>
      </div>
    `;

    // Render card components
    this.renderCards(trimmedCards);

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Render individual trimmed cards
   */
  private renderCards(cards: Card[]): void {
    if (!this.container) return;

    const gridContainer = this.container.querySelector(".trimmed-cards-grid");
    if (!gridContainer) return;

    // Clear existing card components
    this.cardComponents.forEach((cardComponent) => {
      cardComponent.destroy();
    });
    this.cardComponents.clear();

    // Create Card component for each trimmed card
    cards.forEach((card) => {
      const cardElement = document.createElement("div");
      cardElement.className = "card-item";
      gridContainer.appendChild(cardElement);

      const cardComponent = new CardComponent({
        card,
        playerNames: this.props.playerNames,
        compact: true,
        onClick: this.props.onCardClick,
        onAssignmentChange: this.props.onAssignmentChange,
        onNotesChange: this.props.onNotesChange,
        onTrimChange: this.props.onTrimChange,
      });

      cardComponent.render(cardElement);
      this.cardComponents.set(card.cardName, cardComponent);
    });
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Toggle button
    const toggleBtn = this.container.querySelector(
      ".trimmed-cards-toggle"
    ) as HTMLButtonElement;
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.toggle();
      });
    }
  }

  /**
   * Toggle expanded/collapsed state
   */
  toggle(): void {
    this.isExpanded = !this.isExpanded;
    this.updateHTML();
  }

  /**
   * Update trimmed cards and re-render
   */
  updateCards(cards: Card[]): void {
    this.props.cards = cards;
    this.updateHTML();
  }

  /**
   * Update player names
   */
  updatePlayerNames(playerNames: PlayerNames): void {
    this.props.playerNames = playerNames;
    this.cardComponents.forEach((cardComponent) => {
      cardComponent.updatePlayerNames(playerNames);
    });
  }

  /**
   * Update props
   */
  updateProps(newProps: Partial<TrimmedCardsSectionProps>): void {
    this.props = { ...this.props, ...newProps };
    if (newProps.cards) {
      this.updateCards(newProps.cards);
    } else {
      this.updateHTML();
    }
  }

  /**
   * Get current trimmed cards count
   */
  getTrimmedCount(): number {
    return this.props.cards.filter((card) => card.trimmed).length;
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    this.cardComponents.forEach((cardComponent) => {
      cardComponent.destroy();
    });
    this.cardComponents.clear();
    this.container = null;
  }
}

