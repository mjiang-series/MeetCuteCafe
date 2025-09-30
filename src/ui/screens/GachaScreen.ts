/**
 * Gacha Screen - Banner carousel, pulls, and reveal animations
 */

import { BaseScreen } from '../BaseScreen';
import type { EventSystem } from '@/systems/EventSystem';
import type { GameStateManager } from '@/systems/GameStateManager';
import type { AssetManager } from '@/systems/AssetManager';
import type { GachaSystem } from '@/systems/GachaSystem';
import type { ScreenData } from '../ScreenManager';
import type { BannerDef, GachaResult, Rarity } from '@/models/GameTypes';
import { getAssetPath } from '@/utils/AssetPaths';

export class GachaScreen extends BaseScreen {
  private gachaSystem: GachaSystem;
  private currentBannerId: string = 'standard';
  private isRevealing: boolean = false;

  constructor(
    eventSystem: EventSystem,
    gameState: GameStateManager,
    assetManager: AssetManager,
    gachaSystem: GachaSystem
  ) {
    super('gacha', eventSystem, gameState, assetManager);
    this.gachaSystem = gachaSystem;
  }

  protected createContent(): string {
    const player = this.gameState.getPlayer();
    
    // Check if gacha system is available
    if (!this.gachaSystem) {
      return '<div class="gacha-screen"><div class="loading">Loading gacha system...</div></div>';
    }
    
    const availableBanners = this.gachaSystem.getAvailableBanners();
    const currentBanner = this.gachaSystem.getBanner(this.currentBannerId);

    if (!currentBanner) {
      return '<div class="gacha-screen"><div class="error">No banners available</div></div>';
    }

    return `
      <div class="gacha-screen">
        <!-- Banner Selection -->
        <div class="banner-carousel">
          ${this.renderBannerTabs(availableBanners)}
          
          <div class="banner-display">
            <div class="banner-image">
              <img src="${getAssetPath('art/ui/gacha_banner.svg')}" alt="${currentBanner.name}" />
              <div class="banner-overlay">
                <h2 class="banner-title">${currentBanner.name}</h2>
                <div class="banner-rates">
                  <div class="rate-info">
                    <span class="rate-label">5★ Rate:</span>
                    <span class="rate-value">${this.getBannerRate(currentBanner, '5★')}%</span>
                  </div>
                  <div class="rate-info">
                    <span class="rate-label">4★ Rate:</span>
                    <span class="rate-value">${this.getBannerRate(currentBanner, '4★')}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        <!-- Pity Counter -->
        <div class="pity-display">
          <div class="pity-counter">
            <span class="pity-label">Pity Counter:</span>
            <span class="pity-value">${this.gachaSystem.getPityCounter(this.currentBannerId)}</span>
          </div>
          <div class="pity-info">
            <div class="pity-guarantee">4★ guaranteed in ${10 - (this.gachaSystem.getPityCounter(this.currentBannerId) % 10)} pulls</div>
            <div class="pity-guarantee">5★ guaranteed in ${60 - this.gachaSystem.getPityCounter(this.currentBannerId)} pulls</div>
          </div>
        </div>

        <!-- Pull Buttons -->
        <div class="pull-actions">
          <div class="pull-button-container">
            <button 
              class="pull-btn pull-btn--single ${player.tokens < currentBanner.cost.tickets && player.diamonds < (currentBanner.cost.tickets - player.tokens) * 10 ? 'pull-btn--disabled' : ''}"
              data-action="pull-single"
              ${player.tokens < currentBanner.cost.tickets && player.diamonds < (currentBanner.cost.tickets - player.tokens) * 10 ? 'disabled' : ''}
            >
              <div class="pull-btn-content">
                <span class="pull-btn-text">Pull x1</span>
                <div class="pull-btn-cost">
                  <span class="currency-icon">🎫</span>
                  <span class="cost-amount">${currentBanner.cost.tickets}</span>
                </div>
              </div>
            </button>

            <button 
              class="pull-btn pull-btn--multi ${player.tokens < (currentBanner.cost.tickets * 10) && player.diamonds < ((currentBanner.cost.tickets * 10) - player.tokens) * 10 ? 'pull-btn--disabled' : ''}"
              data-action="pull-10x"
              ${player.tokens < (currentBanner.cost.tickets * 10) && player.diamonds < ((currentBanner.cost.tickets * 10) - player.tokens) * 10 ? 'disabled' : ''}
            >
              <div class="pull-btn-content">
                <span class="pull-btn-text">Pull x10</span>
                <div class="pull-btn-cost">
                  <span class="currency-icon">🎫</span>
                  <span class="cost-amount">${currentBanner.cost.tickets * 10}</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Results Display (Hidden initially) -->
        <div class="results-overlay" id="results-overlay" style="display: none;">
          <div class="results-container">
            <div class="results-header">
              <h3>Pull Results</h3>
              <button class="results-close" data-action="close-results">&times;</button>
            </div>
            <div class="results-content" id="results-content">
              <!-- Populated dynamically -->
            </div>
            <div class="results-summary" id="results-summary">
              <!-- Populated dynamically -->
            </div>
            <button class="results-confirm" data-action="confirm-results">Continue</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render banner selection tabs
   */
  private renderBannerTabs(banners: BannerDef[]): string {
    return `
      <div class="banner-tabs">
        ${banners.map(banner => `
          <button 
            class="banner-tab ${banner.bannerId === this.currentBannerId ? 'banner-tab--active' : ''}"
            data-action="select-banner"
            data-banner-id="${banner.bannerId}"
          >
            ${banner.name}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Get banner rate for specific rarity
   */
  private getBannerRate(banner: BannerDef, rarity: Rarity): number {
    if (!this.gachaSystem) return 0;
    
    const totalWeight = banner.pool.reduce((sum, item) => sum + item.weight, 0);
    const rarityWeight = banner.pool
      .filter(item => {
        const flavor = this.gachaSystem!.getFlavorDef(item.flavorId);
        return flavor?.rarity === rarity;
      })
      .reduce((sum, item) => sum + item.weight, 0);
    
    return Math.round((rarityWeight / totalWeight) * 100 * 10) / 10;
  }

  /**
   * Handle banner selection
   */
  private selectBanner(bannerId: string): void {
    this.currentBannerId = bannerId;
    this.updateContent();
  }

  /**
   * Perform single pull
   */
  private async performSinglePull(): Promise<void> {
    if (this.isRevealing || !this.gachaSystem) return;

    const player = this.gameState.getPlayer();
    const banner = this.gachaSystem.getBanner(this.currentBannerId);
    
    if (!banner) return;

    // Check if we need to use diamonds for conversion
    if (player.tokens < banner.cost.tickets) {
      const diamondsNeeded = (banner.cost.tickets - player.tokens) * 10;
      if (player.diamonds >= diamondsNeeded) {
        const confirmed = confirm(`Not enough tickets! Convert ${diamondsNeeded} diamonds to ${banner.cost.tickets - player.tokens} tickets?`);
        if (!confirmed) return;
      }
    }

    const result = this.gachaSystem.pullSingle(this.currentBannerId);
    if (result) {
      await this.showPullResults(result);
    }
  }

  /**
   * Perform 10x pull
   */
  private async perform10xPull(): Promise<void> {
    if (this.isRevealing || !this.gachaSystem) return;

    const player = this.gameState.getPlayer();
    const banner = this.gachaSystem.getBanner(this.currentBannerId);
    
    if (!banner) return;

    const totalTicketsNeeded = banner.cost.tickets * 10;

    // Check if we need to use diamonds for conversion
    if (player.tokens < totalTicketsNeeded) {
      const diamondsNeeded = (totalTicketsNeeded - player.tokens) * 10;
      if (player.diamonds >= diamondsNeeded) {
        const confirmed = confirm(`Not enough tickets! Convert ${diamondsNeeded} diamonds to ${totalTicketsNeeded - player.tokens} tickets?`);
        if (!confirmed) return;
      }
    }

    const result = this.gachaSystem.pull10x(this.currentBannerId);
    if (result) {
      await this.showPullResults(result);
    }
  }

  /**
   * Show pull results with animations
   */
  private async showPullResults(result: GachaResult): Promise<void> {
    this.isRevealing = true;
    
    const overlay = this.element.querySelector('#results-overlay') as HTMLElement;
    const content = this.element.querySelector('#results-content') as HTMLElement;
    const summary = this.element.querySelector('#results-summary') as HTMLElement;

    // Show overlay
    overlay.style.display = 'flex';

    // Animate each pull result
    content.innerHTML = '';
    for (let i = 0; i < result.pulls.length; i++) {
      const pull = result.pulls[i];
      const flavor = this.gachaSystem?.getFlavorDef(pull.flavorId);
      
      if (flavor && this.gachaSystem) {
        const card = this.createResultCard(flavor, pull.isDuplicate);
        content.appendChild(card);
        
        // Animate card appearance
        await this.animateCardReveal(card, flavor.rarity);
        
        // Small delay between cards for 10x pulls
        if (result.pulls.length > 1) {
          await this.delay(200);
        }
      }
    }

    // Show summary
    summary.innerHTML = this.createResultSummary(result);

    this.isRevealing = false;
  }

  /**
   * Create result card element
   */
  private createResultCard(flavor: any, isDuplicate: boolean): HTMLElement {
    const card = document.createElement('div');
    card.className = `result-card result-card--${flavor.rarity.replace('★', 'star')} ${isDuplicate ? 'result-card--duplicate' : ''}`;
    
    card.innerHTML = `
      <div class="card-rarity">${flavor.rarity}</div>
      <div class="card-name">${flavor.name}</div>
      <div class="card-affinity">${flavor.affinity}</div>
      <div class="card-power">Power: ${flavor.basePower}</div>
      ${isDuplicate ? '<div class="card-duplicate">Duplicate</div>' : '<div class="card-new">NEW!</div>'}
    `;

    return card;
  }

  /**
   * Animate card reveal based on rarity
   */
  private async animateCardReveal(card: HTMLElement, rarity: Rarity): Promise<void> {
    card.style.opacity = '0';
    card.style.transform = 'scale(0.8) rotateY(180deg)';
    
    // Different animations for different rarities
    switch (rarity) {
      case '3★':
        card.style.transition = 'all 0.3s ease-out';
        break;
      case '4★':
        card.style.transition = 'all 0.5s ease-out';
        card.classList.add('card-glow-gold');
        break;
      case '5★':
        card.style.transition = 'all 0.8s ease-out';
        card.classList.add('card-glow-rainbow');
        break;
    }

    // Trigger animation
    await this.delay(50);
    card.style.opacity = '1';
    card.style.transform = 'scale(1) rotateY(0deg)';

    // Wait for animation to complete
    await this.delay(rarity === '5★' ? 800 : rarity === '4★' ? 500 : 300);
  }

  /**
   * Create results summary
   */
  private createResultSummary(result: GachaResult): string {
    const rarityCount = { '3★': 0, '4★': 0, '5★': 0 };
    let newFlavors = 0;

    result.pulls.forEach(pull => {
      rarityCount[pull.rarity]++;
      if (!pull.isDuplicate) newFlavors++;
    });

    return `
      <div class="summary-stats">
        <div class="summary-item">
          <span class="summary-label">New Flavors:</span>
          <span class="summary-value">${newFlavors}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">5★ Flavors:</span>
          <span class="summary-value">${rarityCount['5★']}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">4★ Flavors:</span>
          <span class="summary-value">${rarityCount['4★']}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Tokens Gained:</span>
          <span class="summary-value">${result.tokensGained}</span>
        </div>
      </div>
    `;
  }

  /**
   * Close results overlay
   */
  private closeResults(): void {
    const overlay = this.element.querySelector('#results-overlay') as HTMLElement;
    overlay.style.display = 'none';
    this.updateContent(); // Refresh to show updated currency
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected setupEventListeners(): void {
    super.setupEventListeners();

    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action') || target.closest('[data-action]')?.getAttribute('data-action');

      switch (action) {
        case 'select-banner':
          const bannerId = target.getAttribute('data-banner-id') || target.closest('[data-banner-id]')?.getAttribute('data-banner-id');
          if (bannerId) this.selectBanner(bannerId);
          break;

        case 'pull-single':
          this.performSinglePull();
          break;

        case 'pull-10x':
          this.perform10xPull();
          break;

        case 'close-results':
        case 'confirm-results':
          this.closeResults();
          break;
      }
    });
  }

  onShow(data?: ScreenData): void {
    super.onShow(data);
    
    // Set header variant for gacha screen
    this.eventSystem.emit('header:set_variant', { variant: 'gacha' });
    
    // Refresh content when shown (in case gacha system wasn't available during construction)
    if (this.gachaSystem) {
      const availableBanners = this.gachaSystem.getAvailableBanners();
      if (availableBanners.length > 0 && !this.gachaSystem.getBanner(this.currentBannerId)) {
        this.currentBannerId = availableBanners[0].bannerId;
      }
      
      // Update content to show the actual gacha screen instead of loading message
      this.updateContent();
    }
  }

  protected getHeaderVariant(): string {
    return 'gacha';
  }
}
