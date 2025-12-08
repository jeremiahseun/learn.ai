
import { FunctionDeclaration, Type } from "@google/genai";
import { StudentProfile } from "./types";

export const MODEL_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';
export const MODEL_THINKING = 'gemini-3-pro-preview';

export const getSystemInstruction = (profile: StudentProfile) => `
You are OmniTutor, an expert, friendly, and engaging AI teacher. 
You are teaching **${profile.name}**, who is a **${profile.level}** level learner interested in **${profile.interests}**.

**TEACHING LOOP (STRICT):**
1. **Listen:** Always wait for the student to respond before moving to the next step.
2. **Explain:** Introduce a concept simply.
3. **Visualize:** DRAW it on the whiteboard immediately.
4. **Check:** Ask ${profile.name} a question to check understanding.
5. **Wait:** Pause and wait for the student to answer or draw.

**CRITICAL INSTRUCTION - READ CAREFULLY:**
1. **INITIAL STATE:** When the session starts, briefly greet the user and confirm the topic, then **WAIT**. Do NOT start teaching or drawing until the user engages with you.
2. **USE PRIMITIVE SHAPES:** When drawing diagrams, ALWAYS use specific tools like 'draw_circle', 'draw_rectangle', 'draw_line', 'draw_arrow', and 'draw_polygon'.
3. **INTERLEAVE TOOLS AND SPEECH:** Call the drawing tools *while* you are speaking.
4. **STUDENT DRAWINGS:** Acknowledge and incorporate student drawings into the lesson.

**BEHAVIOR GUIDELINES:**
1. **Coordinate System:** The board is 1000x1000 units. (0,0) is top-left, (1000,1000) is bottom-right.
2. **Visual Style:** Use high contrast colors against a dark background (White, Cyan, Yellow, Bright Green).
3. **Space Management:** If the board gets cluttered, use the 'create_new_board' tool.

**AVAILABLE TOOLS:**
- 'draw_circle': Best for nodes, dots, circles.
- 'draw_rectangle': Best for boxes, containers.
- 'draw_line': Best for lines without arrows.
- 'draw_arrow': Best for directional connections, pointers, vectors.
- 'draw_polygon': Best for triangles, hexagons, custom shapes.
- 'highlight_area': Creates a semi-transparent colored box to emphasize content.
- 'draw_stroke': Use ONLY for freehand curves or irregular squiggles.
- 'write_text': Writes text on the board.
- 'write_formula': Writes a math formula (simple text representation).
- 'create_new_board': Saves current and gives you a fresh blank page.
- 'clear_board': Erases everything on the current board.
`;

export const TOOLS_DECLARATION: FunctionDeclaration[] = [
  {
    name: "draw_circle",
    description: "Draws a circle. PERFECT for Neural Network nodes, Venn diagrams, or geometry.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER, description: "Center X (0-1000)" },
        y: { type: Type.NUMBER, description: "Center Y (0-1000)" },
        radius: { type: Type.NUMBER, description: "Radius of the circle" },
        color: { type: Type.STRING, description: "Hex code (e.g., #FFFFFF, #00FFFF)" },
      },
      required: ["x", "y", "radius", "color"],
    },
  },
  {
    name: "draw_rectangle",
    description: "Draws a rectangle. PERFECT for boxes, flowchart steps, or layers.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER, description: "Top-left X (0-1000)" },
        y: { type: Type.NUMBER, description: "Top-left Y (0-1000)" },
        width: { type: Type.NUMBER, description: "Width" },
        height: { type: Type.NUMBER, description: "Height" },
        color: { type: Type.STRING, description: "Hex code" },
      },
      required: ["x", "y", "width", "height", "color"],
    },
  },
  {
    name: "draw_line",
    description: "Draws a straight line. For arrows, use 'draw_arrow'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        x1: { type: Type.NUMBER, description: "Start X" },
        y1: { type: Type.NUMBER, description: "Start Y" },
        x2: { type: Type.NUMBER, description: "End X" },
        y2: { type: Type.NUMBER, description: "End Y" },
        color: { type: Type.STRING, description: "Hex code" },
        width: { type: Type.NUMBER, description: "Line width (default 2)" },
      },
      required: ["x1", "y1", "x2", "y2", "color"],
    },
  },
  {
    name: "draw_arrow",
    description: "Draws a line with an arrow head at the end. Best for flowcharts, vectors, pointing.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        x1: { type: Type.NUMBER, description: "Start X" },
        y1: { type: Type.NUMBER, description: "Start Y" },
        x2: { type: Type.NUMBER, description: "End X (Tip of arrow)" },
        y2: { type: Type.NUMBER, description: "End Y (Tip of arrow)" },
        color: { type: Type.STRING, description: "Hex code" },
        width: { type: Type.NUMBER, description: "Line width (default 2)" },
      },
      required: ["x1", "y1", "x2", "y2", "color"],
    },
  },
  {
    name: "draw_polygon",
    description: "Draws a closed polygon. Good for triangles, hexagons, etc.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        points: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER, description: "X coord" },
              y: { type: Type.NUMBER, description: "Y coord" },
            },
            required: ["x", "y"],
          },
          description: "List of vertices",
        },
        color: { type: Type.STRING, description: "Border color" },
        fill: { type: Type.STRING, description: "Optional fill color (hex)" },
      },
      required: ["points", "color"],
    },
  },
  {
    name: "highlight_area",
    description: "Highlights a rectangular area with a semi-transparent color. Use this to focus attention on a part of the board.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER },
        y: { type: Type.NUMBER },
        width: { type: Type.NUMBER },
        height: { type: Type.NUMBER },
        color: { type: Type.STRING, description: "Highlight color (e.g. #FFFF00 for yellow)" },
      },
      required: ["x", "y", "width", "height", "color"],
    },
  },
  {
    name: "draw_stroke",
    description: "Draws a freehand line connecting points. Use ONLY for curves or irregular squiggles. Do NOT use for squares or circles.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        points: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER, description: "X coordinate (0-1000)" },
              y: { type: Type.NUMBER, description: "Y coordinate (0-1000)" },
            },
            required: ["x", "y"],
          },
          description: "List of points to connect",
        },
        color: {
          type: Type.STRING,
          description: "Hex code (e.g., #FFFFFF, #FF0000) or name",
        },
        width: {
          type: Type.NUMBER,
          description: "Line width (default 2)",
        }
      },
      required: ["points", "color"],
    },
  },
  {
    name: "write_text",
    description: "Writes text on the board. YOU MUST CALL THIS TO MAKE TEXT APPEAR.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        x: { type: Type.NUMBER, description: "X coordinate (0-1000)" },
        y: { type: Type.NUMBER, description: "Y coordinate (0-1000)" },
        color: { type: Type.STRING },
        size: { type: Type.NUMBER, description: "Font size in virtual units (default 24)" },
      },
      required: ["text", "x", "y"],
    },
  },
  {
    name: "write_formula",
    description: "Writes a math formula (simple text representation). Use for equations.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        expression: { type: Type.STRING, description: "The math expression" },
        x: { type: Type.NUMBER },
        y: { type: Type.NUMBER },
        color: { type: Type.STRING },
        size: { type: Type.NUMBER },
      },
      required: ["expression", "x", "y"],
    },
  },
  {
    name: "create_new_board",
    description: "Saves the current board and creates a fresh, empty whiteboard page.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "clear_board",
    description: "Erases everything on the current board.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  }
];
