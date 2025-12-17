/**
 * IndexedDB wrapper utilities for card data storage
 * Uses the 'idb' library for easier IndexedDB operations
 */

import { openDB, type IDBPDatabase, type DBSchema } from "idb";
import type { CardData, CardAssignment } from "../types/index.js";

const DB_NAME = "fairPlayCardManager";
const DB_VERSION = 1;

const STORES = {
    CARDS: "cards", // Store for card assignments, notes, and trimmed state
} as const;

/**
 * Database schema for TypeScript typing
 */
type FairPlayDBSchema = {
    cards: {
        key: string;
        value: CardData;
        indexes: {
            assignment: CardAssignment;
            trimmed: boolean;
        };
    };
} & DBSchema;

/**
 * Create default card data structure
 * @param cardName - The name of the card
 * @returns Default card data object
 */
function createDefaultCardData(cardName: string): CardData {
    return {
        cardName,
        assignment: "unassigned",
        notes: "",
        trimmed: false,
    };
}

/**
 * Get existing card data or create default if it doesn't exist
 * @param store - The IndexedDB object store
 * @param cardName - The name of the card
 * @returns Card data (existing or default)
 */
async function getOrCreateCardData(
    store: {
        get(key: string): Promise<CardData | undefined>;
        put(value: CardData): Promise<string | number>;
    },
    cardName: string
): Promise<CardData> {
    let cardData = await store.get(cardName);
    if (!cardData) {
        cardData = createDefaultCardData(cardName);
    }
    return cardData;
}

/**
 * Initialize and open the IndexedDB database
 * @returns Database instance
 */
export async function openDatabase(): Promise<IDBPDatabase<FairPlayDBSchema>> {
    return openDB<FairPlayDBSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Create object store for cards if it doesn't exist
            if (!db.objectStoreNames.contains(STORES.CARDS)) {
                const cardStore = db.createObjectStore(STORES.CARDS, {
                    keyPath: "cardName",
                });
                // Create index for faster queries if needed
                cardStore.createIndex("assignment", "assignment", { unique: false });
                cardStore.createIndex("trimmed", "trimmed", { unique: false });
            }
        },
    });
}

/**
 * Get card data from IndexedDB
 * @param cardName - The name of the card
 * @returns Card data or undefined if not found
 */
export async function getCard(cardName: string): Promise<CardData | undefined> {
    const db = await openDatabase();
    return db.get(STORES.CARDS, cardName);
}

/**
 * Get all cards from IndexedDB
 * @returns Array of all card data
 */
export async function getAllCards(): Promise<CardData[]> {
    const db = await openDatabase();
    return db.getAll(STORES.CARDS);
}

/**
 * Save card assignment to IndexedDB
 * @param cardName - The name of the card
 * @param assignment - Assignment value
 * @returns Promise that resolves when saved
 */
export async function saveCardAssignment(
    cardName: string,
    assignment: CardAssignment
): Promise<void> {
    const db = await openDatabase();
    const tx = db.transaction(STORES.CARDS, "readwrite");
    const store = tx.objectStore(STORES.CARDS);

    // Get existing card data or create new entry
    const cardData = await getOrCreateCardData(store, cardName);

    // Update assignment
    cardData.assignment = assignment;
    cardData.lastUpdated = new Date().toISOString();

    await store.put(cardData);
    await tx.done;
}

/**
 * Save card notes to IndexedDB
 * @param cardName - The name of the card
 * @param notes - The notes text
 * @returns Promise that resolves when saved
 */
export async function saveCardNotes(cardName: string, notes: string): Promise<void> {
    const db = await openDatabase();
    const tx = db.transaction(STORES.CARDS, "readwrite");
    const store = tx.objectStore(STORES.CARDS);

    // Get existing card data or create new entry
    const cardData = await getOrCreateCardData(store, cardName);

    // Update notes
    cardData.notes = notes || "";
    cardData.lastUpdated = new Date().toISOString();

    await store.put(cardData);
    await tx.done;
}

/**
 * Save trimmed card state to IndexedDB
 * @param cardName - The name of the card
 * @param trimmed - Whether the card is trimmed
 * @returns Promise that resolves when saved
 */
export async function saveCardTrimmed(cardName: string, trimmed: boolean): Promise<void> {
    const db = await openDatabase();
    const tx = db.transaction(STORES.CARDS, "readwrite");
    const store = tx.objectStore(STORES.CARDS);

    // Get existing card data or create new entry
    const cardData = await getOrCreateCardData(store, cardName);

    // Update trimmed state
    cardData.trimmed = trimmed;
    cardData.lastUpdated = new Date().toISOString();

    await store.put(cardData);
    await tx.done;
}

/**
 * Save complete card data (assignment, notes, trimmed) in one operation
 * @param cardName - The name of the card
 * @param cardData - Object with assignment, notes, and/or trimmed properties
 * @returns Promise that resolves when saved
 */
export async function saveCardData(
    cardName: string,
    cardData: Partial<Omit<CardData, "cardName" | "lastUpdated">>
): Promise<void> {
    const db = await openDatabase();
    const tx = db.transaction(STORES.CARDS, "readwrite");
    const store = tx.objectStore(STORES.CARDS);

    // Get existing card data or create new entry
    const existingData = await getOrCreateCardData(store, cardName);

    // Update with new data
    if (cardData.assignment !== undefined) {
        existingData.assignment = cardData.assignment;
    }
    if (cardData.notes !== undefined) {
        existingData.notes = cardData.notes;
    }
    if (cardData.trimmed !== undefined) {
        existingData.trimmed = cardData.trimmed;
    }
    existingData.lastUpdated = new Date().toISOString();

    await store.put(existingData);
    await tx.done;
}

/**
 * Get all trimmed cards
 * @returns Array of trimmed card data
 */
export async function getTrimmedCards(): Promise<CardData[]> {
    const db = await openDatabase();
    const tx = db.transaction(STORES.CARDS, "readonly");
    const index = tx.store.index("trimmed");
    return index.getAll(IDBKeyRange.only(true)); // Get all where trimmed === true
}

/**
 * Clear all card data from IndexedDB (useful for testing or reset)
 * @returns Promise that resolves when cleared
 */
export async function clearAllCards(): Promise<void> {
    const db = await openDatabase();
    const tx = db.transaction(STORES.CARDS, "readwrite");
    await tx.store.clear();
    await tx.done;
}

