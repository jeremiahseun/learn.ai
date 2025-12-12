
import { BoardCommand, BrainElement, BrainGroup, SemanticPosition, SemanticRole, BoardZone, LayoutMode, Subject, SubjectTheme, TreeNode, TimelineEvent } from "../types";

// --- Configuration ---

const PADDING = 50;
const LINE_HEIGHT_MULTIPLIER = 1.4;

// --- Themes ---
const THEMES: Record<Subject, SubjectTheme> = {
  general: {
    name: 'general',
    background: '#020617', // Slate-950
    gridType: 'dots',
    gridColor: '#1e293b',
    primaryColor: '#f8fafc',
    secondaryColor: '#cbd5e1',
    accentColor: '#22d3ee', // Cyan
    fontFamily: 'Kalam'
  },
  math: {
    name: 'math',
    background: '#0B1120', // Darker Blue tint
    gridType: 'lines',
    gridColor: '#1e3a8a', // Blue-900 grid
    primaryColor: '#e0f2fe',
    secondaryColor: '#94a3b8',
    accentColor: '#fcd34d', // Yellow for variables
    fontFamily: 'serif' // KaTeX style
  },
  science: {
    name: 'science',
    background: '#022c22', // Very dark emerald
    gridType: 'cross',
    gridColor: '#064e3b',
    primaryColor: '#ecfdf5',
    secondaryColor: '#a7f3d0',
    accentColor: '#34d399', // Emerald
    fontFamily: 'sans-serif'
  },
  history: {
    name: 'history',
    background: '#271c19', // Dark Sepia/Brown
    gridType: 'lines',
    gridColor: '#451a03',
    primaryColor: '#fef3c7', // Amber-100
    secondaryColor: '#d6d3d1',
    accentColor: '#fbbf24', // Gold
    fontFamily: 'serif'
  },
  literature: {
    name: 'literature',
    background: '#1c1917', // Stone-900
    gridType: 'none',
    gridColor: 'transparent',
    primaryColor: '#fafaf9',
    secondaryColor: '#a8a29e',
    accentColor: '#e879f9', // Fuchsia
    fontFamily: 'serif'
  }
};

export class BoardBrain {
  private elements: BrainElement[] = [];
  private groups: BrainGroup[] = [];
  private width: number;
  private height: number;
  
  private elementCounter = 0;
  private groupColorIndex = 0;

  private currentSubject: Subject = 'general';
  
  // --- Layout State Machine ---
  private layoutMode: LayoutMode = 'standard';
  
  // Simple Linear Cursors
  private cursors: Record<BoardZone, { x: number, y: number, w: number }> = {
    header: { x: PADDING, y: PADDING, w: 0 },
    main: { x: PADDING, y: 150, w: 0 },
    sidebar: { x: 0, y: 150, w: 0 },
    footer: { x: PADDING, y: 0, w: 0 },
    floating: { x: 0, y: 0, w: 0 }
  };

  constructor(width = 1920, height = 1080) {
    this.width = width;
    this.height = height;
    this.reset();
  }

  public reset() {
    this.elements = [];
    this.groups = [];
    this.elementCounter = 0;
    this.groupColorIndex = 0;
    this.layoutMode = 'standard';
    this.currentSubject = 'general';
    this.initializeCursors();
  }

  private initializeCursors() {
    // Header Zone: Always top full width
    this.cursors.header = { x: PADDING, y: PADDING, w: this.width - (PADDING * 2) };

    // Standard Mode: Main takes full width (minus margins)
    if (this.layoutMode === 'standard') {
      const mainW = Math.min(1000, this.width - (PADDING * 2));
      this.cursors.main = { x: PADDING, y: 160, w: mainW }; 
      this.cursors.sidebar = { x: this.width + 100, y: 0, w: 0 }; // Hidden
    } 
    // Split View: Main (Left 60%), Sidebar (Right 35%)
    else if (this.layoutMode === 'split-view') {
      const gap = 60;
      const availableW = this.width - (PADDING * 2) - gap;
      const mainW = Math.floor(availableW * 0.6);
      const sideW = Math.floor(availableW * 0.4);
      
      this.cursors.main = { x: PADDING, y: 160, w: mainW };
      this.cursors.sidebar = { x: PADDING + mainW + gap, y: 160, w: sideW };
    }
  }

  public setLayoutMode(mode: LayoutMode) {
    this.layoutMode = mode;
    this.initializeCursors();
  }

  public setSubject(subject: Subject) {
    this.currentSubject = subject;
  }

  public getTheme(): SubjectTheme {
    return THEMES[this.currentSubject];
  }

  // --- Typography Helper ---
  private getStyleForRole(role: SemanticRole): { size: number, color: string, weight: string, marginBot: number, italic?: boolean } {
    const theme = this.getTheme();
    const defaults = {
        title: { size: 60, color: theme.accentColor, weight: 'bold', marginBot: 40 },
        heading: { size: 42, color: theme.primaryColor, weight: 'bold', marginBot: 25 },
        subheading: { size: 32, color: theme.secondaryColor, weight: 'bold', marginBot: 20 },
        body: { size: 28, color: theme.secondaryColor, weight: 'normal', marginBot: 15 },
        bullet: { size: 28, color: theme.secondaryColor, weight: 'normal', marginBot: 15 },
        equation: { size: 36, color: '#fbbf24', weight: 'normal', marginBot: 25, italic: true },
        example: { size: 24, color: '#86efac', weight: 'normal', marginBot: 20 },
        note: { size: 22, color: '#fcd34d', weight: 'normal', marginBot: 10 },
        label: { size: 20, color: theme.accentColor, weight: 'bold', marginBot: 0 },
        'group-title': { size: 26, color: '#a5b4fc', weight: 'bold', marginBot: 15 },
        'tree-node': { size: 20, color: theme.primaryColor, weight: 'bold', marginBot: 0 },
        container: { size: 0, color: '#334155', weight: 'normal', marginBot: 0 },
        connector: { size: 0, color: '#64748b', weight: 'normal', marginBot: 0 },
    };
    return (defaults as any)[role] || defaults.body;
  }

  // --- Core API ---

  public writeText(
    text: string, 
    role: SemanticRole, 
    positionStr: SemanticPosition = 'auto', 
    relativeToId?: string, 
    groupId?: string
  ): { command: BoardCommand, id: string } {
    
    const style = this.getStyleForRole(role);
    let zone: BoardZone = 'main';

    if (role === 'title') zone = 'header';
    else if (role === 'note' || role === 'label') zone = 'floating';
    else if (positionStr === 'aside') zone = 'sidebar';
    
    // Auto-switch to split layout if sidebar requested
    if (zone === 'sidebar' && this.layoutMode === 'standard') {
        this.setLayoutMode('split-view');
    }

    // Indentation Logic
    let indentX = 0;
    if (role === 'bullet') indentX = 40;
    if (role === 'subheading') indentX = 20;
    if (positionStr === 'indent') indentX += 60;

    // Constraint: Max Width inside the zone
    const maxZoneWidth = this.cursors[zone].w;
    const maxWidth = maxZoneWidth - indentX;
    
    // Estimate Height based on char count and max width
    const avgCharW = style.size * 0.55; 
    const estLines = Math.ceil((text.length * avgCharW) / maxWidth);
    const h = Math.max(style.size * LINE_HEIGHT_MULTIPLIER, estLines * (style.size * LINE_HEIGHT_MULTIPLIER));

    // Calculate Position
    let x = this.cursors[zone].x + indentX;
    let y = this.cursors[zone].y;

    // Special Case: Relative (Floating labels)
    if (relativeToId && zone === 'floating') {
       const refEl = this.elements.find(e => e.id === relativeToId);
       if (refEl) {
          x = refEl.bbox.x;
          y = refEl.bbox.y + refEl.bbox.h + 10;
       }
    }

    // Special Case: Inside Group
    if (groupId) {
       const group = this.groups.find(g => g.id === groupId);
       if (group) {
          const groupEls = this.elements.filter(e => e.groupId === groupId);
          let maxY = group.bbox.y + 60; 
          groupEls.forEach(e => {
             maxY = Math.max(maxY, e.bbox.y + e.bbox.h + 15);
          });
          x = group.bbox.x + 20 + indentX;
          y = maxY;
          
          this.expandGroup(groupId, {x, y, w: maxWidth, h});
       }
    }

    // Update Main Cursors (Flow downwards)
    if (!groupId && zone !== 'floating') {
       this.cursors[zone].y += h + style.marginBot;
       
       // Simple page break logic (move to new column if way too long)
       if (this.cursors[zone].y > this.height - 100) {
          // Just reset slightly right? Or just let it scroll?
          // For safety, let's just let it overflow down, canvas handles clipping
          // But ideally we'd move to right column
       }
    }

    const id = `t_${++this.elementCounter}`;
    
    // Alignment logic for Title
    let renderX = x;
    const align = role === 'title' ? 'center' : 'left';
    if (align === 'center') {
        renderX = x + (maxWidth / 2); // Center point for canvas text
    }

    this.elements.push({
      id, role, zone, bbox: { x, y, w: maxWidth, h }, text, groupId, refId: relativeToId
    });

    // Pure math equation (LaTeX)
    if (role === 'equation') {
       return {
         command: { type: 'formula', payload: { x: renderX, y, expression: text, size: style.size, color: style.color } },
         id
       };
    }

    const command: BoardCommand = {
      type: 'text',
      payload: {
        text,
        x: renderX,
        y,
        color: style.color,
        size: style.size,
        align: align,
        maxWidth: maxWidth,
        fontStyle: style.italic ? 'italic' : role.includes('heading') ? 'bold' : 'normal'
      }
    };

    return { command, id };
  }

  public drawShape(
    shape: 'rectangle' | 'circle' | 'arrow' | 'line', 
    positionStr: SemanticPosition = 'auto', 
    label?: string,
    relativeToId?: string
  ): { command: BoardCommand, id: string } {
    
    let zone: BoardZone = this.layoutMode === 'split-view' ? 'sidebar' : 'main';
    if (positionStr === 'aside') zone = 'sidebar';
    if (zone === 'sidebar' && this.layoutMode === 'standard') this.setLayoutMode('split-view');

    const w = 300;
    const h = 200;
    
    // Simple Centering in Column
    let x = this.cursors[zone].x + (this.cursors[zone].w - w)/2;
    let y = this.cursors[zone].y;

    if (relativeToId) {
        const ref = this.findElement(relativeToId);
        if (ref) {
            y = ref.bbox.y + ref.bbox.h + 20;
            // Don't update main cursor if relative? 
            // Actually usually better to update main cursor to avoid overlap if we flow
            if (y >= this.cursors[zone].y) {
               this.cursors[zone].y = y + h + 40;
            }
        }
    } else {
        // Standard flow
        this.cursors[zone].y += h + 40;
    }

    const id = `s_${++this.elementCounter}`;
    
    let command: BoardCommand;
    const theme = this.getTheme();
    const color = theme.primaryColor;

    if (shape === 'rectangle') {
       command = { type: 'rect', payload: { x, y, width: w, height: h, color } };
    } else if (shape === 'circle') {
       command = { type: 'circle', payload: { x: x+w/2, y: y+h/2, radius: h/2, color } };
    } else {
        command = { type: 'arrow', payload: { x1: x, y1: y + h/2, x2: x+w, y2: y+h/2, color: '#94a3b8' } };
    }

    this.elements.push({ id, role: 'container', zone, bbox: {x, y, w, h} });

    return { command, id };
  }

  // --- Specialized Layout Engines ---

  public drawTree(root: TreeNode, positionStr: SemanticPosition = 'auto'): { commands: BoardCommand[], id: string } {
     let zone: BoardZone = this.layoutMode === 'split-view' ? 'sidebar' : 'main';
     if (positionStr === 'aside') zone = 'sidebar';
     if (zone === 'sidebar' && this.layoutMode === 'standard') this.setLayoutMode('split-view');

     const commands: BoardCommand[] = [];
     const theme = this.getTheme();
     
     // Tree Config
     const nodeW = 120;
     const nodeH = 50;
     const levelH = 100;
     const siblingGap = 40;

     // Calculate total width recursively
     const getTreeWidth = (node: TreeNode): number => {
         if (!node.children || node.children.length === 0) return nodeW + siblingGap;
         let w = 0;
         for(const c of node.children) w += getTreeWidth(c);
         return w;
     };

     const totalW = getTreeWidth(root);
     // Center the tree in the zone
     const startX = this.cursors[zone].x + (this.cursors[zone].w - totalW) / 2;
     const startY = this.cursors[zone].y;

     const renderNode = (node: TreeNode, x: number, y: number, availableW: number): {x:number, y:number} => {
        const myX = x + availableW / 2 - nodeW / 2;
        
        commands.push({
            type: 'rect',
            payload: { x: myX, y, width: nodeW, height: nodeH, color: theme.accentColor }
        });
        
        commands.push({
            type: 'text',
            payload: { 
                text: node.label, x: myX + nodeW/2, y: y + 15, 
                color: theme.background, size: 16, maxWidth: nodeW - 10, align: 'center'
            }
        });

        if (node.children && node.children.length > 0) {
            let currentChildX = x;
            const childY = y + levelH;
            
            node.children.forEach(child => {
                const childW = getTreeWidth(child);
                const childPos = renderNode(child, currentChildX, childY, childW);
                
                commands.push({
                    type: 'line',
                    payload: {
                        x1: myX + nodeW/2, y1: y + nodeH,
                        x2: childPos.x + nodeW/2, y2: childY,
                        color: theme.secondaryColor, width: 2
                    }
                });
                
                currentChildX += childW;
            });
        }
        
        return { x: myX, y };
     };

     renderNode(root, startX, startY, totalW);
     
     const treeHeight = 400; // Hardcoded safety height for tree
     this.cursors[zone].y += treeHeight + 50;
     const id = `tree_${++this.elementCounter}`;
     this.elements.push({ id, role: 'container', zone, bbox: {x: startX, y: startY, w: totalW, h: treeHeight} });

     return { commands, id };
  }

  public drawTimeline(events: TimelineEvent[], positionStr: SemanticPosition = 'auto'): { commands: BoardCommand[], id: string } {
    let zone: BoardZone = 'main'; 
    if (positionStr === 'aside') zone = 'sidebar';
    if (zone === 'sidebar' && this.layoutMode === 'standard') this.setLayoutMode('split-view');

    const w = this.cursors[zone].w - 40;
    const h = 250;
    const x = this.cursors[zone].x + 20;
    const y = this.cursors[zone].y;
    
    const commands: BoardCommand[] = [];
    const theme = this.getTheme();

    // Main Axis
    const axisY = y + h / 2;
    commands.push({
        type: 'line',
        payload: { x1: x, y1: axisY, x2: x + w, y2: axisY, color: theme.primaryColor, width: 3 }
    });

    const step = w / (events.length + 1);
    
    events.forEach((evt, i) => {
        const evtX = x + step * (i + 1);
        const isTop = i % 2 === 0;
        const tickH = 20;
        
        commands.push({
            type: 'line',
            payload: { x1: evtX, y1: axisY - tickH/2, x2: evtX, y2: axisY + tickH/2, color: theme.accentColor, width: 2 }
        });

        const labelY = isTop ? axisY - 60 : axisY + 30;
        commands.push({
            type: 'text',
            payload: { 
                text: `${evt.year}: ${evt.label}`, 
                x: evtX, y: labelY, 
                color: theme.secondaryColor, size: 18, align: 'center', maxWidth: 100
            }
        });
        
        commands.push({
            type: 'circle',
            payload: { x: evtX, y: axisY, radius: 5, color: theme.accentColor }
        });
    });

    this.cursors[zone].y += h + 40;
    const id = `timeline_${++this.elementCounter}`;
    this.elements.push({ id, role: 'container', zone, bbox: {x, y, w, h} });

    return { commands, id };
  }

  public drawGraph(
      title: string, 
      equations: string[], 
      positionStr: SemanticPosition = 'auto',
      relativeToId?: string
  ): { commands: BoardCommand[], id: string } {
      let zone: BoardZone = this.layoutMode === 'split-view' ? 'sidebar' : 'main';
      if (positionStr === 'aside') zone = 'sidebar';
      if (zone === 'sidebar' && this.layoutMode === 'standard') this.setLayoutMode('split-view');

      const w = Math.min(600, this.cursors[zone].w);
      const h = 400;
      
      let x = this.cursors[zone].x + (this.cursors[zone].w - w)/2;
      let y = this.cursors[zone].y;

      if (relativeToId) {
          const refEl = this.findElement(relativeToId);
          if (refEl) {
              x = refEl.bbox.x;
              y = refEl.bbox.y + refEl.bbox.h + 20;
          }
      }

      // Ensure we push content down
      if (y >= this.cursors[zone].y) {
          this.cursors[zone].y = y + h + 50;
      }

      const id = `graph_${++this.elementCounter}`;
      this.elements.push({ id, role: 'container', zone, bbox: {x, y, w, h} });
      const commands: BoardCommand[] = [];
      const theme = this.getTheme();

      commands.push({ type: 'rect', payload: { x, y, width: w, height: h, color: theme.background, fill: theme.background } });
      commands.push({ type: 'rect', payload: { x, y, width: w, height: h, color: theme.gridColor } }); 

      if (theme.gridType === 'lines') {
          for(let i=1; i<10; i++) {
              commands.push({ type: 'line', payload: { x1: x + (w/10)*i, y1: y, x2: x + (w/10)*i, y2: y+h, color: theme.gridColor, width: 1 } });
              commands.push({ type: 'line', payload: { x1: x, y1: y + (h/10)*i, x2: x+w, y2: y+(h/10)*i, color: theme.gridColor, width: 1 } });
          }
      }

      const xMin = -10, xMax = 10;
      const step = 0.2;
      const mapX = (v: number) => x + ((v - xMin) / (xMax - xMin)) * w;
      const mapY = (v: number, yMin: number, yMax: number) => (y + h) - ((v - (yMin - (yMax-yMin)*0.1)) / ((yMax + (yMax-yMin)*0.1) - (yMin - (yMax-yMin)*0.1))) * h;

      const originX = mapX(0);
      const originY = y + h/2;
      commands.push({ type: 'line', payload: { x1: x, y1: originY, x2: x+w, y2: originY, color: theme.secondaryColor, width: 2 }});
      commands.push({ type: 'line', payload: { x1: originX, y1: y, x2: originX, y2: y+h, color: theme.secondaryColor, width: 2 }});

      const colors = [theme.accentColor, '#f472b6', '#34d399'];
      equations.forEach((eq, idx) => {
          const rawPoints: {x:number, y:number}[] = [];
          for(let val = xMin; val <= xMax; val += step) {
              const res = this.evalEquation(eq, val);
              if (res !== null) rawPoints.push({x: val, y: res});
          }
          if (rawPoints.length < 2) return;
          const yMin = -10, yMax = 10; 
          const screenPoints = rawPoints.map(p => ({ x: mapX(p.x), y: mapY(p.y, yMin, yMax) }));
          const clippedPoints = screenPoints.filter(p => p.y >= y && p.y <= y + h);
          if (clippedPoints.length > 1) {
              commands.push({
                  type: 'stroke',
                  payload: { points: clippedPoints, color: colors[idx % colors.length], width: 3 }
              });
          }
          commands.push({
              type: 'text',
              payload: { text: eq, x: x + 10, y: y + 10 + (idx*20), color: colors[idx % colors.length], size: 14 }
          });
      });

      commands.push({
          type: 'text',
          payload: { text: title, x: x + w - 100, y: y + 10, color: theme.secondaryColor, size: 16 }
      });

      return { commands, id };
  }

  // --- Utilities ---
  public createGroup(title: string, positionStr: SemanticPosition = 'auto'): { command: BoardCommand, id: string } {
      let zone: BoardZone = 'main';
      if (positionStr === 'aside') zone = 'sidebar';
      
      const w = this.cursors[zone].w - 20;
      const h = 100;
      const x = this.cursors[zone].x;
      const y = this.cursors[zone].y;

      const id = `g_${++this.elementCounter}`;
      this.groups.push({ id, title, bbox: {x, y, w, h} });
      this.cursors[zone].y += 80; // Reserve space for content inside group

      const theme = this.getTheme();
      return { 
          command: { type: 'rect', payload: { x, y, width: w, height: h, color: theme.gridColor } }, 
          id 
      };
  }

  public connectElements(sourceId: string, targetId: string, label?: string): { command: BoardCommand, labelCommand?: BoardCommand } | null {
      const s = this.findElement(sourceId);
      const t = this.findElement(targetId);
      if (!s || !t) return null;
      const command: BoardCommand = {
          type: 'arrow',
          payload: {
              x1: s.bbox.x + s.bbox.w, y1: s.bbox.y + s.bbox.h/2,
              x2: t.bbox.x, y2: t.bbox.y + t.bbox.h/2,
              color: this.getTheme().secondaryColor, width: 2
          }
      };
      return { command };
  }

  private findElement(id: string): { bbox: any } | null {
      const el = this.elements.find(e => e.id === id);
      if (el) return el;
      const g = this.groups.find(g => g.id === id);
      if (g) return g;
      return null;
  }

  private expandGroup(groupId: string, rect: {x:number, y:number, w:number, h:number}) {
      const g = this.groups.find(x => x.id === groupId);
      if (!g) return;
      if (rect.y + rect.h > g.bbox.y + g.bbox.h) {
           g.bbox.h = (rect.y + rect.h) - g.bbox.y + 20;
      }
  }

  private evalEquation(eq: string, x: number): number | null {
    try {
        const sanitized = eq.toLowerCase().replace(/\bsin\b/g, 'Math.sin').replace(/\bcos\b/g, 'Math.cos').replace(/\btan\b/g, 'Math.tan').replace(/\bpi\b/g, 'Math.PI').replace(/\^/g, '**').replace(/x/g, `(${x})`);
        return new Function(`return ${sanitized}`)();
    } catch { return null; }
  }
}
