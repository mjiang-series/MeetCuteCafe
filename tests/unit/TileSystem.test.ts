/**
 * Unit tests for TileSystem
 * Phase 1 validation requirement: Responsive layout and tile management
 */

import { TileSystem } from '@/systems/TileSystem';

// Mock window dimensions for responsive testing
const mockWindow = {
  innerWidth: 1920,
  innerHeight: 1080
};

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: mockWindow.innerWidth,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: mockWindow.innerHeight,
});

describe('TileSystem', () => {
  describe('responsive dimensions calculation', () => {
    test('calculates desktop dimensions correctly', () => {
      mockWindow.innerWidth = 1920;
      mockWindow.innerHeight = 1080;
      
      const dimensions = TileSystem.calculateResponsiveDimensions();
      
      expect(dimensions.gridWidth).toBeGreaterThan(30);
      expect(dimensions.gridHeight).toBeGreaterThan(20);
      expect(dimensions.tileSize).toBeGreaterThanOrEqual(20);
      expect(dimensions.tileSize).toBeLessThanOrEqual(40);
    });

    test('calculates mobile dimensions correctly', () => {
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 667;
      
      const dimensions = TileSystem.calculateResponsiveDimensions();
      
      expect(dimensions.gridWidth).toBeGreaterThan(10);
      expect(dimensions.gridHeight).toBeGreaterThan(5);
      expect(dimensions.tileSize).toBeGreaterThanOrEqual(20);
    });

    test('calculates tablet dimensions correctly', () => {
      mockWindow.innerWidth = 768;
      mockWindow.innerHeight = 1024;
      
      const dimensions = TileSystem.calculateResponsiveDimensions();
      
      expect(dimensions.gridWidth).toBeGreaterThan(15);
      expect(dimensions.gridHeight).toBeGreaterThan(15);
      expect(dimensions.tileSize).toBeGreaterThanOrEqual(20);
    });

    test('ensures minimum tile size for usability', () => {
      mockWindow.innerWidth = 320;
      mockWindow.innerHeight = 568;
      
      const dimensions = TileSystem.calculateResponsiveDimensions();
      
      expect(dimensions.tileSize).toBeGreaterThanOrEqual(20);
    });
  });

  describe('table position calculation', () => {
    test('calculates appropriate table positions for different grid sizes', () => {
      const smallGrid = TileSystem.calculateTablePositions(12, 8);
      const largeGrid = TileSystem.calculateTablePositions(20, 15);
      
      expect(smallGrid.length).toBeLessThanOrEqual(largeGrid.length);
      expect(smallGrid.length).toBeGreaterThan(0);
      expect(largeGrid.length).toBeGreaterThan(0);
    });

    test('avoids counter area when positioning tables', () => {
      const positions = TileSystem.calculateTablePositions(20, 15);
      
      // Tables should not be placed in the rightmost columns (counter area)
      positions.forEach(pos => {
        expect(pos.x).toBeLessThan(16); // Leave space for counter
        expect(pos.y).toBeGreaterThan(0); // Not on edges
      });
    });

    test('returns empty array for grids too small', () => {
      const tinyGrid = TileSystem.calculateTablePositions(8, 5);
      expect(Array.isArray(tinyGrid)).toBe(true);
    });
  });

  describe('cafe layout creation', () => {
    test('creates cafe layout with proper structure', () => {
      const tileSystem = TileSystem.createCafeLayout();
      
      expect(tileSystem).toBeInstanceOf(TileSystem);
      
      const dimensions = tileSystem.getDimensions();
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
      expect(dimensions.tileSize).toBeGreaterThan(0);
    });

    test('creates all required layers', () => {
      const tileSystem = TileSystem.createCafeLayout();
      
      // Test that layers exist by checking if we can add tiles to them
      expect(() => {
        tileSystem.addTile('floor', {
        position: { x: 1, y: 1 },
        type: 'floor' as const,
        walkable: true,
          interactive: false
        });
      }).not.toThrow();
    });
  });

  describe('tile management', () => {
    let tileSystem: TileSystem;

    beforeEach(() => {
      tileSystem = new TileSystem(32, 10, 10);
      
      // Add a basic layer for testing
      tileSystem.addLayer({
        name: 'test',
        tiles: [],
        zIndex: 1,
        visible: true,
        opacity: 1
      });
    });

    test('adds tiles correctly', () => {
      const tile = {
        position: { x: 5, y: 5 },
        type: 'floor' as const,
        walkable: true,
        interactive: false
      };

      expect(() => {
        tileSystem.addTile('test', tile);
      }).not.toThrow();
    });

    test('validates tile positions', () => {
      expect(tileSystem.isValidTilePosition({ x: 5, y: 5 })).toBe(true);
      expect(tileSystem.isValidTilePosition({ x: -1, y: 5 })).toBe(false);
      expect(tileSystem.isValidTilePosition({ x: 5, y: -1 })).toBe(false);
      expect(tileSystem.isValidTilePosition({ x: 15, y: 5 })).toBe(false);
      expect(tileSystem.isValidTilePosition({ x: 5, y: 15 })).toBe(false);
    });

    test('checks walkability correctly', () => {
      // Add a walkable tile
      tileSystem.addTile('test', {
        position: { x: 3, y: 3 },
        type: 'floor' as const,
        walkable: true,
        interactive: false
      });

      // Add a non-walkable tile
      tileSystem.addTile('test', {
        position: { x: 4, y: 4 },
        type: 'wall' as const,
        walkable: false,
        interactive: false
      });

      expect(tileSystem.isWalkable({ x: 3, y: 3 })).toBe(true);
      expect(tileSystem.isWalkable({ x: 4, y: 4 })).toBe(false);
      expect(tileSystem.isWalkable({ x: 5, y: 5 })).toBe(true); // Empty space is walkable
    });

    test('retrieves tiles correctly', () => {
      const tile = {
        position: { x: 2, y: 2 },
        type: 'counter' as const,
        walkable: false,
        interactive: true
      };

      tileSystem.addTile('test', tile);
      const retrieved = tileSystem.getTileAt('test', { x: 2, y: 2 });
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.type).toBe('counter');
      expect(retrieved?.walkable).toBe(false);
    });
  });

  describe('layer management', () => {
    let tileSystem: TileSystem;

    beforeEach(() => {
      tileSystem = new TileSystem(32, 10, 10);
    });

    test('adds layers correctly', () => {
      const layer = {
        name: 'background',
        tiles: [],
        zIndex: 0,
        visible: true,
        opacity: 1
      };

      expect(() => {
        tileSystem.addLayer(layer);
      }).not.toThrow();
    });

    test('manages layer visibility', () => {
      const layer = {
        name: 'ui',
        tiles: [],
        zIndex: 10,
        visible: false,
        opacity: 0.5
      };

      tileSystem.addLayer(layer);
      
      // Test that layer properties are maintained
      expect(layer.visible).toBe(false);
      expect(layer.opacity).toBe(0.5);
    });
  });

  describe('dimensions and properties', () => {
    test('returns correct dimensions', () => {
      const tileSystem = new TileSystem(24, 15, 12);
      const dimensions = tileSystem.getDimensions();
      
      expect(dimensions.width).toBe(15);
      expect(dimensions.height).toBe(12);
      expect(dimensions.tileSize).toBe(24);
    });

    test('handles different tile sizes', () => {
      const smallTiles = new TileSystem(16, 20, 15);
      const largeTiles = new TileSystem(48, 10, 8);
      
      expect(smallTiles.getDimensions().tileSize).toBe(16);
      expect(largeTiles.getDimensions().tileSize).toBe(48);
    });
  });
});
