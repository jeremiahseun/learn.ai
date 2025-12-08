
import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { StudentProfile, Session } from './types';
import LandingPage from './views/LandingPage';
import Dashboard from './views/Dashboard';
import SessionView from './views/SessionView';
import StudentProfileModal from './components/StudentProfileModal';

// Get API Key
const API_KEY = process.env.API_KEY || '';

type ViewState = 'landing' | 'dashboard' | 'session';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  
  // Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    // Load local auth
    const storedUser = StorageService.getUser();
    if (storedUser) {
      setUser(storedUser);
      setSessions(StorageService.getSessions());
      setView('dashboard');
    } else {
      setView('landing');
    }
  }, []);

  const handleGetStarted = () => {
    setIsProfileModalOpen(true);
  };

  const handleCreateProfile = (profileData: StudentProfile) => {
    // If it's a new user
    const newUser: StudentProfile = {
      ...profileData,
      id: profileData.id || `user-${Date.now()}`,
      createdAt: profileData.createdAt || Date.now(),
    };
    
    StorageService.saveUser(newUser);
    setUser(newUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    StorageService.clearUser();
    setUser(null);
    setView('landing');
  };

  const handleNewSession = (topic: string, pdfContext?: string) => {
    // Create session in storage
    const session = StorageService.createSession(topic);
    
    // Inject ephemeral PDF context if it exists
    if (pdfContext) {
        session.pdfContext = pdfContext;
    }

    setSessions(StorageService.getSessions());
    setCurrentSession(session);
    setView('session');
  };

  const handleOpenSession = (session: Session) => {
    setCurrentSession(session);
    setView('session');
  };

  const handleDeleteSession = (id: string) => {
    StorageService.deleteSession(id);
    setSessions(StorageService.getSessions());
  };

  const handleSaveSession = (updatedSession: Session) => {
    StorageService.saveSession(updatedSession);
    setCurrentSession(updatedSession);
    setSessions(StorageService.getSessions());
  };

  const handleExitSession = () => {
    setCurrentSession(null);
    setView('dashboard');
  };

  // Render Views
  if (view === 'session' && currentSession && user) {
    return (
      <SessionView 
        session={currentSession} 
        user={user} 
        apiKey={API_KEY} 
        onSave={handleSaveSession} 
        onExit={handleExitSession} 
      />
    );
  }

  if (view === 'dashboard' && user) {
    return (
      <Dashboard 
        user={user} 
        sessions={sessions} 
        onNewSession={handleNewSession}
        onOpenSession={handleOpenSession}
        onDeleteSession={handleDeleteSession}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <>
      <LandingPage onGetStarted={handleGetStarted} />
      <StudentProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)}
        profile={user || { id: '', name: '', level: 'intermediate', interests: '', createdAt: 0 }}
        onSave={handleCreateProfile}
      />
    </>
  );
};

export default App;
