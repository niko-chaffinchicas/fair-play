/**
 * Filter controls for categories and assignment status
 */

import type {
  CategoryFilter,
  AssignmentStatusFilter,
  PlayerNames,
} from "../types/index.js";

export interface FilterSectionProps {
  playerNames: PlayerNames;
  selectedCategories: CategoryFilter[];
  selectedAssignmentStatus: AssignmentStatusFilter[];
  onCategoryChange: (categories: CategoryFilter[]) => void;
  onAssignmentStatusChange: (statuses: AssignmentStatusFilter[]) => void;
  onClearFilters: () => void;
}

export class FilterSection {
  private container: HTMLElement | null = null;
  private props: FilterSectionProps;
  private isExpanded: boolean = false;

  // Available filter options
  private readonly categories: CategoryFilter[] = [
    "Magic",
    "Daily Grind",
    "Caregiving",
    "Out",
    "Wild",
    "Home",
    "Happiness Trio",
  ];

  private readonly assignmentStatuses: AssignmentStatusFilter[] = [
    "unassigned",
    "player1",
    "player2",
    "shared",
    "trimmed",
  ];

  constructor(props: FilterSectionProps) {
    this.props = props;
  }

  /**
   * Render the filter section component
   * @param container - The container element to render into
   */
  render(container: HTMLElement): void {
    this.container = container;
    this.updateHTML();
    this.attachEventListeners();
  }

  /**
   * Update the HTML content
   */
  private updateHTML(): void {
    if (!this.container) return;

    const expandedClass = this.isExpanded ? "expanded" : "";
    const categoryFiltersHTML = this.renderCategoryFilters();
    const statusFiltersHTML = this.renderAssignmentStatusFilters();

    this.container.innerHTML = `
      <div class="filter-section ${expandedClass}">
        <button class="filter-toggle" aria-label="Toggle filters" aria-expanded="${this.isExpanded}">
          <span class="filter-toggle-text">Filters</span>
          <span class="filter-toggle-icon">${this.isExpanded ? "▼" : "▶"}</span>
        </button>
        <div class="filter-content">
          <div class="filter-group">
            <h3 class="filter-group-title">Categories</h3>
            <div class="filter-checkboxes">
              ${categoryFiltersHTML}
            </div>
          </div>
          <div class="filter-group">
            <h3 class="filter-group-title">Assignment Status</h3>
            <div class="filter-checkboxes">
              ${statusFiltersHTML}
            </div>
          </div>
          <button class="btn btn-clear-filters">Clear Filters</button>
        </div>
      </div>
    `;
  }

  /**
   * Render category filter checkboxes
   */
  private renderCategoryFilters(): string {
    return this.categories
      .map(
        (category) => `
      <label class="filter-checkbox">
        <input
          type="checkbox"
          value="${category}"
          ${this.props.selectedCategories.includes(category) ? "checked" : ""}
          data-filter-type="category"
        />
        <span>${category}</span>
      </label>
    `
      )
      .join("");
  }

  /**
   * Render assignment status filter checkboxes
   */
  private renderAssignmentStatusFilters(): string {
    return this.assignmentStatuses
      .map((status) => {
        const displayName = this.getAssignmentStatusDisplayName(status);
        return `
      <label class="filter-checkbox">
        <input
          type="checkbox"
          value="${status}"
          ${this.props.selectedAssignmentStatus.includes(status) ? "checked" : ""}
          data-filter-type="assignment"
        />
        <span>${displayName}</span>
      </label>
    `;
      })
      .join("");
  }

  /**
   * Get display name for assignment status
   */
  private getAssignmentStatusDisplayName(
    status: AssignmentStatusFilter
  ): string {
    switch (status) {
      case "player1":
        return this.props.playerNames.player1;
      case "player2":
        return this.props.playerNames.player2;
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

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Toggle button for mobile
    const toggleBtn = this.container.querySelector(".filter-toggle");
    toggleBtn?.addEventListener("click", () => {
      this.toggle();
    });

    // Category filter checkboxes
    const categoryCheckboxes = this.container.querySelectorAll(
      'input[data-filter-type="category"]'
    );
    categoryCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        this.handleCategoryChange(target.value as CategoryFilter, target.checked);
      });
    });

    // Assignment status filter checkboxes
    const statusCheckboxes = this.container.querySelectorAll(
      'input[data-filter-type="assignment"]'
    );
    statusCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        this.handleAssignmentStatusChange(
          target.value as AssignmentStatusFilter,
          target.checked
        );
      });
    });

    // Clear filters button
    const clearBtn = this.container.querySelector(".btn-clear-filters");
    clearBtn?.addEventListener("click", () => {
      this.props.onClearFilters();
    });
  }

  /**
   * Handle category filter change
   */
  private handleCategoryChange(
    category: CategoryFilter,
    isChecked: boolean
  ): void {
    let newCategories: CategoryFilter[];
    if (isChecked) {
      newCategories = [...this.props.selectedCategories, category];
    } else {
      newCategories = this.props.selectedCategories.filter((c) => c !== category);
    }
    this.props.onCategoryChange(newCategories);
  }

  /**
   * Handle assignment status filter change
   */
  private handleAssignmentStatusChange(
    status: AssignmentStatusFilter,
    isChecked: boolean
  ): void {
    let newStatuses: AssignmentStatusFilter[];
    if (isChecked) {
      newStatuses = [...this.props.selectedAssignmentStatus, status];
    } else {
      newStatuses = this.props.selectedAssignmentStatus.filter(
        (s) => s !== status
      );
    }
    this.props.onAssignmentStatusChange(newStatuses);
  }

  /**
   * Toggle expanded/collapsed state (for mobile)
   */
  toggle(): void {
    this.isExpanded = !this.isExpanded;
    this.updateHTML();
    this.attachEventListeners();
  }

  /**
   * Update player names (to reflect in assignment status filters)
   */
  updatePlayerNames(playerNames: PlayerNames): void {
    this.props.playerNames = playerNames;
    this.updateHTML();
    this.attachEventListeners();
  }

  /**
   * Update selected filters
   */
  updateFilters(
    categories: CategoryFilter[],
    assignmentStatus: AssignmentStatusFilter[]
  ): void {
    this.props.selectedCategories = categories;
    this.props.selectedAssignmentStatus = assignmentStatus;
    this.updateHTML();
    this.attachEventListeners();
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    this.container = null;
  }
}

