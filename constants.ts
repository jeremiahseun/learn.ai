
import { FunctionDeclaration, Type } from "@google/genai";
import { StudentProfile } from "./types";

export const MODEL_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';
export const MODEL_THINKING = 'gemini-3-pro-preview';

// 1920x1080 HD Resolution
export const getSystemInstruction = (profile: StudentProfile, boardWidth: number = 1920, boardHeight: number = 1080) => `
You are **Dew**, a world-class visual educator. You are conducting a private tutoring session on a digital whiteboard.
User: **${profile.name}** (${profile.level}, Interest: ${profile.interests}).

**YOUR PRIME DIRECTIVE: INTELLIGENT STRUCTURAL LAYOUT**
You are not just writing text; you are architecting a visual explanation.
1.  **DETECT SUBJECT:** Start by calling \`set_subject(subject=...)\` to theme the board. (Math=Grid, History=Sepia, etc.)
2.  **USE LAYOUT ENGINES:**
    *   **Hierarchies:** If explaining a taxonomy, family tree, or code structure, use \`draw_tree\`.
    *   **Sequences:** If explaining history or a process over time, use \`draw_timeline\`.
    *   **Math:** If explaining functions, use \`plot_functions\` with multiple equations to show relationships.
3.  **CONTINUITY & CONTEXT:**
    *   **Always** store the \`element_id\` returned by tools.
    *   **If the user asks to "expand on that" or "add to this",** YOU MUST use the \`relative_to_id\` parameter in \`write_text\` or \`draw_shape\`, passing the ID of the previous element. This ensures the board flows logically.
    *   **Do not create a new board** unless the user explicitly asks to change the topic completely.

**ZONES:**
*   **Main:** Core definitions, step-by-step logic.
*   **Aside:** Supporting diagrams, graphs, examples.

**TOOL PROTOCOLS:**

*   **Subject Setup:**
    *   Call \`set_subject("math")\` for physics/calc.
    *   Call \`set_subject("history")\` for humanities.

*   **Tree Structures:**
    *   "Let's look at the animal kingdom."
    *   Call \`draw_tree(root={label: "Animals", children: [{label: "Mammals"}, {label: "Reptiles"}]})\`

*   **Timelines:**
    *   "The timeline of the war was..."
    *   Call \`draw_timeline(events=[{year: 1939, label: "Start"}, {year: 1945, label: "End"}])\`

*   **Math:**
    *   "The derivative of sine is cosine."
    *   Call \`write_text("d/dx sin(x) = cos(x)", role="equation")\`
    *   Call \`plot_functions(title="Derivatives", equations=["sin(x)", "cos(x)"])\`

**STRICT RULE:** ALWAYS return \`element_id\` to reference later.
`;

export const TOOLS_DECLARATION: FunctionDeclaration[] = [
  {
    name: "set_subject",
    description: "Sets the visual theme of the board.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING, enum: ["math", "science", "history", "literature", "general"] }
      },
      required: ["subject"]
    }
  },
  {
    name: "write_text",
    description: "Writes text on the board. Returns element_id.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        role: { 
           type: Type.STRING, 
           enum: ["title", "heading", "subheading", "body", "bullet", "equation", "example", "note", "label"],
           description: "Semantic role defines style and layout behavior." 
        },
        position: { 
           type: Type.STRING, 
           enum: ["auto", "aside", "below", "indent", "new-column"],
           description: "Placement strategy." 
        },
        relative_to_id: { type: Type.STRING, description: "ID of the element this text relates to or should be placed under." },
        group_id: { type: Type.STRING }
      },
      required: ["text", "role"],
    },
  },
  {
    name: "draw_shape",
    description: "Draws a geometric shape or container. Returns element_id.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        shape: { type: Type.STRING, enum: ["rectangle", "circle", "arrow", "line"] },
        position: { type: Type.STRING, enum: ["auto", "aside"] },
        label: { type: Type.STRING },
        relative_to_id: { type: Type.STRING }
      },
      required: ["shape"],
    },
  },
  {
    name: "draw_tree",
    description: "Draws a hierarchical tree structure. Returns tree_id.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        root: { 
          type: Type.OBJECT,
          description: "Recursive tree node structure {label: string, children: []}",
          properties: {
             label: { type: Type.STRING },
             children: { 
                type: Type.ARRAY, 
                items: { type: Type.OBJECT, description: "Nested TreeNode" } 
             }
          },
          required: ["label"]
        },
        position: { type: Type.STRING, enum: ["auto", "aside"] }
      },
      required: ["root"],
    },
  },
  {
    name: "draw_timeline",
    description: "Draws a linear timeline of events. Returns timeline_id.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        events: {
           type: Type.ARRAY,
           items: {
              type: Type.OBJECT,
              properties: {
                 year: { type: Type.STRING },
                 label: { type: Type.STRING }
              }
           }
        }
      },
      required: ["events"]
    }
  },
  {
    name: "plot_functions",
    description: "Plots multiple mathematical functions on a graph. Returns graph_id.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        equations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of JS math equations (e.g. ['sin(x)', 'cos(x)'])." },
        position: { type: Type.STRING, enum: ["auto", "aside"] },
        relative_to_id: { type: Type.STRING }
      },
      required: ["title", "equations"],
    },
  },
  {
    name: "create_group",
    description: "Creates a visual container. Returns group_id.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        position: { type: Type.STRING, enum: ["auto", "aside"] }
      },
      required: ["title"],
    },
  },
  {
    name: "connect_elements",
    description: "Draws an arrow connecting two elements.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        source_id: { type: Type.STRING },
        target_id: { type: Type.STRING },
        label: { type: Type.STRING }
      },
      required: ["source_id", "target_id"],
    },
  },
  {
    name: "create_new_board",
    description: "Clears board and starts fresh.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "laser_pointer",
    description: "Points to a coordinate [x,y].",
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
