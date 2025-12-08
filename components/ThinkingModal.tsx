import React, { useState } from 'react';
import { X, BrainCircuit, Loader2 } from 'lucide-react';
import { askThinkingBrain } from '../services/geminiService';

interface ThinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThinkingModal: React.FC<ThinkingModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      // In a real app, API Key would be managed better or passed down
      const apiKey = process.env.API_KEY || ''; 
      if (!apiKey) {
        setResponse("Error: API Key missing in environment.");
        setIsLoading(false);
        return;
      }
      const result = await askThinkingBrain(prompt, apiKey);
      setResponse(result);
    } catch (error) {
      setResponse("Failed to get a response from the Thinking model.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2 text-purple-400">
             <BrainCircuit size={24} />
             <h2 className="text-xl font-bold">Deep Thinking Mode</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {!response && (
             <div className="text-slate-400 text-sm">
               Use this mode for complex questions (Math, Logic, STEM) that require time to think. 
               The result is text-only, but highly accurate.
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask a difficult question..."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[100px]"
              />
              <button 
                type="submit" 
                disabled={isLoading || !prompt.trim()}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Thinking... (this may take a moment)
                  </>
                ) : 'Ask Brain AI'}
              </button>
           </form>

           {response && (
             <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mt-4">
               <h3 className="text-sm font-semibold text-slate-400 mb-2">Answer:</h3>
               <div className="prose prose-invert max-w-none text-slate-200 whitespace-pre-wrap">
                 {response}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ThinkingModal;
