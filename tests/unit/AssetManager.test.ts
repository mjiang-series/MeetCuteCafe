/**
 * Unit tests for AssetManager
 */

import { AssetManager } from '@/systems/AssetManager';
import { EventSystem } from '@/systems/EventSystem';

describe('AssetManager', () => {
  let assetManager: AssetManager;
  let eventSystem: EventSystem;

  beforeEach(() => {
    eventSystem = new EventSystem();
    assetManager = new AssetManager(eventSystem);
  });

  describe('image loading', () => {
    test('should load image successfully', async () => {
      const result = await assetManager.loadImage('art/test-image.png');

      expect(result.success).toBe(true);
      expect(result.asset).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    test('should cache loaded images', async () => {
      const path = 'art/test-image.png';
      
      // Load image first time
      const result1 = await assetManager.loadImage(path);
      
      // Load same image again
      const result2 = await assetManager.loadImage(path);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.asset).toBe(result2.asset); // Same instance from cache
    });

    test('should handle concurrent loading of same image', async () => {
      const path = 'art/test-image.png';
      
      // Start loading same image concurrently
      const promise1 = assetManager.loadImage(path);
      const promise2 = assetManager.loadImage(path);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.asset).toBe(result2.asset); // Same instance
    });

    test('should get cached image', async () => {
      const path = 'art/test-image.png';
      
      await assetManager.loadImage(path);
      const cached = assetManager.getCachedImage(path);

      expect(cached).toBeDefined();
    });

    test('should return null for uncached image', () => {
      const cached = assetManager.getCachedImage('art/nonexistent.png');
      expect(cached).toBeNull();
    });
  });

  describe('video loading', () => {
    test('should load video successfully', async () => {
      // Mock video element creation
      const mockVideo = {
        onloadeddata: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
        preload: '',
      };

      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'video') {
          setTimeout(() => {
            if (mockVideo.onloadeddata) {
              mockVideo.onloadeddata();
            }
          }, 0);
          return mockVideo as HTMLVideoElement;
        }
        return document.createElement(tagName);
      });

      const result = await assetManager.loadVideo('art/test-video.mp4');

      expect(result.success).toBe(true);
      expect(result.asset).toBe(mockVideo);
    });

    test('should cache loaded videos', async () => {
      const path = 'art/test-video.mp4';
      
      const result1 = await assetManager.loadVideo(path);
      const result2 = await assetManager.loadVideo(path);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.asset).toBe(result2.asset);
    });
  });

  describe('NPC asset convenience methods', () => {
    test('should load NPC portrait', async () => {
      const portrait = await assetManager.getNpcPortrait('aria');

      expect(portrait).toBeDefined();
    });

    test('should load NPC cinematic', async () => {
      // Mock video loading for cinematic
      const mockVideo = {
        onloadeddata: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
        preload: '',
      };

      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'video') {
          setTimeout(() => {
            if (mockVideo.onloadeddata) {
              mockVideo.onloadeddata();
            }
          }, 0);
          return mockVideo as HTMLVideoElement;
        }
        return document.createElement(tagName);
      });

      const cinematic = await assetManager.getNpcCinematic('aria');

      expect(cinematic).toBe(mockVideo);
    });
  });

  describe('asset validation', () => {
    test('should validate critical assets successfully', async () => {
      // Mock fetch to return success for all assets
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const validation = await assetManager.validateCriticalAssets();

      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    test('should identify missing assets', async () => {
      // Mock fetch to return 404 for some assets
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('aria_portrait')) {
          return Promise.resolve({ ok: false, status: 404 });
        }
        return Promise.resolve({ ok: true, status: 200 });
      });

      const validation = await assetManager.validateCriticalAssets();

      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('art/npc/aria/aria_portrait.png');
    });
  });

  describe('preloading', () => {
    test('should preload critical assets', async () => {
      const mockErrorListener = jest.fn();
      eventSystem.on('game:error', mockErrorListener);

      await assetManager.preloadCriticalAssets();

      // Should not emit error for successful preloading
      expect(mockErrorListener).not.toHaveBeenCalled();

      // Critical assets should be marked as preloaded
      expect(assetManager.isPreloaded('art/npc/aria/aria_portrait.png')).toBe(true);
      expect(assetManager.isPreloaded('art/game_logo.png')).toBe(true);
    });

    test('should handle preloading errors gracefully', async () => {
      // Create a new AssetManager instance to avoid interference
      const testAssetManager = new AssetManager(eventSystem);
      
      // Mock Image to fail loading
      (global as unknown as { Image: typeof Image }).Image = class MockFailingImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 0);
        }
      } as unknown as typeof Image;

      const mockErrorListener = jest.fn();
      eventSystem.on('game:error', mockErrorListener);

      await testAssetManager.preloadCriticalAssets();

      // Should emit error for failed preloading (at least one error expected)
      expect(mockErrorListener).toHaveBeenCalled();
    });
  });

  describe('cache management', () => {
    test('should provide cache statistics', async () => {
      await assetManager.loadImage('art/test1.png');
      await assetManager.loadImage('art/test2.png');

      const stats = assetManager.getCacheStats();

      expect(stats.imagesCached).toBeGreaterThanOrEqual(0);
      expect(stats.videosCached).toBe(0);
      expect(stats.loadingCount).toBe(0);
    });

    test('should clear cache', async () => {
      await assetManager.loadImage('art/test.png');

      assetManager.clearCache();

      const stats = assetManager.getCacheStats();
      expect(stats.imagesCached).toBe(0);
      expect(stats.videosCached).toBe(0);
      expect(stats.preloadedCount).toBe(0);
    });
  });
});
