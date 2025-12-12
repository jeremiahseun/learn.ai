
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { 
  BoardCommand, 
  DrawStrokePayload, 
  WriteTextPayload, 
  DrawCirclePayload, 
  DrawRectPayload, 
  DrawLinePayload,
  DrawArrowPayload, 
  DrawPolygonPayload,
  HighlightPayload,
  EraseAreaPayload,
  InsertMathFormulaPayload,
  UserTool,
  Point,
  Subject
} from '../types';

export interface WhiteboardHandle {
  exportImage: (type?: string, quality?: number) => string;
}

interface WhiteboardCanvasProps {
  commands: BoardCommand[];
  width?: number; 
  height?: number; 
  userTool: UserTool;
  onUserDraw: (command: BoardCommand) => void;
  showGrid?: boolean;
  subject?: Subject; // New prop for theming
  laserPoint?: { x: number, y: number } | null;
}

// Simple color map for subjects if Brain doesn't pass raw colors, 
// but Brain now passes explicit colors in commands. 
// This is mostly for the background base.
const SUBJECT_BGS: Record<Subject, string> = {
    general: '#020617',
    math: '#0B1120',
    science: '#022c22',
    history: '#271c19',
    literature: '#1c1917'
};

const WhiteboardCanvas = forwardRef<WhiteboardHandle, WhiteboardCanvasProps>(({ 
  commands, 
  width = 1920, 
  height = 1080,
  userTool,
  onUserDraw,
  showGrid = true,
  subject = 'general',
  laserPoint
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [laserTrail, setLaserTrail] = useState<{x: number, y: number, id: number}[]>([]);

  useImperativeHandle(ref, () => ({
    exportImage: (type = 'image/png', quality = 0.8) => {
      const canvas = canvasRef.current;
      if (!canvas) return '';
      return canvas.toDataURL(type, quality);
    }
  }));

  useEffect(() => {
    if (laserPoint) setLaserTrail(prev => [...prev, { ...laserPoint, id: Date.now() }]);
  }, [laserPoint]);

  useEffect(() => {
     let frameId: number;
     const loop = () => {
        const now = Date.now();
        setLaserTrail(prev => {
            if (prev.length === 0) return prev;
            const filtered = prev.filter(p => now - p.id < 800);
            return filtered.length !== prev.length ? filtered : prev;
        });
        frameId = requestAnimationFrame(loop);
     };
     loop();
     return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    
    // 1. Theme Background
    const bgColor = SUBJECT_BGS[subject] || '#020617';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Grid (Adaptive)
    if (showGrid) {
      drawGrid(ctx, width, height, subject);
    }

    // 3. Commands
    commands.forEach(cmd => {
      ctx.globalAlpha = 1.0; 
      renderCommand(ctx, cmd);
    });

    // 4. Current Stroke
    if (currentStroke.length > 0 && userTool === 'pen') {
      ctx.globalAlpha = 1.0;
      drawStroke(ctx, { points: currentStroke, color: '#22d3ee', width: 4 });
    }

    // 5. Laser
    if (laserTrail.length > 0) renderLaser(ctx, laserTrail);

  }, [commands, width, height, currentStroke, userTool, showGrid, laserTrail, subject]);

  const renderLaser = (ctx: CanvasRenderingContext2D, trail: {x: number, y: number, id: number}[]) => {
     if (trail.length === 0) return;
     const now = Date.now();
     ctx.save();
     ctx.globalCompositeOperation = 'lighter';
     ctx.lineCap = 'round';
     ctx.lineJoin = 'round';
     for (let i = 0; i < trail.length - 1; i++) {
        const p1 = trail[i];
        const p2 = trail[i+1];
        const age = now - p2.id;
        const life = Math.max(0, 1 - age / 800);
        if (life <= 0) continue;
        const size = 4 + (life * 12);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(239, 68, 68, ${life})`; 
        ctx.strokeStyle = `rgba(252, 165, 165, ${life * 0.8})`; 
        ctx.lineWidth = size;
        ctx.stroke();
     }
     const head = trail[trail.length - 1];
     ctx.shadowBlur = 25;
     ctx.shadowColor = '#ef4444';
     ctx.fillStyle = '#ffffff';
     ctx.beginPath();
     ctx.arc(head.x, head.y, 8, 0, Math.PI * 2);
     ctx.fill();
     ctx.restore();
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number, subj: Subject) => {
    const gridSize = 60;
    
    if (subj === 'math') {
        // Graph Paper Style
        ctx.beginPath();
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 1;
        for (let x = 0; x <= w; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = 0; y <= h; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();
    } else if (subj === 'history') {
        // Horizontal Notebook Lines
        ctx.beginPath();
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1;
        for (let y = 0; y <= h; y += 40) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
        ctx.stroke();
    } else if (subj === 'science') {
        // Crosshairs
        ctx.fillStyle = '#064e3b';
        for (let x = 0; x <= w; x += gridSize) {
            for (let y = 0; y <= h; y += gridSize) {
                ctx.fillRect(x-4, y, 9, 1);
                ctx.fillRect(x, y-4, 1, 9);
            }
        }
    } else {
        // Standard Dots
        ctx.fillStyle = '#334155';
        for (let x = 0; x <= w; x += gridSize) {
            for (let y = 0; y <= h; y += gridSize) {
                ctx.fillRect(x-1, y-1, 2, 2);
            }
        }
    }
  };

  const renderCommand = (ctx: CanvasRenderingContext2D, cmd: BoardCommand) => {
      switch (cmd.type) {
        case 'stroke': drawStroke(ctx, cmd.payload); break;
        case 'line': drawLine(ctx, cmd.payload); break;
        case 'arrow': drawArrow(ctx, cmd.payload); break;
        case 'circle': drawCircle(ctx, cmd.payload); break;
        case 'rect': drawRect(ctx, cmd.payload); break;
        case 'polygon': drawPolygon(ctx, cmd.payload); break;
        case 'text': writeText(ctx, cmd.payload); break;
        // Formula is handled by overlay DOM, but we can render a placeholder/fallback here if needed
        case 'formula': writeFormula(ctx, cmd.payload); break; 
        case 'highlight': drawHighlight(ctx, cmd.payload); break;
        case 'erase-area': eraseArea(ctx, cmd.payload); break;
      }
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, payload: DrawStrokePayload) => {
    const { points, color, width = 3 } = payload;
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) { ctx.lineTo(points[i].x, points[i].y); }
    ctx.stroke();
  };

  const drawLine = (ctx: CanvasRenderingContext2D, payload: DrawLinePayload) => {
    const { x1, y1, x2, y2, color, width = 3 } = payload;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, payload: DrawArrowPayload) => {
    const { x1, y1, x2, y2, color, width = 3 } = payload;
    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, payload: DrawCirclePayload) => {
    const { x, y, radius, color } = payload;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawRect = (ctx: CanvasRenderingContext2D, payload: DrawRectPayload) => {
    const { x, y, width, height, color, fill } = payload;
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(x,y,width,height); }
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
  };

  const drawPolygon = (ctx: CanvasRenderingContext2D, payload: DrawPolygonPayload) => {
    const { points, color, fill } = payload;
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) { ctx.lineTo(points[i].x, points[i].y); }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const drawHighlight = (ctx: CanvasRenderingContext2D, payload: HighlightPayload) => {
    const { x, y, width, height, color } = payload;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1.0;
  };

  const eraseArea = (ctx: CanvasRenderingContext2D, payload: EraseAreaPayload) => {
    const { x, y, width, height } = payload;
    ctx.fillStyle = SUBJECT_BGS[subject]; 
    ctx.fillRect(x, y, width, height);
  };

  const writeText = (ctx: CanvasRenderingContext2D, payload: WriteTextPayload) => {
    const { text, x, y, color = '#ffffff', size = 24, align = 'left', maxWidth, fontStyle = 'normal' } = payload;
    
    // Choose font based on subject if needed, or stick to provided style
    const fontName = subject === 'math' ? 'serif' : (fontStyle === 'italic' ? 'serif' : 'Kalam');
    ctx.font = `${fontStyle} ${size}px '${fontName}', cursive, sans-serif`;
    
    ctx.textBaseline = 'top'; 
    ctx.textAlign = align as CanvasTextAlign;
    ctx.fillStyle = color;

    const lineHeight = size * 1.4;

    if (!maxWidth || text.length < 10) {
        ctx.fillText(text, x, y);
        return;
    }

    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, x, currentY);
            line = words[i] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
  };

  const writeFormula = (ctx: CanvasRenderingContext2D, payload: InsertMathFormulaPayload) => {
     // Fallback for canvas export - The HTML Overlay handles the live view
     const { expression, x, y, color = '#fbbf24', size = 36 } = payload;
     ctx.font = `italic 700 ${size}px 'Times New Roman', serif`; 
     ctx.textBaseline = 'top';
     ctx.fillStyle = color;
     ctx.fillText(expression, x, y);
  };

  // --- HTML Overlay for Complex Elements (Math) ---
  const overlayElements = commands.filter(c => c.type === 'formula') as { type: 'formula', payload: InsertMathFormulaPayload }[];

  // Interaction handlers
  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (userTool === 'pointer') return;
    const pt = getCanvasPoint(e);
    if (!pt) return;
    setIsDrawing(true);
    setCurrentStroke([pt]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;
    if (userTool === 'pen') {
       setCurrentStroke(prev => [...prev, pt]);
    } else if (userTool === 'eraser') {
       onUserDraw({ type: 'erase-area', payload: { x: pt.x - 30, y: pt.y - 30, width: 60, height: 60 } });
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (userTool === 'pen' && currentStroke.length > 1) {
      onUserDraw({ type: 'stroke', payload: { points: currentStroke, color: '#22d3ee', width: 4 } });
    }
    setCurrentStroke([]);
  };

  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef} 
        className={`w-full h-full rounded-lg shadow-inner border border-slate-700 
          ${userTool !== 'pointer' ? 'cursor-crosshair touch-none' : 'cursor-default'}`}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
      
      {/* KaTeX / HTML Overlay for High Fidelity Text */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
         {overlayElements.map((el, i) => (
             <div 
               key={i} 
               style={{ 
                   position: 'absolute', 
                   left: `${(el.payload.x / width) * 100}%`, 
                   top: `${(el.payload.y / height) * 100}%`,
                   color: el.payload.color,
                   fontSize: `${(el.payload.size || 36) / width * 100}vw`, // Responsive Font
                   fontFamily: 'serif',
                   fontStyle: 'italic',
                   fontWeight: 'bold',
                   transformOrigin: 'top left',
                   whiteSpace: 'nowrap'
               }}
             >
                {el.payload.expression}
             </div>
         ))}
      </div>
    </div>
  );
});

export default WhiteboardCanvas;
