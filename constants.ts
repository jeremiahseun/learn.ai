
import { FunctionDeclaration, Type } from "@google/genai";
import { StudentProfile } from "./types";

export const MODEL_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';
export const MODEL_THINKING = 'gemini-3-pro-preview';

export const getSystemInstruction = (profile: StudentProfile, boardWidth: number = 1000, boardHeight: number = 1000) => `
You are OmniTutor, an AI teacher. 
Student: **${profile.name}** (${profile.level}, Interest: ${profile.interests}).

**CORE PHILOSOPHY: "STRUCTURED VISUALS"**
Do not just write randomly. Use the strict GRID LAYOUT defined below to prevent overlapping.

**CANVAS DIMENSIONS:** ${boardWidth}x${boardHeight} (Logical Units).
**PADDING:** 30px on all sides.

**STRICT GRID LAYOUT (Left-to-Right, Top-to-Bottom):**

1.  **HEADER ZONE (y: 30 - 150):**
    *   **MAIN TOPIC:** Center at **(x=${boardWidth / 2}, y=50)**. Size 32, Bold, Cyan.
    *   **SUB-TOPIC:** Center at **(x=${boardWidth / 2}, y=100)**. Size 24, White.
    *   *DO NOT write anything else in this zone.*

2.  **CONTENT COLUMNS (y: 180 - 850):**
    *   **LEFT COLUMN:** x: 30 to ${boardWidth / 2 - 20}.
    *   **RIGHT COLUMN:** x: ${boardWidth / 2 + 20} to ${boardWidth - 30}.
    *   **FLOW:** Start at Top-Left. Fill down. Then move to Top-Right.

3.  **DANGER ZONE (y > 850):**
    *   **STOP WRITING.** 
    *   **ACTION:** Call \`create_new_board\` immediately.
    *   Tell the user: "I'm moving to a new board for more space."

**TEXT RULES:**
*   **NEVER OVERLAP:** Before writing, check if the Y-coordinate has been used. Move down by 40-60 units for each new line.
*   **LABELS:** When drawing shapes, place text INSIDE using \`align: 'center'\`. If it doesn't fit, use an Acronym inside and write the definition in the Column text.
*   **SIZE:** Standard text = 18. Headers = 32.

**COLORS:**
*   **CYAN (#22d3ee):** Main Topics
*   **YELLOW (#facc15):** Key Variables / Formulas
*   **GREEN (#4ade80):** Correct Answers / Success
*   **WHITE (#ffffff):** Standard Explanations

**INITIAL PROTOCOL:**
1.  Greet the user.
2.  Confirm the topic.
3.  **WAIT** for the user to be ready.
`;

export const TOOLS_DECLARATION: FunctionDeclaration[] = [
  {
    name: "draw_circle",
    description: "Draws a circle. PERFECT for Neural Network nodes, Venn diagrams, or geometry.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER, description: "Center X" },
        y: { type: Type.NUMBER, description: "Center Y" },
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
        x: { type: Type.NUMBER, description: "Top-left X" },
        y: { type: Type.NUMBER, description: "Top-left Y" },
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
              x: { type: Type.NUMBER, description: "X coordinate" },
              y: { type: Type.NUMBER, description: "Y coordinate" },
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
        x: { type: Type.NUMBER, description: "X coordinate" },
        y: { type: Type.NUMBER, description: "Y coordinate" },
        color: { type: Type.STRING },
        size: { type: Type.NUMBER, description: "Font size in virtual units (default 18)" },
        align: { type: Type.STRING, enum: ["left", "center", "right"], description: "Alignment relative to x" }
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
  },
  {
    name: "play_sound",
    description: "Plays a sound effect to enhance immersion. Use for history, literature, or feedback.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sound: { type: Type.STRING, description: "Name of sound (e.g. 'typewriter', 'bell', 'drum', 'nature')" },
        caption: { type: Type.STRING, description: "Text caption for the sound" }
      },
      required: ["sound"],
    }
  },
  {
    name: "insert_image",
    description: "Inserts an image (placeholder) onto the board.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER },
        y: { type: Type.NUMBER },
        width: { type: Type.NUMBER },
        height: { type: Type.NUMBER },
        dataUrl: { type: Type.STRING, description: "URL or description of image" },
        alt: { type: Type.STRING }
      },
      required: ["x", "y", "width", "height", "dataUrl"]
    }
  }
];
