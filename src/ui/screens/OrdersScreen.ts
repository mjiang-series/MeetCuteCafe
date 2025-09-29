/**
 * Orders Screen - View and fulfill customer and NPC orders
 */

import { BaseScreen } from '../BaseScreen';
import type { EventSystem } from '@/systems/EventSystem';
import type { GameStateManager } from '@/systems/GameStateManager';
import type { AssetManager } from '@/systems/AssetManager';
import type { OrderGenerator } from '@/systems/OrderGenerator';
import type { ScreenData } from '../ScreenManager';
import type { OrderBase, Affinity } from '@/models/GameTypes';
import { getNpcPortraitPath } from '@/utils/AssetPaths';

export class OrdersScreen extends BaseScreen {
  private _mockOrders: OrderBase[] | null = null;
  private _staticNPCOrders: OrderBase[] | null = null;
  private orderGenerator: OrderGenerator | null = null;

  constructor(
    eventSystem: EventSystem,
    gameState: GameStateManager,
    assetManager: AssetManager,
    orderGenerator?: OrderGenerator
  ) {
    super('orders', eventSystem, gameState, assetManager);
    this.orderGenerator = orderGenerator || null;
    this.setupOrderEventListeners();
  }

  private get mockOrders(): OrderBase[] {
    // Use OrderGenerator orders if available, otherwise fall back to static mock orders
    if (this.orderGenerator) {
      const generatedOrders = this.orderGenerator.getActiveOrders();
      const staticNPCOrders = this.getStaticNPCOrders();
      return [...generatedOrders, ...staticNPCOrders];
    }
    
    if (!this._mockOrders) {
      this._mockOrders = OrdersScreen.createMockOrders();
    }
    return this._mockOrders;
  }

  private getStaticNPCOrders(): OrderBase[] {
    if (!this._staticNPCOrders) {
      this._staticNPCOrders = OrdersScreen.createMockOrders().filter(o => o.kind === 'NPC');
    }
    return this._staticNPCOrders;
  }

  /**
   * Setup order event listeners
   */
  private setupOrderEventListeners(): void {
    this.eventSystem.on('order:generated', () => {
      if (this.isActive) {
        this.updateContent();
      }
    });

    this.eventSystem.on('order:completed', () => {
      if (this.isActive) {
        this.updateContent();
      }
    });

    this.eventSystem.on('order:expired', () => {
      if (this.isActive) {
        this.updateContent();
      }
    });
  }

  protected createContent(): string {
    const customerOrders = this.mockOrders.filter(order => order.kind === 'Customer');
    const npcOrders = this.mockOrders.filter(order => order.kind === 'NPC');

    return `
      <div class="orders-screen">
        <div class="orders-header">
          <h2>Today's Orders</h2>
          <div class="orders-summary">
            <div class="summary-item">
              <span class="summary-label">Customer Orders</span>
              <span class="summary-value">${customerOrders.length}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">NPC Orders</span>
              <span class="summary-value">${npcOrders.length}</span>
            </div>
          </div>
        </div>

        <div class="orders-content">
          <!-- NPC Orders Section -->
          <div class="orders-section">
            <div class="section-header">
              <h3>💕 Special Orders (NPCs)</h3>
              <p class="section-description">Complete these to create memories and deepen relationships</p>
            </div>
            
            <div class="orders-grid">
              ${npcOrders.map(order => this.renderNPCOrder(order)).join('')}
            </div>
          </div>

          <!-- Customer Orders Section -->
          <div class="orders-section">
            <div class="section-header">
              <h3>☕ Customer Orders</h3>
              <p class="section-description">Daily orders from café visitors</p>
            </div>
            
            <div class="orders-grid">
              ${customerOrders.map(order => this.renderCustomerOrder(order)).join('')}
            </div>
          </div>
        </div>

        <!-- Order Fulfillment Modal (hidden by default) -->
        <div class="order-modal" id="order-modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="modal-title">Fulfill Order</h3>
              <button class="modal-close" data-action="close-modal">&times;</button>
            </div>
            <div class="modal-body" id="modal-body">
              <!-- Content populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render NPC order card
   */
  private renderNPCOrder(order: OrderBase): string {
    const npcId = order.npcId!;
    const npcName = npcId.charAt(0).toUpperCase() + npcId.slice(1);
    const canFulfill = this.canFulfillOrder(order);
    
    return `
      <div class="order-card order-card--npc ${canFulfill ? '' : 'order-card--locked'}"
           data-action="open-order" 
           data-order-id="${order.orderId}">
        <div class="order-header">
          <div class="order-npc">
            <img src="${getNpcPortraitPath(npcId as any)}" alt="${npcName}" class="npc-avatar-small" />
            <div class="npc-info">
              <div class="npc-name">${npcName}</div>
              <div class="order-type">Special Request</div>
            </div>
          </div>
          <div class="order-rewards">
            <div class="reward-item">
              <span class="reward-icon">🪙</span>
              <span class="reward-value">${order.rewards.coins}</span>
            </div>
            <div class="reward-item">
              <span class="reward-icon">💎</span>
              <span class="reward-value">${order.rewards.diamonds || 0}</span>
            </div>
            <div class="reward-item memory-reward">
              <span class="reward-icon">💕</span>
              <span class="reward-label">Memory</span>
            </div>
          </div>
        </div>
        
        <div class="order-requirements">
          <h4>Required Flavors:</h4>
          <div class="flavor-slots">
            ${order.requirements.slots.map((slot, index) => this.renderFlavorSlot(slot, index)).join('')}
          </div>
        </div>
        
        <div class="order-footer">
          ${canFulfill ? 
            '<div class="order-status order-status--ready">Ready to fulfill!</div>' :
            '<div class="order-status order-status--locked">Need more flavors</div>'
          }
        </div>
      </div>
    `;
  }

  /**
   * Render customer order card
   */
  private renderCustomerOrder(order: OrderBase): string {
    const canFulfill = this.canFulfillOrder(order);
    const urgencyClass = order.urgency ? `order-card--${order.urgency}` : '';
    const timeLeft = this.formatTimeLeft(order.expiresAt - Date.now());
    
    return `
      <div class="order-card order-card--customer ${canFulfill ? '' : 'order-card--locked'} ${urgencyClass}"
           data-action="open-order" 
           data-order-id="${order.orderId}">
        <div class="order-header">
          <div class="order-customer">
            <div class="customer-avatar">${this.getCustomerAvatar(order.customerType)}</div>
            <div class="customer-info">
              <div class="customer-name">${order.customerType || `Customer #${order.orderId.slice(-3)}`}</div>
              <div class="order-type">
                ${order.urgency === 'high' ? '🔥 Urgent' : order.urgency === 'medium' ? '⚡ Priority' : 'Regular'} Order
                <span class="order-timer">⏰ ${timeLeft}</span>
              </div>
            </div>
          </div>
          <div class="order-rewards">
            <div class="reward-item">
              <span class="reward-icon">🪙</span>
              <span class="reward-value">${order.rewards.coins}</span>
            </div>
            ${order.rewards.diamonds ? `
              <div class="reward-item">
                <span class="reward-icon">💎</span>
                <span class="reward-value">${order.rewards.diamonds}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="order-requirements">
          <h4>Required Flavors:</h4>
          <div class="flavor-slots">
            ${order.requirements.slots.map((slot, index) => this.renderFlavorSlot(slot, index)).join('')}
          </div>
        </div>
        
        <div class="order-footer">
          ${canFulfill ? 
            '<div class="order-status order-status--ready">Ready to fulfill!</div>' :
            '<div class="order-status order-status--locked">Need more flavors</div>'
          }
        </div>
      </div>
    `;
  }

  /**
   * Render flavor slot requirement
   */
  private renderFlavorSlot(slot: { affinity: Affinity; minLevel?: number }, _index: number): string {
    const emoji = this.getAffinityEmoji(slot.affinity);
    const level = slot.minLevel || 1;
    
    return `
      <div class="flavor-slot">
        <div class="slot-affinity">${emoji}</div>
        <div class="slot-info">
          <div class="slot-name">${slot.affinity}</div>
          <div class="slot-level">Lv ${level}+</div>
        </div>
      </div>
    `;
  }

  /**
   * Get emoji for affinity
   */
  private getAffinityEmoji(affinity: Affinity): string {
    const emojiMap: Record<Affinity, string> = {
      Sweet: '🍯',
      Salty: '🧂',
      Bitter: '☕',
      Spicy: '🌶️',
      Fresh: '🍃',
    };
    return emojiMap[affinity] || '❓';
  }

  /**
   * Get customer avatar based on type
   */
  private getCustomerAvatar(customerType?: string): string {
    const avatarMap: Record<string, string> = {
      'Regular Customer': '👤',
      'Coffee Enthusiast': '☕',
      'Sweet Tooth': '🍯',
      'Adventurous Eater': '🌟',
      'Health Conscious': '🥗',
      'Busy Professional': '💼',
      'Student': '🎓',
      'Food Blogger': '📱'
    };
    return avatarMap[customerType || ''] || '👤';
  }

  /**
   * Format time left until expiry
   */
  private formatTimeLeft(milliseconds: number): string {
    if (milliseconds <= 0) return 'Expired';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }


  /**
   * Check if player can fulfill order
   */
  private canFulfillOrder(order: OrderBase): boolean {
    const player = this.gameState.getPlayer();
    
    return order.requirements.slots.every(slot => {
      const playerFlavor = player.flavors.find(f => {
        // For now, just check if they have any flavor (simplified)
        // TODO: Implement proper flavor matching by affinity
        return f.level >= (slot.minLevel || 1);
      });
      return playerFlavor !== undefined;
    });
  }

  /**
   * Generate mock orders for testing
   */
  private static createMockOrders(): OrderBase[] {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Mock NPC orders
    const npcOrders: OrderBase[] = [
      {
        orderId: 'npc_aria_001',
        kind: 'NPC',
        createdAt: now,
        expiresAt: now + oneHour * 8,
        npcId: 'aria',
        requirements: {
          slots: [
            { affinity: 'Sweet', minLevel: 1 },
            { affinity: 'Fresh', minLevel: 1 }
          ]
        },
        rewards: {
          coins: 200,
          diamonds: 15,
          memoryCandidate: true
        },
        status: 'available'
      },
      {
        orderId: 'npc_kai_001',
        kind: 'NPC',
        createdAt: now,
        expiresAt: now + oneHour * 8,
        npcId: 'kai',
        requirements: {
          slots: [
            { affinity: 'Spicy', minLevel: 1 }
          ]
        },
        rewards: {
          coins: 180,
          diamonds: 12,
          memoryCandidate: true
        },
        status: 'available'
      }
    ];

    // Mock customer orders
    const customerOrders: OrderBase[] = [
      {
        orderId: 'customer_001',
        kind: 'Customer',
        createdAt: now,
        expiresAt: now + oneHour * 4,
        requirements: {
          slots: [{ affinity: 'Sweet' }]
        },
        rewards: { coins: 50 },
        status: 'available'
      },
      {
        orderId: 'customer_002',
        kind: 'Customer',
        createdAt: now,
        expiresAt: now + oneHour * 4,
        requirements: {
          slots: [
            { affinity: 'Bitter' },
            { affinity: 'Sweet' }
          ]
        },
        rewards: { coins: 120 },
        status: 'available'
      },
      {
        orderId: 'customer_003',
        kind: 'Customer',
        createdAt: now,
        expiresAt: now + oneHour * 4,
        requirements: {
          slots: [
            { affinity: 'Salty', minLevel: 2 },
            { affinity: 'Spicy' },
            { affinity: 'Fresh' }
          ]
        },
        rewards: { 
          coins: 250,
          diamonds: 5 
        },
        status: 'available'
      }
    ];

    return [...npcOrders, ...customerOrders];
  }


  /**
   * Handle screen show
   */
  protected override onScreenShow(_data?: ScreenData): void {
    this.eventSystem.emit('header:set_variant', { variant: 'orders' });
  }

  /**
   * Handle actions
   */
  protected override handleAction(action: string, element: HTMLElement): void {
    switch (action) {
      case 'open-order': {
        const orderId = element.getAttribute('data-order-id');
        if (orderId) {
          this.openOrderModal(orderId);
        }
        break;
      }
      
      case 'close-modal': {
        this.closeOrderModal();
        break;
      }
      
      case 'fulfill-order': {
        const orderId = element.getAttribute('data-order-id');
        if (orderId) {
          this.fulfillOrder(orderId);
        }
        break;
      }
      
      default:
        super.handleAction(action, element);
    }
  }

  /**
   * Open order fulfillment modal
   */
  private openOrderModal(orderId: string): void {
    const order = this.mockOrders.find(o => o.orderId === orderId);
    if (!order) return;

    const modal = this.querySelector('#order-modal');
    const title = this.querySelector('#modal-title');
    const body = this.querySelector('#modal-body');

    if (!modal || !title || !body) return;

    const isNPC = order.kind === 'NPC';
    const npcName = isNPC ? order.npcId!.charAt(0).toUpperCase() + order.npcId!.slice(1) : '';
    
    title.textContent = isNPC ? `${npcName}'s Special Request` : 'Customer Order';
    
    body.innerHTML = `
      <div class="order-details">
        ${isNPC ? `
          <div class="order-npc-info">
            <img src="${getNpcPortraitPath(order.npcId! as any)}" alt="${npcName}" class="npc-avatar" />
            <div class="npc-message">
              <p>"${this.getNPCOrderMessage(order.npcId!)}"</p>
            </div>
          </div>
        ` : ''}
        
        <div class="fulfillment-area">
          <h4>Required Flavors:</h4>
          <div class="flavor-requirements">
            ${order.requirements.slots.map(slot => `
              <div class="required-flavor">
                <span class="flavor-emoji">${this.getAffinityEmoji(slot.affinity)}</span>
                <span class="flavor-name">${slot.affinity}</span>
                <span class="flavor-level">Lv ${slot.minLevel || 1}+</span>
              </div>
            `).join('')}
          </div>
          
          <div class="rewards-preview">
            <h4>Rewards:</h4>
            <div class="reward-list">
              <div class="reward">🪙 ${order.rewards.coins} Coins</div>
              ${order.rewards.diamonds ? `<div class="reward">💎 ${order.rewards.diamonds} Diamonds</div>` : ''}
              ${order.rewards.memoryCandidate ? '<div class="reward special">💕 New Memory</div>' : ''}
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          ${this.canFulfillOrder(order) ? `
            <button class="btn btn--primary" data-action="fulfill-order" data-order-id="${order.orderId}">
              Fulfill Order
            </button>
          ` : `
            <div class="insufficient-notice">
              <p>You need more flavors to complete this order.</p>
              <button class="btn btn--secondary" data-navigate="flavor-collection">
                Manage Flavors
              </button>
            </div>
          `}
          <button class="btn btn--secondary" data-action="close-modal">Cancel</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    this.bindEventHandlers(); // Re-bind for new modal content
  }

  /**
   * Close order modal
   */
  private closeOrderModal(): void {
    const modal = this.querySelector('#order-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Fulfill order (mock implementation)
   */
  private fulfillOrder(orderId: string): void {
    const order = this.mockOrders.find(o => o.orderId === orderId);
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    console.log(`Fulfilling ${order.kind} order: ${orderId}`, order);

    // Award currency rewards
    this.gameState.addCoins(order.rewards.coins);
    if (order.rewards.diamonds) {
      this.gameState.addDiamonds(order.rewards.diamonds);
    }

    // Create memory for NPC orders
    if (order.kind === 'NPC' && order.rewards.memoryCandidate) {
      this.createMockMemory(order.npcId!);
    }

    // Remove order from list
    if (this.orderGenerator && order.kind === 'Customer') {
      // Use OrderGenerator to complete customer orders
      console.log(`Completing customer order via OrderGenerator: ${orderId}`);
      this.orderGenerator.completeOrder(orderId);
    } else if (order.kind === 'NPC') {
      // Handle static NPC orders
      console.log(`Completing NPC order: ${orderId}, current NPC orders:`, this._staticNPCOrders?.length);
      if (this._staticNPCOrders) {
        const beforeCount = this._staticNPCOrders.length;
        this._staticNPCOrders = this._staticNPCOrders.filter(o => o.orderId !== orderId);
        const afterCount = this._staticNPCOrders.length;
        console.log(`NPC orders: ${beforeCount} -> ${afterCount}`);
      }
    } else {
      // Handle other static mock orders
      console.log(`Completing other static order: ${orderId}`);
      this._mockOrders = this.mockOrders.filter(o => o.orderId !== orderId);
    }

    // Show success and refresh
    this.showSuccess(`Order completed! Earned ${order.rewards.coins} coins${order.rewards.diamonds ? ` and ${order.rewards.diamonds} diamonds` : ''}`);
    
    this.closeOrderModal();
    this.updateContent();
  }

  /**
   * Get NPC order message
   */
  private getNPCOrderMessage(npcId: string): string {
    const messages: Record<string, string> = {
      aria: "I'm working on a new recipe and could use something sweet and fresh to inspire me!",
      kai: "I've been craving something with a kick to it. Something spicy would be perfect!",
      elias: "I'm in the mood for something sophisticated. Surprise me with your best flavors!"
    };
    return messages[npcId] || "I'd love something special today!";
  }

  /**
   * Create mock memory (placeholder)
   */
  private createMockMemory(npcId: string): void {
    const memory = {
      memoryId: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      npcId: npcId as any,
      createdAt: Date.now(),
      keyframeId: 'placeholder',
      summary: `A sweet moment with ${npcId.charAt(0).toUpperCase() + npcId.slice(1)} over their special order.`,
      format: 'Drabble' as const,
      unread: true,
    };

    this.gameState.addMemory(memory);
    this.showSuccess(`💕 A new memory was created with ${npcId.charAt(0).toUpperCase() + npcId.slice(1)}!`);
  }
}
