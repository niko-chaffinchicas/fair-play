<template>
  <div class="app">
    <Header
      @cpe-click="handleCPEClick"
      @msc-click="handleMSCClick"
      @export-click="handleExportClick"
      @import-click="handleImportClick"
      @player-names-click="showPlayerNameEditor = true"
      @settings-click="showSettings = true"
      @sync-click="handleSyncClick"
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
    <Toast />
    <Settings
      v-if="showSettings"
      @close="showSettings = false"
      @manual-sync="handleManualSync"
    />
    <MergeStrategyDialog
      v-if="showMergeStrategyDialog"
      :preview="mergePreview"
      @confirm="handleMergeStrategyConfirm"
      @cancel="handleMergeStrategyCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import type { Card, CardAssignment, MergeStrategy } from "./types/index.js";
import { useCardsStore } from "./stores/useCardsStore.js";
import { usePlayerNamesStore } from "./stores/usePlayerNamesStore.js";
import { useCardData } from "./composables/useCardData.js";
import { useStorage } from "./composables/useStorage.js";
import { useIndexedDB } from "./composables/useIndexedDB.js";
import { useExportImport } from "./composables/useExportImport.js";
import { useSyncStore } from "./stores/useSyncStore.js";
import { useGoogleSheetsSync } from "./composables/useGoogleSheetsSync.js";
import { showToastNotification } from "./utils/toast.js";
import { getAllCards } from "./utils/db.js";
import { migrateCardsToIncludeUuids } from "./utils/migrateUuids.js";
import Header from "./components/Header.vue";
import SearchBar from "./components/SearchBar.vue";
import FilterSection from "./components/FilterSection.vue";
import CardList from "./components/CardList.vue";
import TrimmedCardsSection from "./components/TrimmedCardsSection.vue";
import CardDetails from "./components/CardDetails.vue";
import PlayerNameEditor from "./components/PlayerNameEditor.vue";
import ExportImport from "./components/ExportImport.vue";
import Toast from "./components/Toast.vue";
import Settings from "./components/Settings.vue";
import MergeStrategyDialog from "./components/MergeStrategyDialog.vue";

const cardsStore = useCardsStore();
const playerNamesStore = usePlayerNamesStore();
const cardData = useCardData();
const storage = useStorage();
const db = useIndexedDB();
const exportImport = useExportImport();

const selectedCard = ref<Card | null>(null);
const showPlayerNameEditor = ref(false);
const showExportImport = ref(false);
const showSettings = ref(false);
const showMergeStrategyDialog = ref(false);
const mergePreview = ref<{ sheetCards: number; localCards: number } | undefined>(
  undefined
);
const exportImportRef = ref<InstanceType<typeof ExportImport> | null>(null);

const syncStore = useSyncStore();
const { sync, autoSync } = useGoogleSheetsSync();

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

    // Load card data (this will ensure UUIDs are generated for new cards)
    const cards = await cardData.loadCards();
    cardsStore.setCards(cards);

    // Migrate existing cards to include UUIDs if needed
    try {
      const updatedCount = await migrateCardsToIncludeUuids();
      if (updatedCount > 0) {
        console.log(`Migrated ${updatedCount} cards to include UUIDs`);
        // Reload cards to get the updated UUIDs
        const updatedCards = await cardData.reloadCards();
        cardsStore.setCards(updatedCards);
      }
    } catch (error) {
      console.error("Failed to migrate UUIDs:", error);
      // Don't block app initialization if migration fails
    }

    console.log("Fair Play Card Manager initialized");
    console.log(`Loaded ${cards.length} cards`);
    console.log(
      `Player names: ${initialPlayerNames.player1}, ${initialPlayerNames.player2}`
    );

    // Check if Google Sheet URL is configured and handle first sync
    if (syncStore.googleSheetUrl) {
      if (syncStore.isFirstSync) {
        // First connection - show merge strategy dialog
        try {
          // Get preview data
          const syncFromSheetFn = getSyncFromSheet();
          const sheetData = await syncFromSheetFn();
          const localCards = await getAllCards();
          mergePreview.value = {
            sheetCards: sheetData.length,
            localCards: localCards.length,
          };
          showMergeStrategyDialog.value = true;
        } catch (err) {
          console.error("Failed to get preview data:", err);
          showToastNotification(
            `Failed to connect to sheet: ${err instanceof Error ? err.message : "Unknown error"}`,
            "error"
          );
        }
      } else {
        // Subsequent loads - optionally sync
        // For now, we'll skip auto-sync on load to avoid unexpected changes
        // User can manually sync if needed
      }
    }
  } catch (error) {
    console.error("Failed to initialize app:", error);
    showToastNotification(
      `Failed to initialize: ${error instanceof Error ? error.message : "Unknown error"}`,
      "error"
    );
  } finally {
    cardsStore.setIsLoading(false);
  }
});

// Before unload protection
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (syncStore.isSyncing) {
    e.preventDefault();
    e.returnValue = "A sync is in progress. Are you sure you want to leave?";
    return e.returnValue;
  }
};

// Watch for sync state changes to add/remove beforeunload listener
const syncWatcher = computed(() => syncStore.isSyncing);

// Add/remove beforeunload listener based on sync state
import { watch } from "vue";
watch(
  syncWatcher,
  (isSyncing) => {
    if (isSyncing) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  // Clean up beforeunload listener
  window.removeEventListener("beforeunload", handleBeforeUnload);
});

// Sync on page load (read-only, merge with local)
async function performSyncOnLoad(): Promise<void> {
  if (!syncStore.googleSheetUrl || syncStore.isSyncing) {
    return;
  }

  try {
    syncStore.startSync();
    
    // Read from sheet
    const syncFromSheetFn = getSyncFromSheet();
    const sheetData = await syncFromSheetFn();
    
    // Get local cards
    const localCards = await getAllCards();
    
    // Merge using standard strategy (newer wins)
    const syncComposable = useGoogleSheetsSync();
    const mergedCards = syncComposable.mergeCardData(sheetData, localCards);
    
    // Save merged data to IndexedDB
    const { saveCardData } = await import("./utils/db.js");
    for (const cardData of mergedCards) {
      await saveCardData(cardData.cardName, {
        id: cardData.id,
        assignment: cardData.assignment,
        notes: cardData.notes,
        trimmed: cardData.trimmed,
      });
    }
    
    // Reload cards in store
    const updatedCards = await cardData.reloadCards();
    cardsStore.setCards(updatedCards);
    
    syncStore.finishSync();
  } catch (err) {
    syncStore.isSyncing = false;
    throw err;
  }
}

// Manual sync handler (from Settings)
async function handleManualSync(): Promise<void> {
  if (!syncStore.googleSheetUrl) {
    showToastNotification("Please configure a Google Sheet URL first", "error");
    return;
  }

  if (syncStore.isFirstSync) {
    // Show merge strategy dialog
    try {
      const syncFromSheetFn = getSyncFromSheet();
      const sheetData = await syncFromSheetFn();
      const localCards = await getAllCards();
      mergePreview.value = {
        sheetCards: sheetData.length,
        localCards: localCards.length,
      };
      showMergeStrategyDialog.value = true;
    } catch (err) {
      console.error("Failed to get preview data:", err);
      showToastNotification(
        `Failed to connect to sheet: ${err instanceof Error ? err.message : "Unknown error"}`,
        "error"
      );
    }
  } else {
    // Regular sync
    try {
      syncStore.startSync();
      await sync();
      showToastNotification("Sync completed successfully", "success");
    } catch (err) {
      console.error("Sync failed:", err);
      showToastNotification(
        `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        "error"
      );
    }
  }
}

// Merge strategy handlers
async function handleMergeStrategyConfirm(strategy: MergeStrategy): Promise<void> {
  showMergeStrategyDialog.value = false;
  try {
    syncStore.startSync();
    await sync(strategy);
    showToastNotification("Connected to Google Sheet. Data merged successfully.", "success");
  } catch (err) {
    console.error("Sync failed:", err);
    showToastNotification(
      `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      "error"
    );
  }
}

function handleMergeStrategyCancel(): void {
  showMergeStrategyDialog.value = false;
  // Clear the URL since user cancelled
  syncStore.clearGoogleSheetUrl();
}

// Sync button handler (from Header)
async function handleSyncClick(): Promise<void> {
  if (!syncStore.googleSheetUrl) {
    showToastNotification("Please configure a Google Sheet URL in Settings first", "error");
    return;
  }

  if (syncStore.isSyncing) {
    return; // Already syncing
  }

  try {
    syncStore.startSync();
    await sync();
    showToastNotification("Sync completed successfully", "success");
  } catch (err) {
    console.error("Sync failed:", err);
    showToastNotification(
      `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      "error"
    );
  }
}

// Helper to get syncFromSheet function
function getSyncFromSheet() {
  const { syncFromSheet } = useGoogleSheetsSync();
  return syncFromSheet;
}

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
  // Trigger auto-sync if configured
  if (syncStore.googleSheetUrl && !syncStore.isSyncing) {
    autoSync().catch((err) => {
      console.error("Auto-sync failed:", err);
      showToastNotification(
        `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        "error"
      );
    });
  }
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
  // Trigger auto-sync if configured
  if (syncStore.googleSheetUrl && !syncStore.isSyncing) {
    autoSync().catch((err) => {
      console.error("Auto-sync failed:", err);
      showToastNotification(
        `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        "error"
      );
    });
  }
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
  // Trigger auto-sync if configured
  if (syncStore.googleSheetUrl && !syncStore.isSyncing) {
    autoSync().catch((err) => {
      console.error("Auto-sync failed:", err);
      showToastNotification(
        `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        "error"
      );
    });
  }
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
