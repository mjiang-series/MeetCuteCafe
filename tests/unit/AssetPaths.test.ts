/**
 * Unit tests for AssetPaths utility
 */

import { 
  getAssetPath, 
  getNpcPortraitPath, 
  getNpcCinematicPath, 
  getMemoryPlaceholderPath,
  getPlayerPortraitPath,
  getLogoPath,
  validateAsset,
  preloadImage,
  preloadVideo,
  ASSET_PATHS 
} from '@/utils/AssetPaths';

describe('AssetPaths', () => {
  describe('path getters', () => {
    test('should return correct asset path with leading slash', () => {
      const path = getAssetPath('art/test.png');
      expect(path).toBe('/art/test.png');
    });

    test('should get NPC portrait paths', () => {
      expect(getNpcPortraitPath('aria')).toBe('/art/npc/aria/aria_portrait.png');
      expect(getNpcPortraitPath('kai')).toBe('/art/npc/kai/kai_portrait.png');
      expect(getNpcPortraitPath('elias')).toBe('/art/npc/elias/elias_portrait.png');
    });

    test('should get NPC cinematic paths', () => {
      expect(getNpcCinematicPath('aria')).toBe('/art/npc/aria/aria_gacha_cinematic.mp4');
      expect(getNpcCinematicPath('kai')).toBe('/art/npc/kai/kai_gacha_cinematic.mp4');
      expect(getNpcCinematicPath('elias')).toBe('/art/npc/elias/elias_gacha_cinematic.mp4');
    });

    test('should get memory placeholder path', () => {
      expect(getMemoryPlaceholderPath()).toBe('/art/memories_image_placeholder.png');
    });

    test('should get player portrait path', () => {
      expect(getPlayerPortraitPath()).toBe('/art/player_portrait.png');
    });

    test('should get logo path', () => {
      expect(getLogoPath()).toBe('/art/love_pets_logo_transparent.png');
    });
  });

  describe('asset validation', () => {
    test('should validate existing asset', async () => {
      // Mock fetch to return success
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const isValid = await validateAsset('art/test.png');
      expect(isValid).toBe(true);
    });

    test('should return false for non-existing asset', async () => {
      // Mock fetch to return 404
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const isValid = await validateAsset('art/nonexistent.png');
      expect(isValid).toBe(false);
    });

    test('should return false when fetch throws', async () => {
      // Mock fetch to throw
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const isValid = await validateAsset('art/error.png');
      expect(isValid).toBe(false);
    });
  });

  describe('asset preloading', () => {
    test('should preload image successfully', async () => {
      const img = await preloadImage('art/test.png');
      expect(img).toBeDefined();
      expect(img.src).toContain('/art/test.png');
    });

    test('should reject when image fails to load', async () => {
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

      await expect(preloadImage('art/failing.png')).rejects.toBeUndefined();
    });

    test('should preload video successfully', async () => {
      // Mock video element
      const mockVideo = {
        onloadeddata: null as (() => void) | null,
        onerror: null,
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

      const video = await preloadVideo('art/test.mp4');
      expect(video).toBe(mockVideo);
      expect(video.src).toContain('/art/test.mp4');
    });

    test('should reject when video fails to load', async () => {
      // Mock video element to fail
      const mockVideo = {
        onloadeddata: null,
        onerror: null as (() => void) | null,
        src: '',
        preload: '',
      };

      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'video') {
          setTimeout(() => {
            if (mockVideo.onerror) {
              mockVideo.onerror();
            }
          }, 0);
          return mockVideo as HTMLVideoElement;
        }
        return document.createElement(tagName);
      });

      await expect(preloadVideo('art/failing.mp4')).rejects.toBeUndefined();
    });
  });

  describe('ASSET_PATHS constant', () => {
    test('should have all required asset paths', () => {
      expect(ASSET_PATHS.npcPortraits.aria).toBe('art/npc/aria/aria_portrait.png');
      expect(ASSET_PATHS.npcCinematics.kai).toBe('art/npc/kai/kai_gacha_cinematic.mp4');
      expect(ASSET_PATHS.memoryPlaceholder).toBe('art/memories_image_placeholder.png');
      expect(ASSET_PATHS.playerPortrait).toBe('art/player_portrait.png');
      expect(ASSET_PATHS.logo).toBe('art/love_pets_logo_transparent.png');
      expect(ASSET_PATHS.ui.gachaBanner).toBe('art/ui/gacha_banner.svg');
    });
  });
});
