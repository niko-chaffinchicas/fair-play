/**
 * Migration utility to add UUIDs to existing cards in IndexedDB
 * This ensures all cards have UUIDs for Google Sheets sync
 */

import { getAllCards, saveCardData } from "./db.js";
import { generateCardId, shouldCardHaveId } from "./cardId.js";
import type { CardData } from "../types/index.js";

/**
 * Migrate existing cards to include UUIDs
 * @returns Number of cards that were updated with UUIDs
 */
export async function migrateCardsToIncludeUuids(): Promise<number> {
  const allCards = await getAllCards();
  let updatedCount = 0;

  for (const card of allCards) {
    // Check if card needs an ID and doesn't have one
    if (shouldCardHaveId(card.cardName) && !card.id) {
      // Generate UUID and save
      const newId = generateCardId();
      await saveCardData(card.cardName, { id: newId });
      updatedCount++;
    }
  }

  return updatedCount;
}

/**
 * Check if migration is needed
 * @returns true if any cards need UUIDs
 */
export async function needsUuidMigration(): Promise<boolean> {
  const allCards = await getAllCards();
  return allCards.some(
    (card) => shouldCardHaveId(card.cardName) && !card.id
  );
}

