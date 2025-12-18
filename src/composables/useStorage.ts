/**
 * Storage composable
 * Wraps localStorage operations for player names
 * Uses existing utils/storage.ts functions to maintain compatibility
 */

import {
    getPlayerNames,
    setPlayerNames,
    getPlayer1Name,
    getPlayer2Name,
    setPlayer1Name,
    setPlayer2Name,
} from "../utils/storage.js";

/**
 * Composable for localStorage operations
 * Returns reactive functions for getting and setting player names
 */
export function useStorage() {
    return {
        getPlayerNames,
        setPlayerNames,
        getPlayer1Name,
        getPlayer2Name,
        setPlayer1Name,
        setPlayer2Name,
    };
}

