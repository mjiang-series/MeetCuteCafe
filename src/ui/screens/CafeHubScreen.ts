/**
 * Café Hub Screen - Animated 2D tile-based hub with sprite animations
 */

import { BaseScreen } from '../BaseScreen';
import type { EventSystem } from '@/systems/EventSystem';
import type { GameStateManager } from '@/systems/GameStateManager';
import type { AssetManager } from '@/systems/AssetManager';
import { TileSystem } from '@/systems/TileSystem';
import { MovementSystem } from '@/systems/MovementSystem';
import { placeholderAssets } from '@/utils/PlaceholderAssets';
import type { ScreenData } from '../ScreenManager';

export class CafeHubScreen extends BaseScreen {
  private _tileSystem: TileSystem | null = null;
  private movementSystem: MovementSystem | null = null;
  private animationUpdateInterval: number | null = null;
  private _generatedAssets: Record<string, string> | null = null;

  constructor(
    eventSystem: EventSystem,
    gameState: GameStateManager,
    assetManager: AssetManager
  ) {
    super('cafe-hub', eventSystem, gameState, assetManager);
    
    this.setupMovementSystem();
  }

  private get generatedAssets(): Record<string, string> {
    if (!this._generatedAssets) {
      this._generatedAssets = placeholderAssets.generateCafeAssets();
    }
    return this._generatedAssets;
  }

  private get tileSystem(): TileSystem {
    if (!this._tileSystem) {
      this._tileSystem = TileSystem.createCafeLayout();
    }
    return this._tileSystem;
  }

  protected createContent(): string {
    // Trigger tile system initialization
    this.tileSystem.getDimensions();

    return `
      <!-- Full-Screen Animated Café -->
      <div class="cafe-grid" id="cafe-grid" style="
        width: 100vw;
        height: calc(100vh - 80px);
        position: fixed;
        top: 80px;
        left: 0;
        background: linear-gradient(135deg, #ffeef4 0%, #ffd6e1 50%, #ffb8c6 100%);
        overflow: hidden;
      ">
        <!-- Tile Grid Background -->
        ${this.renderTileGrid()}
        
        <!-- Moving Characters Layer -->
        <div class="characters-layer" id="characters-layer" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10;
          pointer-events: none;
        ">
          <!-- Characters will be positioned here dynamically -->
        </div>
        
        <!-- UI Elements docked to counter -->
        <div class="counter-ui-elements">
          ${this.renderCounterUIElements()}
        </div>
      </div>

      <style>
        ${this.generatePlaceholderCSS()}
        ${placeholderAssets.generateAssetCSS(this.generatedAssets)}
      </style>
    `;
  }

  /**
   * Render the tile grid background
   */
  private renderTileGrid(): string {
    const { width, height, tileSize } = this.tileSystem.getDimensions();
    let html = '';

    // Render floor tiles
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tile = this.tileSystem.getTileAt('floor', { x, y });
        if (tile) {
          html += `
            <div class="tile floor-tile asset-floor" style="
              position: absolute;
              left: ${x * tileSize}px;
              top: ${y * tileSize}px;
              width: ${tileSize}px;
              height: ${tileSize}px;
              z-index: 1;
            "></div>
          `;
        }
      }
    }

    // Render object tiles (counter, tables)
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tile = this.tileSystem.getTileAt('objects', { x, y });
        if (tile) {
          if (tile.type === 'counter') {
            html += `
              <div class="tile counter-tile asset-counter" style="
                position: absolute;
                left: ${x * tileSize}px;
                top: ${y * tileSize}px;
                width: ${tileSize}px;
                height: ${tileSize}px;
                z-index: 2;
              "></div>
            `;
          } else if (tile.type === 'table' && tile.data?.isMainTile) {
            // Only render the main tile for 2x2 tables
            html += `
              <div class="tile table-tile asset-table" style="
                position: absolute;
                left: ${x * tileSize}px;
                top: ${y * tileSize}px;
                width: ${tileSize * 2}px;
                height: ${tileSize * 2}px;
                z-index: 2;
              "></div>
            `;
          }
        }
      }
    }

    return html;
  }

  /**
   * Render counter UI elements with responsive positioning
   */
  private renderCounterUIElements(): string {
    const { width, tileSize } = this.tileSystem.getDimensions();
    const counterX = width - 2; // Counter position
    
    const uiElements = [
      { id: 'orders', icon: 'assignment', label: 'Orders', navigate: 'orders', yOffset: 1 },
      { id: 'flavors', icon: 'science', label: 'Flavors', navigate: 'flavor-collection', yOffset: 3 },
      { id: 'memories', icon: 'favorite', label: 'Memories', navigate: 'journal', yOffset: 5 },
      { id: 'messages', icon: 'chat', label: 'Messages', navigate: 'conversation-history', yOffset: 7 }
    ];

    return uiElements.map(element => `
      <div class="counter-ui-item" style="
        position: absolute;
        left: ${counterX * tileSize - 8}px;
        top: ${element.yOffset * tileSize}px;
        width: 48px;
        height: 48px;
        z-index: 15;
        cursor: pointer;
        transition: transform 0.2s ease;
      " data-navigate="${element.navigate}">
        <div class="ui-icon-container">
          <span class="material-icons ui-icon">${element.icon}</span>
        </div>
        <div class="ui-label">${element.label}</div>
      </div>
    `).join('');
  }

  /**
   * Setup event listeners for UI interactions
   */
  protected override setupEventListeners(): void {
    // Handle counter UI element clicks
    this.element.addEventListener('click', (e) => {
      const uiItem = (e.target as Element).closest('.counter-ui-item');
      if (uiItem) {
        const navigate = uiItem.getAttribute('data-navigate');
        if (navigate) {
          console.log(`🎯 Navigating to ${navigate}`);
          this.eventSystem.emit('ui:show_screen', { screenId: navigate });
        }
      }
    });
  }

  /**
   * Setup movement system for characters
   */
  private setupMovementSystem(): void {
    // Will be initialized when tileSystem is ready
  }

  /**
   * Initialize movement system with characters
   */
  private initializeMovementSystem(): void {
    if (!this.movementSystem) {
      // Ensure tileSystem is initialized
      const tileSystem = this.tileSystem; // This will initialize it via the getter
      
      this.movementSystem = new MovementSystem(tileSystem, this.eventSystem);
      
      // Add default characters
      const characters = MovementSystem.createDefaultCharacters();
      characters.forEach(char => {
        this.movementSystem!.addCharacter(char);
      });

      // Listen for character movement events
      this.eventSystem.on('character:moved', (data) => {
        this.updateCharacterPosition(data.characterId, data.position as any);
      });

      // Start movement
      this.movementSystem.start();
      
      console.log(`Movement system initialized with ${characters.length} characters`);
    }
  }

  /**
   * Update character position in the DOM
   */
  private updateCharacterPosition(characterId: string, position: { x: number; y: number }): void {
    const characterElement = document.getElementById(`character-${characterId}`);
    if (characterElement) {
      const { tileSize } = this.tileSystem.getDimensions();
      characterElement.style.left = `${position.x * tileSize + 4}px`; // Center in tile
      characterElement.style.top = `${position.y * tileSize - 8}px`; // Slightly above tile
    }
  }

  /**
   * Render moving characters
   */
  private renderCharacters(): void {
    if (!this.movementSystem) {
      console.log('No movement system available');
      return;
    }

    const charactersLayer = document.getElementById('characters-layer');
    if (!charactersLayer) {
      console.log('Characters layer not found');
      return;
    }

    const { tileSize } = this.tileSystem.getDimensions();
    const characters = this.movementSystem.getCharacters();
    
    console.log(`Rendering ${characters.length} characters`);

    // Clear existing characters
    charactersLayer.innerHTML = '';

      // Render each character
      characters.forEach(character => {
        const characterElement = document.createElement('div');
        characterElement.id = `character-${character.id}`;
        characterElement.className = `character ${character.type}`;
        characterElement.style.cssText = `
          position: absolute;
          left: ${character.currentPos.x * tileSize + 4}px;
          top: ${character.currentPos.y * tileSize - 8}px;
          width: 24px;
          height: 32px;
          z-index: 15;
          transition: left 0.3s ease, top 0.3s ease;
          cursor: ${character.type === 'npc' ? 'pointer' : 'default'};
          pointer-events: auto;
        `;

        // Add character sprite
        const spriteElement = document.createElement('div');
        spriteElement.className = `asset-${character.type === 'npc' ? character.id : 'customer'}`;
        spriteElement.style.cssText = `
          width: 100%; 
          height: 100%;
          border: 2px solid ${character.color};
          border-radius: 4px;
          background-color: ${character.color};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        `;
        
        // Add character letter
        spriteElement.textContent = character.type === 'npc' 
          ? character.id.charAt(0).toUpperCase() 
          : 'C';
        
        characterElement.appendChild(spriteElement);

        // Add click handler for NPCs
        if (character.type === 'npc') {
          characterElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            e.preventDefault(); // Prevent default behavior
            console.log(`🗨️ Opening DM with ${character.id}`);
            this.eventSystem.emit('ui:show_screen', {
              screenId: 'dm',
              data: { npcId: character.id }
            });
          });
        }

        // Add nameplate for NPCs
        if (character.type === 'npc') {
          const nameplate = document.createElement('div');
          nameplate.className = 'character-nameplate';
          nameplate.textContent = character.id.charAt(0).toUpperCase() + character.id.slice(1);
          nameplate.style.cssText = `
            position: absolute;
            bottom: -18px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #e17497;
            border-radius: 8px;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: bold;
            color: #e17497;
            white-space: nowrap;
            pointer-events: none;
          `;
          characterElement.appendChild(nameplate);
        }

        charactersLayer.appendChild(characterElement);
      });
  }

  /**
   * Generate CSS for full-screen cafe
   */
  private generatePlaceholderCSS(): string {
    return `
      .cafe-grid {
        /* Full-screen cafe grid */
        position: fixed !important;
        top: 80px !important;
        left: 0 !important;
        width: 100vw !important;
        height: calc(100vh - 80px) !important;
        overflow: hidden !important;
      }

      .tile {
        border: 1px solid rgba(0,0,0,0.1);
      }

      .interactive-object:hover {
        transform: scale(1.05);
      }

      .hotspot-label {
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #e17497;
        border-radius: 8px;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: bold;
        color: #e17497;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .interactive-object:hover .hotspot-label {
        opacity: 1;
      }

      .character {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }

      .character.npc:hover {
        transform: scale(1.1);
      }

      .character.npc:hover .character-nameplate {
        opacity: 1;
        transform: translateX(-50%) translateY(-2px);
      }

      .character-nameplate {
        opacity: 0.8;
        animation: float 2s ease-in-out infinite;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      @keyframes float {
        0%, 100% { transform: translateX(-50%) translateY(0px); }
        50% { transform: translateX(-50%) translateY(-2px); }
      }

      /* Character visibility improvements */
      .characters-layer .character {
        position: absolute !important;
        z-index: 20 !important;
      }

      /* Counter UI Elements */
      .counter-ui-item {
        pointer-events: auto;
      }

      .counter-ui-item:hover {
        transform: scale(1.1);
      }

      .ui-icon-container {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(142, 68, 173, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.2);
        transition: all 0.2s ease;
      }

      .counter-ui-item:hover .ui-icon-container {
        box-shadow: 0 6px 16px rgba(142, 68, 173, 0.4);
        transform: translateY(-2px);
      }

      .ui-icon {
        color: white;
        font-size: 24px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }

      .ui-label {
        position: absolute;
        top: 52px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #8e44ad;
        border-radius: 8px;
        padding: 2px 6px;
        font-size: 10px;
        font-weight: bold;
        color: #8e44ad;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .counter-ui-item:hover .ui-label {
        opacity: 1;
      }

      .cafe-status-panel {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
        background: linear-gradient(135deg, #e17497 0%, #d1477a 100%);
        border-radius: 8px;
        color: white;
      }

      .status-icon {
        font-size: 24px;
      }

      .status-value {
        font-size: 20px;
        font-weight: bold;
      }

      .status-label {
        font-size: 12px;
        opacity: 0.9;
      }

      .quick-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .quick-action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px 24px;
        background: linear-gradient(135deg, #e17497 0%, #d1477a 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 4px 12px rgba(225, 116, 151, 0.3);
      }

      .quick-action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(225, 116, 151, 0.4);
      }

      .btn-icon {
        font-size: 24px;
      }

      .btn-label {
        font-size: 14px;
      }

      /* Mobile touch targets */
      @media (hover: none) and (pointer: coarse) {
        .counter-ui-item {
          min-width: 44px;
          min-height: 44px;
        }
        
        .character.npc {
          min-width: 32px;
          min-height: 32px;
        }
      }`;
  }

  override onShow(data?: ScreenData): void {
    super.onShow(data);
    
    // Set the correct header variant for cafe hub
    this.eventSystem.emit('header:set_variant', { variant: 'cafe-hub' });
    
    // Initialize movement system when screen is shown
    this.initializeMovementSystem();
    
    // Add resize listener for responsive updates
    this.setupResizeListener();
    
    // Render characters after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.renderCharacters();
      
      // Start a periodic re-render to keep characters visible
      if (!this.animationUpdateInterval) {
        this.animationUpdateInterval = window.setInterval(() => {
          this.renderCharacters();
        }, 1000); // Re-render every second
      }
    }, 100);
  }

  /**
   * Setup window resize listener for responsive updates
   */
  private setupResizeListener(): void {
    const handleResize = () => {
      const oldDimensions = this._tileSystem ? this.tileSystem.getDimensions() : null;
      
      // Store current character positions before recreating tile system
      const currentCharacters = this.movementSystem ? this.movementSystem.getCharacters() : [];
      
      // Recreate tile system with new dimensions
      this._tileSystem = null; // Reset to trigger recreation
      const newDimensions = this.tileSystem.getDimensions();
      
      // Re-render the entire screen content
      const element = this.element;
      if (element) {
        element.innerHTML = this.createContent();
        
        // Re-initialize movement system
        this.movementSystem?.destroy();
        this.movementSystem = null;
        this.initializeMovementSystem();
        
        // Reposition characters to stay visible
        if (oldDimensions && this.movementSystem) {
          this.repositionCharacters(currentCharacters, oldDimensions, newDimensions);
        }
        
        setTimeout(() => {
          this.renderCharacters();
        }, 100);
      }
    };

    // Debounce resize events
    let resizeTimeout: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(handleResize, 250);
    });
  }

  /**
   * Reposition characters to stay visible after screen resize
   */
  private repositionCharacters(
    oldCharacters: any[], 
    oldDimensions: { width: number; height: number; tileSize: number },
    newDimensions: { width: number; height: number; tileSize: number }
  ): void {
    if (!this.movementSystem) return;

    oldCharacters.forEach(oldChar => {
      const character = this.movementSystem!.getCharacter(oldChar.id);
      if (character) {
        // Calculate relative position (0-1 range)
        const relativeX = oldChar.currentPos.x / oldDimensions.width;
        const relativeY = oldChar.currentPos.y / oldDimensions.height;
        
        // Calculate new position based on new dimensions
        let newX = Math.floor(relativeX * newDimensions.width);
        let newY = Math.floor(relativeY * newDimensions.height);
        
        // Ensure character stays within bounds
        newX = Math.max(1, Math.min(newX, newDimensions.width - 2));
        newY = Math.max(1, Math.min(newY, newDimensions.height - 2));
        
        // Check if position is walkable, if not find nearby walkable position
        const newPos = this.findNearestWalkablePosition(newX, newY, newDimensions);
        
        // Update character position
        character.currentPos = newPos;
        character.targetPos = newPos;
        
        console.log(`Repositioned ${oldChar.id} from (${oldChar.currentPos.x},${oldChar.currentPos.y}) to (${newPos.x},${newPos.y})`);
      }
    });
  }

  /**
   * Find nearest walkable position
   */
  private findNearestWalkablePosition(x: number, y: number, dimensions: { width: number; height: number }): { x: number; y: number } {
    // Try the original position first
    if (this.tileSystem.isWalkable({ x, y })) {
      return { x, y };
    }
    
    // Search in expanding circles
    for (let radius = 1; radius <= 5; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
            const testX = x + dx;
            const testY = y + dy;
            
            if (testX >= 1 && testX < dimensions.width - 1 && 
                testY >= 1 && testY < dimensions.height - 1 &&
                this.tileSystem.isWalkable({ x: testX, y: testY })) {
              return { x: testX, y: testY };
            }
          }
        }
      }
    }
    
    // Fallback to safe position
    return { x: 2, y: 2 };
  }


  /**
   * Cleanup
   */
  override onDestroy(): void {
    if (this.movementSystem) {
      this.movementSystem.destroy();
      this.movementSystem = null;
    }
    if (this.animationUpdateInterval) {
      window.clearInterval(this.animationUpdateInterval);
      this.animationUpdateInterval = null;
    }
    super.onDestroy?.();
  }
}