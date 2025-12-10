import React, { useRef, useState, useEffect } from 'react';
import { 
  ArrowRight, Mic, PenTool, BrainCircuit, Sparkles, Zap, 
  Check, Play, Users, Clock, Star, MessageCircle, Lightbulb, 
  GraduationCap, X, ChevronDown, CheckCircle2, ShieldCheck
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

// Custom CSS for animations to ensure it works without external config
const CustomStyles = () => (
  <style>{`
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes reverse-spin {
      from { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
    .animate-spin-slow { animation: spin-slow 20s linear infinite; }
    .animate-reverse-spin { animation: reverse-spin 25s linear infinite; }
    .glass-panel {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .holo-gradient-text {
      background: linear-gradient(to right, #22d3ee, #e879f9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  `}</style>
);

const Logo = ({ size = "md" }) => (
  <div className="flex items-center gap-2 select-none">
    <div className="relative">
      <BrainCircuit className={size === "md" ? "w-8 h-8 text-cyan-400" : "w-6 h-6 text-cyan-400"} />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
    </div>
    <span className={`font-bold tracking-tight text-white ${size === "md" ? "text-xl" : "text-lg"}`}>
      Learn<span className="text-cyan-400">.ai</span>
    </span>
  </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-cyan-400 transition-colors"
      >
        <span className="font-medium text-lg">{question}</span>
        <ChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const socialProofRef = useRef<HTMLDivElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const testimonials = [
    { name: "Sarah Chen", role: "High School Student", text: "Finally, a tutor that doesn't judge me for asking 'stupid' questions. I can pause, rewind with my voice, and actually understand calculus now.", avatar: "👩‍🎓" },
    { name: "Marcus Johnson", role: "Parent of 3", text: "My kids fight over screen time to use Learn.ai. That's when I knew this was different. It's like having a patient teacher available 24/7.", avatar: "👨‍👦" },
    { name: "Dr. Amanda Liu", role: "College Professor", text: "I use it to prep for lectures. The AI challenges my explanations and helps me think through complex proofs in real-time.", avatar: "👩‍🏫" }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans">
      <CustomStyles />
      
      {/* Enhanced Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full mix-blend-screen animate-pulse-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen animate-pulse-glow" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-pink-500/5 blur-[120px] rounded-full mix-blend-screen animate-pulse-glow" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Video Modal Overlay */}
      {isVideoPlaying && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-video">
            <button 
              onClick={() => setIsVideoPlaying(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-white/20 rounded-full transition-all"
            >
              <X className="text-white" />
            </button>
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-slate-900">
               {/* This is a placeholder for the actual video player */}
               <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-cyan-400 font-mono text-sm animate-pulse">LOADING NEURAL INTERFACE...</p>
               <p className="text-slate-500 text-xs">(In production, embed YouTube/Vimeo/MP4 here)</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection(featuresRef)} className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">How it Works</button>
            <button onClick={() => scrollToSection(socialProofRef)} className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">Stories</button>
            <button onClick={() => scrollToSection(pricingRef)} className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">Pricing</button>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[10px] tracking-widest uppercase text-cyan-400 font-bold px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">BETA ACCESS</span>
            <button 
              onClick={onGetStarted}
              className="text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 sm:px-6 py-2.5 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              Try Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Social Proof Banner */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-950/40 to-purple-950/40 border border-cyan-500/30 backdrop-blur-sm animate-float">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-[#020617]"></div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-[#020617]"></div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-[#020617]"></div>
              </div>
              <span className="text-xs font-semibold text-cyan-300"><span className="text-white">2,847</span> students online now</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                The moment it<br/>
                <span className="holo-gradient-text animate-pulse-glow">
                  finally clicks.
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                Stop struggling in silence. Get a patient, AI tutor that explains things <span className="text-white font-semibold">exactly the way you need</span>. Voice. Vision. Zero judgment.
              </p>

              {/* Mini Feature Pills */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-10">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                  <Clock size={16} className="text-cyan-400" />
                  <span>Instant 24/7</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                  <Mic size={16} className="text-purple-400" />
                  <span>Talk naturally</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                  <PenTool size={16} className="text-pink-400" />
                  <span>Interactive Board</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button 
                  onClick={onGetStarted}
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-base sm:text-lg font-bold text-black transition-all duration-300 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full focus:outline-none hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:shadow-[0_0_40px_rgba(34,211,238,0.8)] hover:scale-105"
                >
                  Start Learning Free
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <button 
                  onClick={() => setIsVideoPlaying(true)}
                  className="flex items-center gap-2 px-6 py-4 text-base sm:text-lg font-medium text-slate-200 hover:text-white transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all">
                    <Play size={16} fill="white" />
                  </div>
                  See it in action
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-6">No credit card required • Works on Mobile & Web</p>
            </div>

            {/* Right Visual - Interactive Hologram */}
            <div className="relative flex items-center justify-center h-[400px] sm:h-[500px]">
               {/* Orbital Rings */}
               <div className="absolute w-[90%] sm:w-[500px] h-[90%] sm:h-[500px] border border-cyan-500/20 rounded-full animate-spin-slow"></div>
               <div className="absolute w-[75%] sm:w-[400px] h-[75%] sm:h-[400px] border border-purple-500/20 rounded-full animate-reverse-spin"></div>
               <div className="absolute w-[60%] sm:w-[300px] h-[60%] sm:h-[300px] border border-white/10 rounded-full animate-spin-slow" style={{animationDuration: '30s'}}></div>
               
               {/* Central Core */}
               <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full animate-float">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 to-purple-600/40 rounded-full blur-2xl animate-pulse-glow"></div>
                  <div className="absolute inset-2 bg-gradient-to-br from-[#020617] to-[#0a0e1f] rounded-full border border-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-[0_0_60px_rgba(34,211,238,0.3)]">
                      {/* Abstract Neural Network Background */}
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400 via-gray-900 to-black"></div>
                      
                      <div className="relative z-10 flex flex-col items-center gap-4">
                         <div className="relative">
                           <BrainCircuit size={48} className="text-cyan-400 animate-pulse" />
                           <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-[#020617] animate-pulse"></div>
                         </div>
                         {/* Audio Visualizer Bars */}
                         <div className="flex gap-1.5 items-end h-10">
                            <div className="w-1.5 bg-gradient-to-t from-cyan-400 to-cyan-300 rounded-full animate-[bounce_1s_infinite] h-5"></div>
                            <div className="w-1.5 bg-gradient-to-t from-purple-400 to-purple-300 rounded-full animate-[bounce_1.2s_infinite] h-10"></div>
                            <div className="w-1.5 bg-gradient-to-t from-pink-400 to-pink-300 rounded-full animate-[bounce_0.8s_infinite] h-6"></div>
                            <div className="w-1.5 bg-gradient-to-t from-blue-400 to-blue-300 rounded-full animate-[bounce_1.4s_infinite] h-8"></div>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="relative flex h-2 w-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                           </span>
                           <span className="text-xs font-mono text-green-300 tracking-widest font-bold">LISTENING</span>
                         </div>
                      </div>
                  </div>
               </div>

               {/* Floating Context Cards */}
               <div className="absolute top-5 sm:top-10 right-5 sm:right-10 glass-panel p-3 sm:p-4 rounded-xl animate-float shadow-lg hover:scale-105 transition-transform cursor-default" style={{animationDelay: '1s'}}>
                  <MessageCircle className="text-cyan-400 mb-2" size={20} />
                  <div className="text-[10px] sm:text-xs text-slate-400 mb-1">Student asks:</div>
                  <div className="text-xs font-medium text-white">"Why is the sky blue?"</div>
               </div>
               <div className="absolute bottom-16 sm:bottom-20 left-5 sm:left-10 glass-panel p-3 sm:p-4 rounded-xl animate-float shadow-lg hover:scale-105 transition-transform cursor-default" style={{animationDelay: '2s'}}>
                  <Lightbulb className="text-yellow-400 mb-2" size={20} />
                  <div className="text-[10px] sm:text-xs text-slate-400 mb-1">AI explains:</div>
                  <div className="text-xs font-medium text-white">"It's called Rayleigh scattering..."</div>
                  <div className="mt-2 h-1 w-full bg-yellow-400/20 rounded-full overflow-hidden">
                     <div className="h-full bg-yellow-400 w-2/3 animate-pulse"></div>
                  </div>
               </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto border-t border-white/5 pt-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-1">45k+</div>
              <div className="text-xs sm:text-sm text-slate-400">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-1">98%</div>
              <div className="text-xs sm:text-sm text-slate-400">"Finally Get It" Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-pink-400 mb-1">&lt;500ms</div>
              <div className="text-xs sm:text-sm text-slate-400">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">24/7</div>
              <div className="text-xs sm:text-sm text-slate-400">Always Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem/Solution Section */}
      <div className="py-16 sm:py-24 relative z-10 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Why students <span className="text-red-400">give up</span></h2>
              <div className="space-y-4">
                <div className="flex gap-4 items-start p-4 rounded-xl bg-red-950/20 border border-red-500/20 hover:border-red-500/40 transition-colors">
                  <div className="text-2xl grayscale opacity-70">😴</div>
                  <div>
                    <div className="font-semibold mb-1 text-red-200">YouTube tutorials are lifeless</div>
                    <div className="text-sm text-slate-400">You can't pause a video to ask "wait, why?" and get a real answer specific to your confusion.</div>
                  </div>
                </div>
                <div className="flex gap-4 items-start p-4 rounded-xl bg-red-950/20 border border-red-500/20 hover:border-red-500/40 transition-colors">
                  <div className="text-2xl grayscale opacity-70">😰</div>
                  <div>
                    <div className="font-semibold mb-1 text-red-200">Tutors are expensive & scary</div>
                    <div className="text-sm text-slate-400">$60/hour. Rigid schedules. The anxiety of feeling judged when you don't understand immediately.</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Why Learn.ai works <span className="text-green-400">better</span></h2>
              <div className="space-y-4">
                <div className="flex gap-4 items-start p-4 rounded-xl bg-green-950/20 border border-green-500/20 hover:border-green-500/40 transition-colors">
                  <div className="text-2xl">🗣️</div>
                  <div>
                    <div className="font-semibold mb-1 text-green-200">A real conversation</div>
                    <div className="text-sm text-slate-400">Interrupt. Ask "dumb" questions. Go off on tangents. The AI keeps up and guides you back.</div>
                  </div>
                </div>
                <div className="flex gap-4 items-start p-4 rounded-xl bg-green-950/20 border border-green-500/20 hover:border-green-500/40 transition-colors">
                  <div className="text-2xl">🎨</div>
                  <div>
                    <div className="font-semibold mb-1 text-green-200">Visuals that click</div>
                    <div className="text-sm text-slate-400">Complex concepts become simple diagrams drawn in real-time, perfectly synced with the voice explanation.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div ref={featuresRef} className="py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Your learning journey in <span className="text-cyan-400">3 steps</span></h2>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">From confused to confident in one session</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { num: 1, title: "Just start talking", desc: "Speak naturally. 'Hey, I don't get Newton's 3rd Law.'", icon: <Mic size={16} />, color: "cyan" },
              { num: 2, title: "Watch it come alive", desc: "The AI draws diagrams and explains while it writes.", icon: <PenTool size={16} />, color: "purple" },
              { num: 3, title: "Ask follow-ups", desc: "Drill down until you get that 'Aha!' moment.", icon: <Zap size={16} />, color: "green" }
            ].map((step, idx) => (
              <div key={idx} className={`glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-${step.color}-500/30 transition-all`}>
                <div className={`absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-${step.color}-500/10 blur-[60px] sm:blur-[80px] rounded-full group-hover:bg-${step.color}-500/20 transition-all duration-500`}></div>
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-full bg-${step.color}-500/20 border border-${step.color}-500 flex items-center justify-center text-xl sm:text-2xl font-bold text-${step.color}-400 mb-4`}>{step.num}</div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-slate-400 mb-4 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing / Value Anchor Section */}
      <div ref={pricingRef} className="py-16 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">World-class tutoring for <span className="text-cyan-400">everyone</span></h2>
            <p className="text-slate-400">We believe great education shouldn't be a luxury.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* The Old Way */}
            <div className="rounded-3xl p-8 border border-white/10 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
               <h3 className="text-xl font-bold mb-2">Private Human Tutor</h3>
               <div className="text-3xl font-bold mb-6 text-slate-300">$60<span className="text-lg font-normal text-slate-500">/hour</span></div>
               <ul className="space-y-4 text-slate-400">
                  <li className="flex items-center gap-3"><X size={18} /> Available once a week</li>
                  <li className="flex items-center gap-3"><X size={18} /> Can be judgmental</li>
                  <li className="flex items-center gap-3"><X size={18} /> Hard to schedule</li>
               </ul>
            </div>

            {/* The Learn.ai Way */}
            <div className="rounded-3xl p-8 bg-gradient-to-b from-cyan-950/30 to-slate-900 border border-cyan-500/50 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">BETA OFFER</div>
               <h3 className="text-xl font-bold mb-2 text-white">Learn.ai Personal AI</h3>
               <div className="text-3xl font-bold mb-6 text-cyan-400">Free<span className="text-lg font-normal text-slate-400"> during beta</span></div>
               <ul className="space-y-4 text-slate-200">
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-400"/> Available 24/7 instantly</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-400"/> Zero judgment, infinite patience</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-green-400"/> Visual & Voice explanations</li>
               </ul>
               <button onClick={onGetStarted} className="w-full mt-8 bg-white text-black font-bold py-3 rounded-xl hover:bg-cyan-50 text-center transition-colors">
                 Claim Beta Access
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div ref={socialProofRef} className="py-16 sm:py-24 relative z-10 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Real students. Real breakthroughs.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="glass-panel rounded-2xl p-6 sm:p-8 hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl sm:text-4xl bg-white/5 rounded-full w-12 h-12 flex items-center justify-center">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-slate-400">{testimonial.role}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#22d3ee" className="text-cyan-400" />)}
                </div>
                <p className="text-sm sm:text-base text-slate-300 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section - Handling Objections */}
      <div className="py-16 sm:py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="glass-panel rounded-2xl p-6 sm:p-8">
            <FAQItem 
              question="Does this actually work for complex math?" 
              answer="Yes. We use Deep Think models specifically trained on STEM subjects. It can handle everything from basic algebra to college-level calculus and physics proofs."
            />
            <FAQItem 
              question="Is it suitable for younger children?" 
              answer="We recommend it for ages 12+. The AI adapts its vocabulary to the user's level, but the interface is optimized for middle school through university students."
            />
            <FAQItem 
              question="Can I use it on my phone?" 
              answer="Absolutely. Learn.ai is fully responsive and works beautifully in mobile browsers. It's like having a tutor in your pocket."
            />
             <FAQItem 
              question="Why is it free right now?" 
              answer="We are in public beta. We want your feedback to make the AI smarter. Early users who join now will lock in special perks forever."
            />
          </div>
        </div>
      </div>

      {/* Beta CTA Footer */}
      <div className="pb-16 px-4 sm:px-6">
        <div className="text-center glass-panel rounded-3xl p-8 sm:p-16 max-w-5xl mx-auto border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 to-purple-950/30 relative overflow-hidden">
           {/* Background glow effects */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 blur-[100px] rounded-full"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full"></div>
           
           <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles size={14} />
                Beta Access Closing Soon
              </div>
              <h3 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">Ready to finally <span className="text-white">understand?</span></h3>
              <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">Join thousands of students who have switched from frustration to confidence.</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={onGetStarted}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black bg-white rounded-full hover:bg-cyan-50 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  Start Learning Now
                </button>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                   <ShieldCheck size={16} />
                   <span>No credit card needed</span>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <Logo size="sm" />
           <div className="flex gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
           </div>
           <div className="text-xs text-slate-600">
             © 2024 Learn.ai Inc. All rights reserved.
           </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;