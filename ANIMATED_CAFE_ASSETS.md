# Animated Cafe Hub - MINIMAL Prototype Assets

## Overview
**Absolute minimum assets needed to get a working 2D tile-based cafe prototype.** Focus on functionality over polish.

---

## 🏗️ **Tile System Specifications**
- **Grid Size**: 20x15 tiles (640x480px total)
- **Tile Size**: 32x32px
- **Art Style**: Simple pixel art, coral/pink theme

---

## 🎯 **MINIMAL ASSET LIST (8 Total Images)**

### 1. Environment Tileset
| Asset Name | Dimensions | Format | Description |
|------------|------------|--------|-------------|
| `cafe_tileset.png` | 128x128px | PNG | **4x4 tile grid containing:** |
| | | | • Floor tile (wood) |
| | | | • Wall tile (cream) |
| | | | • Counter tile (brown) |
| | | | • Window tile (light blue) |

### 2. NPC Spritesheet (All Characters)
| Asset Name | Dimensions | Format | Description |
|------------|------------|--------|-------------|
| `npcs_combined.png` | 192x48px | PNG | **6x1 sprite grid:** |
| | | | • Aria idle (32x48px) |
| | | | • Aria wave (32x48px) |
| | | | • Kai idle (32x48px) |
| | | | • Kai wave (32x48px) |
| | | | • Elias idle (32x48px) |
| | | | • Elias wave (32x48px) |

### 3. Interactive Objects
| Asset Name | Dimensions | Format | Description |
|------------|------------|--------|-------------|
| `objects_sheet.png` | 128x64px | PNG | **4x2 object grid:** |
| | | | • Order board (32x32px) |
| | | | • Flavor shelf (32x32px) |
| | | | • Coffee machine (32x32px) |
| | | | • Table (32x32px) |
| | | | • Chair (32x32px) |
| | | | • Plant (32x32px) |
| | | | • Steam effect 1 (32x32px) |
| | | | • Steam effect 2 (32x32px) |

### 4. UI Elements
| Asset Name | Dimensions | Format | Description |
|------------|------------|--------|-------------|
| `ui_elements.png` | 128x32px | PNG | **4x1 UI grid:** |
| | | | • Hotspot ring (32x32px) |
| | | | • Nameplate background (32x32px) |
| | | | • Interaction arrow (32x32px) |
| | | | • Glow effect (32x32px) |

---

## 🎨 **Simplified Implementation**

### Single Color Palette
- **Floor**: #deb887 (burlywood)
- **Walls**: #f5f5dc (beige)  
- **Counter**: #8b4513 (brown)
- **NPCs**: Use existing portrait colors
- **Accents**: #e17497 (coral pink)

### Basic Animations (CSS Only)
- **NPC Breathing**: Simple scale transform (1.0 ↔ 1.02)
- **Steam**: Opacity fade + translateY
- **Hotspots**: Pulsing opacity (0.5 ↔ 1.0)
- **Hover Effects**: Scale transform (1.0 → 1.1)

---

## 📐 **Prototype Layout**

```
Simple 20x15 grid layout:
┌─────────────────────┐
│ WWWWWWWWWWWWWWWWWWWW │ W = Wall
│ W.................. │ . = Floor  
│ W....A.....K.....E. │ A/K/E = NPCs
│ W.................. │ C = Counter
│ W...CCCCCCCCCC..... │ O = Order Board
│ W......O........... │ F = Flavor Shelf
│ W...F.............. │ T = Table
│ W.....T.T.T........ │ 
│ W.................. │
│ W.................. │
│ W.................. │
│ W.................. │
│ W.................. │
│ WWWWWWWWWWWWWWWWWWWW │
└─────────────────────┘
```

---

## 🚀 **Implementation Priority**

### Phase 1: Static Layout (1-2 hours)
1. Create `cafe_tileset.png` with 4 basic tiles
2. Update TileSystem to use tileset
3. Layout basic cafe structure

### Phase 2: Characters (2-3 hours)  
1. Create `npcs_combined.png` with 6 NPC sprites
2. Position NPCs in cafe
3. Add basic hover effects

### Phase 3: Interactions (1-2 hours)
1. Create `objects_sheet.png` and `ui_elements.png`
2. Add interactive hotspots
3. Implement click handlers

### Phase 4: Animation (1-2 hours)
1. Add CSS-based breathing/pulsing
2. Steam effects
3. Polish hover states

---

## 💡 **Prototype Benefits**

✅ **Only 4 image files** instead of 130+
✅ **Tileset approach** - easy to expand later  
✅ **Combined spritesheets** - efficient loading
✅ **CSS animations** - no complex sprite animation code needed
✅ **Modular design** - can add more tiles/sprites easily
✅ **Quick to implement** - 6-8 hours total vs weeks

This minimal approach gets you a **working animated cafe hub** that demonstrates the tile-based system without the overhead of dozens of individual assets! 🎯
