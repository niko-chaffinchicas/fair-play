/**
 * IndexedDB wrapper utilities for card data storage
 * Uses the 'idb' library for easier IndexedDB operations
 */

import { openDB } from "idb";

const DB_NAME = "fairPlayCardManager";
const DB_VERSION = 1;

const STORES = {
  CARDS: "cards", // Store for card assignments, notes, and trimmed state
};

/**
 * Create default card data structure
 * @param {string} cardName - The name of the card
 * @returns {Object} Default card data object
 */
function createDefaultCardData(cardName) {
  return {
    cardName,
    assignment: "unassigned",
    notes: "",
    trimmed: false,
  };
}

/**
 * Get existing card data or create default if it doesn't exist
 * @param {IDBObjectStore} store - The IndexedDB object store
 * @param {string} cardName - The name of the card
 * @returns {Promise<Object>} Card data (existing or default)
 */
async function getOrCreateCardData(store, cardName) {
  let cardData = await store.get(cardName);
  if (!cardData) {
    cardData = createDefaultCardData(cardName);
  }
  return cardData;
}

/**
 * Initialize and open the IndexedDB database
 * @returns {Promise<IDBPDatabase>} Database instance
 */
export async function openDatabase() {
  return openDB(DB_NAME, DB_VERSION, {
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
 * @param {string} cardName - The name of the card
 * @returns {Promise<Object|null>} Card data or null if not found
 */
export async function getCard(cardName) {
  const db = await openDatabase();
  return db.get(STORES.CARDS, cardName);
}

/**
 * Get all cards from IndexedDB
 * @returns {Promise<Array>} Array of all card data
 */
export async function getAllCards() {
  const db = await openDatabase();
  return db.getAll(STORES.CARDS);
}

/**
 * Save card assignment to IndexedDB
 * @param {string} cardName - The name of the card
 * @param {string} assignment - Assignment value: "unassigned", "player1", "player2", or "shared"
 * @returns {Promise<void>}
 */
export async function saveCardAssignment(cardName, assignment) {
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
 * @param {string} cardName - The name of the card
 * @param {string} notes - The notes text
 * @returns {Promise<void>}
 */
export async function saveCardNotes(cardName, notes) {
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
 * @param {string} cardName - The name of the card
 * @param {boolean} trimmed - Whether the card is trimmed
 * @returns {Promise<void>}
 */
export async function saveCardTrimmed(cardName, trimmed) {
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
 * @param {string} cardName - The name of the card
 * @param {Object} cardData - Object with assignment, notes, and/or trimmed properties
 * @returns {Promise<void>}
 */
export async function saveCardData(cardName, cardData) {
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
 * @returns {Promise<Array>} Array of trimmed card data
 */
export async function getTrimmedCards() {
  const db = await openDatabase();
  const tx = db.transaction(STORES.CARDS, "readonly");
  const index = tx.store.index("trimmed");
  return index.getAll(true); // Get all where trimmed === true
}

/**
 * Clear all card data from IndexedDB (useful for testing or reset)
 * @returns {Promise<void>}
 */
export async function clearAllCards() {
  const db = await openDatabase();
  const tx = db.transaction(STORES.CARDS, "readwrite");
  await tx.store.clear();
  await tx.done;
}
