/**
 * Unit tests for GameStateManager
 */

import { GameStateManager } from '@/systems/GameStateManager';
import { EventSystem } from '@/systems/EventSystem';

describe('GameStateManager', () => {
  let gameStateManager: GameStateManager;
  let eventSystem: EventSystem;

  beforeEach(() => {
    eventSystem = new EventSystem();
    gameStateManager = new GameStateManager(eventSystem);
  });

  afterEach(() => {
    gameStateManager.destroy();
    eventSystem.clear();
  });

  describe('player creation', () => {
    test('should create new player with correct initial values', () => {
      const player = gameStateManager.createNewPlayer();

      expect(player.playerId).toBeDefined();
      expect(player.coins).toBe(100);
      expect(player.diamonds).toBe(50);
      expect(player.consumables.sugar).toBe(10);
      expect(player.npc.aria.bondXp).toBe(0);
      expect(player.npc.kai.bondXp).toBe(0);
      expect(player.npc.elias.bondXp).toBe(0);
    });

    test('should emit game:loaded event when player created', () => {
      const mockListener = jest.fn();
      eventSystem.on('game:loaded', mockListener);

      const player = gameStateManager.createNewPlayer();

      expect(mockListener).toHaveBeenCalledWith({ playerId: player.playerId });
    });
  });

  describe('game persistence', () => {
    test('should save and load player data', async () => {
      const originalPlayer = gameStateManager.createNewPlayer();
      originalPlayer.coins = 500;

      gameStateManager.updatePlayer({ coins: 500 });

      // Create new instance to test loading
      const newGameState = new GameStateManager(eventSystem);
      const loadedPlayer = await newGameState.loadGame();

      expect(loadedPlayer.playerId).toBe(originalPlayer.playerId);
      expect(loadedPlayer.coins).toBe(500);

      newGameState.destroy();
    });

    test('should create new player if no save data exists', async () => {
      // Clear localStorage
      localStorage.clear();

      const player = await gameStateManager.loadGame();

      expect(player.playerId).toBeDefined();
      expect(player.coins).toBe(100); // Initial coins
    });

    test('should emit game:saved event when saving', () => {
      const mockListener = jest.fn();
      eventSystem.on('game:saved', mockListener);

      gameStateManager.createNewPlayer();

      expect(mockListener).toHaveBeenCalled();
    });
  });

  describe('currency management', () => {
    beforeEach(() => {
      gameStateManager.createNewPlayer();
    });

    test('should add coins correctly', () => {
      const mockListener = jest.fn();
      eventSystem.on('header:update_currency', mockListener);

      gameStateManager.addCoins(50);

      const player = gameStateManager.getPlayer();
      expect(player.coins).toBe(150); // 100 initial + 50 added
      expect(mockListener).toHaveBeenCalledWith({ currency: 'coins', value: 150 });
    });

    test('should spend coins if sufficient balance', () => {
      const result = gameStateManager.spendCoins(50);

      expect(result).toBe(true);
      const player = gameStateManager.getPlayer();
      expect(player.coins).toBe(50); // 100 initial - 50 spent
    });

    test('should not spend coins if insufficient balance', () => {
      const result = gameStateManager.spendCoins(150);

      expect(result).toBe(false);
      const player = gameStateManager.getPlayer();
      expect(player.coins).toBe(100); // Unchanged
    });

    test('should add diamonds correctly', () => {
      gameStateManager.addDiamonds(25);

      const player = gameStateManager.getPlayer();
      expect(player.diamonds).toBe(75); // 50 initial + 25 added
    });

    test('should spend diamonds if sufficient balance', () => {
      const result = gameStateManager.spendDiamonds(30);

      expect(result).toBe(true);
      const player = gameStateManager.getPlayer();
      expect(player.diamonds).toBe(20); // 50 initial - 30 spent
    });
  });

  describe('NPC management', () => {
    beforeEach(() => {
      gameStateManager.createNewPlayer();
    });

    test('should get NPC data correctly', () => {
      const ariaNpc = gameStateManager.getNPC('aria');

      expect(ariaNpc.npcId).toBe('aria');
      expect(ariaNpc.bondXp).toBe(0);
      expect(ariaNpc.level).toBe(1);
    });

    test('should add bond XP correctly', () => {
      const mockBondListener = jest.fn();
      eventSystem.on('npc:bond_increased', mockBondListener);

      gameStateManager.addBondXP('aria', 25);

      const ariaNpc = gameStateManager.getNPC('aria');
      expect(ariaNpc.bondXp).toBe(25);
      expect(mockBondListener).toHaveBeenCalledWith({ npcId: 'aria', points: 25 });
    });

    test('should level up NPC when reaching threshold', () => {
      const mockMilestoneListener = jest.fn();
      eventSystem.on('npc:milestone_reached', mockMilestoneListener);

      gameStateManager.addBondXP('aria', 100); // Should trigger level up

      const ariaNpc = gameStateManager.getNPC('aria');
      expect(ariaNpc.level).toBe(2);
      expect(mockMilestoneListener).toHaveBeenCalledWith({ npcId: 'aria', level: 2 });
    });
  });

  describe('memory management', () => {
    beforeEach(() => {
      gameStateManager.createNewPlayer();
    });

    test('should add memory correctly', () => {
      const mockMemoryListener = jest.fn();
      eventSystem.on('memory:created', mockMemoryListener);

      const memory = {
        memoryId: 'test-memory',
        npcId: 'aria' as const,
        createdAt: Date.now(),
        keyframeId: 'test-keyframe',
        summary: 'Test memory',
        format: 'Drabble' as const,
        unread: true,
      };

      gameStateManager.addMemory(memory);

      const player = gameStateManager.getPlayer();
      expect(player.journal.entries).toHaveLength(1);
      expect(player.journal.entries[0]).toEqual(memory);
      expect(mockMemoryListener).toHaveBeenCalledWith({ memory });
    });

    test('should get memory by ID', () => {
      const memory = {
        memoryId: 'test-memory',
        npcId: 'aria' as const,
        createdAt: Date.now(),
        keyframeId: 'test-keyframe',
        summary: 'Test memory',
        format: 'Drabble' as const,
        unread: true,
      };

      gameStateManager.addMemory(memory);
      const retrieved = gameStateManager.getMemory('test-memory');

      expect(retrieved).toEqual(memory);
    });

    test('should mark memory as viewed', () => {
      const mockViewedListener = jest.fn();
      eventSystem.on('memory:viewed', mockViewedListener);

      const memory = {
        memoryId: 'test-memory',
        npcId: 'aria' as const,
        createdAt: Date.now(),
        keyframeId: 'test-keyframe',
        summary: 'Test memory',
        format: 'Drabble' as const,
        unread: true,
      };

      gameStateManager.addMemory(memory);
      gameStateManager.markMemoryAsViewed('test-memory');

      const retrieved = gameStateManager.getMemory('test-memory');
      expect(retrieved?.unread).toBe(false);
      expect(mockViewedListener).toHaveBeenCalledWith({ memoryId: 'test-memory' });
    });
  });

  describe('error handling', () => {
    test('should handle corrupted save data gracefully', async () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('meet-cute-cafe-save', 'invalid-json');

      const mockErrorListener = jest.fn();
      eventSystem.on('game:error', mockErrorListener);

      const player = await gameStateManager.loadGame();

      // Should create new player instead of crashing
      expect(player.playerId).toBeDefined();
      expect(player.coins).toBe(100);
      expect(mockErrorListener).toHaveBeenCalled();
    });

    test('should throw error when accessing player before loading', () => {
      const freshGameState = new GameStateManager(eventSystem);

      expect(() => {
        freshGameState.getPlayer();
      }).toThrow('Player not loaded');

      freshGameState.destroy();
    });
  });
});
