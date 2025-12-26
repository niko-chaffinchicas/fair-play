<template>
  <Teleport to="body">
    <div class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog settings-dialog" @click.stop>
        <div class="dialog-header">
          <h2 class="dialog-title">Google Sheets Sync Settings</h2>
          <button
            class="dialog-close"
            aria-label="Close"
            @click="handleClose"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label for="sheet-url-input">Google Sheet URL (Apps Script Web App):</label>
            <input
              id="sheet-url-input"
              v-model="urlInput"
              type="url"
              class="sheet-url-input"
              placeholder="https://script.google.com/macros/s/..."
              @keydown.enter.prevent="handleSave"
            />
            <p class="form-help">
              Enter the URL of your Google Apps Script web app endpoint
            </p>
          </div>

          <div v-if="syncStore.googleSheetUrl" class="sync-status">
            <h3>Sync Status</h3>
            <div class="status-item">
              <span class="status-label">Last Sync:</span>
              <span class="status-value">
                {{
                  syncStore.lastSyncTime
                    ? new Date(syncStore.lastSyncTime).toLocaleString()
                    : "Never"
                }}
              </span>
            </div>
            <div v-if="syncStore.isSyncing" class="status-item">
              <span class="status-label">Status:</span>
              <span class="status-value syncing">Syncing...</span>
            </div>
            <div v-if="syncStore.error" class="status-item error">
              <span class="status-label">Error:</span>
              <span class="status-value">{{ syncStore.error }}</span>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button
            v-if="syncStore.googleSheetUrl"
            class="btn btn-secondary"
            @click="handleClear"
          >
            Clear URL
          </button>
          <button
            class="btn btn-secondary"
            @click="handleClose"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="!urlInput.trim() || syncStore.isSyncing"
            @click="handleSave"
          >
            Save
          </button>
          <button
            v-if="syncStore.canSync"
            class="btn btn-primary"
            :disabled="syncStore.isSyncing"
            @click="handleManualSync"
          >
            {{ syncStore.isSyncing ? "Syncing..." : "Sync Now" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useSyncStore } from "../stores/useSyncStore.js";
import { useGoogleSheetsSync } from "../composables/useGoogleSheetsSync.js";
import { showToastNotification } from "../utils/toast.js";

const emit = defineEmits<{
  close: [];
  "manual-sync": [];
}>();

const syncStore = useSyncStore();
const { sync } = useGoogleSheetsSync();

const urlInput = ref(syncStore.googleSheetUrl);

function handleClose(): void {
  emit("close");
}

function handleOverlayClick(e: MouseEvent): void {
  if (e.target === e.currentTarget) {
    handleClose();
  }
}

function handleSave(): void {
  const url = urlInput.value.trim();
  if (!url) {
    showToastNotification("Please enter a valid URL", "error");
    return;
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    showToastNotification("Please enter a valid URL", "error");
    return;
  }

  syncStore.setGoogleSheetUrl(url);
  showToastNotification("Google Sheet URL saved", "success");
  handleClose();
}

function handleClear(): void {
  syncStore.clearGoogleSheetUrl();
  urlInput.value = "";
  showToastNotification("Google Sheet URL cleared", "success");
}

async function handleManualSync(): Promise<void> {
  emit("manual-sync");
}

// Handle Escape key
function handleEscape(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    handleClose();
  }
}

// Prevent body scroll when modal is open
onMounted(() => {
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", handleEscape);
  // Focus on input
  const input = document.getElementById("sheet-url-input") as HTMLInputElement;
  if (input) {
    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);
  }
});

onUnmounted(() => {
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleEscape);
});
</script>

<style scoped>
.settings-dialog {
  max-width: 600px;
}

.sheet-url-input {
  width: 100%;
  padding: var(--spacing-sm);
  font-size: var(--font-size-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family);
}

.form-help {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
}

.sync-status {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.sync-status h3 {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
}

.status-item {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.status-item.error {
  color: var(--color-danger);
}

.status-label {
  font-weight: 600;
  color: var(--color-text-light);
}

.status-value {
  color: var(--color-text);
}

.status-value.syncing {
  color: var(--color-primary);
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}
</style>

