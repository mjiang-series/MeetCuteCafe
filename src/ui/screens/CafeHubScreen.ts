/**
 * Café Hub Screen - Animated 2D tile-based hub with sprite animations
 */

import { BaseScreen } from '../BaseScreen';
import type { EventSystem } from '@/systems/EventSystem';
import type { GameStateManager } from '@/systems/GameStateManager';
import type { AssetManager } from '@/systems/AssetManager';
import { SpriteAnimator, createCafeSpriteSheets } from '@/systems/SpriteAnimator';
import { TileSystem } from '@/systems/TileSystem';
import type { ScreenData } from '../ScreenManager';

export class CafeHubScreen extends BaseScreen {
  private spriteAnimator: SpriteAnimator;
  private _tileSystem: TileSystem | null = null;
  private animationUpdateInterval: number | null = null;

  constructor(
    eventSystem: EventSystem,
    gameState: GameStateManager,
    assetManager: AssetManager
  ) {
    super('cafe-hub', eventSystem, gameState, assetManager);
    
    // Initialize sprite animation system
    this.spriteAnimator = new SpriteAnimator();
    
    this.setupSpriteAnimations();
  }

  private get tileSystem(): TileSystem {
    if (!this._tileSystem) {
      this._tileSystem = TileSystem.createCafeLayout();
    }
    return this._tileSystem;
  }

  protected createContent(): string {
    const player = this.gameState.getPlayer();
    const { width, height, tileSize } = this.tileSystem.getDimensions();

    return `
      <div class="cafe-hub-animated">
        <!-- Animated Tile-Based Café Scene -->
        <div class="cafe-scene-container">
          <div class="cafe-grid" style="
            width: ${width * tileSize}px;
            height: ${height * tileSize}px;
            position: relative;
            background: linear-gradient(135deg, #ffeef4 0%, #ffd6e1 50%, #ffb8c6 100%);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
          ">
            <!-- Background Pattern -->
            <div class="cafe-background-pattern"></div>
            
            <!-- Tile Layers -->
            ${this.tileSystem.generateLayersHTML()}
            
            <!-- Animated Sprites Layer -->
            <div class="sprites-layer">
              <!-- NPCs -->
              <div class="sprite npc-aria" data-sprite-id="aria" style="
                position: absolute;
                left: ${8 * tileSize}px;
                top: ${6 * tileSize}px;
                width: ${tileSize}px;
                height: ${tileSize + 16}px;
                z-index: 10;
                cursor: pointer;
                transition: transform 0.2s ease;
              " data-action="talk-npc" data-npc="aria">
                <div class="npc-sprite" id="sprite-aria"></div>
                <div class="npc-nameplate">Aria</div>
              </div>

              <div class="sprite npc-kai" data-sprite-id="kai" style="
                position: absolute;
                left: ${12 * tileSize}px;
                top: ${6 * tileSize}px;
                width: ${tileSize}px;
                height: ${tileSize + 16}px;
                z-index: 10;
                cursor: pointer;
                transition: transform 0.2s ease;
              " data-action="talk-npc" data-npc="kai">
                <div class="npc-sprite" id="sprite-kai"></div>
                <div class="npc-nameplate">Kai</div>
              </div>

              <div class="sprite npc-elias" data-sprite-id="elias" style="
                position: absolute;
                left: ${15 * tileSize}px;
                top: ${10 * tileSize}px;
                width: ${tileSize}px;
                height: ${tileSize + 16}px;
                z-index: 10;
                cursor: pointer;
                transition: transform 0.2s ease;
              " data-action="talk-npc" data-npc="elias">
                <div class="npc-sprite" id="sprite-elias"></div>
                <div class="npc-nameplate">Elias</div>
              </div>

              <!-- Interactive Objects -->
              <div class="sprite order-board" style="
                position: absolute;
                left: ${10 * tileSize}px;
                top: ${7 * tileSize}px;
                width: ${tileSize}px;
                height: ${tileSize}px;
                z-index: 5;
                cursor: pointer;
                transition: transform 0.2s ease;
              " data-navigate="orders">
                <div class="object-sprite" id="sprite-order-board"></div>
                <div class="hotspot-label">📋 Orders</div>
              </div>

              <div class="sprite flavor-shelf" style="
                position: absolute;
                left: ${4 * tileSize}px;
                top: ${4 * tileSize}px;
                width: ${tileSize * 2}px;
                height: ${tileSize}px;
                z-index: 5;
                cursor: pointer;
                transition: transform 0.2s ease;
              " data-navigate="flavor-collection">
                <div class="object-sprite" id="sprite-flavor-shelf">
                  <div class="flavor-jars">
                    <div class="jar" id="sprite-jar-sweet">🍯</div>
                    <div class="jar" id="sprite-jar-salty">🧂</div>
                    <div class="jar" id="sprite-jar-bitter">☕</div>
                    <div class="jar" id="sprite-jar-spicy">🌶️</div>
                    <div class="jar" id="sprite-jar-fresh">🍃</div>
                  </div>
                </div>
                <div class="hotspot-label">🧪 Flavors</div>
              </div>

              <!-- Ambient Animations -->
              <div class="sprite steam-1" style="
                position: absolute;
                left: ${7 * tileSize}px;
                top: ${8 * tileSize - 10}px;
                width: 16px;
                height: 24px;
                z-index: 8;
                opacity: 0.6;
              ">
                <div class="steam-sprite" id="sprite-steam-1"></div>
              </div>

              <div class="sprite steam-2" style="
                position: absolute;
                left: ${13 * tileSize + 8}px;
                top: ${8 * tileSize - 8}px;
                width: 16px;
                height: 24px;
                z-index: 8;
                opacity: 0.4;
              ">
                <div class="steam-sprite" id="sprite-steam-2"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Panel -->
        <div class="cafe-status-panel">
          <div class="status-grid">
            <div class="status-card">
              <div class="status-icon">📋</div>
              <div class="status-info">
                <div class="status-value">${this.getOrdersCompleted()}</div>
                <div class="status-label">Orders Completed</div>
              </div>
            </div>
            
            <div class="status-card">
              <div class="status-icon">💕</div>
              <div class="status-info">
                <div class="status-value">${player.journal.entries.length}</div>
                <div class="status-label">Memories Created</div>
              </div>
            </div>
            
            <div class="status-card">
              <div class="status-icon">🧪</div>
              <div class="status-info">
                <div class="status-value">${player.flavors.length}</div>
                <div class="status-label">Flavors Owned</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="quick-action-btn" data-navigate="orders">
            <span class="btn-icon">📋</span>
            <span class="btn-label">Orders</span>
          </button>
          <button class="quick-action-btn" data-navigate="flavor-collection">
            <span class="btn-icon">🧪</span>
            <span class="btn-label">Flavors</span>
          </button>
        </div>
      </div>

      <style>
        ${this.generateAnimatedCafeCSS()}
      </style>
    `;
  }

  /**
   * Generate CSS for animated cafe
   */
  private generateAnimatedCafeCSS(): string {
    return `
      .cafe-hub-animated {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
        min-height: 100vh;
        background: linear-gradient(135deg, #ffeef4 0%, #ffd6e1 50%, #ffb8c6 100%);
      }

      .cafe-scene-container {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }

      .cafe-background-pattern {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 1px, transparent 1px),
          radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 1px, transparent 1px);
        background-size: 40px 40px, 60px 60px;
        z-index: 0;
      }

      .sprites-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .sprite {
        pointer-events: auto;
        user-select: none;
      }

      .sprite:hover {
        transform: scale(1.05);
      }

      .sprite:active {
        transform: scale(0.98);
      }

      /* NPC Sprites */
      .npc-sprite {
        width: 100%;
        height: 48px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        animation: npcIdle 3s ease-in-out infinite;
      }

      .npc-nameplate {
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255,255,255,0.9);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        color: #2d3436;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 2px solid #e17497;
      }

      /* Object Sprites */
      .object-sprite {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        animation: objectPulse 2s ease-in-out infinite;
      }

      .flavor-jars {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .jar {
        font-size: 16px;
        animation: jarBounce 3s ease-in-out infinite;
        animation-delay: calc(var(--jar-index, 0) * 0.2s);
      }

      /* Steam Animation */
      .steam-sprite {
        width: 100%;
        height: 100%;
        background: linear-gradient(to top, 
          rgba(255,255,255,0.8) 0%,
          rgba(255,255,255,0.4) 50%,
          rgba(255,255,255,0.1) 100%);
        border-radius: 50%;
        animation: steamRise 2s ease-in-out infinite;
      }

      /* Hotspot Labels */
      .hotspot-label {
        position: absolute;
        bottom: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(225, 116, 151, 0.9);
        color: white;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 3px 10px rgba(225, 116, 151, 0.3);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .sprite:hover .hotspot-label {
        opacity: 1;
      }

      /* Status Panel */
      .cafe-status-panel {
        background: rgba(255,255,255,0.95);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        backdrop-filter: blur(10px);
      }

      .status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
      }

      .status-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: linear-gradient(135deg, #ffeef4, #ffd6e1);
        border-radius: 12px;
        border: 2px solid rgba(225, 116, 151, 0.2);
      }

      .status-icon {
        font-size: 24px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(225, 116, 151, 0.1);
        border-radius: 50%;
      }

      .status-value {
        font-size: 24px;
        font-weight: 700;
        color: #e17497;
      }

      .status-label {
        font-size: 12px;
        color: #636e72;
        font-weight: 500;
      }

      /* Quick Actions */
      .quick-actions {
        display: flex;
        justify-content: center;
        gap: 16px;
      }

      .quick-action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #e17497, #f2a5b8);
        color: white;
        border: none;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(225, 116, 151, 0.3);
      }

      .quick-action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(225, 116, 151, 0.4);
      }

      .btn-icon {
        font-size: 18px;
      }

      /* Animations */
      @keyframes npcIdle {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-2px); }
      }

      @keyframes objectPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }

      @keyframes jarBounce {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        25% { transform: translateY(-3px) rotate(2deg); }
        75% { transform: translateY(-1px) rotate(-1deg); }
      }

      @keyframes steamRise {
        0% { 
          transform: translateY(0px) scale(0.8);
          opacity: 0.8;
        }
        50% {
          transform: translateY(-8px) scale(1);
          opacity: 0.4;
        }
        100% { 
          transform: translateY(-16px) scale(1.2);
          opacity: 0;
        }
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        .cafe-hub-animated {
          padding: 10px;
        }

        .cafe-scene-container {
          padding: 10px;
        }

        .status-grid {
          grid-template-columns: 1fr;
        }

        .quick-actions {
          flex-direction: column;
          align-items: center;
        }

        .quick-action-btn {
          width: 200px;
          justify-content: center;
        }
      }
    `;
  }

  /**
   * Setup sprite animations
   */
  private setupSpriteAnimations(): void {
    const spriteSheets = createCafeSpriteSheets();

    // Create NPC sprites
    if (spriteSheets.aria) {
      this.spriteAnimator.createSprite('aria', spriteSheets.aria, 'idle');
    }
    if (spriteSheets.kai) {
      this.spriteAnimator.createSprite('kai', spriteSheets.kai, 'idle');
    }
    if (spriteSheets.elias) {
      this.spriteAnimator.createSprite('elias', spriteSheets.elias, 'idle');
    }

    // Create ambient sprites
    if (spriteSheets.steam) {
      this.spriteAnimator.createSprite('steam-1', spriteSheets.steam, 'rise');
      this.spriteAnimator.createSprite('steam-2', spriteSheets.steam, 'rise');
    }

    // Create object sprites
    if (spriteSheets.objects) {
      this.spriteAnimator.createSprite('order-board', spriteSheets.objects, 'orderBook');
      this.spriteAnimator.createSprite('flavor-jars', spriteSheets.objects, 'flavorJar');
    }
  }

  /**
   * Update sprite visuals
   */
  private updateSpriteVisuals(): void {
    // Update NPC sprites
    this.updateSpriteElement('aria');
    this.updateSpriteElement('kai'); 
    this.updateSpriteElement('elias');

    // Update steam sprites
    this.updateSteamSprite('steam-1');
    this.updateSteamSprite('steam-2');
  }

  /**
   * Update individual sprite element
   */
  private updateSpriteElement(spriteId: string): void {
    const element = this.querySelector(`#sprite-${spriteId}`);
    if (element) {
      const css = this.spriteAnimator.getSpriteCSS(spriteId);
      Object.assign(element.style, css);
    }
  }

  /**
   * Update steam sprite with special handling
   */
  private updateSteamSprite(spriteId: string): void {
    const element = this.querySelector(`#sprite-${spriteId}`);
    if (element) {
      // Steam uses CSS animation instead of sprite sheets for now
      element.style.animation = 'steamRise 2s ease-in-out infinite';
    }
  }

  /**
   * Get orders completed count
   */
  private getOrdersCompleted(): number {
    // TODO: Implement actual order tracking
    return Math.floor(Math.random() * 25) + 5;
  }

  /**
   * Handle screen show
   */
  protected override onScreenShow(_data?: ScreenData): void {
    this.eventSystem.emit('header:set_variant', { variant: 'cafe-hub' });
    
    // Start animation updates
    this.startAnimationUpdates();
  }

  /**
   * Handle screen hide  
   */
  protected override onScreenHide(): void {
    this.stopAnimationUpdates();
  }

  /**
   * Start animation update loop
   */
  private startAnimationUpdates(): void {
    if (this.animationUpdateInterval) return;

    this.animationUpdateInterval = window.setInterval(() => {
      this.updateSpriteVisuals();
    }, 100); // Update at 10 FPS
  }

  /**
   * Stop animation updates
   */
  private stopAnimationUpdates(): void {
    if (this.animationUpdateInterval) {
      window.clearInterval(this.animationUpdateInterval);
      this.animationUpdateInterval = null;
    }
  }

  /**
   * Handle actions
   */
  protected override handleAction(action: string, element: HTMLElement): void {
    switch (action) {
      case 'talk-npc': {
        const npcId = element.getAttribute('data-npc');
        if (npcId) {
          this.talkToNPC(npcId);
        }
        break;
      }
      
      default:
        super.handleAction(action, element);
    }
  }

  /**
   * Handle NPC interaction
   */
  private talkToNPC(npcId: string): void {
    // Play wave animation
    this.spriteAnimator.playAnimation(npcId, 'wave', () => {
      this.spriteAnimator.playAnimation(npcId, 'idle');
    });

    // Show interaction message
    this.showSuccess(`You chatted with ${npcId.charAt(0).toUpperCase() + npcId.slice(1)}! 💕`);
    
    // TODO: Implement proper NPC dialogue system
  }

  /**
   * Cleanup
   */
  override onDestroy(): void {
    this.stopAnimationUpdates();
    this.spriteAnimator.destroy();
    super.onDestroy?.();
  }
}