# Meet Cute Cafe

A dating-sim × idle autobattler hybrid romance game where players manage a cozy café and develop meaningful relationships with NPCs through chance encounters, order fulfillment, and intimate conversations.

## 🎮 Game Overview

Meet Cute Cafe combines the strategic depth of idle autobattlers with the emotional engagement of dating sims. Players collect and upgrade **Flavors** to fulfill **Customer Orders** and special **NPC Orders**, which generate **Memories** that deepen bonds with three romanceable characters: Aria, Kai, and Elias.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd MeetCuteCafe

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run end-to-end tests

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run typecheck        # Check TypeScript types
npm run format           # Format code with Prettier
```

## 🏗️ Project Structure

```
src/
├── data/           # JSON data files (NPCs, flavors, economy)
├── systems/        # Core game systems
│   ├── EventSystem.ts
│   ├── GameStateManager.ts
│   └── AssetManager.ts
├── ui/            # UI components and screens
├── models/        # TypeScript interfaces and types
├── utils/         # Utility functions and helpers
└── main.ts        # Application entry point

tests/
├── unit/          # Unit tests
├── integration/   # Integration tests
├── e2e/           # End-to-end tests
└── setup.ts       # Test configuration
```

## 🎨 Available Assets

The game includes high-quality art assets:

- **NPC Portraits**: Professional character portraits for Aria, Kai, and Elias
- **Cinematic Videos**: Gacha reveal animations for each NPC
- **UI Elements**: Gacha banner, buttons, and icons
- **Branding**: Logo and visual identity elements
- **Memory Placeholders**: Images for the memory system

## 🧪 Testing Strategy

The project follows a comprehensive testing approach:

- **Unit Tests**: 90%+ coverage for core systems
- **Integration Tests**: Cross-system functionality validation
- **End-to-End Tests**: Complete user journey testing
- **Performance Tests**: Asset loading and system benchmarks

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test EventSystem.test.ts

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## 🔧 Architecture

### Core Systems

- **EventSystem**: Pub/sub communication between game systems
- **GameStateManager**: Player data persistence and state management  
- **AssetManager**: Asset loading, caching, and validation

### Data Flow

1. **Orders** → **Fulfillment** → **Rewards** → **Memories**
2. **Memories** → **Bond XP** → **NPC Interactions** 
3. **Gacha** → **Flavors** → **Enhanced Orders**

### Key Features

- **Romance-First Design**: All systems support relationship progression
- **Asset Integration**: Leverages existing high-quality art assets
- **Test-Driven Development**: Comprehensive automated testing
- **Type Safety**: Strict TypeScript configuration
- **Performance Focused**: Optimized loading and caching

## 📱 Platform Support

- **Web**: Modern browsers with ES2022 support
- **Mobile**: Responsive design for mobile devices
- **PWA Ready**: Progressive Web App capabilities

## 🎯 Development Phases

The project is built incrementally through 5 phases:

1. **Phase 1**: Core Foundation (Orders, Flavors, Basic UI)
2. **Phase 2**: Romance Foundation (NPCs, Memories, DMs) 
3. **Phase 3**: Collection & Progression (Gacha, Advanced Systems)
4. **Phase 4**: Polish & Depth (Animations, AI Responses)
5. **Phase 5**: Live Systems & Launch (Analytics, Cloud Save)

## 🤝 Contributing

1. Follow the existing code style and conventions
2. Write tests for new functionality
3. Ensure all tests pass before submitting
4. Use meaningful commit messages
5. Update documentation as needed

## 📄 License

MIT License - see LICENSE file for details

---

**Meet Cute Cafe** - Where every order tells a story, and every conversation deepens the connection. ☕💕
