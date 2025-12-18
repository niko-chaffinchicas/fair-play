/**
 * IndexedDB composable
 * Wraps IndexedDB operations for card data
 * Uses existing utils/db.ts functions to maintain compatibility
 */

import {
  openDatabase,
  getCard,
  getAllCards,
  saveCardAssignment,
  saveCardNotes,
  saveCardTrimmed,
  saveCardData,
  getTrimmedCards,
  clearAllCards,
} from "../utils/db.js";
import type { CardData, CardAssignment } from "../types/index.js";

/**
 * Composable for IndexedDB operations
 * Returns functions for interacting with card data in IndexedDB
 */
export function useIndexedDB() {
  return {
    openDatabase,
    getCard,
    getAllCards,
    saveCardAssignment,
    saveCardNotes,
    saveCardTrimmed,
    saveCardData,
    getTrimmedCards,
    clearAllCards,
  };
}

