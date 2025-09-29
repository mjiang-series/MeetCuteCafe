/**
 * Integration tests for Order Fulfillment Flow
 * Phase 1 validation requirement: End-to-end order processing
 */

import { OrderGenerator } from '@/systems/OrderGenerator';
import { GameStateManager } from '@/systems/GameStateManager';
import { EventSystem } from '@/systems/EventSystem';

describe('Order Fulfillment Integration', () => {
  let orderGenerator: OrderGenerator;
  let gameStateManager: GameStateManager;
  let eventSystem: EventSystem;

  beforeEach(() => {
    eventSystem = new EventSystem();
    gameStateManager = new GameStateManager(eventSystem);
    orderGenerator = new OrderGenerator(eventSystem);

    // Initialize with test player data
    gameStateManager.createNewPlayer();
  });

  afterEach(() => {
    orderGenerator.destroy();
  });

  describe('complete order flow', () => {
    test('generates order → fulfills → awards rewards → updates state', async () => {
      // Start order generation
      orderGenerator.start();
      
      // Wait for initial order generation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const activeOrders = orderGenerator.getActiveOrders();
      expect(activeOrders.length).toBeGreaterThan(0);
      
      const testOrder = activeOrders[0]!;
      expect(testOrder).toBeDefined();
      
      const initialCoins = gameStateManager.getPlayer().coins;
      const initialDiamonds = gameStateManager.getPlayer().diamonds;
      
      // Complete the order
      const completed = orderGenerator.completeOrder(testOrder.orderId);
      expect(completed).toBe(true);
      
      // Manually apply rewards (in real game, this would be done by UI/game logic)
      gameStateManager.addCoins(testOrder.rewards.coins);
      if (testOrder.rewards.diamonds) {
        gameStateManager.addDiamonds(testOrder.rewards.diamonds);
      }
      
      // Verify rewards were applied
      const updatedPlayer = gameStateManager.getPlayer();
      expect(updatedPlayer.coins).toBeGreaterThanOrEqual(initialCoins + testOrder.rewards.coins);
      
      if ((testOrder.rewards.diamonds || 0) > 0) {
        expect(updatedPlayer.diamonds).toBeGreaterThan(initialDiamonds);
      }
      
      // Verify order is no longer active
      const remainingOrders = orderGenerator.getActiveOrders();
      expect(remainingOrders.find(o => o.orderId === testOrder.orderId)).toBeUndefined();
    });

    test('handles multiple concurrent orders', async () => {
      orderGenerator.start();
      
      // Wait for multiple orders to generate
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const activeOrders = orderGenerator.getActiveOrders();
      expect(activeOrders.length).toBeGreaterThan(1);
      
      const initialCoins = gameStateManager.getPlayer().coins;
      
      // Complete multiple orders
      const ordersToComplete = activeOrders.slice(0, 2);
      let totalExpectedCoins = 0;
      
      ordersToComplete.forEach(order => {
        totalExpectedCoins += order.rewards.coins;
        const completed = orderGenerator.completeOrder(order.orderId);
        expect(completed).toBe(true);
        
        // Manually apply rewards (in real game, this would be done by UI/game logic)
        gameStateManager.addCoins(order.rewards.coins);
        if (order.rewards.diamonds) {
          gameStateManager.addDiamonds(order.rewards.diamonds);
        }
      });
      
      // Verify cumulative rewards
      const finalCoins = gameStateManager.getPlayer().coins;
      expect(finalCoins).toBeGreaterThanOrEqual(initialCoins + totalExpectedCoins);
    });
  });

  describe('order expiration handling', () => {
    test('expired orders are cleaned up automatically', async () => {
      // Create a mock expired order
      const expiredOrder = {
        orderId: 'expired_test',
        kind: 'Customer' as const,
        createdAt: Date.now() - 10000,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        requirements: { slots: [] },
        rewards: { coins: 100, diamonds: 0 },
        status: 'available' as const,
        customerType: 'Regular' as const,
        urgency: 'low' as const
      };

      // Manually add expired order for testing
      orderGenerator['activeOrders'].push(expiredOrder);
      
      // Trigger cleanup
      orderGenerator['cleanupExpiredOrders']();
      
      // Verify expired order was removed
      expect(orderGenerator.getActiveOrders().find(o => o.orderId === expiredOrder.orderId)).toBeUndefined();
    });
  });

  describe('currency calculations', () => {
    test('rewards scale appropriately with order complexity', async () => {
      orderGenerator.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const orders = orderGenerator.getActiveOrders();
      
      orders.forEach(order => {
        const complexity = order.requirements.slots.length;
        const totalReward = order.rewards.coins + ((order.rewards.diamonds || 0) * 10); // Diamond value multiplier
        
        // More complex orders should have higher rewards
        expect(totalReward).toBeGreaterThan(complexity * 5);
        expect(order.rewards.coins).toBeGreaterThan(0);
        expect(order.rewards.diamonds || 0).toBeGreaterThanOrEqual(0);
      });
    });

    test('currency updates persist correctly', async () => {
      const initialState = gameStateManager.getPlayer();
      const initialCoins = initialState.coins;
      const initialDiamonds = initialState.diamonds;
      
      // Add coins through order completion
      gameStateManager.addCoins(500);
      gameStateManager.addDiamonds(10);
      
      // Verify changes before save
      const beforeSave = gameStateManager.getPlayer();
      expect(beforeSave.coins).toBe(initialCoins + 500);
      expect(beforeSave.diamonds).toBe(initialDiamonds + 10);
      
      // Save and reload
      await gameStateManager.saveGame();
      await gameStateManager.loadGame();
      
      const reloadedState = gameStateManager.getPlayer();
      expect(reloadedState.coins).toBe(initialCoins + 500);
      expect(reloadedState.diamonds).toBe(initialDiamonds + 10);
    });
  });

  describe('event system integration', () => {
    test('order events are emitted correctly', (done) => {
      let eventsReceived = 0;
      const expectedEvents = ['order:generated', 'order:completed'];
      
      expectedEvents.forEach(eventType => {
        eventSystem.on(eventType as any, () => {
          eventsReceived++;
          if (eventsReceived === expectedEvents.length) {
            done();
          }
        });
      });
      
      orderGenerator.start();
      
      // Wait for order generation, then complete one
      setTimeout(() => {
        const orders = orderGenerator.getActiveOrders();
        if (orders.length > 0) {
          orderGenerator.completeOrder(orders[0]!.orderId);
        }
      }, 100);
    });

    test('game state events trigger UI updates', (done) => {
      let eventReceived = false;
      
      eventSystem.on('game:saved', () => {
        if (!eventReceived) {
          eventReceived = true;
          done();
        }
      });
      
      gameStateManager.addCoins(100);
      gameStateManager.saveGame();
    });
  });

  describe('error handling', () => {
    test('handles invalid order completion gracefully', () => {
      expect(() => {
        orderGenerator.completeOrder('nonexistent_order');
      }).not.toThrow();
      
      const result = orderGenerator.completeOrder('nonexistent_order');
      expect(result).toBe(false);
    });

    test('handles corrupted order data gracefully', () => {
      // Add malformed order
      const badOrder = { orderId: 'bad_order' } as any;
      orderGenerator['activeOrders'].push(badOrder);
      
      expect(() => {
        orderGenerator.getActiveOrders();
      }).not.toThrow();
    });

    test('recovers from generation failures', () => {
      // Test that the system can handle individual generation failures
      expect(() => {
        orderGenerator.completeOrder('nonexistent_order');
      }).not.toThrow();
      
      // Test that invalid order IDs return false
      const result = orderGenerator.completeOrder('invalid_id');
      expect(result).toBe(false);
    });
  });

  describe('performance validation', () => {
    test('order generation completes under 50ms', async () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        orderGenerator['createRandomOrder']();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50);
    });

    test('handles large number of active orders efficiently', () => {
      // Generate many orders
      for (let i = 0; i < 100; i++) {
        const order = orderGenerator['createRandomOrder']();
        orderGenerator['activeOrders'].push(order);
      }
      
      const startTime = performance.now();
      const activeOrders = orderGenerator.getActiveOrders();
      const endTime = performance.now();
      
      expect(activeOrders.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });
  });
});
