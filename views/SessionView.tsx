
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, BrainCircuit, Info, LayoutTemplate, Volume2, ArrowLeft, User, PenTool, Eraser, MousePointer2, ChevronRight, ChevronLeft, Play, Signal } from 'lucide-react';
import WhiteboardCanvas from '../components/WhiteboardCanvas';
import BoardCarousel from '../components/BoardCarousel';
import ThinkingModal from '../components/ThinkingModal';
import AudioPulse from '../components/AudioPulse';
import NetworkStatus from '../components/NetworkStatus';
import { ConnectionState, BoardCommand, StudentProfile, UserTool, Session, BoardData } from '../types';
import { GeminiLiveClient } from '../services/geminiService';
import { getSystemInstruction } from '../constants';
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
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const toolbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [audioLevels, setAudioLevels] = useState({ input: 0, output: 0 });

  const liveClientRef = useRef<GeminiLiveClient | null>(null);
  const activeBoardIdRef = useRef(activeBoardId);
  
  // Refs for saving & context
  const boardsRef = useRef(boards);
  const sessionTitleRef = useRef(sessionTitle);

  useEffect(() => { activeBoardIdRef.current = activeBoardId; }, [activeBoardId]);
  useEffect(() => { boardsRef.current = boards; }, [boards]);
  useEffect(() => { sessionTitleRef.current = sessionTitle; }, [sessionTitle]);

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

  // Toolbar Auto-Hide Logic
  useEffect(() => {
    if (isToolbarOpen) {
      if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
      toolbarTimeoutRef.current = setTimeout(() => {
        setIsToolbarOpen(false);
      }, 3000); // Hide after 3 seconds of no interaction
    }
    return () => {
      if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
    };
  }, [isToolbarOpen, userTool]);

  const interactToolbar = () => {
    setIsToolbarOpen(true);
    if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
    toolbarTimeoutRef.current = setTimeout(() => {
      setIsToolbarOpen(false);
    }, 3000);
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
     setBoards(prev => [...prev, { id: newId, commands: [], lastSaved: Date.now() }]);
     setActiveBoardId(newId);
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
      }
      return newBoards;
    });
  };

  const handleClearBoard = (id: string) => {
    setBoards(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, commands: [], lastSaved: Date.now() };
      }
      return b;
    }));
  };

  const handleUserDraw = (command: BoardCommand) => {
    interactToolbar();
    setBoards(prev => prev.map(b => {
      if (b.id === activeBoardId) {
        return { ...b, commands: [...b.commands, command], lastSaved: Date.now() };
      }
      return b;
    }));
  };

  const executeBoardCommand = async (name: string, args: any): Promise<any> => {
    // console.log(`Executing tool: ${name} on board ${activeBoardIdRef.current}`);
    
    const addCommand = (command: BoardCommand) => {
      setBoards(prev => prev.map(b => {
        if (b.id === activeBoardIdRef.current) {
          return { ...b, commands: [...b.commands, command], lastSaved: Date.now() };
        }
        return b;
      }));
    };

    // Mapping...
    if (name === 'draw_stroke') { addCommand({ type: 'stroke', payload: args }); return "drawn stroke"; }
    if (name === 'draw_circle') { addCommand({ type: 'circle', payload: args }); return "drawn circle"; }
    if (name === 'draw_rectangle') { addCommand({ type: 'rect', payload: args }); return "drawn rectangle"; }
    if (name === 'draw_line') { addCommand({ type: 'line', payload: args }); return "drawn line"; }
    if (name === 'draw_arrow') { addCommand({ type: 'arrow', payload: args }); return "drawn arrow"; }
    if (name === 'draw_polygon') { addCommand({ type: 'polygon', payload: args }); return "drawn polygon"; }
    if (name === 'highlight_area') { addCommand({ type: 'highlight', payload: args }); return "highlighted"; }
    if (name === 'write_text') { addCommand({ type: 'text', payload: args }); return "written text"; }
    if (name === 'write_formula') { addCommand({ type: 'formula', payload: args }); return "written formula"; }
    if (name === 'clear_board') { addCommand({ type: 'clear' }); return "cleared"; }
    if (name === 'create_new_board') {
      const newId = `board-${Date.now()}`;
      setBoards(prev => [...prev, { id: newId, commands: [], lastSaved: Date.now() }]);
      setActiveBoardId(newId); 
      activeBoardIdRef.current = newId; 
      return `created board ${newId}`;
    }

    return "unknown tool";
  };

  const toggleMute = () => {
    const newMuteState = !isMicMuted;
    setIsMicMuted(newMuteState);
    liveClientRef.current?.toggleMute(newMuteState);
  };

  const handleStartSession = async () => {
    console.log("[SessionView] User clicked Start Session");
    setShowStartOverlay(false);
    await toggleConnection();
  };

  const toggleConnection = async () => {
    console.log("[SessionView] Toggling connection...");
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      console.log("[SessionView] Disconnecting...");
      liveClientRef.current?.disconnect();
      setConnectionState(ConnectionState.DISCONNECTED);
      return;
    }

    if (!apiKey) {
      setErrorMsg("No API Key found. Please check your environment configuration.");
      return;
    }

    setConnectionState(ConnectionState.CONNECTING);
    setErrorMsg(null);
    setIsMicMuted(false);

    liveClientRef.current = new GeminiLiveClient(apiKey);

    try {
      const instruction = getSystemInstruction(user);
      
      await liveClientRef.current.connect(
        {
          onToolCall: async (name, args) => {
            return executeBoardCommand(name, args);
          },
          onClose: () => {
            console.log("[SessionView] Connection closed callback");
            setConnectionState(ConnectionState.DISCONNECTED);
          },
          onError: (err) => {
            console.error("[SessionView] Connection error callback", err);
            setErrorMsg("Connection error: " + err.message);
            setConnectionState(ConnectionState.ERROR);
          }
        }, 
        instruction, 
        { topic: session.topic, pdfBase64: session.pdfContext }
      );

      setConnectionState(ConnectionState.CONNECTED);
      console.log("[SessionView] Connection successful");

    } catch (e: any) {
      console.error("[SessionView] Init error", e);
      setConnectionState(ConnectionState.ERROR);
      
      if (e.message.includes('Microphone')) {
         setErrorMsg("Microphone Access Denied. Please allow microphone permissions in your browser and try again.");
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
      <header className="flex-none h-16 border-b border-white/5 flex items-center justify-between px-3 sm:px-6 bg-[#020617]/80 backdrop-blur-xl z-20">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button onClick={() => { saveSessionState(); onExit(); }} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-2">
            <Logo size="sm" className="hidden lg:flex" />
            <div className="h-6 w-px bg-white/10 mx-2 hidden lg:block"></div>
            <div>
              <input 
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="bg-transparent text-sm sm:text-base font-bold text-white focus:outline-none focus:border-b border-cyan-500 w-24 sm:w-64 placeholder-slate-500 truncate"
                placeholder="Lesson Title"
              />
            </div>
          </div>
        </div>

        {/* Audio Visualizer (Holo Style) */}
        {connectionState === ConnectionState.CONNECTED && (
          <div className="hidden md:flex items-center space-x-4 px-6 py-1.5 bg-black/40 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)] absolute left-1/2 -translate-x-1/2 backdrop-blur-md">
             <AudioPulse active={!isMicMuted} volume={isMicMuted ? 0 : audioLevels.input} color="blue" label="YOU" />
             <div className="h-6 w-px bg-white/10"></div>
             <AudioPulse active={true} volume={audioLevels.output} color="purple" label="AI" />
          </div>
        )}

        <div className="flex items-center space-x-2 sm:space-x-4">
           {connectionState === ConnectionState.CONNECTED && (
             <button
                onClick={toggleMute}
                className={`p-2.5 rounded-full transition-all border ${isMicMuted ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-white/5 text-slate-300 hover:text-white border-white/10 hover:bg-white/10'}`}
             >
               {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
             </button>
           )}

           <NetworkStatus state={connectionState} />

           <button 
             onClick={() => setIsThinkingOpen(true)}
             className="hidden sm:flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-purple-300 hover:text-white px-3 py-2 rounded-lg hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 transition-all"
           >
             <BrainCircuit size={16} />
             <span>Deep Think</span>
           </button>

           <button 
             onClick={toggleConnection}
             className={`
               flex items-center space-x-2 px-3 sm:px-5 py-2 rounded-full font-bold transition-all shadow-lg text-xs sm:text-sm
               ${connectionState === ConnectionState.CONNECTED 
                 ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                 : connectionState === ConnectionState.CONNECTING
                   ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                   : 'bg-white/10 text-slate-300 hover:bg-white/20'
               }
             `}
           >
             {connectionState === ConnectionState.CONNECTED ? <Volume2 size={16} /> : <Mic size={16} />}
             <span className="hidden sm:inline">{connectionState === ConnectionState.CONNECTED ? 'End Session' : connectionState === ConnectionState.CONNECTING ? 'Connecting...' : 'Connect'}</span>
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col" onMouseMove={interactToolbar} onTouchStart={interactToolbar}>
        <div className="flex-1 relative flex items-center justify-center p-2 sm:p-6 lg:p-8">
           {/* Canvas Container with Glass Border */}
           <div className="relative w-full h-full max-w-[1400px] aspect-square sm:aspect-[16/9] rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl">
              <WhiteboardCanvas 
                commands={getActiveBoard().commands} 
                width={1000} 
                height={1000} 
                userTool={userTool}
                onUserDraw={handleUserDraw}
              />

              {/* Floating Toolbar (Glass) */}
              <div 
                className={`
                  absolute top-4 left-4 flex flex-col space-y-2 bg-black/60 backdrop-blur-xl p-2 rounded-xl border border-white/10 shadow-xl transition-all duration-300
                  ${isToolbarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none sm:translate-x-0 sm:opacity-100 sm:pointer-events-auto'}
                `}
              >
                 <button onClick={() => { setUserTool('pointer'); interactToolbar(); }} className={`p-2.5 rounded-lg hover:bg-white/10 transition ${userTool === 'pointer' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-slate-400'}`} title="Pointer"><MousePointer2 size={20} /></button>
                 <button onClick={() => { setUserTool('pen'); interactToolbar(); }} className={`p-2.5 rounded-lg hover:bg-white/10 transition ${userTool === 'pen' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-slate-400'}`} title="Draw"><PenTool size={20} /></button>
                 <button onClick={() => { setUserTool('eraser'); interactToolbar(); }} className={`p-2.5 rounded-lg hover:bg-white/10 transition ${userTool === 'eraser' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-slate-400'}`} title="Eraser"><Eraser size={20} /></button>
              </div>

              {/* Mobile Toolbar Toggle */}
              <div 
                onClick={interactToolbar}
                className={`
                  absolute top-4 left-0 bg-black/60 backdrop-blur p-2 rounded-r-lg border-y border-r border-white/10 text-cyan-400 cursor-pointer sm:hidden transition-all duration-300
                  ${isToolbarOpen ? '-translate-x-full' : 'translate-x-0'}
                `}
              >
                <ChevronRight size={20} />
              </div>
              
              {/* Start Overlay (Ready State) */}
              {showStartOverlay && connectionState === ConnectionState.DISCONNECTED && (
                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
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
