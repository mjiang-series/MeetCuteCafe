/**
 * Screen Management System for Meet Cute Cafe
 * Handles navigation between different game screens
 */

import type { EventSystem } from '@/systems/EventSystem';

export type ScreenId = 
  | 'welcome'
  | 'cafe-hub'
  | 'orders'
  | 'order-results'
  | 'flavor-collection'
  | 'journal'
  | 'memory-detail'
  | 'dm'
  | 'settings';

export interface ScreenData {
  [key: string]: unknown;
}

export interface Screen {
  screenId: ScreenId;
  element: HTMLElement;
  isActive: boolean;
  onShow?(data?: ScreenData): void;
  onHide?(): void;
  onDestroy?(): void;
}

export class ScreenManager {
  private screens = new Map<ScreenId, Screen>();
  private currentScreen: Screen | null = null;
  private container: HTMLElement;

  constructor(
    private eventSystem: EventSystem,
    containerId: string = 'main-content'
  ) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id '${containerId}' not found`);
    }
    this.container = container;
    this.setupEventListeners();
  }

  /**
   * Register a screen
   */
  registerScreen(screen: Screen): void {
    this.screens.set(screen.screenId, screen);
    
    // Add screen element to container but keep it hidden
    screen.element.style.display = 'none';
    this.container.appendChild(screen.element);
  }

  /**
   * Show a specific screen
   */
  showScreen(screenId: ScreenId, data?: ScreenData): void {
    const screen = this.screens.get(screenId);
    if (!screen) {
      console.error(`Screen '${screenId}' not found`);
      return;
    }

    // Hide current screen
    if (this.currentScreen) {
      this.hideCurrentScreen();
    }

    // Show new screen
    screen.element.style.display = 'block';
    screen.isActive = true;
    
    if (screen.onShow) {
      screen.onShow(data);
    }

    this.currentScreen = screen;
  }

  /**
   * Hide current screen
   */
  private hideCurrentScreen(): void {
    if (!this.currentScreen) return;

    this.currentScreen.element.style.display = 'none';
    this.currentScreen.isActive = false;
    
    if (this.currentScreen.onHide) {
      this.currentScreen.onHide();
    }
  }

  /**
   * Get current screen
   */
  getCurrentScreen(): Screen | null {
    return this.currentScreen;
  }

  /**
   * Check if a screen exists
   */
  hasScreen(screenId: ScreenId): boolean {
    return this.screens.has(screenId);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for navigation requests
    this.eventSystem.on('ui:show_screen', (data) => {
      this.showScreen(data.screenId as ScreenId, data.data as ScreenData);
    });

    // Handle back navigation
    window.addEventListener('popstate', (event) => {
      const state = event.state;
      if (state && state.screenId) {
        this.showScreen(state.screenId, state.data);
      }
    });
  }

  /**
   * Navigate with history support
   */
  navigateTo(screenId: ScreenId, data?: ScreenData, pushState = true): void {
    if (pushState) {
      window.history.pushState(
        { screenId, data },
        '',
        `#${screenId}`
      );
    }
    
    this.showScreen(screenId, data);
  }

  /**
   * Go back to previous screen
   */
  goBack(): void {
    window.history.back();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Hide current screen
    this.hideCurrentScreen();
    
    // Destroy all screens
    this.screens.forEach(screen => {
      if (screen.onDestroy) {
        screen.onDestroy();
      }
      screen.element.remove();
    });
    
    this.screens.clear();
    this.currentScreen = null;
  }
}
