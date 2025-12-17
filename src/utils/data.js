/**
 * Data loading, merging, and transformation utilities
 */

import definitionsData from "../data/definitions.json";
import { getAllCards } from "./db.js";

/**
 * Load card definitions from definitions.json
 * @returns {Array} Array of card definition objects
 */
export function loadCardDefinitions() {
  return definitionsData.cards || [];
}

/**
 * Get metadata from definitions.json
 * @returns {Object} Metadata object
 */
export function getDefinitionsMetadata() {
  return definitionsData.metadata || {};
}

/**
 * Merge loaded user data (assignments, notes, trimmed) with card definitions
 * @param {Array} definitions - Array of card definitions from definitions.json
 * @param {Array} userCards - Array of user card data from IndexedDB
 * @returns {Array} Merged array of cards with user data applied
 */
export function mergeCardData(definitions, userCards) {
  // Create a map of user card data by card name for quick lookup
  const userDataMap = new Map();
  if (userCards && Array.isArray(userCards)) {
    userCards.forEach((userCard) => {
      userDataMap.set(userCard.cardName, userCard);
    });
  }

  // Merge definitions with user data
  return definitions.map((definition) => {
    const userData = userDataMap.get(definition.cardName);

    if (userData) {
      // User has data for this card, merge it
      return {
        ...definition,
        assignment: userData.assignment || "unassigned",
        notes: userData.notes || "",
        trimmed: userData.trimmed || false,
      };
    } else {
      // No user data, use defaults
      return {
        ...definition,
        assignment: "unassigned",
        notes: "",
        trimmed: false,
      };
    }
  });
}

/**
 * Initialize default state for first-time users (all cards unassigned)
 * This function can be used to ensure all cards have default values
 * @param {Array} definitions - Array of card definitions
 * @returns {Array} Array of cards with default state
 */
export function initializeDefaultState(definitions) {
  return definitions.map((definition) => ({
    ...definition,
    assignment: "unassigned",
    notes: "",
    trimmed: false,
  }));
}

/**
 * Load all card data (definitions + user data) for the application
 * This is the main function to call on app startup
 * @returns {Promise<Array>} Array of merged card data ready for use
 */
export async function loadAllCardData() {
  // Load card definitions from JSON
  const definitions = loadCardDefinitions();

  // Load user data from IndexedDB
  const userCards = await getAllCards();

  // Merge them together
  return mergeCardData(definitions, userCards);
}

