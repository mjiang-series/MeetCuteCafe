# Meet Cute Cafe — Game Spec

*Generated on 2025-09-29*

---

## 🤖 AI Implementation Instructions

### CRITICAL: Read These Instructions Before Implementation
(unchanged from template; keep robust logging, event handlers, loading/error states, responsive UI, and testing checklist.)

---

## 1. Game Concept Overview

### Scope (Prototype vs Full Experience)
This document targets a playable prototype. The scope and recommendations below are intentionally limited.

### Game Concept

#### One-sentence summary
**A dating-sim × idle autobattler hybrid** wrapped in the fantasy of managing a cozy café, where players meet new characters through chance encounters (“meet cutes”) and grow those connections into meaningful romances by fulfilling café orders, unlocking story vignettes, exchanging DMs, and engaging in gacha pulls that foster intimacy and emotional connection.

#### Prototype scope (what's in / out)
- **In scope (prototype):**
  - A playable slice that demonstrates both the café autobattle loop (orders + flavor upgrades) and the romance progression loop (memories/vignettes + bonds).
  - Three romanceable NPCs present from the start (Aria — Bakery, Kai — Playground, Elias — Styling), with roughly equal narrative depth.
  - A curated starter set of **Flavors** across five affinities: Sweet, Salty, Bitter, Spicy, Fresh.
  - The **Journal** implemented as the single archive/timeline for all Memories (no public Blog). 
  - Communication channels limited to `DMs` and voice calls for the prototype (video calls later).

- **Out of scope (prototype):**
  - Large-scale flavor expansions or deeply branching endings.
  - Additional romanceable characters beyond the core three.
  - Video call interactions.
  - Multiplayer/social layers beyond single-player.

#### High-level gameplay fantasy
- You manage a warm café that becomes a stage for “meet cutes.” Through small, meaningful actions—fulfilling customer and NPC orders, upgrading flavor cards, and responding to story vignettes—you grow casual encounters into deep emotional bonds.
- Tone is **earnest and heartfelt** with light, flirty moments.
- Collection is rewarding because **stronger Flavors unlock richer story vignettes**.

#### Audience
Female-leaning mobile players aged 18–34 who enjoy cozy romance sims, idle autobattlers, and gacha-based collection.

#### References / Inspirations
- Love and Deepspace (romance-forward routes, DM/Call UX)
- AFK Arena (idle autobattler structure guiding order fulfillment)

#### Notes on narrative focus
Orders generate Memories, the Journal makes them feel collected and consequential, and `DMs` + voice calls let NPCs react in ways that foster intimacy across three equally supported romance paths.

---

## 2. Game Flow & Mechanics (Revised)

### Main screens / states
- **Title / Main Menu** — Start / Continue.
- **Café Overview (Hub)** — animated **2D café scene** (living diorama):
  - **Chibi Aria/Kai/Elias** animate when present (not guaranteed at all times).
  - **Customers drift in/out**, representing background fulfillment of Customer Orders.
  - **Ambient idle animations** (steam, tray depletion, waves).
  - **Interactive hotspots** (diegetic props → system screens):
    - **Counter** → Customer & NPC Orders
    - **Phone** → NPC Interaction Menu (DMs, calls, bond view)
    - **Gacha machine** → Flavor pulls
    - **Bookshelf / recipe stand** → Flavor Collection & Management (premium story collectibles)
    - **Journal book** → **Journal** (archive of Memories)
    - **Shop sign** → Shop (currency packs, consumables, cosmetics)
  - The café is both the **narrative wrapper** and the **navigation hub**.
- **Order Board (Customer Orders)** — daily list; rewards = coins/XP.
- **NPC Order Screen** — special requests; rewards = coins + diamonds + guaranteed Memory.
- **Flavor Collection / Management** — browse/upgrade Flavors (sugar, coffee, mint, pepper, salt).
- **Order Results** — rewards summary (+ Memory preview for NPC orders).
- **Journal (Memory Archive)** — timeline of Memories; filters (NPC, mood, date); favorites.
- **Memory Detail View** — keyframe + summary + expanded vignette (drabble, DM, VN).
- **Gacha** — banners; single/10x pulls; dupe → tokens.
- **NPC Interaction (DMs & Calls)** — story scenes unlocked by bonds.
- **Pause / Settings** — global.

### Core game loop (player-visible)
1. Collect and upgrade **Flavors** (Sweet/Salty/Bitter/Spicy/Fresh).
2. Fulfill **Customer Orders** to earn coins/XP.
3. Fulfill **NPC Orders** to earn coins + diamonds + a **Memory** (vignette).
4. Each Memory includes:
   - Keyframe image,
   - Tweet-length summary,
   - One expanded format: **Drabble (60%)**, **DM exchange (35%)**, **VN snippet (5%)**.
5. Memory auto-saves to the **Journal**.
6. Viewing a new Memory applies **bond gains** to the tagged NPC; may trigger DMs/calls.
7. Spend **coins** to upgrade Flavors; spend **diamonds** to pull new Flavors; **tokens** from dupes fund cosmetics/targeted pulls.
8. Repeat daily as orders refresh; expand Flavor set; deepen bonds.

### Core mechanics
1. **Flavors (collectible cards)**
   - Five affinities; rarity tiers **3★ / 4★ / 5★** (vignette depth & pull weights).
   - Upgrades consume coins + (sugar/coffee/mint/pepper/salt).
2. **Orders (autobattler equivalent)**
   - **Customer**: pre-generated daily list → coins.
   - **NPC**: personalized → coins + diamonds + Memory.
3. **Memories (story vignettes)**
   - Generated by NPC orders; some rare Customer orders may also trigger.
   - Bond gains applied **when viewed** in Journal.
4. **Journal (archive system)**
   - Timeline, filters, favorites; “NEW” until viewed.
5. **Bonds & NPC Interactions**
   - Bonds rise with viewed Memories; milestones unlock DMs/calls/cinematics.
6. **Economy**
   - **Coins** → upgrades; **Diamonds** → gacha; **Consumables** → upgrades; **Tokens** → cosmetics/targeted pulls.

### Transitions & triggers
- Selecting an order → fulfillment → results.
- NPC order completion → generates Memory → Journal.
- Viewing Memory → bond XP & possible DM/call notification.
- Closing scenes → return to hub.

---

## 3. UI/UX (Revised)

### Core Principles
- **Romance-first**, inspired by **Love and Deepspace**: diegetic navigation (phone, journal, café scene), character presence, cinematic story surfaces.
- **Minimal HUD**: top bar shows coins, diamonds, consumables. No bond shortcuts.
- **Hotspot-driven nav**: café props lead to systems; chibis (when present) act as optional shortcuts.
- **Genre familiarity**: LD-like DM chats, vignette cards, contact list.

### Screen Map & Example Flows
- **Top HUD**: coins/diamonds/consumables only.
- **Café Hub hotspots**:
  - Counter → Orders; *example*: complete order → hand-over animation → tap counter → Order Board.
  - Phone → NPC list; *example*: phone → Kai shows “1 unread” → open DM.
  - Journal book → Journal; *example*: filter by Elias → view new Memory.
  - Bookshelf → Flavors; *example*: open 4★ Bitter → upgrade.
  - Gacha machine → pulls; *example*: 10x → 5★ cinematic reveal.
- **Order Fulfillment**: drag Flavors into slots → confirm.
- **Order Results**: rewards + Memory preview (if any).
- **Journal**: LD-style feed; “NEW” badge until viewed.
- **Memory Detail**: keyframe + summary + expanded text/dialog.
- **DMs**: chat bubbles, quick replies + free-text.
- **Calls**: fullscreen portrait + short TTS snippet.
- **Gacha**: banner carousel; rarity-tiered animations.
- **Flavor Collection**: grid with rarity colors & upgrades.

### Visual Feedback & Behavior
- Micro-animations (≤200ms); crossfades & slide-in modals.
- Pull reveals: **3★** blue flip, **4★** gold burst, **5★** cinematic cut-in.
- Notifications: badges for unread DMs, new Memories, call availability.

---

## 4. Implementation (Flavor‑First, Procedural Orders)

### Platform & Tech
- Engine-agnostic core (TypeScript logic) + client binding (Unity 2D or Web).
- Target 60fps; prioritize café animation and low-latency UI.

### Architecture (Modules)
1. **OrderGen** — procedural Customer/NPC orders; difficulty curves; inventory-aware constraints.
2. **FlavorSystem** — collection, upgrades, rarity (**3★/4★/5★**).
3. **AutobattleOrders** — submission/validation; reward calc; memory hooks.
4. **MemorySystem** — builds Memory payloads; writes to Journal.
5. **Journal** — index, filters, unread flags, favorites.
6. **NPCInteractions** — DM/Call scenes; bond gates & notifications.
7. **Gacha** — banners, pulls, pity; dupe→token conversion; reveals.
8. **Economy** — currencies, sinks/sources, price tables.
9. **State & Persistence** — store, autosave, cloud sync, optimistic ops.
10. **UX Shell** — Hub, hotspots, HUD, overlays.

### Procedural Order Generation (OrderGen)
- **Daily seed**: `hash(YYYY-MM-DD + playerId)` for repro.
- **Feasibility**: generate orders solvable with current inventory (allow small stretch %).
- **Constraints**:
  - `requiredAffinities`: 1–3 slots with optional `minLevel`.
  - `rarityBias`: ramp 4★/5★ demand over time.
  - `rewardCurve`: coins by difficulty; diamonds chance on hard customer orders; guaranteed diamonds on NPC orders.
  - **Counts**: 12–20 Customer/day across easy/med/hard buckets.
- **NPC schedules**: ~3/day rotating (Aria/Kai/Elias), anti-duplication, anti-starvation.
- **Variety**: tags (time-of-day/weather) for summary flavor.
- **Live-ops hooks**: event modifiers (e.g., Spicy Week).

### Order Resolution
- Drag/drop → validate affinity/level → deterministic rewards `{{coins, diamonds?, memoryCandidate?}}` → if `memoryCandidate`, invoke MemorySystem.

### Memory + Journal
- Memory always: keyframe + summary + **Drabble(60%) / DM(35%) / VN(5%)**.
- Journal append with metadata `{{npcId, mood, location, ts, unread:true}}`.
- Viewing applies bond XP; may enqueue DM/Call.

### Flavor System
- Affinities: Sweet/Salty/Bitter/Spicy/Fresh.
- Rarity: **3★/4★/5★**; upgrades require coins + affinity consumables.
- Dupes→Tokens: cosmetics/targeted pulls.

### State & Persistence
- Single store with slices: `player, flavors, orders, journal, npc, economy, gacha`.
- Autosave: on order complete, memory view, pulls, upgrades.
- Cloud sync: anonymous default; link for multi-device.

### AI/LLM & TTS Integration (hooks)
- **POV constraint**: All generated content must use **second person (“you”)**; prompts/templates enforce reader-insert style.
- DM generation (short, persona-bound); caption assist; call snippets (10–20s TTS); safety: grounded to state, never grant items.

#### Example Prompt Templates (Second‑Person POV)

**1. Memory (Drabble)**
```
System: You are generating a short drabble-style vignette for a romance game. 
The player is always addressed in second person (“you”), never in third person.
Do not describe the player by name or appearance. 
Tone is earnest, heartfelt, with light romantic tension.

Input:
- NPC: Kai (playful, teasing, loyal)
- Mood: Cozy
- Location: Café
- Context: NPC Order just completed, Flavor = Sweet
- Bond Level: 2

Output (Drabble, 2–3 sentences):
“You place the cup in front of Kai, and his grin widens as he leans across the counter. 
You feel the warmth of the mug lingering in your hands even after he takes it. 
‘You always know exactly what I need,’ he says.”
```

**2. Memory (DM Exchange)**
```
System: Generate a short DM exchange between the player (“you”) and the NPC. 
Always write in chat bubble format, with the player in second person (“you”). 
Keep it to 3–4 lines total. NPC voice must match their persona tags.

Input:
- NPC: Aria (gentle, thoughtful, caring)
- Mood: Tender
- Context: Memory tagged “Late-night baking”
- Bond Level: 1

Output (DM format):
Aria: “Still awake? I just pulled something out of the oven.”
You: “I can practically smell it through the screen.”
Aria: “Come by tomorrow, and I’ll save you the first bite.”
```

**3. Memory (VN Snippet)**
```
System: Write a short visual-novel style scene. 
All narration must be in second person (“you”), NPCs speak in first person. 
Scene should be 3–5 lines max. 

Input:
- NPC: Elias (elegant, witty, genderfluid)
- Mood: Yearning
- Location: Styling corner
- Context: NPC Order Memory, Flavor = Bitter
- Bond Level: 3

Output:
“You step closer to Elias, the quiet hum of the salon filling the space between you. 
Their hand brushes yours as they pass the comb back, and your chest tightens. 
‘I wonder,’ Elias murmurs, eyes glinting, ‘how much longer you’ll make me wait to know your answer.’”
```

**4. DM Quick Reply Suggestions**
```
System: Generate 3 quick-reply suggestions the player can send in a DM. 
Each must be in second person (“you”), written as though the player is typing. 
Keep replies short (under 40 characters). 

Input:
- NPC: Kai
- Context: DM about the café being busy

Output:
1. “You always make the chaos fun 😅”
2. “You deserve a coffee break too.”
3. “Can I stop by to help out?”
```

**5. Call (TTS Script)**
```
System: Generate a short call snippet (10–20 seconds) for a romance game. 
NPC should directly address the player in second person (“you”). 
Tone should be warm, intimate, and conversational.

Input:
- NPC: Aria
- Mood: Cozy
- Context: Early bond call, after player viewed 2 Memories

Output:
“Hey… I know it’s late, but I wanted to hear your voice. 
You make me feel calmer, like the whole world slows down when I talk to you. 
Sleep well, okay? I’ll see you tomorrow.”
```

### Telemetry & Balancing
- Track order completion rates, Flavor upgrade funnels, pull conversions, Memory view→bond conversion, NPC engagement distribution.
- Tune order difficulty, diamond drip, consumable costs, and rarity tables via config.

---

## 5. Aesthetics (Revised)

### Visual Tone
- Cozy, romantic, contemporary. Animated 2D café with parallax; chibi NPCs in hub; romance scenes use higher-fidelity portraits with subtle loops.
- Palette: warm pastels; color-independent cues for accessibility.

### Café Hub Presentation
- Living diorama: customers enter/exit; steam curls; tray depletion; soft doorbell.
- Chibi behaviors: walk/idle loops, light emotes on tap.
- Hotspots as props: counter/phone/bookshelf/journal/gacha/shop.

### Story Vignette Presentation (Memories)
- Card anatomy: keyframe, summary, mood chips.
- Expanded formats: Drabble (page-turn), DM (chat bubbles), VN (portrait cut-ins, soft bloom).
- Journal: “NEW” badge until viewed; favorite ribbon.

### Gacha & Rarity Language
- **3★**: quick flip, soft blue halo.
- **4★**: slower card lift, gold burst, particle confetti.
- **5★**: music swell, vignette, portrait cut‑in with light rays.

### Motion & Audio
- Snappy feedback (150–250ms); crossfades; slide-up modals; gentle parallax.
- Music: lo‑fi café hub; warmer romance scenes; rarity stingers.
- SFX: tactile UI, page turns, reveal whooshes; diamond sparkle.
- Voice: short TTS for prototype; intimate mic, low reverb.

### Accessibility
- Scalable text; color + shape labels; captions for calls; reduce motion toggle.

---

## 6. Data Structures (Revised, Flavor‑First)

### Overview
Canonical entities supporting flavor collection, procedural orders, memory generation, journal archiving, and romance progression.

> TypeScript-style notation; masters in `/data/*.json`; player state persisted.

### 6.1 Player
```ts
interface Player {
  playerId: string;
  createdAt: number;
  lastSeenAt: number;
  coins: number;
  diamonds: number;
  consumables: { sugar: number; coffee: number; mint: number; pepper: number; salt: number; };
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
```

### 6.2 Flavor
```ts
type Affinity = 'Sweet'|'Salty'|'Bitter'|'Spicy'|'Fresh';
type Rarity = '3★'|'4★'|'5★';

interface FlavorDef {
  flavorId: string;
  name: string;
  affinity: Affinity;
  rarity: Rarity;
  artKeyframeId: string;
  loreTag?: string;
  basePower: number;
}
interface PlayerFlavor {
  flavorId: string;
  level: number;
  acquiredAt: number;
  favorite?: boolean;
  cosmetics?: string[];
}
interface FlavorUpgradeRule {
  level: number;
  coins: number;
  consumables: Partial<Record<'sugar'|'coffee'|'mint'|'pepper'|'salt', number>>;
}
```

### 6.3 Orders
```ts
type OrderKind = 'Customer'|'NPC';
interface OrderRequirements { slots: Array<{ affinity: Affinity; minLevel?: number }>; minPower?: number; }
interface OrderRewards { coins: number; diamonds?: number; memoryCandidate?: boolean; }
interface OrderBase {
  orderId: string; kind: OrderKind; createdAt: number; expiresAt: number;
  requirements: OrderRequirements; rewards: OrderRewards; npcId?: NpcId;
  status: 'available'|'submitted'|'completed'|'expired';
}
interface OrderBoardState { day: string; customerOrders: OrderBase[]; npcOrders: OrderBase[]; }
```

### 6.4 Memory
```ts
type MemoryFormat = 'Drabble'|'DM'|'VN';
interface DMThread { messages: Array<{ from: 'Player'|'NPC'; text: string; ts: number; }>; }
interface Memory {
  memoryId: string; npcId: NpcId; createdAt: number;
  keyframeId: string; summary: string; format: MemoryFormat;
  extendedText?: string; dmThread?: DMThread;
  mood?: 'Cozy'|'Playful'|'Tender'|'Yearning'|'Bittersweet';
  location?: 'Cafe'|'Park'|'Bakery'|'Styling'|'Street'|'Home'|string;
  tags?: string[]; unread: boolean;
}
```

### 6.5 Journal
```ts
interface JournalIndex {
  entries: Memory[];
  filters?: { npcId?: NpcId; mood?: Memory['mood']; from?: number; to?: number; };
}
```

### 6.6 NPC
```ts
type NpcId = 'aria'|'kai'|'elias';
interface NpcDef {
  npcId: NpcId; displayName: string;
  personaTags: string[];
  bondGates: Array<{ level: number; unlocks: ('DM'|'Call'|'Scene')[] }>;
  portraitIds: string[];
}
interface PlayerNpc {
  npcId: NpcId; bondXp: number; level: number;
  unreadDmCount: number; callAvailable: boolean; scenesSeen: string[];
}
```

### 6.7 Gacha & Banners
```ts
type BannerId = string;
interface BannerDef {
  bannerId: BannerId; name: string; startAt: number; endAt: number;
  pool: Array<{ flavorId: string; weight: number }>; // rarity-weighted
  pity?: { count: number; guarantees: Rarity }; cost: { diamonds: number };
}
interface GachaResult { pulls: Array<{ flavorId: string; rarity: Rarity; isDuplicate: boolean }>; tokensGained: number; }
```

### 6.8 Economy
```ts
interface EconomyTables {
  coinRewards: { customerEasy: number; customerMed: number; customerHard: number; npcBase: number };
  diamondRewards: { npcBase: number; customerChancePctByStreak: number[] };
  upgradeCosts: Record<number, FlavorUpgradeRule>;
  tokenShop?: Array<{ id: string; cost: number; reward: { flavorId?: string; cosmeticsId?: string } }>;
}
```

### 6.9 State / Persistence
```ts
interface PendingAction { id: string; kind: 'orderSubmit'|'memoryView'|'gachaPull'|'flavorUpgrade'; payload: any; createdAt: number; }
interface PlayerSettings { sfx: number; music: number; tts: boolean; notifications: boolean; locale: 'en'; }
```

### 6.10 Telemetry (non‑PII)
```ts
type TelemetryEvent =
  | { t:'order_submit'; orderId:string; kind:OrderKind; ok:boolean; durationMs:number }
  | { t:'memory_view'; memoryId:string; npcId:NpcId; format:MemoryFormat }
  | { t:'dm_send'; npcId:NpcId; chars:number }
  | { t:'gacha_pull'; bannerId:BannerId; pulls:number; diamonds:number }
  | { t:'flavor_upgrade'; flavorId:string; toLevel:number };
```

---

## 7. Narrative Constraints

### Reader‑Insert POV (Second Person)
- **All story content — Memories, Journal entries, DMs, and Calls — must be written in second person ("you")**.
- Examples: ✅ “You hand Kai the drink…” / ❌ “Kai accepted the drink…”
- Implementation: Prompts/templates default to second person; NPC dialogue addresses the player directly; QA includes POV checks.

---

## 8. Balancing & Tuning Addendum (OrderGen + Economy)

### Daily Orders
- **Customer Orders** (12–20/day): Easy 50% (1 slot, 50–80 coins), Medium 35% (2 slots, L2+, 120–180), Hard 15% (3 slots, L3+, 250–350). 10–15% stretch rolls; hard orders small diamond chance that scales with streak.
- **NPC Orders** (~3/day): always feasible; rewards 200 coins + 10–15 diamonds + guaranteed Memory.

### Flavor & Gacha
- Base gacha rates: **3★ 70% / 4★ 27% / 5★ 3%**. Pity: ≥1 4★ per 10x; 1 5★ per 60 pulls.
- Upgrades: coins + affinity consumables; dupe→tokens (3★=1, 4★=5, 5★=20).

### Memory & Bonds
- Day 1: 2–3 NPC Orders guarantee early Memories; ongoing: ~1–2/day.
- Bond XP: view Memory +10; DM reply +2–5; Call +15 (cooldown).
- Milestones: L1 DM unlock (~1 Memory), L2 Call (~3 Memories), L3+ cinematic scenes (**5★-tier**).

### Diamond Economy
- Daily drip: NPC Orders ~30–45; Customer Orders ~5–10 (streak); Quests ~5–15 → total ~40–70/day (~1–2 pulls/day; ~1 10x/week).

### Progression Curves & Live Ops
- Coins: ~800–1,000/day early → ~2,500/day mid.
- Consumables tuned so ~1 focused Flavor upgrade/week.
- Events: affinity spotlights; seasonal 4★/5★ banners.
- Server config: adjust rarity bias, reward multipliers, stretch probability.

---

## 9. Implementation Order Recommendation

A suggested build order to minimize risk and maximize early testing value:

1. **OrderGen + Order UI** — implement daily procedural order generation and the Order Board/fulfillment screen.  
2. **MemorySystem + Journal** — ensure NPC Orders generate Memories and archive to Journal.  
3. **Flavor Collection & Upgrades** — allow player to view/upgrade Flavors, spend coins/consumables.  
4. **NPC Interactions (Phone)** — add DM list and chat UI, followed by simple call overlay.  
5. **Gacha** — implement banner data, pulls, and rarity-tiered reveal animations.  
6. **Economy & Persistence** — currency accrual, spend sinks, autosave/cloud sync.  
7. **Aesthetics & Audio polish** — animated café hub, chibi presence, ambient music, SFX.  
8. **AI/LLM hooks (optional prototype)** — DM/autotext generation, call snippet support.  
9. **Live Ops hooks** — banner/event config, server-driven tuning.

---

## 10. Data Management

### Goals
- Ensure resilience of save data across client updates and schema changes.  
- Support cloud sync for multi-device play.  
- Allow designers to hotfix balancing/config data without redeploy.

### Guidelines
- **Versioning**: All saved Player state includes a `schemaVersion`. Migrations applied on load if version < current.  
- **Content separation**: Store master data in `/data/*.json` (flavors, banners, order rules, NPC defs); never hardcode.  
- **Backups**: On each major version bump, client maintains one backup snapshot pre-migration.  
- **Cloud sync**: Conflict resolution = "latest timestamp wins" unless `pendingActions` queue is non-empty.  
- **Telemetry**: Aggregate to inform balancing; exclude PII.  

---

## 11. External Services & APIs

### Potential integrations
- **Analytics**: Session length, DAU/MAU, order completion funnels, gacha pull conversions, NPC engagement.  
- **A/B Config Service**: Server-driven tweaks to ordergen weights, banner rates, diamond drip.  
- **Push Notifications**: Mobile OS notifications for NPC DMs/calls, order refresh.  
- **Commerce**: Platform IAP APIs (Apple/Google).  
- **TTS Service**: Cloud-based synthesis for call snippets (prototype) with fallback to canned VO.  
- **Error Logging**: Crash/exception reporting service for stability.

### Requirements
- All external calls must fail gracefully.  
- Network outages must never block local play (orders, journal, gacha function offline).  
- Analytics and telemetry must be anonymized.  
- Security: Use HTTPS + auth tokens; never expose secret keys client-side.  

---
