/**
 * OrderResultsScreen - Shows rewards and Memory preview after order completion
 * Critical for completing the core game loop: Orders → Results → Journal
 */

import { BaseScreen } from '@/ui/BaseScreen';
import { EventSystem } from '@/systems/EventSystem';
import { GameStateManager } from '@/systems/GameStateManager';
import { MemoryGenerator, Memory } from '@/systems/MemoryGenerator';
import { NPCManager } from '@/systems/NPCManager';
import { NpcId } from '@/models/GameTypes';
import { getMemoryPlaceholderPath } from '@/utils/AssetPaths';

export interface OrderResultsData {
  orderId: string;
  rewards: {
    coins: number;
    diamonds?: number;
    memory?: boolean;
  };
  npcId?: NpcId;
  memoryId?: string; // If a memory was generated
  orderType: 'Customer' | 'NPC';
  customerType?: string;
}

export class OrderResultsScreen extends BaseScreen {
  private resultsData: OrderResultsData | null = null;
  private generatedMemory: Memory | null = null;
  private memoryGenerator!: MemoryGenerator;
  private npcManager!: NPCManager;

  constructor(
    eventSystem: EventSystem,
    gameStateManager: GameStateManager
  ) {
    super('order-results', eventSystem, gameStateManager, null as any);
  }

  override onShow(data?: any): void {
    super.onShow();
    
    // Get systems from main game
    const systems = (window as any).game?.getSystems();
    if (systems) {
      this.memoryGenerator = systems.memoryGenerator;
      this.npcManager = systems.npcManager;
    }

    if (data) {
      this.resultsData = data as OrderResultsData;
      
      // Load the generated memory if one exists
      if (data.memoryId && this.memoryGenerator) {
        console.log('🔍 Loading memory with ID:', data.memoryId);
        this.generatedMemory = this.memoryGenerator.getMemory(data.memoryId);
        console.log('💭 Loaded memory:', this.generatedMemory ? 'Found' : 'Not found');
      } else {
        console.log('⚠️ Cannot load memory - memoryId:', data.memoryId, 'memoryGenerator:', !!this.memoryGenerator);
      }
    }

    this.updateContent();
    this.eventSystem.emit('header:set_variant', { variant: 'results', parentContext: 'cafe-hub' });
  }

  protected override createContent(): string {
    if (!this.resultsData) {
      return '<div class="error">No order results to display</div>';
    }

    const { rewards, orderType, customerType, npcId } = this.resultsData;
    const npc = npcId ? this.npcManager?.getNPC(npcId) : null;

    return `
      <div class="order-results-screen">
        <div class="results-header">
          <div class="completion-badge">
            <span class="material-icons completion-icon">check_circle</span>
            <h2>Order Complete!</h2>
          </div>
          
          <div class="order-info">
            ${orderType === 'NPC' && npc ? `
              <div class="npc-info">
                <img src="${npc.portraitPath}" alt="${npc.name}" class="npc-avatar" />
                <span class="npc-name">${npc.name} is delighted!</span>
              </div>
            ` : `
              <div class="customer-info">
                <span class="material-icons customer-icon">person</span>
                <span class="customer-name">${customerType || 'Customer'} satisfied!</span>
              </div>
            `}
          </div>
        </div>

        <div class="rewards-section">
          <h3>Rewards Earned</h3>
          <div class="rewards-grid">
            <div class="reward-item coins">
              <span class="material-icons reward-icon">monetization_on</span>
              <div class="reward-details">
                <span class="reward-amount">+${rewards.coins}</span>
                <span class="reward-label">Coins</span>
              </div>
            </div>
            
            ${rewards.diamonds ? `
              <div class="reward-item diamonds">
                <span class="material-icons reward-icon">diamond</span>
                <div class="reward-details">
                  <span class="reward-amount">+${rewards.diamonds}</span>
                  <span class="reward-label">Diamonds</span>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        ${this.generatedMemory ? this.renderMemoryPreview() : ''}

        <div class="results-actions">
          ${this.generatedMemory ? `
            <button class="btn btn-primary memory-action" data-action="view-memory">
              <span class="material-icons">auto_stories</span>
              View Memory
            </button>
            <button class="btn btn-secondary" data-action="continue">
              Continue
            </button>
          ` : `
            <button class="btn btn-primary" data-action="continue">
              <span class="material-icons">arrow_forward</span>
              Continue
            </button>
          `}
        </div>
      </div>
    `;
  }

  private renderMemoryPreview(): string {
    console.log('🎨 renderMemoryPreview called, generatedMemory:', !!this.generatedMemory);
    if (!this.generatedMemory) {
      console.log('❌ No generatedMemory, returning empty string');
      return '';
    }

    const npc = this.generatedMemory.taggedNPCs[0] ? 
      this.npcManager?.getNPC(this.generatedMemory.taggedNPCs[0]) : null;

    return `
      <div class="memory-preview-section">
        <div class="memory-preview-header">
          <span class="material-icons memory-icon">auto_stories</span>
          <h3>New Memory Created!</h3>
          <span class="new-badge">NEW</span>
        </div>
        
        <div class="memory-preview-card" data-memory-id="${this.generatedMemory.id}">
          <div class="memory-image">
            <img src="${this.generatedMemory.imageUrl || getMemoryPlaceholderPath()}" 
                 alt="Memory" />
            <div class="memory-overlay">
              <span class="memory-mood mood--${this.generatedMemory.mood?.toLowerCase() || 'cozy'}">
                ${this.generatedMemory.mood || 'Cozy'}
              </span>
            </div>
          </div>
          
          <div class="memory-preview-content">
            <div class="memory-participants">
              ${npc ? `
                <img src="${npc.portraitPath}" alt="${npc.name}" class="participant-avatar" />
                <span class="participant-name">with ${npc.name}</span>
              ` : ''}
            </div>
            
            <p class="memory-snippet">${this.generatedMemory.content}</p>
            
            <div class="memory-meta">
              <span class="memory-time">
                <span class="material-icons">schedule</span>
                ${this.formatTime(this.generatedMemory.timestamp)}
              </span>
              <span class="memory-location">
                <span class="material-icons">place</span>
                ${this.generatedMemory.location || 'Café'}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  protected override setupEventListeners(): void {
    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.closest('[data-action]')?.getAttribute('data-action');

      switch (action) {
        case 'view-memory':
          this.viewMemory();
          break;
        case 'continue':
          this.continueToHub();
          break;
      }

      // Memory preview card click
      const memoryCard = target.closest('.memory-preview-card');
      if (memoryCard) {
        this.viewMemory();
      }
    });
  }

  private viewMemory(): void {
    if (!this.generatedMemory) return;

    // Mark memory as viewed and navigate to detail screen
    if (this.memoryGenerator) {
      this.memoryGenerator.markMemoryAsViewed(this.generatedMemory.id);
    }

    this.eventSystem.emit('ui:show_screen', {
      screenId: 'memory-detail',
      data: { memoryId: this.generatedMemory.id }
    });
  }

  private continueToHub(): void {
    this.eventSystem.emit('ui:show_screen', { screenId: 'cafe-hub' });
  }

  private formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  protected generateStyles(): string {
    return `
      .order-results-screen {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: linear-gradient(135deg, #fef7f0 0%, #f8f4f0 100%);
        padding: 20px;
        max-width: 800px;
        margin: 0 auto;
      }

      .results-header {
        text-align: center;
        margin-bottom: 30px;
      }

      .completion-badge {
        margin-bottom: 20px;
      }

      .completion-icon {
        font-size: 4em;
        color: #4caf50;
        margin-bottom: 10px;
      }

      .completion-badge h2 {
        margin: 0;
        color: #2e7d32;
        font-size: 1.8em;
        font-weight: 600;
      }

      .order-info {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
        padding: 15px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .npc-info, .customer-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .npc-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      }

      .customer-icon {
        width: 40px;
        height: 40px;
        background: #e3f2fd;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1976d2;
      }

      .npc-name, .customer-name {
        font-weight: 600;
        color: #333;
      }

      .rewards-section {
        margin-bottom: 30px;
      }

      .rewards-section h3 {
        text-align: center;
        margin-bottom: 20px;
        color: #333;
        font-size: 1.4em;
      }

      .rewards-grid {
        display: flex;
        gap: 20px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .reward-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        min-width: 150px;
        transition: transform 0.2s ease;
      }

      .reward-item:hover {
        transform: translateY(-2px);
      }

      .reward-icon {
        font-size: 2em;
      }

      .reward-item.coins .reward-icon {
        color: #ffa000;
      }

      .reward-item.diamonds .reward-icon {
        color: #e91e63;
      }

      .reward-details {
        display: flex;
        flex-direction: column;
      }

      .reward-amount {
        font-size: 1.2em;
        font-weight: 700;
        color: #333;
      }

      .reward-label {
        font-size: 0.9em;
        color: #666;
      }

      .memory-preview-section {
        margin-bottom: 30px;
        padding: 20px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .memory-preview-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
        position: relative;
      }

      .memory-icon {
        color: #8e44ad;
        font-size: 1.5em;
      }

      .memory-preview-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.3em;
      }

      .new-badge {
        position: absolute;
        right: 0;
        background: #e91e63;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.7em;
        font-weight: 600;
        text-transform: uppercase;
      }

      .memory-preview-card {
        display: flex;
        gap: 20px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .memory-preview-card:hover {
        background: #f0f1f2;
        transform: translateY(-1px);
      }

      .memory-image {
        position: relative;
        width: 120px;
        height: 120px;
        flex-shrink: 0;
      }

      .memory-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
      }

      .memory-overlay {
        position: absolute;
        top: 8px;
        right: 8px;
      }

      .memory-mood {
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: 500;
      }

      .mood--cozy { background: rgba(139, 69, 19, 0.8); }
      .mood--playful { background: rgba(255, 152, 0, 0.8); }
      .mood--tender { background: rgba(233, 30, 99, 0.8); }
      .mood--yearning { background: rgba(103, 58, 183, 0.8); }
      .mood--bittersweet { background: rgba(96, 125, 139, 0.8); }

      .memory-preview-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .memory-participants {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .participant-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: cover;
      }

      .participant-name {
        font-size: 0.9em;
        color: #666;
        font-weight: 500;
      }

      .memory-snippet {
        flex: 1;
        margin: 0;
        color: #333;
        line-height: 1.4;
        font-size: 0.95em;
      }

      .memory-meta {
        display: flex;
        gap: 15px;
        font-size: 0.8em;
        color: #666;
      }

      .memory-time, .memory-location {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .memory-time .material-icons,
      .memory-location .material-icons {
        font-size: 1em;
      }

      .results-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        margin-top: auto;
        padding-top: 20px;
      }

      .btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 1em;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
      }

      .btn-primary {
        background: #8e44ad;
        color: white;
      }

      .btn-primary:hover {
        background: #7d3c98;
        transform: translateY(-1px);
      }

      .btn-secondary {
        background: #ecf0f1;
        color: #333;
      }

      .btn-secondary:hover {
        background: #d5dbdb;
      }

      .memory-action {
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(142, 68, 173, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(142, 68, 173, 0); }
        100% { box-shadow: 0 0 0 0 rgba(142, 68, 173, 0); }
      }

      @media (max-width: 768px) {
        .order-results-screen {
          padding: 15px;
        }
        
        .memory-preview-card {
          flex-direction: column;
          text-align: center;
        }
        
        .memory-image {
          width: 100px;
          height: 100px;
          margin: 0 auto;
        }
        
        .results-actions {
          flex-direction: column;
        }
        
        .btn {
          width: 100%;
          justify-content: center;
        }
      }
    `;
  }
}
