/**
 * Tile System for 2D Cafe Layout
 * Manages grid-based positioning and tile interactions
 */

export interface TilePosition {
  x: number; // tile column
  y: number; // tile row
}

export interface WorldPosition {
  x: number; // pixel x
  y: number; // pixel y
}

export interface Tile {
  position: TilePosition;
  type: 'floor' | 'wall' | 'counter' | 'table' | 'decoration' | 'hotspot';
  walkable: boolean;
  interactive: boolean;
  spriteId?: string;
  data?: Record<string, unknown>;
}

export interface TileLayer {
  name: string;
  tiles: Tile[];
  zIndex: number;
  visible: boolean;
  opacity: number;
  interactive?: boolean;
}

export class TileSystem {
  private tileSize: number;
  private gridWidth: number;
  private gridHeight: number;
  private layers: Map<string, TileLayer> = new Map();

  constructor(
    tileSize: number = 32,
    gridWidth: number = 20,
    gridHeight: number = 15
  ) {
    this.tileSize = tileSize;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
  }

  /**
   * Convert tile position to world position
   */
  tileToWorld(tilePos: TilePosition): WorldPosition {
    return {
      x: tilePos.x * this.tileSize,
      y: tilePos.y * this.tileSize,
    };
  }

  /**
   * Convert world position to tile position
   */
  worldToTile(worldPos: WorldPosition): TilePosition {
    return {
      x: Math.floor(worldPos.x / this.tileSize),
      y: Math.floor(worldPos.y / this.tileSize),
    };
  }

  /**
   * Check if tile position is within bounds
   */
  isValidTilePosition(pos: TilePosition): boolean {
    return pos.x >= 0 && pos.x < this.gridWidth && pos.y >= 0 && pos.y < this.gridHeight;
  }

  /**
   * Add a tile layer
   */
  addLayer(layer: TileLayer): void {
    this.layers.set(layer.name, layer);
  }

  /**
   * Get tile layer
   */
  getLayer(name: string): TileLayer | undefined {
    return this.layers.get(name);
  }

  /**
   * Add tile to layer
   */
  addTile(layerName: string, tile: Tile): boolean {
    const layer = this.layers.get(layerName);
    if (!layer || !this.isValidTilePosition(tile.position)) {
      return false;
    }

    // Remove existing tile at position
    layer.tiles = layer.tiles.filter(
      t => !(t.position.x === tile.position.x && t.position.y === tile.position.y)
    );

    layer.tiles.push(tile);
    return true;
  }

  /**
   * Get tile at position in layer
   */
  getTileAt(layerName: string, pos: TilePosition): Tile | undefined {
    const layer = this.layers.get(layerName);
    if (!layer) return undefined;

    return layer.tiles.find(
      t => t.position.x === pos.x && t.position.y === pos.y
    );
  }

  /**
   * Get all tiles at position across all layers
   */
  getAllTilesAt(pos: TilePosition): Tile[] {
    const tiles: Tile[] = [];
    
    this.layers.forEach(layer => {
      const tile = layer.tiles.find(
        t => t.position.x === pos.x && t.position.y === pos.y
      );
      if (tile) tiles.push(tile);
    });

    return tiles.sort((a, b) => {
      const layerA = this.getLayerForTile(a);
      const layerB = this.getLayerForTile(b);
      return (layerA?.zIndex || 0) - (layerB?.zIndex || 0);
    });
  }

  /**
   * Find layer containing tile
   */
  private getLayerForTile(tile: Tile): TileLayer | undefined {
    for (const layer of this.layers.values()) {
      if (layer.tiles.includes(tile)) {
        return layer;
      }
    }
    return undefined;
  }

  /**
   * Check if position is walkable
   */
  isWalkable(pos: TilePosition): boolean {
    const tiles = this.getAllTilesAt(pos);
    return tiles.length === 0 || tiles.every(t => t.walkable);
  }

  /**
   * Get interactive tiles at position
   */
  getInteractiveTilesAt(pos: TilePosition): Tile[] {
    return this.getAllTilesAt(pos).filter(t => t.interactive);
  }

  /**
   * Generate CSS grid layout
   */
  generateGridCSS(): string {
    return `
      .tile-grid {
        display: grid;
        grid-template-columns: repeat(${this.gridWidth}, ${this.tileSize}px);
        grid-template-rows: repeat(${this.gridHeight}, ${this.tileSize}px);
        position: relative;
        width: ${this.gridWidth * this.tileSize}px;
        height: ${this.gridHeight * this.tileSize}px;
      }
      
      .tile {
        position: relative;
        width: ${this.tileSize}px;
        height: ${this.tileSize}px;
      }
      
      .tile-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      
      .tile-layer.interactive {
        pointer-events: auto;
      }
    `;
  }

  /**
   * Generate HTML for tile layers
   */
  generateLayersHTML(): string {
    const sortedLayers = Array.from(this.layers.values())
      .sort((a, b) => a.zIndex - b.zIndex);

    return sortedLayers
      .filter(layer => layer.visible)
      .map(layer => this.generateLayerHTML(layer))
      .join('');
  }

  /**
   * Generate HTML for single layer
   */
  private generateLayerHTML(layer: TileLayer): string {
    const tilesHTML = layer.tiles
      .map(tile => this.generateTileHTML(tile))
      .join('');

    return `
      <div class="tile-layer ${layer.interactive ? 'interactive' : ''}" 
           style="z-index: ${layer.zIndex}; opacity: ${layer.opacity};">
        ${tilesHTML}
      </div>
    `;
  }

  /**
   * Generate HTML for single tile
   */
  private generateTileHTML(tile: Tile): string {
    const worldPos = this.tileToWorld(tile.position);
    const interactiveClass = tile.interactive ? 'tile-interactive' : '';
    const dataAttributes = tile.data 
      ? Object.entries(tile.data)
          .map(([key, value]) => `data-${key}="${value}"`)
          .join(' ')
      : '';

    return `
      <div class="tile tile-${tile.type} ${interactiveClass}"
           style="
             position: absolute;
             left: ${worldPos.x}px;
             top: ${worldPos.y}px;
             width: ${this.tileSize}px;
             height: ${this.tileSize}px;
           "
           data-tile-x="${tile.position.x}"
           data-tile-y="${tile.position.y}"
           data-tile-type="${tile.type}"
           ${dataAttributes}>
        ${tile.spriteId ? `<div class="sprite" data-sprite-id="${tile.spriteId}"></div>` : ''}
      </div>
    `;
  }

  /**
   * Create default cafe layout
   */
  static createCafeLayout(): TileSystem {
    const tileSystem = new TileSystem(32, 20, 15);

    // Background layer
    tileSystem.addLayer({
      name: 'background',
      tiles: [],
      zIndex: 0,
      visible: true,
      opacity: 1,
    });

    // Floor layer
    tileSystem.addLayer({
      name: 'floor',
      tiles: [],
      zIndex: 1,
      visible: true,
      opacity: 1,
    });

    // Objects layer
    tileSystem.addLayer({
      name: 'objects',
      tiles: [],
      zIndex: 2,
      visible: true,
      opacity: 1,
    });

    // NPCs layer
    tileSystem.addLayer({
      name: 'npcs',
      tiles: [],
      zIndex: 3,
      visible: true,
      opacity: 1,
    });

    // Hotspots layer (interactive)
    tileSystem.addLayer({
      name: 'hotspots',
      tiles: [],
      zIndex: 4,
      visible: true,
      opacity: 1,
    });

    // Add floor tiles
    for (let x = 2; x < 18; x++) {
      for (let y = 2; y < 13; y++) {
        tileSystem.addTile('floor', {
          position: { x, y },
          type: 'floor',
          walkable: true,
          interactive: false,
        });
      }
    }

    // Add counter
    for (let x = 6; x < 14; x++) {
      tileSystem.addTile('objects', {
        position: { x, y: 8 },
        type: 'counter',
        walkable: false,
        interactive: false,
      });
    }

    // Add interactive hotspots
    tileSystem.addTile('hotspots', {
      position: { x: 10, y: 7 },
      type: 'hotspot',
      walkable: true,
      interactive: true,
      data: { action: 'orders', label: 'Order Board' },
    });

    tileSystem.addTile('hotspots', {
      position: { x: 4, y: 4 },
      type: 'hotspot',
      walkable: true,
      interactive: true,
      data: { action: 'flavor-collection', label: 'Flavor Collection' },
    });

    // Add NPC positions
    tileSystem.addTile('npcs', {
      position: { x: 8, y: 6 },
      type: 'decoration',
      walkable: false,
      interactive: true,
      spriteId: 'aria',
      data: { npc: 'aria', action: 'talk' },
    });

    tileSystem.addTile('npcs', {
      position: { x: 12, y: 6 },
      type: 'decoration',
      walkable: false,
      interactive: true,
      spriteId: 'kai',
      data: { npc: 'kai', action: 'talk' },
    });

    tileSystem.addTile('npcs', {
      position: { x: 15, y: 10 },
      type: 'decoration',
      walkable: false,
      interactive: true,
      spriteId: 'elias',
      data: { npc: 'elias', action: 'talk' },
    });

    return tileSystem;
  }

  /**
   * Get grid dimensions
   */
  getDimensions(): { width: number; height: number; tileSize: number } {
    return {
      width: this.gridWidth,
      height: this.gridHeight,
      tileSize: this.tileSize,
    };
  }
}
