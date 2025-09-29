/**
 * Movement System for NPCs and Customers
 * Handles pathfinding and character movement around the cafe
 */

import type { TileSystem, TilePosition } from './TileSystem';
import type { EventSystem } from './EventSystem';

export interface MovingCharacter {
  id: string;
  type: 'npc' | 'customer';
  currentPos: TilePosition;
  targetPos: TilePosition;
  color: string;
  speed: number; // tiles per second
  lastMoveTime: number;
  isMoving: boolean;
  path: TilePosition[];
  idleTime: number; // time to wait at destination
  maxIdleTime: number;
}

export class MovementSystem {
  private characters: Map<string, MovingCharacter> = new Map();
  private tileSystem: TileSystem;
  private eventSystem: EventSystem;
  private updateInterval: number | null = null;

  constructor(tileSystem: TileSystem, eventSystem: EventSystem) {
    this.tileSystem = tileSystem;
    this.eventSystem = eventSystem;
  }

  /**
   * Add a character to the movement system
   */
  addCharacter(character: Omit<MovingCharacter, 'lastMoveTime' | 'isMoving' | 'path' | 'idleTime'>): void {
    const fullCharacter: MovingCharacter = {
      ...character,
      lastMoveTime: 0,
      isMoving: false,
      path: [],
      idleTime: 0,
    };
    
    this.characters.set(character.id, fullCharacter);
  }

  /**
   * Remove a character
   */
  removeCharacter(id: string): void {
    this.characters.delete(id);
  }

  /**
   * Get all characters
   */
  getCharacters(): MovingCharacter[] {
    return Array.from(this.characters.values());
  }

  /**
   * Get character by ID
   */
  getCharacter(id: string): MovingCharacter | undefined {
    return this.characters.get(id);
  }

  /**
   * Start the movement system
   */
  start(): void {
    if (this.updateInterval) return;

    this.updateInterval = window.setInterval(() => {
      this.update();
    }, 100); // Update at 10 FPS
  }

  /**
   * Stop the movement system
   */
  stop(): void {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update all character movements
   */
  private update(): void {
    const currentTime = Date.now();

    this.characters.forEach((character) => {
      // Handle idle time
      if (!character.isMoving && character.idleTime > 0) {
        character.idleTime -= 100; // Reduce by update interval
        return;
      }

      // Check if it's time to move
      const timeSinceLastMove = currentTime - character.lastMoveTime;
      const moveInterval = 1000 / character.speed; // ms per tile

      if (timeSinceLastMove >= moveInterval) {
        this.moveCharacter(character, currentTime);
      }
    });
  }

  /**
   * Move a character one step
   */
  private moveCharacter(character: MovingCharacter, currentTime: number): void {
    // If not currently moving, pick a new destination
    if (!character.isMoving || character.path.length === 0) {
      this.startNewMovement(character);
    }

    // Move to next position in path
    if (character.path.length > 0) {
      const nextPos = character.path.shift()!;
      
      // Check if position is walkable and not occupied
      if (this.isPositionAvailable(nextPos, character.id)) {
        character.currentPos = nextPos;
        character.lastMoveTime = currentTime;
        
        // Emit movement event for UI updates
        this.eventSystem.emit('character:moved', {
          characterId: character.id,
          position: nextPos,
        });
      } else {
        // Position blocked, find new path
        this.startNewMovement(character);
      }
    }

    // Check if reached destination
    if (character.path.length === 0) {
      character.isMoving = false;
      character.idleTime = character.maxIdleTime;
    }
  }

  /**
   * Start new movement for character
   */
  private startNewMovement(character: MovingCharacter): void {
    const newTarget = this.getRandomWalkablePosition();
    if (newTarget) {
      character.targetPos = newTarget;
      character.path = this.findPath(character.currentPos, newTarget);
      character.isMoving = true;
      character.idleTime = 0;
    }
  }

  /**
   * Simple pathfinding (direct line with obstacle avoidance)
   */
  private findPath(start: TilePosition, end: TilePosition): TilePosition[] {
    const path: TilePosition[] = [];
    let current = { ...start };

    // Simple pathfinding - move towards target one axis at a time
    while (current.x !== end.x || current.y !== end.y) {
      const next = { ...current };

      // Move horizontally first
      if (current.x < end.x) {
        next.x++;
      } else if (current.x > end.x) {
        next.x--;
      }
      // Then vertically
      else if (current.y < end.y) {
        next.y++;
      } else if (current.y > end.y) {
        next.y--;
      }

      // Check if next position is valid
      if (this.tileSystem.isValidTilePosition(next) && this.tileSystem.isWalkable(next)) {
        path.push({ ...next });
        current = next;
      } else {
        // Hit obstacle, try alternate route
        break;
      }

      // Prevent infinite loops
      if (path.length > 20) break;
    }

    return path;
  }

  /**
   * Check if position is available (walkable and not occupied)
   */
  private isPositionAvailable(pos: TilePosition, excludeCharacterId: string): boolean {
    // Check if tile is walkable
    if (!this.tileSystem.isWalkable(pos)) {
      return false;
    }

    // Check if another character is at this position
    for (const [id, character] of this.characters) {
      if (id !== excludeCharacterId && 
          character.currentPos.x === pos.x && 
          character.currentPos.y === pos.y) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get random walkable position
   */
  private getRandomWalkablePosition(): TilePosition | null {
    const { width, height } = this.tileSystem.getDimensions();
    const maxAttempts = 50;

    for (let i = 0; i < maxAttempts; i++) {
      const pos: TilePosition = {
        x: Math.floor(Math.random() * (width - 4)) + 2, // Avoid edges
        y: Math.floor(Math.random() * (height - 4)) + 2,
      };

      if (this.isPositionAvailable(pos, '')) {
        return pos;
      }
    }

    return null; // Couldn't find valid position
  }

  /**
   * Create default NPCs and customers
   */
  static createDefaultCharacters(): Omit<MovingCharacter, 'lastMoveTime' | 'isMoving' | 'path' | 'idleTime'>[] {
    return [
      // NPCs
      {
        id: 'aria',
        type: 'npc',
        currentPos: { x: 8, y: 6 },
        targetPos: { x: 8, y: 6 },
        color: '#e17497', // Pink
        speed: 0.5, // Slow movement
        maxIdleTime: 5000, // 5 seconds idle
      },
      {
        id: 'kai',
        type: 'npc',
        currentPos: { x: 12, y: 6 },
        targetPos: { x: 12, y: 6 },
        color: '#4a90e2', // Blue
        speed: 0.8, // Medium movement
        maxIdleTime: 3000, // 3 seconds idle
      },
      {
        id: 'elias',
        type: 'npc',
        currentPos: { x: 15, y: 10 },
        targetPos: { x: 15, y: 10 },
        color: '#7ed321', // Green
        speed: 0.3, // Very slow movement
        maxIdleTime: 8000, // 8 seconds idle
      },
      // Customers
      {
        id: 'customer_1',
        type: 'customer',
        currentPos: { x: 5, y: 8 },
        targetPos: { x: 5, y: 8 },
        color: '#9b9b9b', // Gray
        speed: 1.0, // Normal speed
        maxIdleTime: 2000, // 2 seconds idle
      },
      {
        id: 'customer_2',
        type: 'customer',
        currentPos: { x: 14, y: 9 },
        targetPos: { x: 14, y: 9 },
        color: '#9b9b9b', // Gray
        speed: 1.2, // Slightly faster
        maxIdleTime: 1500, // 1.5 seconds idle
      },
      {
        id: 'customer_3',
        type: 'customer',
        currentPos: { x: 7, y: 11 },
        targetPos: { x: 7, y: 11 },
        color: '#9b9b9b', // Gray
        speed: 0.7, // Slower
        maxIdleTime: 3000, // 3 seconds idle
      },
    ];
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.characters.clear();
  }
}
