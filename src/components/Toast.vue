<template>
  <Teleport to="body">
    <div v-if="toasts.length > 0" class="toast-container">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
        >
          <span class="toast-icon">{{ toast.type === "success" ? "✓" : "✕" }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button
            class="toast-close"
            aria-label="Close"
            @click="removeToast(toast.id)"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
  timeoutId?: ReturnType<typeof setTimeout>;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

function showToast(message: string, type: "success" | "error" = "error"): void {
  const toast: Toast = {
    id: nextId++,
    message,
    type,
  };

  // Auto-dismiss after 5 seconds
  toast.timeoutId = setTimeout(() => {
    removeToast(toast.id);
  }, 5000);

  toasts.value.push(toast);
}

function removeToast(id: number): void {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index !== -1) {
    const toast = toasts.value[index];
    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
    }
    toasts.value.splice(index, 1);
  }
}

// Expose showToast function via provide/inject or event bus
// For now, we'll use a global event system
onMounted(() => {
  const handleToast = (event: CustomEvent) => {
    showToast(event.detail.message, event.detail.type);
  };
  window.addEventListener("show-toast", handleToast as EventListener);
});

onUnmounted(() => {
  window.removeEventListener("show-toast", () => {});
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--spacing-md);
  right: var(--spacing-md);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-width: 400px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
  min-width: 300px;
}

.toast-success {
  border-left: 4px solid var(--color-success);
}

.toast-error {
  border-left: 4px solid var(--color-danger);
}

.toast-icon {
  font-weight: bold;
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.toast-success .toast-icon {
  color: var(--color-success);
}

.toast-error .toast-icon {
  color: var(--color-danger);
}

.toast-message {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.toast-close {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  color: var(--color-text-light);
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-base);
}

.toast-close:hover {
  background-color: var(--color-surface);
  color: var(--color-text);
}

/* Toast transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-base);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform var(--transition-base);
}
</style>

