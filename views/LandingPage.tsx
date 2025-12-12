import React, { useRef, useState, useEffect } from 'react';
import { 
  ArrowRight, Mic, PenTool, Droplets, Sparkles, Zap, 
  Check, Play, Users, Clock, Star, MessageCircle, Lightbulb, 
  X, ChevronDown, CheckCircle2, ShieldCheck, Search
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

// Custom CSS for the "Dew" aesthetic (Liquid + Glass)
const CustomStyles = () => (
  <style>{`
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
    }
    @keyframes breathe {
      0%, 100% { opacity: 0.5; transform: scale(0.98); }
      50% { opacity: 1; transform: scale(1.02); }
    }
    @keyframes liquid-flow {
      0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
      50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
      100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-breathe { animation: breathe 4s ease-in-out infinite; }
    .animate-liquid { animation: liquid-flow 8s ease-in-out infinite; }
    
    .glass-surface {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    }
    
    .dew-glow-text {
      text-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
    }
    
    .lens-effect {
      background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), rgba(255,255,255,0.01));
      box-shadow: inset 0 0 20px rgba(255,255,255,0.05), 0 0 50px rgba(34, 211, 238, 0.2);
    }
  `}</style>
);

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

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="font-medium text-lg text-slate-200 group-hover:text-cyan-400 transition-colors">{question}</span>
        <ChevronDown className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-400 leading-relaxed font-light">{answer}</p>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500/30 overflow-x-hidden font-sans">
      <CustomStyles />
      
      {/* Deep Sea Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-cyan-900/10 blur-[120px] rounded-full mix-blend-screen animate-breathe"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-900/10 blur-[120px] rounded-full mix-blend-screen animate-breathe" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Navigation - Minimal & Glass */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection(featuresRef)} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">The Experience</button>
            <button onClick={() => scrollToSection(pricingRef)} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</button>
          </div>
          <div className="flex items-center gap-4">
            <button className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</button>
            <button 
              onClick={onGetStarted}
              className="text-sm font-semibold bg-white text-black hover:bg-cyan-50 border border-transparent px-5 py-2.5 rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Talk to Dew
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-40 pb-32 overflow-hidden z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content - Clarity Focused */}
            <div className="text-center lg:text-left relative z-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 text-xs font-bold tracking-wider uppercase mb-8">
                <Sparkles size={12} />
                Meet your new AI Partner
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight mb-6 leading-[1.1] text-white">
                Confusion,<br />
                <span className="text-cyan-400 dew-glow-text">cleared.</span>
              </h1>
              
              <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed font-light">
                Don't just memorize it. <strong className="text-white font-medium">See it.</strong> <br/>
                Dew helps you visualize complex topics, solving the "why" instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button 
                  onClick={onGetStarted}
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black transition-all duration-300 bg-cyan-400 rounded-full focus:outline-none hover:bg-cyan-300 shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:scale-105"
                >
                  Start Canvas
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <div className="flex items-center gap-3 px-6 py-4 text-sm font-medium text-slate-400">
                   <div className="flex -space-x-2">
                     {[1,2,3].map(i => (
                       <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center text-[10px]">
                         {i === 1 ? '👩‍🎓' : i === 2 ? '👨‍💻' : '⚡️'}
                       </div>
                     ))}
                   </div>
                   <p>Trusted by 45,000+ students</p>
                </div>
              </div>
            </div>

            {/* Right Visual - The "Lens" Metaphor */}
            <div className="relative flex items-center justify-center h-[500px]">
               {/* The Fog (Background) */}
               <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-[#0a0f2e] to-slate-900 opacity-80 rounded-full blur-3xl"></div>
               
               {/* The Droplet / Lens (Dew) */}
               <div className="relative w-80 h-80 animate-liquid lens-effect backdrop-blur-sm border border-white/20 flex items-center justify-center z-10 overflow-hidden group cursor-default transition-all duration-700 hover:scale-105">
                  
                  {/* Inside the lens: Clarity */}
                  <div className="absolute inset-0 bg-[#020617]/40"></div>
                  
                  {/* The AI "Brain" visual inside the droplet */}
                  <div className="relative z-20 text-center transform group-hover:scale-110 transition-transform duration-500">
                    <div className="w-16 h-16 mx-auto bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-400/30 mb-4 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                      <Mic className="text-cyan-400 w-6 h-6 animate-pulse" />
                    </div>
                    <div className="text-white font-medium text-lg mb-1">"I'm listening."</div>
                    <div className="text-cyan-400/60 text-xs tracking-widest uppercase">Dew is Active</div>
                  </div>

                  {/* Floating particles inside lens */}
                  <div className="absolute top-10 left-10 w-2 h-2 bg-white/40 rounded-full animate-float"></div>
                  <div className="absolute bottom-20 right-10 w-3 h-3 bg-cyan-400/40 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
               </div>

               {/* Connected Elements representing "Clarified Ideas" */}
               <div className="absolute top-20 right-10 glass-surface p-4 rounded-xl animate-float shadow-lg z-0 opacity-60 scale-90">
                  <div className="h-2 w-20 bg-slate-700 rounded-full mb-2"></div>
                  <div className="h-2 w-12 bg-slate-700 rounded-full"></div>
               </div>
               <div className="absolute bottom-20 left-0 glass-surface px-5 py-3 rounded-full animate-float shadow-lg z-20 flex items-center gap-3" style={{animationDelay: '2s'}}>
                  <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                  <span className="text-xs font-mono text-green-300">CONCEPT_LINKED</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section: "Apple Aesthetics, Google Functionality" */}
      <div ref={featuresRef} className="py-24 relative z-10 bg-[#03081c]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-semibold mb-6">Designed for <span className="text-cyan-400">flow.</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
              We stripped away the complexity. No menus, no setup. <br/> Just an infinite canvas and a voice that understands you.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group glass-surface p-8 rounded-3xl hover:bg-white/5 transition-colors duration-500">
              <div className="w-12 h-12 bg-cyan-950/50 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <Mic className="text-cyan-400" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Live Voice</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Talk to Dew like a person. Interrupt, ask "Why?", or vent about how hard the problem is. Dew keeps up, instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group glass-surface p-8 rounded-3xl hover:bg-white/5 transition-colors duration-500">
              <div className="w-12 h-12 bg-purple-950/50 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <PenTool className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Smart Drawings</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Dew doesn't just talk; it draws. Watch diagrams, graphs, and mind maps appear on the Canvas in real-time as you discuss them.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group glass-surface p-8 rounded-3xl hover:bg-white/5 transition-colors duration-500">
              <div className="w-12 h-12 bg-pink-950/50 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/20 group-hover:scale-110 transition-transform">
                <Zap className="text-pink-400" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Deep Synthesis</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Stuck on a massive equation? Dew pauses to "Think" (powered by Gemini Pro), checking its logic before guiding you step-by-step.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison / Value Section */}
      <div className="py-24 relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-semibold mb-8">The <span className="text-purple-400">old way</span> is broken.</h2>
              <div className="space-y-6">
                <div className="flex gap-4 opacity-50">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0"><X size={20}/></div>
                  <div>
                    <h4 className="font-semibold text-lg text-slate-300">Passive Video</h4>
                    <p className="text-slate-500 text-sm">You can't ask a video to explain it differently.</p>
                  </div>
                </div>
                <div className="flex gap-4 opacity-50">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0"><X size={20}/></div>
                  <div>
                    <h4 className="font-semibold text-lg text-slate-300">Private Tutors</h4>
                    <p className="text-slate-500 text-sm">Cost $60+/hr and aren't available at 11 PM.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-20"></div>
              <div className="relative glass-surface rounded-2xl p-8 md:p-12">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Droplets className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">The Dewon Method</h3>
                    <p className="text-cyan-400 text-sm font-medium">ALWAYS ON • VISUAL • PATIENT</p>
                  </div>
                </div>
                <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                  "It's like sitting next to the smartest person in class, but they never get annoyed, and they have a magic whiteboard."
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span>Backed by Google Gemini Models</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing / Access */}
      <div ref={pricingRef} className="py-24 relative z-10 bg-[#020617]">
        <div className="max-w-4xl mx-auto px-6 text-center">
           <h2 className="text-3xl font-semibold mb-12">Simple pricing. <br/><span className="text-slate-500">Education shouldn't be a luxury.</span></h2>
           
           <div className="glass-surface max-w-md mx-auto rounded-3xl p-1 border-t border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.1)]">
             <div className="bg-[#03081c] rounded-[22px] p-8 sm:p-12">
               <div className="inline-block px-4 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-widest mb-4">PUBLIC BETA</div>
               <div className="text-5xl font-bold text-white mb-2">Free</div>
               <p className="text-slate-400 mb-8 text-sm">Forever access for early adopters.</p>
               
               <ul className="text-left space-y-4 mb-8 max-w-xs mx-auto">
                 <li className="flex items-center gap-3 text-slate-300"><Check size={18} className="text-cyan-400"/> Unlimited Conversations</li>
                 <li className="flex items-center gap-3 text-slate-300"><Check size={18} className="text-cyan-400"/> Smart Canvas Access</li>
                 <li className="flex items-center gap-3 text-slate-300"><Check size={18} className="text-cyan-400"/> Context Uploads (PDF/Img)</li>
               </ul>
               
               <button 
                onClick={onGetStarted}
                className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-colors"
               >
                 Get Started Now
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-24 relative z-10 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-8 text-center">Common Questions</h2>
          <div className="glass-surface rounded-2xl p-2 sm:p-8">
            <FAQItem 
              question="Is Dew a real person?" 
              answer="No, Dew is a highly advanced AI trained on educational methodologies. It doesn't sleep, doesn't judge, and is always ready to draw out a solution."
            />
            <FAQItem 
              question="What subjects can I ask about?" 
              answer="Dew excels at STEM (Science, Tech, Engineering, Math) because of its visual nature, but it can help with History, Logic, and Writing structure too."
            />
            <FAQItem 
              question="Can I use this on my phone?" 
              answer="Yes. The interface adapts perfectly to mobile. It's designed to be a tutor in your pocket."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center sm:text-left">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
           <Logo size="sm" />
           <div className="text-xs text-slate-600">
             &copy; 2025 Dewon Inc. Built for the curious.
           </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;