/**
 * JournalScreen - Memory browsing interface
 * Phase 2: Romance Foundation
 * Based on SYSTEM_RECREATION_GUIDE.md Journal System
 */

import { BaseScreen } from '@/ui/BaseScreen';
import { EventSystem } from '@/systems/EventSystem';
import { GameStateManager } from '@/systems/GameStateManager';
import { NPCManager } from '@/systems/NPCManager';
import { MemoryGenerator, Memory } from '@/systems/MemoryGenerator';
import { NpcId } from '@/models/GameTypes';
import { getAssetPath } from '@/utils/AssetPaths';

export class JournalScreen extends BaseScreen {
  private memories: Memory[] = [];
  private memoryGenerator!: MemoryGenerator;
  private npcManager!: NPCManager;
  private filters = {
    npc: 'all' as string,
    date: 'all' as string,
    mood: 'all' as string
  };

  constructor(
    eventSystem: EventSystem,
    gameStateManager: GameStateManager
  ) {
    super('journal', eventSystem, gameStateManager, null as any);
    
    // Initialize arrays and objects to prevent undefined errors
    this.memories = [];
    this.filters = {
      npc: 'all' as string,
      date: 'all' as string,
      mood: 'all' as string
    };
  }

  override onShow(): void {
    super.onShow();
    
    // Get systems from main game
    const systems = (window as any).game?.getSystems();
    if (systems) {
      this.memoryGenerator = systems.memoryGenerator;
      this.npcManager = systems.npcManager;
    }
    
    this.loadMemories();
    this.eventSystem.emit('header:set_variant', { variant: 'journal' });
  }

  protected override createContent(): string {
    return `
      <div class="journal-screen">
        <div class="journal-header">
          <div class="journal-stats">
            <div class="stat-item">
              <span class="stat-label">Memories This Week</span>
              <span class="stat-value" id="memories-this-week">${this.getMemoriesThisWeek()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Memories</span>
              <span class="stat-value" id="total-memories">${this.memories ? this.memories.length : 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Favorites</span>
              <span class="stat-value" id="favorite-memories">${this.getFavoriteCount()}</span>
            </div>
          </div>
        </div>
        
        <div class="npc-filter-bar">
          <button class="npc-filter-option ${this.filters && this.filters.npc === 'all' ? 'active' : ''}" data-npc="all">
            <span class="filter-icon material-icons">apps</span>
            <span class="filter-label">All</span>
            <span class="memory-count">${this.memories ? this.memories.length : 0}</span>
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

  protected override setupEventListeners(): void {
    super.setupEventListeners();

    // NPC filter buttons
    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const filterBtn = target.closest('.npc-filter-option') as HTMLElement;
      
      if (filterBtn) {
        const npcId = filterBtn.dataset.npc;
        if (npcId) {
          this.setNPCFilter(npcId);
        }
      }
      
      // Memory card clicks
      const memoryCard = target.closest('.memory-preview-card') as HTMLElement;
      if (memoryCard) {
        const memoryId = memoryCard.dataset.memoryId;
        if (memoryId) {
          this.viewMemory(memoryId);
        }
      }
    });

    // Listen for new memories
    this.eventSystem.on('memory:created', () => {
      if (this.isActive) {
        this.loadMemories();
        this.updateContent();
      }
    });
  }

  private loadMemories(): void {
    if (this.memoryGenerator) {
      this.memories = this.memoryGenerator.getMemories();
    }
  }

  private renderNPCFilters(): string {
    if (!this.npcManager) return '';
    
    const npcs = this.npcManager.getAllNPCs();
    if (!npcs) return '';
    
    return npcs.map(npc => {
      const npcMemories = this.memories ? this.memories.filter(m => m.taggedNPCs.includes(npc.id)) : [];
      const isActive = this.filters && this.filters.npc === npc.id;
      
      return `
        <button class="npc-filter-option ${isActive ? 'active' : ''}" data-npc="${npc.id}">
          <div class="npc-avatar-small">
            <img src="${getAssetPath(npc.portraitPath)}" alt="${npc.name}" />
          </div>
          <span class="filter-label">${npc.name}</span>
          <span class="memory-count">${npcMemories.length}</span>
        </button>
      `;
    }).join('');
  }

  private renderMemoryCards(): string {
    const filteredMemories = this.applyFilters();
    
    if (filteredMemories.length === 0) {
      return `
        <div class="empty-state">
          <span class="material-icons empty-icon">photo_library</span>
          <h3>No memories yet</h3>
          <p>Complete orders with NPCs to start creating memories!</p>
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
    
    const rarityClass = memory.rarity ? `rarity--${memory.rarity}` : '';
    
    return `
      <div class="memory-preview-card ${!memory.viewed ? 'unviewed' : ''} ${rarityClass}" 
           data-memory-id="${memory.id}">
        <div class="memory-preview-image">
          <img src="${getAssetPath(memory.imageUrl || 'art/memories_image_placeholder.png')}" 
               alt="Memory" />
          <span class="memory-mood-badge mood--${memory.mood}">${memory.mood}</span>
          ${!memory.viewed ? '<span class="new-badge">NEW</span>' : ''}
          ${memory.favorited ? '<span class="favorite-badge"><span class="material-icons">favorite</span></span>' : ''}
        </div>
        <div class="memory-preview-content">
          <div class="memory-timestamp">
            <span class="material-icons">schedule</span>
            <span>${timeStr}</span>
          </div>
          <p class="memory-snippet">${snippet}</p>
          <div class="memory-location">
            <span class="material-icons">place</span>
            <span>${memory.location}</span>
          </div>
        </div>
      </div>
    `;
  }

  private applyFilters(): Memory[] {
    if (!this.memories) return [];
    let filtered = [...this.memories];
    
    // NPC filter
    if (this.filters && this.filters.npc !== 'all') {
      filtered = filtered.filter(memory => 
        memory.taggedNPCs.includes(this.filters.npc as NpcId)
      );
    }
    
    // Date filter (could be expanded)
    if (this.filters && this.filters.date === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(memory => 
        memory.timestamp >= today.getTime()
      );
    } else if (this.filters && this.filters.date === 'week') {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(memory => 
        memory.timestamp >= weekAgo
      );
    }
    
    // Mood filter
    if (this.filters && this.filters.mood !== 'all') {
      filtered = filtered.filter(memory => 
        memory.mood === this.filters.mood
      );
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  private setNPCFilter(npcId: string): void {
    if (this.filters) {
      this.filters.npc = npcId;
    }
    
    // Update active filter button
    this.element.querySelectorAll('.npc-filter-option').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = this.element.querySelector(`[data-npc="${npcId}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    // Update memory display
    const timelineContent = this.element.querySelector('#timeline-content');
    if (timelineContent) {
      timelineContent.innerHTML = this.renderMemoryCards();
    }
  }

  private viewMemory(memoryId: string): void {
    if (!this.memoryGenerator) return;
    
    const memory = this.memoryGenerator.getMemory(memoryId);
    if (!memory) return;
    
    // Mark as viewed
    if (!memory.viewed) {
      this.memoryGenerator.markMemoryAsViewed(memoryId);
      
      // Update the card visually
      const card = this.element.querySelector(`[data-memory-id="${memoryId}"]`);
      if (card) {
        card.classList.remove('unviewed');
        const newBadge = card.querySelector('.new-badge');
        if (newBadge) {
          newBadge.remove();
        }
      }
    }
    
    // Navigate to detail view
    this.eventSystem.emit('ui:show_screen', {
      screenId: 'memory-detail',
      data: { memoryId }
    });
  }

  private getMemoriesThisWeek(): number {
    if (!this.memories) return 0;
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return this.memories.filter(memory => 
      memory.timestamp >= weekAgo
    ).length;
  }

  private getFavoriteCount(): number {
    if (!this.memories) return 0;
    return this.memories.filter(memory => memory.favorited).length;
  }

  protected getHeaderVariant(): string {
    return 'journal';
  }

  protected generateStyles(): string {
    return `
      .journal-screen {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .journal-header {
        margin-bottom: 30px;
      }

      .journal-stats {
        display: flex;
        gap: 30px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .stat-item {
        text-align: center;
      }

      .stat-label {
        display: block;
        font-size: 14px;
        color: #666;
        margin-bottom: 5px;
      }

      .stat-value {
        display: block;
        font-size: 24px;
        font-weight: bold;
        color: #8e44ad;
      }

      .npc-filter-bar {
        display: flex;
        gap: 10px;
        margin-bottom: 30px;
        overflow-x: auto;
        padding: 10px 0;
      }

      .npc-filter-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border: 2px solid #e0e0e0;
        border-radius: 25px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        min-width: fit-content;
      }

      .npc-filter-option:hover {
        border-color: #8e44ad;
        transform: translateY(-2px);
      }

      .npc-filter-option.active {
        background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%);
        border-color: #8e44ad;
        color: white;
      }

      .npc-avatar-small {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        overflow: hidden;
      }

      .npc-avatar-small img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .filter-label {
        font-weight: 500;
      }

      .memory-count {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
      }

      .npc-filter-option.active .memory-count {
        background: rgba(255, 255, 255, 0.3);
      }

      .memory-timeline {
        position: relative;
      }

      .timeline-content {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }

      .memory-preview-card {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
      }

      .memory-preview-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }

      .memory-preview-card.unviewed {
        border: 2px solid #8e44ad;
        box-shadow: 0 4px 12px rgba(142, 68, 173, 0.2);
      }

      .memory-preview-card.rarity--rare {
        border: 2px solid #3498db;
      }

      .memory-preview-card.rarity--epic {
        border: 2px solid #f39c12;
        background: linear-gradient(135deg, #fff 0%, #fef9e7 100%);
      }

      .memory-preview-image {
        position: relative;
        height: 200px;
        overflow: hidden;
      }

      .memory-preview-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .memory-mood-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        text-transform: capitalize;
      }

      .mood--cozy { background: rgba(139, 69, 19, 0.8); }
      .mood--intimate { background: rgba(219, 112, 147, 0.8); }
      .mood--happy { background: rgba(255, 193, 7, 0.8); }
      .mood--sweet { background: rgba(255, 182, 193, 0.8); }
      .mood--romantic { background: rgba(220, 20, 60, 0.8); }
      .mood--peaceful { background: rgba(106, 90, 205, 0.8); }
      .mood--excited { background: rgba(255, 69, 0, 0.8); }

      .new-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background: #e74c3c;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
      }

      .favorite-badge {
        position: absolute;
        bottom: 12px;
        right: 12px;
        background: rgba(231, 76, 60, 0.9);
        color: white;
        padding: 6px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .favorite-badge .material-icons {
        font-size: 16px;
      }

      .memory-preview-content {
        padding: 16px;
      }

      .memory-timestamp {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #666;
        font-size: 12px;
        margin-bottom: 8px;
      }

      .memory-timestamp .material-icons {
        font-size: 14px;
      }

      .memory-snippet {
        font-size: 14px;
        line-height: 1.4;
        color: #333;
        margin-bottom: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .memory-location {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #8e44ad;
        font-size: 12px;
        font-weight: 500;
      }

      .memory-location .material-icons {
        font-size: 14px;
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #666;
        grid-column: 1 / -1;
      }

      .empty-icon {
        font-size: 64px;
        color: #ddd;
        margin-bottom: 20px;
      }

      .empty-state h3 {
        margin-bottom: 10px;
        color: #333;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .journal-screen {
          padding: 15px;
        }

        .journal-stats {
          gap: 20px;
        }

        .stat-value {
          font-size: 20px;
        }

        .timeline-content {
          grid-template-columns: 1fr;
          gap: 15px;
        }

        .npc-filter-bar {
          gap: 8px;
        }

        .npc-filter-option {
          padding: 10px 14px;
          font-size: 14px;
        }
      }
    `;
  }
}
