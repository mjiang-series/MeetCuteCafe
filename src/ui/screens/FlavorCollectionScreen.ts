/**
 * Flavor Collection Screen - Manage and upgrade flavors
 */

import { BaseScreen } from '../BaseScreen';
import type { EventSystem } from '@/systems/EventSystem';
import type { GameStateManager } from '@/systems/GameStateManager';
import type { AssetManager } from '@/systems/AssetManager';
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
      this._flavorDatabase = this.createFlavorDatabase();
    }
    return this._flavorDatabase;
  }

  protected createContent(): string {
    const player = this.gameState.getPlayer();
    const affinityFilter = 'all'; // TODO: Implement filtering

    return `
      <div class="flavor-collection-screen">
        <div class="collection-header">
          <div class="collection-stats">
            <div class="stat-card">
              <div class="stat-value">${player.flavors.length}</div>
              <div class="stat-label">Flavors Owned</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this.getAverageLevel()}</div>
              <div class="stat-label">Avg Level</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this.getTotalPower()}</div>
              <div class="stat-label">Total Power</div>
            </div>
          </div>

          <div class="affinity-filters">
            <button class="filter-btn filter-btn--active" data-action="filter-affinity" data-affinity="all">
              All
            </button>
            ${this.renderAffinityFilters()}
          </div>
        </div>

        <div class="collection-grid">
          ${this.renderFlavorCards(affinityFilter)}
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
   * Render affinity filter buttons
   */
  private renderAffinityFilters(): string {
    const affinities: Affinity[] = ['Sweet', 'Salty', 'Bitter', 'Spicy', 'Fresh'];
    
    return affinities.map(affinity => {
      const emoji = this.getAffinityEmoji(affinity);
      const count = this.getAffinityCount(affinity);
      
      return `
        <button class="filter-btn" data-action="filter-affinity" data-affinity="${affinity}">
          <span class="filter-emoji">${emoji}</span>
          <span class="filter-name">${affinity}</span>
          <span class="filter-count">(${count})</span>
        </button>
      `;
    }).join('');
  }

  /**
   * Render flavor cards
   */
  private renderFlavorCards(affinityFilter: string): string {
    const player = this.gameState.getPlayer();
    let flavors = player.flavors;

    // Apply filter
    if (affinityFilter !== 'all') {
      flavors = flavors.filter(flavor => {
        const flavorData = this.getFlavorData(flavor.flavorId);
        return flavorData?.affinity === affinityFilter;
      });
    }

    if (flavors.length === 0) {
      return '<div class="no-flavors">No flavors match your filter.</div>';
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

    return `
      <div class="flavor-card flavor-card--${flavorData.rarity.replace('★', 'star')} ${playerFlavor.favorite ? 'flavor-card--favorite' : ''}"
           data-action="open-flavor" 
           data-flavor-id="${playerFlavor.flavorId}">
        
        <div class="flavor-header">
          <div class="flavor-icon">${this.getAffinityEmoji(flavorData.affinity)}</div>
          <div class="flavor-rarity">${flavorData.rarity}</div>
          ${playerFlavor.favorite ? '<div class="favorite-indicator">⭐</div>' : ''}
        </div>

        <div class="flavor-info">
          <h3 class="flavor-name">${flavorData.name}</h3>
          <div class="flavor-affinity">${flavorData.affinity}</div>
          <div class="flavor-level">Level ${playerFlavor.level}</div>
        </div>

        <div class="flavor-stats">
          <div class="stat-row">
            <span class="stat-label">Power:</span>
            <span class="stat-value">${currentPower}</span>
          </div>
          ${playerFlavor.level < 10 ? `
            <div class="stat-row upgrade-preview">
              <span class="stat-label">Next Level:</span>
              <span class="stat-value">${nextLevelPower} <span class="stat-increase">(+${nextLevelPower - currentPower})</span></span>
            </div>
          ` : ''}
        </div>

        <div class="flavor-actions">
          ${playerFlavor.level < 10 ? `
            <button class="upgrade-btn ${canUpgrade ? 'upgrade-btn--available' : 'upgrade-btn--disabled'}"
                    data-action="upgrade-flavor" 
                    data-flavor-id="${playerFlavor.flavorId}"
                    ${!canUpgrade ? 'disabled' : ''}>
              <span class="upgrade-cost">🪙 ${upgradeCost.coins}</span>
              <span class="upgrade-label">Upgrade</span>
            </button>
          ` : `
            <div class="max-level-indicator">MAX LEVEL</div>
          `}
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
      case 'filter-affinity': {
        const affinity = element.getAttribute('data-affinity') || 'all';
        this.applyAffinityFilter(affinity);
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
   * Apply affinity filter
   */
  private applyAffinityFilter(affinity: string): void {
    // Update active filter button
    const filterButtons = this.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.classList.remove('filter-btn--active');
      if (btn.getAttribute('data-affinity') === affinity) {
        btn.classList.add('filter-btn--active');
      }
    });

    // Update grid
    const grid = this.querySelector('.collection-grid');
    if (grid) {
      grid.innerHTML = this.renderFlavorCards(affinity);
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

    body.innerHTML = `
      <div class="flavor-details">
        <div class="flavor-showcase">
          <div class="showcase-icon">${this.getAffinityEmoji(flavorData.affinity)}</div>
          <div class="showcase-info">
            <div class="flavor-rarity rarity--${flavorData.rarity.replace('★', 'star')}">${flavorData.rarity}</div>
            <div class="flavor-affinity">${flavorData.affinity}</div>
            <div class="flavor-level">Level ${playerFlavor.level}</div>
          </div>
        </div>

        <div class="flavor-description">
          <p>${flavorData.description}</p>
        </div>

        <div class="flavor-stats-detail">
          <div class="stat-row">
            <span class="stat-label">Current Power:</span>
            <span class="stat-value">${currentPower}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Base Power:</span>
            <span class="stat-value">${flavorData.basePower}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Acquired:</span>
            <span class="stat-value">${new Date(playerFlavor.acquiredAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div class="modal-actions">
          ${playerFlavor.level < 10 ? `
            <button class="btn ${canUpgrade ? 'btn--primary' : 'btn--disabled'}" 
                    data-action="upgrade-flavor" 
                    data-flavor-id="${flavorId}"
                    ${!canUpgrade ? 'disabled' : ''}>
              Upgrade (🪙 ${upgradeCost.coins})
            </button>
          ` : `
            <div class="max-level-notice">This flavor is at maximum level!</div>
          `}
          
          <button class="btn btn--secondary" 
                  data-action="toggle-favorite" 
                  data-flavor-id="${flavorId}">
            ${playerFlavor.favorite ? 'Unfavorite' : 'Favorite'} ⭐
          </button>
          
          <button class="btn btn--secondary" data-action="close-modal">Close</button>
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
