/**
 * Menu Screen - Start menu with new game option
 */

import { BaseScreen } from '../BaseScreen';
import type { EventSystem } from '@/systems/EventSystem';
import type { GameStateManager } from '@/systems/GameStateManager';
import type { ScreenData } from '../ScreenManager';

export class MenuScreen extends BaseScreen {
  constructor(
    eventSystem: EventSystem,
    gameState: GameStateManager
  ) {
    super('menu', eventSystem, gameState, null as any);
  }

  protected createContent(): string {
    const hasSaveData = this.gameState.hasSaveData();

    return `
      <div class="menu-screen">
        <div class="menu-container">
          <div class="game-logo">
            <img src="/art/game_logo.png" alt="Meet Cute Cafe" />
          </div>
          
          <h1 class="game-title">Meet Cute Cafe</h1>
          <p class="game-subtitle">A romantic cafe adventure</p>
          
          <div class="menu-buttons">
            ${hasSaveData ? `
              <button class="menu-btn menu-btn--primary" data-action="continue-game">
                <span class="material-icons">play_arrow</span>
                Continue Game
              </button>
            ` : ''}
            
            <button class="menu-btn ${!hasSaveData ? 'menu-btn--primary' : 'menu-btn--secondary'}" data-action="new-game">
              <span class="material-icons">add</span>
              New Game
            </button>
            
            ${hasSaveData ? `
              <button class="menu-btn menu-btn--danger" data-action="reset-game">
                <span class="material-icons">delete</span>
                Reset Save Data
              </button>
            ` : ''}
          </div>
          
          <div class="menu-footer">
            <p>Version 0.1.0 - Development Build</p>
          </div>
        </div>
      </div>
    `;
  }

  protected override setupEventListeners(): void {
    super.setupEventListeners();
    
    // Hide the persistent header on menu screen
    this.eventSystem.emit('header:hide');
  }

  protected override handleAction(action: string, element: HTMLElement): void {
    switch (action) {
      case 'continue-game':
        this.continueGame();
        break;
      
      case 'new-game':
        this.startNewGame();
        break;
      
      case 'reset-game':
        this.resetGame();
        break;
      
      default:
        super.handleAction(action, element);
    }
  }

  private continueGame(): void {
    // Show header again
    this.eventSystem.emit('header:show');
    this.eventSystem.emit('ui:show_screen', { screenId: 'cafe-hub' });
  }

  private startNewGame(): void {
    const confirm = window.confirm(
      'Are you sure you want to start a new game? This will create a fresh save file.'
    );
    
    if (confirm) {
      // Reset game state
      this.gameState.resetGame();
      
      // Show header
      this.eventSystem.emit('header:show');
      
      // Navigate to cafe hub
      this.eventSystem.emit('ui:show_screen', { screenId: 'cafe-hub' });
    }
  }

  private resetGame(): void {
    const confirm = window.confirm(
      'Are you sure you want to reset all save data? This action cannot be undone!'
    );
    
    if (confirm) {
      // Reset game state
      this.gameState.resetGame();
      
      // Refresh the menu screen
      this.updateContent();
    }
  }
}

