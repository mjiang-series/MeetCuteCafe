/**
 * Unit tests for MovementSystem
 * Phase 1 validation requirement: Character movement and pathfinding
 */

import { MovementSystem } from '@/systems/MovementSystem';
import { TileSystem } from '@/systems/TileSystem';
import { EventSystem } from '@/systems/EventSystem';

// Mock dependencies
jest.mock('@/systems/EventSystem');

describe('MovementSystem', () => {
  let movementSystem: MovementSystem;
  let mockTileSystem: jest.Mocked<TileSystem>;
  let mockEventSystem: jest.Mocked<EventSystem>;

  beforeEach(() => {
    mockEventSystem = new EventSystem() as jest.Mocked<EventSystem>;
    
    // Create a simple mock tile system
    mockTileSystem = {
      isValidTilePosition: jest.fn((pos) => pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10),
      isWalkable: jest.fn((pos) => pos.x !== 5 || pos.y !== 5), // Block center tile
      getDimensions: jest.fn(() => ({ width: 10, height: 10, tileSize: 32 }))
    } as any;

    movementSystem = new MovementSystem(mockTileSystem, mockEventSystem);
  });

  afterEach(() => {
    movementSystem.destroy();
  });

  describe('character management', () => {
    test('adds characters correctly', () => {
      const character = {
        id: 'test_npc',
        type: 'npc' as const,
        currentPos: { x: 2, y: 2 },
        targetPos: { x: 2, y: 2 },
        color: '#e17497',
        speed: 1.0,
        maxIdleTime: 3000
      };

      movementSystem.addCharacter(character);
      
      const retrievedChar = movementSystem.getCharacter('test_npc');
      expect(retrievedChar).toBeDefined();
      expect(retrievedChar?.id).toBe('test_npc');
      expect(retrievedChar?.type).toBe('npc');
    });

    test('removes characters correctly', () => {
      const character = {
        id: 'temp_character',
        type: 'customer' as const,
        currentPos: { x: 1, y: 1 },
        targetPos: { x: 1, y: 1 },
        color: '#9b9b9b',
        speed: 1.2,
        maxIdleTime: 2000
      };

      movementSystem.addCharacter(character);
      expect(movementSystem.getCharacter('temp_character')).toBeDefined();
      
      movementSystem.removeCharacter('temp_character');
      expect(movementSystem.getCharacter('temp_character')).toBeUndefined();
    });

    test('gets all characters correctly', () => {
      const char1 = {
        id: 'char1',
        type: 'npc' as const,
        currentPos: { x: 1, y: 1 },
        targetPos: { x: 1, y: 1 },
        color: '#e17497',
        speed: 0.5,
        maxIdleTime: 5000
      };

      const char2 = {
        id: 'char2',
        type: 'customer' as const,
        currentPos: { x: 3, y: 3 },
        targetPos: { x: 3, y: 3 },
        color: '#9b9b9b',
        speed: 1.0,
        maxIdleTime: 2000
      };

      movementSystem.addCharacter(char1);
      movementSystem.addCharacter(char2);
      
      const allCharacters = movementSystem.getCharacters();
      expect(allCharacters).toHaveLength(2);
      expect(allCharacters.map(c => c.id)).toContain('char1');
      expect(allCharacters.map(c => c.id)).toContain('char2');
    });
  });

  describe('default character creation', () => {
    test('creates default characters with correct properties', () => {
      const defaultChars = MovementSystem.createDefaultCharacters();
      
      expect(defaultChars.length).toBeGreaterThan(0);
      
      // Check NPC characters
      const npcs = defaultChars.filter(c => c.type === 'npc');
      expect(npcs.length).toBe(3); // Aria, Kai, Elias
      
      const npcIds = npcs.map(c => c.id);
      expect(npcIds).toContain('aria');
      expect(npcIds).toContain('kai');
      expect(npcIds).toContain('elias');
      
      // Check customer characters
      const customers = defaultChars.filter(c => c.type === 'customer');
      expect(customers.length).toBeGreaterThan(0);
      
      // Verify color scheme
      const aria = npcs.find(c => c.id === 'aria');
      const kai = npcs.find(c => c.id === 'kai');
      const elias = npcs.find(c => c.id === 'elias');
      
      expect(aria?.color).toBe('#e17497'); // Pink
      expect(kai?.color).toBe('#4a90e2'); // Blue
      expect(elias?.color).toBe('#7ed321'); // Green
      
      customers.forEach(customer => {
        expect(customer.color).toBe('#9b9b9b'); // Gray
      });
    });

    test('default characters have valid positions and properties', () => {
      const defaultChars = MovementSystem.createDefaultCharacters();
      
      defaultChars.forEach(char => {
        expect(char.id).toBeDefined();
        expect(['npc', 'customer']).toContain(char.type);
        expect(char.currentPos.x).toBeGreaterThanOrEqual(0);
        expect(char.currentPos.y).toBeGreaterThanOrEqual(0);
        expect(char.speed).toBeGreaterThan(0);
        expect(char.maxIdleTime).toBeGreaterThan(0);
        expect(char.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('movement system lifecycle', () => {
    test('starts and stops correctly', () => {
      expect(movementSystem['updateInterval']).toBeNull();
      
      movementSystem.start();
      expect(movementSystem['updateInterval']).not.toBeNull();
      
      movementSystem.stop();
      expect(movementSystem['updateInterval']).toBeNull();
    });

    test('handles multiple start/stop calls safely', () => {
      movementSystem.start();
      const firstInterval = movementSystem['updateInterval'];
      
      movementSystem.start(); // Should not create duplicate interval
      expect(movementSystem['updateInterval']).toBe(firstInterval);
      
      movementSystem.stop();
      movementSystem.stop(); // Should not error on double stop
      expect(movementSystem['updateInterval']).toBeNull();
    });
  });

  describe('pathfinding', () => {
    test('finds path between valid positions', () => {
      const character = {
        id: 'pathfinder',
        type: 'npc' as const,
        currentPos: { x: 1, y: 1 },
        targetPos: { x: 3, y: 3 },
        color: '#e17497',
        speed: 1.0,
        maxIdleTime: 3000
      };

      movementSystem.addCharacter(character);
      
      // Test pathfinding by checking if character can move
      const path = movementSystem['findPath']({ x: 1, y: 1 }, { x: 3, y: 3 });
      expect(Array.isArray(path)).toBe(true);
      expect(path.length).toBeGreaterThan(0);
    });

    test('avoids blocked positions', () => {
      // Position (5,5) is blocked in our mock
      const path = movementSystem['findPath']({ x: 4, y: 4 }, { x: 6, y: 6 });
      
      // Path should not include the blocked tile
      const hasBlockedTile = path.some(pos => pos.x === 5 && pos.y === 5);
      expect(hasBlockedTile).toBe(false);
    });

    test('handles unreachable destinations gracefully', () => {
      // Try to path to an invalid position
      const path = movementSystem['findPath']({ x: 1, y: 1 }, { x: -1, y: -1 });
      expect(Array.isArray(path)).toBe(true);
    });
  });

  describe('position validation', () => {
    test('checks position availability correctly', () => {
      const character = {
        id: 'blocker',
        type: 'npc' as const,
        currentPos: { x: 2, y: 2 },
        targetPos: { x: 2, y: 2 },
        color: '#e17497',
        speed: 1.0,
        maxIdleTime: 3000
      };

      movementSystem.addCharacter(character);
      
      // Position should be blocked by character
      const isAvailable = movementSystem['isPositionAvailable']({ x: 2, y: 2 }, 'different_id');
      expect(isAvailable).toBe(false);
      
      // Same character should be able to stay in position
      const isSelfAvailable = movementSystem['isPositionAvailable']({ x: 2, y: 2 }, 'blocker');
      expect(isSelfAvailable).toBe(true);
    });

    test('respects tile walkability', () => {
      // Position (5,5) is not walkable in our mock
      const isAvailable = movementSystem['isPositionAvailable']({ x: 5, y: 5 }, 'any_id');
      expect(isAvailable).toBe(false);
    });
  });

  describe('random position generation', () => {
    test('generates valid walkable positions', () => {
      const position = movementSystem['getRandomWalkablePosition']();
      
      if (position) {
        expect(position.x).toBeGreaterThanOrEqual(2);
        expect(position.y).toBeGreaterThanOrEqual(2);
        expect(position.x).toBeLessThan(8); // Avoid edges
        expect(position.y).toBeLessThan(8);
        expect(mockTileSystem.isValidTilePosition(position)).toBe(true);
      }
    });

    test('handles cases where no valid position is found', () => {
      // Mock all positions as non-walkable
      mockTileSystem.isWalkable.mockReturnValue(false);
      
      const position = movementSystem['getRandomWalkablePosition']();
      expect(position).toBeNull();
    });
  });

  describe('event emission', () => {
    test('emits character movement events', () => {
      const character = {
        id: 'event_test',
        type: 'npc' as const,
        currentPos: { x: 1, y: 1 },
        targetPos: { x: 2, y: 2 },
        color: '#e17497',
        speed: 1.0,
        maxIdleTime: 1000
      };

      movementSystem.addCharacter(character);
      
      // Simulate movement update
      movementSystem['moveCharacter'](
        movementSystem.getCharacter('event_test')!,
        Date.now()
      );
      
      // Should emit movement event if character moved
      // Note: This test verifies the event system integration
      expect(mockEventSystem.emit).toHaveBeenCalledWith(
        'character:moved',
        expect.objectContaining({
          characterId: 'event_test',
          position: expect.any(Object)
        })
      );
    });
  });

  describe('cleanup', () => {
    test('destroys system cleanly', () => {
      const character = {
        id: 'cleanup_test',
        type: 'customer' as const,
        currentPos: { x: 1, y: 1 },
        targetPos: { x: 1, y: 1 },
        color: '#9b9b9b',
        speed: 1.0,
        maxIdleTime: 2000
      };

      movementSystem.addCharacter(character);
      movementSystem.start();
      
      expect(movementSystem.getCharacters()).toHaveLength(1);
      expect(movementSystem['updateInterval']).not.toBeNull();
      
      movementSystem.destroy();
      
      expect(movementSystem.getCharacters()).toHaveLength(0);
      expect(movementSystem['updateInterval']).toBeNull();
    });
  });
});
