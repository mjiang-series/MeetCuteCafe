/**
 * Flavor Collection Screen - Manage and upgrade flavors
 */

import { BaseScreen } from '../BaseScreen';
import type { EventSystem } from '@/systems/EventSystem';
import type { GameStateManager } from '@/systems/GameStateManager';
import type { AssetManager } from '@/systems/AssetManager';
import type { GachaSystem } from '@/systems/GachaSystem';
import type { ScreenData } from '../ScreenManager';
import type { PlayerFlavor, Affinity, Rarity } from '@/models/GameTypes';

interface FlavorData {
  flavorId: string;
  name: string;
  affinity: Affinity;
  rarity: Rarity;
  description: string;
  basePower: number;
}

export class FlavorCollectionScreen extends BaseScreen {
  private _flavorDatabase: FlavorData[] | null = null;
  private gachaSystem: GachaSystem | null = null;

  constructor(
    eventSystem: EventSystem,
    gameState: GameStateManager,
    assetManager: AssetManager
  ) {
    super('flavor-collection', eventSystem, gameState, assetManager);
    this.ensureStarterFlavors();
  }

  private get flavorDatabase(): FlavorData[] {
    if (!this._flavorDatabase) {
      // Get gacha system from global game object
      if (!this.gachaSystem && (window as any).game) {
        this.gachaSystem = (window as any).game.getSystems().gachaSystem;
      }
      
      if (this.gachaSystem) {
        // Use gacha system's flavor database
        this._flavorDatabase = this.gachaSystem.getAllFlavorDefs();
      } else {
        // Fallback to local database
        this._flavorDatabase = this.createFlavorDatabase();
      }
    }
    return this._flavorDatabase;
  }

  protected createContent(): string {
    const player = this.gameState.getPlayer();
    const npcFilter = 'all'; // Filter by NPC

    return `
      <div class="flavor-collection-screen">
        <div class="collection-header">
          <div class="npc-filter-bar">
            <button class="npc-filter-option active" data-action="filter-npc" data-npc="all">
              <span class="filter-icon material-icons">apps</span>
              <span class="filter-label">All</span>
              <span class="memory-count">${player.flavors.length}</span>
            </button>
            ${this.renderNPCFilters()}
          </div>
        </div>

        <div class="collection-grid">
          ${this.renderFlavorCards(npcFilter)}
        </div>

        ${player.flavors.length === 0 ? this.renderEmptyState() : ''}

        <!-- Flavor Detail Modal -->
        <div class="flavor-modal" id="flavor-modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="modal-flavor-name">Flavor Details</h3>
              <button class="modal-close" data-action="close-modal">&times;</button>
            </div>
            <div class="modal-body" id="modal-body">
              <!-- Content populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render NPC filter buttons (matching Journal UI/UX)
   */
  private renderNPCFilters(): string {
    const npcs: { id: string; name: string; portraitPath: string; }[] = [
      { id: 'aria', name: 'Aria', portraitPath: '/art/npc/aria/aria_portrait.png' },
      { id: 'kai', name: 'Kai', portraitPath: '/art/npc/kai/kai_portrait.png' },
      { id: 'elias', name: 'Elias', portraitPath: '/art/npc/elias/elias_portrait.png' }
    ];
    
    return npcs.map(npc => {
      const count = this.getNPCFlavorCount(npc.id);
      
      return `
        <button class="npc-filter-option" data-action="filter-npc" data-npc="${npc.id}">
          <div class="npc-avatar-small">
            <img src="${npc.portraitPath}" alt="${npc.name}" />
          </div>
          <span class="filter-label">${npc.name}</span>
          <span class="memory-count">${count}</span>
        </button>
      `;
    }).join('');
  }

  /**
   * Render flavor cards
   */
  private renderFlavorCards(npcFilter: string): string {
    const player = this.gameState.getPlayer();
    let flavors = player.flavors;

    // Apply NPC filter
    if (npcFilter !== 'all') {
      flavors = flavors.filter(flavor => {
        const flavorData = this.getFlavorData(flavor.flavorId);
        return flavorData && 'npcId' in flavorData && flavorData.npcId === npcFilter;
      });
    }

    if (flavors.length === 0) {
      return '<div class="no-flavors">No story moments match your filter.</div>';
    }

    return flavors.map(flavor => this.renderFlavorCard(flavor)).join('');
  }

  /**
   * Render individual flavor card
   */
  private renderFlavorCard(playerFlavor: PlayerFlavor): string {
    const flavorData = this.getFlavorData(playerFlavor.flavorId);
    if (!flavorData) return '';

    const currentPower = this.calculateFlavorPower(playerFlavor, flavorData);
    const nextLevelPower = this.calculateFlavorPower(
      { ...playerFlavor, level: playerFlavor.level + 1 }, 
      flavorData
    );
    const canUpgrade = this.canUpgradeFlavor(playerFlavor);
    const upgradeCost = this.getUpgradeCost(playerFlavor.level);

    // Get preview asset for the flavor
    const previewAsset = 'previewAsset' in flavorData ? (flavorData as any).previewAsset : null;
    const npcId = 'npcId' in flavorData ? (flavorData as any).npcId : 'unknown';
    const storyTagline = 'storyTagline' in flavorData ? (flavorData as any).storyTagline : flavorData.description;

    return `
      <div class="memory-preview-card flavor-preview-card" 
           data-action="open-flavor" 
           data-flavor-id="${playerFlavor.flavorId}">
        
        <div class="memory-preview-image">
          ${previewAsset ? `
            ${previewAsset.endsWith('.mp4') ? `
              <video autoplay muted loop playsinline>
                <source src="${previewAsset}" type="video/mp4">
              </video>
            ` : `
              <img src="${previewAsset}" alt="${flavorData.name}" />
            `}
          ` : `
            <div class="flavor-preview-placeholder">
              <div class="flavor-icon-large">${this.getAffinityEmoji(flavorData.affinity)}</div>
            </div>
          `}
          
          <!-- Rarity badge (top left) -->
          <div class="memory-mood-badge rarity-badge rarity--${flavorData.rarity.replace('★', 'star')}">
            ${flavorData.rarity}
          </div>
          
          <!-- Flavor affinity badge (top right) -->
          <div class="memory-date-badge affinity-badge affinity-badge--${flavorData.affinity.toLowerCase()}">
            ${flavorData.affinity.toUpperCase()}
          </div>
          
          ${playerFlavor.favorite ? '<div class="favorite-indicator">⭐</div>' : ''}
        </div>

        <div class="memory-preview-content">
          <div class="memory-timestamp">
            <span class="material-icons">person</span>
            <span>with ${npcId.charAt(0).toUpperCase() + npcId.slice(1)}</span>
            <span class="level-indicator">Level ${playerFlavor.level}</span>
          </div>
          
          <h3 class="memory-title">${flavorData.name}</h3>
          <p class="memory-preview-text">${storyTagline}</p>
          
          <div class="flavor-stats-mini">
            <div class="stat-item">
              <span class="stat-label">Power</span>
              <span class="stat-value">${currentPower}</span>
            </div>
            ${playerFlavor.level < 10 ? `
              <div class="stat-item">
                <span class="stat-label">Next</span>
                <span class="stat-value">${nextLevelPower}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render empty state
   */
  private renderEmptyState(): string {
    return `
      <div class="empty-state">
        <div class="empty-icon">⚗️</div>
        <h3>No Flavors Yet</h3>
        <p>Complete orders and use the gacha system to collect flavors!</p>
        <button class="btn btn--primary" data-navigate="cafe-hub">
          Back to Café
        </button>
      </div>
    `;
  }

  /**
   * Get affinity emoji
   */
  private getAffinityEmoji(affinity: Affinity): string {
    const emojiMap: Record<Affinity, string> = {
      Sweet: '🍯',
      Salty: '🧂',
      Bitter: '☕',
      Spicy: '🌶️',
      Fresh: '🍃'
    };
    return emojiMap[affinity] || '❓';
  }

  /**
   * Get count of flavors by affinity
   */
  private getAffinityCount(affinity: Affinity): number {
    const player = this.gameState.getPlayer();
    return player.flavors.filter(flavor => {
      const flavorData = this.getFlavorData(flavor.flavorId);
      return flavorData?.affinity === affinity;
    }).length;
  }

  /**
   * Get count of flavors for a specific NPC
   */
  private getNPCFlavorCount(npcId: string): number {
    const player = this.gameState.getPlayer();
    return player.flavors.filter(flavor => {
      const flavorData = this.getFlavorData(flavor.flavorId);
      return flavorData && 'npcId' in flavorData && flavorData.npcId === npcId;
    }).length;
  }

  /**
   * Get average level of all flavors
   */
  private getAverageLevel(): string {
    const player = this.gameState.getPlayer();
    if (player.flavors.length === 0) return '0';
    
    const totalLevel = player.flavors.reduce((sum, flavor) => sum + flavor.level, 0);
    return (totalLevel / player.flavors.length).toFixed(1);
  }

  /**
   * Get total power of all flavors
   */
  private getTotalPower(): number {
    const player = this.gameState.getPlayer();
    return player.flavors.reduce((total, flavor) => {
      const flavorData = this.getFlavorData(flavor.flavorId);
      if (!flavorData) return total;
      return total + this.calculateFlavorPower(flavor, flavorData);
    }, 0);
  }

  /**
   * Calculate flavor power based on level
   */
  private calculateFlavorPower(flavor: PlayerFlavor, flavorData: FlavorData): number {
    return Math.floor(flavorData.basePower * (1 + (flavor.level - 1) * 0.5));
  }

  /**
   * Check if flavor can be upgraded
   */
  private canUpgradeFlavor(flavor: PlayerFlavor): boolean {
    if (flavor.level >= 10) return false;
    
    const cost = this.getUpgradeCost(flavor.level);
    const player = this.gameState.getPlayer();
    
    return player.coins >= cost.coins;
  }

  /**
   * Get upgrade cost for level
   */
  private getUpgradeCost(currentLevel: number): { coins: number } {
    return {
      coins: Math.floor(100 * Math.pow(1.5, currentLevel - 1))
    };
  }

  /**
   * Get flavor data by ID
   */
  private getFlavorData(flavorId: string): FlavorData | undefined {
    return this.flavorDatabase.find(f => f.flavorId === flavorId);
  }

  /**
   * Create flavor database
   */
  private createFlavorDatabase(): FlavorData[] {
    return [
      {
        flavorId: 'sweet_vanilla',
        name: 'Vanilla Dream',
        affinity: 'Sweet',
        rarity: '3★',
        description: 'A classic vanilla flavor that brings comfort and warmth.',
        basePower: 10
      },
      {
        flavorId: 'sweet_chocolate',
        name: 'Rich Chocolate',
        affinity: 'Sweet',
        rarity: '3★',
        description: 'Indulgent chocolate that melts hearts.',
        basePower: 12
      },
      {
        flavorId: 'salty_caramel',
        name: 'Salted Caramel',
        affinity: 'Salty',
        rarity: '3★',
        description: 'Perfect balance of sweet and salty.',
        basePower: 11
      },
      {
        flavorId: 'bitter_coffee',
        name: 'Dark Roast',
        affinity: 'Bitter',
        rarity: '3★',
        description: 'Bold coffee flavor that energizes the soul.',
        basePower: 13
      },
      {
        flavorId: 'fresh_mint',
        name: 'Cool Mint',
        affinity: 'Fresh',
        rarity: '3★',
        description: 'Refreshing mint that awakens the senses.',
        basePower: 9
      }
    ];
  }

  /**
   * Ensure player has starter flavors
   */
  private ensureStarterFlavors(): void {
    const player = this.gameState.getPlayer();
    const starterFlavorIds = ['sweet_vanilla', 'salty_caramel', 'bitter_coffee', 'fresh_mint'];
    
    starterFlavorIds.forEach(flavorId => {
      const hasFlavorAlready = player.flavors.some(f => f.flavorId === flavorId);
      if (!hasFlavorAlready) {
        const starterFlavor: PlayerFlavor = {
          flavorId,
          level: 1,
          acquiredAt: Date.now(),
        };
        this.gameState.addFlavor(starterFlavor);
      }
    });
  }

  /**
   * Handle screen show
   */
  protected override onScreenShow(_data?: ScreenData): void {
    this.eventSystem.emit('header:set_variant', { variant: 'flavor-collection' });
  }

  /**
   * Handle actions
   */
  protected override handleAction(action: string, element: HTMLElement): void {
    switch (action) {
      case 'filter-npc': {
        const npcId = element.getAttribute('data-npc') || 'all';
        this.applyNPCFilter(npcId);
        break;
      }
      
      case 'open-flavor': {
        const flavorId = element.getAttribute('data-flavor-id');
        if (flavorId) {
          this.openFlavorModal(flavorId);
        }
        break;
      }
      
      case 'upgrade-flavor': {
        const flavorId = element.getAttribute('data-flavor-id');
        if (flavorId) {
          this.upgradeFlavor(flavorId);
        }
        break;
      }
      
      case 'close-modal': {
        this.closeFlavorModal();
        break;
      }
      
      default:
        super.handleAction(action, element);
    }
  }

  /**
   * Apply NPC filter
   */
  private applyNPCFilter(npcId: string): void {
    // Update active filter button
    const filterButtons = this.querySelectorAll('.npc-filter-option');
    filterButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-npc') === npcId) {
        btn.classList.add('active');
      }
    });

    // Update grid
    const grid = this.querySelector('.collection-grid');
    if (grid) {
      grid.innerHTML = this.renderFlavorCards(npcId);
      this.bindEventHandlers();
    }
  }

  /**
   * Open flavor detail modal
   */
  private openFlavorModal(flavorId: string): void {
    const player = this.gameState.getPlayer();
    const playerFlavor = player.flavors.find(f => f.flavorId === flavorId);
    const flavorData = this.getFlavorData(flavorId);
    
    if (!playerFlavor || !flavorData) return;

    const modal = this.querySelector('#flavor-modal');
    const title = this.querySelector('#modal-flavor-name');
    const body = this.querySelector('#modal-body');

    if (!modal || !title || !body) return;

    title.textContent = flavorData.name;
    
    const currentPower = this.calculateFlavorPower(playerFlavor, flavorData);
    const canUpgrade = this.canUpgradeFlavor(playerFlavor);
    const upgradeCost = this.getUpgradeCost(playerFlavor.level);

    // Get extended flavor data
    const previewAsset = 'previewAsset' in flavorData ? (flavorData as any).previewAsset : null;
    const npcId = 'npcId' in flavorData ? (flavorData as any).npcId : 'unknown';
    const storyTagline = 'storyTagline' in flavorData ? (flavorData as any).storyTagline : flavorData.description;
    const nextLevelPower = this.calculateFlavorPower(
      { ...playerFlavor, level: playerFlavor.level + 1 }, 
      flavorData
    );

    body.innerHTML = `
      <div class="flavor-details-extended">
        <!-- Large preview section -->
        <div class="flavor-preview-large">
          <div class="memory-preview-image">
            ${previewAsset ? `
              ${previewAsset.endsWith('.mp4') ? `
                <video autoplay muted loop playsinline>
                  <source src="${previewAsset}" type="video/mp4">
                </video>
              ` : `
                <img src="${previewAsset}" alt="${flavorData.name}" />
              `}
            ` : `
              <div class="flavor-preview-placeholder">
                <div class="flavor-icon-large">${this.getAffinityEmoji(flavorData.affinity)}</div>
              </div>
            `}
            
            <!-- Rarity badge (top left) -->
            <div class="memory-mood-badge rarity-badge rarity--${flavorData.rarity.replace('★', 'star')}">
              ${flavorData.rarity}
            </div>
            
            <!-- Flavor affinity badge (top right) -->
            <div class="memory-date-badge affinity-badge affinity-badge--${flavorData.affinity.toLowerCase()}">
              ${flavorData.affinity.toUpperCase()}
            </div>
            
            ${playerFlavor.favorite ? '<div class="favorite-indicator">⭐</div>' : ''}
          </div>
        </div>

        <!-- Extended content -->
        <div class="flavor-details-content">
          <div class="flavor-header-extended">
            <div class="flavor-meta">
              <div class="memory-timestamp">
                <span class="material-icons">person</span>
                <span>with ${npcId.charAt(0).toUpperCase() + npcId.slice(1)}</span>
                <span class="level-indicator">Level ${playerFlavor.level}</span>
              </div>
            </div>
            
            <h2 class="flavor-title-extended">${flavorData.name}</h2>
            <p class="flavor-story-extended">${storyTagline}</p>
          </div>

          <!-- Detailed stats -->
          <div class="flavor-stats-extended">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Current Power</div>
                <div class="stat-value">${currentPower}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Base Power</div>
                <div class="stat-value">${flavorData.basePower}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Level</div>
                <div class="stat-value">${playerFlavor.level}/10</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Acquired</div>
                <div class="stat-value">${new Date(playerFlavor.acquiredAt).toLocaleDateString()}</div>
              </div>
            </div>
            
            ${playerFlavor.level < 10 ? `
              <div class="upgrade-preview">
                <div class="upgrade-label">Next Level Preview</div>
                <div class="power-comparison">
                  <span class="current-power">${currentPower}</span>
                  <span class="arrow">→</span>
                  <span class="next-power">${nextLevelPower}</span>
                  <span class="power-increase">(+${nextLevelPower - currentPower})</span>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Description -->
          <div class="flavor-description-extended">
            <h3>Description</h3>
            <p>${flavorData.description}</p>
          </div>

          <!-- Actions -->
          <div class="flavor-actions-extended">
            ${playerFlavor.level < 10 ? `
              <button class="btn ${canUpgrade ? 'btn--primary' : 'btn--disabled'}" 
                      data-action="upgrade-flavor" 
                      data-flavor-id="${flavorId}"
                      ${!canUpgrade ? 'disabled' : ''}>
                <span class="material-icons">trending_up</span>
                Upgrade (🪙 ${upgradeCost.coins})
              </button>
            ` : `
              <div class="max-level-notice">
                <span class="material-icons">star</span>
                This flavor is at maximum level!
              </div>
            `}
            
            <button class="btn btn--secondary" 
                    data-action="toggle-favorite" 
                    data-flavor-id="${flavorId}">
              <span class="material-icons">${playerFlavor.favorite ? 'favorite' : 'favorite_border'}</span>
              ${playerFlavor.favorite ? 'Unfavorite' : 'Favorite'}
            </button>
            
            <button class="btn btn--secondary" data-action="close-modal">
              <span class="material-icons">close</span>
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    this.bindEventHandlers();
  }

  /**
   * Close flavor modal
   */
  private closeFlavorModal(): void {
    const modal = this.querySelector('#flavor-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Upgrade flavor
   */
  private upgradeFlavor(flavorId: string): void {
    const player = this.gameState.getPlayer();
    const flavorIndex = player.flavors.findIndex(f => f.flavorId === flavorId);
    
    if (flavorIndex === -1) return;

    const flavor = player.flavors[flavorIndex]!;
    const cost = this.getUpgradeCost(flavor.level);

    if (!this.canUpgradeFlavor(flavor)) {
      this.showError('Not enough coins to upgrade!');
      return;
    }

    // Spend coins and upgrade
    this.gameState.spendCoins(cost.coins);
    flavor.level++;
    
    this.showSuccess(`${this.getFlavorData(flavorId)?.name} upgraded to level ${flavor.level}!`);
    
    // Refresh display
    this.closeFlavorModal();
    this.updateContent();
  }
}
