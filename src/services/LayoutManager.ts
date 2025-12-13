/**
 * Layout Manager for Whiteboard System
 *
 * Handles spatial positioning, collision detection, and optimal placement
 * of elements on the whiteboard canvas.
 */

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionConstraints {
  region?: 'auto' | 'center' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'below_previous';
  relativeTo?: string;
  alignWith?: string;
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
}

export interface BoardElement {
  id: string;
  type: string;
  position: Position;
  size: Size;
  semanticDescription?: string;
}

export interface Region {
  id: string;
  bounds: Rect;
}

class SpatialGrid {
  private cellSize: number;
  private grid: boolean[][];
  private width: number;
  private height: number;

  constructor(width: number, height: number, cellSize: number = 50) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    this.grid = Array(rows).fill(null).map(() => Array(cols).fill(false));
  }

  markOccupied(area: Rect): void {
    const startX = Math.floor(area.x / this.cellSize);
    const startY = Math.floor(area.y / this.cellSize);
    const endX = Math.ceil((area.x + area.width) / this.cellSize);
    const endY = Math.ceil((area.y + area.height) / this.cellSize);

    for (let y = startY; y < endY && y < this.grid.length; y++) {
      for (let x = startX; x < endX && x < this.grid[y].length; x++) {
        this.grid[y][x] = true;
      }
    }
  }

  isOccupied(area: Rect): boolean {
    const startX = Math.floor(area.x / this.cellSize);
    const startY = Math.floor(area.y / this.cellSize);
    const endX = Math.ceil((area.x + area.width) / this.cellSize);
    const endY = Math.ceil((area.y + area.height) / this.cellSize);

    for (let y = startY; y < endY && y < this.grid.length; y++) {
      for (let x = startX; x < endX && x < this.grid[y].length; x++) {
        if (this.grid[y][x]) {
          return true;
        }
      }
    }
    return false;
  }

  findAvailableSpace(size: Size, preferredRegion?: string): Position[] {
    const availablePositions: Position[] = [];
    const cols = this.grid[0].length;
    const rows = this.grid.length;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!this.grid[y][x]) {
          // Check if there's enough space
          const requiredCols = Math.ceil(size.width / this.cellSize);
          const requiredRows = Math.ceil(size.height / this.cellSize);

          if (x + requiredCols <= cols && y + requiredRows <= rows) {
            let available = true;

            for (let checkY = y; checkY < y + requiredRows && checkY < rows; checkY++) {
              for (let checkX = x; checkX < x + requiredCols && checkX < cols; checkX++) {
                if (this.grid[checkY][checkX]) {
                  available = false;
                  break;
                }
              }
              if (!available) break;
            }

            if (available) {
              availablePositions.push({
                x: x * this.cellSize,
                y: y * this.cellSize
              });
            }
          }
        }
      }
    }

    return availablePositions;
  }
}

export class LayoutManager {
  private regions: Map<string, Region>;
  private elements: Map<string, BoardElement>;
  private grid: SpatialGrid;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number = 1920, canvasHeight: number = 1080) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.regions = new Map();
    this.elements = new Map();
    this.grid = new SpatialGrid(canvasWidth, canvasHeight);

    // Initialize default regions
    this.registerRegion('main', { x: 200, y: 100, width: 1500, height: 800 });
    this.registerRegion('sidebar', { x: 1750, y: 100, width: 350, height: 800 });
    this.registerRegion('header', { x: 200, y: 20, width: 1500, height: 60 });
    this.registerRegion('footer', { x: 200, y: 920, width: 1500, height: 100 });
  }

  findOptimalPosition(constraints: PositionConstraints): Position {
    const region = constraints.region || 'auto';

    // Get target region
    let targetRegion: Rect;
    if (region === 'auto' || region === 'main') {
      targetRegion = this.regions.get('main')?.bounds ||
                     { x: 200, y: 100, width: 1500, height: 800 };
    } else if (region === 'sidebar') {
      targetRegion = this.regions.get('sidebar')?.bounds ||
                     { x: 1750, y: 100, width: 350, height: 800 };
    } else if (region === 'header') {
      targetRegion = this.regions.get('header')?.bounds ||
                     { x: 200, y: 20, width: 1500, height: 60 };
    } else if (region === 'footer') {
      targetRegion = this.regions.get('footer')?.bounds ||
                     { x: 200, y: 920, width: 1500, height: 100 };
    } else {
      // Specific positioning
      switch (region) {
        case 'center':
          return { x: this.canvasWidth / 2, y: this.canvasHeight / 2 };
        case 'top_left':
          return { x: 50, y: 50 };
        case 'top_right':
          return { x: this.canvasWidth - 150, y: 50 };
        case 'bottom_left':
          return { x: 50, y: this.canvasHeight - 100 };
        case 'bottom_right':
          return { x: this.canvasWidth - 150, y: this.canvasHeight - 100 };
        case 'below_previous':
          // Find last element and position below it
          const lastElement = Array.from(this.elements.values()).pop();
          if (lastElement) {
            return {
              x: lastElement.position.x,
              y: lastElement.position.y + lastElement.size.height + 20
            };
          }
          return { x: 200, y: 200 };
        default:
          targetRegion = this.regions.get('main')?.bounds ||
                         { x: 200, y: 100, width: 1500, height: 800 };
      }
    }

    // Find available space in the target region
    const availablePositions = this.grid.findAvailableSpace(
      { width: 300, height: 200 }, // Default size for now
      region
    );

    if (availablePositions.length > 0) {
      // For now, just return the first available position
      // In a more sophisticated implementation, this would consider
      // optimal placement based on content flow, importance, etc.
      return availablePositions[0];
    }

    // Fallback: return center of region
    return {
      x: targetRegion.x + targetRegion.width / 2,
      y: targetRegion.y + targetRegion.height / 2
    };
  }

  placeElement(element: BoardElement, constraints: PositionConstraints): Position {
    const position = this.findOptimalPosition(constraints);

    // Mark the space as occupied
    this.grid.markOccupied({
      x: position.x,
      y: position.y,
      width: element.size.width,
      height: element.size.height
    });

    // Register the element
    this.elements.set(element.id, element);

    return position;
  }

  placeLabel(label: string, target: { from: Position; to: Position }): Position {
    // Calculate midpoint between from and to positions
    const midX = (target.from.x + target.to.x) / 2;
    const midY = (target.from.y + target.to.y) / 2;

    // Position label slightly above the arrow
    return {
      x: midX,
      y: midY - 30
    };
  }

  registerRegion(id: string, bounds: Rect): void {
    this.regions.set(id, { id, bounds });
  }

  checkCollisions(element: BoardElement, position: Position): boolean {
    // Create a temporary rect for collision checking
    const tempRect: Rect = {
      x: position.x,
      y: position.y,
      width: element.size.width,
      height: element.size.height
    };

    return this.grid.isOccupied(tempRect);
  }

  getAvailableSpace(region?: string): Rect[] {
    // This would return available rectangular spaces in the specified region
    // For now, return a simple approximation
    if (!region || region === 'main') {
      const mainRegion = this.regions.get('main')?.bounds ||
                         { x: 200, y: 100, width: 1500, height: 800 };
      return [mainRegion];
    }

    const targetRegion = this.regions.get(region);
    if (targetRegion) {
      return [targetRegion.bounds];
    }

    return [];
  }
}