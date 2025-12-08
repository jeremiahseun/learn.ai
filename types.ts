
export interface Point {
  x: number;
  y: number;
}

export interface DrawStrokePayload {
  points: Point[];
  color: string;
  width?: number;
}

export interface WriteTextPayload {
  text: string;
  x: number;
  y: number;
  color?: string;
  size?: number;
  align?: 'left' | 'center' | 'right';
}

export interface DrawCirclePayload {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface DrawRectPayload {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface DrawLinePayload {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width?: number;
}

// --- New Types ---

export interface ErasePayload {
  targetId: string;
}

export interface EraseAreaPayload {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawArrowPayload {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width?: number;
}

export interface InsertImagePayload {
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string; // or url
  alt?: string;
}

export interface PlaySoundPayload {
  sound: string; // 'bell', 'correct', 'history_quote', etc.
  caption?: string;
}

export interface MoveElementPayload {
  targetIds: string[];
  dx: number;
  dy: number;
}

export interface ResizeElementPayload {
  targetId: string;
  width: number;
  height: number;
}

export interface GroupElementsPayload {
  targetIds: string[];
  groupId: string;
}

export interface UngroupElementsPayload {
  groupId: string;
}

export interface HighlightPayload {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // Should be rendered with transparency
}

export interface FreehandPayload {
  points: Point[];
  color: string;
  width: number;
}

export interface DrawPolygonPayload {
  points: Point[];
  color: string;
  fill?: string;
}

export interface DrawPathPayload {
  pathData: string; // SVG path string
  color: string;
  width?: number;
}

export interface GridTogglePayload {
  visible: boolean;
  size?: number;
}

export interface ZoomPayload {
  scale: number;
  centerX?: number;
  centerY?: number;
}

export interface PanPayload {
  offsetX: number;
  offsetY: number;
}

export interface SelectElementPayload {
  targetIds: string[];
}

export interface DeleteElementPayload {
  targetIds: string[];
}

export interface CommentPayload {
  x: number;
  y: number;
  text: string;
  author?: string;
}

export interface InsertMathFormulaPayload {
  x: number;
  y: number;
  expression: string; // LaTeX
  size?: number;
  color?: string;
}

export interface InsertAudioPayload {
  x: number;
  y: number;
  audioUrl: string;
}

export interface BoardData {
  id: string;
  commands: BoardCommand[];
  thumbnail?: string; // Data URL
  lastSaved?: number; // Timestamp
}

export type BoardCommand = 
  | { type: 'stroke'; payload: DrawStrokePayload }
  | { type: 'text'; payload: WriteTextPayload }
  | { type: 'circle'; payload: DrawCirclePayload }
  | { type: 'rect'; payload: DrawRectPayload }
  | { type: 'line'; payload: DrawLinePayload }
  | { type: 'erase'; payload: ErasePayload }
  | { type: 'erase-area'; payload: EraseAreaPayload }
  | { type: 'arrow'; payload: DrawArrowPayload }
  | { type: 'image'; payload: InsertImagePayload }
  | { type: 'move'; payload: MoveElementPayload }
  | { type: 'resize'; payload: ResizeElementPayload }
  | { type: 'group'; payload: GroupElementsPayload }
  | { type: 'ungroup'; payload: UngroupElementsPayload }
  | { type: 'highlight'; payload: HighlightPayload }
  | { type: 'freehand'; payload: FreehandPayload }
  | { type: 'polygon'; payload: DrawPolygonPayload }
  | { type: 'path'; payload: DrawPathPayload }
  | { type: 'grid-toggle'; payload: GridTogglePayload }
  | { type: 'zoom'; payload: ZoomPayload }
  | { type: 'pan'; payload: PanPayload }
  | { type: 'select'; payload: SelectElementPayload }
  | { type: 'delete'; payload: DeleteElementPayload }
  | { type: 'comment'; payload: CommentPayload }
  | { type: 'formula'; payload: InsertMathFormulaPayload }
  | { type: 'audio'; payload: InsertAudioPayload }
  | { type: 'play_sound'; payload: PlaySoundPayload }
  | { type: 'clear' };

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface DeepThinkResult {
  question: string;
  answer: string;
  thoughtProcess?: string;
}

export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';

export interface StudentProfile {
  id: string;
  name: string;
  level: LearningLevel;
  interests: string;
  createdAt: number;
}

export type UserTool = 'pointer' | 'pen' | 'eraser';

export interface Session {
  id: string;
  title: string;
  boards: BoardData[];
  lastAccessed: number;
  createdAt: number;
  topic?: string;
  pdfContext?: string; // Base64 of PDF, ephemeral (not saved to localStorage if too big)
}
