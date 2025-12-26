/**
 * Google Sheets sync composable
 * Handles bidirectional synchronization with Google Sheets via Apps Script
 */

import { ref, type Ref } from "vue";
import { useSyncStore } from "../stores/useSyncStore.js";
import { useCardsStore } from "../stores/useCardsStore.js";
import { getAllCards, saveCardData } from "../utils/db.js";
import {
    generateCardId,
    shouldCardHaveId,
    assignmentToInteger,
    integerToAssignment,
} from "../utils/cardId.js";
import { useDebounce } from "./useDebounce.js";
import type {
    CardData,
    GoogleSheetCardData,
    MergeStrategy,
} from "../types/index.js";

/**
 * Composable for Google Sheets synchronization
 */
export function useGoogleSheetsSync() {
    const syncStore = useSyncStore();
    const cardsStore = useCardsStore();

    /**
     * Sync card data to Google Sheet (write)
     * Only syncs cards that have UUIDs (excludes CPE/MSC)
     */
    async function syncToSheet(): Promise<void> {
        if (!syncStore.googleSheetUrl) {
            throw new Error("Google Sheet URL not configured");
        }

        // Get all card data from IndexedDB (this includes UUIDs)
        const allCardData = await getAllCards();

        // Filter to only cards with UUIDs (exclude CPE/MSC)
        const cardsToSync = allCardData.filter((cardData) => {
            return cardData.id && shouldCardHaveId(cardData.cardName);
        });

        if (cardsToSync.length === 0) {
            console.warn("No cards to sync");
            return; // Nothing to sync
        }

        // Get current card state from store for assignment and trimmed status
        const cardsMap = new Map(
            cardsStore.cards.map((card) => [card.cardName, card])
        );

        // Convert cards to Google Sheet format
        const sheetData: GoogleSheetCardData[] = cardsToSync.map((cardData) => {
            const card = cardsMap.get(cardData.cardName);
            return {
                cardId: cardData.id!,
                cardName: cardData.cardName,
                assignment: card
                    ? assignmentToInteger(card.assignment)
                    : assignmentToInteger(cardData.assignment),
                trimmed: card ? (card.trimmed ? 1 : 0) : (cardData.trimmed ? 1 : 0),
                lastUpdated: cardData.lastUpdated || new Date().toISOString(),
            };
        });

        // POST to Apps Script endpoint
        const formData = new FormData();
        formData.append("action", "update");
        formData.append("data", JSON.stringify(sheetData));

        const response = await fetch(syncStore.googleSheetUrl, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to sync to sheet: ${response.status} ${response.statusText}. ${errorText}`
            );
        }
    }

    /**
     * Sync card data from Google Sheet (read)
     */
    async function syncFromSheet(): Promise<GoogleSheetCardData[]> {
        if (!syncStore.googleSheetUrl) {
            throw new Error("Google Sheet URL not configured");
        }

        // GET from Apps Script endpoint
        const url = new URL(syncStore.googleSheetUrl);
        url.searchParams.append("action", "get");

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to sync from sheet: ${response.status} ${response.statusText}. ${errorText}`
            );
        }

        // Check if we got JSON or HTML
        const contentType = response.headers.get("content-type") || "";
        const responseText = await response.text();

        // If we got HTML instead of JSON, the Apps Script might not be configured correctly
        if (contentType.includes("text/html") || responseText.trim().startsWith("<")) {
            throw new Error(
                "Received HTML instead of JSON. Please ensure your Google Apps Script web app is configured to return JSON. " +
                "The script should use `ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)` for GET requests."
            );
        }

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error(
                `Failed to parse response as JSON. The response may be HTML or invalid JSON. ` +
                `Response preview: ${responseText.substring(0, 200)}`
            );
        }

        // Validate response structure
        if (!Array.isArray(data)) {
            throw new Error("Invalid response from sheet: expected array");
        }

        return data as GoogleSheetCardData[];
    }

    /**
     * Merge sheet data with local data using standard strategy (newer wins)
     */
    function mergeCardData(
        sheetData: GoogleSheetCardData[],
        localCards: CardData[]
    ): CardData[] {
        const localMap = new Map<string, CardData>();
        localCards.forEach((card) => {
            localMap.set(card.cardName, card);
        });

        const sheetMap = new Map<string, GoogleSheetCardData>();
        sheetData.forEach((sheetCard) => {
            sheetMap.set(sheetCard.cardName, sheetCard);
        });

        const merged: CardData[] = [];

        // Process cards from sheet
        for (const sheetCard of sheetData) {
            const localCard = localMap.get(sheetCard.cardName);

            if (localCard) {
                // Card exists in both - compare timestamps
                const sheetTime = new Date(sheetCard.lastUpdated).getTime();
                const localTime = localCard.lastUpdated
                    ? new Date(localCard.lastUpdated).getTime()
                    : 0;

                if (sheetTime > localTime) {
                    // Sheet is newer - use sheet data
                    merged.push({
                        cardName: sheetCard.cardName,
                        id: sheetCard.cardId,
                        assignment: integerToAssignment(sheetCard.assignment),
                        notes: localCard.notes || "", // Preserve notes (not in sheet)
                        trimmed: sheetCard.trimmed === 1,
                        lastUpdated: sheetCard.lastUpdated,
                    });
                } else {
                    // Local is newer or equal - use local data
                    merged.push({
                        ...localCard,
                        id: sheetCard.cardId, // Update ID if it exists in sheet
                    });
                }
            } else {
                // Card exists only in sheet - add it
                merged.push({
                    cardName: sheetCard.cardName,
                    id: sheetCard.cardId,
                    assignment: integerToAssignment(sheetCard.assignment),
                    notes: "",
                    trimmed: sheetCard.trimmed === 1,
                    lastUpdated: sheetCard.lastUpdated,
                });
            }
        }

        // Add local cards that aren't in sheet
        for (const localCard of localCards) {
            if (!sheetMap.has(localCard.cardName)) {
                merged.push(localCard);
            }
        }

        return merged;
    }

    /**
     * Merge sheet data with local data using user preference
     */
    function mergeCardDataWithPreference(
        sheetData: GoogleSheetCardData[],
        localCards: CardData[],
        strategy: MergeStrategy
    ): CardData[] {
        if (strategy === "use-sheet") {
            // Use sheet data as source of truth
            const localMap = new Map<string, CardData>();
            localCards.forEach((card) => {
                localMap.set(card.cardName, card);
            });

            const merged: CardData[] = [];

            // Process cards from sheet - use sheet data regardless of timestamps
            for (const sheetCard of sheetData) {
                const localCard = localMap.get(sheetCard.cardName);
                merged.push({
                    cardName: sheetCard.cardName,
                    id: sheetCard.cardId,
                    assignment: integerToAssignment(sheetCard.assignment),
                    notes: localCard?.notes || "", // Preserve notes from local if available
                    trimmed: sheetCard.trimmed === 1,
                    lastUpdated: sheetCard.lastUpdated,
                });
            }

            // Add local cards that aren't in sheet (preserve them)
            for (const localCard of localCards) {
                const existsInSheet = sheetData.some(
                    (sc) => sc.cardName === localCard.cardName
                );
                if (!existsInSheet) {
                    merged.push(localCard);
                }
            }

            return merged;
        } else {
            // Use standard merge (newer wins)
            return mergeCardData(sheetData, localCards);
        }
    }

    /**
     * Perform bidirectional sync
     */
    async function sync(strategy?: MergeStrategy): Promise<void> {
        syncStore.startSync();
        syncStore.setError(null);

        try {
            // Read from sheet first
            const sheetData = await syncFromSheet();

            // Get local cards
            const localCards = await getAllCards();

            // Merge data
            const mergedCards =
                strategy !== undefined
                    ? mergeCardDataWithPreference(sheetData, localCards, strategy)
                    : mergeCardData(sheetData, localCards);

            // Save merged data to IndexedDB
            for (const cardData of mergedCards) {
                await saveCardData(cardData.cardName, {
                    id: cardData.id,
                    assignment: cardData.assignment,
                    notes: cardData.notes,
                    trimmed: cardData.trimmed,
                });
            }

            // Reload cards in store
            const { useCardData } = await import("./useCardData.js");
            const cardData = useCardData();
            const updatedCards = await cardData.loadCards();
            cardsStore.setCards(updatedCards);

            // Write merged data back to sheet
            await syncToSheet();

            syncStore.finishSync();
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Unknown sync error";
            syncStore.setError(errorMessage);
            syncStore.isSyncing = false;
            throw err;
        }
    }

    /**
     * Auto-sync (write only, assumes local changes are newer)
     */
    async function autoSync(): Promise<void> {
        if (!syncStore.googleSheetUrl || syncStore.isSyncing) {
            return;
        }

        syncStore.startSync();
        syncStore.setError(null);

        try {
            await syncToSheet();
            syncStore.finishSync();
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Unknown sync error";
            syncStore.setError(errorMessage);
            syncStore.isSyncing = false;
            throw err;
        }
    }

    // Create debounced auto-sync function that returns a Promise
    let pendingPromise: Promise<void> | null = null;
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    function debouncedAutoSync(): Promise<void> {
        // Cancel any pending debounce
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
        }

        // Create a new promise that will resolve when the sync actually happens
        return new Promise((resolve, reject) => {
            debounceTimeout = setTimeout(async () => {
                debounceTimeout = null;
                try {
                    await autoSync();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            }, 2000);
        });
    }

    return {
        sync,
        autoSync: debouncedAutoSync,
        syncToSheet,
        syncFromSheet,
        mergeCardData,
        mergeCardDataWithPreference,
    };
}

