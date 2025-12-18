/**
 * Main application component/controller
 * Orchestrates all components and manages application state
 */

import type { Card, PlayerNames, CategoryFilter, AssignmentStatusFilter, CardAssignment } from "./types/index.js";
import { Header } from "./components/Header.js";
import { SearchBar } from "./components/SearchBar.js";
import { FilterSection } from "./components/FilterSection.js";
import { CardList } from "./components/CardList.js";
import { TrimmedCardsSection } from "./components/TrimmedCardsSection.js";
import { CardDetails } from "./components/CardDetails.js";
import { PlayerNameEditor } from "./components/PlayerNameEditor.js";
import { AppState } from "./state/appState.js";
import { saveCardAssignment, saveCardNotes, saveCardTrimmed } from "./utils/db.js";
import { setPlayerNames } from "./utils/storage.js";

export interface AppProps {
    cards: Card[];
    playerNames: PlayerNames;
}

export class App {
    private container: HTMLElement;
    private cards: Card[];
    private playerNames: PlayerNames;
    private appState: AppState;
    private header: Header | null = null;
    private searchBar: SearchBar | null = null;
    private filterSection: FilterSection | null = null;
    private cardList: CardList | null = null;
    private trimmedCardsSection: TrimmedCardsSection | null = null;
    private cardDetails: CardDetails | null = null;

    constructor(props: AppProps) {
        this.cards = props.cards;
        this.playerNames = props.playerNames;
        this.container = document.getElementById("app")!;

        // Initialize app state
        this.appState = new AppState();
        this.appState.setCards(this.cards);
        this.appState.setPlayerNames(this.playerNames);

        // Subscribe to state changes to update UI
        this.appState.subscribe(() => {
            this.handleStateChange();
        });
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
          <div class="trimmed-cards-section-container"></div>
        </main>
      </div>
    `;

        // Render child components
        this.renderHeader();
        this.renderSearchBar();
        this.renderFilterSection();
        this.renderCardList();
        this.renderTrimmedCardsSection();
    }

    /**
     * Render Header component
     */
    private renderHeader(): void {
        const headerContainer = this.container.querySelector(".header-container");
        if (!headerContainer) return;

        this.header = new Header({
            playerNames: this.playerNames,
            trimmedCount: this.getTrimmedCount(),
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
            onPlayerNamesClick: () => {
                this.openPlayerNameEditor();
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
                this.appState.setSearchQuery(query);
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
            selectedCategories: this.appState.getCategories(),
            selectedAssignmentStatus: this.appState.getAssignmentStatus(),
            onCategoryChange: (categories: CategoryFilter[]) => {
                this.appState.setCategories(categories);
            },
            onAssignmentStatusChange: (statuses: AssignmentStatusFilter[]) => {
                this.appState.setAssignmentStatus(statuses);
            },
            onClearFilters: () => {
                this.appState.clearFilters();
                if (this.searchBar) {
                    this.searchBar.clear();
                }
                if (this.filterSection) {
                    this.filterSection.updateFilters([], []);
                }
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
                this.openCardDetails(card);
            },
            onAssignmentChange: async (cardName: string, assignment: CardAssignment) => {
                console.log("Assignment changed:", cardName, assignment);
                // Save to IndexedDB
                await saveCardAssignment(cardName, assignment);
                // Update local card state
                const card = this.cards.find((c) => c.cardName === cardName);
                if (card) {
                    card.assignment = assignment;
                    // Update appState to trigger state change
                    this.appState.setCards(this.cards);
                }
            },
            onNotesChange: async (cardName: string, notes: string) => {
                console.log("Notes changed:", cardName, notes.length, "chars");
                // Save to IndexedDB
                await saveCardNotes(cardName, notes);
                // Update local card state
                const card = this.cards.find((c) => c.cardName === cardName);
                if (card) {
                    card.notes = notes;
                    // Update appState to trigger state change
                    this.appState.setCards(this.cards);
                }
            },
            onTrimChange: async (cardName: string, trimmed: boolean) => {
                console.log("Trim changed:", cardName, trimmed);
                // Save to IndexedDB
                await saveCardTrimmed(cardName, trimmed);
                // Update local card state
                const card = this.cards.find((c) => c.cardName === cardName);
                if (card) {
                    card.trimmed = trimmed;
                    // Update appState to trigger state change
                    this.appState.setCards(this.cards);
                    // Also update trimmed cards section directly
                    if (this.trimmedCardsSection) {
                        this.trimmedCardsSection.updateCards(this.cards);
                    }
                }
            },
            emptyMessage: "No cards match your current filters",
        });
        this.cardList.render(cardListContainer as HTMLElement);
    }

    /**
     * Render TrimmedCardsSection component
     */
    private renderTrimmedCardsSection(): void {
        const trimmedContainer = this.container.querySelector(
            ".trimmed-cards-section-container"
        );
        if (!trimmedContainer) return;

        this.trimmedCardsSection = new TrimmedCardsSection({
            cards: this.cards,
            playerNames: this.playerNames,
            onCardClick: (card: Card) => {
                this.openCardDetails(card);
            },
            onAssignmentChange: async (cardName: string, assignment: CardAssignment) => {
                console.log("Assignment changed:", cardName, assignment);
                await saveCardAssignment(cardName, assignment);
                const card = this.cards.find((c) => c.cardName === cardName);
                if (card) {
                    card.assignment = assignment;
                    this.appState.setCards(this.cards);
                    // Also update trimmed cards section directly
                    if (this.trimmedCardsSection) {
                        this.trimmedCardsSection.updateCards(this.cards);
                    }
                }
            },
            onNotesChange: async (cardName: string, notes: string) => {
                console.log("Notes changed:", cardName, notes.length, "chars");
                await saveCardNotes(cardName, notes);
                const card = this.cards.find((c) => c.cardName === cardName);
                if (card) {
                    card.notes = notes;
                    this.appState.setCards(this.cards);
                    // Also update trimmed cards section directly
                    if (this.trimmedCardsSection) {
                        this.trimmedCardsSection.updateCards(this.cards);
                    }
                }
            },
            onTrimChange: async (cardName: string, trimmed: boolean) => {
                console.log("Trim changed:", cardName, trimmed);
                await saveCardTrimmed(cardName, trimmed);
                const card = this.cards.find((c) => c.cardName === cardName);
                if (card) {
                    card.trimmed = trimmed;
                    this.appState.setCards(this.cards);
                    // Also update trimmed cards section directly
                    if (this.trimmedCardsSection) {
                        this.trimmedCardsSection.updateCards(this.cards);
                    }
                }
            },
        });
        this.trimmedCardsSection.render(trimmedContainer as HTMLElement);
    }

    /**
     * Get filtered cards based on current filter state
     */
    private getFilteredCards(): Card[] {
        return this.appState.getFilteredCards();
    }

    /**
     * Get count of trimmed cards
     */
    private getTrimmedCount(): number {
        return this.cards.filter((card) => card.trimmed).length;
    }

    /**
     * Update trimmed count in header
     */
    private updateTrimmedCount(): void {
        if (this.header) {
            this.header.updateTrimmedCount(this.getTrimmedCount());
        }
    }

    /**
     * Handle state changes from appState
     * Updates UI components when filters or cards change
     */
    private handleStateChange(): void {
        const filteredCards = this.getFilteredCards();

        // Update card list
        if (this.cardList) {
            this.cardList.updateCards(filteredCards);
        }

        // Update trimmed cards section
        if (this.trimmedCardsSection) {
            this.trimmedCardsSection.updateCards(this.cards);
        }

        // Update trimmed count in header
        this.updateTrimmedCount();
    }

    /**
     * Update cards and re-render
     */
    updateCards(cards: Card[]): void {
        this.cards = cards;
        this.appState.setCards(cards);
        // handleStateChange will be called automatically via subscription
        // But we also need to update trimmed section separately
        if (this.trimmedCardsSection) {
            this.trimmedCardsSection.updateCards(this.cards);
        }
        // Update trimmed count in header
        this.updateTrimmedCount();
    }

    /**
     * Update player names and re-render
     */
    updatePlayerNames(playerNames: PlayerNames): void {
        this.playerNames = playerNames;
        this.appState.setPlayerNames(playerNames);
        if (this.header) {
            this.header.updatePlayerNames(playerNames);
        }
        if (this.filterSection) {
            this.filterSection.updatePlayerNames(playerNames);
        }
        if (this.cardList) {
            this.cardList.updateProps({ playerNames });
        }
        if (this.trimmedCardsSection) {
            this.trimmedCardsSection.updatePlayerNames(playerNames);
        }
        if (this.cardDetails) {
            this.cardDetails.updatePlayerNames(playerNames);
        }
    }

    /**
     * Open player name editor dialog
     */
    private openPlayerNameEditor(): void {
        const editor = new PlayerNameEditor({
            playerNames: this.playerNames,
            mode: "dialog",
            onSave: async (newPlayerNames: PlayerNames) => {
                // Save to localStorage
                setPlayerNames(newPlayerNames);
                // Update app state
                this.updatePlayerNames(newPlayerNames);
                console.log("Player names updated:", newPlayerNames);
            },
            onCancel: () => {
                console.log("Player name editing cancelled");
            },
        });
        editor.render();
    }

    /**
     * Open card details modal
     */
    private openCardDetails(card: Card): void {
        // Close existing modal if open
        if (this.cardDetails) {
            this.cardDetails.destroy();
        }

        this.cardDetails = new CardDetails({
            card,
            playerNames: this.playerNames,
            onClose: () => {
                this.cardDetails = null;
            },
            onAssignmentChange: async (cardName: string, assignment: CardAssignment) => {
                console.log("Assignment changed in details:", cardName, assignment);
                await saveCardAssignment(cardName, assignment);
                const card = this.cards.find((c) => c.cardName === cardName);
                if (card) {
                    card.assignment = assignment;
                    // Update the modal
                    if (this.cardDetails) {
                        this.cardDetails.updateCard(card);
                    }
                    // Update appState to trigger state change
                    this.appState.setCards(this.cards);
                    // Also update trimmed cards section directly
                    if (this.trimmedCardsSection) {
                        this.trimmedCardsSection.updateCards(this.cards);
                    }
                }
            },
            onNotesChange: async (cardName: string, notes: string) => {
                console.log("Notes changed in details:", cardName, notes.length, "chars");
                await saveCardNotes(cardName, notes);
                const card = this.cards.find((c) => c.cardName === cardName);
                if (card) {
                    card.notes = notes;
                    // Update the modal
                    if (this.cardDetails) {
                        this.cardDetails.updateCard(card);
                    }
                    // Update appState to trigger state change
                    this.appState.setCards(this.cards);
                    // Also update trimmed cards section directly
                    if (this.trimmedCardsSection) {
                        this.trimmedCardsSection.updateCards(this.cards);
                    }
                }
            },
            onTrimChange: async (cardName: string, trimmed: boolean) => {
                console.log("Trim changed in details:", cardName, trimmed);
                await saveCardTrimmed(cardName, trimmed);
                const card = this.cards.find((c) => c.cardName === cardName);
                if (card) {
                    card.trimmed = trimmed;
                    // Update the modal
                    if (this.cardDetails) {
                        this.cardDetails.updateCard(card);
                    }
                    // Update appState to trigger state change
                    this.appState.setCards(this.cards);
                    // Also update trimmed cards section directly
                    if (this.trimmedCardsSection) {
                        this.trimmedCardsSection.updateCards(this.cards);
                    }
                }
            },
        });
        this.cardDetails.render();
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
