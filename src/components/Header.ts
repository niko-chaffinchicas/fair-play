/**
 * Header component with app title, player name display, and settings/export-import buttons
 */

import type { PlayerNames } from "../types/index.js";

export interface HeaderProps {
  playerNames: PlayerNames;
  trimmedCount?: number;
  onSettingsClick?: () => void;
  onExportClick?: () => void;
  onImportClick?: () => void;
  onPlayerNamesClick?: () => void;
}

export class Header {
  private container: HTMLElement | null = null;
  private props: HeaderProps;

  constructor(props: HeaderProps) {
    this.props = props;
  }

  /**
   * Render the header component
   * @param container - The container element to render into
   */
  render(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = `
      <header class="app-header">
        <div class="header-content">
          <h1 class="app-title">Fair Play Card Manager</h1>
          <div class="player-names-display">
            <button class="player-name player-1" type="button" aria-label="Edit Player 1 name">${this.escapeHtml(this.props.playerNames.player1)}</button>
            <span class="player-separator">&</span>
            <button class="player-name player-2" type="button" aria-label="Edit Player 2 name">${this.escapeHtml(this.props.playerNames.player2)}</button>
          </div>
          ${this.props.trimmedCount !== undefined && this.props.trimmedCount > 0 ? `<div class="trimmed-count-badge" title="${this.props.trimmedCount} trimmed card${this.props.trimmedCount !== 1 ? 's' : ''}">✂️ ${this.props.trimmedCount}</div>` : ''}
        </div>
        <div class="header-actions">
          <!-- Settings button removed until functionality is implemented -->
          <button class="btn btn-export" aria-label="Export Data" title="Export Data">
            📥 Export
          </button>
          <button class="btn btn-import" aria-label="Import Data" title="Import Data">
            📤 Import
          </button>
        </div>
      </header>
    `;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Attach event listeners to header buttons
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    const exportBtn = this.container.querySelector(".btn-export");
    const importBtn = this.container.querySelector(".btn-import");
    const player1Btn = this.container.querySelector(".player-1");
    const player2Btn = this.container.querySelector(".player-2");
    const playerNamesDisplay = this.container.querySelector(".player-names-display");

    exportBtn?.addEventListener("click", () => {
      this.props.onExportClick?.();
    });

    importBtn?.addEventListener("click", () => {
      this.props.onImportClick?.();
    });

    // Make player names clickable to edit
    if (this.props.onPlayerNamesClick) {
      player1Btn?.addEventListener("click", () => {
        this.props.onPlayerNamesClick?.();
      });
      player2Btn?.addEventListener("click", () => {
        this.props.onPlayerNamesClick?.();
      });
      playerNamesDisplay?.addEventListener("click", (e) => {
        // If clicking on the separator, also trigger edit
        if ((e.target as HTMLElement).classList.contains("player-separator")) {
          this.props.onPlayerNamesClick?.();
        }
      });
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Update player names display
   */
  updatePlayerNames(playerNames: PlayerNames): void {
    this.props.playerNames = playerNames;
    if (this.container) {
      const player1El = this.container.querySelector(".player-1");
      const player2El = this.container.querySelector(".player-2");
      if (player1El) player1El.textContent = playerNames.player1;
      if (player2El) player2El.textContent = playerNames.player2;
    }
  }

  /**
   * Update trimmed count display
   */
  updateTrimmedCount(count: number): void {
    this.props.trimmedCount = count;
    if (this.container) {
      const badge = this.container.querySelector(".trimmed-count-badge");
      if (count > 0) {
        if (badge) {
          badge.textContent = `✂️ ${count}`;
          badge.setAttribute("title", `${count} trimmed card${count !== 1 ? 's' : ''}`);
        } else {
          // Create badge if it doesn't exist
          const headerContent = this.container.querySelector(".header-content");
          if (headerContent) {
            const newBadge = document.createElement("div");
            newBadge.className = "trimmed-count-badge";
            newBadge.textContent = `✂️ ${count}`;
            newBadge.setAttribute("title", `${count} trimmed card${count !== 1 ? 's' : ''}`);
            headerContent.appendChild(newBadge);
          }
        }
      } else {
        // Remove badge if count is 0
        badge?.remove();
      }
    }
  }

  /**
   * Destroy the component and clean up event listeners
   */
  destroy(): void {
    // Event listeners will be cleaned up when container is removed
    this.container = null;
  }
}

