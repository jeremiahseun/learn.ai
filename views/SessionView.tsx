
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, BrainCircuit, Info, LayoutTemplate, Volume2, ArrowLeft, User, PenTool, Eraser, MousePointer2, ChevronRight, ChevronLeft, Play, Signal, Smartphone, RotateCw, Maximize2, Minimize2, Settings, X, ChevronDown, ChevronUp, Camera, Grid3X3, FastForward, Captions } from 'lucide-react';
import WhiteboardCanvas, { WhiteboardHandle } from '../components/WhiteboardCanvas';
import BoardCarousel from '../components/BoardCarousel';
import ThinkingModal from '../components/ThinkingModal';
import AudioPulse from '../components/AudioPulse';
import NetworkStatus from '../components/NetworkStatus';
import { ConnectionState, BoardCommand, StudentProfile, UserTool, Session, BoardData } from '../types';
import { GeminiLiveClient } from '../services/geminiService';
import { BoardBrain } from '../services/BoardBrain';
import Logo from '../components/Logo';

interface SessionViewProps {
  session: Session;
  user: StudentProfile;
  apiKey: string;
  onSave: (session: Session) => void;
  onExit: () => void;
}

const SessionView: React.FC<SessionViewProps> = ({ session, user, apiKey, onSave, onExit }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [boards, setBoards] = useState<BoardData[]>(session.boards);
  const [activeBoardId, setActiveBoardId] = useState<string>(session.boards[0]?.id || 'board-1');
  const [sessionTitle, setSessionTitle] = useState(session.title);
  
  // Modals & Overlays
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showStartOverlay, setShowStartOverlay] = useState(true);
  
  // User State
  const [userTool, setUserTool] = useState<UserTool>('pointer');
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  
  // Captions State
  const [captionText, setCaptionText] = useState('');
  const [showCaptions, setShowCaptions] = useState(false);
  const captionTimeoutRef = useRef<any>(null);
  
  // Laser Pointer State (Ephemeral)
  const [currentLaserPoint, setCurrentLaserPoint] = useState<{x: number, y: number} | null>(null);

  // Audio Controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [audioLevels, setAudioLevels] = useState({ input: 0, output: 0 });
  const [retryCount, setRetryCount] = useState(0);
  
  // Video Player Logic
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<WhiteboardHandle>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // We hardcode dimensions to 1920x1080 (HD Video Standard)
  const boardDims = { width: 1920, height: 1080 };

  const liveClientRef = useRef<GeminiLiveClient | null>(null);
  // Board Brain Logic
  const boardBrainRef = useRef<BoardBrain>(new BoardBrain(boardDims.width, boardDims.height));
  const activeBoardIdRef = useRef(activeBoardId);
  const isBoardDirtyRef = useRef(false);
  
  // Refs for saving & context
  const boardsRef = useRef(boards);
  const sessionTitleRef = useRef(sessionTitle);

  useEffect(() => { activeBoardIdRef.current = activeBoardId; }, [activeBoardId]);
  useEffect(() => { boardsRef.current = boards; }, [boards]);
  useEffect(() => { sessionTitleRef.current = sessionTitle; }, [sessionTitle]);

  // Handle Fullscreen Change Events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Auto-save on unmount or change
  useEffect(() => {
    const timer = setInterval(() => {
       saveSessionState();
    }, 5000);
    return () => {
      clearInterval(timer);
      saveSessionState();
      liveClientRef.current?.disconnect();
    };
  }, []);

  // Auto-Reconnect Strategy
  useEffect(() => {
    if (connectionState === ConnectionState.ERROR && retryCount < 3) {
       console.log(`[SessionView] Connection dropped. Auto-reconnecting (Attempt ${retryCount + 1}/3)...`);
       const timer = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connectSession(true); // isReconnect = true
       }, 3000);
       return () => clearTimeout(timer);
    }
    
    if (connectionState === ConnectionState.CONNECTED) {
       setRetryCount(0); // Reset retries on success
    }
  }, [connectionState, retryCount]);

  // --- VISION STREAMING LOOP ---
  // Sends a screenshot of the board to the AI every 2 seconds if something changed
  useEffect(() => {
    if (connectionState !== ConnectionState.CONNECTED) return;
    
    const interval = setInterval(() => {
       if (canvasRef.current && liveClientRef.current && isBoardDirtyRef.current) {
          // Export as JPEG (lighter payload than PNG)
          const dataUrl = canvasRef.current.exportImage('image/jpeg', 0.5); 
          const base64 = dataUrl.split(',')[1];
          
          liveClientRef.current.sendImageFrame(base64);
          isBoardDirtyRef.current = false;
          // console.log("[Vision] Sent board frame to AI");
       }
    }, 2000); // 2 second interval is a good balance for latency vs tokens

    return () => clearInterval(interval);
  }, [connectionState]);

  const toggleFullscreen = async () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await playerContainerRef.current.requestFullscreen();
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
             await (screen.orientation as any).lock('landscape');
          } catch(e) {
             console.log("Orientation lock not supported or denied");
          }
        }
      } catch (err) {
        console.error("Error enabling fullscreen:", err);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        if (screen.orientation && (screen.orientation as any).unlock) {
           (screen.orientation as any).unlock();
        }
      }
    }
  };

  const handleDownloadSnapshot = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.exportImage();
      const link = document.createElement('a');
      link.download = `${sessionTitle.replace(/\s+/g, '_')}_board_${activeBoardId}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const saveSessionState = () => {
    const updatedSession: Session = {
      ...session,
      title: sessionTitleRef.current,
      boards: boardsRef.current,
      lastAccessed: Date.now()
    };
    onSave(updatedSession);
  };

  useEffect(() => {
    let animationFrameId: number;
    const pollVolumes = () => {
      if (connectionState === ConnectionState.CONNECTED) {
        // Poll Input
        const inputLevel = liveClientRef.current?.getVolumeLevels().input || 0;
        
        // Poll Output
        let outputLevel = 0;
        if (liveClientRef.current) {
             outputLevel = liveClientRef.current.getVolumeLevels().output || 0;
        }

        setAudioLevels({ input: inputLevel, output: outputLevel });
      } else {
        setAudioLevels({ input: 0, output: 0 });
      }
      animationFrameId = requestAnimationFrame(pollVolumes);
    };
    pollVolumes();
    return () => cancelAnimationFrame(animationFrameId);
  }, [connectionState]);

  const getActiveBoard = () => boards.find(b => b.id === activeBoardId) || boards[0];

  const handleCreateBoard = () => {
     const newId = `board-${Date.now()}`;
     // New boards default to NO grid
     setBoards(prev => [...prev, { id: newId, commands: [], lastSaved: Date.now(), gridActive: false }]);
     setActiveBoardId(newId);
     // Reset brain state for new board
     boardBrainRef.current.reset();
     isBoardDirtyRef.current = true;
  };

  const handleDeleteBoard = (id: string) => {
    if (boards.length <= 1) {
      handleClearBoard(id);
      return;
    }
    setBoards(prev => {
      const newBoards = prev.filter(b => b.id !== id);
      if (id === activeBoardId) {
        setActiveBoardId(newBoards[newBoards.length - 1].id);
        boardBrainRef.current.reset();
      }
      return newBoards;
    });
    isBoardDirtyRef.current = true;
  };

  const handleClearBoard = (id: string) => {
    setBoards(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, commands: [], lastSaved: Date.now() };
      }
      return b;
    }));
    boardBrainRef.current.reset();
    isBoardDirtyRef.current = true;
  };

  const handleUserDraw = (command: BoardCommand) => {
    setBoards(prev => prev.map(b => {
      if (b.id === activeBoardId) {
        return { ...b, commands: [...b.commands, command], lastSaved: Date.now() };
      }
      return b;
    }));
    // Flag the board as "dirty" so the vision loop picks it up and sends it to the AI
    isBoardDirtyRef.current = true;
  };

  const handleNudge = () => {
    if (liveClientRef.current) {
       // Send a system message masquerading as user context or strict direction
       liveClientRef.current.sendText("[SYSTEM]: The user is asking you to move on immediately. Stop the current explanation and advance to the next topic.");
    }
  };

  const toggleGrid = () => {
    setBoards(prev => prev.map(b => {
      if (b.id === activeBoardId) {
        return { ...b, gridActive: !b.gridActive };
      }
      return b;
    }));
    isBoardDirtyRef.current = true;
  };

  // --- BRAIN INTEGRATION ---
  const executeBoardCommand = async (name: string, args: any): Promise<any> => {
    const addCommand = (command: BoardCommand) => {
      setBoards(prev => prev.map(b => {
        if (b.id === activeBoardIdRef.current) {
          return { ...b, commands: [...b.commands, command], lastSaved: Date.now() };
        }
        return b;
      }));
      // The AI drew something, so we also mark dirty to keep sync, 
      // although technically the AI knows what it just drew.
      isBoardDirtyRef.current = true; 
    };

    // 1. Semantic Text
    if (name === 'write_text') {
       const res = boardBrainRef.current.writeText(args.text, args.role, args.position, args.relative_to_id, args.group_id);
       addCommand(res.command);
       return { success: true, element_id: res.id };
    }

    // 2. Semantic Shape
    if (name === 'draw_shape') {
       const res = boardBrainRef.current.drawShape(args.shape, args.role, args.position, args.relative_to_id, args.group_id);
       if (res) {
          addCommand(res.command);
          return { success: true, element_id: res.id };
       }
       return { success: false, error: "Could not place shape" };
    }

    // 3. Create Group
    if (name === 'create_group') {
        const res = boardBrainRef.current.createGroup(args.title, args.position);
        // Groups might be purely logical, but we can visualize them with a light container
        if (res.command) addCommand(res.command);
        return { success: true, group_id: res.id };
    }

    // 4. Connect Elements
    if (name === 'connect_elements') {
        const res = boardBrainRef.current.connectElements(args.source_id, args.target_id, args.label);
        if (res) {
            addCommand(res.command);
            if (res.labelCommand) addCommand(res.labelCommand);
            return { success: true };
        }
        return { success: false, error: "Could not connect elements (ids not found)" };
    }

    // 5. Inspection
    if (name === 'inspect_board') {
       return boardBrainRef.current.getStateDescription();
    }

    // 6. Board Management
    if (name === 'create_new_board') {
      const newId = `board-${Date.now()}`;
      setBoards(prev => [...prev, { id: newId, commands: [], lastSaved: Date.now(), gridActive: false }]);
      setActiveBoardId(newId); 
      activeBoardIdRef.current = newId; 
      boardBrainRef.current.reset();
      console.log(`[SessionView] Created new board: ${newId}`);
      return `created board ${newId}`;
    }

    // 7. Utility
    if (name === 'toggle_grid') {
       const isVisible = args.visible;
       setBoards(prev => prev.map(b => {
         if (b.id === activeBoardIdRef.current) return { ...b, gridActive: isVisible };
         return b;
       }));
       isBoardDirtyRef.current = true;
       return `grid set to ${isVisible}`;
    }

    if (name === 'laser_pointer') {
       setCurrentLaserPoint({ x: args.x, y: args.y });
       return "pointed";
    }

    return "unknown tool";
  };

  const toggleMute = () => {
    const newMuteState = !isMicMuted;
    setIsMicMuted(newMuteState);
    liveClientRef.current?.toggleMute(newMuteState);
  };

  const handleStartSession = async () => {
    setShowStartOverlay(false);
    await connectSession(false);
  };

  const connectSession = async (isReconnect: boolean = false) => {
    if (!isReconnect && (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING)) {
      liveClientRef.current?.disconnect();
      setConnectionState(ConnectionState.DISCONNECTED);
      setRetryCount(3);
      return;
    }

    if (!apiKey) {
      setErrorMsg("No API Key found. Please check your environment configuration.");
      return;
    }

    setConnectionState(ConnectionState.CONNECTING);
    if (!isReconnect) setErrorMsg(null);
    if (!isReconnect) setIsMicMuted(false);

    liveClientRef.current = new GeminiLiveClient(apiKey);

    try {
      await liveClientRef.current.connect(
        {
          onToolCall: async (name, args) => executeBoardCommand(name, args),
          onClose: () => setConnectionState(ConnectionState.DISCONNECTED),
          onError: (err) => {
            if (err.message.includes("Internal error") && retryCount < 3) {
               setConnectionState(ConnectionState.ERROR); 
               return;
            }
            setErrorMsg("Connection error: " + err.message);
            setConnectionState(ConnectionState.ERROR);
          },
          onCaption: (text) => {
            setCaptionText(prev => {
              // Accumulate text, but keep it from getting too large if needed
              // For a simple movie subtitle effect, we just append.
              return prev + text;
            });
            // Reset hide timer
            if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
            captionTimeoutRef.current = setTimeout(() => {
                setCaptionText('');
            }, 4000); // Clear after 4 seconds of silence
          }
        }, 
        user,
        boardDims,
        { 
            topic: session.topic, 
            pdfBase64: session.pdfContext,
            isReconnect: isReconnect
        }
      );

      setConnectionState(ConnectionState.CONNECTED);

    } catch (e: any) {
      setConnectionState(ConnectionState.ERROR);
      if (e.message.includes('Microphone')) {
         setErrorMsg("Microphone Access Denied. Please allow microphone permissions.");
      } else {
         setErrorMsg(e.message);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 font-sans overflow-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-600/10 blur-[100px] rounded-full"></div>
      </div>
      
      {/* Session Header */}
      <header className="flex-none h-16 border-b border-white/5 flex items-center px-3 sm:px-6 bg-[#020617]/80 backdrop-blur-xl z-20">
        <div className="flex-1 flex items-center justify-start space-x-2 sm:space-x-4 min-w-0">
          <button onClick={() => { saveSessionState(); onExit(); }} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-2 min-w-0">
            <Logo size="sm" className="hidden lg:flex flex-shrink-0" />
            <div className="h-6 w-px bg-white/10 mx-2 hidden lg:block flex-shrink-0"></div>
            <div className="min-w-0">
              <input 
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="bg-transparent text-sm sm:text-base font-bold text-white focus:outline-none focus:border-b border-cyan-500 w-24 sm:w-64 placeholder-slate-500 truncate"
                placeholder="Lesson Title"
              />
            </div>
          </div>
        </div>

        {/* Audio Visualizer (Holo Style) - Flow Layout now, hidden on smaller screens */}
        {connectionState === ConnectionState.CONNECTED && (
          <div className="hidden xl:flex flex-none items-center space-x-4 px-6 py-1.5 bg-black/40 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)] backdrop-blur-md mx-4">
             <AudioPulse active={!isMicMuted} volume={isMicMuted ? 0 : audioLevels.input} color="blue" label="YOU" />
             <div className="h-6 w-px bg-white/10"></div>
             <AudioPulse active={true} volume={audioLevels.output} color="purple" label="AI" />
          </div>
        )}

        <div className="flex-1 flex items-center justify-end space-x-2 sm:space-x-4 min-w-0">
           {connectionState === ConnectionState.CONNECTED && (
             <>
                <button
                   onClick={() => setShowCaptions(!showCaptions)}
                   title={showCaptions ? "Hide Captions" : "Show Captions"}
                   className={`p-2.5 rounded-full transition-all border flex-shrink-0 ${showCaptions ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'}`}
                >
                   <Captions size={18} />
                </button>

                <button
                   onClick={handleNudge}
                   title="Nudge: Tell AI to move on"
                   className="p-2.5 rounded-full bg-white/5 text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/30 transition-all hover:shadow-[0_0_10px_rgba(250,204,21,0.2)] flex-shrink-0"
                >
                   <FastForward size={18} />
                </button>

                <button
                    onClick={toggleMute}
                    className={`p-2.5 rounded-full transition-all border flex-shrink-0 ${isMicMuted ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-white/5 text-slate-300 hover:text-white border-white/10 hover:bg-white/10'}`}
                >
                   {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
             </>
           )}

           <div className="flex-shrink-0">
             <NetworkStatus state={connectionState === ConnectionState.ERROR && retryCount > 0 ? ConnectionState.CONNECTING : connectionState} />
           </div>

           <button 
             onClick={() => setIsThinkingOpen(true)}
             className="hidden md:flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-purple-300 hover:text-white px-3 py-2 rounded-lg hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 transition-all flex-shrink-0"
           >
             <BrainCircuit size={16} />
             <span>Deep Think</span>
           </button>

           <button 
             onClick={() => connectSession(false)}
             className={`
               flex items-center space-x-2 px-3 sm:px-5 py-2 rounded-full font-bold transition-all shadow-lg text-xs sm:text-sm flex-shrink-0
               ${connectionState === ConnectionState.CONNECTED 
                 ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                 : connectionState === ConnectionState.CONNECTING || (connectionState === ConnectionState.ERROR && retryCount > 0)
                   ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                   : 'bg-white/10 text-slate-300 hover:bg-white/20'
               }
             `}
           >
             {connectionState === ConnectionState.CONNECTED ? <Volume2 size={16} /> : <Mic size={16} />}
             <span className="hidden sm:inline">
               {connectionState === ConnectionState.CONNECTED 
                  ? 'End Session' 
                  : (connectionState === ConnectionState.CONNECTING || (connectionState === ConnectionState.ERROR && retryCount > 0))
                    ? (retryCount > 0 ? 'Reconnecting...' : 'Connecting...') 
                    : 'Connect'}
             </span>
           </button>
        </div>
      </header>

      {/* Main Content - The "Video Player" Stage */}
      <main className="flex-1 relative bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
           
           <div 
             ref={playerContainerRef}
             className="relative w-full max-w-[177vh] aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 group"
           >
              <WhiteboardCanvas 
                ref={canvasRef}
                commands={getActiveBoard().commands} 
                width={boardDims.width} 
                height={boardDims.height} 
                userTool={userTool}
                onUserDraw={handleUserDraw}
                showGrid={getActiveBoard().gridActive ?? false} // Defaults to false
                laserPoint={currentLaserPoint}
              />

              {/* Captions Overlay */}
              {showCaptions && captionText && (
                <div className="absolute bottom-16 left-0 right-0 flex justify-center px-8 z-30">
                  <div className="bg-black/70 backdrop-blur-md text-white text-lg md:text-xl font-medium px-6 py-3 rounded-xl text-center shadow-lg border border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl">
                     {captionText}
                  </div>
                </div>
              )}

              {/* Persistent Manual Toolbar Overlay */}
              <div className="absolute top-6 left-6 z-50 flex flex-col items-start gap-2">
                 {/* Toggle Button */}
                 <button
                    onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
                    className={`
                      flex items-center justify-center p-3 rounded-xl backdrop-blur-md border shadow-lg transition-all
                      ${isToolbarExpanded 
                         ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                         : 'bg-black/60 text-slate-300 border-white/10 hover:bg-white/10'}
                    `}
                    title="Drawing Tools"
                 >
                    {isToolbarExpanded ? <X size={20} /> : <PenTool size={20} />}
                 </button>

                 {/* Expanded Tools List */}
                 <div className={`
                    flex flex-col gap-2 p-2 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl transition-all origin-top-left overflow-hidden
                    ${isToolbarExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none h-0 p-0 border-0'}
                 `}>
                    <button 
                      onClick={() => { setUserTool('pointer'); setIsToolbarExpanded(false); }} 
                      className={`flex items-center gap-3 p-2.5 rounded-lg w-36 transition-colors ${userTool === 'pointer' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                    >
                       <MousePointer2 size={18} />
                       <span className="text-sm font-medium">Pointer</span>
                    </button>

                    <button 
                      onClick={() => { setUserTool('pen'); setIsToolbarExpanded(false); }} 
                      className={`flex items-center gap-3 p-2.5 rounded-lg w-36 transition-colors ${userTool === 'pen' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                    >
                       <PenTool size={18} />
                       <span className="text-sm font-medium">Draw</span>
                    </button>

                    <button 
                      onClick={() => { setUserTool('eraser'); setIsToolbarExpanded(false); }} 
                      className={`flex items-center gap-3 p-2.5 rounded-lg w-36 transition-colors ${userTool === 'eraser' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                    >
                       <Eraser size={18} />
                       <span className="text-sm font-medium">Eraser</span>
                    </button>
                    
                    <div className="h-px bg-white/10 my-1"></div>

                    <button 
                      onClick={toggleGrid} 
                      className={`flex items-center gap-3 p-2.5 rounded-lg w-36 transition-colors ${getActiveBoard().gridActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                    >
                       <Grid3X3 size={18} />
                       <span className="text-sm font-medium">Grid {getActiveBoard().gridActive ? 'On' : 'Off'}</span>
                    </button>

                    <button 
                      onClick={handleDownloadSnapshot}
                      className="flex items-center gap-3 p-2.5 rounded-lg w-36 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                       <Camera size={18} />
                       <span className="text-sm font-medium">Snapshot</span>
                    </button>
                 </div>
              </div>

              {/* Fullscreen Button - Fixed visibility on mobile */}
              <div className="absolute bottom-6 right-6 z-20 flex opacity-100 transition-opacity">
                 <button 
                   onClick={toggleFullscreen}
                   className="p-3 bg-black/60 backdrop-blur-md rounded-full text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all shadow-lg"
                 >
                   {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                 </button>
              </div>
              
              {/* Start Overlay (Ready State) */}
              {showStartOverlay && connectionState === ConnectionState.DISCONNECTED && (
                <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="relative text-center max-w-lg w-full">
                       <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse-glow"></div>
                       <div className="relative z-10 flex flex-col items-center">
                          <button 
                            onClick={handleStartSession}
                            className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_50px_rgba(34,211,238,0.5)] flex items-center justify-center text-white mb-8 hover:scale-105 hover:shadow-[0_0_70px_rgba(34,211,238,0.7)] transition-all animate-float"
                          >
                             <Mic size={48} />
                          </button>
                          <h2 className="text-3xl font-bold text-white mb-3">Ready to Learn?</h2>
                          <p className="text-slate-400 mb-6">Topic: <span className="text-cyan-400">{session.topic || "General Discussion"}</span></p>
                          <p className="text-slate-500 text-sm max-w-sm mx-auto">Click the button to connect to the Live AI Tutor. The AI will start by introducing the topic.</p>
                       </div>
                    </div>
                </div>
              )}
           </div>

           {errorMsg && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-lg border border-red-500/50 text-sm z-50 animate-bounce font-medium">{errorMsg}</div>}
      </main>

      <footer className="flex-none z-10 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5">
        <BoardCarousel 
          boards={boards} 
          activeBoardId={activeBoardId}
          isConnected={connectionState === ConnectionState.CONNECTED}
          onSelectBoard={setActiveBoardId}
          onNewBoard={handleCreateBoard}
          onDeleteBoard={handleDeleteBoard}
          onClearBoard={handleClearBoard}
        />
      </footer>

      <ThinkingModal isOpen={isThinkingOpen} onClose={() => setIsThinkingOpen(false)} />
    </div>
  );
};

export default SessionView;
