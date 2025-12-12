import { FunctionDeclaration, Type } from "@google/genai";
import { StudentProfile } from "./types";

export const MODEL_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';
export const MODEL_THINKING = 'gemini-3-pro-preview';

// 1920x1080 HD Resolution
export const getSystemInstruction = (profile: StudentProfile, boardWidth: number = 1920, boardHeight: number = 1080) => `
You are **Dew**, a patient, visual, and intelligent AI companion designed for "Liquid Clarity."
User: **${profile.name}** (${profile.level}, Interest: ${profile.interests}).

**YOUR PERSONA:**
1.  **CALM & FLUID:** You speak concisely but with warmth. You never lecture; you guide.
2.  **VISUAL FIRST:** You use **The Canvas** constantly. If you explain it, you DRAW it.
3.  **ADAPTIVE:** You sense confusion and simplify instantly.

**THE CANVAS PROTOCOL (CRITICAL):**
*   **IDs are Key:** Every object you create returns an ID. You MUST use these IDs to connect items or place them relative to each other.
*   **Tree/Graph Structures:** 
    *   Start with a central node: \`position="center"\`.
    *   Add branches using \`position="below-left"\` and \`position="below-right"\` relative to the parent ID.
    *   ALWAYS connect them explicitly using \`connect_elements\`.
*   **Groups:** Use \`create_group\` to make clusters. Add text/shapes into groups using \`group_id\`.

**HOW TO USE TOOLS:**
*   **write_text:** Use roles like 'title', 'heading'. Returns \`element_id\`.
*   **connect_elements:** Draw arrows between IDs. Essential for flowcharts/graphs.
    *   Ex: \`connect_elements(source_id="el_1", target_id="el_2", label="causes")\`
*   **create_group:** Creates a named zone. Returns \`group_id\`.
    *   Then: \`write_text(..., group_id="group_1")\` to put items inside it.

**FLOW MANAGEMENT:**
1.  **Start:** Title at top.
2.  **Concept Map:** Create central concept node (\`center\`).
3.  **Branch Out:** Add related nodes (\`below-left\`, \`below-right\`) and connect them.
4.  **Group:** If listing examples, create a group first.

**TOOLS:**
*   **laser_pointer:** Point at things you are discussing.
*   **toggle_grid:** Only for math graphs.
`;

export const TOOLS_DECLARATION: FunctionDeclaration[] = [
  {
    name: "write_text",
    description: "Writes text on the Canvas. Returns element_id.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        role: { 
           type: Type.STRING, 
           enum: ["title", "heading", "body", "example", "note", "label"],
           description: "The semantic role of the text." 
        },
        position: { 
           type: Type.STRING, 
           enum: ["top-center", "center", "left", "right", "below", "right-of", "left-of", "below-left", "below-right"],
           description: "Placement strategy. Use 'below-left'/'below-right' for trees." 
        },
        relative_to_id: { type: Type.STRING, description: "ID of an existing element to position relative to." },
        group_id: { type: Type.STRING, description: "ID of the group to place this text inside." }
      },
      required: ["text", "role"],
    },
  },
  {
    name: "draw_shape",
    description: "Draws a shape. Returns element_id.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        shape: { type: Type.STRING, enum: ["rectangle", "circle"] },
        role: { type: Type.STRING, enum: ["container", "connector", "decoration"] },
        position: { type: Type.STRING },
        relative_to_id: { type: Type.STRING },
        group_id: { type: Type.STRING }
      },
      required: ["shape", "role"],
    },
  },
  {
    name: "create_group",
    description: "Creates a logical group/cluster area. Returns group_id.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        position: { type: Type.STRING, enum: ["center", "left", "right", "below"] }
      },
      required: ["title"],
    },
  },
  {
    name: "connect_elements",
    description: "Draws an arrow connecting two elements or groups.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        source_id: { type: Type.STRING },
        target_id: { type: Type.STRING },
        label: { type: Type.STRING, description: "Text to write on the connection line" }
      },
      required: ["source_id", "target_id"],
    },
  },
  {
    name: "inspect_board",
    description: "Returns a list of all elements, groups, and positions.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING }
      }
    },
  },
  {
    name: "create_new_board",
    description: "Clears the context and starts a fresh blank Canvas.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "laser_pointer",
    description: "Shows a temporary laser pointer.",
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
    name: "toggle_grid",
    description: "Turns background grid on/off.",
    parameters: {
      type: Type.OBJECT,
      properties: { visible: { type: Type.BOOLEAN } },
      required: ["visible"],
    }
  }
];