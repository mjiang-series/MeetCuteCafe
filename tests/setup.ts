/**
 * Jest test setup for Meet Cute Cafe
 */

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch for asset validation
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
  } as Response)
);

// Mock Image constructor for asset loading tests
(global as unknown as { Image: typeof Image }).Image = class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';

  constructor() {
    // Simulate successful image loading
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
} as unknown as typeof Image;

// Mock video element for cinematic tests
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName: string) => {
    if (tagName === 'video') {
      return {
        onloadeddata: null,
        onerror: null,
        src: '',
        preload: '',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
    }
    return document.createElement(tagName);
  }),
});

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup JSDOM environment
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
  },
});

// Mock performance.now for timing tests
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
});

// Clear all mocks before each test
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});
