<template>
  <div class="app">
    <Header
      @cpe-click="handleCPEClick"
      @msc-click="handleMSCClick"
      @export-click="handleExportClick"
      @import-click="handleImportClick"
      @player-names-click="showPlayerNameEditor = true"
    />
    <main class="app-main">
      <div class="search-section">
        <SearchBar />
      </div>
      <div class="filter-section-container">
        <FilterSection />
      </div>
      <div class="card-list-container">
        <CardList
          empty-message="No cards match your current filters"
          @card-click="handleCardClick"
          @assignment-change="handleAssignmentChange"
          @notes-change="handleNotesChange"
          @trim-change="handleTrimChange"
        />
      </div>
      <div class="trimmed-cards-section-container">
        <TrimmedCardsSection
          @card-click="handleCardClick"
          @assignment-change="handleAssignmentChange"
          @notes-change="handleNotesChange"
          @trim-change="handleTrimChange"
        />
      </div>
    </main>
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    </div>
    <CardDetails
      v-if="selectedCard"
      :card="selectedCard"
      :read-only="isInformationalCard(selectedCard)"
      @close="selectedCard = null"
      @assignment-change="handleAssignmentChange"
      @notes-change="handleNotesChange"
      @trim-change="handleTrimChange"
    />
    <PlayerNameEditor
      v-if="showPlayerNameEditor"
      :player-names="playerNames"
      @close="showPlayerNameEditor = false"
      @save="handlePlayerNamesSave"
    />
    <ExportImport
      v-if="showExportImport"
      ref="exportImportRef"
      mode="import"
      @close="showExportImport = false"
      @import-success="handleImportSuccess"
      @import-error="handleImportError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Card, CardAssignment } from "./types/index.js";
import { useCardsStore } from "./stores/useCardsStore.js";
import { usePlayerNamesStore } from "./stores/usePlayerNamesStore.js";
import { useCardData } from "./composables/useCardData.js";
import { useStorage } from "./composables/useStorage.js";
import { useIndexedDB } from "./composables/useIndexedDB.js";
import { useExportImport } from "./composables/useExportImport.js";
import Header from "./components/Header.vue";
import SearchBar from "./components/SearchBar.vue";
import FilterSection from "./components/FilterSection.vue";
import CardList from "./components/CardList.vue";
import TrimmedCardsSection from "./components/TrimmedCardsSection.vue";
import CardDetails from "./components/CardDetails.vue";
import PlayerNameEditor from "./components/PlayerNameEditor.vue";
import ExportImport from "./components/ExportImport.vue";

const cardsStore = useCardsStore();
const playerNamesStore = usePlayerNamesStore();
const cardData = useCardData();
const storage = useStorage();
const db = useIndexedDB();
const exportImport = useExportImport();

const selectedCard = ref<Card | null>(null);
const showPlayerNameEditor = ref(false);
const showExportImport = ref(false);
const exportImportRef = ref<InstanceType<typeof ExportImport> | null>(null);

const INFORMATIONAL_CARDS = [
  "CONCIEVE. PLAN. EXECUTE.",
  "MINIMUM STANDARD OF CARE",
] as const;

const isLoading = computed(() => cardsStore.isLoading);
const playerNames = computed(() => playerNamesStore.playerNames);

function isInformationalCard(card: Card): boolean {
  return INFORMATIONAL_CARDS.includes(
    card.cardName as (typeof INFORMATIONAL_CARDS)[number]
  );
}

// Initialize app data
onMounted(async () => {
  try {
    cardsStore.setIsLoading(true);

    // Load player names from localStorage
    const initialPlayerNames = storage.getPlayerNames();
    playerNamesStore.setPlayerNames(initialPlayerNames);

    // Load card data
    const cards = await cardData.loadCards();
    cardsStore.setCards(cards);

    console.log("Fair Play Card Manager initialized");
    console.log(`Loaded ${cards.length} cards`);
    console.log(
      `Player names: ${initialPlayerNames.player1}, ${initialPlayerNames.player2}`
    );
  } catch (error) {
    console.error("Failed to initialize app:", error);
  } finally {
    cardsStore.setIsLoading(false);
  }
});

function handleCardClick(card: Card): void {
  selectedCard.value = card;
}

function handleCPEClick(): void {
  const cpeCard = cardsStore.getInformationalCard("CONCIEVE. PLAN. EXECUTE.");
  if (cpeCard) {
    selectedCard.value = cpeCard;
  }
}

function handleMSCClick(): void {
  const mscCard = cardsStore.getInformationalCard("MINIMUM STANDARD OF CARE");
  if (mscCard) {
    selectedCard.value = mscCard;
  }
}

function handleAssignmentChange(
  cardName: string,
  assignment: CardAssignment
): void {
  // Don't allow assignment changes for informational cards
  const card = cardsStore.getCardByName(cardName);
  if (card && isInformationalCard(card)) {
    return;
  }
  // Update in store
  cardsStore.updateCardAssignment(cardName, assignment);
  // Save to IndexedDB
  db.saveCardAssignment(cardName, assignment);
}

function handleNotesChange(cardName: string, notes: string): void {
  // Don't allow notes changes for informational cards
  const card = cardsStore.getCardByName(cardName);
  if (card && isInformationalCard(card)) {
    return;
  }
  // Update in store
  cardsStore.updateCardNotes(cardName, notes);
  // Save to IndexedDB
  db.saveCardNotes(cardName, notes);
}

function handleTrimChange(cardName: string, trimmed: boolean): void {
  // Don't allow trim changes for informational cards
  const card = cardsStore.getCardByName(cardName);
  if (card && isInformationalCard(card)) {
    return;
  }
  // Update in store
  cardsStore.updateCardTrimmed(cardName, trimmed);
  // Save to IndexedDB
  db.saveCardTrimmed(cardName, trimmed);
}

async function handleExportClick(): Promise<void> {
  try {
    await exportImport.exportData();
  } catch (error) {
    console.error("Export failed:", error);
    alert("Failed to export data. Please try again.");
  }
}

function handleImportClick(): void {
  showExportImport.value = true;
  // Trigger file input after component is mounted
  setTimeout(() => {
    exportImportRef.value?.triggerImport();
  }, 100);
}

async function handleImportSuccess(): Promise<void> {
  // Reload all data
  await reloadData();
  showExportImport.value = false;
}

function handleImportError(error: string): void {
  console.error("Import error:", error);
  // Error is already shown in ExportImport component
}

async function handlePlayerNamesSave(
  newPlayerNames: typeof playerNames.value
): Promise<void> {
  // Save to localStorage
  storage.setPlayerNames(newPlayerNames);
  // Update store
  playerNamesStore.setPlayerNames(newPlayerNames);
  showPlayerNameEditor.value = false;
}

async function reloadData(): Promise<void> {
  try {
    cardsStore.setIsLoading(true);

    // Reload cards and player names
    const [newCards, newPlayerNames] = await Promise.all([
      cardData.reloadCards(),
      Promise.resolve(storage.getPlayerNames()),
    ]);

    // Update stores
    cardsStore.setCards(newCards);
    playerNamesStore.setPlayerNames(newPlayerNames);
  } catch (error) {
    console.error("Failed to reload data:", error);
    throw error;
  } finally {
    cardsStore.setIsLoading(false);
  }
}
</script>
