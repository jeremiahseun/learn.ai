import React from 'react';
import { Droplets } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  };
  
  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 36,
    xl: 56
  };

  return (
    <div className={`flex items-center gap-2 font-bold tracking-tight ${sizeClasses[size]} ${className} group`}>
      <div className="relative flex items-center justify-center">
        <div className={`absolute inset-0 bg-cyan-400 blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full`}></div>
        <div className="relative z-10">
          <Droplets size={iconSizes[size]} className="text-cyan-400 fill-cyan-400/20" />
        </div>
      </div>
      <span className="font-sans text-white tracking-tight">
        dewon
      </span>
    </div>
  );
};

export default Logo;