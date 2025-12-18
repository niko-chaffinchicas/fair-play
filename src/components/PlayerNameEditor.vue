<template>
  <Teleport to="body">
    <div class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog player-name-editor-dialog" @click.stop>
        <div class="dialog-header">
          <h2 class="dialog-title">Edit Player Names</h2>
          <button
            class="dialog-close"
            aria-label="Close"
            @click="handleCancel"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <form class="player-name-editor-form" @submit.prevent="handleSave">
            <div class="form-group">
              <label for="player1-input">Player 1 Name:</label>
              <input
                id="player1-input"
                v-model="player1Name"
                type="text"
                name="player1"
                class="player-name-input"
                placeholder="Enter Player 1 name"
                maxlength="50"
                required
                @keydown.enter.prevent="handleSave"
              />
            </div>
            <div class="form-group">
              <label for="player2-input">Player 2 Name:</label>
              <input
                id="player2-input"
                v-model="player2Name"
                type="text"
                name="player2"
                class="player-name-input"
                placeholder="Enter Player 2 name"
                maxlength="50"
                required
                @keydown.enter.prevent="handleSave"
              />
            </div>
          </form>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary btn-cancel" @click="handleCancel">
            Cancel
          </button>
          <button class="btn btn-primary btn-save" @click="handleSave">
            Save
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { PlayerNames } from "../types/index.js";

interface Props {
  playerNames: PlayerNames;
  onSave: (playerNames: PlayerNames) => void;
  onCancel?: () => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const player1Name = ref(props.playerNames.player1);
const player2Name = ref(props.playerNames.player2);

function handleSave(): void {
  const newPlayerNames: PlayerNames = {
    player1: player1Name.value.trim() || "Player 1",
    player2: player2Name.value.trim() || "Player 2",
  };
  props.onSave(newPlayerNames);
  emit("close");
}

function handleCancel(): void {
  props.onCancel?.();
  emit("close");
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
  // Focus on first input
  const firstInput = document.getElementById("player1-input") as HTMLInputElement;
  if (firstInput) {
    setTimeout(() => {
      firstInput.focus();
      firstInput.select();
    }, 100);
  }
});

onUnmounted(() => {
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleEscape);
});
</script>

