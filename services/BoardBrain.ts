
import { BoardCommand, BrainElement, BrainGroup, SemanticPosition, SemanticRole } from "../types";

// Configuration for semantic styles
// UPDATED: Increased sizes for 'Kalam' handwriting font
const STYLES = {
  title: { size: 56, color: '#22d3ee', margin: 40, weight: 'bold', align: 'center' }, // Cyan
  heading: { size: 36, color: '#f8fafc', margin: 30, weight: 'bold', align: 'left' }, // White
  body: { size: 28, color: '#94a3b8', margin: 20, weight: 'normal', align: 'left' }, // Slate-400
  example: { size: 24, color: '#86efac', margin: 20, weight: 'normal', align: 'left' }, // Green
  note: { size: 22, color: '#facc15', margin: 15, weight: 'light', align: 'left' }, // Yellow
  label: { size: 22, color: '#e879f9', margin: 10, weight: 'bold', align: 'center' }, // Purple
  'group-title': { size: 26, color: '#a5b4fc', margin: 20, weight: 'bold', align: 'left' }, // Indigo-300
  container: { color: '#334155', width: 2 }, // Border color
  connector: { color: '#64748b', width: 2 },
};

// Auto-rotation palette for groups to distinguish clusters
const GROUP_COLORS = [
    '#334155', // Slate (Default)
    '#1e40af', // Blue
    '#047857', // Emerald
    '#7e22ce', // Purple
    '#be185d'  // Pink
];

export class BoardBrain {
  private elements: BrainElement[] = [];
  private groups: BrainGroup[] = [];
  private width: number;
  private height: number;
  private currentY: number = 0; // Tracking vertical flow
  private elementCounter = 0;
  
  // State for Smart Pattern Recognition
  private lastElementId: string | null = null;
  private groupColorIndex = 0;

  constructor(width = 1920, height = 1080) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  public reset() {
    this.elements = [];
    this.groups = [];
    this.currentY = 120; // Start below header area
    this.elementCounter = 0;
    this.lastElementId = null;
    this.groupColorIndex = 0;
  }

  public getStateDescription(): string {
    if (this.elements.length === 0 && this.groups.length === 0) return "Board is empty.";
    
    let desc = `Board contains ${this.elements.length} elements and ${this.groups.length} groups.\n`;
    
    if (this.groups.length > 0) {
      desc += "Groups: " + this.groups.map(g => `${g.title} (ID: ${g.id}) at (${Math.round(g.bbox.x)},${Math.round(g.bbox.y)})`).join("; ") + "\n";
    }
    
    desc += "Elements: " + this.elements.map(e => {
        let txt = `${e.role} (ID: ${e.id}) at (${Math.round(e.bbox.x)},${Math.round(e.bbox.y)})`;
        if (e.text) txt += ` "${e.text.substring(0, 20)}..."`;
        if (e.groupId) txt += ` [in ${e.groupId}]`;
        return txt;
    }).join("; ");
    
    return desc;
  }

  // --- Core Semantic Actions ---

  public createGroup(title: string, position: SemanticPosition = 'below'): { command: BoardCommand, id: string } {
      const id = `group_${++this.elementCounter}`;
      
      // Default Group Box Size (Initial)
      const w = 400;
      const h = 300;
      
      const bbox = this.findSpace({ w, h }, position);
      
      // Select next color in palette
      const color = GROUP_COLORS[this.groupColorIndex % GROUP_COLORS.length];
      this.groupColorIndex++;

      this.groups.push({
          id,
          title,
          bbox
      });
      
      // Update flow
      if (position === 'below' || position === 'left' || position === 'center') {
          this.currentY = Math.max(this.currentY, bbox.y + bbox.h + 40);
      }

      const command: BoardCommand = {
          type: 'rect',
          payload: {
              x: bbox.x,
              y: bbox.y,
              width: w,
              height: h,
              color: color 
          }
      };

      return { command, id };
  }

  public drawGraph(title: string, equation: string, position: SemanticPosition = 'center', relativeToId?: string): { commands: BoardCommand[], id: string } {
    // 1. Size - Big Graphs as requested
    const w = 600;
    const h = 400;

    // 2. Position
    const bbox = this.findSpace({ w, h }, position, relativeToId, 'container');
    
    // 3. Register
    const id = `graph_${++this.elementCounter}`;
    this.elements.push({ id, role: 'container', bbox, groupId: undefined, refId: relativeToId });
    this.lastElementId = id;
    this.currentY = Math.max(this.currentY, bbox.y + bbox.h + 40);

    const commands: BoardCommand[] = [];

    // 4. Background (Dark Panel)
    commands.push({
        type: 'polygon',
        payload: {
            points: [{x:bbox.x, y:bbox.y}, {x:bbox.x+w, y:bbox.y}, {x:bbox.x+w, y:bbox.y+h}, {x:bbox.x, y:bbox.y+h}],
            color: '#334155',
            fill: '#0f172a'
        }
    });

    // 5. Title
    commands.push({
        type: 'text',
        payload: { text: title, x: bbox.x + 20, y: bbox.y + 20, color: '#94a3b8', size: 20, align: 'left' }
    });

    // 6. Data Calculation
    // Default range [-10, 10]
    const rangeX = [-10, 10];
    const points: {x: number, y: number}[] = [];
    const step = (rangeX[1] - rangeX[0]) / 100;
    
    let minY = Infinity, maxY = -Infinity;
    
    for(let x = rangeX[0]; x <= rangeX[1]; x += step) {
        const y = this.evaluateEquation(equation, x);
        if (!isNaN(y) && isFinite(y)) {
             points.push({x, y});
             if (y < minY) minY = y;
             if (y > maxY) maxY = y;
        }
    }
    
    // Auto-scale Y with padding
    const ySpan = Math.max(0.1, maxY - minY);
    minY -= ySpan * 0.1;
    maxY += ySpan * 0.1;

    // Coordinate mapping functions
    const mapX = (val: number) => bbox.x + 40 + ((val - rangeX[0]) / (rangeX[1] - rangeX[0])) * (w - 80);
    const mapY = (val: number) => (bbox.y + h - 40) - ((val - minY) / (maxY - minY)) * (h - 80);

    // 7. Grid & Axes
    // X Axis (y=0)
    if (minY <= 0 && maxY >= 0) {
        const y0 = mapY(0);
        commands.push({ type: 'line', payload: { x1: bbox.x+40, y1: y0, x2: bbox.x+w-40, y2: y0, color: '#475569', width: 2 } });
    }
    // Y Axis (x=0)
    if (rangeX[0] <= 0 && rangeX[1] >= 0) {
        const x0 = mapX(0);
        commands.push({ type: 'line', payload: { x1: x0, y1: bbox.y+40, x2: x0, y2: bbox.y+h-40, color: '#475569', width: 2 } });
    }

    // 8. Draw Curve
    const screenPoints = points.map(p => ({ x: mapX(p.x), y: mapY(p.y) }));
    if (screenPoints.length > 1) {
        commands.push({
            type: 'stroke',
            payload: {
                points: screenPoints,
                color: '#22d3ee', // Cyan curve
                width: 3
            }
        });
    }

    // 9. Equation Label
    commands.push({
        type: 'text',
        payload: { text: `f(x) = ${equation}`, x: bbox.x + w - 20, y: bbox.y + 20, color: '#22d3ee', size: 18, align: 'right' }
    });

    return { id, commands };
  }

  private evaluateEquation(eq: string, x: number): number {
      try {
          // Allow simplified math input (e.g. "sin(x)" instead of "Math.sin(x)")
          const sanitized = eq.toLowerCase()
              .replace(/\bsin\b/g, 'Math.sin')
              .replace(/\bcos\b/g, 'Math.cos')
              .replace(/\btan\b/g, 'Math.tan')
              .replace(/\bsqrt\b/g, 'Math.sqrt')
              .replace(/\blog\b/g, 'Math.log')
              .replace(/\babs\b/g, 'Math.abs')
              .replace(/\bpi\b/g, 'Math.PI')
              .replace(/\^/g, '**'); 
          
          const f = new Function('x', `return ${sanitized};`);
          return f(x);
      } catch (e) {
          return 0;
      }
  }

  public writeText(text: string, role: SemanticRole, position: SemanticPosition = 'below', relativeToId?: string, groupId?: string): { command: BoardCommand, id: string } {
    let style = STYLES[role as keyof typeof STYLES] || STYLES.body;
    if (!('size' in style)) style = STYLES.body;
    const textStyle = style as typeof STYLES.body;

    // 1. Dynamic Dimension Estimation
    // Updated max width for non-titles to ensure wrapping before edges
    const MAX_WIDTH = role === 'title' ? this.width * 0.8 : 500; 
    
    // Increased average char width multiplier to 0.7 to account for 'Kalam' wide handwriting font
    const avgCharWidth = textStyle.size * 0.7; 
    
    const estWidth = Math.min(text.length * avgCharWidth, MAX_WIDTH);
    
    const charsPerLine = Math.floor(estWidth / avgCharWidth);
    const estimatedLines = Math.max(1, Math.ceil(text.length / charsPerLine));
    const lineHeight = textStyle.size * 1.5; // Slight bump in line height spacing
    const estHeight = estimatedLines * lineHeight;
    
    // 2. Find Position
    let bbox: {x:number, y:number, w:number, h:number};
    
    if (groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
             // Stack placement inside group
             const lastInGroup = this.elements.filter(e => e.groupId === groupId).pop();
             let startY = group.bbox.y + 20; 
             if (lastInGroup) {
                 startY = lastInGroup.bbox.y + lastInGroup.bbox.h + 15;
             }
             
             bbox = {
                 x: group.bbox.x + 20,
                 y: startY,
                 w: estWidth,
                 h: estHeight
             };
             
             this.expandGroup(groupId, bbox);
        } else {
            // Fallback if group not found
            bbox = this.findSpace({ w: estWidth, h: estHeight }, position, relativeToId, role);
        }
    } else {
        // Standard placement
        bbox = this.findSpace({ w: estWidth, h: estHeight }, position, relativeToId, role);
    }
    
    // 3. Create Element Record
    const id = `el_${++this.elementCounter}`;
    this.elements.push({
      id,
      role,
      bbox,
      text,
      groupId,
      refId: relativeToId // Store relation for future sibling checks
    });
    this.lastElementId = id;

    // 4. Update flow cursor (only if not in a group)
    if (!groupId && (position === 'below' || position === 'top-left' || position === 'left' || position === 'center')) {
        this.currentY = Math.max(this.currentY, bbox.y + bbox.h + textStyle.margin);
    }

    // 5. Generate Command
    const command: BoardCommand = {
      type: 'text',
      payload: {
        text,
        x: bbox.x + (textStyle.align === 'center' ? bbox.w / 2 : 0),
        y: bbox.y,
        color: textStyle.color,
        size: textStyle.size,
        align: textStyle.align as 'left' | 'center' | 'right',
        maxWidth: bbox.w // Send strict max width for wrapping logic in renderer
      }
    };

    return { command, id };
  }

  public drawShape(shape: 'rectangle' | 'circle' | 'arrow' | 'line', role: SemanticRole, position: SemanticPosition, relativeToId?: string, groupId?: string): { command: BoardCommand, id: string } | null {
    let w = 200, h = 100;
    
    // Check relative element size
    let targetEl: BrainElement | undefined;
    if (relativeToId) {
       targetEl = this.elements.find(e => e.id === relativeToId);
       if (targetEl) {
          w = targetEl.bbox.w + 40; 
          h = targetEl.bbox.h + 40;
       }
    }

    let bbox: {x:number, y:number, w:number, h:number};

    if (groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            // Simple placement inside group
             const lastInGroup = this.elements.filter(e => e.groupId === groupId).pop();
             let startY = group.bbox.y + 20;
             if (lastInGroup) {
                 startY = lastInGroup.bbox.y + lastInGroup.bbox.h + 20;
             }
             bbox = { x: group.bbox.x + 20, y: startY, w, h };
             this.expandGroup(groupId, bbox);
        } else {
             bbox = this.findSpace({ w, h }, position, relativeToId, role);
        }
    } else {
        bbox = targetEl && role === 'container' 
        ? { x: targetEl.bbox.x - 20, y: targetEl.bbox.y - 20, w, h } 
        : this.findSpace({ w, h }, position, relativeToId, role);
    }

    const id = `shape_${++this.elementCounter}`;
    this.elements.push({ id, role, bbox, groupId, refId: relativeToId });
    this.lastElementId = id;

    const style = STYLES[role as keyof typeof STYLES] || STYLES.container;

    let command: BoardCommand | null = null;
    
    if (shape === 'rectangle') {
       command = { type: 'rect', payload: { x: bbox.x, y: bbox.y, width: bbox.w, height: bbox.h, color: style.color } };
    } else if (shape === 'circle') {
       command = { type: 'circle', payload: { x: bbox.x + bbox.w/2, y: bbox.y + bbox.h/2, radius: Math.min(bbox.w, bbox.h)/2, color: style.color } };
    } else if (shape === 'arrow' || shape === 'line') {
       command = { 
           type: shape === 'arrow' ? 'arrow' : 'line', 
           payload: { x1: bbox.x, y1: bbox.y + bbox.h/2, x2: bbox.x + bbox.w, y2: bbox.y + bbox.h/2, color: style.color, width: 3 } 
       };
    }

    if (!command) return null;
    return { command, id };
  }

  public connectElements(sourceId: string, targetId: string, label?: string): { command: BoardCommand, labelCommand?: BoardCommand } | null {
      // Find source and target
      const source = this.elements.find(e => e.id === sourceId) || this.groups.find(g => g.id === sourceId);
      const target = this.elements.find(e => e.id === targetId) || this.groups.find(g => g.id === targetId);

      if (!source || !target) return null;

      const srcCenter = { x: source.bbox.x + source.bbox.w/2, y: source.bbox.y + source.bbox.h/2 };
      const tgtCenter = { x: target.bbox.x + target.bbox.w/2, y: target.bbox.y + target.bbox.h/2 };

      // Edge Clipping
      let startPt = this.getRectIntersection(source.bbox, tgtCenter) || srcCenter;
      let endPt = this.getRectIntersection(target.bbox, srcCenter) || tgtCenter;

      // Improvement #2: Orthogonal Snapping (Engineering Cleanup)
      // If the points are close to being aligned vertically or horizontally, snap them.
      const SNAP_THRESHOLD = 20;
      if (Math.abs(startPt.x - endPt.x) < SNAP_THRESHOLD) {
          const avgX = (startPt.x + endPt.x) / 2;
          startPt.x = avgX;
          endPt.x = avgX;
      } else if (Math.abs(startPt.y - endPt.y) < SNAP_THRESHOLD) {
          const avgY = (startPt.y + endPt.y) / 2;
          startPt.y = avgY;
          endPt.y = avgY;
      }

      const command: BoardCommand = {
          type: 'arrow',
          payload: {
              x1: startPt.x,
              y1: startPt.y,
              x2: endPt.x,
              y2: endPt.y,
              color: '#94a3b8',
              width: 2
          }
      };

      let labelCommand: BoardCommand | undefined;
      if (label) {
          const midX = (startPt.x + endPt.x) / 2;
          const midY = (startPt.y + endPt.y) / 2;
          labelCommand = {
              type: 'text',
              payload: {
                  text: label,
                  x: midX,
                  y: midY - 10,
                  color: '#e879f9',
                  size: 14,
                  align: 'center'
              }
          };
      }

      return { command, labelCommand };
  }

  // --- Helper: Find intersection between a line and a rectangle ---
  private getRectIntersection(rect: {x:number, y:number, w:number, h:number}, externalPoint: {x:number, y:number}): {x:number, y:number} | null {
      const cx = rect.x + rect.w/2;
      const cy = rect.y + rect.h/2;
      
      const dx = externalPoint.x - cx;
      const dy = externalPoint.y - cy;
      
      if (Math.abs(dx) < 0.001) { 
           return dy > 0 ? { x: cx, y: rect.y + rect.h } : { x: cx, y: rect.y };
      }
      
      const slope = dy / dx;
      
      // Right Side
      if (dx > 0) {
          const rx = rect.x + rect.w;
          const ry = cy + slope * (rx - cx);
          if (ry >= rect.y && ry <= rect.y + rect.h) return { x: rx, y: ry };
      }
      
      // Left Side
      if (dx < 0) {
          const lx = rect.x;
          const ly = cy + slope * (lx - cx);
          if (ly >= rect.y && ly <= rect.y + rect.h) return { x: lx, y: ly };
      }
      
      // Bottom Side
      if (dy > 0) {
          const by = rect.y + rect.h;
          const bx = cx + (by - cy) / slope;
          if (bx >= rect.x && bx <= rect.x + rect.w) return { x: bx, y: by };
      }
      
      // Top Side
      if (dy < 0) {
          const ty = rect.y;
          const tx = cx + (ty - cy) / slope;
          if (tx >= rect.x && tx <= rect.x + rect.w) return { x: tx, y: ty };
      }
      
      return null;
  }

  private expandGroup(groupId: string, childBbox: {x:number, y:number, w:number, h:number}) {
      const group = this.groups.find(g => g.id === groupId);
      if (!group) return;

      const padding = 20;
      
      const minX = Math.min(group.bbox.x, childBbox.x - padding);
      const minY = Math.min(group.bbox.y, childBbox.y - padding);
      const maxX = Math.max(group.bbox.x + group.bbox.w, childBbox.x + childBbox.w + padding);
      const maxY = Math.max(group.bbox.y + group.bbox.h, childBbox.y + childBbox.h + padding);

      group.bbox = {
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY
      };
  }

  // --- Spatial Reasoning Engine ---

  private findSpace(dims: { w: number, h: number }, position: SemanticPosition, relativeToId?: string, role?: SemanticRole): { x: number, y: number, w: number, h: number } {
    let idealX = 50;
    let idealY = this.currentY;

    // Improvement #1: Smart Sibling Stacking (List Mode)
    // Check if we are adding a sibling node (same parent ID, compatible role)
    // If so, we should align with the PREVIOUS SIBLING, not the parent.
    const parentId = relativeToId;
    let usedSiblingAlignment = false;

    if (parentId && this.lastElementId) {
        const lastEl = this.elements.find(e => e.id === this.lastElementId);
        
        // Conditions for list mode:
        // 1. Last element was also relative to the same parent (siblings)
        // 2. Roles are similar (e.g. both body, example, or heading)
        // 3. Position requested is 'below' (standard list flow)
        if (lastEl && lastEl.refId === parentId && position === 'below') {
            idealX = lastEl.bbox.x; // Align Left
            idealY = lastEl.bbox.y + lastEl.bbox.h + 15; // Stack below sibling with tight margin
            usedSiblingAlignment = true;
        }
    }

    if (!usedSiblingAlignment) {
        // Standard Positioning Logic
        switch (position) {
          case 'top-center':
            idealX = (this.width / 2) - (dims.w / 2);
            idealY = 80;
            break;
          case 'top-left': idealX = 50; idealY = 80; break;
          case 'top-right': idealX = this.width - dims.w - 50; idealY = 80; break;
          case 'center':
            idealX = (this.width / 2) - (dims.w / 2);
            idealY = Math.max(this.currentY, 150); 
            break;
          case 'left': idealX = 50; break;
          case 'right': idealX = (this.width / 2) + 50; break;
          
          case 'below':
            idealX = 50; 
            if (relativeToId) {
                const el = this.elements.find(e => e.id === relativeToId) || this.groups.find(g => g.id === relativeToId);
                if (el) {
                    idealX = el.bbox.x; 
                    idealY = el.bbox.y + el.bbox.h + 40;
                }
            }
            break;

          case 'right-of':
            if (relativeToId) {
                const el = this.elements.find(e => e.id === relativeToId) || this.groups.find(g => g.id === relativeToId);
                if (el) {
                    idealX = el.bbox.x + el.bbox.w + 40;
                    idealY = el.bbox.y; 
                }
            }
            break;

          case 'left-of':
            if (relativeToId) {
                const el = this.elements.find(e => e.id === relativeToId) || this.groups.find(g => g.id === relativeToId);
                if (el) {
                    idealX = el.bbox.x - dims.w - 40;
                    idealY = el.bbox.y;
                }
            }
            break;

          case 'below-left':
            if (relativeToId) {
                const el = this.elements.find(e => e.id === relativeToId) || this.groups.find(g => g.id === relativeToId);
                if (el) {
                    idealX = el.bbox.x - (dims.w * 0.8) - 20; 
                    idealY = el.bbox.y + el.bbox.h + 80;
                }
            }
            break;

          case 'below-right':
            if (relativeToId) {
                 const el = this.elements.find(e => e.id === relativeToId) || this.groups.find(g => g.id === relativeToId);
                 if (el) {
                     idealX = el.bbox.x + el.bbox.w + 20;
                     idealY = el.bbox.y + el.bbox.h + 80;
                 }
            }
            break;
        }
    }

    // 2. Perform Radial/Spiral Search for Best Fit
    return this.radialSearch({ x: idealX, y: idealY, w: dims.w, h: dims.h });
  }

  private radialSearch(target: {x:number, y:number, w:number, h:number}): {x:number, y:number, w:number, h:number} {
      if (this.isValidSpace(target)) return target;

      const stepX = 60;
      const stepY = 60;
      const maxLayers = 15; 

      for (let layer = 1; layer <= maxLayers; layer++) {
          const offsets = [
              { dx: 0, dy: layer },       // Down
              { dx: 0, dy: -layer },      // Up
              { dx: layer, dy: 0 },       // Right
              { dx: -layer, dy: 0 },      // Left
              { dx: layer, dy: layer },   // Down-Right
              { dx: -layer, dy: layer },  // Down-Left
              { dx: layer, dy: -layer },  // Up-Right
              { dx: -layer, dy: -layer }  // Up-Left
          ];

          for (const off of offsets) {
              const testRect = {
                  x: target.x + (off.dx * stepX),
                  y: target.y + (off.dy * stepY),
                  w: target.w,
                  h: target.h
              };
              if (this.isValidSpace(testRect)) {
                  return testRect;
              }
          }
      }

      // Hard Bump Down fallback - Ensure we don't go off screen bottom if possible
      const fallbackY = Math.max(this.currentY, target.y + 200);
      const safeY = Math.min(fallbackY, this.height - target.h - 20); // Clamp to bottom
      
      return { x: 50, y: safeY, w: target.w, h: target.h };
  }

  private isValidSpace(rect: {x:number, y:number, w:number, h:number}): boolean {
      const PADDING = 40; // Enforce explicit margins from the edge of the screen
      
      if (rect.x < PADDING || rect.y < PADDING) return false;
      if (rect.x + rect.w > this.width - PADDING) return false;
      if (rect.y + rect.h > this.height - PADDING) return false; 

      for (const el of this.elements) {
          if (this.checkOverlap(rect, el.bbox)) return false;
      }
      for (const g of this.groups) {
          if (this.checkOverlap(rect, g.bbox)) return false;
      }
      return true;
  }

  private checkOverlap(r1: {x:number, y:number, w:number, h:number}, r2: {x:number, y:number, w:number, h:number}): boolean {
    return !(r2.x > r1.x + r1.w || 
             r2.x + r2.w < r1.x || 
             r2.y > r1.y + r1.h || 
             r2.y + r2.h < r1.y);
  }
}
