<template>
  <div class="filter-section" :class="{ expanded: isExpanded }">
    <button
      class="filter-toggle"
      aria-label="Toggle filters"
      :aria-expanded="isExpanded"
      @click="toggleExpanded"
    >
      <span class="filter-toggle-text">Filters</span>
      <span class="filter-toggle-icon">{{ isExpanded ? "▼" : "▶" }}</span>
    </button>
    <div class="filter-content">
      <div class="filter-group">
        <h3 class="filter-group-title">Categories</h3>
        <div class="filter-checkboxes">
          <label
            v-for="category in categories"
            :key="category"
            class="filter-checkbox"
          >
            <input
              type="checkbox"
              :value="category"
              :checked="selectedCategories.includes(category)"
              @change="handleCategoryChange(category, $event)"
            />
            <span>{{ category }}</span>
          </label>
        </div>
      </div>
      <div class="filter-group">
        <h3 class="filter-group-title">Assignment Status</h3>
        <div class="filter-checkboxes">
          <label
            v-for="status in assignmentStatuses"
            :key="status"
            class="filter-checkbox"
          >
            <input
              type="checkbox"
              :value="status"
              :checked="selectedAssignmentStatus.includes(status)"
              @change="handleAssignmentStatusChange(status, $event)"
            />
            <span>{{ getAssignmentStatusDisplayName(status) }}</span>
          </label>
        </div>
      </div>
      <button class="btn btn-clear-filters" @click="handleClearFilters">
        Clear Filters
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type {
  CategoryFilter,
  AssignmentStatusFilter,
} from "../types/index.js";
import { useFiltersStore } from "../stores/useFiltersStore.js";
import { usePlayerNamesStore } from "../stores/usePlayerNamesStore.js";

const filtersStore = useFiltersStore();
const playerNamesStore = usePlayerNamesStore();

const isExpanded = ref(false);

const categories: CategoryFilter[] = [
  "Magic",
  "Daily Grind",
  "Caregving",
  "Out",
  "Wild",
  "Home",
  "Happiness Trio",
];

const assignmentStatuses: AssignmentStatusFilter[] = [
  "unassigned",
  "player1",
  "player2",
  "shared",
  "trimmed",
];

const selectedCategories = computed(() => filtersStore.categories);
const selectedAssignmentStatus = computed(
  () => filtersStore.assignmentStatus
);

function toggleExpanded(): void {
  isExpanded.value = !isExpanded.value;
}

function handleCategoryChange(
  category: CategoryFilter,
  event: Event
): void {
  const checked = (event.target as HTMLInputElement).checked;
  const current = [...filtersStore.categories];

  if (checked) {
    if (!current.includes(category)) {
      filtersStore.setCategories([...current, category]);
    }
  } else {
    filtersStore.setCategories(current.filter((c) => c !== category));
  }
}

function handleAssignmentStatusChange(
  status: AssignmentStatusFilter,
  event: Event
): void {
  const checked = (event.target as HTMLInputElement).checked;
  const current = [...filtersStore.assignmentStatus];

  if (checked) {
    if (!current.includes(status)) {
      filtersStore.setAssignmentStatus([...current, status]);
    }
  } else {
    filtersStore.setAssignmentStatus(current.filter((s) => s !== status));
  }
}

function handleClearFilters(): void {
  filtersStore.clearFilters();
}

function getAssignmentStatusDisplayName(
  status: AssignmentStatusFilter
): string {
  switch (status) {
    case "player1":
      return playerNamesStore.playerNames.player1;
    case "player2":
      return playerNamesStore.playerNames.player2;
    case "unassigned":
      return "Unassigned";
    case "shared":
      return "Shared";
    case "trimmed":
      return "Trimmed";
    default:
      return status;
  }
}
</script>

