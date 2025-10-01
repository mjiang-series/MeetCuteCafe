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
  private usedFlavorIds: Set<string> = new Set(); // Track flavors used today
  private currentOrderId: string | null = null; // Track current order being fulfilled

  constructor(
    eventSystem: EventSystem,
    gameState: GameStateManager,
    assetManager: AssetManager,
    orderGenerator?: OrderGenerator
  ) {
    super('orders', eventSystem, gameState, assetManager);
    this.orderGenerator = orderGenerator || null;
    console.log('🏗️ OrdersScreen constructor - OrderGenerator available:', !!this.orderGenerator);
    if (this.orderGenerator) {
      console.log('📊 OrderGenerator active orders:', this.orderGenerator.getActiveOrders().length);
    }
    this.setupOrderEventListeners();
  }

  private get mockOrders(): OrderBase[] {
    // Use OrderGenerator orders if available, otherwise fall back to static mock orders
    if (this.orderGenerator) {
      const generatedOrders = this.orderGenerator.getActiveOrders();
      console.log(`📋 Using OrderGenerator orders: ${generatedOrders.length} orders`);
      return generatedOrders; // Only use generated orders, no static ones
    }
    
    console.log(`📋 Using static mock orders (no OrderGenerator)`);
    if (!this._mockOrders) {
      this._mockOrders = OrdersScreen.createMockOrders();
    }
    return this._mockOrders;
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
    const allOrders = this.mockOrders;
    console.log('🎨 OrdersScreen.createContent - All orders:', allOrders.map(o => ({ id: o.orderId, kind: o.kind })));
    
    const customerOrders = allOrders.filter(order => order.kind === 'Customer');
    const npcOrders = allOrders.filter(order => order.kind === 'NPC');
    
    console.log('🎨 NPC Orders for display:', npcOrders.map(o => o.orderId));

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

        <!-- Flavor Selection Modal (hidden by default) -->
        <div class="flavor-modal" id="flavor-modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="modal-title">Select Flavors</h3>
              <button class="modal-close" data-action="close-flavor-modal">&times;</button>
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
      <div class="order-card order-card--npc ${canFulfill ? '' : 'order-card--locked'}">
        <!-- NPC Info -->
        <div class="order-npc-header">
          <img src="${getNpcPortraitPath(npcId as any)}" alt="${npcName}" class="npc-avatar" />
          <div class="npc-request">
            <div class="npc-name">${npcName}'s Special Request</div>
            <div class="npc-message">"${this.getNPCOrderMessage(npcId)}"</div>
          </div>
        </div>
        
        <!-- Requirements -->
        <div class="order-requirements">
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
        </div>
        
        <!-- Rewards -->
        <div class="order-rewards-section">
          <h4>Rewards:</h4>
          <div class="reward-list">
            <div class="reward-item">
              <span class="reward-icon">🪙</span>
              <span class="reward-value">${order.rewards.coins} Coins</span>
            </div>
            <div class="reward-item">
              <span class="reward-icon">💎</span>
              <span class="reward-value">${order.rewards.diamonds || 0} Diamonds</span>
            </div>
            <div class="reward-item">
              <span class="reward-icon">💕</span>
              <span class="reward-value">New Memory</span>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="order-actions">
          ${canFulfill ? `
            <button class="btn btn--primary btn-fulfill" data-action="select-flavors" data-order-id="${order.orderId}">
              Select Flavors
            </button>
          ` : `
            <div class="insufficient-notice">
              <p>You need more flavors to complete this order.</p>
              <button class="btn btn--secondary" data-navigate="gacha">
                Get More Flavors
              </button>
            </div>
          `}
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
      <div class="order-card order-card--customer ${canFulfill ? '' : 'order-card--locked'} ${urgencyClass}">
        <!-- Customer Info -->
        <div class="order-customer-header">
          <div class="customer-avatar">${this.getCustomerAvatar(order.customerType)}</div>
          <div class="customer-request">
            <div class="customer-name">${order.customerType || `Customer #${order.orderId.slice(-3)}`}</div>
            <div class="order-urgency">
              ${order.urgency === 'high' ? '🔥 Urgent' : order.urgency === 'medium' ? '⚡ Priority' : '☕ Regular'} Order
            </div>
            <div class="order-timer">⏰ ${timeLeft}</div>
          </div>
        </div>
        
        <!-- Requirements -->
        <div class="order-requirements">
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
        </div>
        
        <!-- Rewards -->
        <div class="order-rewards-section">
          <h4>Rewards:</h4>
          <div class="reward-list">
            <div class="reward-item">
              <span class="reward-icon">🪙</span>
              <span class="reward-value">${order.rewards.coins} Coins</span>
            </div>
            ${order.rewards.diamonds ? `
              <div class="reward-item">
                <span class="reward-icon">💎</span>
                <span class="reward-value">${order.rewards.diamonds} Diamonds</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Actions -->
        <div class="order-actions">
          ${canFulfill ? `
            <button class="btn btn--primary btn-fulfill" data-action="select-flavors" data-order-id="${order.orderId}">
              Select Flavors
            </button>
          ` : `
            <div class="insufficient-notice">
              <p>You need more flavors to complete this order.</p>
              <button class="btn btn--secondary" data-navigate="gacha">
                Get More Flavors
              </button>
            </div>
          `}
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
      Fresh: '🍃'
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
    return order.requirements.slots.every(slot => {
      // For now, simplified check - assume player has all affinities at level 1
      // This allows testing of the order completion flow
      const requiredLevel = slot.minLevel || 1;
      return requiredLevel <= 2; // Allow orders up to level 2
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
   * Setup event listeners
   */
  protected override setupEventListeners(): void {
    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.closest('[data-action]')?.getAttribute('data-action');
      const orderId = target.closest('[data-order-id]')?.getAttribute('data-order-id');

      if (action === 'complete-order' && orderId) {
        this.completeOrder(orderId);
      }
    });
  }

  /**
   * Update screen content with latest data
   */
  protected override updateContent(): void {
    console.log('🔄 OrdersScreen.updateContent - Refreshing HTML');
    super.updateContent(); // Use BaseScreen's implementation which handles event listeners properly
  }

  /**
   * Handle screen show - refresh content with latest orders
   */
  override onShow(data?: any): void {
    super.onShow(data);
    console.log('📺 OrdersScreen.onShow - Refreshing content');
    this.updateContent();
    this.eventSystem.emit('header:set_variant', { variant: 'orders' });
  }

  /**
   * Complete an order
   */
  private completeOrder(orderId: string): void {
    console.log(`🔄 Attempting to complete order: ${orderId}`);
    console.log(`🔍 OrderGenerator available:`, !!this.orderGenerator);
    if (this.orderGenerator) {
      const activeOrders = this.orderGenerator.getActiveOrders();
      console.log(`📊 Active orders before completion:`, activeOrders.length);
      console.log(`📋 Active order IDs:`, activeOrders.map(o => o.orderId));
      console.log(`🎯 Trying to complete:`, orderId);
      
      const success = this.orderGenerator.completeOrder(orderId);
      if (success) {
        console.log(`✅ Order ${orderId} completed successfully!`);
        // Update the display
        this.updateContent();
      } else {
        console.error(`❌ Failed to complete order ${orderId}`);
        console.error(`❌ Order ${orderId} not found in active orders`);
      }
    } else {
      console.error('❌ OrderGenerator not available');
    }
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
      case 'select-flavors': {
        const orderId = element.getAttribute('data-order-id');
        if (orderId) {
          this.openFlavorSelectionModal(orderId);
        }
        break;
      }
      
      case 'close-flavor-modal': {
        this.closeFlavorSelectionModal();
        break;
      }
      
      case 'select-flavor-for-slot': {
        const flavorId = element.getAttribute('data-flavor-id');
        const slotIndex = element.getAttribute('data-slot-index');
        if (flavorId && slotIndex !== null) {
          this.selectFlavorForSlot(parseInt(slotIndex), flavorId);
        }
        break;
      }
      
      case 'confirm-fulfill-order': {
        if (this.currentOrderId) {
          this.fulfillOrder(this.currentOrderId);
        }
        break;
      }
      
      default:
        super.handleAction(action, element);
    }
  }

  /**
   * Open flavor selection modal
   */
  private openFlavorSelectionModal(orderId: string): void {
    const order = this.mockOrders.find(o => o.orderId === orderId);
    if (!order) return;

    this.currentOrderId = orderId;
    const modal = this.querySelector('#flavor-modal');
    const body = this.querySelector('#modal-body');

    if (!modal || !body) return;

    const player = this.gameState.getPlayer();
    const selectedFlavors: (string | null)[] = new Array(order.requirements.slots.length).fill(null);

    body.innerHTML = `
      <div class="flavor-selection">
        ${order.requirements.slots.map((slot, index) => {
          const availableFlavors = player.flavors.filter(pf => {
            const flavorDef = this.getFlavorDefinition(pf.flavorId);
            return flavorDef && 
                   flavorDef.affinity === slot.affinity && 
                   pf.level >= (slot.minLevel || 1) &&
                   !this.usedFlavorIds.has(pf.flavorId);
          });

          return `
            <div class="flavor-slot-selection">
              <h4>Slot ${index + 1}: ${slot.affinity} (Lv ${slot.minLevel || 1}+)</h4>
              <div class="flavor-options">
                ${availableFlavors.length > 0 ? availableFlavors.map(pf => {
                  const flavorDef = this.getFlavorDefinition(pf.flavorId);
                  return `
                    <div class="flavor-option" 
                         data-action="select-flavor-for-slot" 
                         data-flavor-id="${pf.flavorId}"
                         data-slot-index="${index}">
                      <span class="flavor-emoji">${this.getAffinityEmoji(slot.affinity)}</span>
                      <div class="flavor-info">
                        <div class="flavor-name">${flavorDef?.name || pf.flavorId}</div>
                        <div class="flavor-level">Level ${pf.level}</div>
                      </div>
                    </div>
                  `;
                }).join('') : '<p class="no-flavors">No available flavors for this slot</p>'}
              </div>
              <div class="selected-flavor" id="selected-${index}">
                <em>No flavor selected</em>
              </div>
            </div>
          `;
        }).join('')}
        
        <div class="modal-actions">
          <button class="btn btn--primary" data-action="confirm-fulfill-order" id="confirm-btn" disabled>
            Confirm Selection
          </button>
          <button class="btn btn--secondary" data-action="close-flavor-modal">Cancel</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    this.bindEventHandlers();
  }

  /**
   * Select flavor for a slot
   */
  private selectedFlavors: Map<number, string> = new Map();

  private selectFlavorForSlot(slotIndex: number, flavorId: string): void {
    this.selectedFlavors.set(slotIndex, flavorId);
    
    // Update UI to show selection
    const selectedDisplay = this.querySelector(`#selected-${slotIndex}`);
    const flavorDef = this.getFlavorDefinition(flavorId);
    if (selectedDisplay) {
      selectedDisplay.innerHTML = `<strong>Selected: ${flavorDef?.name || flavorId}</strong>`;
    }

    // Check if all slots are filled
    const order = this.mockOrders.find(o => o.orderId === this.currentOrderId);
    if (order && this.selectedFlavors.size === order.requirements.slots.length) {
      const confirmBtn = this.querySelector('#confirm-btn');
      if (confirmBtn) {
        confirmBtn.removeAttribute('disabled');
      }
    }
  }

  /**
   * Close flavor selection modal
   */
  private closeFlavorSelectionModal(): void {
    const modal = this.querySelector('#flavor-modal');
    if (modal) {
      modal.style.display = 'none';
      this.selectedFlavors.clear();
      this.currentOrderId = null;
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

    // Mark flavors as used for the day
    this.selectedFlavors.forEach((flavorId) => {
      this.usedFlavorIds.add(flavorId);
    });

    // Award currency rewards
    this.gameState.addCoins(order.rewards.coins);
    if (order.rewards.diamonds) {
      this.gameState.addDiamonds(order.rewards.diamonds);
    }

    // Create memory for NPC orders and track it
    let newMemoryId: string | undefined;
    if (order.kind === 'NPC' && order.rewards.memoryCandidate) {
      newMemoryId = this.createMockMemory(order.npcId!);
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

    // Close modal and navigate to results screen
    this.closeFlavorSelectionModal();
    
    // Navigate to order results screen with order data
    this.eventSystem.emit('ui:show_screen', {
      screenId: 'order-results',
      data: {
        order: order,
        newMemoryId: newMemoryId // Only for NPC orders
      }
    });
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
  private createMockMemory(npcId: string): string {
    const memoryId = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const memory = {
      memoryId: memoryId,
      npcId: npcId as any,
      createdAt: Date.now(),
      keyframeId: 'placeholder',
      summary: `A sweet moment with ${npcId.charAt(0).toUpperCase() + npcId.slice(1)} over their special order.`,
      format: 'Drabble' as const,
      unread: true,
    };

    this.gameState.addMemory(memory);
    return memoryId;
  }

  /**
   * Get flavor definition
   */
  private getFlavorDefinition(flavorId: string): { name: string; affinity: Affinity } | null {
    // This is a simplified version - in reality, you'd get this from GachaSystem
    const flavors: Record<string, { name: string; affinity: Affinity }> = {
      sweet_ambrosia: { name: 'Sweet Ambrosia', affinity: 'Sweet' },
      salty_umami: { name: 'Salty Umami', affinity: 'Salty' },
      // Add more as needed
    };
    return flavors[flavorId] || null;
  }
}

