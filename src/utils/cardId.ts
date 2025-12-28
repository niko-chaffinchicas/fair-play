/**
 * Card ID utilities for Google Sheets sync
 * Generates UUIDs for cards and handles assignment mapping
 */

import type { CardAssignment } from "../types/index.js";

// Informational cards that should not have UUIDs
const INFORMATIONAL_CARDS = [
  "CONCIEVE. PLAN. EXECUTE.",
  "MINIMUM STANDARD OF CARE",
] as const;

/**
 * Generate a UUID v4
 * @returns UUID string
 */
export function generateCardId(): string {
  // UUID v4 generation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if a card should have a UUID
 * @param cardName - The name of the card
 * @returns true if the card should have a UUID
 */
export function shouldCardHaveId(cardName: string): boolean {
  return !INFORMATIONAL_CARDS.includes(
    cardName as (typeof INFORMATIONAL_CARDS)[number]
  );
}

/**
 * Convert assignment to integer for Google Sheets
 * @param assignment - Card assignment
 * @returns Integer representation (0=unassigned, 1=player1, 2=player2, 3=shared)
 */
export function assignmentToInteger(assignment: CardAssignment): number {
  switch (assignment) {
    case "unassigned":
      return 0;
    case "player1":
      return 1;
    case "player2":
      return 2;
    case "shared":
      return 3;
    default:
      return 0;
  }
}

/**
 * Convert integer to assignment from Google Sheets
 * @param value - Integer value (0=unassigned, 1=player1, 2=player2, 3=shared)
 * @returns Card assignment
 */
export function integerToAssignment(value: number): CardAssignment {
  switch (value) {
    case 0:
      return "unassigned";
    case 1:
      return "player1";
    case 2:
      return "player2";
    case 3:
      return "shared";
    default:
      return "unassigned";
  }
}


