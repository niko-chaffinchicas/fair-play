/**
 * Search input component with debounced filtering logic
 */

export interface SearchBarProps {
  onSearchChange: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export class SearchBar {
  private container: HTMLElement | null = null;
  private props: SearchBarProps;
  private debounceTimer: number | null = null;
  private readonly debounceDelay: number;

  constructor(props: SearchBarProps) {
    this.props = props;
    this.debounceDelay = props.debounceMs || 300;
  }

  /**
   * Render the search bar component
   * @param container - The container element to render into
   */
  render(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = `
      <div class="search-bar">
        <input
          type="search"
          class="search-input"
          placeholder="${this.props.placeholder || "Search cards..."}"
          aria-label="Search cards"
        />
      </div>
    `;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Attach event listeners to search input
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    const searchInput = this.container.querySelector(
      ".search-input"
    ) as HTMLInputElement;

    if (!searchInput) return;

    searchInput.addEventListener("input", (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.handleSearchInput(target.value);
    });

    // Clear search on Escape key
    searchInput.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        this.handleSearchInput("");
      }
    });
  }

  /**
   * Handle search input with debouncing
   */
  private handleSearchInput(query: string): void {
    // Clear existing timer
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = window.setTimeout(() => {
      this.props.onSearchChange(query.trim());
      this.debounceTimer = null;
    }, this.debounceDelay);
  }

  /**
   * Get current search query
   */
  getQuery(): string {
    if (!this.container) return "";
    const searchInput = this.container.querySelector(
      ".search-input"
    ) as HTMLInputElement;
    return searchInput?.value.trim() || "";
  }

  /**
   * Set search query programmatically
   */
  setQuery(query: string): void {
    if (!this.container) return;
    const searchInput = this.container.querySelector(
      ".search-input"
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.value = query;
      this.handleSearchInput(query);
    }
  }

  /**
   * Clear the search input
   */
  clear(): void {
    this.setQuery("");
  }

  /**
   * Destroy the component and clean up
   */
  destroy(): void {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.container = null;
  }
}

