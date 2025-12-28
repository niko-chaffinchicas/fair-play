<template>
  <Teleport to="body">
    <div class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog settings-dialog" @click.stop>
        <div class="dialog-header">
          <h2 class="dialog-title">Google Sheets Sync Settings</h2>
          <button class="dialog-close" aria-label="Close" @click="handleClose">
            ×
          </button>
        </div>
        <div class="dialog-body">
          <div class="setup-instructions">
            <button
              class="setup-toggle"
              @click="showSetupInstructions = !showSetupInstructions"
            >
              <span>{{ showSetupInstructions ? "▼" : "▶" }}</span>
              <span>Setup Instructions</span>
            </button>
            <div v-if="showSetupInstructions" class="setup-content">
              <ol class="setup-steps">
                <li>
                  <strong>Create a Google Sheet:</strong> Go to
                  <a
                    href="https://sheets.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Sheets
                  </a>
                  and create a new spreadsheet. The script will automatically
                  create the necessary columns.
                </li>
                <li>
                  <strong>Open Apps Script Editor:</strong> In your Google
                  Sheet, go to <strong>Extensions → Apps Script</strong>
                </li>
                <li>
                  <strong>Paste the Script:</strong> Delete any existing code
                  and paste the following script:
                  <div class="code-block-container">
                    <pre
                      class="code-block"
                    ><code>{{ appsScriptCode }}</code></pre>
                    <button
                      class="copy-button"
                      :class="{ copied: copySuccess }"
                      @click="copyScriptCode"
                      :aria-label="copySuccess ? 'Copied!' : 'Copy script'"
                    >
                      {{ copySuccess ? "✓" : "📋" }}
                    </button>
                  </div>
                </li>
                <li>
                  <strong>Save the Script:</strong> Click the save icon (or
                  press Ctrl+S / Cmd+S) and give your project a name (e.g.,
                  "Fair Play Sync")
                </li>
                <li>
                  <strong>Deploy as Web App:</strong>
                  <ol>
                    <li>Click <strong>Deploy → New deployment</strong></li>
                    <li>
                      Click the gear icon next to "Select type" and choose
                      <strong>Web app</strong>
                    </li>
                    <li>Set <strong>Execute as:</strong> "Me"</li>
                    <li>Set <strong>Who has access:</strong> "Anyone"</li>
                    <li>Click <strong>Deploy</strong></li>
                    <li>
                      Copy the <strong>Web app URL</strong> (it will look like
                      <code>https://script.google.com/macros/s/...</code>)
                    </li>
                  </ol>
                </li>
                <li>
                  <strong>Paste the URL:</strong> Paste the Web app URL into the
                  input field below
                </li>
              </ol>
            </div>
          </div>

          <div class="form-group">
            <label for="sheet-url-input"
              >Google Sheet URL (Apps Script Web App):</label
            >
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
          <button class="btn btn-secondary" @click="handleClose">Cancel</button>
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
import { showToastNotification } from "../utils/toast.js";

const emit = defineEmits<{
  close: [];
  "manual-sync": [];
}>();

const syncStore = useSyncStore();

const urlInput = ref(syncStore.googleSheetUrl);
const showSetupInstructions = ref(false);
const copySuccess = ref(false);

const appsScriptCode = `function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Ensure headers exist
    const headers = ["cardId", "cardName", "assignment", "trimmed", "lastUpdated"];
    const headerRow = sheet.getRange(1, 1, 1, headers.length);
    const existingHeaders = headerRow.getValues()[0];
    
    if (existingHeaders[0] !== headers[0]) {
      headerRow.setValues([headers]);
    }
    
    // Get all data rows
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Skip header row
    const rows = values.slice(1);
    
    const result = rows.map((row) => ({
      cardId: row[0] || "",
      cardName: row[1] || "",
      assignment: row[2] || 0,
      trimmed: row[3] || 0,
      lastUpdated: row[4] || new Date().toISOString(),
    }));
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Ensure headers exist
    const headers = ["cardId", "cardName", "assignment", "trimmed", "lastUpdated"];
    const headerRow = sheet.getRange(1, 1, 1, headers.length);
    const existingHeaders = headerRow.getValues()[0];
    
    if (existingHeaders[0] !== headers[0]) {
      headerRow.setValues([headers]);
    }
    
    // FormData comes through e.parameter
    const action = e.parameter.action;
    
    if (action === "update") {
      const dataStr = e.parameter.data;
      
      if (!dataStr) {
        throw new Error("No data provided");
      }
      
      const data = JSON.parse(dataStr);
      
      if (!Array.isArray(data)) {
        throw new Error("Data must be an array");
      }
      
      // Get existing data to update
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      const existingData = new Map();
      
      // Build map of existing rows by cardId (skip header)
      for (let i = 1; i < values.length; i++) {
        const cardId = values[i][0];
        if (cardId) {
          existingData.set(cardId, i + 1); // Row number (1-indexed)
        }
      }
      
      // Update or insert rows
      for (const item of data) {
        const rowNum = existingData.get(item.cardId);
        const rowData = [
          item.cardId,
          item.cardName,
          item.assignment,
          item.trimmed,
          item.lastUpdated,
        ];
        
        if (rowNum) {
          // Update existing row
          sheet.getRange(rowNum, 1, 1, headers.length).setValues([rowData]);
        } else {
          // Append new row
          sheet.appendRow(rowData);
        }
      }
      
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, updated: data.length })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    throw new Error("Invalid action");
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions() {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON);
}`;

function copyScriptCode(): void {
  navigator.clipboard
    .writeText(appsScriptCode)
    .then(() => {
      copySuccess.value = true;
      setTimeout(() => {
        copySuccess.value = false;
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
      showToastNotification("Failed to copy script", "error");
    });
}

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

.setup-instructions {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.setup-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  width: 100%;
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 0.2s;
}

.setup-toggle:hover {
  background: var(--color-bg-hover);
}

.setup-content {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.setup-steps {
  margin: 0;
  padding-left: var(--spacing-lg);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--color-text);
}

.setup-steps li {
  margin-bottom: var(--spacing-md);
}

.setup-steps li strong {
  color: var(--color-text);
  font-weight: 600;
}

.setup-steps ol {
  margin-top: var(--spacing-xs);
  padding-left: var(--spacing-lg);
}

.setup-steps a {
  color: var(--color-primary);
  text-decoration: underline;
}

.setup-steps code {
  background: var(--color-bg);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

.code-block-container {
  position: relative;
  margin-top: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.code-block {
  margin: 0;
  padding: var(--spacing-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: "Courier New", Courier, monospace;
  font-size: var(--font-size-xs);
  line-height: 1.5;
  color: var(--color-text);
  overflow-x: auto;
  white-space: pre;
  max-height: 400px;
  overflow-y: auto;
}

.copy-button {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.copy-button:hover {
  background: var(--color-bg-hover);
  transform: scale(1.05);
}

.copy-button.copied {
  background: var(--color-success);
  color: white;
  border-color: var(--color-success);
}
</style>
