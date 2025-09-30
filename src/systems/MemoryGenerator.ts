/**
 * MemoryGenerator - Creates narrative memories from gameplay events
 * Phase 2: Romance Foundation
 * Based on SYSTEM_RECREATION_GUIDE.md Memory Generation system
 */

import { EventSystem } from './EventSystem';
import { GameStateManager } from './GameStateManager';
import { NPCManager } from './NPCManager';
import { NpcId, Memory as GameMemory } from '@/models/GameTypes';
import { getMemoryPlaceholderPath } from '@/utils/AssetPaths';

export interface Memory {
  id: string;
  content: string; // Short snippet
  extendedStory?: string; // Longer narrative
  imageUrl?: string;
  taggedNPCs: NpcId[];
  taggedPets: string[];
  mood: string;
  location: string;
  timestamp: number;
  isPublished: boolean;
  viewed: boolean;
  favorited: boolean;
  rarity?: 'common' | 'rare' | 'epic';
  orderId?: string; // Link to the order that generated this memory
}

export interface MemoryTemplate {
  template: string;
  requiredNPCs: number;
  mood: string[];
  rarity: number; // Probability weight
  location: string;
}

export class MemoryGenerator {
  private templates: Record<string, MemoryTemplate[]> = {};
  
  constructor(
    private eventSystem: EventSystem,
    private gameState: GameStateManager,
    private npcManager: NPCManager
  ) {
    this.initializeTemplates();
    this.setupEventListeners();
  }

  /**
   * Initialize memory templates for different locations
   */
  private initializeTemplates(): void {
    this.templates = {
      cafe: [
        {
          template: 'You and {npc} shared a quiet moment over coffee, discussing favorite flavors and dreams.',
          requiredNPCs: 1,
          mood: ['cozy', 'intimate'],
          rarity: 0.7,
          location: 'Café Counter'
        },
        {
          template: '{npc} helped you perfect a new drink recipe. The collaboration felt natural and fun.',
          requiredNPCs: 1,
          mood: ['happy', 'collaborative'],
          rarity: 0.6,
          location: 'Café Counter'
        },
        {
          template: 'During a busy rush, you and {npc} worked in perfect sync, sharing knowing glances.',
          requiredNPCs: 1,
          mood: ['energetic', 'connected'],
          rarity: 0.5,
          location: 'Café Counter'
        },
        {
          template: 'After closing, {npc} stayed to help clean up. You talked about everything and nothing.',
          requiredNPCs: 1,
          mood: ['peaceful', 'intimate'],
          rarity: 0.4,
          location: 'Café Counter'
        },
        {
          template: '{npc} surprised you with your favorite drink, made exactly how you like it.',
          requiredNPCs: 1,
          mood: ['touched', 'sweet'],
          rarity: 0.3,
          location: 'Café Counter'
        }
      ],
      orders: [
        {
          template: '{npc} placed a special order just for you, with a note that made you smile.',
          requiredNPCs: 1,
          mood: ['sweet', 'romantic'],
          rarity: 0.8,
          location: 'Order Board'
        },
        {
          template: 'You fulfilled {npc}\'s challenging order perfectly. Their impressed smile was worth it.',
          requiredNPCs: 1,
          mood: ['proud', 'accomplished'],
          rarity: 0.6,
          location: 'Order Board'
        },
        {
          template: '{npc} left encouraging feedback on your order completion. It meant more than they knew.',
          requiredNPCs: 1,
          mood: ['encouraged', 'warm'],
          rarity: 0.5,
          location: 'Order Board'
        }
      ],
      flavors: [
        {
          template: '{npc} helped you discover a new flavor combination that became your signature.',
          requiredNPCs: 1,
          mood: ['excited', 'creative'],
          rarity: 0.6,
          location: 'Flavor Lab'
        },
        {
          template: 'You and {npc} spent hours experimenting with flavors, laughing at the failed attempts.',
          requiredNPCs: 1,
          mood: ['playful', 'fun'],
          rarity: 0.5,
          location: 'Flavor Lab'
        }
      ]
    };
  }

  /**
   * Setup event listeners for memory generation triggers
   */
  private setupEventListeners(): void {
    // Generate memories when NPC orders are completed
    this.eventSystem.on('order:completed', (data) => {
      const order = data.order as any;
      if (order?.kind === 'NPC' && order.npcId) {
        this.generateOrderMemory(order.npcId, order.orderId);
      }
    });

    // Generate memories from bond level ups
    this.eventSystem.on('bond:level_up', (data) => {
      this.generateBondMemory(data.npcId as NpcId, data.newLevel);
    });
  }

  /**
   * Generate a memory from completing an NPC order
   */
  generateOrderMemory(npcId: NpcId, orderId: string): Memory {
    const templates = this.templates.orders || [];
    const template = this.selectTemplate(templates);
    const npc = this.npcManager.getNPC(npcId);
    
    if (!npc || !template) {
      throw new Error(`Cannot generate memory: NPC ${npcId} not found or no templates available`);
    }

    const content = this.fillTemplate(template, [npc.name]);
    const extendedStory = this.generateExtendedStory(template, [npc.name], content);
    const mood = this.selectMood(template.mood);
    
    const memory: Memory = {
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      extendedStory,
      imageUrl: this.generateImageUrl([npcId], []),
      taggedNPCs: [npcId],
      taggedPets: [],
      mood,
      location: template.location,
      timestamp: Date.now(),
      isPublished: false,
      viewed: false,
      favorited: false,
      rarity: this.determineRarity(template.rarity),
      orderId
    };

    this.saveMemory(memory);
    this.eventSystem.emit('memory:created', { memory });
    
    console.log(`📖 New memory created: "${content.substring(0, 50)}..."`);
    return memory;
  }

  /**
   * Generate a memory from bond level increase
   */
  generateBondMemory(npcId: NpcId, bondLevel: number): Memory {
    const templates = this.templates.cafe || [];
    const template = this.selectTemplate(templates);
    const npc = this.npcManager.getNPC(npcId);
    
    if (!npc || !template) {
      throw new Error(`Cannot generate bond memory: NPC ${npcId} not found or no templates available`);
    }

    const content = this.fillTemplate(template, [npc.name]);
    const extendedStory = this.generateExtendedStory(template, [npc.name], content);
    const mood = this.selectMood(template.mood);
    
    const memory: Memory = {
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      extendedStory,
      imageUrl: this.generateImageUrl([npcId], []),
      taggedNPCs: [npcId],
      taggedPets: [],
      mood,
      location: template.location,
      timestamp: Date.now(),
      isPublished: false,
      viewed: false,
      favorited: false,
      rarity: bondLevel >= 3 ? 'rare' : 'common'
    };

    this.saveMemory(memory);
    this.eventSystem.emit('memory:created', { memory });
    
    console.log(`💕 Bond memory created with ${npc.name}: "${content.substring(0, 50)}..."`);
    return memory;
  }

  /**
   * Select a random template based on rarity weights
   */
  private selectTemplate(templates: MemoryTemplate[]): MemoryTemplate | null {
    if (templates.length === 0) return null;
    
    const totalWeight = templates.reduce((sum, t) => sum + t.rarity, 0);
    let random = Math.random() * totalWeight;
    
    for (const template of templates) {
      random -= template.rarity;
      if (random <= 0) {
        return template;
      }
    }
    
    return templates[0] || null; // Fallback
  }

  /**
   * Fill template placeholders with NPC names
   */
  private fillTemplate(template: MemoryTemplate, npcNames: string[]): string {
    let content = template.template;
    
    // Replace NPC placeholders
    npcNames.forEach((name, index) => {
      const placeholder = `{npc${index > 0 ? index + 1 : ''}}`;
      const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      content = content.replace(new RegExp(escapedPlaceholder, 'g'), name);
    });
    
    // Replace generic {npc} placeholder
    if (npcNames.length > 0) {
      content = content.replace(/{npc}/g, npcNames[0]!);
    }
    
    return content;
  }

  /**
   * Generate extended story content
   */
  private generateExtendedStory(_template: MemoryTemplate, _npcNames: string[], baseContent: string): string {
    const extensions = [
      'The moment felt special, like something had shifted between you.',
      'You found yourself thinking about it long after they left.',
      'There was an unspoken understanding in that shared glance.',
      'The memory would stay with you for days to come.',
      'It was one of those perfect, simple moments that meant everything.',
      'You realized how much you looked forward to these interactions.',
      'The connection felt deeper than just friendship.',
      'Something about their presence made everything feel brighter.'
    ];
    
    const extension = extensions[Math.floor(Math.random() * extensions.length)] || '';
    return `${baseContent} ${extension}`;
  }

  /**
   * Select mood from template options
   */
  private selectMood(moods: string[]): string {
    const selectedMood = moods[Math.floor(Math.random() * moods.length)];
    return selectedMood || 'Cozy';
  }

  /**
   * Determine memory rarity based on template weight
   */
  private determineRarity(rarityWeight: number): 'common' | 'rare' | 'epic' {
    if (rarityWeight <= 0.3) return 'epic';
    if (rarityWeight <= 0.5) return 'rare';
    return 'common';
  }

  /**
   * Generate appropriate image URL based on participants
   */
  private generateImageUrl(npcIds: NpcId[], petIds: string[]): string {
    if (petIds.length > 0 && npcIds.length > 0) {
      return getMemoryPlaceholderPath(); // Both NPCs and pets
    } else if (npcIds.length > 0) {
      return getMemoryPlaceholderPath(); // NPCs only (using same placeholder for now)
    } else if (petIds.length > 0) {
      return getMemoryPlaceholderPath(); // Pets only (using same placeholder for now)
    } else {
      return getMemoryPlaceholderPath(); // Default
    }
  }

  /**
   * Save memory to game state
   */
  private saveMemory(memory: Memory): void {
    const player = this.gameState.getPlayer();
    if (!player.journal) {
      player.journal = { entries: [] };
    }
    
    // Add to journal using the existing Memory interface structure
    const gameMemory: GameMemory = {
      memoryId: memory.id,
      npcId: memory.taggedNPCs[0] || 'aria',
      createdAt: memory.timestamp,
      keyframeId: `keyframe_${memory.id}`,
      summary: memory.content,
      format: 'Drabble',
      extendedText: memory.extendedStory,
      mood: memory.mood as any,
      location: memory.location as any,
      tags: [memory.rarity || 'common'],
      unread: !memory.viewed
    };
    
    player.journal.entries.push(gameMemory);
    
    // Store full memory data (in a real app, this might be in a separate store)
    const memories = this.getStoredMemories();
    memories.set(memory.id, memory);
    this.setStoredMemories(memories);
    
    this.gameState.saveGame();
  }

  /**
   * Get all memories for a player
   */
  getMemories(): Memory[] {
    const memories = this.getStoredMemories();
    const player = this.gameState.getPlayer();
    
    if (!player.journal?.entries) return [];
    
    return player.journal.entries
      .map((journalEntry: GameMemory) => memories.get(journalEntry.memoryId))
      .filter((memory): memory is Memory => memory !== undefined)
      .sort((a: Memory, b: Memory) => b.timestamp - a.timestamp);
  }

  /**
   * Get memories filtered by NPC
   */
  getMemoriesByNPC(npcId: NpcId): Memory[] {
    return this.getMemories().filter(memory => 
      memory.taggedNPCs.includes(npcId)
    );
  }

  /**
   * Get recent memories (last 7 days)
   */
  getRecentMemories(): Memory[] {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return this.getMemories().filter(memory => 
      memory.timestamp > weekAgo
    );
  }

  /**
   * Mark memory as viewed
   */
  markMemoryAsViewed(memoryId: string): void {
    const memories = this.getStoredMemories();
    const memory = memories.get(memoryId);
    
    if (memory && !memory.viewed) {
      memory.viewed = true;
      memories.set(memoryId, memory);
      this.setStoredMemories(memories);
      
      // Update journal entry
      const player = this.gameState.getPlayer();
      const journalEntry = player.journal?.entries.find((m: GameMemory) => m.memoryId === memoryId);
      if (journalEntry) {
        journalEntry.unread = false;
        this.gameState.saveGame();
      }
      
      // Award bond XP for viewing memory
      if (memory.taggedNPCs.length > 0) {
        this.npcManager.addBondXP(memory.taggedNPCs[0]!, 10);
      }
      
      this.eventSystem.emit('memory:viewed', { memoryId, npcId: memory.taggedNPCs[0] });
    }
  }

  /**
   * Toggle memory favorite status
   */
  toggleMemoryFavorite(memoryId: string): boolean {
    const memories = this.getStoredMemories();
    const memory = memories.get(memoryId);
    
    if (memory) {
      memory.favorited = !memory.favorited;
      memories.set(memoryId, memory);
      this.setStoredMemories(memories);
      
      // Update journal entry  
      const player = this.gameState.getPlayer();
      const journalEntry = player.journal?.entries.find((m: GameMemory) => m.memoryId === memoryId);
      if (journalEntry) {
        // Note: GameMemory doesn't have favorited field, so we only store in localStorage
        this.gameState.saveGame();
      }
      
      return memory.favorited;
    }
    
    return false;
  }

  /**
   * Get memory by ID
   */
  getMemory(memoryId: string): Memory | null {
    const memories = this.getStoredMemories();
    return memories.get(memoryId) || null;
  }

  /**
   * Get stored memories from localStorage
   */
  private getStoredMemories(): Map<string, Memory> {
    try {
      const stored = localStorage.getItem('meetcute_memories');
      if (stored) {
        const data = JSON.parse(stored);
        return new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load memories from storage:', error);
    }
    return new Map();
  }

  /**
   * Save memories to localStorage
   */
  private setStoredMemories(memories: Map<string, Memory>): void {
    try {
      const data = Object.fromEntries(memories);
      localStorage.setItem('meetcute_memories', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save memories to storage:', error);
    }
  }
}
