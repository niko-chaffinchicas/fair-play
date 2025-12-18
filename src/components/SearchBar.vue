<template>
  <div class="search-bar">
    <input
      type="search"
      class="search-input"
      :placeholder="placeholder"
      aria-label="Search cards"
      :value="searchQuery"
      @input="handleInput"
      @keydown="handleKeydown"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useDebounce } from "../composables/useDebounce.js";
import { useFiltersStore } from "../stores/useFiltersStore.js";

interface Props {
  placeholder?: string;
  debounceMs?: number;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Search cards...",
  debounceMs: 300,
});

const filtersStore = useFiltersStore();
const searchQuery = ref(filtersStore.searchQuery);

// Create debounced function to update filter store
const debouncedUpdate = useDebounce((query: string) => {
  filtersStore.setSearchQuery(query);
}, props.debounceMs);

// Watch for external changes to search query (e.g., clear filters)
watch(
  () => filtersStore.searchQuery,
  (newQuery) => {
    searchQuery.value = newQuery;
  }
);

function handleInput(e: Event): void {
  const target = e.target as HTMLInputElement;
  const query = target.value;
  searchQuery.value = query;
  debouncedUpdate(query);
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    searchQuery.value = "";
    filtersStore.setSearchQuery("");
    debouncedUpdate.cancel();
  }
}

// Expose methods for parent component if needed
defineExpose({
  clear: () => {
    searchQuery.value = "";
    filtersStore.setSearchQuery("");
    debouncedUpdate.cancel();
  },
  getQuery: () => searchQuery.value,
});
</script>

