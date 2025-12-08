import { Session, StudentProfile, BoardData } from '../types';

const KEYS = {
  USER: 'learnai_user',
  SESSIONS: 'learnai_sessions',
};

export const StorageService = {
  getUser: (): StudentProfile | null => {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  saveUser: (profile: StudentProfile) => {
    localStorage.setItem(KEYS.USER, JSON.stringify(profile));
  },

  clearUser: () => {
    localStorage.removeItem(KEYS.USER);
  },

  getSessions: (): Session[] => {
    const data = localStorage.getItem(KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  },

  saveSession: (session: Session) => {
    const sessions = StorageService.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    
    // Sort by last accessed desc
    sessions.sort((a, b) => b.lastAccessed - a.lastAccessed);
    
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },

  deleteSession: (id: string) => {
    const sessions = StorageService.getSessions().filter(s => s.id !== id);
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },

  createSession: (topic: string = 'Untitled Lesson'): Session => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: topic,
      topic: topic,
      boards: [{ id: 'board-1', commands: [], lastSaved: Date.now() }],
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };
    StorageService.saveSession(newSession);
    return newSession;
  }
};