/**
 * Order Generator - Creates procedural customer orders
 */

import type { OrderBase, Affinity, OrderKind } from '@/models/GameTypes';
import type { EventSystem } from './EventSystem';
import { NpcId } from '@/models/GameTypes';

export interface OrderGeneratorConfig {
  baseOrdersPerHour: number;
  maxActiveOrders: number;
  difficultyScaling: number;
  rewardMultiplier: number;
}

export class OrderGenerator {
  private eventSystem: EventSystem;
  private config: OrderGeneratorConfig;
  private activeOrders: OrderBase[] = [];
  private orderIdCounter = 1;
  private generationInterval: number | null = null;

  constructor(eventSystem: EventSystem, config?: Partial<OrderGeneratorConfig>) {
    this.eventSystem = eventSystem;
    this.config = {
      baseOrdersPerHour: 12, // 1 order every 5 minutes base rate
      maxActiveOrders: 8,
      difficultyScaling: 1.1, // Increases over time
      rewardMultiplier: 1.0,
      ...config
    };
  }

  /**
   * Start generating orders
   */
  start(): void {
    if (this.generationInterval) return;

    // Calculate interval in milliseconds
    const intervalMs = (60 * 60 * 1000) / this.config.baseOrdersPerHour;
    
    this.generationInterval = window.setInterval(() => {
      this.generateOrder();
    }, intervalMs);

    // Generate initial orders
    this.generateInitialOrders();
  }

  /**
   * Stop generating orders
   */
  stop(): void {
    if (this.generationInterval) {
      window.clearInterval(this.generationInterval);
      this.generationInterval = null;
    }
  }

  /**
   * Generate initial batch of orders
   */
  private generateInitialOrders(): void {
    const initialCount = Math.min(4, this.config.maxActiveOrders);
    for (let i = 0; i < initialCount; i++) {
      this.generateOrder();
    }
    
    // Generate initial NPC orders
    this.generateNPCOrders();
  }

  /**
   * Generate NPC-specific orders that reward memories
   */
  private generateNPCOrders(): void {
    const npcs: NpcId[] = ['aria', 'kai', 'elias'];
    
    npcs.forEach(npcId => {
      // Generate an NPC order with 30% chance
      if (Math.random() < 0.3) {
        this.generateNPCOrder(npcId);
      }
    });
  }

  /**
   * Generate a specific NPC order
   */
  private generateNPCOrder(npcId: NpcId): void {
    if (this.activeOrders.length >= this.config.maxActiveOrders) {
      return;
    }

    const now = Date.now();
    const baseExpiryTime = 4 * 60 * 60 * 1000; // 4 hours
    const expiryVariance = (Math.random() - 0.5) * 2 * 60 * 60 * 1000; // ±2 hours
    
    const complexity = this.determineNPCOrderComplexity(npcId);
    const requirements = this.generateNPCRequirements(npcId, complexity);
    const rewards = this.calculateNPCRewards(npcId, complexity, requirements);

    const order: OrderBase & { npcId: NpcId } = {
      orderId: `npc_${npcId}_${this.orderIdCounter++}`,
      kind: 'NPC' as OrderKind,
      createdAt: now,
      expiresAt: now + baseExpiryTime + expiryVariance,
      requirements,
      rewards,
      status: 'available',
      customerType: this.getNPCDisplayName(npcId),
      urgency: this.determineUrgency(expiryVariance),
      npcId // Add NPC ID for memory generation
    };

    this.activeOrders.push(order);
    this.eventSystem.emit('order:generated', { order });
    
    console.log(`💝 ${this.getNPCDisplayName(npcId)} placed a special order!`);
  }

  /**
   * Determine complexity for NPC orders (generally higher than regular orders)
   */
  private determineNPCOrderComplexity(_npcId: NpcId): number {
    // NPC orders are generally more complex and rewarding
    const weights = [10, 30, 40, 15, 5]; // Favor medium-high complexity
    const random = Math.random() * 100;
    
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i]!;
      if (random <= cumulative) {
        return i + 1;
      }
    }
    return 3; // Default to medium complexity
  }

  /**
   * Generate requirements based on NPC preferences
   */
  private generateNPCRequirements(npcId: NpcId, complexity: number): { slots: Array<{ affinity: Affinity; minLevel?: number }> } {
    const npcPreferences = this.getNPCPreferences(npcId);
    const slotCount = Math.min(complexity + 1, 5); // NPC orders can be more complex
    
    const slots = [];
    for (let i = 0; i < slotCount; i++) {
      const affinity = npcPreferences[Math.floor(Math.random() * npcPreferences.length)]!;
      slots.push({
        affinity,
        minLevel: complexity >= 3 ? 2 : 1
      });
    }
    
    return { slots };
  }

  /**
   * Calculate rewards for NPC orders (includes memory generation)
   */
  private calculateNPCRewards(_npcId: NpcId, complexity: number, requirements: { slots: Array<{ affinity: Affinity; minLevel?: number }> }): { coins: number; diamonds?: number; memory?: boolean } {
    const baseCoins = 50; // Higher base than regular orders
    const complexityBonus = complexity * 25;
    const slotBonus = requirements.slots.length * 15;
    
    const totalCoins = Math.floor(baseCoins + complexityBonus + slotBonus);
    
    const rewards: { coins: number; diamonds?: number; memory?: boolean } = { 
      coins: totalCoins,
      memory: true // NPC orders always generate memories
    };
    
    // Higher chance for diamonds on NPC orders
    if (complexity >= 3 && Math.random() < 0.6) {
      rewards.diamonds = Math.floor(complexity * 3 + Math.random() * 8);
    }
    
    return rewards;
  }

  /**
   * Get NPC preferences for order generation
   */
  private getNPCPreferences(npcId: NpcId): Affinity[] {
    const preferences: Record<NpcId, Affinity[]> = {
      aria: ['Sweet', 'Floral', 'Fruity'],
      kai: ['Bitter', 'Earthy', 'Complex'],
      elias: ['Spicy', 'Bold', 'Exotic']
    };
    
    return preferences[npcId] || ['Sweet', 'Bitter'];
  }

  /**
   * Get display name for NPC
   */
  private getNPCDisplayName(npcId: NpcId): string {
    const names: Record<NpcId, string> = {
      aria: 'Aria',
      kai: 'Kai', 
      elias: 'Elias'
    };
    
    return names[npcId] || npcId;
  }

  /**
   * Generate a single order
   */
  private generateOrder(): void {
    if (this.activeOrders.length >= this.config.maxActiveOrders) {
      return;
    }

    const order = this.createRandomOrder();
    this.activeOrders.push(order);
    
    this.eventSystem.emit('order:generated', { order });
  }

  /**
   * Create a random customer order
   */
  private createRandomOrder(): OrderBase {
    const now = Date.now();
    const baseExpiryTime = 4 * 60 * 60 * 1000; // 4 hours base
    const expiryVariance = Math.random() * 2 * 60 * 60 * 1000; // ±2 hours
    
    const complexity = this.determineOrderComplexity();
    const requirements = this.generateRequirements(complexity);
    const rewards = this.calculateRewards(complexity, requirements);

    return {
      orderId: `customer_${this.orderIdCounter++}`,
      kind: 'Customer' as OrderKind,
      createdAt: now,
      expiresAt: now + baseExpiryTime + expiryVariance,
      requirements,
      rewards,
      status: 'available',
      customerType: this.selectCustomerType(),
      urgency: this.determineUrgency(expiryVariance)
    };
  }

  /**
   * Determine order complexity (1-5)
   */
  private determineOrderComplexity(): number {
    const weights = [40, 30, 20, 8, 2]; // Favor simpler orders
    const random = Math.random() * 100;
    
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i]!;
      if (random <= cumulative) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Generate order requirements based on complexity
   */
  private generateRequirements(complexity: number): { slots: Array<{ affinity: Affinity; minLevel?: number }> } {
    const affinities: Affinity[] = ['Sweet', 'Salty', 'Bitter', 'Spicy', 'Fresh'];
    const slots: Array<{ affinity: Affinity; minLevel?: number }> = [];
    
    // Number of slots based on complexity
    const slotCount = Math.min(complexity, 3);
    
    for (let i = 0; i < slotCount; i++) {
      const affinity = affinities[Math.floor(Math.random() * affinities.length)]!;
      const slot: { affinity: Affinity; minLevel?: number } = { affinity };
      
      // Higher complexity orders may require higher level flavors
      if (complexity >= 3 && Math.random() < 0.4) {
        slot.minLevel = Math.floor(Math.random() * 3) + 2; // Level 2-4
      }
      
      slots.push(slot);
    }
    
    return { slots };
  }

  /**
   * Calculate rewards based on complexity and requirements
   */
  private calculateRewards(complexity: number, requirements: { slots: Array<{ affinity: Affinity; minLevel?: number }> }): { coins: number; diamonds?: number } {
    const baseCoins = 30;
    const complexityBonus = complexity * 15;
    
    // Level requirement bonuses
    const levelBonus = requirements.slots.reduce((bonus, slot) => {
      return bonus + (slot.minLevel ? (slot.minLevel - 1) * 10 : 0);
    }, 0);
    
    const totalCoins = Math.floor((baseCoins + complexityBonus + levelBonus) * this.config.rewardMultiplier);
    
    const rewards: { coins: number; diamonds?: number } = { coins: totalCoins };
    
    // Chance for diamond rewards on complex orders
    if (complexity >= 4 && Math.random() < 0.3) {
      rewards.diamonds = Math.floor(complexity * 2 + Math.random() * 5);
    }
    
    return rewards;
  }

  /**
   * Select customer type for variety
   */
  private selectCustomerType(): string {
    const types = [
      'Regular Customer',
      'Coffee Enthusiast',
      'Sweet Tooth',
      'Adventurous Eater',
      'Health Conscious',
      'Busy Professional',
      'Student',
      'Food Blogger'
    ];
    
    return types[Math.floor(Math.random() * types.length)]!;
  }

  /**
   * Determine urgency based on expiry variance
   */
  private determineUrgency(expiryVariance: number): 'low' | 'medium' | 'high' {
    if (expiryVariance < -1 * 60 * 60 * 1000) return 'high'; // Less than 3 hours
    if (expiryVariance < 0) return 'medium'; // Less than 4 hours
    return 'low'; // 4+ hours
  }

  /**
   * Complete an order
   */
  completeOrder(orderId: string): boolean {
    const orderIndex = this.activeOrders.findIndex(o => o.orderId === orderId);
    if (orderIndex === -1) return false;

    const order = this.activeOrders[orderIndex];
    this.activeOrders.splice(orderIndex, 1);
    
    this.eventSystem.emit('order:completed', { order });
    return true;
  }

  /**
   * Remove expired orders
   */
  cleanupExpiredOrders(): void {
    const now = Date.now();
    const expiredOrders = this.activeOrders.filter(o => o.expiresAt < now);
    
    expiredOrders.forEach(order => {
      this.eventSystem.emit('order:expired', { order });
    });
    
    this.activeOrders = this.activeOrders.filter(o => o.expiresAt >= now);
  }

  /**
   * Get all active orders
   */
  getActiveOrders(): OrderBase[] {
    return [...this.activeOrders];
  }

  /**
   * Get order statistics
   */
  getStats(): {
    activeCount: number;
    maxActive: number;
    generationRate: number;
    averageComplexity: number;
  } {
    const totalComplexity = this.activeOrders.reduce((sum, order) => {
      return sum + order.requirements.slots.length;
    }, 0);
    
    return {
      activeCount: this.activeOrders.length,
      maxActive: this.config.maxActiveOrders,
      generationRate: this.config.baseOrdersPerHour,
      averageComplexity: this.activeOrders.length > 0 ? totalComplexity / this.activeOrders.length : 0
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OrderGeneratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart with new config if currently running
    if (this.generationInterval) {
      this.stop();
      this.start();
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.activeOrders = [];
  }
}
