import React from 'react';
import { Sparkles } from 'lucide-react';

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
    <div className={`flex items-center gap-2 font-bold tracking-tight ${sizeClasses[size]} ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className={`absolute inset-0 bg-blue-500 blur-lg opacity-50 rounded-full animate-pulse`}></div>
        <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-1.5 shadow-xl border border-blue-400/30">
          <Sparkles size={iconSizes[size]} className="text-white fill-blue-100" />
        </div>
      </div>
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200">
        Learn<span className="text-blue-500">.ai</span>
      </span>
    </div>
  );
};

export default Logo;