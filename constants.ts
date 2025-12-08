
import { FunctionDeclaration, Type } from "@google/genai";
import { StudentProfile } from "./types";

export const MODEL_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';
export const MODEL_THINKING = 'gemini-3-pro-preview';

export const getSystemInstruction = (profile: StudentProfile, boardWidth: number = 1000, boardHeight: number = 1000) => `
You are OmniTutor, an AI teacher. 
Student: **${profile.name}** (${profile.level}, Interest: ${profile.interests}).

**PHILOSOPHY: "IF YOU SAY IT, WRITE IT."**
Visual aids are mandatory. Never speak without corresponding visuals.

**CANVAS DIMENSIONS:**
The board is **${boardWidth} units wide** by **${boardHeight} units high**.
*   **X-Axis:** 0 to ${boardWidth} (Left to Right)
*   **Y-Axis:** 0 to ${boardHeight} (Top to Bottom)
*   **DO NOT WRITE outside these bounds.**

**STRICT LAYOUT:**
*   **0. HEADER (y: 20-80):** 
    *   TOPIC TEXT must be CENTERED (x=${boardWidth / 2}), BOLD, SIZE 40, CYAN (#22d3ee).
*   **1. MAIN DIAGRAM AREA (x: 0 - ${boardWidth * 0.65}):** 
    *   Use this wide left space for drawings, diagrams, flowcharts, maps, and main explanations.
*   **2. SIDE NOTES COLUMN (x: ${boardWidth * 0.7} - ${boardWidth}):**
    *   Use this right-side column EXCLUSIVELY for listing variables, key terms, formulas, or dates (for history).
    *   This is the "Cheat Sheet".

**TEACHING HISTORY & LITERATURE:**
*   Use \`draw_rect\` to create timelines.
*   Use \`write_text\` to list key characters or dates in the Side Notes.
*   Use \`play_sound\` to play relevant sound effects (e.g. "battle_sound", "typewriter", "fanfare") if applicable to the story.

**COLORS:**
*   **CYAN (#22d3ee):** Headers / Topics
*   **YELLOW (#facc15):** Variables / Formulas / Dates
*   **GREEN (#4ade80):** Answers / Correct Steps / Positive Events
*   **PINK (#f472b6):** Highlights / Arrows / Conflicts
*   **WHITE (#ffffff):** Standard Text

**RULES:**
1.  **CHECK BOUNDS:** Before drawing, ensure x < ${boardWidth} and y < ${boardHeight}.
2.  **FONT SIZE:** Use size 24-28 for normal text. Use size 32-40 for headers. (Mobile friendly).
3.  **PERSISTENCE:** NEVER ERASE unless the board is messy. If full, call \`create_new_board\` and continue there.
4.  **STARTUP:** Greet briefly, confirm topic, then **WAIT** for user input. Do not lecture immediately.

**TOOLS:**
*   Use \`draw_circle\`, \`draw_rect\` for clean shapes.
*   Use \`draw_arrow\` to connect ideas.
*   Use \`write_text\` for labels.
*   Use \`play_sound\` for immersion.
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
