<template>
  <div v-if="cards.length === 0" class="card-list-empty">
    <p class="empty-message">
      {{ emptyMessage || "No cards match your filters" }}
    </p>
  </div>
  <div v-else class="card-list">
    <div class="card-list-header">
      <h2 class="card-list-title">Cards ({{ cards.length }})</h2>
    </div>
    <div class="card-list-grid">
      <CardComponent
        v-for="card in cards"
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
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Card, CardAssignment } from "../types/index.js";
import { useCardsStore } from "../stores/useCardsStore.js";
import { usePlayerNamesStore } from "../stores/usePlayerNamesStore.js";
import CardComponent from "./Card.vue";

interface Props {
  emptyMessage?: string;
  onCardClick?: (card: Card) => void;
  onAssignmentChange?: (cardName: string, assignment: CardAssignment) => void;
  onNotesChange?: (cardName: string, notes: string) => void;
  onTrimChange?: (cardName: string, trimmed: boolean) => void;
}

const props = defineProps<Props>();

const cardsStore = useCardsStore();
const playerNamesStore = usePlayerNamesStore();

const cards = computed(() => cardsStore.filteredCards);
const playerNames = computed(() => playerNamesStore.playerNames);

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

