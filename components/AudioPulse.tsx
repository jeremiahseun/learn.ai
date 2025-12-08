import React from 'react';

interface AudioPulseProps {
  active: boolean;
  volume: number; // 0 to 1
  color: 'blue' | 'purple' | 'red';
  label?: string;
}

const AudioPulse: React.FC<AudioPulseProps> = ({ active, volume, color, label }) => {
  // Generate 3 bars with slightly different behaviors based on volume
  // We use the volume to scale the height.
  // When not active, show small dots.

  const getColorClass = () => {
    switch (color) {
      case 'purple': return 'bg-purple-500';
      case 'red': return 'bg-red-500';
      case 'blue': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const getShadowClass = () => {
    switch (color) {
      case 'purple': return 'shadow-[0_0_10px_rgba(168,85,247,0.5)]';
      case 'red': return 'shadow-[0_0_10px_rgba(239,68,68,0.5)]';
      case 'blue': return 'shadow-[0_0_10px_rgba(59,130,246,0.5)]';
      default: return '';
    }
  };

  // Amplify low volumes for better visibility
  const visualVolume = active ? Math.min(1, Math.max(0.1, volume * 3)) : 0.1;

  return (
    <div className="flex flex-col items-center justify-center space-y-1 w-16">
      <div className="flex items-end justify-center space-x-1 h-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-75 ${getColorClass()} ${active ? getShadowClass() : 'opacity-30'}`}
            style={{
              height: active 
                ? `${Math.max(20, visualVolume * 100 * (1 + Math.sin(Date.now() / 100 + i) * 0.2))}%` 
                : '20%'
            }}
          />
        ))}
      </div>
      {label && <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{label}</span>}
    </div>
  );
};

export default AudioPulse;
