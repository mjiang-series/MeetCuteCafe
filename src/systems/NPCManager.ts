/**
 * NPCManager - Manages NPC data, relationships, and interactions
 * Phase 2: Romance Foundation
 */

import { EventSystem } from './EventSystem';
import { GameStateManager } from './GameStateManager';
import { NpcId } from '@/models/GameTypes';
import { getNpcPortraitPath } from '@/utils/AssetPaths';

export interface NPCData {
  id: NpcId;
  name: string;
  portraitPath: string;
  cinematicPath: string;
  personality: {
    traits: string[];
    favoriteAffinities: string[];
    description: string;
  };
  bondLevel: number;
  bondXP: number;
  unlockedFeatures: {
    orders: boolean;
    dms: boolean;
    calls: boolean;
    memories: boolean;
  };
}

export interface BondMilestone {
  level: number;
  xpRequired: number;
  unlocks: string[];
  title: string;
  description: string;
}

export class NPCManager {
  private eventSystem: EventSystem;
  private gameState: GameStateManager;
  private npcData: Map<NpcId, NPCData> = new Map();
  private bondMilestones: BondMilestone[] = [];

  constructor(eventSystem: EventSystem, gameState: GameStateManager) {
    this.eventSystem = eventSystem;
    this.gameState = gameState;
    
    this.initializeNPCs();
    this.initializeBondMilestones();
    this.setupEventListeners();
  }

  /**
   * Initialize NPC data with portraits and cinematics
   */
  private initializeNPCs(): void {
    const npcs: NPCData[] = [
      {
        id: 'aria',
        name: 'Aria',
        portraitPath: getNpcPortraitPath('aria'),
        cinematicPath: 'art/npc/aria/aria_gacha_cinematic.mp4',
        personality: {
          traits: ['Sweet', 'Caring', 'Optimistic', 'Creative'],
          favoriteAffinities: ['Sweet', 'Floral', 'Fruity'],
          description: 'A warm and nurturing soul who finds joy in life\'s simple pleasures. Aria believes every moment can be made special with the right touch of sweetness.'
        },
        bondLevel: 1,
        bondXP: 0,
        unlockedFeatures: {
          orders: true,
          dms: false,
          calls: false,
          memories: true
        }
      },
      {
        id: 'kai',
        name: 'Kai',
        portraitPath: getNpcPortraitPath('kai'),
        cinematicPath: 'art/npc/kai/kai_gacha_cinematic.mp4',
        personality: {
          traits: ['Intellectual', 'Calm', 'Thoughtful', 'Reliable'],
          favoriteAffinities: ['Bitter', 'Earthy', 'Complex'],
          description: 'A thoughtful and introspective person who appreciates depth and complexity. Kai finds beauty in the subtle nuances that others might overlook.'
        },
        bondLevel: 1,
        bondXP: 0,
        unlockedFeatures: {
          orders: true,
          dms: false,
          calls: false,
          memories: true
        }
      },
      {
        id: 'elias',
        name: 'Elias',
        portraitPath: getNpcPortraitPath('elias'),
        cinematicPath: 'art/npc/elias/elias_gacha_cinematic.mp4',
        personality: {
          traits: ['Adventurous', 'Energetic', 'Bold', 'Spontaneous'],
          favoriteAffinities: ['Spicy', 'Exotic', 'Bold'],
          description: 'An adventurous spirit who thrives on new experiences and bold flavors. Elias brings excitement and spontaneity to every interaction.'
        },
        bondLevel: 1,
        bondXP: 0,
        unlockedFeatures: {
          orders: true,
          dms: false,
          calls: false,
          memories: true
        }
      }
    ];

    npcs.forEach(npc => {
      this.npcData.set(npc.id, npc);
    });
  }

  /**
   * Initialize bond level milestones
   */
  private initializeBondMilestones(): void {
    this.bondMilestones = [
      {
        level: 1,
        xpRequired: 0,
        unlocks: ['orders', 'memories'],
        title: 'Acquaintance',
        description: 'You\'ve just met and can fulfill their orders.'
      },
      {
        level: 2,
        xpRequired: 100,
        unlocks: ['dms'],
        title: 'Friend',
        description: 'You can now send direct messages!'
      },
      {
        level: 3,
        xpRequired: 300,
        unlocks: ['calls'],
        title: 'Close Friend',
        description: 'Voice calls are now available!'
      },
      {
        level: 4,
        xpRequired: 600,
        unlocks: ['special_memories'],
        title: 'Best Friend',
        description: 'Special memories and deeper conversations unlocked.'
      },
      {
        level: 5,
        xpRequired: 1000,
        unlocks: ['romance_path'],
        title: 'Romantic Interest',
        description: 'The relationship has blossomed into something special.'
      }
    ];
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.eventSystem.on('memory:viewed', (data) => {
      if (data.npcId) {
        this.addBondXP(data.npcId as NpcId, 10);
      }
    });

    this.eventSystem.on('order:completed', (data) => {
      const order = data.order as any;
      if (order?.kind === 'NPC' && order.npcId) {
        this.addBondXP(order.npcId as NpcId, 25);
      }
    });

    this.eventSystem.on('dm:sent', (data) => {
      if (data.npcId) {
        this.addBondXP(data.npcId as NpcId, 5);
      }
    });
  }

  /**
   * Get NPC data by ID
   */
  getNPC(npcId: NpcId): NPCData | undefined {
    return this.npcData.get(npcId);
  }

  /**
   * Get all NPCs
   */
  getAllNPCs(): NPCData[] {
    return Array.from(this.npcData.values());
  }

  /**
   * Add bond XP to an NPC
   */
  addBondXP(npcId: NpcId, xp: number): void {
    const npc = this.npcData.get(npcId);
    if (!npc) return;

    const oldLevel = npc.bondLevel;
    npc.bondXP += xp;

    // Check for level up
    const newLevel = this.calculateBondLevel(npc.bondXP);
    if (newLevel > oldLevel) {
      npc.bondLevel = newLevel;
      this.handleLevelUp(npcId, oldLevel, newLevel);
    }

    // Update game state
    this.syncToGameState(npcId, npc);

    // Emit XP gained event
    this.eventSystem.emit('bond:xp_gained', {
      npcId,
      xpGained: xp,
      totalXP: npc.bondXP,
      level: npc.bondLevel,
      leveledUp: newLevel > oldLevel
    });
  }

  /**
   * Calculate bond level from XP
   */
  private calculateBondLevel(xp: number): number {
    for (let i = this.bondMilestones.length - 1; i >= 0; i--) {
      if (xp >= this.bondMilestones[i]!.xpRequired) {
        return this.bondMilestones[i]!.level;
      }
    }
    return 1;
  }

  /**
   * Handle level up
   */
  private handleLevelUp(npcId: NpcId, oldLevel: number, newLevel: number): void {
    const npc = this.npcData.get(npcId);
    if (!npc) return;

    const milestone = this.bondMilestones.find(m => m.level === newLevel);
    if (!milestone) return;

    // Unlock new features
    milestone.unlocks.forEach(feature => {
      switch (feature) {
        case 'dms':
          npc.unlockedFeatures.dms = true;
          break;
        case 'calls':
          npc.unlockedFeatures.calls = true;
          break;
        case 'special_memories':
        case 'romance_path':
          // These will be handled by other systems
          break;
      }
    });

    // Emit level up event
    this.eventSystem.emit('bond:level_up', {
      npcId,
      oldLevel,
      newLevel,
      milestone,
      npcName: npc.name
    });

    console.log(`🎉 ${npc.name} bond level increased to ${newLevel}: ${milestone.title}!`);
  }

  /**
   * Sync NPC data to game state
   */
  private syncToGameState(npcId: NpcId, npc: NPCData): void {
    const player = this.gameState.getPlayer();
    if (!player.npc[npcId]) {
      player.npc[npcId] = {
        npcId: npcId,
        bondXp: npc.bondXP,
        level: npc.bondLevel,
        unreadDmCount: 0,
        callAvailable: npc.unlockedFeatures.calls,
        scenesSeen: []
      };
    } else {
      player.npc[npcId].level = npc.bondLevel;
      player.npc[npcId].bondXp = npc.bondXP;
      player.npc[npcId].callAvailable = npc.unlockedFeatures.calls;
    }
  }

  /**
   * Load NPC data from game state
   */
  loadFromGameState(): void {
    const player = this.gameState.getPlayer();
    
    Object.entries(player.npc).forEach(([npcId, playerNpc]) => {
      const npc = this.npcData.get(npcId as NpcId);
      if (npc && playerNpc) {
        npc.bondLevel = playerNpc.level;
        npc.bondXP = playerNpc.bondXp;
        npc.unlockedFeatures.calls = playerNpc.callAvailable;
        npc.unlockedFeatures.dms = playerNpc.level >= 2;
      }
    });
  }

  /**
   * Get bond milestone information
   */
  getBondMilestone(level: number): BondMilestone | undefined {
    return this.bondMilestones.find(m => m.level === level);
  }

  /**
   * Get next milestone for an NPC
   */
  getNextMilestone(npcId: NpcId): BondMilestone | undefined {
    const npc = this.npcData.get(npcId);
    if (!npc) return undefined;

    return this.bondMilestones.find(m => m.level > npc.bondLevel);
  }

  /**
   * Get XP needed for next level
   */
  getXPToNextLevel(npcId: NpcId): number {
    const npc = this.npcData.get(npcId);
    if (!npc) return 0;

    const nextMilestone = this.getNextMilestone(npcId);
    if (!nextMilestone) return 0;

    return nextMilestone.xpRequired - npc.bondXP;
  }

  /**
   * Check if feature is unlocked for NPC
   */
  isFeatureUnlocked(npcId: NpcId, feature: keyof NPCData['unlockedFeatures']): boolean {
    const npc = this.npcData.get(npcId);
    return npc?.unlockedFeatures[feature] ?? false;
  }

  /**
   * Get NPCs that can generate orders
   */
  getOrderableNPCs(): NPCData[] {
    return this.getAllNPCs().filter(npc => npc.unlockedFeatures.orders);
  }

  /**
   * Get NPCs available for DMs
   */
  getDMAvailableNPCs(): NPCData[] {
    return this.getAllNPCs().filter(npc => npc.unlockedFeatures.dms);
  }

  /**
   * Get NPCs available for calls
   */
  getCallAvailableNPCs(): NPCData[] {
    return this.getAllNPCs().filter(npc => npc.unlockedFeatures.calls);
  }
}
