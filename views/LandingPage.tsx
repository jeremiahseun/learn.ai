import React from 'react';
import { ArrowRight, CheckCircle2, Mic, PenTool, BrainCircuit } from 'lucide-react';
import Logo from '../components/Logo';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-6">
            <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</button>
            <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</button>
            <button 
              onClick={onGetStarted}
              className="text-sm font-bold bg-white text-slate-950 px-4 py-2 rounded-full hover:bg-blue-50 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Live Gemini 2.5 Flash API
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            The Personal AI Tutor <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
              That Sees & Draws
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience real-time voice conversations with an AI that draws on a whiteboard while it explains. 
            Perfect for Math, Science, and Coding.
          </p>
          
          <button 
            onClick={onGetStarted}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30"
          >
            Start Learning Now
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Feature Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Mic className="text-blue-400" />}
              title="Voice Conversation"
              desc="Talk naturally. The AI understands nuances, interruptions, and complex queries in real-time."
            />
            <FeatureCard 
              icon={<PenTool className="text-purple-400" />}
              title="Visual Whiteboard"
              desc="Don't just listen. Watch the AI draw diagrams, write formulas, and visualize concepts for you."
            />
            <FeatureCard 
              icon={<BrainCircuit className="text-green-400" />}
              title="Deep Thinking"
              desc="Switch to Deep Think mode for complex reasoning tasks that require accurate, step-by-step logic."
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-slate-950 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Learn.ai. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur hover:border-blue-500/30 transition-colors text-left">
    <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;