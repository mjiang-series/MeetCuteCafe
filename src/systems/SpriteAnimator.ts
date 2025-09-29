/**
 * Sprite Animation System for Meet Cute Cafe
 * Handles 2D sprite animations, tile-based positioning, and animation loops
 */

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteAnimation {
  name: string;
  frames: SpriteFrame[];
  frameRate: number; // frames per second
  loop: boolean;
  pingPong?: boolean; // reverse animation when reaching end
}

export interface SpriteSheet {
  imagePath: string;
  tileWidth: number;
  tileHeight: number;
  animations: Record<string, SpriteAnimation>;
}

export interface AnimatedSprite {
  id: string;
  spriteSheet: SpriteSheet;
  currentAnimation: string;
  currentFrame: number;
  lastFrameTime: number;
  isPlaying: boolean;
  direction: 1 | -1; // for ping-pong animations
  onAnimationComplete?: () => void;
}

export class SpriteAnimator {
  private sprites: Map<string, AnimatedSprite> = new Map();
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;

  constructor() {
    this.startAnimationLoop();
  }

  /**
   * Create a new animated sprite
   */
  createSprite(
    id: string,
    spriteSheet: SpriteSheet,
    initialAnimation: string = 'idle'
  ): AnimatedSprite {
    const sprite: AnimatedSprite = {
      id,
      spriteSheet,
      currentAnimation: initialAnimation,
      currentFrame: 0,
      lastFrameTime: 0,
      isPlaying: true,
      direction: 1,
    };

    this.sprites.set(id, sprite);
    return sprite;
  }

  /**
   * Play animation on sprite
   */
  playAnimation(
    spriteId: string,
    animationName: string,
    onComplete?: () => void
  ): boolean {
    const sprite = this.sprites.get(spriteId);
    if (!sprite || !sprite.spriteSheet.animations[animationName]) {
      return false;
    }

    sprite.currentAnimation = animationName;
    sprite.currentFrame = 0;
    sprite.lastFrameTime = 0;
    sprite.isPlaying = true;
    sprite.direction = 1;
    sprite.onAnimationComplete = onComplete;

    return true;
  }

  /**
   * Pause/resume sprite animation
   */
  setSpritePlaying(spriteId: string, playing: boolean): void {
    const sprite = this.sprites.get(spriteId);
    if (sprite) {
      sprite.isPlaying = playing;
    }
  }

  /**
   * Get current frame data for sprite
   */
  getCurrentFrame(spriteId: string): SpriteFrame | null {
    const sprite = this.sprites.get(spriteId);
    if (!sprite) return null;

    const animation = sprite.spriteSheet.animations[sprite.currentAnimation];
    if (!animation || animation.frames.length === 0) return null;

    return animation.frames[sprite.currentFrame] || null;
  }

  /**
   * Generate CSS background-position for sprite
   */
  getSpriteCSSPosition(spriteId: string): string {
    const frame = this.getCurrentFrame(spriteId);
    if (!frame) return '0 0';

    return `-${frame.x}px -${frame.y}px`;
  }

  /**
   * Generate CSS for sprite element
   */
  getSpriteCSS(spriteId: string): Record<string, string> {
    const sprite = this.sprites.get(spriteId);
    const frame = this.getCurrentFrame(spriteId);
    
    if (!sprite || !frame) {
      return {};
    }

    return {
      'background-image': `url(${sprite.spriteSheet.imagePath})`,
      'background-position': this.getSpriteCSSPosition(spriteId),
      'width': `${frame.width}px`,
      'height': `${frame.height}px`,
      'background-repeat': 'no-repeat',
    };
  }

  /**
   * Update all sprite animations
   */
  private update(currentTime: number): void {
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    this.sprites.forEach((sprite) => {
      if (!sprite.isPlaying) return;

      const animation = sprite.spriteSheet.animations[sprite.currentAnimation];
      if (!animation || animation.frames.length === 0) return;

      const frameDuration = 1000 / animation.frameRate; // ms per frame
      sprite.lastFrameTime += deltaTime;

      if (sprite.lastFrameTime >= frameDuration) {
        sprite.lastFrameTime = 0;

        if (animation.pingPong) {
          // Ping-pong animation
          sprite.currentFrame += sprite.direction;

          if (sprite.currentFrame >= animation.frames.length - 1) {
            sprite.direction = -1;
            sprite.currentFrame = animation.frames.length - 1;
          } else if (sprite.currentFrame <= 0) {
            sprite.direction = 1;
            sprite.currentFrame = 0;
            
            if (!animation.loop && sprite.onAnimationComplete) {
              sprite.onAnimationComplete();
            }
          }
        } else {
          // Normal animation
          sprite.currentFrame++;

          if (sprite.currentFrame >= animation.frames.length) {
            if (animation.loop) {
              sprite.currentFrame = 0;
            } else {
              sprite.currentFrame = animation.frames.length - 1;
              sprite.isPlaying = false;
              
              if (sprite.onAnimationComplete) {
                sprite.onAnimationComplete();
              }
            }
          }
        }
      }
    });
  }

  /**
   * Start the animation loop
   */
  private startAnimationLoop(): void {
    const animate = (currentTime: number) => {
      this.update(currentTime);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop the animation loop
   */
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.sprites.clear();
  }

  /**
   * Remove a sprite
   */
  removeSprite(spriteId: string): void {
    this.sprites.delete(spriteId);
  }

  /**
   * Get all active sprites
   */
  getActiveSprites(): string[] {
    return Array.from(this.sprites.keys());
  }
}

/**
 * Helper function to create common cafe sprite sheets
 */
export function createCafeSpriteSheets(): Record<string, SpriteSheet> {
  return {
    // NPC sprite sheets (placeholder - would use actual sprite images)
    aria: {
      imagePath: '/art/npc/aria/aria_portrait.png', // Placeholder - would be sprite sheet
      tileWidth: 32,
      tileHeight: 48,
      animations: {
        idle: {
          name: 'idle',
          frames: [
            { x: 0, y: 0, width: 32, height: 48 },
            { x: 32, y: 0, width: 32, height: 48 },
          ],
          frameRate: 2,
          loop: true,
          pingPong: true,
        },
        wave: {
          name: 'wave',
          frames: [
            { x: 64, y: 0, width: 32, height: 48 },
            { x: 96, y: 0, width: 32, height: 48 },
            { x: 128, y: 0, width: 32, height: 48 },
          ],
          frameRate: 4,
          loop: false,
        },
      },
    },

    kai: {
      imagePath: '/art/npc/kai/kai_portrait.png',
      tileWidth: 32,
      tileHeight: 48,
      animations: {
        idle: {
          name: 'idle',
          frames: [
            { x: 0, y: 0, width: 32, height: 48 },
            { x: 32, y: 0, width: 32, height: 48 },
          ],
          frameRate: 1.5,
          loop: true,
          pingPong: true,
        },
        cooking: {
          name: 'cooking',
          frames: [
            { x: 64, y: 0, width: 32, height: 48 },
            { x: 96, y: 0, width: 32, height: 48 },
          ],
          frameRate: 3,
          loop: true,
        },
      },
    },

    elias: {
      imagePath: '/art/npc/elias/elias_portrait.png',
      tileWidth: 32,
      tileHeight: 48,
      animations: {
        idle: {
          name: 'idle',
          frames: [
            { x: 0, y: 0, width: 32, height: 48 },
            { x: 32, y: 0, width: 32, height: 48 },
          ],
          frameRate: 1,
          loop: true,
          pingPong: true,
        },
        reading: {
          name: 'reading',
          frames: [
            { x: 64, y: 0, width: 32, height: 48 },
          ],
          frameRate: 1,
          loop: true,
        },
      },
    },

    // Ambient animations
    steam: {
      imagePath: '/art/ui/placeholder_icon.svg', // Placeholder
      tileWidth: 16,
      tileHeight: 24,
      animations: {
        rise: {
          name: 'rise',
          frames: [
            { x: 0, y: 0, width: 16, height: 24 },
            { x: 16, y: 0, width: 16, height: 24 },
            { x: 32, y: 0, width: 16, height: 24 },
            { x: 48, y: 0, width: 16, height: 24 },
          ],
          frameRate: 2,
          loop: true,
        },
      },
    },

    // Interactive objects
    objects: {
      imagePath: '/art/ui/placeholder_icon.svg',
      tileWidth: 24,
      tileHeight: 24,
      animations: {
        orderBook: {
          name: 'orderBook',
          frames: [
            { x: 0, y: 0, width: 24, height: 24 },
            { x: 24, y: 0, width: 24, height: 24 },
          ],
          frameRate: 1,
          loop: true,
          pingPong: true,
        },
        cashRegister: {
          name: 'cashRegister',
          frames: [
            { x: 48, y: 0, width: 24, height: 24 },
          ],
          frameRate: 1,
          loop: true,
        },
        flavorJar: {
          name: 'flavorJar',
          frames: [
            { x: 72, y: 0, width: 24, height: 24 },
            { x: 96, y: 0, width: 24, height: 24 },
          ],
          frameRate: 0.5,
          loop: true,
          pingPong: true,
        },
      },
    },
  };
}
