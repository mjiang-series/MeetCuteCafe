/**
 * Main entry point for Meet Cute Cafe
 */

// Import styles
import '@/styles/responsive.css';
import '@/styles/screens.css';

import { EventSystem } from '@/systems/EventSystem';
import { GameStateManager } from '@/systems/GameStateManager';
import { AssetManager } from '@/systems/AssetManager';
import { OrderGenerator } from '@/systems/OrderGenerator';
import { NPCManager } from '@/systems/NPCManager';
import { MemoryGenerator } from '@/systems/MemoryGenerator';
import { ConversationManager } from '@/systems/ConversationManager';
import { ScreenManager } from '@/ui/ScreenManager';
import { PersistentHeader } from '@/ui/PersistentHeader';
import { CafeHubScreen } from '@/ui/screens/CafeHubScreen';
import { OrdersScreen } from '@/ui/screens/OrdersScreen';
import { FlavorCollectionScreen } from '@/ui/screens/FlavorCollectionScreen';
import { JournalScreen } from '@/ui/screens/JournalScreen';
import { MemoryDetailScreen } from '@/ui/screens/MemoryDetailScreen';
import { DMScreen } from '@/ui/screens/DMScreen';
import { ConversationHistoryScreen } from '@/ui/screens/ConversationHistoryScreen';
import { OrderResultsScreen } from '@/ui/screens/OrderResultsScreen';

// Import styles
import '@/styles/screens.css';

class MeetCuteCafeGame {
  private eventSystem: EventSystem;
  private gameStateManager: GameStateManager;
  private assetManager: AssetManager;
  private orderGenerator: OrderGenerator;
  private npcManager: NPCManager;
  private memoryGenerator: MemoryGenerator;
  private conversationManager: ConversationManager;
  private screenManager: ScreenManager;
  private persistentHeader: PersistentHeader;

  constructor() {
    this.eventSystem = new EventSystem();
    this.gameStateManager = new GameStateManager(this.eventSystem);
    this.assetManager = new AssetManager(this.eventSystem);
    this.orderGenerator = new OrderGenerator(this.eventSystem);
    this.npcManager = new NPCManager(this.eventSystem, this.gameStateManager);
    this.memoryGenerator = new MemoryGenerator(this.eventSystem, this.gameStateManager, this.npcManager);
    this.conversationManager = new ConversationManager(this.eventSystem, this.gameStateManager, this.npcManager);
    // ScreenManager and PersistentHeader will be initialized after UI setup
    this.screenManager = null as any; // Temporary
    this.persistentHeader = null as any; // Temporary

    this.setupEventListeners();
  }

  async initialize(): Promise<void> {
    try {
      console.log('🎮 Initializing Meet Cute Cafe...');

      // Validate critical assets first
      const assetValidation = await this.assetManager.validateCriticalAssets();
      if (!assetValidation.valid) {
        console.warn('Some assets are missing:', assetValidation.missing);
        // Continue anyway for development
      }

      // Preload critical assets
      await this.assetManager.preloadCriticalAssets();
      console.log('✅ Assets preloaded');

      // Load or create player data
      await this.gameStateManager.loadGame();
      console.log('✅ Game state loaded');

      // Initialize UI first
      this.initializeUI();
      
      // Now initialize screen manager and header
      this.screenManager = new ScreenManager(this.eventSystem);
      this.persistentHeader = new PersistentHeader(this.eventSystem, this.gameStateManager);
      
      // Insert persistent header after it's created
      this.insertPersistentHeader();
      
      // Initialize screens
      this.initializeScreens();
      console.log('✅ UI initialized');

      // Start order generation
      this.orderGenerator.start();
      console.log('✅ Order generation started');

    // Load NPC data from game state
    this.npcManager.loadFromGameState();
    console.log('✅ NPC Manager initialized');

    // Load conversation data
    this.conversationManager.loadConversations();
    console.log('✅ Conversation Manager initialized');

    // Start order generation
    this.orderGenerator.start();
    console.log('✅ Order Generator started');

      // Ensure persistent header is visible and set to cafe-hub variant
      this.eventSystem.emit('header:set_variant', { variant: 'cafe-hub' });
      
      // Force header visibility
      const headerElement = this.persistentHeader.getElement();
      headerElement.style.display = 'flex';
      headerElement.style.visibility = 'visible';
      headerElement.style.opacity = '1';
      
      // Start with café hub
      this.screenManager.navigateTo('cafe-hub');

      // Make game systems available globally for screens
      (window as any).game = this;
      
      console.log('🎉 Meet Cute Cafe ready!');

    } catch (error) {
      console.error('❌ Failed to initialize game:', error);
      this.eventSystem.emit('game:error', {
        error: error as Error,
        context: 'initialization'
      });
    }
  }

  private setupEventListeners(): void {
    // Handle game errors
    this.eventSystem.on('game:error', (data) => {
      console.error(`Game error in ${data.context}:`, data.error);
      // TODO: Show user-friendly error message
    });

    // Handle game state changes
    this.eventSystem.on('game:loaded', (data) => {
      console.log(`Player ${data.playerId} loaded`);
    });

    this.eventSystem.on('game:saved', (data) => {
      console.log(`Game saved at ${new Date(data.timestamp).toLocaleTimeString()}`);
    });

    // Handle order completion by showing results screen
    this.eventSystem.on('order:completed', (data) => {
      const order = data.order as any;
      this.showOrderResults(order);
    });
  }

  private showOrderResults(order: any): void {
    console.log('📋 Showing order results for:', order);
    
    // Prepare results data
    const resultsData: any = {
      orderId: order.orderId,
      rewards: order.rewards,
      npcId: order.npcId,
      orderType: order.kind,
      customerType: order.customerType
    };

    // Generate memory for NPC orders
    if (order.kind === 'NPC' && order.npcId && order.rewards.memory) {
      console.log('🧠 NPC order detected, generating memory...');
      // Request memory generation
      this.eventSystem.emit('memory:generate_from_order', {
        npcId: order.npcId,
        orderId: order.orderId
      });

      // Listen for the memory creation to get the memory ID (once)
      this.eventSystem.once('memory:created', (memoryData: any) => {
        console.log('💕 Memory created event received:', memoryData);
        const memory = memoryData.memory as any;
        console.log('🔍 Memory orderId:', memory?.orderId, 'vs Order orderId:', order.orderId);
        
        // Always set the memory ID if we have a memory
        if (memory) {
          resultsData.memoryId = memory.id;
          if (memory.orderId === order.orderId) {
            console.log('✅ Memory matches order, navigating to results screen');
          } else {
            console.log('⚠️ Memory does not match order, but including it anyway');
            console.log('⚠️ Memory object:', memory);
            console.log('⚠️ Expected orderId:', order.orderId);
          }
        }
        
        this.screenManager.navigateTo('order-results', resultsData as any);
      });
    } else {
      console.log('📄 Regular order or no memory, showing results immediately');
      // No memory, show results immediately
      this.screenManager.navigateTo('order-results', resultsData as any);
    }
  }

  private initializeUI(): void {
    const app = document.getElementById('app');
    if (!app) {
      throw new Error('App container not found');
    }

    // Create game UI structure
    app.innerHTML = `
      <div class="game-container">
        <div id="main-content" class="main-content">
          <!-- Screens will be populated by ScreenManager -->
        </div>
      </div>
    `;
  }

  /**
   * Insert persistent header after it's created
   */
  private insertPersistentHeader(): void {
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer && this.persistentHeader) {
      gameContainer.insertBefore(this.persistentHeader.getElement(), gameContainer.firstChild);
    }
  }

  /**
   * Initialize all game screens
   */
  private initializeScreens(): void {
    // Create and register screens
    const cafeHubScreen = new CafeHubScreen(this.eventSystem, this.gameStateManager, this.assetManager);
    const ordersScreen = new OrdersScreen(this.eventSystem, this.gameStateManager, this.assetManager, this.orderGenerator);
    const flavorCollectionScreen = new FlavorCollectionScreen(this.eventSystem, this.gameStateManager, this.assetManager);
    const journalScreen = new JournalScreen(this.eventSystem, this.gameStateManager);
    const memoryDetailScreen = new MemoryDetailScreen(this.eventSystem, this.gameStateManager);
    const dmScreen = new DMScreen(this.eventSystem, this.gameStateManager);
    const conversationHistoryScreen = new ConversationHistoryScreen(this.eventSystem, this.gameStateManager);
    const orderResultsScreen = new OrderResultsScreen(this.eventSystem, this.gameStateManager);

    this.screenManager.registerScreen(cafeHubScreen);
    this.screenManager.registerScreen(ordersScreen);
    this.screenManager.registerScreen(flavorCollectionScreen);
    this.screenManager.registerScreen(journalScreen);
    this.screenManager.registerScreen(memoryDetailScreen);
    this.screenManager.registerScreen(dmScreen);
    this.screenManager.registerScreen(conversationHistoryScreen);
    this.screenManager.registerScreen(orderResultsScreen);
  }


  /**
   * Get game systems (for testing)
   */
  getSystems(): {
    eventSystem: EventSystem;
    gameStateManager: GameStateManager;
    assetManager: AssetManager;
    orderGenerator: OrderGenerator;
    npcManager: NPCManager;
    memoryGenerator: MemoryGenerator;
    conversationManager: ConversationManager;
    screenManager: ScreenManager;
    persistentHeader: PersistentHeader;
  } {
    return {
      eventSystem: this.eventSystem,
      gameStateManager: this.gameStateManager,
      assetManager: this.assetManager,
      orderGenerator: this.orderGenerator,
      npcManager: this.npcManager,
      memoryGenerator: this.memoryGenerator,
      conversationManager: this.conversationManager,
      screenManager: this.screenManager,
      persistentHeader: this.persistentHeader,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.screenManager) {
      this.screenManager.destroy();
    }
    if (this.persistentHeader) {
      this.persistentHeader.destroy();
    }
    this.orderGenerator.destroy();
    this.gameStateManager.destroy();
    this.eventSystem.clear();
    this.assetManager.clearCache();
  }
}

// Initialize the game
const game = new MeetCuteCafeGame();

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
  });
} else {
  initializeGame();
}

async function initializeGame(): Promise<void> {
  try {
    await game.initialize();
  } catch (error) {
    console.error('Failed to initialize Meet Cute Cafe:', error);
    
    // Show user-friendly error message
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          text-align: center;
          background: linear-gradient(135deg, #ffeef4 0%, #ffd6e1 50%, #ffb8c6 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            max-width: 500px;
          ">
            <h1 style="color: #e74c3c; margin-bottom: 20px;">Oops! Something went wrong</h1>
            <p style="color: #636e72; margin-bottom: 20px;">
              We're having trouble loading Meet Cute Cafe. Please try refreshing the page.
            </p>
            <button onclick="window.location.reload()" style="
              background: linear-gradient(135deg, #e17497, #f2a5b8);
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 25px;
              font-size: 1.1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
            ">
              Refresh Page
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Export for testing
export { MeetCuteCafeGame };

// Make game available globally for debugging
(window as unknown as { game: MeetCuteCafeGame }).game = game;
