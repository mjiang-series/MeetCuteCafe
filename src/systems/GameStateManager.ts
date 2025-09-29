/**
 * Game State Manager for Meet Cute Cafe
 * Handles all game state persistence and management
 */

import { v4 as uuidv4 } from 'uuid';
import type { 
  Player, 
  Memory, 
  PlayerNpc, 
  NpcId,
  OrderBoardState,
  PlayerFlavor 
} from '@/models/GameTypes';
import type { EventSystem } from './EventSystem';

const STORAGE_KEY = 'meet-cute-cafe-save';
const SCHEMA_VERSION = 1;

interface SaveData {
  version: number;
  player: Player;
  savedAt: number;
}

export class GameStateManager {
  private player: Player | null = null;
  private autoSaveInterval: number | null = null;

  constructor(private eventSystem: EventSystem) {
    this.setupAutoSave();
  }

  /**
   * Initialize a new player save
   */
  createNewPlayer(): Player {
    const now = Date.now();
    const playerId = uuidv4();

    const newPlayer: Player = {
      playerId,
      createdAt: now,
      lastSeenAt: now,
      coins: 100, // Starting coins
      diamonds: 50, // Starting diamonds
      consumables: {
        sugar: 10,
        coffee: 10,
        mint: 10,
        pepper: 10,
        salt: 10,
      },
      tokens: 0,
      flavors: [], // Will be populated with starter flavors
      journal: {
        entries: [],
      },
      npc: {
        aria: {
          npcId: 'aria',
          bondXp: 0,
          level: 1,
          unreadDmCount: 0,
          callAvailable: false,
          scenesSeen: [],
        },
        kai: {
          npcId: 'kai',
          bondXp: 0,
          level: 1,
          unreadDmCount: 0,
          callAvailable: false,
          scenesSeen: [],
        },
        elias: {
          npcId: 'elias',
          bondXp: 0,
          level: 1,
          unreadDmCount: 0,
          callAvailable: false,
          scenesSeen: [],
        },
      },
      dailySeed: this.generateDailySeed(now),
      orderBoard: {
        day: this.getCurrentDay(),
        customerOrders: [],
        npcOrders: [],
      },
      bannersSeen: [],
      pity: {},
      settings: {
        sfx: 0.8,
        music: 0.6,
        tts: true,
        notifications: true,
        locale: 'en',
      },
      pendingActions: [],
    };

    this.player = newPlayer;
    this.saveGame();
    this.eventSystem.emit('game:loaded', { playerId });

    return newPlayer;
  }

  /**
   * Load player data from storage
   */
  async loadGame(): Promise<Player> {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      
      if (!savedData) {
        return this.createNewPlayer();
      }

      const saveData: SaveData = JSON.parse(savedData);
      
      // Handle version migration if needed
      if (saveData.version < SCHEMA_VERSION) {
        const migratedPlayer = this.migratePlayerData(saveData.player, saveData.version);
        this.player = migratedPlayer;
        this.saveGame(); // Save migrated data
      } else {
        this.player = saveData.player;
      }

      // Update last seen
      this.player.lastSeenAt = Date.now();
      
      this.eventSystem.emit('game:loaded', { playerId: this.player.playerId });
      return this.player;
      
    } catch (error) {
      console.error('Failed to load game:', error);
      this.eventSystem.emit('game:error', { 
        error: error as Error, 
        context: 'loading' 
      });
      return this.createNewPlayer();
    }
  }

  /**
   * Save current game state
   */
  saveGame(): void {
    if (!this.player) {
      throw new Error('No player data to save');
    }

    try {
      const saveData: SaveData = {
        version: SCHEMA_VERSION,
        player: this.player,
        savedAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      this.eventSystem.emit('game:saved', { timestamp: saveData.savedAt });
      
    } catch (error) {
      console.error('Failed to save game:', error);
      this.eventSystem.emit('game:error', { 
        error: error as Error, 
        context: 'saving' 
      });
    }
  }

  /**
   * Get current player data
   */
  getPlayer(): Player {
    if (!this.player) {
      throw new Error('Player not loaded');
    }
    return this.player;
  }

  /**
   * Update player data
   */
  updatePlayer(updates: Partial<Player>): void {
    if (!this.player) {
      throw new Error('Player not loaded');
    }

    this.player = { ...this.player, ...updates };
    this.saveGame();
  }

  /**
   * Currency management
   */
  addCoins(amount: number): void {
    if (!this.player) return;
    this.player.coins += amount;
    this.eventSystem.emit('header:update_currency', { currency: 'coins', value: this.player.coins });
    this.saveGame();
  }

  spendCoins(amount: number): boolean {
    if (!this.player || this.player.coins < amount) {
      return false;
    }
    this.player.coins -= amount;
    this.eventSystem.emit('header:update_currency', { currency: 'coins', value: this.player.coins });
    this.saveGame();
    return true;
  }

  addDiamonds(amount: number): void {
    if (!this.player) return;
    this.player.diamonds += amount;
    this.eventSystem.emit('header:update_currency', { currency: 'diamonds', value: this.player.diamonds });
    this.saveGame();
  }

  spendDiamonds(amount: number): boolean {
    if (!this.player || this.player.diamonds < amount) {
      return false;
    }
    this.player.diamonds -= amount;
    this.eventSystem.emit('header:update_currency', { currency: 'diamonds', value: this.player.diamonds });
    this.saveGame();
    return true;
  }

  /**
   * NPC management
   */
  getNPC(npcId: NpcId): PlayerNpc {
    if (!this.player) {
      throw new Error('Player not loaded');
    }
    return this.player.npc[npcId];
  }

  addBondXP(npcId: NpcId, xp: number): void {
    if (!this.player) return;
    
    const npc = this.player.npc[npcId];
    npc.bondXp += xp;
    
    // Check for level up
    const newLevel = Math.floor(npc.bondXp / 100) + 1; // 100 XP per level
    if (newLevel > npc.level) {
      npc.level = newLevel;
    }
    this.saveGame();
  }

  /**
   * Memory management
   */
  addMemory(memory: Memory): void {
    if (!this.player) return;
    
    this.player.journal.entries.push(memory);
    this.eventSystem.emit('memory:created', { memory });
    this.saveGame();
  }

  getMemory(memoryId: string): Memory | undefined {
    if (!this.player) return undefined;
    return this.player.journal.entries.find(m => m.memoryId === memoryId);
  }

  markMemoryAsViewed(memoryId: string): void {
    if (!this.player) return;
    
    const memory = this.getMemory(memoryId);
    if (memory && memory.unread) {
      memory.unread = false;
      this.eventSystem.emit('memory:viewed', { memoryId });
      this.saveGame();
    }
  }

  /**
   * Order board management
   */
  updateOrderBoard(orderBoard: OrderBoardState): void {
    if (!this.player) return;
    
    this.player.orderBoard = orderBoard;
    this.saveGame();
  }

  /**
   * Flavor management
   */
  addFlavor(flavor: PlayerFlavor): void {
    if (!this.player) return;
    
    this.player.flavors.push(flavor);
    this.saveGame();
  }

  getFlavor(flavorId: string): PlayerFlavor | undefined {
    if (!this.player) return undefined;
    return this.player.flavors.find(f => f.flavorId === flavorId);
  }

  /**
   * Utility methods
   */
  private generateDailySeed(timestamp: number): string {
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const playerId = this.player?.playerId ?? 'unknown';
    return `${dateStr}-${playerId}`;
  }

  private getCurrentDay(): string {
    const datePart = new Date().toISOString().split('T')[0];
    if (!datePart) {
      throw new Error('Failed to generate current day string');
    }
    return datePart;
  }

  private migratePlayerData(player: Player, fromVersion: number): Player {
    // Handle future migrations
    console.warn(`Migrating player data from version ${fromVersion} to ${SCHEMA_VERSION}`);
    return player;
  }

  private setupAutoSave(): void {
    // Auto-save every 30 seconds
    this.autoSaveInterval = window.setInterval(() => {
      if (this.player) {
        this.saveGame();
      }
    }, 30000);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
}
