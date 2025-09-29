/**
 * Asset Manager for Meet Cute Cafe
 * Handles loading, caching, and validation of game assets
 */

import { getAssetPath, ASSET_PATHS } from '@/utils/AssetPaths';
import type { EventSystem } from './EventSystem';
import type { NpcId } from '@/models/GameTypes';

export interface AssetLoadResult {
  success: boolean;
  asset?: HTMLImageElement | HTMLVideoElement;
  error?: string;
}

export class AssetManager {
  private imageCache = new Map<string, HTMLImageElement>();
  private videoCache = new Map<string, HTMLVideoElement>();
  private loadingPromises = new Map<string, Promise<AssetLoadResult>>();
  private preloadedAssets = new Set<string>();

  constructor(private eventSystem: EventSystem) {}

  /**
   * Preload critical assets for immediate use
   */
  async preloadCriticalAssets(): Promise<void> {
    const criticalAssets = [
      // NPC portraits (always needed)
      ...Object.values(ASSET_PATHS.npcPortraits),
      // UI elements
      ASSET_PATHS.ui.gachaBanner,
      ASSET_PATHS.ui.placeholderButton,
      ASSET_PATHS.ui.placeholderIcon,
      // Memory placeholder
      ASSET_PATHS.memoryPlaceholder,
      // Player portrait
      ASSET_PATHS.playerPortrait,
      // Logo
      ASSET_PATHS.logo,
    ];

    const loadPromises = criticalAssets.map(path => this.loadImage(path));
    
    try {
      const results = await Promise.all(loadPromises);
      const failedAssets = results.filter(result => !result.success);
      
      if (failedAssets.length > 0) {
        const error = new Error(`Failed to load ${failedAssets.length} critical assets`);
        console.error('Failed to preload some critical assets:', error);
        this.eventSystem.emit('game:error', {
          error,
          context: 'asset_preloading'
        });
      }
      
      // Mark successful assets as preloaded
      results.forEach((result, index) => {
        if (result.success) {
          this.preloadedAssets.add(criticalAssets[index]!);
        }
      });
      
      console.log('Critical assets preloaded successfully');
    } catch (error) {
      console.error('Failed to preload some critical assets:', error);
      this.eventSystem.emit('game:error', {
        error: error as Error,
        context: 'asset_preloading'
      });
    }
  }

  /**
   * Load an image asset
   */
  async loadImage(path: string): Promise<AssetLoadResult> {
    // Check cache first
    if (this.imageCache.has(path)) {
      return {
        success: true,
        asset: this.imageCache.get(path)!
      };
    }

    // Check if already loading
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path)!;
    }

    // Start loading
    const loadPromise = this.loadImageInternal(path);
    this.loadingPromises.set(path, loadPromise);

    const result = await loadPromise;
    this.loadingPromises.delete(path);

    return result;
  }

  private async loadImageInternal(path: string): Promise<AssetLoadResult> {
    return new Promise<AssetLoadResult>((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        this.imageCache.set(path, img);
        resolve({
          success: true,
          asset: img
        });
      };

      img.onerror = () => {
        const error = `Failed to load image: ${path}`;
        console.error(error);
        resolve({
          success: false,
          error
        });
      };

      img.src = getAssetPath(path);
    });
  }

  /**
   * Load a video asset
   */
  async loadVideo(path: string): Promise<AssetLoadResult> {
    // Check cache first
    if (this.videoCache.has(path)) {
      return {
        success: true,
        asset: this.videoCache.get(path)!
      };
    }

    // Check if already loading
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path)!;
    }

    // Start loading
    const loadPromise = this.loadVideoInternal(path);
    this.loadingPromises.set(path, loadPromise);

    const result = await loadPromise;
    this.loadingPromises.delete(path);

    return result;
  }

  private async loadVideoInternal(path: string): Promise<AssetLoadResult> {
    return new Promise<AssetLoadResult>((resolve) => {
      const video = document.createElement('video');
      
      video.onloadeddata = () => {
        this.videoCache.set(path, video);
        resolve({
          success: true,
          asset: video
        });
      };

      video.onerror = () => {
        const error = `Failed to load video: ${path}`;
        console.error(error);
        resolve({
          success: false,
          error
        });
      };

      video.src = getAssetPath(path);
      video.preload = 'metadata';
    });
  }

  /**
   * Get cached image
   */
  getCachedImage(path: string): HTMLImageElement | null {
    return this.imageCache.get(path) ?? null;
  }

  /**
   * Get cached video
   */
  getCachedVideo(path: string): HTMLVideoElement | null {
    return this.videoCache.get(path) ?? null;
  }

  /**
   * Check if asset is preloaded
   */
  isPreloaded(path: string): boolean {
    return this.preloadedAssets.has(path);
  }

  /**
   * Validate all critical assets exist
   */
  async validateCriticalAssets(): Promise<{ valid: boolean; missing: string[] }> {
    const criticalAssets = [
      ...Object.values(ASSET_PATHS.npcPortraits),
      ...Object.values(ASSET_PATHS.npcCinematics),
      ASSET_PATHS.memoryPlaceholder,
      ASSET_PATHS.playerPortrait,
      ASSET_PATHS.logo,
      ASSET_PATHS.ui.gachaBanner,
      ASSET_PATHS.ui.placeholderButton,
      ASSET_PATHS.ui.placeholderIcon,
    ];

    const missing: string[] = [];

    for (const path of criticalAssets) {
      try {
        const response = await fetch(getAssetPath(path), { method: 'HEAD' });
        if (!response.ok) {
          missing.push(path);
        }
      } catch {
        missing.push(path);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Get NPC portrait (convenience method)
   */
  async getNpcPortrait(npcId: NpcId): Promise<HTMLImageElement | null> {
    const path = ASSET_PATHS.npcPortraits[npcId];
    const result = await this.loadImage(path);
    return result.success ? result.asset as HTMLImageElement : null;
  }

  /**
   * Get NPC cinematic (convenience method)
   */
  async getNpcCinematic(npcId: NpcId): Promise<HTMLVideoElement | null> {
    const path = ASSET_PATHS.npcCinematics[npcId];
    const result = await this.loadVideo(path);
    return result.success ? result.asset as HTMLVideoElement : null;
  }

  /**
   * Clear cache (for memory management)
   */
  clearCache(): void {
    this.imageCache.clear();
    this.videoCache.clear();
    this.preloadedAssets.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    imagesCached: number;
    videosCached: number;
    preloadedCount: number;
    loadingCount: number;
  } {
    return {
      imagesCached: this.imageCache.size,
      videosCached: this.videoCache.size,
      preloadedCount: this.preloadedAssets.size,
      loadingCount: this.loadingPromises.size,
    };
  }
}
