import React from 'react';
import { Plus, Clock, BookOpen, LogOut, ArrowRight, Trash2 } from 'lucide-react';
import Logo from '../components/Logo';
import { Session, StudentProfile } from '../types';

interface DashboardProps {
  user: StudentProfile;
  sessions: Session[];
  onNewSession: () => void;
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
  
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
       <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
         <Logo size="sm" />
         <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-bold text-white">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user.level}</div>
            </div>
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-slate-800">
               {user.name.charAt(0).toUpperCase()}
            </div>
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
         </div>
       </nav>

       <main className="max-w-6xl mx-auto p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name.split(' ')[0]}</h1>
              <p className="text-slate-400">Continue where you left off or start a new learning journey.</p>
            </div>
            <button 
              onClick={onNewSession}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
            >
              <Plus size={20} />
              New Session
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {/* New Session Card (Quick Access) */}
             <div 
               onClick={onNewSession}
               className="group cursor-pointer border-2 border-dashed border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-blue-500 hover:bg-slate-900 transition-all min-h-[200px]"
             >
               <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-blue-500/20 flex items-center justify-center mb-4 transition-colors">
                 <Plus className="group-hover:text-blue-400" size={24} />
               </div>
               <span className="font-semibold">Start a blank session</span>
             </div>

             {/* Session List */}
             {sessions.map(session => (
               <div 
                 key={session.id}
                 onClick={() => onOpenSession(session)}
                 className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between min-h-[200px]"
               >
                 <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-white/5">
                        <BookOpen size={20} className="text-indigo-400" />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                        className="p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{session.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                      {session.boards.length} board{session.boards.length !== 1 && 's'} • {session.topic || 'General Topic'}
                    </p>
                 </div>
                 
                 <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <div className="flex items-center text-xs text-slate-500">
                      <Clock size={12} className="mr-1.5" />
                      {formatDate(session.lastAccessed)}
                    </div>
                    <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                      <ArrowRight size={18} />
                    </div>
                 </div>
               </div>
             ))}
          </div>
          
          {sessions.length === 0 && (
            <div className="text-center mt-20 text-slate-500">
              <p>You haven't created any sessions yet.</p>
            </div>
          )}
       </main>
    </div>
  );
};

export default Dashboard;