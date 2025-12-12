import React, { useState } from 'react';
import { Plus, Clock, BookOpen, LogOut, ArrowRight, Trash2, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import { Session, StudentProfile } from '../types';
import NewSessionModal from '../components/NewSessionModal';

interface DashboardProps {
  user: StudentProfile;
  sessions: Session[];
  onNewSession: (topic: string, pdfData?: string) => void;
  onOpenSession: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  sessions, 
  onNewSession, 
  onOpenSession, 
  onDeleteSession,
  onLogout 
}) => {
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 relative overflow-hidden">
       {/* Ambient Background */}
       <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-600/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full"></div>
       </div>

       <nav className="h-20 border-b border-white/5 bg-[#020617]/70 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-20">
         <Logo size="sm" />
         <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-bold text-white">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user.level} Scholar</div>
            </div>
            <div className="h-9 w-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white/10 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
               {user.name.charAt(0).toUpperCase()}
            </div>
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
         </div>
       </nav>

       <main className="max-w-6xl mx-auto p-6 md:p-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}</h1>
              <p className="text-slate-400 flex items-center gap-2">
                 <Sparkles size={14} className="text-cyan-400" />
                 Ready to enter your flow state?
              </p>
            </div>
            <button 
              onClick={() => setIsNewSessionModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all hover:scale-105"
            >
              <Plus size={20} />
              New Flow
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {/* New Flow Card (Quick Access) */}
             <div 
               onClick={() => setIsNewSessionModalOpen(true)}
               className="group cursor-pointer border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-950/10 transition-all min-h-[220px]"
             >
               <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-cyan-500/20 flex items-center justify-center mb-4 transition-colors">
                 <Plus className="group-hover:text-cyan-400" size={24} />
               </div>
               <span className="font-semibold tracking-wide">Start a blank flow</span>
             </div>

             {/* Flow List */}
             {sessions.map(session => (
               <div 
                 key={session.id}
                 onClick={() => onOpenSession(session)}
                 className="group relative glass-panel rounded-2xl p-6 hover:border-cyan-500/30 transition-all cursor-pointer flex flex-col justify-between min-h-[220px] hover:-translate-y-1 hover:shadow-xl"
               >
                 {/* Card Glow on Hover */}
                 <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all"></div>
                 
                 <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-white/10">
                        <BookOpen size={20} className="text-cyan-400" />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">{session.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                      {session.boards.length} canvas pages • {session.topic || 'General Flow'}
                    </p>
                 </div>
                 
                 <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center text-xs text-slate-500">
                      <Clock size={12} className="mr-1.5" />
                      {formatDate(session.lastAccessed)}
                    </div>
                    <div className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                      <ArrowRight size={18} />
                    </div>
                 </div>
               </div>
             ))}
          </div>
          
          {sessions.length === 0 && (
            <div className="text-center mt-20 text-slate-500">
              <p>Your history is empty. Start a new flow to begin.</p>
            </div>
          )}
       </main>

       <NewSessionModal 
         isOpen={isNewSessionModalOpen} 
         onClose={() => setIsNewSessionModalOpen(false)} 
         onStart={onNewSession}
       />
    </div>
  );
};

export default Dashboard;