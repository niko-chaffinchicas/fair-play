/**
 * Data loading, merging, and transformation utilities
 */

import definitionsData from "../data/definitions.json";
import { getAllCards } from "./db.js";
import type {
  CardDefinition,
  CardData,
  Card,
  DefinitionsMetadata,
  DefinitionsData,
} from "../types/index.js";

/**
 * Get default card state object
 * @returns Default card state with assignment, notes, and trimmed
 */
function getDefaultCardState(): Pick<Card, "assignment" | "notes" | "trimmed"> {
  return {
    assignment: "unassigned",
    notes: "",
    trimmed: false,
  };
}

/**
 * Load card definitions from definitions.json
 * @returns Array of card definition objects
 */
export function loadCardDefinitions(): CardDefinition[] {
  const data = definitionsData as DefinitionsData;
  return data.cards || [];
}

/**
 * Get metadata from definitions.json
 * @returns Metadata object
 */
export function getDefinitionsMetadata(): DefinitionsMetadata {
  const data = definitionsData as DefinitionsData;
  return data.metadata || {
    source: "",
    extractedAt: "",
    totalCards: 0,
    spreadsheetId: "",
    sheetGid: "",
  };
}

/**
 * Merge loaded user data (assignments, notes, trimmed) with card definitions
 * @param definitions - Array of card definitions from definitions.json
 * @param userCards - Array of user card data from IndexedDB
 * @returns Merged array of cards with user data applied
 */
export function mergeCardData(
  definitions: CardDefinition[],
  userCards: CardData[] | null | undefined
): Card[] {
  // Create a map of user card data by card name for quick lookup
  const userDataMap = new Map<string, CardData>();
  if (userCards && Array.isArray(userCards)) {
    userCards.forEach((userCard) => {
      userDataMap.set(userCard.cardName, userCard);
    });
  }

  // Merge definitions with user data
  return definitions.map((definition): Card => {
    const userData = userDataMap.get(definition.cardName);

    if (userData) {
      // User has data for this card, merge it with defaults as fallback
      const defaults = getDefaultCardState();
      return {
        ...definition,
        assignment: userData.assignment || defaults.assignment,
        notes: userData.notes || defaults.notes,
        trimmed: userData.trimmed ?? defaults.trimmed,
      };
    } else {
      // No user data, use defaults
      return {
        ...definition,
        ...getDefaultCardState(),
      };
    }
  });
}

/**
 * Initialize default state for first-time users (all cards unassigned)
 * This function can be used to ensure all cards have default values
 * @param definitions - Array of card definitions
 * @returns Array of cards with default state
 */
export function initializeDefaultState(definitions: CardDefinition[]): Card[] {
  const defaults = getDefaultCardState();
  return definitions.map((definition): Card => ({
    ...definition,
    ...defaults,
  }));
}

/**
 * Load all card data (definitions + user data) for the application
 * This is the main function to call on app startup
 * @returns Array of merged card data ready for use
 */
export async function loadAllCardData(): Promise<Card[]> {
  // Load card definitions from JSON
  const definitions = loadCardDefinitions();

  // Load user data from IndexedDB
  const userCards = await getAllCards();

  // Merge them together
  return mergeCardData(definitions, userCards);
}

