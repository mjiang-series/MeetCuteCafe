# Meet Cute Cafe - Incremental Project Plan

*Generated on 2025-09-29*

## Overview

This plan builds Meet Cute Cafe incrementally through 5 major phases, with each phase delivering a playable prototype that validates core mechanics. Each phase includes specific validation criteria and user testing to ensure we're building the right experience.

## Core Design Principles

- **Romance-First**: Every system supports the central romance progression
- **Test-Driven Development**: Comprehensive automated testing at each phase
- **Data-Driven**: All content and balancing configurable via JSON
- **Asset-Ready**: Leverage existing high-quality art assets (NPC portraits, cinematics, UI elements)
- **Second-Person POV**: All narrative content uses "you" perspective

---

## Phase 1: Core Foundation (Weeks 1-3)
*"Prove the basic loop works"*

### Deliverables
- Basic café hub with hotspot navigation
- Simple order system (Customer Orders only)
- Basic Flavor collection and upgrades
- Persistent header with currency display
- Core data persistence

### Technical Implementation

#### 1.1 Project Setup & Architecture (Week 1)
```typescript
// Core architecture setup
src/
├── data/           // JSON masters (flavors, orders, economy)
├── systems/        // Core game systems
├── ui/            // Screen components
├── models/        // Data interfaces
└── utils/         // Helpers and utilities
```

**Key Components:**
- `GameStateManager`: Central state management
- `EventSystem`: Pub/sub for component communication
- `PersistentHeader`: Top HUD with currencies
- `AssetManager`: Asset loading and caching

#### 1.2 Basic Café Hub (Week 1-2)
- Static café scene with interactive hotspots
- Counter → Order Board
- Basic navigation between screens
- Simple 2D sprite-based interface

#### 1.3 Order System Foundation (Week 2-3)
- `OrderGenerator`: Procedural Customer Orders
- `FlavorSystem`: Basic collection and upgrade mechanics
- Order fulfillment UI with drag-and-drop
- Reward calculation and currency earning

### Automated Testing Requirements
- [ ] Unit tests for OrderGenerator with 90%+ coverage
- [ ] Integration tests for order fulfillment flow
- [ ] Currency calculation validation tests
- [ ] Navigation state management tests
- [ ] Asset loading and error handling tests

### Testing Implementation
```typescript
// Example test structure for Phase 1
describe('OrderGenerator', () => {
  test('generates feasible orders with current inventory', () => {
    const generator = new OrderGenerator(mockGameState);
    const orders = generator.generateDailyOrders();
    
    orders.forEach(order => {
      expect(order.requirements.slots.length).toBeGreaterThan(0);
      expect(order.rewards.coins).toBeGreaterThan(0);
      expect(canFulfillOrder(order, mockGameState.flavors)).toBe(true);
    });
  });
  
  test('respects difficulty curves', () => {
    const easyOrders = generator.generateOrdersByDifficulty('easy');
    const hardOrders = generator.generateOrdersByDifficulty('hard');
    
    expect(easyOrders[0].requirements.slots.length).toBeLessThan(
      hardOrders[0].requirements.slots.length
    );
  });
});
```

---

## Phase 2: Romance Foundation (Weeks 4-6)
*"Introduce NPCs and basic relationship mechanics"*

### Deliverables
- Three NPCs (Aria, Kai, Elias) using actual portrait assets
- NPC Orders that generate simple Memories with placeholder images
- Basic Journal system for Memory viewing
- Simple DM system with canned responses
- Bond level tracking

### Available Assets Integration
- **NPC Portraits**: `art/npc/aria/aria_portrait.png`, `art/npc/kai/kai_portrait.png`, `art/npc/elias/elias_portrait.png`
- **Cinematic Videos**: 5-star reveal cinematics available for each NPC
- **Memory Placeholder**: `art/memories_image_placeholder.png`
- **Player Portrait**: `art/player_portrait.png` for DM interface

### Technical Implementation

#### 2.1 NPC System (Week 4)
- `NPCManager`: Character data and state management
- `BondSystem`: XP tracking and level progression
- NPC portraits and basic personality data
- NPC Order generation with guaranteed Memory rewards

#### 2.2 Memory System (Week 4-5)
- `MemoryGenerator`: Template-based Memory creation
- `JournalScreen`: Timeline view of Memories
- Basic Memory templates for each café section
- Memory viewing increases bond XP

#### 2.3 Basic DM System (Week 5-6)
- `ConversationManager`: Message history and state
- `DMScreen`: Chat interface with NPCs
- Pre-written response patterns based on bond level
- Quick reply options for player responses

### Automated Testing Requirements
- [ ] Unit tests for MemoryGenerator template system
- [ ] Integration tests for NPC Order → Memory → Bond flow
- [ ] DM conversation state management tests
- [ ] Bond XP calculation and level progression tests
- [ ] Asset loading tests for NPC portraits and cinematics

### Testing Implementation
```typescript
describe('MemoryGenerator', () => {
  test('generates memories with correct NPC and asset references', () => {
    const memory = generator.generateMemory(mockShift, mockPets);
    
    expect(memory.taggedNPCs).toContain(mockShift.helperNpcId);
    expect(memory.imageUrl).toBe('art/memories_image_placeholder.png');
    expect(memory.content).toMatch(/Aria|Kai|Elias/);
  });
  
  test('bond XP applied when memory viewed', () => {
    const initialBond = gameState.getNPCBondLevel('aria');
    journalScreen.viewMemory(memory.id);
    
    expect(gameState.getNPCBondLevel('aria')).toBeGreaterThan(initialBond);
  });
});

describe('DMSystem', () => {
  test('loads correct NPC portrait in conversation', () => {
    const dmScreen = new DMScreen('aria');
    const portraitSrc = dmScreen.getNPCPortraitPath();
    
    expect(portraitSrc).toBe('art/npc/aria/aria_portrait.png');
  });
});
```

---

## Phase 3: Collection & Progression (Weeks 7-10)
*"Add depth through gacha and advanced systems"*

### Deliverables
- Complete Gacha system with 3★/4★/5★ Flavors using gacha banner UI
- Pity system and duplicate handling
- Advanced Flavor upgrades with consumables
- Enhanced Memory system with multiple formats
- Call system for NPCs with cinematic integration

### Available Assets Integration
- **Gacha Banner**: `art/ui/gacha_banner.svg` for pull interface
- **UI Elements**: `art/ui/placeholder_button.svg`, `art/ui/placeholder_icon.svg`
- **Cinematic Integration**: NPC cinematic videos for 5★ reveals

### Technical Implementation

#### 3.1 Gacha System (Week 7-8)
- `GachaSystem`: Pull mechanics with rarity weights
- Pity counter and guaranteed drops
- Duplicate → Token conversion system
- Reveal animations for different rarities
- Banner system for featured Flavors

#### 3.2 Advanced Memory System (Week 8-9)
- Multiple Memory formats: Drabble (60%), DM (35%), VN (5%)
- Enhanced Memory templates with rarity-based depth
- Memory filtering and favorites system
- Extended story content for higher-rarity Memories

#### 3.3 NPC Interaction Expansion (Week 9-10)
- `CallSystem`: Voice call interface with NPCs
- Bond milestone rewards (DM unlock, Call unlock)
- Contextual NPC responses based on recent activity
- Quick reply generation based on conversation context

### Automated Testing Requirements
- [ ] Unit tests for Gacha probability calculations and pity system
- [ ] Integration tests for pull → reveal → collection flow
- [ ] Memory format distribution tests (60% Drabble, 35% DM, 5% VN)
- [ ] Call system integration with cinematic playback
- [ ] Economic balance validation tests

### Testing Implementation
```typescript
describe('GachaSystem', () => {
  test('pity system guarantees 4★+ after threshold', () => {
    const gacha = new GachaSystem();
    gacha.pityCounter = 10; // At threshold
    
    const result = gacha.rollFlavor();
    expect(['4★', '5★']).toContain(result.rarity);
    expect(gacha.pityCounter).toBe(0);
  });
  
  test('5★ pulls trigger cinematic if available', async () => {
    const fiveStarFlavor = { rarity: '5★', npcAffinity: 'aria' };
    const cinematicSpy = jest.spyOn(cinematicPlayer, 'playReveal');
    
    await gachaScreen.processPullResult(fiveStarFlavor);
    
    expect(cinematicSpy).toHaveBeenCalledWith('art/npc/aria/aria_gacha_cinematic.mp4');
  });
});

describe('CallSystem', () => {
  test('call availability based on bond level', () => {
    gameState.setNPCBondLevel('kai', 2); // Level 2 = calls unlocked
    
    expect(callSystem.isCallAvailable('kai')).toBe(true);
    expect(callSystem.isCallAvailable('elias')).toBe(false); // Lower bond
  });
});
```

---

## Phase 4: Polish & Depth (Weeks 11-14)
*"Make everything feel premium and engaging"*

### Deliverables
- Animated café hub with living diorama
- Cinematic 5★ reveals and special effects
- Advanced AI-like NPC responses
- Complete economy balancing
- Audio and visual polish

### Technical Implementation

#### 4.1 Visual Polish (Week 11-12)
- Animated café scene with parallax layers
- Chibi NPC animations in hub
- Particle effects for gacha reveals
- Smooth transitions and micro-animations
- Responsive design optimization

#### 4.2 Advanced NPC AI (Week 12-13)
- `NPCResponseService`: Context-aware response generation
- Pet and Memory reference system in conversations
- Dynamic conversation topics based on game state
- Personality-driven response patterns

#### 4.3 Economy & Balance (Week 13-14)
- Complete economic tuning based on Phase 3 data
- Daily/weekly progression curves
- Consumable drop rates and upgrade costs
- Diamond economy and monetization hooks

### Validation Criteria
- [ ] Game feels polished and premium
- [ ] NPC conversations feel dynamic and contextual
- [ ] Economic progression feels fair and engaging
- [ ] Visual feedback enhances emotional connection
- [ ] Performance is smooth on target devices

### Testing Plan
- **Polish Assessment**: Visual and audio quality evaluation
- **AI Response Quality**: Conversation coherence and personality consistency
- **Economic Balance**: Long-term progression feels sustainable
- **Performance Testing**: Frame rate and loading time optimization

---

## Phase 5: Live Systems & Launch Prep (Weeks 15-18)
*"Prepare for sustainable live operation"*

### Deliverables
- Live-ops configuration system
- Analytics and telemetry integration
- Cloud save and multi-device sync
- Tutorial and onboarding flow
- Launch-ready build with all systems

### Technical Implementation

#### 5.1 Live Operations (Week 15-16)
- Server-driven configuration for rates and rewards
- Event system for seasonal content
- A/B testing framework integration
- Remote content updates capability

#### 5.2 Data & Analytics (Week 16-17)
- Comprehensive telemetry system
- Player progression analytics
- Monetization funnel tracking
- Retention and engagement metrics

#### 5.3 Launch Preparation (Week 17-18)
- Complete tutorial and onboarding
- Performance optimization
- Security and anti-cheat measures
- App store preparation and marketing assets

### Validation Criteria
- [ ] Tutorial successfully onboards new players
- [ ] Analytics provide actionable insights
- [ ] Live-ops systems work reliably
- [ ] Game is ready for public launch
- [ ] All critical bugs resolved

### Testing Plan
- **Beta Testing**: 50+ external testers for 2 weeks
- **Tutorial Effectiveness**: New player completion rates
- **Performance Validation**: Stress testing with realistic usage
- **Security Testing**: Anti-cheat and data protection validation

---

## Automated Testing Framework

### Testing Infrastructure
```typescript
// Jest + Testing Library setup
// tests/
├── unit/           // Individual system tests
├── integration/    // Cross-system flow tests  
├── e2e/           // End-to-end user journey tests
├── performance/   // Load and performance tests
└── fixtures/      // Mock data and test utilities
```

### Continuous Integration Pipeline
- **Pre-commit**: Linting, type checking, unit tests
- **PR Validation**: Full test suite + coverage report  
- **Nightly Builds**: Performance tests + asset validation
- **Release Validation**: E2E tests + regression suite

### Phase-Specific Test Requirements

#### Phase 1: Core Systems (90%+ Coverage)
```typescript
// Required test suites
- OrderGenerator: Procedural generation logic
- FlavorSystem: Collection and upgrade mechanics  
- CurrencyManager: Economic calculations
- GameStateManager: State persistence and loading
- AssetManager: Asset loading and error handling
```

#### Phase 2: Romance Systems (85%+ Coverage)
```typescript
// Required test suites  
- MemoryGenerator: Template system and asset integration
- NPCManager: Character data and bond progression
- ConversationManager: DM state and history
- JournalSystem: Memory archiving and filtering
- BondSystem: XP calculation and level progression
```

#### Phase 3: Advanced Systems (80%+ Coverage)
```typescript
// Required test suites
- GachaSystem: Probability calculations and pity mechanics
- CinematicPlayer: Video playback and asset loading
- CallSystem: NPC interaction unlocks
- EconomicBalance: Currency flow validation
- MemoryFormats: Distribution and generation quality
```

#### Phase 4: Polish & Integration (75%+ Coverage)
```typescript
// Required test suites
- AnimationSystem: Smooth transitions and performance
- NPCResponseService: Context-aware conversation
- UITransitions: Screen navigation and state management
- PerformanceMonitor: Frame rate and memory usage
- AccessibilityValidator: ARIA compliance and usability
```

#### Phase 5: Production Readiness (70%+ Coverage)
```typescript
// Required test suites
- DataMigration: Save file version compatibility
- CloudSync: Multi-device state synchronization
- ErrorReporting: Crash handling and logging
- SecurityValidator: Data protection and validation
- TutorialFlow: New player onboarding completion
```

### Automated Quality Gates

#### Code Quality
- **TypeScript**: Strict mode, no `any` types
- **ESLint**: Airbnb config with custom romance game rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality enforcement

#### Test Coverage Requirements
- **Unit Tests**: 90% statement coverage minimum
- **Integration Tests**: All critical user flows covered
- **E2E Tests**: Complete game loop validation
- **Performance Tests**: <100ms response time for UI interactions

#### Asset Validation
```typescript
describe('Asset Integration', () => {
  test('all NPC portraits load correctly', async () => {
    const npcs = ['aria', 'kai', 'elias'];
    
    for (const npcId of npcs) {
      const portraitPath = `art/npc/${npcId}/${npcId}_portrait.png`;
      await expect(loadAsset(portraitPath)).resolves.toBeDefined();
    }
  });
  
  test('cinematic videos are accessible', async () => {
    const cinematics = [
      'art/npc/aria/aria_gacha_cinematic.mp4',
      'art/npc/kai/kai_gacha_cinematic.mp4', 
      'art/npc/elias/elias_gacha_cinematic.mp4'
    ];
    
    for (const videoPath of cinematics) {
      await expect(validateVideoAsset(videoPath)).resolves.toBe(true);
    }
  });
});
```

### Performance Testing
```typescript
describe('Performance Benchmarks', () => {
  test('order generation completes under 50ms', async () => {
    const startTime = performance.now();
    const orders = await orderGenerator.generateDailyOrders();
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(50);
    expect(orders.length).toBeGreaterThan(10);
  });
  
  test('memory generation with assets under 100ms', async () => {
    const startTime = performance.now();
    const memory = await memoryGenerator.generateWithAssets(mockShift);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100);
    expect(memory.imageUrl).toContain('art/');
  });
});
```

---

## Risk Mitigation

### Technical Risks
- **Performance Issues**: Regular performance testing, optimization sprints
- **Data Loss**: Robust save system with cloud backup
- **Platform Compatibility**: Multi-device testing throughout development

### Design Risks
- **Romance Appeal**: Regular validation with target demographic
- **Economic Balance**: Conservative tuning with ability to adjust post-launch
- **Content Saturation**: Modular content system for easy expansion

### Schedule Risks
- **Feature Creep**: Strict phase boundaries, defer non-essential features
- **Technical Debt**: Regular refactoring sprints
- **Resource Constraints**: Prioritize core features, polish incrementally

---

## Success Metrics

### Phase 1 Success
- [ ] 90%+ test coverage on core systems
- [ ] All unit tests pass in <30 seconds
- [ ] Zero critical bugs in CI pipeline
- [ ] Asset loading tests validate all required files

### Phase 2 Success  
- [ ] 85%+ test coverage including romance systems
- [ ] Memory generation tests validate asset integration
- [ ] DM system integration tests pass
- [ ] Bond progression calculations verified

### Phase 3 Success
- [ ] 80%+ test coverage including gacha system
- [ ] Probability distribution tests validate fairness
- [ ] Cinematic integration tests pass
- [ ] Performance benchmarks under target thresholds

### Phase 4 Success
- [ ] 75%+ test coverage with polish systems
- [ ] UI/UX automated tests validate user flows
- [ ] Performance tests validate 60fps targets
- [ ] Accessibility tests pass compliance checks

### Phase 5 Success
- [ ] 70%+ test coverage with production systems
- [ ] E2E tests validate complete user journeys
- [ ] Security tests validate data protection
- [ ] Migration tests validate save compatibility

---

## Resource Requirements

### Development Team
- **Lead Developer**: Full-time, all phases
- **UI/UX Developer**: Full-time, all phases  
- **Game Designer**: Full-time, phases 2-5
- **Artist**: Part-time, phases 4-5
- **QA Tester**: Part-time, phases 3-5

### Tools & Infrastructure
- **Development**: TypeScript/JavaScript, Vite/Webpack for bundling
- **Testing**: Jest + Testing Library, Playwright for E2E tests
- **CI/CD**: GitHub Actions with automated testing pipeline
- **Asset Management**: Optimized loading for art assets we have available
- **Performance**: Lighthouse CI for performance regression detection

### Available Asset Advantages
- **High-Quality Art**: Professional NPC portraits and cinematic videos ready
- **UI Elements**: Gacha banner and placeholder UI components available
- **Memory System**: Placeholder images for immediate Memory generation
- **Brand Assets**: Logo ready for branding integration
- **No Art Budget**: Major cost savings with existing professional assets

### Testing Infrastructure Costs
- **CI/CD**: GitHub Actions (free for public repos, minimal cost for private)
- **Performance Monitoring**: Free tier of performance tracking services
- **Device Testing**: Browser-based testing (no mobile device lab needed initially)
- **Asset Validation**: Automated scripts for asset integrity checking

This incremental plan ensures we build a solid foundation while validating core assumptions at each step, leading to a polished, engaging romance game that resonates with our target audience.
