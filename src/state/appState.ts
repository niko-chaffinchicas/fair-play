/**
 * Application state management
 * Centralized state for cards, filters, and player names
 */

import type {
    Card,
    PlayerNames,
    FilterState,
    CategoryFilter,
    AssignmentStatusFilter,
} from "../types/index.js";

export class AppState {
    private cards: Card[] = [];
    private playerNames: PlayerNames = { player1: "Player 1", player2: "Player 2" };
    private filters: FilterState = {
        searchQuery: "",
        categories: [],
        assignmentStatus: [],
    };
    private isLoading: boolean = false;
    private listeners: Set<() => void> = new Set();

    /**
     * Get all cards
     */
    getCards(): Card[] {
        return this.cards;
    }

    /**
     * Set cards and notify listeners
     */
    setCards(cards: Card[]): void {
        this.cards = cards;
        this.notifyListeners();
    }

    /**
     * Get player names
     */
    getPlayerNames(): PlayerNames {
        return this.playerNames;
    }

    /**
     * Set player names and notify listeners
     */
    setPlayerNames(playerNames: PlayerNames): void {
        this.playerNames = playerNames;
        this.notifyListeners();
    }

    /**
     * Get current filter state
     */
    getFilters(): FilterState {
        return { ...this.filters };
    }

    /**
     * Set search query
     */
    setSearchQuery(query: string): void {
        this.filters.searchQuery = query.trim();
        this.notifyListeners();
    }

    /**
     * Get search query
     */
    getSearchQuery(): string {
        return this.filters.searchQuery;
    }

    /**
     * Set category filters
     */
    setCategories(categories: CategoryFilter[]): void {
        this.filters.categories = [...categories];
        this.notifyListeners();
    }

    /**
     * Get category filters
     */
    getCategories(): CategoryFilter[] {
        return [...this.filters.categories];
    }

    /**
     * Set assignment status filters
     */
    setAssignmentStatus(statuses: AssignmentStatusFilter[]): void {
        this.filters.assignmentStatus = [...statuses];
        this.notifyListeners();
    }

    /**
     * Get assignment status filters
     */
    getAssignmentStatus(): AssignmentStatusFilter[] {
        return [...this.filters.assignmentStatus];
    }

    /**
     * Clear all filters
     */
    clearFilters(): void {
        this.filters = {
            searchQuery: "",
            categories: [],
            assignmentStatus: [],
        };
        this.notifyListeners();
    }

    /**
     * Get filtered cards based on current filter state
     */
    getFilteredCards(): Card[] {
        let filtered = [...this.cards];

        // Filter out trimmed cards unless "trimmed" is in assignment status filters
        const hasTrimmedFilter = this.filters.assignmentStatus.includes("trimmed");
        if (!hasTrimmedFilter) {
            filtered = filtered.filter((card) => !card.trimmed);
        }

        // Apply search query filter
        if (this.filters.searchQuery) {
            const query = this.filters.searchQuery.toLowerCase();
            filtered = filtered.filter((card) => {
                return (
                    card.cardName.toLowerCase().includes(query) ||
                    card.definition.toLowerCase().includes(query) ||
                    card.planning.toLowerCase().includes(query) ||
                    card.execution.toLowerCase().includes(query) ||
                    card.minimumStandardOfCare.toLowerCase().includes(query) ||
                    card.minimumStandardOfCareQuestion.toLowerCase().includes(query) ||
                    (card.notes && card.notes.toLowerCase().includes(query))
                );
            });
        }

        // Apply category filter
        if (this.filters.categories.length > 0) {
            filtered = filtered.filter((card) => {
                const cardCategories = card.definition
                    .split(",")
                    .map((cat) => cat.trim());
                return this.filters.categories.some((filterCategory) =>
                    cardCategories.includes(filterCategory)
                );
            });
        }

        // Apply assignment status filter
        if (this.filters.assignmentStatus.length > 0) {
            filtered = filtered.filter((card) => {
                // Check if card matches any of the selected assignment statuses
                // This is an OR operation - card matches if it satisfies any selected status

                // Check trimmed status
                if (this.filters.assignmentStatus.includes("trimmed") && card.trimmed) {
                    return true;
                }

                // Check regular assignment statuses (unassigned, player1, player2, shared)
                // Only check if card is not trimmed (trimmed cards are handled separately)
                if (!card.trimmed && this.filters.assignmentStatus.includes(card.assignment)) {
                    return true;
                }

                return false;
            });
        }

        return filtered;
    }

    /**
     * Get loading state
     */
    getIsLoading(): boolean {
        return this.isLoading;
    }

    /**
     * Set loading state
     */
    setIsLoading(loading: boolean): void {
        this.isLoading = loading;
        this.notifyListeners();
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of state changes
     */
    private notifyListeners(): void {
        this.listeners.forEach((listener) => listener());
    }
}

