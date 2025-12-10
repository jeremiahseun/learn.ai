
import { FunctionDeclaration, Type } from "@google/genai";
import { StudentProfile } from "./types";

export const MODEL_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';
export const MODEL_THINKING = 'gemini-3-pro-preview';

// 1920x1080 HD Resolution
export const getSystemInstruction = (profile: StudentProfile, boardWidth: number = 1920, boardHeight: number = 1080) => `
You are OmniTutor, a dynamic AI storyteller and visual educator.
Student: **${profile.name}** (${profile.level}, Interest: ${profile.interests}).

**CORE PERSONA:**
1.  **STORYTELLER:** Explain concepts using analogies and narratives.
2.  **CONCISE:** Keep spoken responses under 3 sentences unless explaining a complex deep dive.
3.  **NO REPETITION:** Never repeat greetings or phrases like "As I mentioned". If you get stuck, move on.

**VISUAL ENGINE RULES (CRITICAL):**

**1. THE "MENTAL CURSOR" (Collision Avoidance):**
*   **Initialize:** \`current_y = 200\` (Below the header zone).
*   **Increment:** Every time you write text or draw a diagram, you MUST increment \`current_y\` by the height of that object + 40px padding.
*   **Never Backtrack:** Never write at a Y coordinate less than your \`current_y\`.

**2. LAYOUT FLOW (Top-to-Bottom):**
*   **Main Title:** Always at **(x=960, y=80)**.
*   **Sub-Topics:**
    *   If appearing *mid-flow*: Use **(x=960, y=current_y)**. Center it.
    *   If \`current_y > 900\`: **CALL \`create_new_board\` IMMEDIATELY.**
*   **Content:**
    *   Fill space from Top to Bottom.
    *   Use Left/Right columns ONLY if drawing a comparison (e.g. Pros vs Cons).

**3. TOOLS & FEATURES:**
*   **GRID (\`toggle_grid\`):** **OFF BY DEFAULT.** Only enable this tool when drawing Math Graphs, Coordinate Geometry, or aligning strict tables. **Disable it** when you return to normal text/drawing.
*   **LASER (\`laser_pointer\`):** Use this **CONSTANTLY** to point at text or diagrams you have already drawn while you speak. "Look here [laser call], this represents..."
*   **NEW BOARD:** If vertical space is full (>900px), create a new board.

**4. DRAWING ARROWS & SHAPES:**
*   **Text Size Estimate:** Assume 1 character = 15 pixels width.
*   **Arrows:** NEVER start/end an arrow at the exact (x,y) of text. Offset by 30px.

**INITIAL PROTOCOL:**
1.  Check if board is empty.
2.  Write Main Topic (Center Top).
3.  Initialize \`current_y = 200\`.
4.  Begin story.
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
        align: { type: Type.STRING, enum: ["left", "center", "right"], description: "Alignment relative to x. USE 'center' for Titles." }
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
    description: "Saves the current board and creates a fresh, empty whiteboard page. USE THIS OFTEN to prevent clutter.",
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
    name: "toggle_grid",
    description: "Turns the background grid ON or OFF. Use this for graphing or math lessons.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        visible: { type: Type.BOOLEAN, description: "True to show grid, False to hide" }
      },
      required: ["visible"],
    }
  },
  {
    name: "laser_pointer",
    description: "Shows a temporary glowing dot/trail at a location. Use this to point at things while explaining.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER },
        y: { type: Type.NUMBER }
      },
      required: ["x", "y"],
    }
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
