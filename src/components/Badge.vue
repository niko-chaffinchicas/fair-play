<template>
  <button
    v-if="(count !== undefined && count > 0) || showWhenZero"
    type="button"
    :class="['badge', `badge-${variant}`, { 'badge-clickable': clickable }]"
    :title="title"
    @click="handleBadgeClick"
  >
    <span class="badge-content">
      <span v-if="icon" class="badge-icon">{{ icon }}</span>
      <span class="badge-text">{{ label }}</span>
      <span v-if="count !== undefined && count >= 0" class="badge-count">{{
        count
      }}</span>
    </span>
    <button
      v-if="showEditIcon"
      type="button"
      class="badge-edit-icon"
      :aria-label="`Edit ${label}`"
      :title="`Edit ${label}`"
      @click.stop="handleEditClick"
    >
      ✏️
    </button>
  </button>
</template>

<script setup lang="ts">
interface Props {
  label: string;
  count?: number;
  variant: "player1" | "player2" | "shared" | "trimmed" | "default";
  icon?: string;
  title?: string;
  showWhenZero?: boolean;
  showEditIcon?: boolean;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  count: undefined,
  icon: undefined,
  title: undefined,
  showWhenZero: false,
  showEditIcon: false,
  clickable: true,
});

const emit = defineEmits<{
  click: [];
  "edit-click": [];
}>();

function handleBadgeClick(): void {
  if (props.clickable) {
    emit("click");
  }
}

function handleEditClick(): void {
  emit("edit-click");
}
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  border-radius: var(--radius-full);
  white-space: nowrap;
  border: none;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  position: relative;
}

.badge-clickable:hover {
  opacity: 0.9;
  transform: scale(1.05);
}

.badge-clickable:active {
  transform: scale(0.95);
}

.badge-content {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.badge-icon {
  font-size: 1em;
}

.badge-text {
  font-weight: 600;
}

.badge-count {
  font-weight: 700;
  opacity: 0.9;
}

.badge-edit-icon {
  margin-left: var(--spacing-xs);
  background: none;
  border: none;
  padding: 2px 4px;
  font-size: 0.85em;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  min-height: 20px;
}

.badge-edit-icon:hover {
  opacity: 1;
}

.badge-edit-icon:active {
  transform: scale(0.9);
}

/* Variant styles */
.badge-player1 {
  background-color: var(--color-player1);
  color: white;
}

.badge-player2 {
  background-color: var(--color-player2);
  color: white;
}

.badge-shared {
  background-color: var(--color-shared);
  color: white;
}

.badge-trimmed {
  background-color: var(--color-trimmed);
  color: white;
}

.badge-default {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
</style>
