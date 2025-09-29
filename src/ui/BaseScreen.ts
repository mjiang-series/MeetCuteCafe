/**
 * Base Screen class for Meet Cute Cafe
 * Provides common functionality for all game screens
 */

import type { EventSystem } from '@/systems/EventSystem';
import type { GameStateManager } from '@/systems/GameStateManager';
import type { AssetManager } from '@/systems/AssetManager';
import type { Screen, ScreenId, ScreenData } from './ScreenManager';

export abstract class BaseScreen implements Screen {
  public element: HTMLElement;
  public isActive = false;

  constructor(
    public screenId: ScreenId,
    protected eventSystem: EventSystem,
    protected gameState: GameStateManager,
    protected assetManager: AssetManager
  ) {
    this.element = this.createElement();
    this.setupEventListeners();
  }

  /**
   * Create the screen element
   */
  private createElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = `screen screen--${this.screenId}`;
    element.innerHTML = this.createContent();
    return element;
  }

  /**
   * Abstract method to create screen content
   */
  protected abstract createContent(): string;

  /**
   * Setup event listeners for this screen
   */
  protected setupEventListeners(): void {
    // Override in subclasses
  }

  /**
   * Called when screen is shown
   */
  onShow(data?: ScreenData): void {
    this.isActive = true;
    this.onScreenShow(data);
    this.bindEventHandlers();
  }

  /**
   * Called when screen is hidden
   */
  onHide(): void {
    this.isActive = false;
    this.onScreenHide();
    this.unbindEventHandlers();
  }

  /**
   * Called when screen is destroyed
   */
  onDestroy(): void {
    this.onScreenDestroy();
    this.unbindEventHandlers();
  }

  /**
   * Override in subclasses for show logic
   */
  protected onScreenShow(_data?: ScreenData): void {
    // Override in subclasses
  }

  /**
   * Override in subclasses for hide logic
   */
  protected onScreenHide(): void {
    // Override in subclasses
  }

  /**
   * Override in subclasses for destroy logic
   */
  protected onScreenDestroy(): void {
    // Override in subclasses
  }

  /**
   * Bind event handlers to DOM elements
   */
  protected bindEventHandlers(): void {
    // Find and bind click handlers
    const clickableElements = this.element.querySelectorAll('[data-action]');
    clickableElements.forEach(element => {
      const action = element.getAttribute('data-action');
      if (action) {
        element.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleAction(action, element as HTMLElement);
        });
      }
    });

    // Find and bind navigation handlers
    const navElements = this.element.querySelectorAll('[data-navigate]');
    navElements.forEach(element => {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        const screenId = element.getAttribute('data-navigate') as ScreenId;
        const data = element.getAttribute('data-nav-data');
        const navData = data ? JSON.parse(data) : undefined;
        
        this.eventSystem.emit('ui:show_screen', { screenId, data: navData });
      });
    });
  }

  /**
   * Unbind event handlers
   */
  protected unbindEventHandlers(): void {
    // Remove all click listeners by cloning and replacing the element
    // This is a simple way to remove all event listeners
    const newElement = this.element.cloneNode(true) as HTMLElement;
    this.element.parentNode?.replaceChild(newElement, this.element);
    this.element = newElement;
  }

  /**
   * Handle action clicks - override in subclasses
   */
  protected handleAction(action: string, element: HTMLElement): void {
    console.log(`Unhandled action: ${action}`, element);
  }

  /**
   * Update screen content
   */
  protected updateContent(): void {
    this.element.innerHTML = this.createContent();
    if (this.isActive) {
      this.bindEventHandlers();
    }
  }

  /**
   * Show loading state
   */
  protected showLoading(message = 'Loading...'): void {
    const loadingHTML = `
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.innerHTML = loadingHTML;
    overlay.className = 'loading-overlay-container';
    this.element.appendChild(overlay);
  }

  /**
   * Hide loading state
   */
  protected hideLoading(): void {
    const overlay = this.element.querySelector('.loading-overlay-container');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Show error message
   */
  protected showError(message: string): void {
    this.eventSystem.emit('ui:notification', {
      message,
      type: 'error'
    });
  }

  /**
   * Show success message
   */
  protected showSuccess(message: string): void {
    this.eventSystem.emit('ui:notification', {
      message,
      type: 'success'
    });
  }

  /**
   * Get element by selector within this screen
   */
  protected querySelector<T extends HTMLElement>(selector: string): T | null {
    return this.element.querySelector(selector);
  }

  /**
   * Get elements by selector within this screen
   */
  protected querySelectorAll<T extends HTMLElement>(selector: string): NodeListOf<T> {
    return this.element.querySelectorAll(selector);
  }
}
