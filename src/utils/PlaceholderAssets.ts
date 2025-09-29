/**
 * Placeholder Asset Generator
 * Creates simple colored rectangles as temporary assets for prototyping
 */

export interface PlaceholderAsset {
  id: string;
  width: number;
  height: number;
  color: string;
  borderColor?: string;
  text?: string;
}

export class PlaceholderAssets {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Generate a simple colored rectangle asset
   */
  generateAsset(asset: PlaceholderAsset): string {
    this.canvas.width = asset.width;
    this.canvas.height = asset.height;

    // Clear canvas
    this.ctx.clearRect(0, 0, asset.width, asset.height);

    // Fill background
    this.ctx.fillStyle = asset.color;
    this.ctx.fillRect(0, 0, asset.width, asset.height);

    // Add border if specified
    if (asset.borderColor) {
      this.ctx.strokeStyle = asset.borderColor;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(0.5, 0.5, asset.width - 1, asset.height - 1);
    }

    // Add text if specified
    if (asset.text) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(asset.text, asset.width / 2, asset.height / 2);
    }

    return this.canvas.toDataURL('image/png');
  }

  /**
   * Generate all cafe assets
   */
  generateCafeAssets(): Record<string, string> {
    const assets: Record<string, string> = {};

    // Environment tiles - matching coral/pink logo color scheme
    assets['floor'] = this.generateAsset({
      id: 'floor',
      width: 32,
      height: 32,
      color: '#ffeef4', // Light pink/cream (matches logo background)
      borderColor: '#ffd6e1', // Slightly darker pink border
    });

    assets['counter'] = this.generateAsset({
      id: 'counter',
      width: 32,
      height: 32,
      color: '#e17497', // Main coral/pink (matches logo primary color)
      borderColor: '#d1477a', // Darker coral for definition
    });

    assets['table'] = this.generateAsset({
      id: 'table',
      width: 64, // 2x2 tiles
      height: 64,
      color: '#f2a5b8', // Lighter coral/pink (complementary to main color)
      borderColor: '#e17497', // Main coral border for consistency
      text: 'TABLE',
    });

    // Interactive objects - coordinated with coral/pink theme
    assets['order_board'] = this.generateAsset({
      id: 'order_board',
      width: 32,
      height: 32,
      color: '#8e44ad', // Purple (matches UI buttons)
      borderColor: '#7d3c98',
      text: '📋',
    });

    assets['flavor_shelf'] = this.generateAsset({
      id: 'flavor_shelf',
      width: 64, // 2 tiles wide
      height: 32,
      color: '#d1477a', // Darker coral (complements main theme)
      borderColor: '#b8396a',
      text: '🧪',
    });

    assets['coffee_machine'] = this.generateAsset({
      id: 'coffee_machine',
      width: 32,
      height: 48,
      color: '#c0392b', // Warm red (complements coral/pink)
      borderColor: '#a93226',
      text: '☕',
    });

    // Characters - NPCs
    assets['aria'] = this.generateAsset({
      id: 'aria',
      width: 24,
      height: 32,
      color: '#e17497', // Pink
      borderColor: '#d1477a',
      text: 'A',
    });

    assets['kai'] = this.generateAsset({
      id: 'kai',
      width: 24,
      height: 32,
      color: '#4a90e2', // Blue
      borderColor: '#357abd',
      text: 'K',
    });

    assets['elias'] = this.generateAsset({
      id: 'elias',
      width: 24,
      height: 32,
      color: '#7ed321', // Green
      borderColor: '#6ab91e',
      text: 'E',
    });

    // Characters - Customers
    assets['customer'] = this.generateAsset({
      id: 'customer',
      width: 24,
      height: 32,
      color: '#9b9b9b', // Gray
      borderColor: '#7a7a7a',
      text: 'C',
    });

    // UI Elements
    assets['hotspot_ring'] = this.generateAsset({
      id: 'hotspot_ring',
      width: 40,
      height: 40,
      color: 'rgba(225, 116, 151, 0.3)', // Semi-transparent pink
      borderColor: '#e17497',
    });

    assets['nameplate'] = this.generateAsset({
      id: 'nameplate',
      width: 48,
      height: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#e17497',
    });

    return assets;
  }

  /**
   * Create CSS for using generated assets
   */
  generateAssetCSS(assets: Record<string, string>): string {
    if (!assets || typeof assets !== 'object') {
      console.warn('PlaceholderAssets.generateAssetCSS: Invalid assets provided');
      return '';
    }

    let css = '';

    Object.entries(assets).forEach(([id, dataUrl]) => {
      if (dataUrl && typeof dataUrl === 'string') {
        css += `
          .asset-${id} {
            background-image: url('${dataUrl}');
            background-repeat: no-repeat;
            background-size: contain;
            background-position: center;
          }
        `;
      }
    });

    return css;
  }

  /**
   * Inject assets into the page
   */
  injectAssets(): Record<string, string> {
    const assets = this.generateCafeAssets();
    const css = this.generateAssetCSS(assets);

    // Create style element
    const styleElement = document.createElement('style');
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    return assets;
  }
}

// Create global instance
export const placeholderAssets = new PlaceholderAssets();
