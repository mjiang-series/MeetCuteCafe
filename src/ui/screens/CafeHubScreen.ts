/**
 * Café Hub Screen - The main game hub
 * Interactive café scene with hotspots for navigation
 */

import { BaseScreen } from '../BaseScreen';
import type { EventSystem } from '@/systems/EventSystem';
import type { GameStateManager } from '@/systems/GameStateManager';
import type { AssetManager } from '@/systems/AssetManager';
import type { ScreenData } from '../ScreenManager';
import { getNpcPortraitPath } from '@/utils/AssetPaths';

export class CafeHubScreen extends BaseScreen {
  constructor(
    eventSystem: EventSystem,
    gameState: GameStateManager,
    assetManager: AssetManager
  ) {
    super('cafe-hub', eventSystem, gameState, assetManager);
  }

  protected createContent(): string {
    const player = this.gameState.getPlayer();
    const npcData = [
      { id: 'aria', name: 'Aria', available: true },
      { id: 'kai', name: 'Kai', available: true },
      { id: 'elias', name: 'Elias', available: true },
    ];

    return `
      <div class="cafe-hub">
        <div class="cafe-scene">
          <!-- Café Background -->
          <div class="cafe-background">
            <div class="cafe-interior">
              <!-- Counter Area -->
              <div class="counter-area hotspot" data-navigate="orders" data-hotspot="counter">
                <div class="counter-surface"></div>
                <div class="counter-items">
                  <div class="order-book">📋</div>
                  <div class="cash-register">💰</div>
                </div>
                <div class="hotspot-label">Orders</div>
              </div>

              <!-- Flavor Collection Area -->
              <div class="flavor-area hotspot" data-navigate="flavor-collection" data-hotspot="flavors">
                <div class="flavor-shelf">
                  <div class="flavor-jars">
                    <div class="jar jar--sweet">🍯</div>
                    <div class="jar jar--salty">🧂</div>
                    <div class="jar jar--bitter">☕</div>
                    <div class="jar jar--spicy">🌶️</div>
                    <div class="jar jar--fresh">🍃</div>
                  </div>
                </div>
                <div class="hotspot-label">Flavors</div>
              </div>

              <!-- Journal Area -->
              <div class="journal-area hotspot" data-navigate="journal" data-hotspot="journal">
                <div class="journal-book">📖</div>
                <div class="memory-photos">
                  <div class="photo">📷</div>
                  <div class="photo">📷</div>
                </div>
                <div class="hotspot-label">Journal</div>
              </div>

              <!-- NPCs in the café -->
              <div class="npcs-area">
                ${npcData.map(npc => this.renderNPC(npc)).join('')}
              </div>

              <!-- Ambient elements -->
              <div class="ambient-elements">
                <div class="steam steam-1"></div>
                <div class="steam steam-2"></div>
                <div class="plants">🪴</div>
                <div class="window">
                  <div class="window-light"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Panel -->
        <div class="status-panel">
          <div class="cafe-stats">
            <div class="stat-item">
              <span class="stat-label">Orders Completed</span>
              <span class="stat-value">${this.getOrdersCompleted()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Memories Created</span>
              <span class="stat-value">${player.journal.entries.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Flavors Collected</span>
              <span class="stat-value">${player.flavors.length}</span>
            </div>
          </div>
          
          <div class="quick-actions">
            <button class="quick-action-btn" data-navigate="orders">
              <span class="btn-icon">📋</span>
              <span class="btn-label">View Orders</span>
            </button>
            <button class="quick-action-btn" data-navigate="flavor-collection">
              <span class="btn-icon">⚗️</span>
              <span class="btn-label">Manage Flavors</span>
            </button>
          </div>
        </div>

        <!-- Welcome message for new players -->
        ${this.shouldShowWelcome() ? this.renderWelcomeMessage() : ''}
      </div>
    `;
  }

  /**
   * Render NPC in the café
   */
  private renderNPC(npc: { id: string; name: string; available: boolean }): string {
    const npcState = this.gameState.getNPC(npc.id as any);
    const hasUnread = npcState.unreadDmCount > 0;
    
    return `
      <div class="npc npc--${npc.id} ${npc.available ? 'npc--available' : 'npc--away'}" 
           data-action="interact-npc" 
           data-npc-id="${npc.id}">
        <div class="npc-avatar">
          <img src="${getNpcPortraitPath(npc.id as any)}" alt="${npc.name}" />
          ${hasUnread ? '<div class="unread-indicator">💬</div>' : ''}
        </div>
        <div class="npc-name">${npc.name}</div>
        <div class="npc-status">
          ${npc.available ? 'Available' : 'Away'}
        </div>
        ${npcState.callAvailable ? '<div class="call-indicator">📞</div>' : ''}
      </div>
    `;
  }

  /**
   * Render welcome message for new players
   */
  private renderWelcomeMessage(): string {
    return `
      <div class="welcome-overlay" id="welcome-overlay">
        <div class="welcome-modal">
          <div class="welcome-content">
            <h2>Welcome to Your Café! ☕</h2>
            <p>This is your cozy café where magical connections bloom. Here's how to get started:</p>
            
            <div class="tutorial-steps">
              <div class="tutorial-step">
                <span class="step-icon">📋</span>
                <div class="step-text">
                  <strong>Take Orders</strong>
                  <p>Click the counter to see customer and NPC orders</p>
                </div>
              </div>
              
              <div class="tutorial-step">
                <span class="step-icon">⚗️</span>
                <div class="step-text">
                  <strong>Collect Flavors</strong>
                  <p>Build your flavor collection to fulfill more orders</p>
                </div>
              </div>
              
              <div class="tutorial-step">
                <span class="step-icon">💕</span>
                <div class="step-text">
                  <strong>Build Relationships</strong>
                  <p>Complete NPC orders to create memories and deepen bonds</p>
                </div>
              </div>
            </div>
            
            <button class="btn btn--primary" data-action="close-welcome">
              Start My Café Journey!
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Check if should show welcome message
   */
  private shouldShowWelcome(): boolean {
    const player = this.gameState.getPlayer();
    return player.journal.entries.length === 0 && this.getOrdersCompleted() === 0;
  }

  /**
   * Get orders completed count (placeholder for now)
   */
  private getOrdersCompleted(): number {
    // TODO: Implement order tracking
    return 0;
  }

  /**
   * Handle screen show
   */
  protected override onScreenShow(data?: ScreenData): void {
    // Set header variant
    this.eventSystem.emit('header:set_variant', { variant: 'cafe-hub' });
    
    // Start ambient animations
    this.startAmbientAnimations();
    
    // Handle any data passed from other screens
    if (data?.showWelcome) {
      // Force show welcome if requested
      const overlay = this.querySelector('#welcome-overlay');
      if (overlay) {
        overlay.style.display = 'flex';
      }
    }
  }

  /**
   * Handle screen hide
   */
  protected override onScreenHide(): void {
    // Stop animations to save performance
    this.stopAmbientAnimations();
  }

  /**
   * Handle actions
   */
  protected override handleAction(action: string, element: HTMLElement): void {
    switch (action) {
      case 'interact-npc': {
        const npcId = element.getAttribute('data-npc-id');
        if (npcId) {
          this.interactWithNPC(npcId);
        }
        break;
      }
      
      case 'close-welcome': {
        const overlay = this.querySelector('#welcome-overlay');
        if (overlay) {
          overlay.style.display = 'none';
        }
        break;
      }
      
      default:
        super.handleAction(action, element);
    }
  }

  /**
   * Interact with NPC
   */
  private interactWithNPC(npcId: string): void {
    // For now, show a simple interaction
    this.showSuccess(`You wave at ${npcId.charAt(0).toUpperCase() + npcId.slice(1)}! They smile back warmly. 💕`);
    
    // TODO: Implement full NPC interaction system
    // This could open DM screen, show available orders, etc.
  }

  /**
   * Start ambient animations
   */
  private startAmbientAnimations(): void {
    // Add CSS animations for steam, lighting, etc.
    const steamElements = this.querySelectorAll('.steam');
    steamElements.forEach((steam, index) => {
      steam.style.animationDelay = `${index * 0.5}s`;
      steam.classList.add('steam--animated');
    });

    const windowLight = this.querySelector('.window-light');
    if (windowLight) {
      windowLight.classList.add('window-light--animated');
    }
  }

  /**
   * Stop ambient animations
   */
  private stopAmbientAnimations(): void {
    const steamElements = this.querySelectorAll('.steam');
    steamElements.forEach(steam => {
      steam.classList.remove('steam--animated');
    });

    const windowLight = this.querySelector('.window-light');
    if (windowLight) {
      windowLight.classList.remove('window-light--animated');
    }
  }
}
