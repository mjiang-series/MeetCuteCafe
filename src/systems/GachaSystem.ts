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
  npcId: NpcId; // Primary NPC for this story moment
  storyTagline: string; // Reader-insert story tagline
  previewAsset?: string; // Preview image/video path
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
   * Flavors are NPC-centric story moments with taste profiles
   */
  private initializeFlavorPool(): void {
    // Helper to distribute NPCs across flavors and get correct preview asset
    const npcs: NpcId[] = ['aria', 'kai', 'elias'];
    let npcIndex = 0;
    const getNpc = () => {
      const npc = npcs[npcIndex % npcs.length];
      npcIndex++;
      return npc;
    };
    const getPreviewAsset = (npcId: NpcId, rarity: Rarity) => {
      if (rarity === '5★') {
        return `/art/npc/${npcId}/${npcId}_flavor_preview_5star.mp4`;
      }
      return `/art/npc/${npcId}/${npcId}_flavor_preview_placeholder.png`;
    };

    // Create flavors with proper NPC distribution and preview assets
    const createFlavor = (flavorId: string, name: string, affinity: Affinity, rarity: Rarity, basePower: number, description: string, storyTagline: string): FlavorDef => {
      const npcId = getNpc();
      return {
        flavorId,
        name,
        affinity,
        rarity,
        basePower,
        description,
        npcId,
        storyTagline,
        previewAsset: getPreviewAsset(npcId, rarity)
      };
    };

    this.flavorPool = [
      // 3★ Flavors (70% rate) - Common story moments
      createFlavor('sweet_vanilla', 'Vanilla Delight', 'Sweet', '3★', 10, 'A classic sweet flavor that never goes out of style.', 'A sweet afternoon sharing desserts at the cafe'),
      createFlavor('sweet_honey', 'Golden Honey', 'Sweet', '3★', 12, 'Pure sweetness from nature\'s bounty.', 'Discovering honey tea together on a quiet morning'),
      createFlavor('sweet_caramel', 'Buttery Caramel', 'Sweet', '3★', 11, 'Rich and creamy caramel goodness.', 'Laughing over spilled caramel sauce'),
      
      createFlavor('salty_caramel', 'Salted Caramel', 'Salty', '3★', 10, 'The perfect balance of sweet and salty.', 'Finding the perfect sweet-salty balance together'),
      createFlavor('salty_pretzel', 'Crunchy Pretzel', 'Salty', '3★', 11, 'Satisfying crunch with a salty finish.', 'Sharing pretzels while people-watching'),
      createFlavor('salty_cheese', 'Sharp Cheddar', 'Salty', '3★', 12, 'Bold and tangy cheese flavor.', 'A heated debate over the best cheese'),
      
      createFlavor('bitter_coffee', 'Dark Roast', 'Bitter', '3★', 10, 'Bold coffee with a bitter edge.', 'Late night conversations over bitter coffee'),
      createFlavor('bitter_cocoa', 'Pure Cocoa', 'Bitter', '3★', 11, 'Unsweetened chocolate intensity.', 'The bittersweet taste of honesty'),
      createFlavor('bitter_tea', 'Earl Grey', 'Bitter', '3★', 12, 'Sophisticated tea with bergamot notes.', 'Afternoon tea and difficult truths'),
      
      createFlavor('spicy_cinnamon', 'Warm Cinnamon', 'Spicy', '3★', 10, 'Comforting warmth with a spicy kick.', 'Warming up together on a cold day'),
      createFlavor('spicy_chili', 'Red Chili', 'Spicy', '3★', 11, 'Fiery heat that builds slowly.', 'A spicy challenge turns into something more'),
      createFlavor('spicy_ginger', 'Fresh Ginger', 'Spicy', '3★', 12, 'Zesty ginger with a warming bite.', 'Their presence makes your heart race'),
      
      createFlavor('fresh_mint', 'Cool Mint', 'Fresh', '3★', 10, 'Refreshing mint that awakens the senses.', 'A refreshing start to something new'),
      createFlavor('fresh_lemon', 'Zesty Lemon', 'Fresh', '3★', 11, 'Bright citrus burst of freshness.', 'Bright laughter on a sunny day'),
      createFlavor('fresh_cucumber', 'Garden Cucumber', 'Fresh', '3★', 12, 'Clean and crisp vegetable freshness.', 'Finding peace in the garden together'),

      // 4★ Flavors (27% rate) - Memorable story moments
      createFlavor('sweet_truffle', 'Chocolate Truffle', 'Sweet', '4★', 20, 'Luxurious chocolate with velvety texture.', 'An indulgent moment you\'ll never forget'),
      createFlavor('sweet_rose', 'Rose Petal', 'Sweet', '4★', 22, 'Delicate floral sweetness with romantic notes.', 'When words fail, roses speak'),
      
      createFlavor('salty_ocean', 'Sea Salt', 'Salty', '4★', 20, 'Pure ocean minerals with complex depth.', 'The taste of tears and truth by the sea'),
      createFlavor('salty_bacon', 'Smoky Bacon', 'Salty', '4★', 22, 'Rich umami with smoky undertones.', 'Sunday breakfast becomes a tradition'),
      
      createFlavor('bitter_espresso', 'Triple Espresso', 'Bitter', '4★', 20, 'Intense coffee concentrate with crema.', 'All-nighter confessions and revelations'),
      createFlavor('bitter_dark_chocolate', 'Dark Chocolate 85%', 'Bitter', '4★', 22, 'Premium dark chocolate with complex notes.', 'Complex feelings wrapped in darkness'),
      
      createFlavor('spicy_wasabi', 'Fresh Wasabi', 'Spicy', '4★', 20, 'Sharp heat that clears the mind.', 'A sharp moment of clarity changes everything'),
      createFlavor('spicy_habanero', 'Habanero Fire', 'Spicy', '4★', 22, 'Fruity heat with serious intensity.', 'Passion burns hot and bright'),
      
      createFlavor('fresh_eucalyptus', 'Eucalyptus Breeze', 'Fresh', '4★', 20, 'Cooling menthol with herbal complexity.', 'A healing moment in the cafe garden'),
      createFlavor('fresh_lime', 'Key Lime', 'Fresh', '4★', 22, 'Tart citrus with tropical brightness.', 'Tart words hide sweet feelings'),

      // 5★ Flavors (3% rate) - Legendary story moments
      { flavorId: 'sweet_ambrosia', name: 'Divine Ambrosia', affinity: 'Sweet', rarity: '5★', basePower: 40, description: 'The legendary flavor of the gods themselves.', npcId: 'aria', storyTagline: 'The moment everything changes forever', previewAsset: getPreviewAsset('aria', '5★') },
      { flavorId: 'salty_umami', name: 'Perfect Umami', affinity: 'Salty', rarity: '5★', basePower: 40, description: 'The fifth taste in its purest form.', npcId: 'kai', storyTagline: 'Finding what was always meant to be', previewAsset: getPreviewAsset('kai', '5★') },
      { flavorId: 'bitter_phoenix', name: 'Phoenix Bitter', affinity: 'Bitter', rarity: '5★', basePower: 40, description: 'Reborn from ashes, this bitter transcends mortal taste.', npcId: 'elias', storyTagline: 'Rising from the ashes together', previewAsset: getPreviewAsset('elias', '5★') },
      { flavorId: 'spicy_dragon', name: 'Dragon\'s Breath', affinity: 'Spicy', rarity: '5★', basePower: 40, description: 'Legendary heat that burns with ancient power.', npcId: 'aria', storyTagline: 'A love that burns eternal', previewAsset: getPreviewAsset('aria', '5★') },
      { flavorId: 'fresh_eternal', name: 'Eternal Spring', affinity: 'Fresh', rarity: '5★', basePower: 40, description: 'Timeless freshness that never fades.', npcId: 'kai', storyTagline: 'A promise that transcends time', previewAsset: getPreviewAsset('kai', '5★') },
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
