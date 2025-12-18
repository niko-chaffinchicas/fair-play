/**
 * Pinia store for player names
 * Manages player 1 and player 2 names
 */

import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import type { PlayerNames } from "../types/index.js";

export const usePlayerNamesStore = defineStore("playerNames", () => {
  // State
  const playerNames: Ref<PlayerNames> = ref({
    player1: "Player 1",
    player2: "Player 2",
  });

  // Actions
  function setPlayerNames(newNames: PlayerNames): void {
    playerNames.value = { ...newNames };
  }

  function setPlayer1Name(name: string): void {
    playerNames.value.player1 = name.trim();
  }

  function setPlayer2Name(name: string): void {
    playerNames.value.player2 = name.trim();
  }

  return {
    // State
    playerNames,
    // Actions
    setPlayerNames,
    setPlayer1Name,
    setPlayer2Name,
  };
});

