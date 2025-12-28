<template>
  <Teleport to="body">
    <div class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog merge-strategy-dialog" @click.stop>
        <div class="dialog-header">
          <h2 class="dialog-title">Choose Merge Strategy</h2>
          <button
            class="dialog-close"
            aria-label="Close"
            @click="handleCancel"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <p class="merge-description">
            You're connecting to a Google Sheet for the first time. How would you
            like to merge the data?
          </p>

          <div class="merge-options">
            <label class="merge-option">
              <input
                v-model="selectedStrategy"
                type="radio"
                name="merge-strategy"
                value="use-sheet"
              />
              <div class="option-content">
                <div class="option-title">Use Sheet Data</div>
                <div class="option-description">
                  Sheet data takes precedence, even if local data has newer
                  timestamps. Useful when connecting to a sheet that has the
                  "correct" state.
                </div>
              </div>
            </label>

            <label class="merge-option">
              <input
                v-model="selectedStrategy"
                type="radio"
                name="merge-strategy"
                value="newer-wins"
              />
              <div class="option-content">
                <div class="option-title">Merge (Newer Wins)</div>
                <div class="option-description">
                  Standard merge - newer timestamp wins. Useful when you want to
                  preserve recent local changes.
                </div>
              </div>
            </label>
          </div>

          <div v-if="preview" class="merge-preview">
            <h3>Preview</h3>
            <ul>
              <li>{{ preview.sheetCards }} cards from sheet will be added/updated</li>
              <li>{{ preview.localCards }} local cards will be preserved</li>
            </ul>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="handleCancel">
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="!selectedStrategy"
            @click="handleConfirm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import type { MergeStrategy } from "../types/index.js";

interface Props {
  preview?: {
    sheetCards: number;
    localCards: number;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  confirm: [strategy: MergeStrategy];
  cancel: [];
}>();

const selectedStrategy = ref<MergeStrategy | "">("newer-wins");

function handleConfirm(): void {
  if (selectedStrategy.value) {
    emit("confirm", selectedStrategy.value as MergeStrategy);
  }
}

function handleCancel(): void {
  emit("cancel");
}

function handleOverlayClick(e: MouseEvent): void {
  if (e.target === e.currentTarget) {
    handleCancel();
  }
}

// Handle Escape key
function handleEscape(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    handleCancel();
  }
}

// Prevent body scroll when modal is open
onMounted(() => {
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", handleEscape);
});

onUnmounted(() => {
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleEscape);
});
</script>

<style scoped>
.merge-strategy-dialog {
  max-width: 600px;
}

.merge-description {
  margin-bottom: var(--spacing-lg);
  color: var(--color-text);
  line-height: 1.6;
}

.merge-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.merge-option {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.merge-option:hover {
  border-color: var(--color-primary);
  background-color: var(--color-surface);
}

.merge-option input[type="radio"] {
  margin-top: 2px;
  flex-shrink: 0;
  cursor: pointer;
}

.merge-option input[type="radio"]:checked + .option-content {
  color: var(--color-text);
}

.merge-option:has(input[type="radio"]:checked) {
  border-color: var(--color-primary);
  background-color: var(--color-surface);
}

.option-content {
  flex: 1;
}

.option-title {
  font-weight: 600;
  font-size: var(--font-size-base);
  margin-bottom: var(--spacing-xs);
  color: var(--color-text);
}

.option-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  line-height: 1.5;
}

.merge-preview {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-primary);
}

.merge-preview h3 {
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
}

.merge-preview ul {
  margin: 0;
  padding-left: var(--spacing-lg);
  color: var(--color-text);
  font-size: var(--font-size-sm);
}

.merge-preview li {
  margin-bottom: var(--spacing-xs);
}
</style>


