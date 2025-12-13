/**
 * Test script for CommandInterpreter
 */

import { CommandInterpreter } from './src/services/CommandInterpreter';
import { LayoutManager } from './src/services/LayoutManager';
import { BoardContext } from './src/services/BoardContext';
import { IncrementalRenderer } from './src/services/IncrementalRenderer';
import { BoardBrain } from './services/BoardBrain';

// Create a mock canvas context using node-canvas
import { createCanvas, Canvas } from 'canvas';

const mockCanvas = createCanvas(1920, 1080);
const mockCtx = mockCanvas.getContext('2d');

if (!mockCtx) {
  throw new Error('Could not create canvas context');
}

// Initialize all components
const layoutManager = new LayoutManager(1920, 1080);
const boardContext = new BoardContext();
const renderer = new IncrementalRenderer(mockCtx);
const boardBrain = new BoardBrain(1920, 1080);
const commandInterpreter = new CommandInterpreter(layoutManager, boardContext, renderer, boardBrain);

async function runTests() {
  console.log('Running CommandInterpreter tests...');

  // Test 1: Write text command
  console.log('\n=== Test 1: Write Text ===');
  try {
    const textCommand = {
      action: 'write_text' as const,
      content: 'Hello, World!',
      style: {
        size: 'large' as const,
        color: '#2563eb',
        emphasis: 'bold' as const
      }
    };

    const result = await commandInterpreter.executeCommand(textCommand);
    console.log('✅ Write text result:', result);
  } catch (error) {
    console.error('❌ Write text failed:', error);
  }

  // Test 2: Draw arrow command
  console.log('\n=== Test 2: Draw Arrow ===');
  try {
    // First, create two elements to connect
    const element1Command = {
      action: 'write_text' as const,
      content: 'Element 1',
      id: 'elem1'
    };

    const element2Command = {
      action: 'write_text' as const,
      content: 'Element 2',
      id: 'elem2'
    };

    await commandInterpreter.executeCommand(element1Command);
    await commandInterpreter.executeCommand(element2Command);

    const arrowCommand = {
      action: 'draw_arrow' as const,
      from: 'elem1',
      to: 'elem2',
      label: 'Connection',
      style: {
        color: '#ef4444'
      }
    };

    const result = await commandInterpreter.executeCommand(arrowCommand);
    console.log('✅ Draw arrow result:', result);
  } catch (error) {
    console.error('❌ Draw arrow failed:', error);
  }

  // Test 3: Draw shape command
  console.log('\n=== Test 3: Draw Shape ===');
  try {
    const shapeCommand = {
      action: 'draw_shape' as const,
      content: 'rectangle',
      label: 'My Rectangle',
      style: {
        color: '#10b981'
      }
    };

    const result = await commandInterpreter.executeCommand(shapeCommand);
    console.log('✅ Draw shape result:', result);
  } catch (error) {
    console.error('❌ Draw shape failed:', error);
  }

  // Test 4: Create diagram (tree)
  console.log('\n=== Test 4: Create Tree Diagram ===');
  try {
    const treeCommand = {
      action: 'create_diagram' as const,
      content: 'tree structure',
      label: 'Decision Tree'
    };

    const result = await commandInterpreter.executeCommand(treeCommand);
    console.log('✅ Create tree diagram result:', result);
  } catch (error) {
    console.error('❌ Create tree diagram failed:', error);
  }

  // Test 5: Queue multiple commands
  console.log('\n=== Test 5: Queue Commands ===');
  try {
    const command1 = {
      action: 'write_text' as const,
      content: 'First item',
      style: { size: 'medium' }
    };

    const command2 = {
      action: 'write_text' as const,
      content: 'Second item',
      style: { size: 'medium' }
    };

    const command3 = {
      action: 'write_text' as const,
      content: 'Third item',
      style: { size: 'medium' }
    };

    commandInterpreter.queueCommand(command1);
    commandInterpreter.queueCommand(command2);
    commandInterpreter.queueCommand(command3);

    console.log('✅ Queued', commandInterpreter.getQueueLength(), 'commands');

    // Wait for queue to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Queue processing completed');

  } catch (error) {
    console.error('❌ Queue commands failed:', error);
  }

  console.log('\n=== All Tests Completed ===');
}

// Run the tests
runTests().catch(console.error);
