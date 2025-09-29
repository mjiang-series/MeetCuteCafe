/**
 * Asset path management for Meet Cute Cafe
 * Maps logical asset names to actual file paths
 */

import type { AssetPaths, NpcId } from '@/models/GameTypes';

export const ASSET_PATHS: AssetPaths = {
  npcPortraits: {
    aria: 'art/npc/aria/aria_portrait.png',
    kai: 'art/npc/kai/kai_portrait.png',
    elias: 'art/npc/elias/elias_portrait.png',
  },
  npcCinematics: {
    aria: 'art/npc/aria/aria_gacha_cinematic.mp4',
    kai: 'art/npc/kai/kai_gacha_cinematic.mp4',
    elias: 'art/npc/elias/elias_gacha_cinematic.mp4',
  },
  memoryPlaceholder: 'art/memories_image_placeholder.png',
  playerPortrait: 'art/player_portrait.png',
  logo: 'art/game_logo.png',
  ui: {
    gachaBanner: 'art/ui/gacha_banner.svg',
    placeholderButton: 'art/ui/placeholder_button.svg',
    placeholderIcon: 'art/ui/placeholder_icon.svg',
    blogPlaceholder: 'art/ui/blog_placeholder.png',
  },
};

/**
 * Get the full path for an asset
 */
export function getAssetPath(relativePath: string): string {
  // In development, assets are served from the public directory
  // In production, they'll be in the dist folder
  return `/${relativePath}`;
}

/**
 * Get NPC portrait path
 */
export function getNpcPortraitPath(npcId: NpcId): string {
  return getAssetPath(ASSET_PATHS.npcPortraits[npcId]);
}

/**
 * Get NPC cinematic video path
 */
export function getNpcCinematicPath(npcId: NpcId): string {
  return getAssetPath(ASSET_PATHS.npcCinematics[npcId]);
}

/**
 * Get memory placeholder image path
 */
export function getMemoryPlaceholderPath(): string {
  return getAssetPath(ASSET_PATHS.memoryPlaceholder);
}

/**
 * Get player portrait path
 */
export function getPlayerPortraitPath(): string {
  return getAssetPath(ASSET_PATHS.playerPortrait);
}

/**
 * Get logo path
 */
export function getLogoPath(): string {
  return getAssetPath(ASSET_PATHS.logo);
}

/**
 * Validate that an asset exists (for testing)
 */
export async function validateAsset(path: string): Promise<boolean> {
  try {
    const response = await fetch(getAssetPath(path), { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Preload an image asset
 */
export function preloadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = getAssetPath(path);
  });
}

/**
 * Preload a video asset
 */
export function preloadVideo(path: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.onloadeddata = () => resolve(video);
    video.onerror = reject;
    video.src = getAssetPath(path);
    video.preload = 'metadata';
  });
}
