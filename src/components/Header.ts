/**
 * Header component with app title, player name display, and settings/export-import buttons
 */

import type { PlayerNames } from "../types/index.js";

export interface HeaderProps {
    playerNames: PlayerNames;
    onSettingsClick?: () => void;
    onExportClick?: () => void;
    onImportClick?: () => void;
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
            <span class="player-name player-1">${this.props.playerNames.player1}</span>
            <span class="player-separator">&</span>
            <span class="player-name player-2">${this.props.playerNames.player2}</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-settings" aria-label="Settings" title="Settings">
            ⚙️
          </button>
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

        const settingsBtn = this.container.querySelector(".btn-settings");
        const exportBtn = this.container.querySelector(".btn-export");
        const importBtn = this.container.querySelector(".btn-import");

        settingsBtn?.addEventListener("click", () => {
            this.props.onSettingsClick?.();
        });

        exportBtn?.addEventListener("click", () => {
            this.props.onExportClick?.();
        });

        importBtn?.addEventListener("click", () => {
            this.props.onImportClick?.();
        });
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
     * Destroy the component and clean up event listeners
     */
    destroy(): void {
        // Event listeners will be cleaned up when container is removed
        this.container = null;
    }
}

