/**
 * Pinia store for cards data
 * Manages cards state, filtered cards, loading state, and card update actions
 */

import { defineStore } from "pinia";
import { ref, computed, type Ref, type ComputedRef } from "vue";
import type {
    Card,
    CardAssignment,
} from "../types/index.js";
import { useFiltersStore } from "./useFiltersStore.js";

export const useCardsStore = defineStore("cards", () => {
    // State
    const cards: Ref<Card[]> = ref([]);
    const isLoading: Ref<boolean> = ref(false);

    // Get filters store
    const filtersStore = useFiltersStore();

    // Computed: Filtered cards based on current filter state
    const filteredCards: ComputedRef<Card[]> = computed(() => {
        let filtered = [...cards.value];

        // Filter out trimmed cards unless "trimmed" is in assignment status filters
        const hasTrimmedFilter = filtersStore.assignmentStatus.includes("trimmed");
        if (!hasTrimmedFilter) {
            filtered = filtered.filter((card) => !card.trimmed);
        }

        // Apply search query filter
        if (filtersStore.searchQuery) {
            const query = filtersStore.searchQuery.toLowerCase();
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
        if (filtersStore.categories.length > 0) {
            filtered = filtered.filter((card) => {
                const cardCategories = card.definition
                    .split(",")
                    .map((cat) => cat.trim());
                return filtersStore.categories.some((filterCategory) =>
                    cardCategories.includes(filterCategory)
                );
            });
        }

        // Apply assignment status filter
        if (filtersStore.assignmentStatus.length > 0) {
            filtered = filtered.filter((card) => {
                // Check if card matches any of the selected assignment statuses
                // This is an OR operation - card matches if it satisfies any selected status

                // Check trimmed status
                if (
                    filtersStore.assignmentStatus.includes("trimmed") &&
                    card.trimmed
                ) {
                    return true;
                }

                // Check regular assignment statuses (unassigned, player1, player2, shared)
                // Only check if card is not trimmed (trimmed cards are handled separately)
                if (
                    !card.trimmed &&
                    filtersStore.assignmentStatus.includes(card.assignment)
                ) {
                    return true;
                }

                return false;
            });
        }

        return filtered;
    });

    // Computed: Get trimmed cards
    const trimmedCards: ComputedRef<Card[]> = computed(() => {
        return cards.value.filter((card) => card.trimmed);
    });

    // Actions
    function setCards(newCards: Card[]): void {
        cards.value = [...newCards];
    }

    function setIsLoading(loading: boolean): void {
        isLoading.value = loading;
    }

    function updateCardAssignment(
        cardName: string,
        assignment: CardAssignment
    ): void {
        const card = cards.value.find((c) => c.cardName === cardName);
        if (card) {
            card.assignment = assignment;
        }
    }

    function updateCardNotes(cardName: string, notes: string): void {
        const card = cards.value.find((c) => c.cardName === cardName);
        if (card) {
            card.notes = notes;
        }
    }

    function updateCardTrimmed(cardName: string, trimmed: boolean): void {
        const card = cards.value.find((c) => c.cardName === cardName);
        if (card) {
            card.trimmed = trimmed;
        }
    }

    function getCardByName(cardName: string): Card | undefined {
        return cards.value.find((c) => c.cardName === cardName);
    }

    return {
        // State
        cards,
        isLoading,
        // Computed
        filteredCards,
        trimmedCards,
        // Actions
        setCards,
        setIsLoading,
        updateCardAssignment,
        updateCardNotes,
        updateCardTrimmed,
        getCardByName,
    };
});

