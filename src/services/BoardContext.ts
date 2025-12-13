/**
 * Board Context System
 *
 * Maintains semantic relationships between elements, handles element references,
 * and provides context-aware operations for the whiteboard.
 */

export interface BoardElement {
  id: string;
  type: string;
  content?: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  style?: any;
  semanticDescription?: string;
  from?: string;
  to?: string;
  label?: string;
}

export interface RelationshipGraphNode {
  elementId: string;
  connections: string[]; // IDs of connected elements
}

export class BoardContext {
  private elements: Map<string, BoardElement>;
  private semanticMap: Map<string, string>; // description -> elementId
  private relationships: Map<string, RelationshipGraphNode>;
  private history: Array<{
    command: any;
    timestamp: number;
    elementId?: string;
  }>;

  constructor() {
    this.elements = new Map();
    this.semanticMap = new Map();
    this.relationships = new Map();
    this.history = [];
  }

  /**
   * Register an element in the context
   */
  registerElement(
    element: Omit<BoardElement, 'id'>,
    semanticDescription?: string,
    elementId?: string
  ): string {
    const id = elementId || this.generateElementId();

    const boardElement: BoardElement = {
      id,
      type: element.type,
      content: element.content,
      position: element.position,
      size: element.size,
      style: element.style,
      semanticDescription: semanticDescription || element.content,
      from: element.from,
      to: element.to,
      label: element.label
    };

    this.elements.set(id, boardElement);

    // Add to semantic map if description provided
    if (semanticDescription) {
      this.semanticMap.set(semanticDescription.toLowerCase(), id);
    }

    // Initialize relationships
    this.relationships.set(id, {
      elementId: id,
      connections: []
    });

    // Add to history
    this.history.push({
      command: { action: 'register_element', element: boardElement },
      timestamp: Date.now(),
      elementId: id
    });

    return id;
  }

  /**
   * Find element by ID
   */
  findElement(elementId: string): BoardElement | null {
    return this.elements.get(elementId) || null;
  }

  /**
   * Find element by semantic description
   */
  findElementByDescription(description: string): BoardElement | null {
    const normalizedDesc = description.toLowerCase();
    const elementId = this.semanticMap.get(normalizedDesc);

    if (elementId) {
      return this.elements.get(elementId) || null;
    }

    // Try fuzzy matching
    return this.findSimilarElement(description);
  }

  /**
   * Find similar element using fuzzy matching
   */
  findSimilarElement(description: string): BoardElement | null {
    const normalizedDesc = description.toLowerCase();
    let bestMatch: { element: BoardElement; score: number } | null = null;

    this.elements.forEach(element => {
      if (element.semanticDescription) {
        const similarity = this.calculateSemanticSimilarity(
          normalizedDesc,
          element.semanticDescription.toLowerCase()
        );

        if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.score)) {
          bestMatch = {
            element,
            score: similarity
          };
        }
      }
    });

    return bestMatch ? bestMatch.element : null;
  }

  /**
   * Resolve references (e.g., "the circle" -> element ID)
   */
  resolveReferences(fromRef: string, toRef: string): { from: BoardElement | null; to: BoardElement | null } {
    const fromElement = this.findElementByDescription(fromRef) || this.findElement(fromRef);
    const toElement = this.findElementByDescription(toRef) || this.findElement(toRef);

    return { from: fromElement, to: toElement };
  }

  /**
   * Update an existing element
   */
  updateElement(id: string, changes: Partial<BoardElement>): void {
    const element = this.elements.get(id);

    if (element) {
      this.elements.set(id, { ...element, ...changes });

      // Update semantic map if description changed
      if (changes.semanticDescription && element.semanticDescription) {
        this.semanticMap.delete(element.semanticDescription.toLowerCase());
        this.semanticMap.set(changes.semanticDescription.toLowerCase(), id);
      }

      // Add to history
      this.history.push({
        command: { action: 'update_element', id, changes },
        timestamp: Date.now(),
        elementId: id
      });
    }
  }

  /**
   * Get all elements connected to a specific element
   */
  getRelationships(elementId: string): BoardElement[] {
    const node = this.relationships.get(elementId);

    if (!node) return [];

    return node.connections
      .map(connId => this.elements.get(connId))
      .filter((element): element is BoardElement => element !== undefined);
  }

  /**
   * Add a relationship between two elements
   */
  addRelationship(fromId: string, toId: string): void {
    const fromNode = this.relationships.get(fromId);
    const toNode = this.relationships.get(toId);

    if (fromNode && toNode) {
      if (!fromNode.connections.includes(toId)) {
        fromNode.connections.push(toId);
      }
      if (!toNode.connections.includes(fromId)) {
        toNode.connections.push(fromId);
      }

      // Add to history
      this.history.push({
        command: { action: 'add_relationship', fromId, toId },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Remove an element and its relationships
   */
  removeElement(id: string): void {
    const element = this.elements.get(id);

    if (element) {
      // Remove from semantic map
      if (element.semanticDescription) {
        this.semanticMap.delete(element.semanticDescription.toLowerCase());
      }

      // Remove relationships
      this.relationships.delete(id);

      // Remove from other elements' connections
      this.relationships.forEach(node => {
        const index = node.connections.indexOf(id);
        if (index > -1) {
          node.connections.splice(index, 1);
        }
      });

      // Remove element
      this.elements.delete(id);

      // Add to history
      this.history.push({
        command: { action: 'remove_element', id },
        timestamp: Date.now(),
        elementId: id
      });
    }
  }

  /**
   * Calculate semantic similarity between two descriptions
   */
  private calculateSemanticSimilarity(desc1: string, desc2: string): number {
    // Simple token-based similarity
    const tokens1 = desc1.split(/\s+/);
    const tokens2 = desc2.split(/\s+/);

    const commonTokens = tokens1.filter(token => tokens2.includes(token));
    const similarity = (commonTokens.length * 2) / (tokens1.length + tokens2.length);

    return similarity;
  }

  /**
   * Generate unique element ID
   */
  private generateElementId(): string {
    return 'elem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  }

  /**
   * Get command history
   */
  getHistory(): typeof this.history {
    return this.history;
  }

  /**
   * Clear all context
   */
  clear(): void {
    this.elements.clear();
    this.semanticMap.clear();
    this.relationships.clear();
    this.history = [];
  }

  /**
   * Get all elements
   */
  getAllElements(): BoardElement[] {
    return Array.from(this.elements.values());
  }

  /**
   * Get elements by type
   */
  getElementsByType(type: string): BoardElement[] {
    return Array.from(this.elements.values()).filter(element => element.type === type);
  }
}