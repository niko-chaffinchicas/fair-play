/**
 * Pinia store for filter state
 * Manages search query, category filters, and assignment status filters
 */

import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import type {
  CategoryFilter,
  AssignmentStatusFilter,
} from "../types/index.js";

export const useFiltersStore = defineStore("filters", () => {
  // State
  const searchQuery: Ref<string> = ref("");
  const categories: Ref<CategoryFilter[]> = ref([]);
  const assignmentStatus: Ref<AssignmentStatusFilter[]> = ref([]);

  // Actions
  function setSearchQuery(query: string): void {
    searchQuery.value = query.trim();
  }

  function setCategories(newCategories: CategoryFilter[]): void {
    categories.value = [...newCategories];
  }

  function setAssignmentStatus(statuses: AssignmentStatusFilter[]): void {
    assignmentStatus.value = [...statuses];
  }

  function clearFilters(): void {
    searchQuery.value = "";
    categories.value = [];
    assignmentStatus.value = [];
  }

  return {
    // State
    searchQuery,
    categories,
    assignmentStatus,
    // Actions
    setSearchQuery,
    setCategories,
    setAssignmentStatus,
    clearFilters,
  };
});

