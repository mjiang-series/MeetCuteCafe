/**
 * Gacha System - Handle flavor pulls, banners, and pity mechanics
 * Based on Meet Cute Cafe Game Spec
 */

import type { EventSystem } from './EventSystem';
import type { GameStateManager } from './GameStateManager';
import type { 
  BannerDef, 
  BannerId, 
  GachaResult, 
  Rarity, 
  PlayerFlavor, 
  Affinity 
} from '@/models/GameTypes';

interface FlavorDef {
  flavorId: string;
  name: string;
  affinity: Affinity;
  rarity: Rarity;
  basePower: number;
  description: string;
}

export class GachaSystem {
  private eventSystem: EventSystem;
  private gameState: GameStateManager;
  private flavorPool: FlavorDef[] = [];
  private banners: Map<BannerId, BannerDef> = new Map();

  constructor(eventSystem: EventSystem, gameState: GameStateManager) {
    this.eventSystem = eventSystem;
    this.gameState = gameState;
    this.initializeFlavorPool();
    this.initializeBanners();
  }

  /**
   * Initialize the complete flavor pool for gacha
   */
  private initializeFlavorPool(): void {
    this.flavorPool = [
      // 3★ Flavors (70% rate)
      { flavorId: 'sweet_vanilla', name: 'Vanilla Delight', affinity: 'Sweet', rarity: '3★', basePower: 10, description: 'A classic sweet flavor that never goes out of style.' },
      { flavorId: 'sweet_honey', name: 'Golden Honey', affinity: 'Sweet', rarity: '3★', basePower: 12, description: 'Pure sweetness from nature\'s bounty.' },
      { flavorId: 'sweet_caramel', name: 'Buttery Caramel', affinity: 'Sweet', rarity: '3★', basePower: 11, description: 'Rich and creamy caramel goodness.' },
      
      { flavorId: 'salty_caramel', name: 'Salted Caramel', affinity: 'Salty', rarity: '3★', basePower: 10, description: 'The perfect balance of sweet and salty.' },
      { flavorId: 'salty_pretzel', name: 'Crunchy Pretzel', affinity: 'Salty', rarity: '3★', basePower: 11, description: 'Satisfying crunch with a salty finish.' },
      { flavorId: 'salty_cheese', name: 'Sharp Cheddar', affinity: 'Salty', rarity: '3★', basePower: 12, description: 'Bold and tangy cheese flavor.' },
      
      { flavorId: 'bitter_coffee', name: 'Dark Roast', affinity: 'Bitter', rarity: '3★', basePower: 10, description: 'Bold coffee with a bitter edge.' },
      { flavorId: 'bitter_cocoa', name: 'Pure Cocoa', affinity: 'Bitter', rarity: '3★', basePower: 11, description: 'Unsweetened chocolate intensity.' },
      { flavorId: 'bitter_tea', name: 'Earl Grey', affinity: 'Bitter', rarity: '3★', basePower: 12, description: 'Sophisticated tea with bergamot notes.' },
      
      { flavorId: 'spicy_cinnamon', name: 'Warm Cinnamon', affinity: 'Spicy', rarity: '3★', basePower: 10, description: 'Comforting warmth with a spicy kick.' },
      { flavorId: 'spicy_chili', name: 'Red Chili', affinity: 'Spicy', rarity: '3★', basePower: 11, description: 'Fiery heat that builds slowly.' },
      { flavorId: 'spicy_ginger', name: 'Fresh Ginger', affinity: 'Spicy', rarity: '3★', basePower: 12, description: 'Zesty ginger with a warming bite.' },
      
      { flavorId: 'fresh_mint', name: 'Cool Mint', affinity: 'Fresh', rarity: '3★', basePower: 10, description: 'Refreshing mint that awakens the senses.' },
      { flavorId: 'fresh_lemon', name: 'Zesty Lemon', affinity: 'Fresh', rarity: '3★', basePower: 11, description: 'Bright citrus burst of freshness.' },
      { flavorId: 'fresh_cucumber', name: 'Garden Cucumber', affinity: 'Fresh', rarity: '3★', basePower: 12, description: 'Clean and crisp vegetable freshness.' },

      // 4★ Flavors (27% rate)
      { flavorId: 'sweet_truffle', name: 'Chocolate Truffle', affinity: 'Sweet', rarity: '4★', basePower: 20, description: 'Luxurious chocolate with velvety texture.' },
      { flavorId: 'sweet_rose', name: 'Rose Petal', affinity: 'Sweet', rarity: '4★', basePower: 22, description: 'Delicate floral sweetness with romantic notes.' },
      
      { flavorId: 'salty_ocean', name: 'Sea Salt', affinity: 'Salty', rarity: '4★', basePower: 20, description: 'Pure ocean minerals with complex depth.' },
      { flavorId: 'salty_bacon', name: 'Smoky Bacon', affinity: 'Salty', rarity: '4★', basePower: 22, description: 'Rich umami with smoky undertones.' },
      
      { flavorId: 'bitter_espresso', name: 'Triple Espresso', affinity: 'Bitter', rarity: '4★', basePower: 20, description: 'Intense coffee concentrate with crema.' },
      { flavorId: 'bitter_dark_chocolate', name: 'Dark Chocolate 85%', affinity: 'Bitter', rarity: '4★', basePower: 22, description: 'Premium dark chocolate with complex notes.' },
      
      { flavorId: 'spicy_wasabi', name: 'Fresh Wasabi', affinity: 'Spicy', rarity: '4★', basePower: 20, description: 'Sharp heat that clears the mind.' },
      { flavorId: 'spicy_habanero', name: 'Habanero Fire', affinity: 'Spicy', rarity: '4★', basePower: 22, description: 'Fruity heat with serious intensity.' },
      
      { flavorId: 'fresh_eucalyptus', name: 'Eucalyptus Breeze', affinity: 'Fresh', rarity: '4★', basePower: 20, description: 'Cooling menthol with herbal complexity.' },
      { flavorId: 'fresh_lime', name: 'Key Lime', affinity: 'Fresh', rarity: '4★', basePower: 22, description: 'Tart citrus with tropical brightness.' },

      // 5★ Flavors (3% rate)
      { flavorId: 'sweet_ambrosia', name: 'Divine Ambrosia', affinity: 'Sweet', rarity: '5★', basePower: 40, description: 'The legendary flavor of the gods themselves.' },
      { flavorId: 'salty_umami', name: 'Perfect Umami', affinity: 'Salty', rarity: '5★', basePower: 40, description: 'The fifth taste in its purest form.' },
      { flavorId: 'bitter_phoenix', name: 'Phoenix Bitter', affinity: 'Bitter', rarity: '5★', basePower: 40, description: 'Reborn from ashes, this bitter transcends mortal taste.' },
      { flavorId: 'spicy_dragon', name: 'Dragon\'s Breath', affinity: 'Spicy', rarity: '5★', basePower: 40, description: 'Legendary heat that burns with ancient power.' },
      { flavorId: 'fresh_eternal', name: 'Eternal Spring', affinity: 'Fresh', rarity: '5★', basePower: 40, description: 'Timeless freshness that never fades.' },
    ];
  }

  /**
   * Initialize available banners
   */
  private initializeBanners(): void {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    // Standard Banner - Always available
    const standardBanner: BannerDef = {
      bannerId: 'standard',
      name: 'Standard Flavor Banner',
      startAt: now,
      endAt: now + (365 * 24 * 60 * 60 * 1000), // 1 year
      pool: this.createStandardPool(),
      pity: {
        count: 10,
        guarantees: '4★'
      },
      cost: {
        tickets: 1
      }
    };

    // Featured Banner - Rotates weekly
    const featuredBanner: BannerDef = {
      bannerId: 'featured',
      name: 'Featured Flavor Banner',
      startAt: now,
      endAt: now + oneWeek,
      pool: this.createFeaturedPool(),
      pity: {
        count: 60,
        guarantees: '5★'
      },
      cost: {
        tickets: 1
      }
    };

    this.banners.set('standard', standardBanner);
    this.banners.set('featured', featuredBanner);
  }

  /**
   * Create standard banner pool with base rates
   */
  private createStandardPool(): Array<{ flavorId: string; weight: number }> {
    const pool: Array<{ flavorId: string; weight: number }> = [];
    
    this.flavorPool.forEach(flavor => {
      let weight: number;
      switch (flavor.rarity) {
        case '3★': weight = 70; break;
        case '4★': weight = 27; break;
        case '5★': weight = 3; break;
        default: weight = 1;
      }
      pool.push({ flavorId: flavor.flavorId, weight });
    });

    return pool;
  }

  /**
   * Create featured banner pool with rate-up for 5★ flavors
   */
  private createFeaturedPool(): Array<{ flavorId: string; weight: number }> {
    const pool: Array<{ flavorId: string; weight: number }> = [];
    
    this.flavorPool.forEach(flavor => {
      let weight: number;
      switch (flavor.rarity) {
        case '3★': weight = 65; break; // Slightly reduced
        case '4★': weight = 27; break; // Same
        case '5★': weight = 8; break;  // Rate up!
        default: weight = 1;
      }
      pool.push({ flavorId: flavor.flavorId, weight });
    });

    return pool;
  }

  /**
   * Get available banners
   */
  public getAvailableBanners(): BannerDef[] {
    const now = Date.now();
    return Array.from(this.banners.values()).filter(
      banner => now >= banner.startAt && now <= banner.endAt
    );
  }

  /**
   * Get banner by ID
   */
  public getBanner(bannerId: BannerId): BannerDef | undefined {
    return this.banners.get(bannerId);
  }

  /**
   * Perform a single pull on a banner
   */
  public pullSingle(bannerId: BannerId): GachaResult | null {
    return this.pullMultiple(bannerId, 1);
  }

  /**
   * Perform a 10-pull on a banner
   */
  public pull10x(bannerId: BannerId): GachaResult | null {
    return this.pullMultiple(bannerId, 10);
  }

  /**
   * Perform multiple pulls on a banner
   */
  public pullMultiple(bannerId: BannerId, count: number): GachaResult | null {
    const banner = this.banners.get(bannerId);
    if (!banner) return null;

    const player = this.gameState.getPlayer();
    const totalCost = banner.cost.tickets * count;

    // Check if player has enough tickets, or diamonds for conversion
    if (player.tokens < totalCost) {
      // Try to convert diamonds to tickets (10 diamonds = 1 ticket)
      const diamondsNeeded = (totalCost - player.tokens) * 10;
      if (player.diamonds < diamondsNeeded) {
        return null;
      }
      
      // Convert diamonds to tickets
      this.gameState.addCurrency('diamonds', -diamondsNeeded);
      this.gameState.addCurrency('tokens', totalCost - player.tokens);
    }

    // Deduct tickets
    this.gameState.addCurrency('tokens', -totalCost);

    const pulls: GachaResult['pulls'] = [];
    let tokensGained = 0;
    let pityCounter = player.pity[bannerId] || 0;

    for (let i = 0; i < count; i++) {
      pityCounter++;
      
      // Check for pity guarantees
      let guaranteedRarity: Rarity | null = null;
      if (banner.pity) {
        if (pityCounter >= 60) {
          guaranteedRarity = '5★';
          pityCounter = 0;
        } else if (pityCounter >= 10 && pityCounter % 10 === 0) {
          guaranteedRarity = '4★';
        }
      }

      const pulledFlavor = this.rollFlavor(banner, guaranteedRarity);
      const isDuplicate = player.flavors.some(f => f.flavorId === pulledFlavor.flavorId);

      pulls.push({
        flavorId: pulledFlavor.flavorId,
        rarity: pulledFlavor.rarity,
        isDuplicate
      });

      // Handle duplicate conversion to tokens
      if (isDuplicate) {
        const tokenValue = this.getTokenValue(pulledFlavor.rarity);
        tokensGained += tokenValue;
        this.gameState.addCurrency('tokens', tokenValue);
      } else {
        // Add new flavor to player collection
        const playerFlavor: PlayerFlavor = {
          flavorId: pulledFlavor.flavorId,
          level: 1,
          acquiredAt: Date.now()
        };
        this.gameState.addFlavor(playerFlavor);
      }

      // Reset pity counter for 5★ pulls
      if (pulledFlavor.rarity === '5★') {
        pityCounter = 0;
      }
    }

    // Update pity counter
    player.pity[bannerId] = pityCounter;
    this.gameState.saveGame();

    // Emit telemetry event
    this.eventSystem.emit('telemetry:gacha_pull', {
      bannerId,
      pulls: count,
      diamonds: totalCost
    });

    return { pulls, tokensGained };
  }

  /**
   * Roll a single flavor from a banner
   */
  private rollFlavor(banner: BannerDef, guaranteedRarity?: Rarity | null): FlavorDef {
    let pool = banner.pool;

    // Filter pool by guaranteed rarity if specified
    if (guaranteedRarity) {
      const guaranteedFlavors = this.flavorPool.filter(f => f.rarity === guaranteedRarity);
      const guaranteedIds = guaranteedFlavors.map(f => f.flavorId);
      pool = banner.pool.filter(p => guaranteedIds.includes(p.flavorId));
    }

    // Calculate total weight
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    
    // Roll random number
    const roll = Math.random() * totalWeight;
    
    // Find the selected flavor
    let currentWeight = 0;
    for (const item of pool) {
      currentWeight += item.weight;
      if (roll <= currentWeight) {
        const flavor = this.flavorPool.find(f => f.flavorId === item.flavorId);
        if (flavor) return flavor;
      }
    }

    // Fallback to first flavor in pool (should never happen)
    const fallbackId = pool[0]?.flavorId;
    return this.flavorPool.find(f => f.flavorId === fallbackId) || this.flavorPool[0];
  }

  /**
   * Get token value for duplicate flavors
   */
  private getTokenValue(rarity: Rarity): number {
    switch (rarity) {
      case '3★': return 1;
      case '4★': return 5;
      case '5★': return 20;
      default: return 1;
    }
  }

  /**
   * Get flavor definition by ID
   */
  public getFlavorDef(flavorId: string): FlavorDef | undefined {
    return this.flavorPool.find(f => f.flavorId === flavorId);
  }

  /**
   * Get all flavor definitions
   */
  public getAllFlavorDefs(): FlavorDef[] {
    return [...this.flavorPool];
  }

  /**
   * Get pity counter for a banner
   */
  public getPityCounter(bannerId: BannerId): number {
    const player = this.gameState.getPlayer();
    return player.pity[bannerId] || 0;
  }
}
