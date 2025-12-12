import React, { useState } from 'react';
import { X, BookOpen, FileText, Upload, Sparkles } from 'lucide-react';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (topic: string, pdfData?: string) => void;
}

const NewSessionModal: React.FC<NewSessionModalProps> = ({ isOpen, onClose, onStart }) => {
  const [topic, setTopic] = useState('');
  const [fileName, setFileName] = useState('');
  const [pdfBase64, setPdfBase64] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert("Please upload a PDF file.");
        return;
      }
      setFileName(file.name);
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        // Result is "data:application/pdf;base64,....."
        // We need just the base64 part for Gemini inlineData
        const base64 = result.split(',')[1];
        setPdfBase64(base64);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(topic || 'General Flow', pdfBase64);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-cyan-400" />
            Start New Flow
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">What do you want to explore?</label>
            <div className="relative">
              <BookOpen size={18} className="absolute top-3.5 left-3 text-slate-500" />
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none placeholder-slate-600"
                placeholder="e.g. Quantum Mechanics, French History"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Context Material (Optional)</label>
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all text-center cursor-pointer relative">
               <input 
                 type="file" 
                 accept="application/pdf"
                 onChange={handleFileChange}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               {fileName ? (
                 <div className="flex items-center justify-center gap-2 text-cyan-400">
                    <FileText size={20} />
                    <span className="font-medium truncate max-w-[200px]">{fileName}</span>
                 </div>
               ) : (
                 <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Upload size={24} />
                    <span className="text-sm">Drop PDF here or click to upload</span>
                 </div>
               )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
          >
            {isProcessing ? 'Processing File...' : 'Enter Flow'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewSessionModal;