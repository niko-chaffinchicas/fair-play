/**
 * Card data composable
 * Handles loading and merging card definitions with user data
 */

import { ref, type Ref } from "vue";
import {
    loadCardDefinitions,
    getDefinitionsMetadata,
    mergeCardData,
    loadAllCardData,
} from "../utils/data.js";
import type { Card } from "../types/index.js";

/**
 * Composable for card data operations
 * Provides reactive state and functions for loading card data
 */
export function useCardData() {
    const cards: Ref<Card[]> = ref([]);
    const isLoading: Ref<boolean> = ref(false);
    const error: Ref<Error | null> = ref(null);

    /**
     * Load all card data (definitions + user data)
     */
    async function loadCards(): Promise<Card[]> {
        isLoading.value = true;
        error.value = null;
        try {
            const loadedCards = await loadAllCardData();
            cards.value = loadedCards;
            return loadedCards;
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            error.value = errorObj;
            throw errorObj;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Reload cards from IndexedDB and merge with definitions
     */
    async function reloadCards(): Promise<Card[]> {
        return loadCards();
    }

    return {
        // State
        cards,
        isLoading,
        error,
        // Functions
        loadCards,
        reloadCards,
        // Utility functions (re-exported from utils/data.ts)
        loadCardDefinitions,
        getDefinitionsMetadata,
        mergeCardData,
    };
}

