import React, { useRef, useState } from 'react';
import { 
  ArrowRight, Mic, PenTool, Droplets, Sparkles, Zap, 
  Check, ChevronDown, CheckCircle2, X, BrainCircuit, Waves
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

// --- Internal Components ---

const Logo = ({ size = "md" }) => (
  <div className="flex items-center gap-2 select-none group cursor-pointer">
    <div className="relative">
      <div className="absolute inset-0 bg-cyan-400 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
      <Droplets className={`relative z-10 ${size === "md" ? "w-8 h-8" : "w-6 h-6"} text-cyan-400 fill-cyan-400/20`} />
      <Sparkles className="absolute -top-1 -right-2 w-3 h-3 text-white animate-pulse" />
    </div>
    <span className={`font-medium tracking-tight text-white ${size === "md" ? "text-2xl" : "text-xl"}`}>
      dewon
    </span>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: string }) => (
  <div 
    className="group glass-surface p-8 rounded-3xl hover:bg-white/5 transition-all duration-700 hover:-translate-y-2 border border-white/5 hover:border-cyan-500/30"
    style={{ animationDelay: delay }}
  >
    <div className="w-14 h-14 bg-slate-900/80 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 group-hover:border-cyan-500/50 transition-all shadow-lg shadow-black/50">
      <Icon className="text-slate-400 group-hover:text-cyan-400 transition-colors" size={28} />
    </div>
    <h3 className="text-xl font-bold mb-4 text-white group-hover:text-cyan-200 transition-colors">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm font-light group-hover:text-slate-300">
      {desc}
    </p>
  </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="font-medium text-lg text-slate-300 group-hover:text-cyan-400 transition-colors">{question}</span>
        <ChevronDown className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-400 leading-relaxed font-light pr-8">{answer}</p>
      </div>
    </div>
  );
};

const ManifestoModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
         {/* Close Button */}
         <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={onClose} 
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors backdrop-blur-md"
            >
               <X size={20} />
            </button>
         </div>
         
         <div className="overflow-y-auto p-8 md:p-16 custom-scrollbar">
            <div className="flex flex-col items-center text-center mb-12">
               <div className="w-16 h-16 bg-cyan-950/30 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                  <Droplets className="text-cyan-400 fill-cyan-400/20" size={32} />
               </div>
               <h2 className="text-3xl font-bold text-white tracking-tight mb-2">The Manifesto</h2>
               <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Project Aether / Dewon</p>
            </div>
            
            <div className="prose prose-invert prose-lg max-w-none">
               <h3 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 leading-tight">
                 "Stop studying.<br/>Start flowing."
               </h3>
               
               <p className="text-slate-300 leading-relaxed mb-8 first-letter:text-5xl first-letter:font-bold first-letter:text-white first-letter:mr-3 first-letter:float-left">
                  We believe that confusion is painful. It feels like isolation. It feels like deciphering a dead language alone in a dark room.
                  <br/><br/>
                  Clarity, on the other hand, should be immediate. It should feel like liquid.
               </p>

               <div className="my-10 p-6 rounded-2xl bg-white/5 border border-white/5">
                 <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <X className="text-red-400" size={20} />
                    The Broken State of Learning
                 </h4>
                 <ul className="space-y-4 text-slate-400 list-none m-0 p-0">
                    <li className="flex gap-3">
                      <span className="text-slate-600">•</span>
                      <span><strong className="text-slate-200">Video Tutorials are Passive.</strong> You watch, you nod, you zone out. You cannot ask a video "Why?"</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-slate-600">•</span>
                      <span><strong className="text-slate-200">Textbooks are Dry.</strong> Dense walls of text with no feedback loop. Information without emotion.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-slate-600">•</span>
                      <span><strong className="text-slate-200">Tutors are Inaccessible.</strong> Great teachers are expensive and rarely available at 2 AM when you're actually stuck.</span>
                    </li>
                 </ul>
               </div>

               <h4 className="text-xl font-semibold text-white mb-4 text-center">Enter Liquid Clarity</h4>
               <p className="text-slate-300 leading-relaxed mb-8">
                  Dewon is the solution. An intelligence engine that is always on, infinite in patience, and visual by default. 
                  It turns the "solid" wall of information into "liquid" knowledge that flows into your mind.
               </p>
               
               <p className="text-slate-400 text-center italic">
                  We are building this for the curious. For the frustrated. For you.
               </p>
            </div>
            
            <div className="mt-16 flex justify-center">
               <button 
                 onClick={onClose} 
                 className="px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-cyan-50 transition-all hover:scale-105 shadow-lg shadow-white/10"
               >
                  I'm Ready.
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- Main Landing Page ---

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const problemRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);
  
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500/30 overflow-x-hidden font-sans">
      <style>{`
        @keyframes liquid-pulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(34, 211, 238, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
        }
        .liquid-btn { animation: liquid-pulse 2s infinite; }
        .glass-surface {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .text-glow { text-shadow: 0 0 30px rgba(34, 211, 238, 0.3); }
        .grid-bg {
          background-size: 50px 50px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }
      `}</style>
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[1000px] h-[1000px] bg-cyan-900/10 blur-[150px] rounded-full mix-blend-screen opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 blur-[150px] rounded-full mix-blend-screen opacity-40"></div>
        <div className="absolute inset-0 grid-bg opacity-30"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => scrollToSection(problemRef)} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">The Struggle</button>
            <button onClick={() => scrollToSection(solutionRef)} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">The Solution</button>
            <button onClick={() => setIsManifestoOpen(true)} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Manifesto</button>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onGetStarted}
              className="text-sm font-semibold bg-white text-black hover:bg-cyan-50 border border-transparent px-6 py-2.5 rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Access Beta
            </button>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <div className="relative pt-48 pb-32 overflow-hidden z-10">
        <div className="max-w-5xl mx-auto px-6 text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 text-xs font-bold tracking-widest uppercase mb-10 shadow-[0_0_15px_rgba(34,211,238,0.1)] animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles size={12} />
              Public Beta Is Live
            </div>
            
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter mb-8 leading-[1.05] text-white animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Stop studying. <br />
              Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-glow">flowing.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              You're drowning in information. Dewon is the <strong className="text-slate-200">clarity</strong> you've been waiting for.
              A visual intelligence engine that listens, draws, and understands you.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <button 
                onClick={onGetStarted}
                className="liquid-btn group relative inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-black transition-all duration-300 bg-cyan-400 rounded-full focus:outline-none hover:bg-cyan-300 hover:scale-105 shadow-[0_0_40px_rgba(34,211,238,0.5)]"
              >
                Request Access
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              
              <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
                 <div className="flex -space-x-2">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full border border-black bg-slate-800 flex items-center justify-center text-[10px]">
                        <span className="opacity-50">User</span>
                     </div>
                   ))}
                 </div>
                 <span className="ml-2">1,200+ in queue</span>
              </div>
            </div>
        </div>
      </div>

      {/* 2. THE PROBLEM (Emotional Hook) */}
      <div ref={problemRef} className="py-24 relative z-10 border-t border-white/5 bg-[#03081c]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16 md:text-center">
            <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-4">The Current Reality</h2>
            <h3 className="text-3xl md:text-5xl font-semibold text-white">Why does learning feel so <span className="text-red-400">lonely?</span></h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             {/* Pain Point 1 */}
             <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4 mb-4 opacity-50">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center"><X size={20} /></div>
                   <h4 className="font-semibold text-lg">Passive Videos</h4>
                </div>
                <p className="text-slate-400 leading-relaxed">
                   You watch a 20-minute tutorial. You nod along. Then you try to do the problem yourself, and you're stuck. You can't ask a video "Why?"
                </p>
             </div>

             {/* Pain Point 2 */}
             <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4 mb-4 opacity-50">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center"><X size={20} /></div>
                   <h4 className="font-semibold text-lg">Dense Textbooks</h4>
                </div>
                <p className="text-slate-400 leading-relaxed">
                   Walls of text. Complex jargon. No feedback. It feels like deciphering a dead language alone in a dark room.
                </p>
             </div>

             {/* Pain Point 3 */}
             <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4 mb-4 opacity-50">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center"><X size={20} /></div>
                   <h4 className="font-semibold text-lg">Expensive Tutors</h4>
                </div>
                <p className="text-slate-400 leading-relaxed">
                   Great tutors cost $80/hr. They aren't available at 2 AM when your exam is tomorrow morning.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* 3. THE SOLUTION (Product Reveal) */}
      <div ref={solutionRef} className="py-32 relative z-10 overflow-hidden">
        {/* Decorative Background for Section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-b from-cyan-900/5 via-purple-900/5 to-[#020617] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
           <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Product Copy */}
              <div>
                 <div className="inline-flex items-center gap-2 mb-6 text-cyan-400 font-bold tracking-wide uppercase text-sm">
                    <Sparkles size={16} />
                    Introducing Dewon
                 </div>
                 <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                    Your companion for <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Liquid Clarity.</span>
                 </h2>
                 <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                    Dewon isn't a chatbot. It's a <strong>visual intelligence engine</strong>.
                    Imagine a world-class professor who has infinite patience, infinite time, and a magic whiteboard that never runs out of space.
                 </p>
                 
                 <ul className="space-y-6 mb-10">
                    <li className="flex items-start gap-4">
                       <div className="mt-1 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400"><Check size={14} /></div>
                       <div>
                          <strong className="block text-white mb-1">Voice-First Flow</strong>
                          <span className="text-slate-400 text-sm">Don't type. Just talk. Dew listens to your tone and hesitation.</span>
                       </div>
                    </li>
                    <li className="flex items-start gap-4">
                       <div className="mt-1 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400"><PenTool size={14} /></div>
                       <div>
                          <strong className="block text-white mb-1">The Canvas</strong>
                          <span className="text-slate-400 text-sm">Dew draws while explaining. Diagrams, mind maps, and equations appear instantly.</span>
                       </div>
                    </li>
                 </ul>

                 <button 
                  onClick={onGetStarted}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white font-semibold transition-all flex items-center gap-3"
                 >
                   Meet Dew
                   <ArrowRight size={18} />
                 </button>
              </div>

              {/* Product Visual Abstract */}
              <div className="relative h-[600px] w-full">
                 <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                 
                 {/* The "Interface" Abstract Representation */}
                 <div className="absolute inset-4 glass-surface rounded-3xl border border-white/10 p-6 flex flex-col shadow-2xl overflow-hidden">
                    {/* Fake Header */}
                    <div className="flex items-center justify-between mb-8 opacity-50">
                       <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                       </div>
                       <div className="h-2 w-32 bg-slate-700 rounded-full"></div>
                    </div>

                    {/* The Canvas Content Abstract */}
                    <div className="flex-1 relative">
                       {/* Center Node */}
                       <div className="absolute top-1/4 left-1/2 -translate-x-1/2 glass-surface px-6 py-4 rounded-xl border border-cyan-500/50 text-cyan-400 font-mono shadow-[0_0_30px_rgba(34,211,238,0.2)] animate-float">
                          Core Concept
                       </div>
                       
                       {/* Connection Lines */}
                       <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          <path d="M 300 180 L 150 350" stroke="rgba(34,211,238,0.3)" strokeWidth="2" strokeDasharray="5,5" />
                          <path d="M 320 180 L 450 350" stroke="rgba(34,211,238,0.3)" strokeWidth="2" strokeDasharray="5,5" />
                       </svg>

                       {/* Child Nodes */}
                       <div className="absolute bottom-1/4 left-10 glass-surface px-4 py-3 rounded-lg border border-white/10 text-slate-300 text-sm animate-float" style={{animationDelay: '1s'}}>
                          Supporting Idea A
                       </div>
                       <div className="absolute bottom-1/4 right-10 glass-surface px-4 py-3 rounded-lg border border-white/10 text-slate-300 text-sm animate-float" style={{animationDelay: '2s'}}>
                          Supporting Idea B
                       </div>
                    </div>

                    {/* The "Voice" Pulse */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent flex items-end justify-center pb-8">
                       <div className="flex items-center gap-1 h-8">
                          {[1,2,3,4,5].map(i => (
                             <div key={i} className="w-1 bg-cyan-400 rounded-full animate-liquid" style={{height: `${Math.random() * 20 + 10}px`, animationDuration: '1s'}}></div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* 4. FEATURES GRID */}
      <div className="py-24 relative z-10 bg-[#03081c] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">It feels like <span className="text-purple-400">clarity</span>.</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">We don't sell "multimodal AI". We sell the feeling of finally understanding.</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={Mic} 
                title="Just Talk" 
                desc="Just talk to Dew naturally. It keeps up." 
                delay="0s" 
              />
              <FeatureCard 
                icon={PenTool} 
                title="Visual Dialogue" 
                desc="Dew can see what you draw, and draws right back." 
                delay="0.1s" 
              />
              <FeatureCard 
                icon={Sparkles} 
                title="Active Understanding" 
                desc="Stop pausing YouTube videos. Just ask Dew 'Why?'" 
                delay="0.2s" 
              />
           </div>
        </div>
      </div>

      {/* 5. EARLY ACCESS / WAITLIST */}
      <div className="py-32 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
           <div className="glass-surface rounded-[40px] p-1 border border-cyan-500/30 relative overflow-hidden">
             {/* Background Glow */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none"></div>
             
             <div className="bg-[#020617] rounded-[36px] px-8 py-16 sm:p-16 text-center relative z-10">
                <div className="w-20 h-20 mx-auto bg-slate-900 rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-xl">
                   <Sparkles className="text-cyan-400" size={32} />
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Join the Movement.</h2>
                <p className="text-lg text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed">
                  We are currently in a private beta. We don't want your credit card. We want your curiosity.
                  Be one of the first to experience Liquid Clarity.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                   <button 
                     onClick={onGetStarted}
                     className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 hover:scale-[1.02] transition-transform"
                   >
                     Request Early Access
                   </button>
                   <button 
                    onClick={() => setIsManifestoOpen(true)}
                    className="w-full py-4 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors"
                   >
                     Read Manifesto
                   </button>
                </div>
                
                <p className="mt-8 text-xs text-slate-600 font-mono uppercase tracking-widest">
                   Limited Spots Available for Batch #4
                </p>
             </div>
           </div>
        </div>
      </div>

      {/* 6. FAQ */}
      <div className="pb-24 pt-10 relative z-10">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-2">
            <FAQItem 
              question="Is Dewon free?" 
              answer="Yes. During Early Access, Dewon is completely free. We are focused on building the best possible engine before we introduce pricing."
            />
            <FAQItem 
              question="What subjects can Dew handle?" 
              answer="Dew excels at conceptual subjects: Physics, Philosophy, History, Biology, and Computer Science. It's designed to explain 'Why' and 'How' visually."
            />
            <FAQItem 
              question="How is this different from ChatGPT?" 
              answer="ChatGPT is text-in, text-out. Dewon is Voice-in, Diagram-out. It uses a custom canvas engine to visualize thoughts, which is how humans actually learn."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center sm:text-left bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
           <Logo size="sm" />
           <div className="flex gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-cyan-400 transition-colors">Twitter</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Discord</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Email</a>
           </div>
           <div className="text-xs text-slate-600">
             &copy; 2025 Dewon Inc.
           </div>
        </div>
      </footer>
      
      <ManifestoModal isOpen={isManifestoOpen} onClose={() => setIsManifestoOpen(false)} />
    </div>
  );
};

export default LandingPage;