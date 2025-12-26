<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="app-title">Fair Play Card Manager</h1>
      <div class="player-names-display">
        <Badge
          :label="playerNames.player1"
          :count="player1Count"
          variant="player1"
          :title="`${player1Count} untrimmed card${
            player1Count !== 1 ? 's' : ''
          } assigned to ${playerNames.player1}. Click to filter.`"
          :show-edit-icon="true"
          @click="handlePlayer1Click"
          @edit-click="handlePlayerNamesClick"
        />
        <Badge
          :label="playerNames.player2"
          :count="player2Count"
          variant="player2"
          :title="`${player2Count} untrimmed card${
            player2Count !== 1 ? 's' : ''
          } assigned to ${playerNames.player2}. Click to filter.`"
          :show-edit-icon="true"
          @click="handlePlayer2Click"
          @edit-click="handlePlayerNamesClick"
        />
        <Badge
          :label="'Shared'"
          :count="sharedCount"
          variant="shared"
          :show-when-zero="true"
          :title="`${sharedCount} untrimmed shared card${
            sharedCount !== 1 ? 's' : ''
          }. Click to filter.`"
          @click="handleSharedClick"
        />
        <Badge
          v-if="trimmedCount > 0"
          :label="'Trimmed'"
          :count="trimmedCount"
          variant="trimmed"
          icon="✂️"
          :title="`${trimmedCount} trimmed card${
            trimmedCount !== 1 ? 's' : ''
          }. Click to filter by trimmed cards.`"
          @click="handleTrimmedCountClick"
        />
      </div>
    </div>
    <div class="header-actions">
      <button
        class="btn btn-info"
        aria-label="Conceive, Plan, Execute"
        title="Conceive, Plan, Execute"
        @click="handleCPEClick"
      >
        📋 CPE
      </button>
      <button
        class="btn btn-info"
        aria-label="Minimum Standard of Care"
        title="Minimum Standard of Care"
        @click="handleMSCClick"
      >
        📖 MSC
      </button>
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
import Badge from "./Badge.vue";

interface Props {
  onExportClick?: () => void;
  onImportClick?: () => void;
  onPlayerNamesClick?: () => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "cpe-click": [];
  "msc-click": [];
}>();

const playerNamesStore = usePlayerNamesStore();
const cardsStore = useCardsStore();
const filtersStore = useFiltersStore();

const playerNames = computed(() => playerNamesStore.playerNames);
const trimmedCount = computed(() => cardsStore.trimmedCards.length);
const player1Count = computed(() => cardsStore.player1Count);
const player2Count = computed(() => cardsStore.player2Count);
const sharedCount = computed(() => cardsStore.sharedCount);

function handleExportClick(): void {
  props.onExportClick?.();
}

function handleImportClick(): void {
  props.onImportClick?.();
}

function handlePlayerNamesClick(): void {
  props.onPlayerNamesClick?.();
}

function handlePlayer1Click(): void {
  const isPlayer1FilterActive =
    filtersStore.assignmentStatus.includes("player1");

  if (isPlayer1FilterActive) {
    filtersStore.clearFilters();
  } else {
    filtersStore.setSearchQuery("");
    filtersStore.setCategories([]);
    filtersStore.setAssignmentStatus(["player1"]);
  }
}

function handlePlayer2Click(): void {
  const isPlayer2FilterActive =
    filtersStore.assignmentStatus.includes("player2");

  if (isPlayer2FilterActive) {
    filtersStore.clearFilters();
  } else {
    filtersStore.setSearchQuery("");
    filtersStore.setCategories([]);
    filtersStore.setAssignmentStatus(["player2"]);
  }
}

function handleSharedClick(): void {
  const isSharedFilterActive = filtersStore.assignmentStatus.includes("shared");

  if (isSharedFilterActive) {
    filtersStore.clearFilters();
  } else {
    filtersStore.setSearchQuery("");
    filtersStore.setCategories([]);
    filtersStore.setAssignmentStatus(["shared"]);
  }
}

function handleTrimmedCountClick(): void {
  const isTrimmedFilterActive =
    filtersStore.assignmentStatus.includes("trimmed");

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

function handleCPEClick(): void {
  emit("cpe-click");
}

function handleMSCClick(): void {
  emit("msc-click");
}
</script>
