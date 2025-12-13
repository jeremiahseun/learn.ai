/**
 * Semantic Command Interpreter for Whiteboard System
 *
 * This module handles parsing and executing semantic commands from the AI,
 * providing a clean interface between Gemini's pedagogical intelligence
 * and the whiteboard's visual intelligence.
 */

import { LayoutManager } from './LayoutManager';
import { BoardContext } from './BoardContext';
import { IncrementalRenderer } from './IncrementalRenderer';
import { BoardBrain } from '../../services/BoardBrain';
import { BoardCommand, SemanticPosition, TreeNode, TimelineEvent, SemanticRole } from '../../types';

export interface SemanticCommand {
  action: 'write_text' | 'draw_shape' | 'draw_arrow' | 'create_diagram' | 'highlight' | 'erase' | 'modify' | 'clear_region';
  content?: string;
  style?: StyleOptions;
  position?: PositionConstraint;
  reference?: string;
  from?: string;
  to?: string;
  label?: string;
  id?: string;
}

export interface StyleOptions {
  size?: 'small' | 'medium' | 'large' | 'title';
  color?: string;
  emphasis?: 'normal' | 'bold' | 'underline' | 'box';
  border?: {
    style?: 'solid' | 'dashed' | 'dotted';
    width?: number;
    color?: string;
  };
  background?: string;
  font?: string;
}

export interface PositionConstraint {
  region?: 'auto' | 'center' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'below_previous';
  relativeTo?: string;
  alignWith?: string;
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
}

export interface ExecutionResult {
  success: boolean;
  elementId?: string;
  error?: string;
  position?: { x: number; y: number };
}

export type ActionHandler = (command: SemanticCommand, context: {
  layoutManager: LayoutManager;
  boardContext: BoardContext;
  renderer: IncrementalRenderer;
}) => Promise<ExecutionResult>;

export class CommandInterpreter {
  private actionRegistry: Map<string, ActionHandler>;
  private commandQueue: SemanticCommand[];
  private isProcessing: boolean;
  private boardBrain: BoardBrain;

  constructor(
    private layoutManager: LayoutManager,
    private boardContext: BoardContext,
    private renderer: IncrementalRenderer,
    boardBrain: BoardBrain
  ) {
    this.actionRegistry = new Map();
    this.commandQueue = [];
    this.isProcessing = false;
    this.boardBrain = boardBrain;
    this.registerDefaultActions();
  }

  /**
   * Register a new action handler for a specific command type
   */
  registerAction(actionType: string, handler: ActionHandler): void {
    if (this.actionRegistry.has(actionType)) {
      console.warn(`Action handler for '${actionType}' already exists. Overwriting.`);
    }
    this.actionRegistry.set(actionType, handler);
  }

  /**
   * Parse raw command data into a typed SemanticCommand
   */
  parseCommand(rawCommand: any): SemanticCommand {
    // Basic validation
    if (!rawCommand || typeof rawCommand !== 'object') {
      throw new Error('Invalid command format: expected object');
    }

    if (!rawCommand.action) {
      throw new Error('Command missing required field: action');
    }

    // Create typed command
    const command: SemanticCommand = {
      action: rawCommand.action,
      content: rawCommand.content,
      style: rawCommand.style,
      position: rawCommand.position,
      reference: rawCommand.reference,
      from: rawCommand.from,
      to: rawCommand.to,
      label: rawCommand.label,
      id: rawCommand.id || this.generateCommandId()
    };

    return command;
  }

  /**
   * Validate command structure and required fields
   */
  validateCommand(command: SemanticCommand): boolean {
    // Check if action type is supported
    const supportedActions = [
      'write_text', 'draw_shape', 'draw_arrow', 'create_diagram',
      'highlight', 'erase', 'modify', 'clear_region'
    ];

    if (!supportedActions.includes(command.action)) {
      throw new Error(`Unsupported action type: ${command.action}`);
    }

    // Action-specific validation
    switch (command.action) {
      case 'write_text':
        if (!command.content) {
          throw new Error('write_text requires content field');
        }
        break;

      case 'draw_arrow':
        if (!command.from || !command.to) {
          throw new Error('draw_arrow requires from and to fields');
        }
        break;

      case 'modify':
      case 'erase':
      case 'highlight':
        if (!command.reference) {
          throw new Error(`${command.action} requires reference field`);
        }
        break;

      case 'clear_region':
        if (!command.position?.region) {
          throw new Error('clear_region requires position.region field');
        }
        break;
    }

    return true;
  }

  /**
   * Execute a single command
   */
  async executeCommand(command: SemanticCommand): Promise<ExecutionResult> {
    try {
      // Validate command
      this.validateCommand(command);

      // Get handler for this action type
      const handler = this.actionRegistry.get(command.action);
      if (!handler) {
        throw new Error(`No handler registered for action: ${command.action}`);
      }

      // Execute handler
      const result = await handler(command, {
        layoutManager: this.layoutManager,
        boardContext: this.boardContext,
        renderer: this.renderer
      });

      return result;

    } catch (error) {
      console.error('Command execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Queue a command for later execution
   */
  queueCommand(command: SemanticCommand): void {
    this.commandQueue.push(command);
    this.processQueue();
  }

  /**
   * Process the command queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.commandQueue.length > 0) {
      const command = this.commandQueue.shift();
      if (command) {
        try {
          await this.executeCommand(command);
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Clear the command queue
   */
  clearQueue(): void {
    this.commandQueue = [];
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.commandQueue.length;
  }

  /**
   * Register all default action handlers
   */
  private registerDefaultActions(): void {
    this.registerAction('write_text', this.handleWriteText.bind(this));
    this.registerAction('draw_shape', this.handleDrawShape.bind(this));
    this.registerAction('draw_arrow', this.handleDrawArrow.bind(this));
    this.registerAction('create_diagram', this.handleCreateDiagram.bind(this));
    this.registerAction('highlight', this.handleHighlight.bind(this));
    this.registerAction('erase', this.handleErase.bind(this));
    this.registerAction('modify', this.handleModify.bind(this));
    this.registerAction('clear_region', this.handleClearRegion.bind(this));
  }

  /**
   * Generate unique command ID
   */
  private generateCommandId(): string {
    return 'cmd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  }

  // Default Action Handlers

  private async handleWriteText(command: SemanticCommand, context: {
    layoutManager: LayoutManager;
    boardContext: BoardContext;
    renderer: IncrementalRenderer;
  }): Promise<ExecutionResult> {
    try {
      // Determine semantic role from command
      const role: SemanticRole = this.getSemanticRoleFromCommand(command);
      const positionStr: SemanticPosition = command.position?.region === 'auto' ? 'auto' : 'auto';

      // Use BoardBrain for intelligent layout
      const { command: boardCommand, id: elementId } = this.boardBrain.writeText(
        command.content || '',
        role,
        positionStr,
        command.reference,
        command.label
      );

      // Execute the command through renderer
      await this.executeBoardCommand(boardCommand, context.renderer);

      // Register in board context
      context.boardContext.registerElement({
        type: 'text',
        content: command.content || '',
        position: { x: 0, y: 0 }, // Position is handled by BoardBrain
        style: command.style,
        semanticDescription: command.content
      }, command.content, elementId);

      return {
        success: true,
        elementId
      };

    } catch (error) {
      console.error('Write text failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async handleDrawArrow(command: SemanticCommand, context: {
    layoutManager: LayoutManager;
    boardContext: BoardContext;
    renderer: IncrementalRenderer;
  }): Promise<ExecutionResult> {
    try {
      // Use BoardBrain to connect elements
      const result = this.boardBrain.connectElements(command.from || '', command.to || '', command.label);

      if (!result) {
        throw new Error(`Cannot resolve arrow references: from=${command.from}, to=${command.to}`);
      }

      // Execute the arrow command
      await this.executeBoardCommand(result.command, context.renderer);

      // Draw label if provided
      if (command.label && result.labelCommand) {
        await this.executeBoardCommand(result.labelCommand, context.renderer);
      }

      // Register arrow element
      const elementId = context.boardContext.registerElement({
        type: 'arrow',
        from: command.from,
        to: command.to,
        label: command.label,
        style: command.style,
        position: { x: 0, y: 0 } // Temporary position
      }, `arrow from ${command.from} to ${command.to}`);

      return {
        success: true,
        elementId
      };

    } catch (error) {
      console.error('Draw arrow failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Additional default handlers would be implemented here...


  /**
   * Execute a BoardCommand through the renderer
   */
  private async executeBoardCommand(command: BoardCommand, renderer: IncrementalRenderer): Promise<void> {
    switch (command.type) {
      case 'text':
        await renderer.writeText(
          command.payload.text,
          { x: command.payload.x, y: command.payload.y },
          {
            size: command.payload.size + 'px',
            color: command.payload.color,
            emphasis: command.payload.fontStyle === 'bold' ? 'bold' : 'normal'
          }
        );
        break;
      case 'rect':
        // For now, we'll simulate rectangle drawing
        // In a full implementation, this would use the renderer's shape drawing capabilities
        console.log('Drawing rectangle:', command.payload);
        break;
      case 'circle':
        console.log('Drawing circle:', command.payload);
        break;
      case 'arrow':
        await renderer.drawArrow(
          { x: command.payload.x1, y: command.payload.y1 },
          { x: command.payload.x2, y: command.payload.y2 },
          { color: command.payload.color }
        );
        break;
      case 'line':
        // Simulate line drawing
        console.log('Drawing line:', command.payload);
        break;
      case 'stroke':
        // Simulate stroke drawing
        console.log('Drawing stroke:', command.payload);
        break;
      case 'formula':
        // Handle mathematical formulas
        console.log('Rendering formula:', command.payload);
        break;
      default:
        console.warn('Unsupported command type:', (command as any).type);
    }
  }

  /**
   * Determine semantic role from command
   */
  private getSemanticRoleFromCommand(command: SemanticCommand): SemanticRole {
    // Default to body text
    if (!command.style) return 'body';

    // Map style to semantic role
    if (command.style.size === 'title') return 'title';
    if (command.style.size === 'large') return 'heading';
    if (command.style.size === 'medium') return 'subheading';
    if (command.style.emphasis === 'box') return 'equation';
    if (command.style.border) return 'example';

    return 'body';
  }

  /**
   * Handle draw shape command
   */
  private async handleDrawShape(command: SemanticCommand): Promise<ExecutionResult> {
    try {
      // Determine shape type from command content or style
      const shapeType = this.getShapeTypeFromCommand(command);

      const { command: boardCommand, id: elementId } = this.boardBrain.drawShape(
        shapeType,
        'auto',
        command.label,
        command.reference
      );

      await this.executeBoardCommand(boardCommand, this.renderer);

      return {
        success: true,
        elementId
      };
    } catch (error) {
      console.error('Draw shape failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Determine shape type from command
   */
  private getShapeTypeFromCommand(command: SemanticCommand): 'rectangle' | 'circle' | 'arrow' | 'line' {
    // Check if command specifies shape in content
    if (command.content) {
      if (command.content.includes('rectangle') || command.content.includes('box')) return 'rectangle';
      if (command.content.includes('circle') || command.content.includes('round')) return 'circle';
      if (command.content.includes('arrow')) return 'arrow';
    }

    // Default to rectangle
    return 'rectangle';
  }

  /**
   * Handle create diagram command
   */
  private async handleCreateDiagram(command: SemanticCommand): Promise<ExecutionResult> {
    try {
      // Determine diagram type
      const diagramType = command.content?.toLowerCase() || '';

      if (diagramType.includes('tree')) {
        // Parse tree structure from command
        const treeData = this.parseTreeFromCommand(command);
        const { commands, id } = this.boardBrain.drawTree(treeData);

        for (const cmd of commands) {
          await this.executeBoardCommand(cmd, this.renderer);
        }

        return { success: true, elementId: id };
      } else if (diagramType.includes('timeline')) {
        // Parse timeline data from command
        const timelineData = this.parseTimelineFromCommand(command);
        const { commands, id } = this.boardBrain.drawTimeline(timelineData);

        for (const cmd of commands) {
          await this.executeBoardCommand(cmd, this.renderer);
        }

        return { success: true, elementId: id };
      } else if (diagramType.includes('graph')) {
        // Parse graph equations from command
        const equations = this.parseGraphEquationsFromCommand(command);
        const { commands, id } = this.boardBrain.drawGraph(
          command.label || 'Graph',
          equations,
          'auto',
          command.reference
        );

        for (const cmd of commands) {
          await this.executeBoardCommand(cmd, this.renderer);
        }

        return { success: true, elementId: id };
      }

      return { success: false, error: 'Unsupported diagram type' };
    } catch (error) {
      console.error('Create diagram failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Parse tree structure from command
   */
  private parseTreeFromCommand(command: SemanticCommand): TreeNode {
    // Simple tree parsing - in a real implementation this would be more sophisticated
    return {
      label: command.label || 'Root',
      children: []
    };
  }

  /**
   * Parse timeline data from command
   */
  private parseTimelineFromCommand(command: SemanticCommand): TimelineEvent[] {
    // Simple timeline parsing
    return [
      { year: '2020', label: command.label || 'Event' }
    ];
  }

  /**
   * Parse graph equations from command
   */
  private parseGraphEquationsFromCommand(command: SemanticCommand): string[] {
    // Extract equations from content
    if (command.content) {
      return command.content.split(',').map(eq => eq.trim());
    }
    return ['y = x'];
  }

  /**
   * Handle highlight command
   */
  private async handleHighlight(command: SemanticCommand): Promise<ExecutionResult> {
    try {
      // Find the element to highlight
      const element = this.boardContext.findElement(command.reference || '');
      if (!element) {
        throw new Error(`Element not found: ${command.reference}`);
      }

      // In a full implementation, this would add visual highlighting
      console.log('Highlighting element:', command.reference);

      return { success: true };
    } catch (error) {
      console.error('Highlight failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle erase command
   */
  private async handleErase(command: SemanticCommand): Promise<ExecutionResult> {
    try {
      // Find and remove the element
      const element = this.boardContext.findElement(command.reference || '');
      if (!element) {
        throw new Error(`Element not found: ${command.reference}`);
      }

      // In a full implementation, this would remove the element from canvas
      console.log('Erasing element:', command.reference);

      return { success: true };
    } catch (error) {
      console.error('Erase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle modify command
   */
  private async handleModify(command: SemanticCommand): Promise<ExecutionResult> {
    try {
      // Find the element to modify
      const element = this.boardContext.findElement(command.reference || '');
      if (!element) {
        throw new Error(`Element not found: ${command.reference}`);
      }

      // Apply modifications
      if (command.content) {
        // Update text content
        console.log('Modifying element content:', command.reference, command.content);
      }

      if (command.style) {
        // Update style
        console.log('Modifying element style:', command.reference, command.style);
      }

      return { success: true };
    } catch (error) {
      console.error('Modify failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle clear region command
   */
  private async handleClearRegion(command: SemanticCommand): Promise<ExecutionResult> {
    try {
      // Determine region to clear
      const region = command.position?.region || 'auto';

      // In a full implementation, this would clear the specified region
      console.log('Clearing region:', region);

      return { success: true };
    } catch (error) {
      console.error('Clear region failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
