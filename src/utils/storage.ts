/**
 * localStorage utility functions for player names and preferences
 */

import type { PlayerNames } from "../types/index.js";

const STORAGE_KEYS = {
  PLAYER1_NAME: "fairPlay_player1Name",
  PLAYER2_NAME: "fairPlay_player2Name",
} as const;

/**
 * Get player 1 name from localStorage
 * @returns Player 1 name or "Player 1" if not set
 */
export function getPlayer1Name(): string {
  return localStorage.getItem(STORAGE_KEYS.PLAYER1_NAME) || "Player 1";
}

/**
 * Get player 2 name from localStorage
 * @returns Player 2 name or "Player 2" if not set
 */
export function getPlayer2Name(): string {
  return localStorage.getItem(STORAGE_KEYS.PLAYER2_NAME) || "Player 2";
}

/**
 * Set player 1 name in localStorage
 * @param name - The name to set
 */
export function setPlayer1Name(name: string): void {
  if (name && name.trim()) {
    localStorage.setItem(STORAGE_KEYS.PLAYER1_NAME, name.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.PLAYER1_NAME);
  }
}

/**
 * Set player 2 name in localStorage
 * @param name - The name to set
 */
export function setPlayer2Name(name: string): void {
  if (name && name.trim()) {
    localStorage.setItem(STORAGE_KEYS.PLAYER2_NAME, name.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.PLAYER2_NAME);
  }
}

/**
 * Get both player names as an object
 * @returns Object with player names
 */
export function getPlayerNames(): PlayerNames {
  return {
    player1: getPlayer1Name(),
    player2: getPlayer2Name(),
  };
}

/**
 * Set both player names
 * @param names - Object with player names (partial - only provided keys will be updated)
 */
export function setPlayerNames(names: Partial<PlayerNames>): void {
  if (names.player1 !== undefined) {
    setPlayer1Name(names.player1);
  }
  if (names.player2 !== undefined) {
    setPlayer2Name(names.player2);
  }
}

