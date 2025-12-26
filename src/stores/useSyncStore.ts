/**
 * Pinia store for Google Sheets sync state
 * Manages sync state, URL, and sync history
 */

import { defineStore } from "pinia";
import { ref, computed, type Ref, type ComputedRef } from "vue";

const STORAGE_KEYS = {
  GOOGLE_SHEET_URL: "fairPlay_googleSheetUrl",
  HAS_SYNCED_BEFORE: "fairPlay_hasSyncedBefore",
  LAST_SYNC_TIME: "fairPlay_lastSyncTime",
} as const;

export const useSyncStore = defineStore("sync", () => {
  // State
  const isSyncing: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  // Load initial state from localStorage
  const googleSheetUrl: Ref<string> = ref(
    localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_URL) || ""
  );
  const hasSyncedBefore: Ref<boolean> = ref(
    localStorage.getItem(STORAGE_KEYS.HAS_SYNCED_BEFORE) === "true"
  );
  
  // Load lastSyncTime from localStorage
  const storedLastSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
  const lastSyncTime: Ref<Date | null> = ref(
    storedLastSyncTime ? new Date(storedLastSyncTime) : null
  );

  // Computed
  const canSync: ComputedRef<boolean> = computed(() => {
    return !!googleSheetUrl.value && !isSyncing.value;
  });

  const isFirstSync: ComputedRef<boolean> = computed(() => {
    return !!googleSheetUrl.value && !hasSyncedBefore.value;
  });

  // Actions
  function setGoogleSheetUrl(url: string): void {
    const previousUrl = googleSheetUrl.value;
    googleSheetUrl.value = url.trim();
    
    if (googleSheetUrl.value) {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_SHEET_URL, googleSheetUrl.value);
      // If URL changed, clear hasSyncedBefore flag
      if (previousUrl !== googleSheetUrl.value) {
        hasSyncedBefore.value = false;
        localStorage.removeItem(STORAGE_KEYS.HAS_SYNCED_BEFORE);
      }
    } else {
      clearGoogleSheetUrl();
    }
  }

  function clearGoogleSheetUrl(): void {
    googleSheetUrl.value = "";
    hasSyncedBefore.value = false;
    lastSyncTime.value = null;
    localStorage.removeItem(STORAGE_KEYS.GOOGLE_SHEET_URL);
    localStorage.removeItem(STORAGE_KEYS.HAS_SYNCED_BEFORE);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC_TIME);
  }

  function startSync(): void {
    isSyncing.value = true;
    error.value = null;
  }

  function finishSync(): void {
    isSyncing.value = false;
    const now = new Date();
    lastSyncTime.value = now;
    hasSyncedBefore.value = true;
    localStorage.setItem(STORAGE_KEYS.HAS_SYNCED_BEFORE, "true");
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, now.toISOString());
  }

  function setError(errorMessage: string | null): void {
    error.value = errorMessage;
  }

  return {
    // State
    isSyncing,
    lastSyncTime,
    error,
    googleSheetUrl,
    hasSyncedBefore,
    // Computed
    canSync,
    isFirstSync,
    // Actions
    setGoogleSheetUrl,
    clearGoogleSheetUrl,
    startSync,
    finishSync,
    setError,
  };
});

