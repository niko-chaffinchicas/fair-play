/**
 * TypeScript type definitions for Fair Play Card Manager
 */

/**
 * Card assignment values
 */
export type CardAssignment = "unassigned" | "player1" | "player2" | "shared";

/**
 * Card definition from definitions.json
 * This represents the base card structure without user data
 */
export interface CardDefinition {
  cardName: string;
  definition: string;
  planning: string;
  execution: string;
  minimumStandardOfCare: string;
  minimumStandardOfCareQuestion: string;
}

/**
 * Card data stored in IndexedDB
 * This represents user-specific data for a card
 */
export interface CardData {
  cardName: string;
  assignment: CardAssignment;
  notes: string;
  trimmed: boolean;
  lastUpdated?: string;
}

/**
 * Complete card with both definition and user data
 * This is the merged card structure used throughout the app
 */
export interface Card extends CardDefinition {
  assignment: CardAssignment;
  notes: string;
  trimmed: boolean;
}

/**
 * Metadata from definitions.json
 */
export interface DefinitionsMetadata {
  source: string;
  extractedAt: string;
  totalCards: number;
  spreadsheetId: string;
  sheetGid: string;
}

/**
 * Complete definitions.json structure
 */
export interface DefinitionsData {
  metadata: DefinitionsMetadata;
  cards: CardDefinition[];
}

/**
 * Player names structure
 */
export interface PlayerNames {
  player1: string;
  player2: string;
}

/**
 * Filter state for category filters
 */
export type CategoryFilter =
  | "Magic"
  | "Daily Grind"
  | "Caregving"
  | "Out"
  | "Wild"
  | "Home"
  | "Happiness Trio";

/**
 * Filter state for assignment status
 */
export type AssignmentStatusFilter =
  | "unassigned"
  | "player1"
  | "player2"
  | "shared"
  | "trimmed";

/**
 * Application filter state
 */
export interface FilterState {
  searchQuery: string;
  categories: CategoryFilter[];
  assignmentStatus: AssignmentStatusFilter[];
}

/**
 * Application state
 */
export interface AppState {
  cards: Card[];
  playerNames: PlayerNames;
  filters: FilterState;
  isLoading: boolean;
}

/**
 * Export/Import data structure
 */
export interface ExportData {
  playerNames: PlayerNames;
  cards: CardData[];
  metadata: {
    exportedAt: string;
    version: string;
  };
}

