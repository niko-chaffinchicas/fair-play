<template>
  <Teleport to="body">
    <div
      class="dialog-overlay card-details-overlay"
      @click="handleOverlayClick"
    >
      <div class="dialog card-details-dialog" @click.stop>
        <div class="dialog-header">
          <h2 class="dialog-title">{{ card.cardName }}</h2>
          <button class="dialog-close" aria-label="Close" @click="handleClose">
            ×
          </button>
        </div>
        <div class="dialog-body card-details-body">
          <div v-if="!readOnly" class="card-details-header">
            <div class="card-details-categories">
              <span
                v-for="category in categories"
                :key="category"
                class="card-category-tag"
              >
                {{ category }}
              </span>
            </div>
            <div class="card-details-badges">
              <span v-if="card.trimmed" class="card-trimmed-badge"
                >Trimmed</span
              >
              <span
                :class="[
                  'card-assignment-badge',
                  `card-assignment-${card.assignment}`,
                ]"
                :title="assignmentDisplayName"
              >
                <span class="card-assignment-icon">{{ assignmentIcon }}</span>
                <span class="card-assignment-text">{{
                  assignmentDisplayName
                }}</span>
              </span>
            </div>
          </div>

          <div v-if="!readOnly" class="card-details-assignment">
            <label class="card-assignment-label">
              Assignment:
              <select
                class="card-assignment-select"
                :value="card.assignment"
                @change="handleAssignmentChange"
              >
                <option value="unassigned">Unassigned</option>
                <option value="player1">{{ playerNames.player1 }}</option>
                <option value="player2">{{ playerNames.player2 }}</option>
                <option value="shared">Shared</option>
              </select>
            </label>
          </div>

          <div v-if="!readOnly" class="card-details-actions">
            <button
              type="button"
              :class="['btn', 'btn-trim', card.trimmed ? 'btn-trimmed' : '']"
              :aria-label="card.trimmed ? 'Untrim' : 'Trim'"
              @click="handleTrimClick"
            >
              {{ card.trimmed ? "✂️ Untrim" : "✂️ Trim" }}
            </button>
          </div>

          <div class="card-details-content">
            <template v-if="readOnly">
              <!-- Read-only mode: display text without headers -->
              <div v-if="card.definition" class="card-section">
                <p
                  class="card-section-content"
                  v-html="formatMultilineText(card.definition)"
                ></p>
              </div>
              <div v-if="card.planning" class="card-section">
                <p
                  class="card-section-content"
                  v-html="formatMultilineText(card.planning)"
                ></p>
              </div>
              <div v-if="card.execution" class="card-section">
                <p
                  class="card-section-content"
                  v-html="formatMultilineText(card.execution)"
                ></p>
              </div>
              <div v-if="card.minimumStandardOfCare" class="card-section">
                <p
                  class="card-section-content"
                  v-html="formatMultilineText(card.minimumStandardOfCare)"
                ></p>
              </div>
              <div
                v-if="card.minimumStandardOfCareQuestion"
                class="card-section"
              >
                <p
                  class="card-section-content"
                  v-html="
                    formatMultilineText(card.minimumStandardOfCareQuestion)
                  "
                ></p>
              </div>
            </template>
            <template v-else>
              <!-- Normal mode: display with headers -->
              <div v-if="card.definition" class="card-section">
                <h3 class="card-section-title">Definition</h3>
                <p
                  class="card-section-content"
                  v-html="formatMultilineText(card.definition)"
                ></p>
              </div>

              <div class="card-section">
                <h3 class="card-section-title">Planning</h3>
                <p
                  class="card-section-content"
                  v-html="formatMultilineText(card.planning)"
                ></p>
              </div>

              <div class="card-section">
                <h3 class="card-section-title">Execution</h3>
                <p
                  class="card-section-content"
                  v-html="formatMultilineText(card.execution)"
                ></p>
              </div>

              <div class="card-section">
                <h3 class="card-section-title">Minimum Standard of Care</h3>
                <p
                  class="card-section-content"
                  v-html="formatMultilineText(card.minimumStandardOfCare)"
                ></p>
              </div>

              <div class="card-section">
                <h3 class="card-section-title">Question</h3>
                <p
                  class="card-section-content"
                  v-html="
                    formatMultilineText(card.minimumStandardOfCareQuestion)
                  "
                ></p>
              </div>
            </template>

            <div v-if="!readOnly" class="card-details-notes">
              <h3 class="card-section-title">Notes</h3>
              <textarea
                v-model="notesValue"
                class="card-notes-textarea"
                placeholder="Add notes about this card..."
                rows="6"
                @blur="handleNotesBlur"
                @input="handleNotesInput"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { Card, CardAssignment } from "../types/index.js";
import { usePlayerNamesStore } from "../stores/usePlayerNamesStore.js";
import { useDebounce } from "../composables/useDebounce.js";

interface Props {
  card: Card;
  readOnly?: boolean;
  onClose: () => void;
  onAssignmentChange?: (cardName: string, assignment: CardAssignment) => void;
  onNotesChange?: (cardName: string, notes: string) => void;
  onTrimChange?: (cardName: string, trimmed: boolean) => void;
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
});

const emit = defineEmits<{
  close: [];
}>();

const playerNamesStore = usePlayerNamesStore();
const playerNames = computed(() => playerNamesStore.playerNames);

const notesValue = ref(props.card.notes);

// Watch for external changes to card notes
watch(
  () => props.card.notes,
  (newNotes) => {
    notesValue.value = newNotes;
  }
);

// Parse categories from definition
const categories = computed(() => {
  return props.card.definition
    .split(",")
    .map((cat) => cat.trim())
    .filter((cat) => cat.length > 0);
});

// Assignment display name
const assignmentDisplayName = computed(() => {
  switch (props.card.assignment) {
    case "unassigned":
      return "Unassigned";
    case "player1":
      return playerNames.value.player1;
    case "player2":
      return playerNames.value.player2;
    case "shared":
      return "Shared";
    default:
      return props.card.assignment;
  }
});

// Assignment icon
const assignmentIcon = computed(() => {
  switch (props.card.assignment) {
    case "unassigned":
      return "○";
    case "player1":
    case "player2":
      return "●";
    case "shared":
      return "⚡";
    default:
      return "";
  }
});

// Debounced notes save
const debouncedNotesSave = useDebounce((notes: string) => {
  props.onNotesChange?.(props.card.cardName, notes.trim());
}, 1000);

function handleClose(): void {
  emit("close");
  props.onClose();
}

function handleOverlayClick(e: MouseEvent): void {
  if (e.target === e.currentTarget) {
    handleClose();
  }
}

function handleAssignmentChange(e: Event): void {
  const target = e.target as HTMLSelectElement;
  const assignment = target.value as CardAssignment;
  props.onAssignmentChange?.(props.card.cardName, assignment);
}

function handleTrimClick(): void {
  props.onTrimChange?.(props.card.cardName, !props.card.trimmed);
}

function handleNotesBlur(): void {
  debouncedNotesSave.cancel();
  props.onNotesChange?.(props.card.cardName, notesValue.value.trim());
}

function handleNotesInput(): void {
  debouncedNotesSave(notesValue.value);
}

function formatMultilineText(text: string): string {
  return text.split("\n").join("<br>");
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
  // Focus on close button for accessibility
  const closeBtn = document.querySelector(
    ".card-details-dialog .dialog-close"
  ) as HTMLButtonElement;
  if (closeBtn) {
    setTimeout(() => closeBtn.focus(), 100);
  }
});

onUnmounted(() => {
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleEscape);
});
</script>
