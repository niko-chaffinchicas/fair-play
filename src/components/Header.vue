<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="app-title">Fair Play Card Manager</h1>
      <div class="player-names-display" @click="handlePlayerNamesClick">
        <button
          class="player-name player-1"
          type="button"
          aria-label="Edit Player 1 name"
        >
          {{ playerNames.player1 }}
        </button>
        <span class="player-separator">&</span>
        <button
          class="player-name player-2"
          type="button"
          aria-label="Edit Player 2 name"
        >
          {{ playerNames.player2 }}
        </button>
      </div>
      <button
        v-if="trimmedCount > 0"
        type="button"
        class="trimmed-count-badge"
        :title="`${trimmedCount} trimmed card${trimmedCount !== 1 ? 's' : ''}. Click to filter by trimmed cards.`"
        @click="handleTrimmedCountClick"
      >
        ✂️ {{ trimmedCount }}
      </button>
    </div>
    <div class="header-actions">
      <button
        class="btn btn-export"
        aria-label="Export Data"
        title="Export Data"
        @click="handleExportClick"
      >
        📥 Export
      </button>
      <button
        class="btn btn-import"
        aria-label="Import Data"
        title="Import Data"
        @click="handleImportClick"
      >
        📤 Import
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePlayerNamesStore } from "../stores/usePlayerNamesStore.js";
import { useCardsStore } from "../stores/useCardsStore.js";
import { useFiltersStore } from "../stores/useFiltersStore.js";

interface Props {
  onExportClick?: () => void;
  onImportClick?: () => void;
  onPlayerNamesClick?: () => void;
}

const props = defineProps<Props>();

const playerNamesStore = usePlayerNamesStore();
const cardsStore = useCardsStore();
const filtersStore = useFiltersStore();

const playerNames = computed(() => playerNamesStore.playerNames);
const trimmedCount = computed(() => cardsStore.trimmedCards.length);

function handleExportClick(): void {
  props.onExportClick?.();
}

function handleImportClick(): void {
  props.onImportClick?.();
}

function handlePlayerNamesClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  if (
    target.classList.contains("player-name") ||
    target.classList.contains("player-separator")
  ) {
    props.onPlayerNamesClick?.();
  }
}

function handleTrimmedCountClick(): void {
  const isTrimmedFilterActive = filtersStore.assignmentStatus.includes("trimmed");
  
  if (isTrimmedFilterActive) {
    // If trimmed filter is already active, clear all filters
    filtersStore.clearFilters();
  } else {
    // Otherwise, set only trimmed filter and clear others
    filtersStore.setSearchQuery("");
    filtersStore.setCategories([]);
    filtersStore.setAssignmentStatus(["trimmed"]);
  }
}
</script>

