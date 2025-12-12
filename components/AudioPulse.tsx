
import React from 'react';

interface AudioPulseProps {
  active: boolean;
  volume: number; // 0 to 1
  color: 'blue' | 'purple' | 'red' | 'cyan';
  label?: string;
}

const AudioPulse: React.FC<AudioPulseProps> = ({ active, volume, color, label }) => {
  // Visualizer style similar to Google Meet
  // 3 bars, center aligned, animating height based on volume

  const getColorClass = () => {
    switch (color) {
      case 'purple': return 'bg-purple-500';
      case 'red': return 'bg-red-500';
      case 'blue': return 'bg-blue-500';
      case 'cyan': return 'bg-cyan-400';
      default: return 'bg-slate-500';
    }
  };

  // Clamp volume for animation
  const v = Math.min(1, Math.max(0, volume));
  
  // Animation Heights:
  // Bar 1 & 3: slightly lower than Bar 2
  // If inactive: small dots
  const h1 = active ? Math.max(20, v * 80) : 20;
  const h2 = active ? Math.max(20, v * 100) : 20;
  const h3 = active ? Math.max(20, v * 80) : 20;

  return (
    <div className="flex flex-col items-center justify-center gap-1 min-w-[32px]">
      <div className="flex items-center justify-center gap-1 h-6">
         <div 
           className={`w-1.5 rounded-full transition-all duration-75 ${getColorClass()} ${active ? '' : 'opacity-40'}`} 
           style={{ height: `${h1}%` }} 
         />
         <div 
           className={`w-1.5 rounded-full transition-all duration-75 ${getColorClass()} ${active ? '' : 'opacity-40'}`} 
           style={{ height: `${h2}%` }} 
         />
         <div 
           className={`w-1.5 rounded-full transition-all duration-75 ${getColorClass()} ${active ? '' : 'opacity-40'}`} 
           style={{ height: `${h3}%` }} 
         />
      </div>
      {label && <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>}
    </div>
  );
};

export default AudioPulse;
