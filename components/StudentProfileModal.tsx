
import React, { useRef, useEffect } from 'react';
import { X, User, BookOpen, GraduationCap } from 'lucide-react';
import { StudentProfile, LearningLevel } from '../types';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSave: (profile: StudentProfile) => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose, profile, onSave }) => {
  const [localProfile, setLocalProfile] = React.useState<StudentProfile>(profile);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Reset local profile when modal opens
    if (isOpen) {
      setLocalProfile(profile);
    }
  }, [isOpen, profile]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // Max height approx 5 lines
    }
  }, [localProfile.interests, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User size={20} className="text-blue-500" />
            Student Profile
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">My Name</label>
            <input
              type="text"
              value={localProfile.name}
              onChange={e => setLocalProfile({ ...localProfile, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Experience Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['beginner', 'intermediate', 'advanced'] as LearningLevel[]).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setLocalProfile({ ...localProfile, level })}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors capitalize
                    ${localProfile.level === level 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }
                  `}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Topics I want to learn</label>
            <div className="relative">
              <BookOpen size={16} className="absolute top-3.5 left-3 text-slate-500" />
              <textarea
                ref={textareaRef}
                value={localProfile.interests}
                onChange={e => setLocalProfile({ ...localProfile, interests: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-y-auto"
                placeholder="e.g. Physics, Algebra, Art History"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all"
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentProfileModal;
