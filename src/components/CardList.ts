/**
 * Card list container component
 * Receives filtered cards and renders them
 */

import type { Card, CardAssignment, PlayerNames } from "../types/index.js";
import { Card as CardComponent } from "./Card.js";

export interface CardListProps {
  cards: Card[];
  playerNames: PlayerNames;
  onCardClick?: (card: Card) => void;
  onAssignmentChange?: (cardName: string, assignment: CardAssignment) => void;
  onNotesChange?: (cardName: string, notes: string) => void;
  onTrimChange?: (cardName: string, trimmed: boolean) => void;
  emptyMessage?: string;
}

export class CardList {
  private container: HTMLElement | null = null;
  private props: CardListProps;
  private cardComponents: Map<string, CardComponent> = new Map();

  constructor(props: CardListProps) {
    this.props = props;
  }

  /**
   * Render the card list component
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

    const { cards, emptyMessage } = this.props;
    const hasCards = cards.length > 0;

    if (!hasCards) {
      this.container.innerHTML = `
        <div class="card-list-empty">
          <p class="empty-message">${emptyMessage || "No cards match your filters"}</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = `
      <div class="card-list">
        <div class="card-list-header">
          <h2 class="card-list-title">Cards (${cards.length})</h2>
        </div>
        <div class="card-list-grid" id="card-list-grid"></div>
      </div>
    `;

    // Render individual Card components
    this.renderCards();
  }

  /**
   * Render individual cards using Card components
   */
  private renderCards(): void {
    if (!this.container) return;

    const gridContainer = this.container.querySelector(".card-list-grid");
    if (!gridContainer) return;

    // Clear existing card components
    this.cardComponents.forEach((cardComponent) => {
      cardComponent.destroy();
    });
    this.cardComponents.clear();

    // Create Card component for each card
    this.props.cards.forEach((card) => {
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
   * Update the cards and re-render
   */
  updateCards(cards: Card[]): void {
    this.props.cards = cards;

    // Update existing card components or re-render if needed
    const currentCardNames = new Set(cards.map((c) => c.cardName));
    const existingCardNames = new Set(this.cardComponents.keys());

    // Remove cards that are no longer in the list
    existingCardNames.forEach((cardName) => {
      if (!currentCardNames.has(cardName)) {
        const cardComponent = this.cardComponents.get(cardName);
        if (cardComponent) {
          cardComponent.destroy();
          this.cardComponents.delete(cardName);
        }
      }
    });

    // Update or add cards
    if (this.container) {
      const gridContainer = this.container.querySelector(".card-list-grid");
      if (gridContainer) {
        cards.forEach((card) => {
          const existingComponent = this.cardComponents.get(card.cardName);
          if (existingComponent) {
            // Update existing component
            existingComponent.updateCard(card);
            existingComponent.updatePlayerNames(this.props.playerNames);
          } else {
            // Create new component
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
          }
        });

        // Update the count in the header
        const header = this.container.querySelector(".card-list-title");
        if (header) {
          header.textContent = `Cards (${cards.length})`;
        }
      }
    } else {
      // Container doesn't exist, do full re-render
      this.updateHTML();
    }
  }

  /**
   * Update props
   */
  updateProps(newProps: Partial<CardListProps>): void {
    const oldPlayerNames = this.props.playerNames;
    this.props = { ...this.props, ...newProps };

    // If player names changed, update all card components
    if (
      newProps.playerNames &&
      (newProps.playerNames.player1 !== oldPlayerNames.player1 ||
        newProps.playerNames.player2 !== oldPlayerNames.player2)
    ) {
      this.cardComponents.forEach((cardComponent) => {
        cardComponent.updatePlayerNames(this.props.playerNames);
      });
    }

    // If cards changed, update cards
    if (newProps.cards) {
      this.updateCards(newProps.cards);
    } else {
      this.updateHTML();
    }
  }

  /**
   * Get current cards
   */
  getCards(): Card[] {
    return this.props.cards;
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    // Clean up all card components
    this.cardComponents.forEach((cardComponent) => {
      cardComponent.destroy();
    });
    this.cardComponents.clear();
    this.container = null;
  }
}

