/**
 * Unit tests for EventSystem
 */

import { EventSystem } from '@/systems/EventSystem';

describe('EventSystem', () => {
  let eventSystem: EventSystem;

  beforeEach(() => {
    eventSystem = new EventSystem();
  });

  afterEach(() => {
    eventSystem.clear();
  });

  describe('basic event handling', () => {
    test('should emit and receive events', () => {
      const mockListener = jest.fn();
      
      eventSystem.on('game:loaded', mockListener);
      eventSystem.emit('game:loaded', { playerId: 'test-player' });
      
      expect(mockListener).toHaveBeenCalledWith({ playerId: 'test-player' });
      expect(mockListener).toHaveBeenCalledTimes(1);
    });

    test('should support multiple listeners for same event', () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();
      
      eventSystem.on('game:loaded', mockListener1);
      eventSystem.on('game:loaded', mockListener2);
      eventSystem.emit('game:loaded', { playerId: 'test-player' });
      
      expect(mockListener1).toHaveBeenCalledWith({ playerId: 'test-player' });
      expect(mockListener2).toHaveBeenCalledWith({ playerId: 'test-player' });
    });

    test('should not call listeners after unsubscribe', () => {
      const mockListener = jest.fn();
      
      const unsubscribe = eventSystem.on('game:loaded', mockListener);
      unsubscribe();
      eventSystem.emit('game:loaded', { playerId: 'test-player' });
      
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('once listeners', () => {
    test('should call once listeners only once', () => {
      const mockListener = jest.fn();
      
      eventSystem.once('game:loaded', mockListener);
      eventSystem.emit('game:loaded', { playerId: 'test-player-1' });
      eventSystem.emit('game:loaded', { playerId: 'test-player-2' });
      
      expect(mockListener).toHaveBeenCalledTimes(1);
      expect(mockListener).toHaveBeenCalledWith({ playerId: 'test-player-1' });
    });

    test('should support unsubscribing once listeners', () => {
      const mockListener = jest.fn();
      
      const unsubscribe = eventSystem.once('game:loaded', mockListener);
      unsubscribe();
      eventSystem.emit('game:loaded', { playerId: 'test-player' });
      
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalListener = jest.fn();
      
      eventSystem.on('game:loaded', errorListener);
      eventSystem.on('game:loaded', normalListener);
      
      // Should not throw
      expect(() => {
        eventSystem.emit('game:loaded', { playerId: 'test-player' });
      }).not.toThrow();
      
      // Normal listener should still be called
      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    test('should report correct listener count', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const onceListener = jest.fn();
      
      expect(eventSystem.getListenerCount('game:loaded')).toBe(0);
      
      eventSystem.on('game:loaded', listener1);
      expect(eventSystem.getListenerCount('game:loaded')).toBe(1);
      
      eventSystem.on('game:loaded', listener2);
      expect(eventSystem.getListenerCount('game:loaded')).toBe(2);
      
      eventSystem.once('game:loaded', onceListener);
      expect(eventSystem.getListenerCount('game:loaded')).toBe(3);
    });

    test('should report if event has listeners', () => {
      expect(eventSystem.hasListeners('game:loaded')).toBe(false);
      
      const unsubscribe = eventSystem.on('game:loaded', jest.fn());
      expect(eventSystem.hasListeners('game:loaded')).toBe(true);
      
      unsubscribe();
      expect(eventSystem.hasListeners('game:loaded')).toBe(false);
    });

    test('should clear all listeners', () => {
      eventSystem.on('game:loaded', jest.fn());
      eventSystem.on('game:saved', jest.fn());
      eventSystem.once('game:error', jest.fn());
      
      expect(eventSystem.hasListeners('game:loaded')).toBe(true);
      expect(eventSystem.hasListeners('game:saved')).toBe(true);
      expect(eventSystem.hasListeners('game:error')).toBe(true);
      
      eventSystem.clear();
      
      expect(eventSystem.hasListeners('game:loaded')).toBe(false);
      expect(eventSystem.hasListeners('game:saved')).toBe(false);
      expect(eventSystem.hasListeners('game:error')).toBe(false);
    });

    test('should remove all listeners for specific event', () => {
      eventSystem.on('game:loaded', jest.fn());
      eventSystem.on('game:saved', jest.fn());
      
      expect(eventSystem.hasListeners('game:loaded')).toBe(true);
      expect(eventSystem.hasListeners('game:saved')).toBe(true);
      
      eventSystem.off('game:loaded');
      
      expect(eventSystem.hasListeners('game:loaded')).toBe(false);
      expect(eventSystem.hasListeners('game:saved')).toBe(true);
    });
  });
});
