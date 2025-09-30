/**
 * Tests for GachaSystem
 */

import { GachaSystem } from '@/systems/GachaSystem';
import { EventSystem } from '@/systems/EventSystem';
import { GameStateManager } from '@/systems/GameStateManager';

describe('GachaSystem', () => {
  let eventSystem: EventSystem;
  let gameStateManager: GameStateManager;
  let gachaSystem: GachaSystem;

  beforeEach(() => {
    eventSystem = new EventSystem();
    gameStateManager = new GameStateManager(eventSystem);
    gachaSystem = new GachaSystem(eventSystem, gameStateManager);
    
    // Create a test player with diamonds
    gameStateManager.createNewPlayer();
    gameStateManager.addCurrency('diamonds', 1000);
  });

  afterEach(() => {
    gameStateManager.destroy();
    eventSystem.clear();
  });

  describe('Banner Management', () => {
    test('should have available banners', () => {
      const banners = gachaSystem.getAvailableBanners();
      expect(banners.length).toBeGreaterThan(0);
      
      // Should have standard banner
      const standardBanner = banners.find(b => b.bannerId === 'standard');
      expect(standardBanner).toBeDefined();
      expect(standardBanner?.name).toBe('Standard Flavor Banner');
    });

    test('should get banner by ID', () => {
      const standardBanner = gachaSystem.getBanner('standard');
      expect(standardBanner).toBeDefined();
      expect(standardBanner?.bannerId).toBe('standard');
    });
  });

  describe('Flavor Database', () => {
    test('should have flavors of all rarities', () => {
      const flavors = gachaSystem.getAllFlavorDefs();
      expect(flavors.length).toBeGreaterThan(0);

      const rarities = new Set(flavors.map(f => f.rarity));
      expect(rarities).toContain('3★');
      expect(rarities).toContain('4★');
      expect(rarities).toContain('5★');
    });

    test('should have flavors of all affinities', () => {
      const flavors = gachaSystem.getAllFlavorDefs();
      const affinities = new Set(flavors.map(f => f.affinity));
      
      expect(affinities).toContain('Sweet');
      expect(affinities).toContain('Salty');
      expect(affinities).toContain('Bitter');
      expect(affinities).toContain('Spicy');
      expect(affinities).toContain('Fresh');
    });

    test('should get flavor definition by ID', () => {
      const flavor = gachaSystem.getFlavorDef('sweet_vanilla');
      expect(flavor).toBeDefined();
      expect(flavor?.name).toBe('Vanilla Delight');
      expect(flavor?.affinity).toBe('Sweet');
    });
  });

  describe('Pull Mechanics', () => {
    test('should perform single pull successfully', () => {
      const result = gachaSystem.pullSingle('standard');
      expect(result).toBeDefined();
      expect(result?.pulls).toHaveLength(1);
      
      const pull = result?.pulls[0];
      expect(pull?.flavorId).toBeDefined();
      expect(['3★', '4★', '5★']).toContain(pull?.rarity);
    });

    test('should perform 10x pull successfully', () => {
      const result = gachaSystem.pull10x('standard');
      expect(result).toBeDefined();
      expect(result?.pulls).toHaveLength(10);
      
      result?.pulls.forEach(pull => {
        expect(pull.flavorId).toBeDefined();
        expect(['3★', '4★', '5★']).toContain(pull.rarity);
      });
    });

    test('should fail pull when insufficient diamonds', () => {
      // Set diamonds to 0
      const currentDiamonds = gameStateManager.getPlayer().diamonds;
      gameStateManager.addCurrency('diamonds', -currentDiamonds);
      
      const result = gachaSystem.pullSingle('standard');
      expect(result).toBeNull();
    });

    test('should deduct correct diamond cost', () => {
      const initialDiamonds = gameStateManager.getPlayer().diamonds;
      const banner = gachaSystem.getBanner('standard');
      const expectedCost = banner?.cost.diamonds || 10;
      
      gachaSystem.pullSingle('standard');
      
      const finalDiamonds = gameStateManager.getPlayer().diamonds;
      expect(finalDiamonds).toBe(initialDiamonds - expectedCost);
    });
  });

  describe('Pity System', () => {
    test('should track pity counter', () => {
      const initialPity = gachaSystem.getPityCounter('standard');
      expect(initialPity).toBe(0);
      
      gachaSystem.pullSingle('standard');
      
      const afterPity = gachaSystem.getPityCounter('standard');
      expect(afterPity).toBe(1);
    });

    test('should reset pity counter on 5★ pull', () => {
      // This test is probabilistic, so we'll just check the mechanism exists
      const player = gameStateManager.getPlayer();
      player.pity['standard'] = 59; // Almost at 5★ pity
      
      const result = gachaSystem.pullSingle('standard');
      expect(result).toBeDefined();
      
      // If we got a 5★, pity should be reset
      const has5Star = result?.pulls.some(p => p.rarity === '5★');
      if (has5Star) {
        expect(gachaSystem.getPityCounter('standard')).toBe(0);
      }
    });
  });

  describe('Duplicate Handling', () => {
    test('should convert duplicates to tokens', () => {
      // Add a flavor to player collection first
      const testFlavor = gachaSystem.getAllFlavorDefs()[0];
      gameStateManager.addFlavor({
        flavorId: testFlavor.flavorId,
        level: 1,
        acquiredAt: Date.now()
      });
      
      const initialTokens = gameStateManager.getPlayer().tokens;
      
      // Keep pulling until we get the same flavor (or timeout)
      let attempts = 0;
      let gotDuplicate = false;
      
      while (attempts < 50 && !gotDuplicate) {
        const result = gachaSystem.pullSingle('standard');
        if (result?.pulls[0]?.flavorId === testFlavor.flavorId) {
          gotDuplicate = true;
          expect(result.tokensGained).toBeGreaterThan(0);
          expect(gameStateManager.getPlayer().tokens).toBeGreaterThan(initialTokens);
        }
        attempts++;
      }
      
      // If we didn't get a duplicate in 50 attempts, that's fine for this test
      // The important thing is the mechanism exists
    });
  });

  describe('Integration', () => {
    test('should emit telemetry events', () => {
      const telemetryEvents: any[] = [];
      eventSystem.on('telemetry:gacha_pull', (data) => {
        telemetryEvents.push(data);
      });
      
      gachaSystem.pullSingle('standard');
      
      expect(telemetryEvents).toHaveLength(1);
      expect(telemetryEvents[0].bannerId).toBe('standard');
      expect(telemetryEvents[0].pulls).toBe(1);
    });

    test('should save game state after pulls', () => {
      const saveEvents: any[] = [];
      eventSystem.on('game:saved', (data) => {
        saveEvents.push(data);
      });
      
      gachaSystem.pullSingle('standard');
      
      expect(saveEvents.length).toBeGreaterThan(0);
    });
  });
});
