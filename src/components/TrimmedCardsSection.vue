<template>
  <div v-if="trimmedCards.length > 0" class="trimmed-cards-section">
    <button
      :class="['trimmed-cards-toggle', isExpanded ? 'expanded' : '']"
      type="button"
      :aria-label="isExpanded ? 'Collapse' : 'Expand'"
      :aria-expanded="isExpanded"
      @click="toggleExpanded"
    >
      <span class="trimmed-cards-toggle-icon">{{ isExpanded ? "▼" : "▶" }}</span>
      <span class="trimmed-cards-toggle-text">
        Trimmed Cards ({{ trimmedCards.length }})
      </span>
    </button>
    <div :class="['trimmed-cards-content', isExpanded ? 'expanded' : '']">
      <div class="trimmed-cards-grid">
        <CardComponent
          v-for="card in trimmedCards"
          :key="card.cardName"
          :card="card"
          :player-names="playerNames"
          :compact="true"
          @click="handleCardClick(card)"
          @assignment-change="handleAssignmentChange"
          @notes-change="handleNotesChange"
          @trim-change="handleTrimChange"
        />
      </div>
    </div>
  </div>
  <div v-else class="trimmed-cards-section">
    <p class="empty-message">No cards are currently trimmed.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Card, CardAssignment } from "../types/index.js";
import { useCardsStore } from "../stores/useCardsStore.js";
import { usePlayerNamesStore } from "../stores/usePlayerNamesStore.js";
import CardComponent from "./Card.vue";

interface Props {
  onCardClick?: (card: Card) => void;
  onAssignmentChange?: (cardName: string, assignment: CardAssignment) => void;
  onNotesChange?: (cardName: string, notes: string) => void;
  onTrimChange?: (cardName: string, trimmed: boolean) => void;
}

const props = defineProps<Props>();

const cardsStore = useCardsStore();
const playerNamesStore = usePlayerNamesStore();

const isExpanded = ref(false);
const trimmedCards = computed(() => cardsStore.trimmedCards);
const playerNames = computed(() => playerNamesStore.playerNames);

function toggleExpanded(): void {
  isExpanded.value = !isExpanded.value;
}

function handleCardClick(card: Card): void {
  props.onCardClick?.(card);
}

function handleAssignmentChange(
  cardName: string,
  assignment: CardAssignment
): void {
  props.onAssignmentChange?.(cardName, assignment);
}

function handleNotesChange(cardName: string, notes: string): void {
  props.onNotesChange?.(cardName, notes);
}

function handleTrimChange(cardName: string, trimmed: boolean): void {
  props.onTrimChange?.(cardName, trimmed);
}
</script>

