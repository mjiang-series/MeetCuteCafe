/**
 * Core game data types and interfaces
 * Based on Meet Cute Cafe Game Spec
 */

// Core game types
export type Affinity = 'Sweet' | 'Salty' | 'Bitter' | 'Spicy' | 'Fresh';
export type Rarity = '3★' | '4★' | '5★';
export type OrderKind = 'Customer' | 'NPC';
export type MemoryFormat = 'Drabble' | 'DM' | 'VN';
export type NpcId = 'aria' | 'kai' | 'elias';
export type BannerId = string;

// Player state
export interface Player {
  playerId: string;
  createdAt: number;
  lastSeenAt: number;
  coins: number;
  diamonds: number;
  consumables: {
    sugar: number;
    coffee: number;
    mint: number;
    pepper: number;
    salt: number;
  };
  tokens: number;
  flavors: PlayerFlavor[];
  journal: JournalIndex;
  npc: Record<NpcId, PlayerNpc>;
  dailySeed: string;
  orderBoard: OrderBoardState;
  bannersSeen: string[];
  pity: Record<BannerId, number>;
  settings: PlayerSettings;
  pendingActions: PendingAction[];
}

// Flavor system
export interface FlavorDef {
  flavorId: string;
  name: string;
  affinity: Affinity;
  rarity: Rarity;
  artKeyframeId: string;
  loreTag?: string;
  basePower: number;
}

export interface PlayerFlavor {
  flavorId: string;
  level: number;
  acquiredAt: number;
  favorite?: boolean;
  cosmetics?: string[];
}

export interface FlavorUpgradeRule {
  level: number;
  coins: number;
  consumables: Partial<Record<'sugar' | 'coffee' | 'mint' | 'pepper' | 'salt', number>>;
}

// Order system
export interface OrderRequirements {
  slots: Array<{
    affinity: Affinity;
    minLevel?: number;
  }>;
  minPower?: number;
}

export interface OrderRewards {
  coins: number;
  diamonds?: number;
  memoryCandidate?: boolean;
}

export interface OrderBase {
  orderId: string;
  kind: OrderKind;
  createdAt: number;
  expiresAt: number;
  requirements: OrderRequirements;
  rewards: OrderRewards;
  npcId?: NpcId;
  status: 'available' | 'submitted' | 'completed' | 'expired';
  customerType?: string; // For customer orders
  urgency?: 'low' | 'medium' | 'high'; // For customer orders
}

export interface OrderBoardState {
  day: string;
  customerOrders: OrderBase[];
  npcOrders: OrderBase[];
}

// Memory and Journal system
export interface DMThread {
  messages: Array<{
    from: 'Player' | 'NPC';
    text: string;
    ts: number;
  }>;
}

export interface Memory {
  memoryId: string;
  npcId: NpcId;
  createdAt: number;
  keyframeId: string;
  summary: string;
  format: MemoryFormat;
  extendedText?: string;
  dmThread?: DMThread;
  mood?: 'Cozy' | 'Playful' | 'Tender' | 'Yearning' | 'Bittersweet';
  location?: 'Cafe' | 'Park' | 'Bakery' | 'Styling' | 'Street' | 'Home' | string;
  tags?: string[];
  unread: boolean;
}

export interface JournalIndex {
  entries: Memory[];
  filters?: {
    npcId?: NpcId;
    mood?: Memory['mood'];
    from?: number;
    to?: number;
  };
}

// NPC system
export interface NpcDef {
  npcId: NpcId;
  displayName: string;
  personaTags: string[];
  bondGates: Array<{
    level: number;
    unlocks: ('DM' | 'Call' | 'Scene')[];
  }>;
  portraitIds: string[];
}

export interface PlayerNpc {
  npcId: NpcId;
  bondXp: number;
  level: number;
  unreadDmCount: number;
  callAvailable: boolean;
  scenesSeen: string[];
}

// Gacha system
export interface BannerDef {
  bannerId: BannerId;
  name: string;
  startAt: number;
  endAt: number;
  pool: Array<{
    flavorId: string;
    weight: number;
  }>;
  pity?: {
    count: number;
    guarantees: Rarity;
  };
  cost: {
    diamonds: number;
  };
}

export interface GachaResult {
  pulls: Array<{
    flavorId: string;
    rarity: Rarity;
    isDuplicate: boolean;
  }>;
  tokensGained: number;
}

// Economy
export interface EconomyTables {
  coinRewards: {
    customerEasy: number;
    customerMed: number;
    customerHard: number;
    npcBase: number;
  };
  diamondRewards: {
    npcBase: number;
    customerChancePctByStreak: number[];
  };
  upgradeCosts: Record<number, FlavorUpgradeRule>;
  tokenShop?: Array<{
    id: string;
    cost: number;
    reward: {
      flavorId?: string;
      cosmeticsId?: string;
    };
  }>;
}

// State management
export interface PendingAction {
  id: string;
  kind: 'orderSubmit' | 'memoryView' | 'gachaPull' | 'flavorUpgrade';
  payload: unknown;
  createdAt: number;
}

export interface PlayerSettings {
  sfx: number;
  music: number;
  tts: boolean;
  notifications: boolean;
  locale: 'en';
}

// Telemetry
export type TelemetryEvent =
  | { t: 'order_submit'; orderId: string; kind: OrderKind; ok: boolean; durationMs: number }
  | { t: 'memory_view'; memoryId: string; npcId: NpcId; format: MemoryFormat }
  | { t: 'dm_send'; npcId: NpcId; chars: number }
  | { t: 'gacha_pull'; bannerId: BannerId; pulls: number; diamonds: number }
  | { t: 'flavor_upgrade'; flavorId: string; toLevel: number };

// Asset references
export interface AssetPaths {
  npcPortraits: Record<NpcId, string>;
  npcCinematics: Record<NpcId, string>;
  memoryPlaceholder: string;
  playerPortrait: string;
  logo: string;
  ui: {
    gachaBanner: string;
    placeholderButton: string;
    placeholderIcon: string;
    blogPlaceholder: string;
  };
}
