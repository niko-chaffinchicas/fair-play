<template>
  <div
    :class="['card', compact ? 'card-compact' : 'card-full']"
    :data-card-name="card.cardName"
    :data-assignment="card.assignment"
    @click="handleCardClick"
  >
    <div class="card-header">
      <h2 v-if="!compact" class="card-name">{{ card.cardName }}</h2>
      <h3 v-else class="card-name">{{ card.cardName }}</h3>
      <span v-if="card.trimmed" class="card-trimmed-badge">Trimmed</span>
    </div>
    <div class="card-body">
      <div class="card-categories">
        <span
          v-for="category in categories"
          :key="category"
          class="card-category-tag"
        >
          {{ category }}
        </span>
      </div>
      <div class="card-assignment">
        <label class="card-assignment-label">
          Assignment:
          <select
            class="card-assignment-select"
            :value="card.assignment"
            @change="handleAssignmentChange"
            @click.stop
          >
            <option value="unassigned">Unassigned</option>
            <option value="player1">{{ playerNames.player1 }}</option>
            <option value="player2">{{ playerNames.player2 }}</option>
            <option value="shared">Shared</option>
          </select>
        </label>
        <span
          :class="[
            'card-assignment-badge',
            `card-assignment-${card.assignment}`,
          ]"
          :title="assignmentDisplayName"
        >
          <span class="card-assignment-icon">{{ assignmentIcon }}</span>
          <span class="card-assignment-text">{{ assignmentDisplayName }}</span>
        </span>
      </div>
      <div class="card-actions">
        <button
          type="button"
          :class="['btn', 'btn-trim', card.trimmed ? 'btn-trimmed' : '']"
          :aria-label="card.trimmed ? 'Untrim' : 'Trim'"
          :title="card.trimmed ? 'Click to untrim this card' : 'Click to trim this card'"
          @click.stop="handleTrimClick"
        >
          {{ card.trimmed ? "✂️ Untrim" : "✂️ Trim" }}
        </button>
      </div>
      <div v-if="!compact" class="card-details">
        <div class="card-section">
          <h4 class="card-section-title">Planning</h4>
          <p class="card-section-content" v-html="formatMultilineText(card.planning)"></p>
        </div>
        <div class="card-section">
          <h4 class="card-section-title">Execution</h4>
          <p class="card-section-content" v-html="formatMultilineText(card.execution)"></p>
        </div>
        <div class="card-section">
          <h4 class="card-section-title">Minimum Standard of Care</h4>
          <p class="card-section-content" v-html="formatMultilineText(card.minimumStandardOfCare)"></p>
        </div>
        <div class="card-section">
          <h4 class="card-section-title">Question</h4>
          <p class="card-section-content" v-html="formatMultilineText(card.minimumStandardOfCareQuestion)"></p>
        </div>
      </div>
      <div class="card-notes-container">
        <button
          type="button"
          :class="['card-notes-toggle', notesExpanded ? 'expanded' : '']"
          :aria-expanded="notesExpanded"
          @click.stop="toggleNotes"
        >
          <span class="card-notes-toggle-text">
            Notes{{ card.notes ? ` (${card.notes.length})` : "" }}
          </span>
          <span class="card-notes-toggle-icon">{{ notesExpanded ? "▼" : "▶" }}</span>
          <span v-if="card.notes" class="card-notes-indicator" title="Has notes">
            📝
          </span>
        </button>
        <div
          :class="['card-notes-content', notesExpanded ? 'expanded' : '']"
        >
          <textarea
            v-model="notesValue"
            class="card-notes-textarea"
            placeholder="Add notes about this card..."
            rows="4"
            @blur="handleNotesBlur"
            @input="handleNotesInput"
            @click.stop
          />
          <p
            v-if="card.notes && !notesExpanded && compact"
            class="card-notes-preview-text"
          >
            {{ card.notes.substring(0, 100) }}{{ card.notes.length > 100 ? "..." : "" }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Card as CardType, CardAssignment } from "../types/index.js";
import { useDebounce } from "../composables/useDebounce.js";
import { usePlayerNamesStore } from "../stores/usePlayerNamesStore.js";

interface Props {
  card: CardType;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
});

const emit = defineEmits<{
  click: [card: CardType];
  "assignment-change": [cardName: string, assignment: CardAssignment];
  "notes-change": [cardName: string, notes: string];
  "trim-change": [cardName: string, trimmed: boolean];
}>();

const playerNamesStore = usePlayerNamesStore();
const playerNames = computed(() => playerNamesStore.playerNames);

const notesExpanded = ref(false);
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
  emit("notes-change", props.card.cardName, notes.trim());
}, 1000);

function handleCardClick(e: MouseEvent): void {
  // Don't trigger if clicking on interactive elements
  const target = e.target as HTMLElement;
  if (
    target.closest(".card-assignment-select") ||
    target.closest(".card-notes-container") ||
    target.closest(".btn-trim")
  ) {
    return;
  }
  emit("click", props.card);
}

function handleAssignmentChange(e: Event): void {
  const target = e.target as HTMLSelectElement;
  const assignment = target.value as CardAssignment;
  emit("assignment-change", props.card.cardName, assignment);
}

function handleTrimClick(): void {
  emit("trim-change", props.card.cardName, !props.card.trimmed);
}

function toggleNotes(): void {
  notesExpanded.value = !notesExpanded.value;
}

function handleNotesBlur(): void {
  debouncedNotesSave.cancel();
  emit("notes-change", props.card.cardName, notesValue.value.trim());
}

function handleNotesInput(): void {
  debouncedNotesSave(notesValue.value);
}

function formatMultilineText(text: string): string {
  return text.split("\n").join("<br>");
}
</script>

