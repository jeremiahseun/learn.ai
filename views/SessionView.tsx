
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, BrainCircuit, Info, LayoutTemplate, Volume2, ArrowLeft, User, PenTool, Eraser, MousePointer2, ChevronRight, ChevronLeft } from 'lucide-react';
import WhiteboardCanvas from '../components/WhiteboardCanvas';
import BoardCarousel from '../components/BoardCarousel';
import ThinkingModal from '../components/ThinkingModal';
import AudioPulse from '../components/AudioPulse';
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
  
  // Modals
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // User State
  const [userTool, setUserTool] = useState<UserTool>('pointer');
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const toolbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [audioLevels, setAudioLevels] = useState({ input: 0, output: 0 });

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioOutputAnalyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const liveClientRef = useRef<GeminiLiveClient | null>(null);
  const activeBoardIdRef = useRef(activeBoardId);
  
  // Refs for saving
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
      audioContextRef.current?.close();
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
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
        try {
          const ctx = new AudioContextClass({ sampleRate: 24000 });
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.1;
          analyser.connect(ctx.destination);
          audioOutputAnalyserRef.current = analyser;
        } catch (e) {
          console.warn("AudioContext with sampleRate not supported, falling back to default");
          audioContextRef.current = new AudioContextClass();
        }
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const pollVolumes = () => {
      if (connectionState === ConnectionState.CONNECTED) {
        const inputLevel = liveClientRef.current?.getVolumeLevels().inputLevel || 0;
        let outputLevel = 0;
        if (audioOutputAnalyserRef.current) {
          const dataArray = new Uint8Array(audioOutputAnalyserRef.current.frequencyBinCount);
          audioOutputAnalyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          outputLevel = (sum / dataArray.length) / 255;
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
    // Reset toolbar timer on draw
    interactToolbar();

    setBoards(prev => prev.map(b => {
      if (b.id === activeBoardId) {
        return { ...b, commands: [...b.commands, command], lastSaved: Date.now() };
      }
      return b;
    }));

    if (connectionState === ConnectionState.CONNECTED && liveClientRef.current) {
       let desc = "something";
       if (command.type === 'stroke') desc = "a green stroke";
       else if (command.type === 'erase-area') desc = "erased a part of the board";
       
       liveClientRef.current.sendText(`[System: The user just drew ${desc} at roughly x:${Math.floor(command.type === 'stroke' ? command.payload.points[0].x : 0)} y:${Math.floor(command.type === 'stroke' ? command.payload.points[0].y : 0)} on the board]`);
    }
  };

  const executeBoardCommand = async (name: string, args: any): Promise<any> => {
    console.log(`Executing tool: ${name} on board ${activeBoardIdRef.current}`);
    
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

  const toggleConnection = async () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      liveClientRef.current?.disconnect();
      setConnectionState(ConnectionState.DISCONNECTED);
      return;
    }

    if (!apiKey) {
      setErrorMsg("No API Key found. Please check your environment configuration.");
      return;
    }

    if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    setConnectionState(ConnectionState.CONNECTING);
    setErrorMsg(null);
    setIsMicMuted(false);

    liveClientRef.current = new GeminiLiveClient(apiKey);

    try {
      const instruction = getSystemInstruction(user);
      
      await liveClientRef.current.connect({
        onAudioData: (buffer) => {
          if (audioContextRef.current && audioOutputAnalyserRef.current) {
             const ctx = audioContextRef.current;
             const source = ctx.createBufferSource();
             source.buffer = buffer;
             source.connect(audioOutputAnalyserRef.current);
             const now = ctx.currentTime;
             const startTime = Math.max(now, nextStartTimeRef.current);
             source.start(startTime);
             nextStartTimeRef.current = startTime + buffer.duration;
          }
        },
        onToolCall: async (name, args) => {
          return executeBoardCommand(name, args);
        },
        onClose: () => setConnectionState(ConnectionState.DISCONNECTED),
        onError: (err) => {
          console.error(err);
          setErrorMsg("Connection error: " + err.message);
          setConnectionState(ConnectionState.ERROR);
        }
      }, instruction);

      setConnectionState(ConnectionState.CONNECTED);
    } catch (e: any) {
      setConnectionState(ConnectionState.ERROR);
      setErrorMsg(e.message);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Session Header */}
      <header className="flex-none h-14 sm:h-16 border-b border-slate-800 flex items-center justify-between px-3 sm:px-6 bg-slate-950/80 backdrop-blur-md z-10">
        <div className="flex items-center space-x-4">
          <button onClick={() => { saveSessionState(); onExit(); }} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-2">
            <Logo size="sm" className="hidden sm:flex" />
            <div className="h-6 w-px bg-slate-700 mx-2 hidden sm:block"></div>
            <div>
              <input 
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="bg-transparent text-sm sm:text-base font-bold text-white focus:outline-none focus:border-b border-blue-500 w-32 sm:w-64"
                placeholder="Lesson Title"
              />
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold hidden sm:block">
                 {connectionState === ConnectionState.CONNECTED ? 'Live Session' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        {/* Audio Visualizer */}
        {connectionState === ConnectionState.CONNECTED && (
          <div className="hidden md:flex items-center space-x-4 px-8 py-2 bg-slate-900/50 rounded-full border border-slate-800/50 absolute left-1/2 -translate-x-1/2">
             <AudioPulse active={!isMicMuted} volume={isMicMuted ? 0 : audioLevels.input} color="blue" label="YOU" />
             <div className="h-6 w-px bg-slate-800"></div>
             <AudioPulse active={true} volume={audioLevels.output} color="purple" label="AI" />
          </div>
        )}

        <div className="flex items-center space-x-2 sm:space-x-4">
           {connectionState === ConnectionState.CONNECTED && (
             <button
                onClick={toggleMute}
                className={`p-2 sm:p-3 rounded-full transition-all border ${isMicMuted ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'}`}
             >
               {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
             </button>
           )}

           <button 
             onClick={() => setIsThinkingOpen(true)}
             className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-purple-300 hover:text-white px-2 py-1 sm:px-3 sm:py-2 rounded-md hover:bg-purple-500/20 transition-colors"
           >
             <BrainCircuit size={16} />
             <span className="hidden sm:inline">Deep Think</span>
           </button>

           <button 
             onClick={toggleConnection}
             className={`
               flex items-center space-x-2 px-4 sm:px-6 py-2 rounded-full font-semibold transition-all shadow-lg text-sm sm:text-base
               ${connectionState === ConnectionState.CONNECTED 
                 ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/50' 
                 : connectionState === ConnectionState.CONNECTING
                   ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/50'
                   : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
               }
             `}
           >
             {connectionState === ConnectionState.CONNECTED ? <Volume2 size={16} /> : <Mic size={16} />}
             <span>{connectionState === ConnectionState.CONNECTED ? 'End' : connectionState === ConnectionState.CONNECTING ? '...' : 'Start'}</span>
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col" onMouseMove={interactToolbar} onTouchStart={interactToolbar}>
        <div className="flex-1 relative bg-slate-900 flex items-center justify-center p-2 sm:p-6 lg:p-8">
           <div className="relative w-full h-full max-w-[1400px] aspect-square sm:aspect-[16/9] shadow-2xl rounded-xl overflow-hidden ring-1 ring-slate-800 bg-slate-800">
              <WhiteboardCanvas 
                commands={getActiveBoard().commands} 
                width={1000} 
                height={1000} 
                userTool={userTool}
                onUserDraw={handleUserDraw}
              />

              {/* Collapsible Toolbar */}
              <div 
                className={`
                  absolute top-4 left-4 flex flex-col space-y-2 bg-slate-900/90 backdrop-blur p-2 rounded-lg border border-slate-700 shadow-xl transition-all duration-300
                  ${isToolbarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none sm:translate-x-0 sm:opacity-100 sm:pointer-events-auto'}
                `}
              >
                 <button onClick={() => { setUserTool('pointer'); interactToolbar(); }} className={`p-2 rounded hover:bg-slate-700 transition ${userTool === 'pointer' ? 'bg-blue-600 text-white' : 'text-slate-400'}`} title="Pointer"><MousePointer2 size={20} /></button>
                 <button onClick={() => { setUserTool('pen'); interactToolbar(); }} className={`p-2 rounded hover:bg-slate-700 transition ${userTool === 'pen' ? 'bg-blue-600 text-white' : 'text-slate-400'}`} title="Draw"><PenTool size={20} /></button>
                 <button onClick={() => { setUserTool('eraser'); interactToolbar(); }} className={`p-2 rounded hover:bg-slate-700 transition ${userTool === 'eraser' ? 'bg-blue-600 text-white' : 'text-slate-400'}`} title="Eraser"><Eraser size={20} /></button>
              </div>

              {/* Toolbar Toggle Trigger (Visible when toolbar is hidden on mobile) */}
              <div 
                onClick={interactToolbar}
                className={`
                  absolute top-4 left-0 bg-slate-800/80 p-2 rounded-r-lg border-y border-r border-slate-700 text-slate-400 cursor-pointer sm:hidden transition-all duration-300
                  ${isToolbarOpen ? '-translate-x-full' : 'translate-x-0'}
                `}
              >
                <ChevronRight size={20} />
              </div>
              
              {getActiveBoard().commands.length === 0 && userTool === 'pointer' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                  <div className="text-slate-600 flex flex-col items-center p-4 sm:p-8 bg-slate-900/50 rounded-xl backdrop-blur-sm text-center">
                    <Info size={32} className="mb-4 opacity-50" />
                    <p className="text-base sm:text-lg font-medium">Click "Start" to begin your lesson.</p>
                  </div>
                </div>
              )}
           </div>
        </div>
        {errorMsg && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-md shadow-lg text-sm z-50 animate-bounce">{errorMsg}</div>}
      </main>

      <footer className="flex-none z-10">
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
