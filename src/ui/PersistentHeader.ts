/**
 * Persistent Header for Meet Cute Cafe
 * Shows currencies, player info, and navigation
 */

import type { EventSystem } from '@/systems/EventSystem';
import type { GameStateManager } from '@/systems/GameStateManager';
import type { Player } from '@/models/GameTypes';
import { getPlayerPortraitPath, getLogoPath } from '@/utils/AssetPaths';

export type HeaderVariant = 'welcome' | 'cafe-hub' | 'orders' | 'flavor-collection' | 'gacha' | 'journal' | 'conversation-history' | 'dm' | 'settings' | 'results';

export interface HeaderConfig {
  showCurrencies: boolean;
  showBackButton: boolean;
  title?: string;
  currencies?: ('coins' | 'diamonds' | 'tickets')[];
}

const HEADER_CONFIGS: Record<HeaderVariant, HeaderConfig> = {
  welcome: {
    showCurrencies: false,
    showBackButton: false,
  },
  'cafe-hub': {
    showCurrencies: true,
    showBackButton: false,
    currencies: ['coins', 'diamonds'],
  },
  orders: {
    showCurrencies: true,
    showBackButton: true,
    title: 'Orders',
    currencies: ['coins', 'diamonds'],
  },
  'flavor-collection': {
    showCurrencies: true,
    showBackButton: true,
    title: 'Flavor Collection',
    currencies: ['coins'],
  },
  gacha: {
    showCurrencies: true,
    showBackButton: true,
    title: 'Gacha',
    currencies: ['tickets', 'diamonds'],
  },
  journal: {
    showCurrencies: false,
    showBackButton: true,
    title: 'Journal',
  },
  'conversation-history': {
    showCurrencies: false,
    showBackButton: true,
    title: 'Messages',
  },
  dm: {
    showCurrencies: false,
    showBackButton: true,
    title: 'Chat',
  },
  settings: {
    showCurrencies: false,
    showBackButton: true,
    title: 'Settings',
  },
  results: {
    showCurrencies: true,
    showBackButton: true,
    title: 'Order Complete',
    currencies: ['coins', 'diamonds'],
  },
};

export class PersistentHeader {
  private element: HTMLElement;
  private currentVariant: HeaderVariant = 'welcome';
  private customTitle?: string;
  private npcData?: { name: string; portraitPath: string; bondLevel: number };
  private player: Player | null = null;

  constructor(
    private eventSystem: EventSystem,
    private gameState: GameStateManager
  ) {
    this.element = this.createElement();
    this.player = this.gameState.getPlayer(); // Initialize player immediately
    this.setupEventListeners();
    this.updateContent();
    
    console.log('PersistentHeader initialized with player:', this.player);
  }

  /**
   * Create header element
   */
  private createElement(): HTMLElement {
    const header = document.createElement('header');
    header.className = 'persistent-header';
    header.id = 'persistent-header';
    return header;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for variant changes
    this.eventSystem.on('header:set_variant', (data) => {
      this.setVariant(data.variant as HeaderVariant, data.customTitle, data.npcData);
    });

    // Listen for currency updates
    this.eventSystem.on('header:update_currency', () => {
      this.updateCurrencies();
    });

    // Listen for game state changes
    this.eventSystem.on('game:loaded', () => {
      this.player = this.gameState.getPlayer();
      this.updateContent();
    });

    this.eventSystem.on('game:saved', () => {
      this.updateCurrencies();
    });
  }

  /**
   * Set header variant
   */
  setVariant(variant: HeaderVariant, customTitle?: string, npcData?: { name: string; portraitPath: string; bondLevel: number }): void {
    this.currentVariant = variant;
    this.customTitle = customTitle;
    this.npcData = npcData;
    this.updateContent();
  }

  /**
   * Update header content
   */
  private updateContent(): void {
    const config = HEADER_CONFIGS[this.currentVariant];
    
    this.element.innerHTML = `
      <div class="header-left">
        ${this.renderLeftSection(config)}
      </div>
      
      <div class="header-center">
        ${this.renderCenterSection(config)}
      </div>
      
      <div class="header-right">
        ${this.renderRightSection(config)}
      </div>
    `;

    this.bindEventHandlers();
  }

  /**
   * Render left section
   */
  private renderLeftSection(config: HeaderConfig): string {
    if (config.showBackButton) {
      return `
        <button class="header-btn back-btn" data-action="back">
          <span class="material-icons">arrow_back</span>
        </button>
      `;
    }

    if (this.currentVariant === 'welcome') {
      return `
        <div class="header-logo">
          <img src="${getLogoPath()}" alt="Meet Cute Cafe" class="logo-small" />
        </div>
      `;
    }

    if (this.player) {
      return `
        <div class="player-info">
          <img src="${getPlayerPortraitPath()}" alt="Player" class="player-avatar" />
          <div class="player-details">
            <div class="player-name">Cafe Owner</div>
            <div class="player-level">Day ${this.getDayCount()}</div>
          </div>
        </div>
      `;
    }

    return '';
  }

  /**
   * Render NPC info (same style as player info)
   */
  private renderNPCInfo(): string {
    if (!this.npcData) return '';
    
    return `
      <div class="player-info">
        <img src="${this.npcData.portraitPath}" alt="${this.npcData.name}" class="player-avatar" />
        <div class="player-details">
          <div class="player-name">${this.npcData.name}</div>
          <div class="player-level">Bond Level ${this.npcData.bondLevel}</div>
        </div>
      </div>
    `;
  }

  /**
   * Render center section
   */
  private renderCenterSection(config: HeaderConfig): string {
    // Show NPC info in center when in DM mode
    if (this.currentVariant === 'dm' && this.npcData) {
      return this.renderNPCInfo();
    }
    
    const title = this.customTitle || config.title;
    if (title) {
      return `<h1 class="screen-title">${title}</h1>`;
    }

    if (config.showCurrencies && this.player) {
      return `
        <div class="currencies">
          ${this.renderCurrencies(config.currencies || ['coins', 'diamonds'])}
        </div>
      `;
    }

    return '';
  }

  /**
   * Render right section
   */
  private renderRightSection(_config: HeaderConfig): string {
    return `
      <button class="header-btn settings-btn" data-action="settings">
        <span class="material-icons">settings</span>
      </button>
    `;
  }

  /**
   * Render currencies
   */
  private renderCurrencies(currencies: string[]): string {
    if (!this.player) return '';

    return currencies.map(currency => {
      const value = this.getCurrencyValue(currency);
      const icon = this.getCurrencyIcon(currency);
      
      return `
        <div class="currency-item currency--${currency}">
          <span class="currency-icon">${icon}</span>
          <span class="currency-value">${this.formatNumber(value)}</span>
        </div>
      `;
    }).join('');
  }

  /**
   * Get currency value
   */
  private getCurrencyValue(currency: string): number {
    if (!this.player) return 0;
    
    switch (currency) {
      case 'coins':
        return this.player.coins;
      case 'diamonds':
        return this.player.diamonds;
      case 'tickets':
        return this.player.tokens;
      default:
        return 0;
    }
  }

  /**
   * Get currency icon
   */
  private getCurrencyIcon(currency: string): string {
    switch (currency) {
      case 'coins':
        return '🪙';
      case 'diamonds':
        return '💎';
      case 'tickets':
        return '🎫';
      default:
        return '❓';
    }
  }

  /**
   * Format number for display
   */
  private formatNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  /**
   * Get day count since player creation
   */
  private getDayCount(): number {
    if (!this.player) return 1;
    
    const daysSinceCreation = Math.floor(
      (Date.now() - this.player.createdAt) / (1000 * 60 * 60 * 24)
    );
    
    return Math.max(1, daysSinceCreation + 1);
  }

  /**
   * Update currencies only
   */
  private updateCurrencies(): void {
    if (!this.player) {
      this.player = this.gameState.getPlayer();
    }

    const currenciesContainer = this.element.querySelector('.currencies');
    if (currenciesContainer) {
      const config = HEADER_CONFIGS[this.currentVariant];
      currenciesContainer.innerHTML = this.renderCurrencies(
        config.currencies || ['coins', 'diamonds']
      );
    }
  }

  /**
   * Bind event handlers
   */
  private bindEventHandlers(): void {
    const backBtn = this.element.querySelector('[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.eventSystem.emit('ui:show_screen', { screenId: 'cafe-hub' });
      });
    }

    const settingsBtn = this.element.querySelector('[data-action="settings"]');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.eventSystem.emit('ui:show_screen', { screenId: 'settings' });
      });
    }
  }

  /**
   * Get header element
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.element.remove();
  }
}
