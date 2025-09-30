/**
 * ConversationManager - Manages DM conversations with NPCs
 * Phase 2: Romance Foundation
 */

import { EventSystem } from './EventSystem';
import { GameStateManager } from './GameStateManager';
import { NPCManager } from './NPCManager';
import { NpcId } from '@/models/GameTypes';

export interface DMMessage {
  id: string;
  senderId: 'player' | NpcId;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  npcId: NpcId;
  messages: DMMessage[];
  lastMessageAt: number;
  unreadCount: number;
}

export interface ResponseOption {
  id: string;
  text: string;
  requiredBondLevel?: number;
  unlocks?: string[]; // Future feature flags
}

export class ConversationManager {
  private eventSystem: EventSystem;
  private npcManager: NPCManager;
  private conversations: Map<NpcId, Conversation> = new Map();
  private messageIdCounter = 1;

  // Pre-written response patterns based on bond level
  private responseTemplates: Record<NpcId, Record<number, string[]>> = {
    aria: {
      1: [
        "Thanks for the lovely coffee! ☕",
        "Your café has such a warm atmosphere 💕",
        "I hope we can chat more soon!"
      ],
      2: [
        "I really enjoyed our conversation today 😊",
        "You have such a kind heart ❤️",
        "I feel like we're becoming good friends!"
      ],
      3: [
        "I look forward to seeing you every day 🌸",
        "You always know how to make me smile 😊",
        "I feel so comfortable talking with you"
      ],
      4: [
        "I've been thinking about you a lot lately 💭",
        "You mean so much to me 💕",
        "I treasure every moment we spend together"
      ],
      5: [
        "My heart skips a beat when I see you 💓",
        "I think I'm falling for you... 💕",
        "Would you like to go somewhere special together?"
      ]
    },
    kai: {
      1: [
        "That was an excellent brew, thank you.",
        "I appreciate the attention to detail in your work.",
        "Your café is a peaceful place to think."
      ],
      2: [
        "I enjoy our conversations about coffee and life.",
        "You have an interesting perspective on things.",
        "I find myself looking forward to our chats."
      ],
      3: [
        "I feel like I can be myself around you.",
        "Your company brings me a sense of calm.",
        "I value the connection we're building."
      ],
      4: [
        "You've become quite important to me.",
        "I find myself thinking about our conversations.",
        "There's something special about what we have."
      ],
      5: [
        "I've never felt this way about anyone before.",
        "You've touched my heart in ways I didn't expect.",
        "Would you consider taking this relationship further?"
      ]
    },
    elias: {
      1: [
        "That coffee was amazing! What's your secret? 🔥",
        "This place has such great energy!",
        "Thanks for the adventure in a cup!"
      ],
      2: [
        "You're pretty cool, you know that? 😎",
        "I love how passionate you are about coffee!",
        "We should definitely hang out more!"
      ],
      3: [
        "You bring out the best in me 🌟",
        "I love how we can talk about anything!",
        "You're becoming really special to me"
      ],
      4: [
        "I can't stop thinking about you 💭",
        "You make every day feel like an adventure!",
        "I think what we have is pretty incredible"
      ],
      5: [
        "I'm crazy about you! 🔥💕",
        "You've stolen my heart completely!",
        "Want to go on a real adventure together?"
      ]
    }
  };

  private playerResponseOptions: ResponseOption[] = [
    { id: 'friendly', text: "That's so sweet! 😊", requiredBondLevel: 1 },
    { id: 'caring', text: "I care about you too ❤️", requiredBondLevel: 2 },
    { id: 'flirty', text: "You make me blush... 😊💕", requiredBondLevel: 3 },
    { id: 'romantic', text: "I feel the same way 💓", requiredBondLevel: 4 },
    { id: 'love', text: "I love you too! 💕", requiredBondLevel: 5 },
    { id: 'casual', text: "Thanks for chatting!", requiredBondLevel: 1 },
    { id: 'thoughtful', text: "I really appreciate you", requiredBondLevel: 2 },
    { id: 'excited', text: "This is so exciting! ✨", requiredBondLevel: 1 }
  ];

  constructor(eventSystem: EventSystem, _gameState: GameStateManager, npcManager: NPCManager) {
    this.eventSystem = eventSystem;
    this.npcManager = npcManager;
    this.initializeConversations();
    this.setupEventListeners();
  }

  private initializeConversations(): void {
    const npcs = this.npcManager.getAllNPCs();
    npcs.forEach(npc => {
      if (!this.conversations.has(npc.id)) {
        this.conversations.set(npc.id, {
          npcId: npc.id,
          messages: [],
          lastMessageAt: 0,
          unreadCount: 0
        });
      }
    });
  }

  private setupEventListeners(): void {
    // Listen for bond level ups to send congratulatory messages
    this.eventSystem.on('bond:level_up', (data) => {
      const npcId = data.npcId as NpcId;
      const newLevel = data.newLevel as number;
      
      // Send a special message for reaching new bond levels
      setTimeout(() => {
        this.sendNPCMessage(npcId, this.getBondLevelUpMessage(npcId, newLevel));
      }, 2000); // Delay to make it feel natural
    });
  }

  private getBondLevelUpMessage(npcId: NpcId, level: number): string {
    const messages: Record<NpcId, Record<number, string>> = {
      aria: {
        2: "I'm so happy we're becoming closer friends! 💕",
        3: "I feel like I can really trust you now 🌸",
        4: "You've become so special to me... ❤️",
        5: "I think I'm in love with you! 💓"
      },
      kai: {
        2: "I'm glad we can talk more openly now.",
        3: "I feel a deeper connection with you.",
        4: "You've become very important to me.",
        5: "I believe I've fallen in love with you."
      },
      elias: {
        2: "We're getting pretty close, aren't we? 😊",
        3: "I love how comfortable we are together!",
        4: "You mean the world to me! 🌟",
        5: "I'm head over heels for you! 🔥💕"
      }
    };

    return messages[npcId]?.[level] || "Thanks for being such a great friend!";
  }

  sendPlayerMessage(npcId: NpcId, content: string): void {
    const npc = this.npcManager.getNPC(npcId);
    if (!npc || !npc.unlockedFeatures.dms) {
      console.warn(`Cannot send DM to ${npcId}: DMs not unlocked`);
      return;
    }

    const conversation = this.conversations.get(npcId);
    if (!conversation) return;

    const message: DMMessage = {
      id: `msg_${this.messageIdCounter++}`,
      senderId: 'player',
      content,
      timestamp: Date.now(),
      read: true // Player messages are always read
    };

    conversation.messages.push(message);
    conversation.lastMessageAt = message.timestamp;

    // Emit event for bond XP
    this.eventSystem.emit('dm:sent', { npcId, message: content });

    // Generate NPC response after a short delay
    setTimeout(() => {
      this.generateNPCResponse(npcId);
    }, 1000 + Math.random() * 2000); // 1-3 second delay

    this.saveConversations();
  }

  private sendNPCMessage(npcId: NpcId, content: string): void {
    const conversation = this.conversations.get(npcId);
    if (!conversation) return;

    const message: DMMessage = {
      id: `msg_${this.messageIdCounter++}`,
      senderId: npcId,
      content,
      timestamp: Date.now(),
      read: false // NPC messages start unread
    };

    conversation.messages.push(message);
    conversation.lastMessageAt = message.timestamp;
    conversation.unreadCount++;

    this.eventSystem.emit('dm:received', { npcId, message: content });
    this.saveConversations();
  }

  private generateNPCResponse(npcId: NpcId): void {
    const npc = this.npcManager.getNPC(npcId);
    if (!npc) return;

    const bondLevel = npc.bondLevel;
    const templates = this.responseTemplates[npcId]?.[bondLevel] || this.responseTemplates[npcId]?.[1] || [];
    
    if (templates.length === 0) return;

    const response = templates[Math.floor(Math.random() * templates.length)];
    if (response) {
      this.sendNPCMessage(npcId, response);
    }
  }

  getConversation(npcId: NpcId): Conversation | undefined {
    return this.conversations.get(npcId);
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values())
      .filter(conv => conv.messages.length > 0)
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }

  markConversationAsRead(npcId: NpcId): void {
    const conversation = this.conversations.get(npcId);
    if (!conversation) return;

    conversation.messages.forEach(msg => {
      if (msg.senderId === npcId) {
        msg.read = true;
      }
    });
    conversation.unreadCount = 0;

    this.saveConversations();
  }

  getAvailableResponses(npcId: NpcId): ResponseOption[] {
    const npc = this.npcManager.getNPC(npcId);
    if (!npc) return [];

    return this.playerResponseOptions.filter(option => 
      !option.requiredBondLevel || npc.bondLevel >= option.requiredBondLevel
    );
  }

  getTotalUnreadCount(): number {
    return Array.from(this.conversations.values())
      .reduce((total, conv) => total + conv.unreadCount, 0);
  }

  private saveConversations(): void {
    // Save to localStorage for now (could be integrated with GameStateManager later)
    const conversationsData = Array.from(this.conversations.entries());
    localStorage.setItem('meet_cute_cafe_conversations', JSON.stringify(conversationsData));
  }

  loadConversations(): void {
    try {
      const stored = localStorage.getItem('meet_cute_cafe_conversations');
      if (stored) {
        const conversationsData = JSON.parse(stored);
        this.conversations = new Map(conversationsData);
        
        // Update message ID counter to avoid conflicts
        let maxId = 0;
        this.conversations.forEach(conv => {
          conv.messages.forEach(msg => {
            const idNum = parseInt(msg.id.replace('msg_', ''));
            if (idNum > maxId) maxId = idNum;
          });
        });
        this.messageIdCounter = maxId + 1;
      }
    } catch (error) {
      console.warn('Failed to load conversations:', error);
    }
  }
}
