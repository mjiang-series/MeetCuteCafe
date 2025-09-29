/**
 * Event System for Meet Cute Cafe
 * Provides pub/sub communication between game systems
 */

export type EventMap = {
  // Game state events
  'game:loaded': { playerId: string };
  'game:saved': { timestamp: number };
  'game:error': { error: Error; context?: string };

  // Order events
  'order:generated': { order: unknown };
  'order:submitted': { orderId: string; success: boolean };
  'order:completed': { order: unknown };
  'order:expired': { order: unknown };

  // Memory events
  'memory:created': { memory: unknown };
  'memory:viewed': { memoryId: string };

  // NPC events
  'npc:bond_increased': { npcId: string; points: number };
  'npc:milestone_reached': { npcId: string; level: number };

  // Gacha events
  'gacha:pull_started': { bannerId: string; count: number };
  'gacha:pull_completed': { results: unknown };
  'gacha:insufficient_funds': { required: number };

  // UI events
  'ui:show_screen': { screenId: string; data?: unknown };
  'ui:hide_screen': { screenId: string };
  'ui:notification': { message: string; type: 'info' | 'success' | 'warning' | 'error' };

  // Header events
  'header:set_variant': { variant: string; parentContext?: string };
  'header:update_currency': { currency: string; value: number };

  // Conversation events
  'conversation:message_added': { npcId: string; message: unknown };
  'conversation:marked_read': { npcId: string };
};

export type EventListener<T extends keyof EventMap> = (data: EventMap[T]) => void;

export class EventSystem {
  private listeners: Map<keyof EventMap, Set<EventListener<keyof EventMap>>> = new Map();
  private onceListeners: Map<keyof EventMap, Set<EventListener<keyof EventMap>>> = new Map();

  /**
   * Subscribe to an event
   */
  on<T extends keyof EventMap>(event: T, listener: EventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const eventListeners = this.listeners.get(event)!;
    eventListeners.add(listener as EventListener<keyof EventMap>);

    // Return unsubscribe function
    return () => {
      eventListeners.delete(listener as EventListener<keyof EventMap>);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Subscribe to an event once (auto-unsubscribe after first emission)
   */
  once<T extends keyof EventMap>(event: T, listener: EventListener<T>): () => void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    
    const onceEventListeners = this.onceListeners.get(event)!;
    onceEventListeners.add(listener as EventListener<keyof EventMap>);

    // Return unsubscribe function
    return () => {
      onceEventListeners.delete(listener as EventListener<keyof EventMap>);
      if (onceEventListeners.size === 0) {
        this.onceListeners.delete(event);
      }
    };
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T extends keyof EventMap>(event: T, data: EventMap[T]): void {
    // Emit to regular listeners
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          (listener as EventListener<T>)(data);
        } catch (error) {
          console.error(`Error in event listener for ${String(event)}:`, error);
        }
      });
    }

    // Emit to once listeners and remove them
    const onceEventListeners = this.onceListeners.get(event);
    if (onceEventListeners) {
      onceEventListeners.forEach(listener => {
        try {
          (listener as EventListener<T>)(data);
        } catch (error) {
          console.error(`Error in once event listener for ${String(event)}:`, error);
        }
      });
      this.onceListeners.delete(event);
    }
  }

  /**
   * Remove all listeners for an event
   */
  off(event: keyof EventMap): void {
    this.listeners.delete(event);
    this.onceListeners.delete(event);
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }

  /**
   * Get the number of listeners for an event (for testing)
   */
  getListenerCount(event: keyof EventMap): number {
    const regularCount = this.listeners.get(event)?.size ?? 0;
    const onceCount = this.onceListeners.get(event)?.size ?? 0;
    return regularCount + onceCount;
  }

  /**
   * Check if there are any listeners for an event (for testing)
   */
  hasListeners(event: keyof EventMap): boolean {
    return this.getListenerCount(event) > 0;
  }
}
