/**
 * Main application component/controller
 * Orchestrates all components and manages application state
 */

import type { Card, PlayerNames, CategoryFilter, AssignmentStatusFilter, CardAssignment } from "./types/index.js";
import { Header } from "./components/Header.js";
import { SearchBar } from "./components/SearchBar.js";
import { FilterSection } from "./components/FilterSection.js";
import { CardList } from "./components/CardList.js";
import { saveCardAssignment } from "./utils/db.js";

export interface AppProps {
    cards: Card[];
    playerNames: PlayerNames;
}

export class App {
    private container: HTMLElement;
    private cards: Card[];
    private playerNames: PlayerNames;
    private header: Header | null = null;
    private searchBar: SearchBar | null = null;
    private filterSection: FilterSection | null = null;
    private cardList: CardList | null = null;
    private selectedCategories: CategoryFilter[] = [];
    private selectedAssignmentStatus: AssignmentStatusFilter[] = [];
    private searchQuery: string = "";

    constructor(props: AppProps) {
        this.cards = props.cards;
        this.playerNames = props.playerNames;
        this.container = document.getElementById("app")!;
    }

    /**
     * Render the application
     */
    render(): void {
        this.container.innerHTML = `
      <div class="app">
        <div class="header-container"></div>
        <main class="app-main">
          <div class="search-section"></div>
          <div class="filter-section-container"></div>
          <div class="card-list">
            <!-- CardList component will go here -->
            <p>Cards will be displayed here (${this.cards.length} total cards)</p>
          </div>
        </main>
      </div>
    `;

        // Render child components
        this.renderHeader();
        this.renderSearchBar();
        this.renderFilterSection();
        this.renderCardList();
    }

    /**
     * Render Header component
     */
    private renderHeader(): void {
        const headerContainer = this.container.querySelector(".header-container");
        if (!headerContainer) return;

        this.header = new Header({
            playerNames: this.playerNames,
            onSettingsClick: () => {
                console.log("Settings clicked");
                // TODO: Open settings dialog
            },
            onExportClick: () => {
                console.log("Export clicked");
                // TODO: Implement export functionality
            },
            onImportClick: () => {
                console.log("Import clicked");
                // TODO: Implement import functionality
            },
        });
        this.header.render(headerContainer as HTMLElement);
    }

    /**
     * Render SearchBar component
     */
    private renderSearchBar(): void {
        const searchContainer = this.container.querySelector(".search-section");
        if (!searchContainer) return;

        this.searchBar = new SearchBar({
            onSearchChange: (query: string) => {
                this.searchQuery = query;
                console.log("Search query changed:", query);
                this.updateCardList();
            },
            placeholder: "Search cards...",
        });
        this.searchBar.render(searchContainer as HTMLElement);
    }

    /**
     * Render FilterSection component
     */
    private renderFilterSection(): void {
        const filterContainer = this.container.querySelector(
            ".filter-section-container"
        );
        if (!filterContainer) return;

        this.filterSection = new FilterSection({
            playerNames: this.playerNames,
            selectedCategories: this.selectedCategories,
            selectedAssignmentStatus: this.selectedAssignmentStatus,
            onCategoryChange: (categories: CategoryFilter[]) => {
                this.selectedCategories = categories;
                console.log("Categories changed:", categories);
                this.updateCardList();
            },
            onAssignmentStatusChange: (statuses: AssignmentStatusFilter[]) => {
                this.selectedAssignmentStatus = statuses;
                console.log("Assignment status changed:", statuses);
                this.updateCardList();
            },
            onClearFilters: () => {
                this.selectedCategories = [];
                this.selectedAssignmentStatus = [];
                this.searchQuery = "";
                if (this.searchBar) {
                    this.searchBar.clear();
                }
                if (this.filterSection) {
                    this.filterSection.updateFilters([], []);
                }
                console.log("Filters cleared");
                this.updateCardList();
            },
        });
        this.filterSection.render(filterContainer as HTMLElement);
    }

    /**
     * Render CardList component
     */
    private renderCardList(): void {
        const cardListContainer = this.container.querySelector(".card-list");
        if (!cardListContainer) return;

        // Get filtered cards (for now, return all cards - filtering will be implemented later)
        const filteredCards = this.getFilteredCards();

        this.cardList = new CardList({
            cards: filteredCards,
            playerNames: this.playerNames,
            onCardClick: (card: Card) => {
                console.log("Card clicked:", card.cardName);
                // TODO: Open card detail view or modal
            },
            onAssignmentChange: async (cardName: string, assignment: CardAssignment) => {
                console.log("Assignment changed:", cardName, assignment);
                // Save to IndexedDB
                await saveCardAssignment(cardName, assignment);
                // Update local card state
                const card = this.cards.find((c) => c.cardName === cardName);
                if (card) {
                    card.assignment = assignment;
                    // Update the card list if it exists
                    if (this.cardList) {
                        const filteredCards = this.getFilteredCards();
                        this.cardList.updateCards(filteredCards);
                    }
                }
            },
            emptyMessage: "No cards match your current filters",
        });
        this.cardList.render(cardListContainer as HTMLElement);
    }

    /**
     * Get filtered cards based on current filter state
     * TODO: Implement actual filtering logic
     */
    private getFilteredCards(): Card[] {
        // For now, return all cards
        // Filtering will be implemented in a later task
        return this.cards;
    }

    /**
     * Update the card list with filtered cards
     */
    private updateCardList(): void {
        if (this.cardList) {
            const filteredCards = this.getFilteredCards();
            this.cardList.updateCards(filteredCards);
        }
    }

    /**
     * Update cards and re-render
     */
    updateCards(cards: Card[]): void {
        this.cards = cards;
        if (this.cardList) {
            const filteredCards = this.getFilteredCards();
            this.cardList.updateCards(filteredCards);
        } else {
            this.render();
        }
    }

    /**
     * Update player names and re-render
     */
    updatePlayerNames(playerNames: PlayerNames): void {
        this.playerNames = playerNames;
        if (this.header) {
            this.header.updatePlayerNames(playerNames);
        }
        if (this.filterSection) {
            this.filterSection.updatePlayerNames(playerNames);
        }
        if (this.cardList) {
            this.cardList.updateProps({ playerNames });
        }
    }

    /**
     * Get current cards
     */
    getCards(): Card[] {
        return this.cards;
    }

    /**
     * Get current player names
     */
    getPlayerNames(): PlayerNames {
        return this.playerNames;
    }
}
