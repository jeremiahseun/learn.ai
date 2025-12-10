
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
  Point
} from '../types';

export interface WhiteboardHandle {
  exportImage: () => string; // Returns data URL
}

interface WhiteboardCanvasProps {
  commands: BoardCommand[];
  width?: number; // Logical width, defaults to 1920
  height?: number; // Logical height, defaults to 1080
  userTool: UserTool;
  onUserDraw: (command: BoardCommand) => void;
  showGrid?: boolean;
  laserPoint?: { x: number, y: number } | null; // New Prop for Laser
}

const WhiteboardCanvas = forwardRef<WhiteboardHandle, WhiteboardCanvasProps>(({ 
  commands, 
  width = 1920, 
  height = 1080,
  userTool,
  onUserDraw,
  showGrid = true,
  laserPoint
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  
  // Laser Trail State (Point + Timestamp)
  const [laserTrail, setLaserTrail] = useState<{x: number, y: number, id: number}[]>([]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    exportImage: () => {
      const canvas = canvasRef.current;
      if (!canvas) return '';
      return canvas.toDataURL('image/png');
    }
  }));

  // Update Laser Trail when new point arrives
  useEffect(() => {
    if (laserPoint) {
       setLaserTrail(prev => [...prev, { ...laserPoint, id: Date.now() }]);
    }
  }, [laserPoint]);

  // Laser Animation Loop (Fade out)
  useEffect(() => {
     let frameId: number;
     const loop = () => {
        const now = Date.now();
        // Remove points older than 1.5 seconds
        setLaserTrail(prev => {
            if (prev.length === 0) return prev;
            const filtered = prev.filter(p => now - p.id < 1500);
            return filtered.length !== prev.length ? filtered : prev;
        });
        frameId = requestAnimationFrame(loop);
     };
     loop();
     return () => cancelAnimationFrame(frameId);
  }, []);

  // Render logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set internal resolution (The Source of Truth)
    canvas.width = width;
    canvas.height = height;
    
    // 1. Fill Background
    ctx.fillStyle = '#1e293b'; // Slate-800
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Grid (if enabled)
    if (showGrid) {
      drawGrid(ctx, width, height);
    }

    // 3. Render all confirmed commands
    commands.forEach(cmd => {
      ctx.globalAlpha = 1.0; 
      renderCommand(ctx, cmd);
    });

    // 4. Render current user stroke (active drawing)
    if (currentStroke.length > 0 && userTool === 'pen') {
      ctx.globalAlpha = 1.0;
      drawStroke(ctx, { points: currentStroke, color: '#4ADE80', width: 4 }); // Student draws in Green
    }

    // 5. Render Laser Trail
    if (laserTrail.length > 0) {
       renderLaser(ctx, laserTrail);
    }

  }, [commands, width, height, currentStroke, userTool, showGrid, laserTrail]);

  const renderLaser = (ctx: CanvasRenderingContext2D, trail: {x: number, y: number, id: number}[]) => {
     const now = Date.now();
     ctx.lineCap = 'round';
     ctx.lineJoin = 'round';

     // Draw the trail
     if (trail.length > 1) {
        ctx.beginPath();
        // Start from first point
        ctx.moveTo(trail[0].x, trail[0].y);
        
        for (let i = 1; i < trail.length; i++) {
           ctx.lineTo(trail[i].x, trail[i].y);
        }
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fca5a5'; // Red glow
        ctx.strokeStyle = 'rgba(252, 165, 165, 0.6)'; // Red-ish transparent
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
     }

     // Draw the glowing dots (tips)
     trail.forEach(p => {
        const age = now - p.id;
        const opacity = Math.max(0, 1 - age / 1500);
        
        ctx.beginPath();
        ctx.fillStyle = `rgba(239, 68, 68, ${opacity})`; // Red-500
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
     });
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const gridSize = 60; // Logical pixels
    ctx.beginPath();
    ctx.strokeStyle = '#334155'; // Slate-700
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }

    // Horizontal lines
    for (let y = 0; y <= h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    
    ctx.stroke();

    // Center Crosshair
    ctx.beginPath();
    ctx.strokeStyle = '#475569'; // Slightly brighter
    ctx.lineWidth = 2;
    ctx.moveTo(w/2, 0);
    ctx.lineTo(w/2, h);
    ctx.moveTo(0, h/2);
    ctx.lineTo(w, h/2);
    ctx.stroke();
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
        case 'formula': writeFormula(ctx, cmd.payload); break;
        case 'highlight': drawHighlight(ctx, cmd.payload); break;
        case 'erase-area': eraseArea(ctx, cmd.payload); break;
        case 'clear': break;
      }
  };

  // --- Interaction Handlers ---
  
  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    return { x, y };
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
       onUserDraw({
         type: 'erase-area',
         payload: { x: pt.x - 30, y: pt.y - 30, width: 60, height: 60 }
       });
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (userTool === 'pen' && currentStroke.length > 1) {
      onUserDraw({
        type: 'stroke',
        payload: { points: currentStroke, color: '#4ADE80', width: 4 }
      });
    }
    setCurrentStroke([]);
  };

  // --- Drawing Primitives ---

  const drawStroke = (ctx: CanvasRenderingContext2D, payload: DrawStrokePayload) => {
    const { points, color, width = 3 } = payload;
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
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
    const headLength = 20;
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
    const { x, y, width, height, color } = payload;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
  };

  const drawPolygon = (ctx: CanvasRenderingContext2D, payload: DrawPolygonPayload) => {
    const { points, color, fill } = payload;
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
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
    ctx.fillStyle = '#1e293b'; 
    ctx.fillRect(x, y, width, height);
  };

  const writeText = (ctx: CanvasRenderingContext2D, payload: WriteTextPayload) => {
    const { text, x, y, color = '#ffffff', size = 24, align = 'left' } = payload;
    ctx.font = `${size}px sans-serif`;
    ctx.textBaseline = 'top'; 
    ctx.textAlign = align as CanvasTextAlign;
    
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.strokeText(text, x, y);

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  };

  const writeFormula = (ctx: CanvasRenderingContext2D, payload: InsertMathFormulaPayload) => {
     const { expression, x, y, color = '#fbbf24', size = 36 } = payload;
     ctx.font = `italic ${size}px serif`;
     ctx.textBaseline = 'top';
     
     ctx.strokeStyle = '#0f172a';
     ctx.lineWidth = 5;
     ctx.strokeText(expression, x, y);

     ctx.fillStyle = color;
     ctx.fillText(expression, x, y);
  };

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full bg-slate-800 rounded-lg shadow-inner border border-slate-700 
        ${userTool !== 'pointer' ? 'cursor-crosshair touch-none' : 'cursor-default'}`}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    />
  );
});

export default WhiteboardCanvas;
