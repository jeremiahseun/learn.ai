
import React, { useRef, useEffect, useState } from 'react';
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

interface WhiteboardCanvasProps {
  commands: BoardCommand[];
  width?: number;
  height?: number;
  userTool: UserTool;
  onUserDraw: (command: BoardCommand) => void;
}

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ 
  commands, 
  width = 1000, 
  height = 1000,
  userTool,
  onUserDraw
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  // Render logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High DPI
    const dpr = window.devicePixelRatio || 1;
    // Set internal resolution
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Scale drawing context so we can draw in 0-1000 units
    ctx.scale(dpr, dpr);

    // Initial background
    ctx.fillStyle = '#1e293b'; // Slate-800
    ctx.fillRect(0, 0, width, height);

    // Render all confirmed commands
    commands.forEach(cmd => {
      ctx.globalAlpha = 1.0; 
      renderCommand(ctx, cmd);
    });

    // Render current user stroke (active drawing)
    if (currentStroke.length > 0 && userTool === 'pen') {
      ctx.globalAlpha = 1.0;
      drawStroke(ctx, { points: currentStroke, color: '#4ADE80', width: 3 }); // Student draws in Green
    }

  }, [commands, width, height, currentStroke, userTool]);

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
        case 'clear':
           ctx.fillStyle = '#1e293b';
           ctx.fillRect(0, 0, width, height);
           break;
      }
  };

  // --- Interaction Handlers ---
  
  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Internal resolution (coordinate system)
    const internalW = width;
    const internalH = height;
    
    // Rendered box size (element size in CSS pixels)
    const rectW = rect.width;
    const rectH = rect.height;
    
    // Calculate aspect ratios
    const internalRatio = internalW / internalH;
    const rectRatio = rectW / rectH;
    
    let renderW, renderH, offsetX, offsetY;
    
    // Determine the actual size of the drawn content within the element
    // This logic mimics 'object-fit: contain'
    if (rectRatio > internalRatio) {
      // Container is wider than content (Letterbox on sides)
      renderH = rectH;
      renderW = rectH * internalRatio;
      offsetX = (rectW - renderW) / 2;
      offsetY = 0;
    } else {
      // Container is taller than content (Letterbox on top/bottom)
      renderW = rectW;
      renderH = rectW / internalRatio;
      offsetX = 0;
      offsetY = (rectH - renderH) / 2;
    }
    
    // Coordinates relative to the canvas element top-left
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    
    // Map relative coordinates to internal coordinate system
    // (relX - offsetX) shifts the origin to the start of the content
    // (internalW / renderW) scales the pixels to internal units
    const x = (relX - offsetX) * (internalW / renderW);
    const y = (relY - offsetY) * (internalH / renderH);
    
    // Optional: Clamp to bounds or allow drawing slightly outside? 
    // Allowing slightly outside is better for edge strokes.
    
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
         payload: { x: pt.x - 25, y: pt.y - 25, width: 50, height: 50 }
       });
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (userTool === 'pen' && currentStroke.length > 1) {
      onUserDraw({
        type: 'stroke',
        payload: { points: currentStroke, color: '#4ADE80', width: 3 }
      });
    }
    setCurrentStroke([]);
  };

  // --- Drawing Primitives (Shared) ---

  const drawStroke = (ctx: CanvasRenderingContext2D, payload: DrawStrokePayload) => {
    const { points, color, width = 2 } = payload;
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
    const { x1, y1, x2, y2, color, width = 2 } = payload;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, payload: DrawArrowPayload) => {
    const { x1, y1, x2, y2, color, width = 2 } = payload;
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
    ctx.lineWidth = 2;
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawRect = (ctx: CanvasRenderingContext2D, payload: DrawRectPayload) => {
    const { x, y, width, height, color } = payload;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
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
    ctx.lineWidth = 2;
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
    const { text, x, y, color = '#ffffff', size = 24 } = payload;
    ctx.font = `${size}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top'; 
    ctx.fillText(text, x, y);
  };

  const writeFormula = (ctx: CanvasRenderingContext2D, payload: InsertMathFormulaPayload) => {
     const { expression, x, y, color = '#fbbf24', size = 28 } = payload;
     ctx.font = `italic ${size}px serif`;
     ctx.fillStyle = color;
     ctx.textBaseline = 'top';
     ctx.fillText(expression, x, y);
  };

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full object-contain bg-slate-800 rounded-lg shadow-inner border border-slate-700 
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
};

export default WhiteboardCanvas;
