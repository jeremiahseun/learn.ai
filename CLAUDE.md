# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dewon** is a voice-first, generative whiteboard engine powered by Gemini AI models. It transforms learning from passive content consumption to interactive visual dialogue. The system uses:

- **Gemini 2.5 Flash** (Live API) for real-time voice interaction with sub-300ms latency
- **Gemini 3 Pro** for deep reasoning and complex problem solving
- **Generative Graphics Engine** that translates AI function calls into visual elements on an infinite canvas

## Codebase Structure

### Frontend Architecture

```bash
📁 learn.ai/
├── App.tsx                  # Main application entry point
├── index.tsx                # React DOM rendering
├── components/             # UI components
│   ├── WhiteboardCanvas.tsx # Core canvas rendering with drawing tools
│   ├── AudioPulse.tsx       # Audio visualization component
│   ├── BoardCarousel.tsx    # Session management UI
│   └── ...                  # Other UI components
├── services/               # Core business logic
│   ├── geminiService.ts     # Gemini Live API client and audio processing
│   ├── BoardBrain.ts        # Intelligent layout engine for whiteboard
│   └── audioUtils.ts        # Audio processing utilities
├── backend/                # Hono.js backend server
│   ├── src/index.ts         # Main backend entry with routes
│   ├── routes/chat.ts       # Chat API endpoints
│   └── ...                  # Other backend services
└── constants.ts            # System instructions and tool declarations
```

### Key Components

1. **WhiteboardCanvas** (`components/WhiteboardCanvas.tsx`):
   - Canvas-based rendering of all visual elements
   - Handles user drawing interactions (pen, eraser, pointer)
   - Supports mathematical formula rendering with HTML overlay
   - Subject-based theming (math, science, history, literature)

2. **GeminiLiveClient** (`services/geminiService.ts`):
   - Manages WebSocket connection to Gemini Live API
   - Handles real-time audio processing (16kHz PCM)
   - Processes AI tool calls and converts them to canvas commands
   - Manages audio input/output with Web Audio API

3. **BoardBrain** (`services/BoardBrain.ts`):
   - Intelligent layout engine for whiteboard elements
   - Handles semantic positioning and automatic layout
   - Supports specialized layout engines (trees, timelines, graphs)
   - Manages element relationships and spatial organization

4. **Backend** (`backend/src/`):
   - Hono.js server with REST API endpoints
   - Handles chat sessions and webhook integrations
   - Provides authentication middleware

## Development Commands

### Build and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup

1. Create `.env.local` file in root directory
2. Add `GEMINI_API_KEY=your_api_key_here`
3. Ensure Node.js is installed (v18+ recommended)

## Architecture Patterns

### Dual AI Model Architecture

1. **Flow State (Gemini 2.5 Flash)**:
   - Real-time voice interaction via WebSocket
   - Processes 16kHz PCM audio with sub-300ms latency
   - Uses function calling to control the generative graphics engine

2. **Deep Synthesis (Gemini 3 Pro)**:
   - Handles complex reasoning tasks
   - Used for mathematical proofs and code generation
   - Provides high-fidelity responses for complex queries

### Intelligent Layout System

The BoardBrain implements a sophisticated layout engine with:

- **Semantic Zones**: Header, main content, sidebar, footer, floating elements
- **Layout Modes**: Standard (single column) and split-view (main + sidebar)
- **Specialized Engines**: Tree structures, timelines, mathematical graphs
- **Element Relationships**: Parent-child relationships with relative positioning

### Audio Processing Pipeline

```bash
Microphone Input → Web Audio API → Downsample to 16kHz → PCM16 Conversion →
Base64 Encoding → WebSocket Transmission → Gemini Live API →
Response Processing → Audio Decoding → Web Audio Playback
```

## Key Technical Features

### Real-time Collaboration

- WebSocket-based communication with Gemini Live API
- Bidirectional audio streaming with automatic gain control
- Network recovery mode for handling connection drops

### Visual Intelligence

- Subject-based theming (math grids, history lines, science crosshairs)
- Automatic layout algorithms for optimal content organization
- Mathematical formula rendering with proper typesetting

### User Interaction

- Voice-first interface with microphone input
- Touch and mouse support for drawing
- Laser pointer for highlighting specific elements
- Multi-tool support (pen, eraser, pointer)

## Important Files for Understanding

1. **`constants.ts`**: Contains system instructions and tool declarations that define the AI's capabilities
2. **`types.ts`**: TypeScript type definitions for the entire application
3. **`services/BoardBrain.ts`**: Core layout intelligence implementation
4. **`services/geminiService.ts`**: Real-time AI communication layer
5. **`components/WhiteboardCanvas.tsx`**: Visual rendering engine

## Common Development Tasks

### Adding New Drawing Tools

1. Define new tool in `constants.ts` (TOOLS_DECLARATION)
2. Implement tool handling in `BoardBrain.ts`
3. Add rendering logic in `WhiteboardCanvas.tsx`
4. Update system instructions to describe when to use the tool

### Extending Layout Intelligence

1. Modify layout algorithms in `BoardBrain.ts`
2. Add new semantic positioning options
3. Update zone management logic
4. Test with various content types

### Debugging Audio Issues

1. Check Web Audio API context creation
2. Verify microphone permissions
3. Test audio processing pipeline in `audioUtils.ts`
4. Monitor WebSocket connection status

