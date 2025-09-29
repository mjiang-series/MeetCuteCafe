# System Recreation Guide

This guide provides detailed instructions for recreating the core systems from the Pet Café project. Each system is documented with architecture, implementation details, and key considerations.

## Table of Contents
1. [Top HUD System](#top-hud-system)
2. [Gacha System](#gacha-system)
3. [Character DM System](#character-dm-system)
4. [Memory Generation and Journal System](#memory-generation-and-journal-system)

---

## Top HUD System

### Overview
A persistent header that displays player stats, currencies, and actions. The header adapts to show relevant information based on the current screen.

### Architecture

#### Core Components
- **PersistentHeader**: Main header component
- **HeaderVariantManager**: Manages screen-specific variants
- **CurrencyDisplay**: Dynamic currency counters
- **NotificationBadge**: Alert indicators

#### File Structure
```
src/ui/components/
├── PersistentHeader.ts
├── HeaderVariant.ts
└── NotificationBadge.ts

src/styles/
├── persistent-header.css
└── header-variants.css
```

### Implementation Steps

#### 1. Create Header Component Structure
```typescript
// PersistentHeader.ts
export class PersistentHeader {
  private element: HTMLElement;
  private currentVariant: HeaderVariant = 'default';
  
  constructor(
    private eventSystem: EventSystem,
    private gameState: GameStateManager
  ) {
    this.createElement();
    this.setupEventListeners();
  }
  
  private createElement(): void {
    this.element = document.createElement('header');
    this.element.className = 'persistent-header';
    this.element.innerHTML = this.createHeaderHTML();
  }
  
  private createHeaderHTML(): string {
    return `
      <div class="header-left">
        <div class="player-identity">
          <img class="player-portrait" src="${getAssetPath('art/ui/player_portrait.png')}" alt="Player" />
          <div class="player-level">Lv ${this.getPlayerLevel()}</div>
        </div>
      </div>
      
      <div class="header-center">
        <div class="currency-display" id="currency-display">
          <!-- Dynamic currencies based on screen -->
        </div>
      </div>
      
      <div class="header-right">
        <button class="header-action notification-btn" id="notification-btn">
          <span class="material-icons">notifications</span>
          <span class="notification-badge" id="notification-badge">0</span>
        </button>
      </div>
    `;
  }
}
```

#### 2. Implement Header Variants
```typescript
// HeaderVariant.ts
export type HeaderVariant = 'default' | 'cafe' | 'pets' | 'gacha' | 'messages' | 'journal';

export interface HeaderVariantConfig {
  currencies: CurrencyType[];
  actions?: HeaderAction[];
  title?: string;
}

export const HEADER_VARIANTS: Record<HeaderVariant, HeaderVariantConfig> = {
  cafe: {
    currencies: ['coins', 'subscribers', 'premiumCurrency'],
  },
  pets: {
    currencies: ['freeGachaCurrency', 'premiumCurrency'],
  },
  gacha: {
    currencies: ['freeGachaCurrency', 'premiumCurrency'],
  },
  messages: {
    currencies: ['premiumCurrency'],
  },
  journal: {
    currencies: ['subscribers', 'premiumCurrency'],
  }
};
```

#### 3. Dynamic Currency Display
```typescript
private updateCurrencyDisplay(): void {
  const config = HEADER_VARIANTS[this.currentVariant];
  const currencyContainer = this.element.querySelector('#currency-display');
  
  if (!currencyContainer) return;
  
  currencyContainer.innerHTML = config.currencies.map(currency => {
    const value = this.getCurrencyValue(currency);
    const icon = this.getCurrencyIcon(currency);
    
    return `
      <div class="currency-item currency--${currency}">
        <span class="material-icons currency-icon">${icon}</span>
        <span class="currency-value">${this.formatCurrency(value)}</span>
        ${currency === 'premiumCurrency' ? '<button class="currency-add-btn">+</button>' : ''}
      </div>
    `;
  }).join('');
}
```

#### 4. Screen Context Integration
```typescript
// Event system integration
this.eventSystem.on('header:set_variant', (data) => {
  this.setVariant(data.variant, data.parentContext);
});

// Usage in screens
export class UnifiedBaseScreen {
  protected onShow(): void {
    this.eventSystem.emit('header:set_variant', {
      variant: this.getHeaderVariant(),
      parentContext: this.getParentScreen()
    });
  }
}
```

### Key Features
- **Responsive Design**: Adapts to mobile and desktop
- **Real-time Updates**: Currencies update immediately on changes
- **Screen Context**: Shows relevant currencies per screen
- **Notification System**: Badge counters for alerts
- **Safe Area Support**: Handles device notches and safe areas

---

## Gacha System

### Overview
A complete pet collection system with rarity tiers, pity mechanics, and visual feedback.

### Architecture

#### Core Components
- **GachaSystem**: Pull logic and probability calculations
- **GachaScreen**: UI for pulls and collection display
- **PetProfileScreen**: Individual pet details
- **CinematicPlayer**: 5-star reveal animations

#### Data Models
```typescript
export interface GachaPull {
  pullId: string;
  timestamp: number;
  cost: { currency: 'freeGachaCurrency', amount: number };
  results: PetPullResult[];
}

export interface PetPullResult {
  pet: Pet;
  isNew: boolean;
  isDuplicate: boolean;
  tokensAwarded?: number;
}

export interface Pet {
  petId: string;
  name: string;
  rarity: '3-star' | '4-star' | '5-star';
  npcAffinity: string;
  description: string;
  artRefs: {
    portrait: string;
    showcase: string;
    cinematicVideo?: string; // For 5-star pets
  };
}
```

### Implementation Steps

#### 1. Create Gacha System Core
```typescript
export class GachaSystem {
  private gachaRates = {
    '3-star': 0.70, // 70%
    '4-star': 0.27, // 27%
    '5-star': 0.03  // 3%
  };
  
  private pityCounter = 0;
  private readonly PITY_THRESHOLD = 10;
  
  async pullSingle(): Promise<GachaPull | null> {
    const cost = { currency: 'freeGachaCurrency' as const, amount: 1 };
    
    if (!this.canAffordPull(cost)) {
      this.eventSystem.emit('gacha:insufficient_funds', { required: cost.amount });
      return null;
    }
    
    this.deductCurrency(cost);
    const pet = this.rollPet();
    const result = this.createPullResult(pet);
    
    const pull: GachaPull = {
      pullId: `pull_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      cost,
      results: [result]
    };
    
    this.processPullResults(pull);
    return pull;
  }
  
  private rollPet(): Pet {
    // Pity system: guarantee 4+ star after threshold
    let adjustedRates = { ...this.gachaRates };
    
    if (this.pityCounter >= this.PITY_THRESHOLD) {
      adjustedRates['3-star'] = 0;
      adjustedRates['4-star'] = 0.7;
      adjustedRates['5-star'] = 0.3;
      this.pityCounter = 0;
    }
    
    const random = Math.random();
    let rarity: PetRarity;
    
    if (random < adjustedRates['5-star']) {
      rarity = '5-star';
    } else if (random < adjustedRates['5-star'] + adjustedRates['4-star']) {
      rarity = '4-star';
    } else {
      rarity = '3-star';
    }
    
    if (rarity === '3-star') {
      this.pityCounter++;
    } else {
      this.pityCounter = 0;
    }
    
    return this.selectRandomPetOfRarity(rarity);
  }
}
```

#### 2. Create Gacha UI
```typescript
export class GachaScreen extends UnifiedBaseScreen {
  protected createContent(): string {
    return `
      <div class="gacha-screen">
        <div class="collection-progress">
          <span class="collection-count">${progress.owned}/${progress.total}</span>
          <span class="collection-label">Collection</span>
        </div>
        
        <div class="gacha-actions">
          <button class="btn btn--primary btn--large gacha-pull-btn" data-action="pull-single">
            <span class="pull-cost">
              <span class="material-icons">confirmation_number</span> 1 Ticket
            </span>
            <span class="pull-label">Single Pull</span>
          </button>
          
          <button class="btn btn--primary btn--large gacha-pull-btn" data-action="pull-ten">
            <span class="pull-cost">
              <span class="material-icons">confirmation_number</span> 10 Tickets
            </span>
            <span class="pull-label">10x Pull</span>
          </button>
        </div>
        
        <div class="gacha-rates">
          <button class="rates-toggle" data-action="show-rates">
            <span class="material-icons">info</span> Drop Rates
          </button>
        </div>
      </div>
    `;
  }
}
```

#### 3. Implement Cinematic System
```typescript
export class CinematicPlayer {
  async playFiveStarReveal(pet: Pet): Promise<void> {
    if (!pet.artRefs.cinematicVideo) return;
    
    const overlay = this.createCinematicOverlay();
    document.body.appendChild(overlay);
    
    const video = overlay.querySelector('video') as HTMLVideoElement;
    video.src = getAssetPath(pet.artRefs.cinematicVideo);
    
    return new Promise((resolve) => {
      video.addEventListener('ended', () => {
        this.addFadeOutTransition(overlay, () => {
          overlay.remove();
          resolve();
        });
      });
      
      video.play();
    });
  }
  
  private createCinematicOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'cinematic-overlay';
    overlay.innerHTML = `
      <video class="cinematic-video" autoplay muted playsinline></video>
    `;
    return overlay;
  }
}
```

### Key Features
- **Pity System**: Guaranteed rare after 10 pulls
- **Visual Feedback**: Cinematic reveals for 5-star pets
- **Currency Integration**: Uses ticket-based economy
- **Collection Tracking**: Progress indicators
- **Duplicate Handling**: Converts to coins with rarity-based values

---

## Character DM System

### Overview
A messaging system with NPCs that includes conversation history, bond progression, and contextual responses.

### Architecture

#### Core Components
- **DMScreen**: Individual conversation interface
- **DMListScreen**: Conversation overview
- **NPCResponseService**: AI-like response generation
- **ConversationManager**: Message history and state

#### Data Models
```typescript
export interface Conversation {
  conversationId: string;
  npcId: string;
  messages: Message[];
  lastMessageAt: number;
  unreadCount: number;
  bondLevel: number;
}

export interface Message {
  messageId: string;
  senderId: string; // 'player' or npcId
  content: string;
  timestamp: number;
  messageType: 'text' | 'system' | 'bond_milestone';
  metadata?: {
    bondPointsAwarded?: number;
    sceneTriggered?: string;
  };
}

export interface NPCTemplate {
  personality: string[];
  responsePatterns: {
    greeting: string[];
    casual: string[];
    bond_milestone: string[];
    pet_related: string[];
    memory_related: string[];
  };
  topics: {
    unlocked: string[];
    locked: ConversationTopic[];
  };
}
```

### Implementation Steps

#### 1. Create Conversation Manager
```typescript
export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();
  
  getConversation(npcId: string): Conversation {
    if (!this.conversations.has(npcId)) {
      this.conversations.set(npcId, this.createNewConversation(npcId));
    }
    return this.conversations.get(npcId)!;
  }
  
  addMessage(npcId: string, message: Omit<Message, 'messageId'>): Message {
    const conversation = this.getConversation(npcId);
    const fullMessage: Message = {
      ...message,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    conversation.messages.push(fullMessage);
    conversation.lastMessageAt = fullMessage.timestamp;
    
    if (message.senderId !== 'player') {
      conversation.unreadCount++;
    }
    
    this.saveConversation(conversation);
    this.eventSystem.emit('conversation:message_added', { npcId, message: fullMessage });
    
    return fullMessage;
  }
  
  markAsRead(npcId: string): void {
    const conversation = this.getConversation(npcId);
    if (conversation.unreadCount > 0) {
      conversation.unreadCount = 0;
      this.saveConversation(conversation);
      this.eventSystem.emit('conversation:marked_read', { npcId });
    }
  }
}
```

#### 2. Create NPC Response Service
```typescript
export class NPCResponseService {
  private npcTemplates: Map<string, NPCTemplate> = new Map();
  
  constructor(private gameState: GameStateManager) {
    this.loadNPCTemplates();
  }
  
  generateResponse(npcId: string, playerMessage: string, context?: any): string {
    const template = this.npcTemplates.get(npcId);
    if (!template) return "I'm not sure how to respond to that.";
    
    const bondLevel = this.gameState.getNPCBondLevel(npcId);
    const recentPets = this.gameState.getRecentPetAcquisitions();
    const recentMemories = this.gameState.getRecentMemories();
    
    // Context-aware response selection
    if (this.containsPetReference(playerMessage) && recentPets.length > 0) {
      return this.generatePetResponse(template, recentPets[0], bondLevel);
    }
    
    if (this.containsMemoryReference(playerMessage) && recentMemories.length > 0) {
      return this.generateMemoryResponse(template, recentMemories[0], bondLevel);
    }
    
    // Default response based on bond level
    const responsePool = this.selectResponsePool(template, bondLevel);
    return this.selectRandomResponse(responsePool);
  }
  
  private generatePetResponse(template: NPCTemplate, pet: Pet, bondLevel: number): string {
    const responses = template.responsePatterns.pet_related;
    const baseResponse = this.selectRandomResponse(responses);
    
    return baseResponse
      .replace('{pet_name}', pet.name)
      .replace('{pet_rarity}', pet.rarity);
  }
}
```

#### 3. Create DM Screen Interface
```typescript
export class DMScreen extends UnifiedBaseScreen {
  private npcId: string = '';
  private conversation: Conversation | null = null;
  
  protected createContent(): string {
    const npc = getNPCById(this.npcId);
    if (!npc) return '<div>NPC not found</div>';
    
    return `
      <div class="dm-screen">
        <div class="dm-header">
          <img src="${getAssetPath(npc.artRefs.portrait)}" alt="${npc.name}" class="npc-avatar" />
          <div class="npc-info">
            <h2 class="npc-name">${npc.name}</h2>
            <div class="bond-level">Bond Level ${this.getBondLevel()}</div>
          </div>
        </div>
        
        <div class="messages-container" id="messages-container">
          ${this.renderMessages()}
        </div>
        
        <div class="message-input-container">
          <div class="quick-replies" id="quick-replies">
            ${this.renderQuickReplies()}
          </div>
          
          <div class="input-row">
            <input type="text" class="message-input" id="message-input" placeholder="Type a message..." />
            <button class="send-btn" id="send-btn">
              <span class="material-icons">send</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  private renderMessages(): string {
    if (!this.conversation) return '';
    
    return this.conversation.messages.map(message => {
      const isPlayer = message.senderId === 'player';
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      
      return `
        <div class="message ${isPlayer ? 'message--player' : 'message--npc'}">
          <div class="message-content">${message.content}</div>
          <div class="message-time">${timestamp}</div>
          ${message.metadata?.bondPointsAwarded ? 
            `<div class="bond-reward">+${message.metadata.bondPointsAwarded} Bond</div>` : ''}
        </div>
      `;
    }).join('');
  }
  
  private async sendMessage(content: string): Promise<void> {
    // Add player message
    const playerMessage = this.conversationManager.addMessage(this.npcId, {
      senderId: 'player',
      content,
      timestamp: Date.now(),
      messageType: 'text'
    });
    
    // Award bond points for messaging
    const bondPoints = this.calculateBondPoints(content);
    if (bondPoints > 0) {
      this.gameState.addBondPoints(this.npcId, bondPoints);
      this.eventSystem.emit('npc:bond_increased', { npcId: this.npcId, points: bondPoints });
    }
    
    // Generate NPC response
    const response = this.npcResponseService.generateResponse(this.npcId, content, {
      bondLevel: this.getBondLevel(),
      recentActivity: this.getRecentActivity()
    });
    
    // Add NPC response with delay for realism
    setTimeout(() => {
      this.conversationManager.addMessage(this.npcId, {
        senderId: this.npcId,
        content: response,
        timestamp: Date.now(),
        messageType: 'text',
        metadata: { bondPointsAwarded: bondPoints }
      });
      
      this.refreshMessages();
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  }
}
```

### Key Features
- **Real-time Messaging**: Immediate UI updates
- **Bond Progression**: XP from conversations
- **Context Awareness**: References recent pets/memories
- **Quick Replies**: Suggested responses
- **Unread Tracking**: Badge notifications
- **Conversation History**: Persistent message storage

---

## Memory Generation and Journal System

### Overview
An automated system that creates narrative memories from gameplay events and provides a journal interface for viewing and sharing them.

### Architecture

#### Core Components
- **MemoryGenerator**: Creates memories from shift events
- **JournalScreen**: Memory browsing interface
- **MemoryDetailScreen**: Individual memory viewer
- **BlogPublisher**: Sharing system integration

#### Data Models
```typescript
export interface Memory {
  id: string;
  shiftId: string;
  content: string; // Short snippet
  extendedStory?: string; // Longer narrative
  imageUrl?: string;
  taggedNPCs: string[];
  taggedPets: string[];
  mood: string;
  location: string;
  timestamp: number;
  isPublished: boolean;
  viewed: boolean;
  favorited: boolean;
  rarity?: 'common' | 'rare' | 'epic';
}

export interface MemoryTemplate {
  template: string;
  requiredPets: number;
  mood: string[];
  rarity: number; // Probability weight
}
```

### Implementation Steps

#### 1. Create Memory Generator
```typescript
export class MemoryGenerator {
  private templates: Record<SectionType, MemoryTemplate[]> = {
    bakery: [
      {
        template: '{pet1} helped taste-test the new cookie recipe. {npc} pretended not to notice.',
        requiredPets: 1,
        mood: ['happy', 'cozy'],
        rarity: 0.7
      },
      {
        template: '{pet1} and {pet2} napped in the warm spot near the ovens while {npc} worked.',
        requiredPets: 2,
        mood: ['peaceful', 'cozy'],
        rarity: 0.5
      }
    ],
    // ... more templates
  };
  
  generateMemory(shift: Shift, assignedPets: Pet[]): Memory {
    const template = this.selectTemplate(shift.sectionType, assignedPets);
    const content = this.fillTemplate(template, assignedPets, shift.helperNpcId);
    const extendedStory = this.generateExtendedStory(shift, assignedPets, content);
    const mood = this.selectMood();
    
    const memory: Memory = {
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      shiftId: shift.shiftId,
      content,
      extendedStory,
      imageUrl: this.generateImageUrl(shift, assignedPets),
      taggedNPCs: [shift.helperNpcId],
      taggedPets: assignedPets.map(p => p.petId),
      mood,
      location: this.getSectionName(shift.sectionType),
      timestamp: Date.now(),
      isPublished: false,
      viewed: false,
      favorited: false
    };
    
    this.gameState.addMemory(memory);
    this.eventSystem.emit('memory:created', { memory });
    
    return memory;
  }
  
  private fillTemplate(template: MemoryTemplate, pets: Pet[], npcId: string): string {
    const npc = getNPCById(npcId);
    let content = template.template;
    
    // Replace NPC placeholder
    content = content.replace(/{npc}/g, npc?.name || 'the helper');
    
    // Replace pet placeholders
    pets.forEach((pet, index) => {
      const placeholder = `{pet${index + 1}}`;
      content = content.replace(new RegExp(placeholder, 'g'), pet.name);
    });
    
    return content;
  }
  
  private generateExtendedStory(shift: Shift, pets: Pet[], baseContent: string): string {
    const extendedTemplates = this.getExtendedTemplates(shift.sectionType);
    const template = this.selectRandomTemplate(extendedTemplates);
    
    return this.fillTemplate({ 
      ...template, 
      template: `${baseContent} ${template.template}` 
    }, pets, shift.helperNpcId);
  }
  
  private generateImageUrl(shift: Shift, pets: Pet[]): string {
    // Logic to select appropriate placeholder image
    if (pets.length === 0) {
      return 'art/memories_image_placeholder_npc_only.png';
    } else if (pets.length === 1) {
      return 'art/memories_image_placeholder_pet_only.png';
    } else {
      return 'art/memories_image_placeholder.png';
    }
  }
}
```

#### 2. Create Journal Interface
```typescript
export class JournalScreen extends UnifiedBaseScreen {
  private memories: Memory[] = [];
  private filters = {
    npc: 'all' as string,
    date: 'all' as string,
    mood: 'all' as string
  };
  
  protected createContent(): string {
    return `
      <div class="journal-screen">
        <div class="journal-header">
          <div class="journal-stats">
            <div class="stat-item">
              <span class="stat-label">Memories This Week</span>
              <span class="stat-value" id="memories-this-week">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Days</span>
              <span class="stat-value" id="total-days">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Memories</span>
              <span class="stat-value" id="total-memories">0</span>
            </div>
          </div>
        </div>
        
        <div class="npc-filter-bar">
          <button class="npc-filter-option active" data-npc="all">
            <span class="filter-icon material-icons">apps</span>
            <span class="filter-label">All</span>
            <span class="memory-count">${this.memories.length}</span>
          </button>
          
          ${this.renderNPCFilters()}
        </div>
        
        <div class="memory-timeline" id="memory-timeline">
          <div class="timeline-content" id="timeline-content">
            ${this.renderMemoryCards()}
          </div>
        </div>
      </div>
    `;
  }
  
  private renderMemoryCards(): string {
    const filteredMemories = this.applyFilters();
    
    if (filteredMemories.length === 0) {
      return `
        <div class="empty-state">
          <span class="material-icons empty-icon">photo_library</span>
          <h3>No memories yet</h3>
          <p>Complete shifts to start creating memories!</p>
        </div>
      `;
    }
    
    return filteredMemories.map(memory => this.createMemoryCard(memory)).join('');
  }
  
  private createMemoryCard(memory: Memory): string {
    const date = new Date(memory.timestamp);
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    
    const snippet = memory.content.length > 80 
      ? memory.content.substring(0, 80) + '...' 
      : memory.content;
    
    return `
      <div class="memory-preview-card ${!memory.viewed ? 'unviewed' : ''}" 
           data-memory-id="${memory.id}">
        <div class="memory-preview-image">
          <img src="${getAssetPath(memory.imageUrl || 'art/memories_image_placeholder.png')}" 
               alt="Memory" />
          <span class="memory-mood-badge mood--${memory.mood}">${memory.mood}</span>
          ${!memory.viewed ? '<span class="new-badge">NEW</span>' : ''}
        </div>
        <div class="memory-preview-content">
          <div class="memory-timestamp">
            <span class="material-icons">schedule</span>
            <span>${timeStr}</span>
          </div>
          <p class="memory-snippet">${snippet}</p>
        </div>
      </div>
    `;
  }
  
  private viewMemory(memoryId: string): void {
    const memory = this.memories.find(m => m.id === memoryId);
    if (!memory) return;
    
    // Mark as viewed
    if (!memory.viewed) {
      memory.viewed = true;
      this.gameState.updatePlayer({ memories: this.memories });
      this.eventSystem.emit('memory:viewed', { memoryId });
    }
    
    // Navigate to detail view
    this.eventSystem.emit('ui:show_screen', {
      screenId: 'memory-detail',
      data: { memoryId }
    });
  }
}
```

#### 3. Create Memory Detail Screen
```typescript
export class MemoryDetailScreen extends UnifiedBaseScreen {
  private memory: Memory | null = null;
  private memories: Memory[] = [];
  private currentIndex = 0;
  
  protected createContent(): string {
    if (!this.memory) return '<div>Memory not found</div>';
    
    return `
      <div class="memory-detail-container">
        <div class="profile-hero">
          <img src="${getAssetPath(this.memory.imageUrl || 'art/memories_image_placeholder.png')}" 
               alt="Memory" class="profile-image" />
        </div>
        
        <div class="profile-header">
          <div class="memory-datetime">
            <span class="memory-date">${this.formatDate(this.memory.timestamp)}</span>
            <span class="time-separator">•</span>
            <span class="memory-time">${this.formatTime(this.memory.timestamp)}</span>
          </div>
          <div class="memory-mood-badge mood--${this.memory.mood}">${this.memory.mood}</div>
        </div>
        
        <div class="profile-story">
          <div class="story-section">
            <h3>The Moment</h3>
            <p class="story-content">${this.memory.content}</p>
          </div>
          
          ${this.memory.extendedStory ? `
            <div class="story-section">
              <h3>The Story</h3>
              <p class="story-content">${this.memory.extendedStory}</p>
            </div>
          ` : ''}
        </div>
        
        <div class="profile-details">
          <div class="detail-card">
            <span class="material-icons detail-icon">place</span>
            <div class="detail-content">
              <span class="detail-label">Location</span>
              <span class="detail-value">${this.memory.location}</span>
            </div>
          </div>
          
          <div class="detail-card">
            <div class="participants">
              <span class="detail-label">With</span>
              <div class="participant-list">
                ${this.renderParticipants()}
              </div>
            </div>
          </div>
        </div>
        
        <div class="profile-actions">
          <button class="btn ${this.memory.favorited ? 'btn-active' : 'btn-secondary'}" 
                  data-action="toggle-favorite">
            <span class="material-icons">${this.memory.favorited ? 'favorite' : 'favorite_border'}</span>
            <span>${this.memory.favorited ? 'Favorited' : 'Favorite'}</span>
          </button>
          
          <button class="btn ${this.memory.isPublished ? 'btn-success' : 'btn-primary'}" 
                  data-action="share" ${this.memory.isPublished ? 'disabled' : ''}>
            <span class="material-icons">${this.memory.isPublished ? 'check_circle' : 'share'}</span>
            <span>${this.memory.isPublished ? 'Shared' : 'Share Moment'}</span>
          </button>
        </div>
        
        <div class="memory-navigation">
          <div class="nav-controls">
            <button class="nav-arrow ${this.currentIndex === 0 ? 'disabled' : ''}" 
                    data-action="prev-memory">
              <span class="material-icons">chevron_left</span>
            </button>
            <span class="nav-counter">${this.currentIndex + 1} of ${this.memories.length}</span>
            <button class="nav-arrow ${this.currentIndex >= this.memories.length - 1 ? 'disabled' : ''}" 
                    data-action="next-memory">
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  private renderParticipants(): string {
    let participants = '';
    
    // Add NPCs
    this.memory?.taggedNPCs?.forEach(npcId => {
      const npc = getNPCById(npcId);
      if (npc) {
        participants += `
          <div class="participant">
            <img src="${getAssetPath(npc.artRefs.portrait)}" 
                 alt="${npc.name}" class="participant-portrait npc" />
            <span class="participant-name">${npc.name}</span>
          </div>
        `;
      }
    });
    
    // Add pets
    this.memory?.taggedPets?.forEach(petId => {
      const pet = getPetById(petId);
      if (pet) {
        participants += `
          <div class="participant">
            <img src="${getAssetPath(pet.artRefs.portrait)}" 
                 alt="${pet.name}" class="participant-portrait pet" />
            <span class="participant-name">${pet.name}</span>
          </div>
        `;
      }
    });
    
    return participants || '<span class="no-participants">Solo moment</span>';
  }
}
```

#### 4. Integration with Sharing System
```typescript
export class BlogPublisher {
  publishMemory(memoryId: string, caption: string, taggedNpcIds: string[]): BlogPost | null {
    const memory = this.gameState.getMemory(memoryId);
    if (!memory || memory.isPublished) return null;
    
    const blogPost: BlogPost = {
      postId: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      memoryId: memory.id,
      authorId: this.gameState.getPlayer().playerId,
      content: {
        imageUrl: memory.imageUrl || 'art/memories_image_placeholder.png',
        caption: caption || memory.content,
        location: memory.location,
        mood: memory.mood,
        petIds: memory.taggedPets
      },
      engagement: { likes: 0, views: 0, subscribersGained: 0, bondPointsEarned: {} },
      publishedAt: Date.now(),
      taggedNpcs: taggedNpcIds,
      reactions: [],
      viral: false
    };
    
    // Mark memory as published
    memory.isPublished = true;
    memory.publishedAt = blogPost.publishedAt;
    memory.caption = caption;
    
    this.storeBlogPost(blogPost);
    this.calculateInitialEngagement(blogPost);
    this.generateNPCReactions(blogPost);
    
    this.eventSystem.emit('blog:post_published', { blogPost });
    return blogPost;
  }
}
```

### Key Features
- **Automatic Generation**: Creates memories from shift events
- **Rich Templates**: Context-aware narrative generation
- **Visual Timeline**: Chronological memory browsing
- **Filtering System**: By NPC, date, mood, etc.
- **Sharing Integration**: Publish to blog/social feed
- **Favorites System**: Personal memory curation
- **Navigation**: Swipe between memories
- **Unread Tracking**: New memory notifications

---

## Additional Considerations

### Performance Optimization
- **Lazy Loading**: Load memories and conversations on demand
- **Virtual Scrolling**: For large memory collections
- **Image Optimization**: Compress and cache placeholder images
- **Event Debouncing**: Prevent excessive UI updates

### Data Persistence
- **Local Storage**: For offline capability
- **Incremental Saves**: Only save changed data
- **Compression**: Reduce storage footprint
- **Migration System**: Handle data structure changes

### Mobile Optimization
- **Touch Gestures**: Swipe navigation for memories
- **Safe Areas**: Handle device notches
- **Performance**: 60fps scrolling and animations
- **Accessibility**: Screen reader support

### Testing Strategy
- **Unit Tests**: Core system logic
- **Integration Tests**: System interactions
- **UI Tests**: User flow validation
- **Performance Tests**: Memory and CPU usage

This guide provides a comprehensive foundation for recreating these systems in new projects. Each system is designed to be modular and extensible, allowing for customization based on specific project needs.
