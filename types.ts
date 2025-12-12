
export interface Point {
  x: number;
  y: number;
}

export type Subject = 'math' | 'science' | 'history' | 'literature' | 'general';
export type GridType = 'lines' | 'dots' | 'cross' | 'none';

export interface SubjectTheme {
  name: Subject;
  background: string;
  gridType: GridType;
  gridColor: string;
  primaryColor: string; // For titles/emphasis
  secondaryColor: string; // For body text
  accentColor: string; // For highlights/graphs
  fontFamily: string;
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
  maxWidth?: number;
  fontStyle?: 'normal' | 'italic' | 'bold';
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
  fill?: string; // Added fill support
}

export interface DrawLinePayload {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width?: number;
  dashed?: boolean; // Added dash support
}

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
  label?: string;
}

export interface InsertImagePayload {
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  alt?: string;
}

export interface PlaySoundPayload {
  sound: string;
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
  color: string;
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
  pathData: string;
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

export interface LaserPointerPayload {
  x: number;
  y: number;
}

export interface BoardData {
  id: string;
  commands: BoardCommand[];
  thumbnail?: string;
  lastSaved?: number;
  gridActive?: boolean;
  subject?: Subject; // New: Persist subject per board
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
  pdfContext?: string;
}

// --- Board Brain Semantic Types ---

export type LayoutMode = 'standard' | 'split-view' | 'mind-map' | 'timeline';

export type SemanticRole = 
  | 'title' 
  | 'heading' 
  | 'subheading'
  | 'body' 
  | 'bullet'
  | 'equation'
  | 'example' 
  | 'note' 
  | 'container' 
  | 'connector' 
  | 'label' 
  | 'group-title'
  | 'tree-node'; // New role

export type BoardZone = 'header' | 'main' | 'sidebar' | 'footer' | 'floating';

export type SemanticPosition = 
  | 'auto'
  | 'new-column'
  | 'aside'
  | 'below'
  | 'indent';

export interface BrainElement {
  id: string;
  role: SemanticRole;
  bbox: { x: number, y: number, w: number, h: number };
  zone: BoardZone;
  refId?: string;
  groupId?: string;
  text?: string;
}

export interface BrainGroup {
  id: string;
  title: string;
  bbox: { x: number, y: number, w: number, h: number };
}

// Complex Data Structures for advanced tools
export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

export interface TimelineEvent {
  year: string | number;
  label: string;
  detail?: string;
}
