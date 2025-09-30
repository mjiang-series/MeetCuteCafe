/**
 * MemoryDetailScreen - Individual memory viewer
 * Phase 2: Romance Foundation
 * Based on SYSTEM_RECREATION_GUIDE.md Memory Detail Screen
 */

import { BaseScreen } from '@/ui/BaseScreen';
import { EventSystem } from '@/systems/EventSystem';
import { GameStateManager } from '@/systems/GameStateManager';
import { NPCManager } from '@/systems/NPCManager';
import { MemoryGenerator, Memory } from '@/systems/MemoryGenerator';
import { getAssetPath } from '@/utils/AssetPaths';

export class MemoryDetailScreen extends BaseScreen {
  private memory: Memory | null = null;
  private memories: Memory[] = [];
  private currentIndex = 0;
  private memoryGenerator!: MemoryGenerator;
  private npcManager!: NPCManager;

  constructor(
    eventSystem: EventSystem,
    gameStateManager: GameStateManager
  ) {
    super('memory-detail', eventSystem, gameStateManager, null as any);
    
    // Initialize arrays to prevent undefined errors
    this.memories = [];
  }

  override onShow(data?: { memoryId: string }): void {
    super.onShow();
    
    // Get systems from main game
    const systems = (window as any).game?.getSystems();
    if (systems) {
      this.memoryGenerator = systems.memoryGenerator;
      this.npcManager = systems.npcManager;
    }
    
    if (data?.memoryId && this.memoryGenerator) {
      this.memory = this.memoryGenerator.getMemory(data.memoryId);
      this.memories = this.memoryGenerator.getMemories();
      this.currentIndex = this.memories.findIndex(m => m.id === data.memoryId);
      
      if (this.memory && !this.memory.viewed) {
        this.memoryGenerator.markMemoryAsViewed(data.memoryId);
      }
    }
    
    this.eventSystem.emit('header:set_variant', { variant: 'journal' });
  }

  protected override createContent(): string {
    if (!this.memory) {
      return `
        <div class="memory-detail-error">
          <span class="material-icons">error</span>
          <h3>Memory not found</h3>
          <button class="btn btn-primary" data-action="back">Back to Journal</button>
        </div>
      `;
    }

    return `
      <div class="memory-detail-container">
        <div class="profile-hero">
          <img src="${getAssetPath(this.memory.imageUrl || 'art/memories_image_placeholder.png')}" 
               alt="Memory" class="profile-image" />
          <div class="hero-overlay">
            <div class="memory-rarity ${this.memory.rarity ? `rarity--${this.memory.rarity}` : ''}">
              ${this.memory.rarity || 'common'}
            </div>
          </div>
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

  protected override setupEventListeners(): void {
    super.setupEventListeners();

    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.closest('[data-action]')?.getAttribute('data-action');

      switch (action) {
        case 'back':
          this.goBack();
          break;
        case 'toggle-favorite':
          this.toggleFavorite();
          break;
        case 'share':
          this.shareMemory();
          break;
        case 'prev-memory':
          this.navigateMemory(-1);
          break;
        case 'next-memory':
          this.navigateMemory(1);
          break;
      }
    });
  }

  private renderParticipants(): string {
    if (!this.memory || !this.npcManager) return '<span class="no-participants">Solo moment</span>';
    
    let participants = '';
    
    // Add NPCs
    this.memory.taggedNPCs.forEach(npcId => {
      const npc = this.npcManager.getNPC(npcId);
      if (npc) {
        participants += `
          <div class="participant">
            <img src="${getAssetPath(npc.portraitPath)}" 
                 alt="${npc.name}" class="participant-portrait npc" />
            <span class="participant-name">${npc.name}</span>
          </div>
        `;
      }
    });
    
    // Add pets (when we have pet system)
    this.memory.taggedPets.forEach(petId => {
      participants += `
        <div class="participant">
          <div class="participant-portrait pet placeholder">🐾</div>
          <span class="participant-name">Pet ${petId}</span>
        </div>
      `;
    });
    
    return participants || '<span class="no-participants">Solo moment</span>';
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  }

  private toggleFavorite(): void {
    if (!this.memory || !this.memoryGenerator) return;
    
    const newFavoriteState = this.memoryGenerator.toggleMemoryFavorite(this.memory.id);
    this.memory.favorited = newFavoriteState;
    
    // Update button
    const favoriteBtn = this.element.querySelector('[data-action="toggle-favorite"]');
    if (favoriteBtn) {
      const icon = favoriteBtn.querySelector('.material-icons');
      const text = favoriteBtn.querySelector('span:last-child');
      
      if (icon && text) {
        icon.textContent = newFavoriteState ? 'favorite' : 'favorite_border';
        text.textContent = newFavoriteState ? 'Favorited' : 'Favorite';
        favoriteBtn.className = `btn ${newFavoriteState ? 'btn-active' : 'btn-secondary'}`;
      }
    }
  }

  private shareMemory(): void {
    if (!this.memory) return;
    
    // For now, just mark as published
    // In a full implementation, this would open a sharing dialog
    this.memory.isPublished = true;
    
    const shareBtn = this.element.querySelector('[data-action="share"]') as HTMLButtonElement;
    if (shareBtn) {
      const icon = shareBtn.querySelector('.material-icons');
      const text = shareBtn.querySelector('span:last-child');
      
      if (icon && text) {
        icon.textContent = 'check_circle';
        text.textContent = 'Shared';
        shareBtn.className = 'btn btn-success';
        shareBtn.disabled = true;
      }
    }
    
    console.log('📤 Memory shared:', this.memory.content.substring(0, 50) + '...');
  }

  private navigateMemory(direction: number): void {
    const newIndex = this.currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < this.memories.length) {
      const newMemory = this.memories[newIndex];
      if (newMemory) {
        this.eventSystem.emit('ui:show_screen', {
          screenId: 'memory-detail',
          data: { memoryId: newMemory.id }
        });
      }
    }
  }

  private goBack(): void {
    this.eventSystem.emit('ui:show_screen', { screenId: 'journal' });
  }

  protected getHeaderVariant(): string {
    return 'journal';
  }

  protected generateStyles(): string {
    return `
      .memory-detail-container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      .memory-detail-error {
        text-align: center;
        padding: 60px 20px;
        color: #666;
      }

      .memory-detail-error .material-icons {
        font-size: 64px;
        color: #ddd;
        margin-bottom: 20px;
      }

      .profile-hero {
        position: relative;
        height: 300px;
        overflow: hidden;
      }

      .profile-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .hero-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 100%);
        display: flex;
        align-items: flex-end;
        padding: 20px;
      }

      .memory-rarity {
        background: rgba(255, 255, 255, 0.9);
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
        color: #666;
      }

      .memory-rarity.rarity--rare {
        background: rgba(52, 152, 219, 0.9);
        color: white;
      }

      .memory-rarity.rarity--epic {
        background: rgba(243, 156, 18, 0.9);
        color: white;
      }

      .profile-header {
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eee;
      }

      .memory-datetime {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
      }

      .memory-date {
        font-weight: 500;
      }

      .time-separator {
        color: #ccc;
      }

      .memory-mood-badge {
        background: rgba(0, 0, 0, 0.1);
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        text-transform: capitalize;
      }

      .mood--cozy { background: rgba(139, 69, 19, 0.1); color: #8b4513; }
      .mood--intimate { background: rgba(219, 112, 147, 0.1); color: #db7093; }
      .mood--happy { background: rgba(255, 193, 7, 0.1); color: #ffc107; }
      .mood--sweet { background: rgba(255, 182, 193, 0.1); color: #ffb6c1; }
      .mood--romantic { background: rgba(220, 20, 60, 0.1); color: #dc143c; }
      .mood--peaceful { background: rgba(106, 90, 205, 0.1); color: #6a5acd; }
      .mood--excited { background: rgba(255, 69, 0, 0.1); color: #ff4500; }

      .profile-story {
        padding: 30px;
      }

      .story-section {
        margin-bottom: 30px;
      }

      .story-section:last-child {
        margin-bottom: 0;
      }

      .story-section h3 {
        color: #8e44ad;
        margin-bottom: 15px;
        font-size: 18px;
      }

      .story-content {
        font-size: 16px;
        line-height: 1.6;
        color: #333;
      }

      .profile-details {
        padding: 0 30px 30px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .detail-card {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 12px;
      }

      .detail-icon {
        color: #8e44ad;
        font-size: 24px;
      }

      .detail-content {
        flex: 1;
      }

      .detail-label {
        display: block;
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
        text-transform: uppercase;
        font-weight: 500;
      }

      .detail-value {
        font-size: 16px;
        color: #333;
        font-weight: 500;
      }

      .participants {
        width: 100%;
      }

      .participant-list {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        margin-top: 8px;
      }

      .participant {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .participant-portrait {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        overflow: hidden;
      }

      .participant-portrait img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .participant-portrait.placeholder {
        background: #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }

      .participant-name {
        font-size: 14px;
        color: #333;
        font-weight: 500;
      }

      .no-participants {
        color: #666;
        font-style: italic;
        margin-top: 8px;
      }

      .profile-actions {
        padding: 30px;
        display: flex;
        gap: 15px;
        border-top: 1px solid #eee;
      }

      .btn {
        flex: 1;
        padding: 12px 20px;
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-weight: 500;
      }

      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .btn-secondary {
        border-color: #8e44ad;
        color: #8e44ad;
      }

      .btn-secondary:hover {
        background: #8e44ad;
        color: white;
      }

      .btn-active {
        background: #e74c3c;
        border-color: #e74c3c;
        color: white;
      }

      .btn-primary {
        background: #8e44ad;
        border-color: #8e44ad;
        color: white;
      }

      .btn-success {
        background: #27ae60;
        border-color: #27ae60;
        color: white;
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .memory-navigation {
        padding: 20px 30px;
        border-top: 1px solid #eee;
        background: #f8f9fa;
      }

      .nav-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .nav-arrow {
        width: 40px;
        height: 40px;
        border: 2px solid #8e44ad;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .nav-arrow:hover:not(.disabled) {
        background: #8e44ad;
        color: white;
        transform: scale(1.1);
      }

      .nav-arrow.disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .nav-counter {
        font-weight: 500;
        color: #666;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .memory-detail-container {
          margin: 10px;
          border-radius: 12px;
        }

        .profile-hero {
          height: 250px;
        }

        .profile-header {
          padding: 15px;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .profile-story {
          padding: 20px;
        }

        .profile-details {
          padding: 0 20px 20px;
        }

        .profile-actions {
          padding: 20px;
          flex-direction: column;
        }

        .memory-navigation {
          padding: 15px 20px;
        }

        .participant-list {
          flex-direction: column;
          gap: 10px;
        }
      }
    `;
  }
}
