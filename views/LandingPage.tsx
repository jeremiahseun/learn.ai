import React, { useRef } from 'react';
import { ArrowRight, Mic, PenTool, BrainCircuit, Sparkles, Zap, Check } from 'lucide-react';
import Logo from '../components/Logo';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen animate-pulse-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen animate-pulse-glow" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection(featuresRef)} className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">Features</button>
            <button onClick={() => scrollToSection(pricingRef)} className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">Pricing</button>
          </div>
          <button 
            onClick={onGetStarted}
            className="text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-2.5 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-40 pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-8 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Powered by Gemini 2.5 Live
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              Your AI Tutor.<br/>
              <span className="holo-gradient-text animate-pulse-glow">
                Alive & Visual.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Forget static videos. Experience a real-time holographic whiteboard where the AI speaks, listens, and draws complex concepts instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button 
                onClick={onGetStarted}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black transition-all duration-200 bg-cyan-400 font-pj rounded-full focus:outline-none hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:shadow-[0_0_30px_rgba(34,211,238,0.8)]"
              >
                Start Learning
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => scrollToSection(featuresRef)} className="px-8 py-4 text-lg font-medium text-slate-300 hover:text-white transition-colors">
                How it works
              </button>
            </div>
          </div>

          {/* Right Visual (Holo Avatar) */}
          <div className="relative flex items-center justify-center h-[500px]">
             {/* Orbital Rings */}
             <div className="absolute w-[500px] h-[500px] border border-cyan-500/20 rounded-full animate-spin-slow"></div>
             <div className="absolute w-[400px] h-[400px] border border-purple-500/20 rounded-full animate-reverse-spin"></div>
             <div className="absolute w-[300px] h-[300px] border border-white/10 rounded-full animate-spin-slow" style={{animationDuration: '30s'}}></div>
             
             {/* Central Core */}
             <div className="relative w-64 h-64 rounded-full animate-float">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-purple-600/30 rounded-full blur-xl animate-pulse-glow"></div>
                <div className="absolute inset-2 bg-[#020617] rounded-full border border-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop')] opacity-20 bg-cover mix-blend-overlay"></div>
                   <div className="relative z-10 flex flex-col items-center gap-4">
                      <BrainCircuit size={48} className="text-cyan-400" />
                      <div className="flex gap-1 items-end h-8">
                         <div className="w-1.5 bg-cyan-400 rounded-full animate-[bounce_1s_infinite] h-4"></div>
                         <div className="w-1.5 bg-purple-400 rounded-full animate-[bounce_1.2s_infinite] h-8"></div>
                         <div className="w-1.5 bg-pink-400 rounded-full animate-[bounce_0.8s_infinite] h-5"></div>
                      </div>
                      <span className="text-xs font-mono text-cyan-300 tracking-widest">ONLINE</span>
                   </div>
                </div>
             </div>

             {/* Floating Elements */}
             <div className="absolute top-10 right-10 glass-panel p-4 rounded-xl animate-float" style={{animationDelay: '1s'}}>
                <PenTool className="text-pink-400 mb-2" size={20} />
                <div className="h-2 w-20 bg-white/10 rounded-full"></div>
             </div>
             <div className="absolute bottom-20 left-10 glass-panel p-4 rounded-xl animate-float" style={{animationDelay: '2s'}}>
                <Mic className="text-cyan-400 mb-2" size={20} />
                <div className="h-2 w-16 bg-white/10 rounded-full"></div>
             </div>
          </div>
        </div>
      </div>

      {/* Features Bento Grid */}
      <div ref={featuresRef} className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Future Intelligence. <span className="text-slate-500">Present Day.</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1: Large */}
            <div className="md:col-span-2 glass-panel rounded-3xl p-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 blur-[80px] rounded-full group-hover:bg-cyan-500/30 transition-all duration-500"></div>
               <div className="relative z-10 h-full flex flex-col justify-between">
                 <div className="p-3 bg-cyan-500/10 w-fit rounded-xl border border-cyan-500/20 mb-4">
                    <Zap className="text-cyan-400" size={24} />
                 </div>
                 <div>
                   <h3 className="text-2xl font-bold mb-2">Real-Time Latency</h3>
                   <p className="text-slate-400 text-lg">Talk naturally. Interrupt anytime. The AI responds instantly with zero lag, making it feel like a human tutor in the room.</p>
                 </div>
               </div>
            </div>

            {/* Feature 2: Tall */}
            <div className="md:row-span-2 glass-panel rounded-3xl p-8 relative overflow-hidden group">
               <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-purple-900/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
               <div className="relative z-10 h-full flex flex-col justify-between">
                 <div>
                    <div className="p-3 bg-purple-500/10 w-fit rounded-xl border border-purple-500/20 mb-6">
                        <PenTool className="text-purple-400" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Semantic Whiteboard</h3>
                    <p className="text-slate-400">The AI doesn't just generate images. It understands geometry, draws flowcharts, writes formulas, and highlights key areas as it speaks.</p>
                 </div>
                 <div className="mt-8 border border-white/10 rounded-xl bg-black/40 p-4 backdrop-blur-sm">
                    {/* Mock Board */}
                    <div className="flex justify-center gap-4 items-center h-32 opacity-80">
                       <div className="w-12 h-12 rounded-full border-2 border-cyan-400"></div>
                       <div className="h-0.5 w-12 bg-white"></div>
                       <div className="w-12 h-12 border-2 border-purple-400"></div>
                    </div>
                 </div>
               </div>
            </div>

            {/* Feature 3: Small */}
            <div className="glass-panel rounded-3xl p-8 relative overflow-hidden group">
               <div className="relative z-10">
                 <div className="p-3 bg-pink-500/10 w-fit rounded-xl border border-pink-500/20 mb-4">
                    <BrainCircuit className="text-pink-400" size={24} />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Deep Think Mode</h3>
                 <p className="text-slate-400">Complex physics or calculus? Switch to Pro mode for 32k token reasoning steps.</p>
               </div>
            </div>

            {/* Feature 4: Small */}
            <div className="glass-panel rounded-3xl p-8 relative overflow-hidden group">
               <div className="relative z-10">
                 <div className="p-3 bg-green-500/10 w-fit rounded-xl border border-green-500/20 mb-4">
                    <Sparkles className="text-green-400" size={24} />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Adaptive Learning</h3>
                 <p className="text-slate-400">The AI builds a profile of your skills and adjusts its teaching pace automatically.</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div ref={pricingRef} className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
           <h2 className="text-4xl font-bold text-center mb-4">Transparent Pricing</h2>
           <p className="text-center text-slate-400 mb-16">Invest in your education for less than a cup of coffee.</p>

           <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
              {/* Basic */}
              <div className="glass-panel rounded-2xl p-8 border border-white/5 opacity-70 hover:opacity-100 transition-opacity">
                 <h3 className="text-xl font-bold mb-2">Starter</h3>
                 <div className="text-3xl font-bold mb-6">Free</div>
                 <ul className="space-y-4 text-slate-400 mb-8">
                    <li className="flex gap-2"><Check size={18} className="text-cyan-400"/> 5 mins/day Live API</li>
                    <li className="flex gap-2"><Check size={18} className="text-cyan-400"/> 1 Board</li>
                    <li className="flex gap-2"><Check size={18} className="text-cyan-400"/> Standard Latency</li>
                 </ul>
                 <button onClick={onGetStarted} className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-colors font-medium">Get Started</button>
              </div>

              {/* Pro (Highlighted) */}
              <div className="glass-panel rounded-2xl p-8 border border-cyan-500/50 bg-cyan-950/10 relative transform md:scale-110 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    Most Popular
                 </div>
                 <h3 className="text-xl font-bold mb-2 text-cyan-400">Scholar</h3>
                 <div className="text-4xl font-bold mb-6">$12<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                 <ul className="space-y-4 text-slate-300 mb-8">
                    <li className="flex gap-2"><Check size={18} className="text-cyan-400"/> Unlimited Live Sessions</li>
                    <li className="flex gap-2"><Check size={18} className="text-cyan-400"/> Unlimited Boards</li>
                    <li className="flex gap-2"><Check size={18} className="text-cyan-400"/> Deep Think Access (32k)</li>
                    <li className="flex gap-2"><Check size={18} className="text-cyan-400"/> Lesson History & Export</li>
                 </ul>
                 <button onClick={onGetStarted} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all shadow-lg">Start Free Trial</button>
              </div>

              {/* Enterprise */}
              <div className="glass-panel rounded-2xl p-8 border border-white/5 opacity-70 hover:opacity-100 transition-opacity">
                 <h3 className="text-xl font-bold mb-2">School</h3>
                 <div className="text-3xl font-bold mb-6">Custom</div>
                 <ul className="space-y-4 text-slate-400 mb-8">
                    <li className="flex gap-2"><Check size={18} className="text-cyan-400"/> Classroom Management</li>
                    <li className="flex gap-2"><Check size={18} className="text-cyan-400"/> Admin Dashboard</li>
                    <li className="flex gap-2"><Check size={18} className="text-cyan-400"/> API Integration</li>
                 </ul>
                 <button className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-colors font-medium">Contact Sales</button>
              </div>
           </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#020617] text-center text-slate-600 text-sm relative z-10">
        <p>&copy; {new Date().getFullYear()} Learn.ai. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default LandingPage;