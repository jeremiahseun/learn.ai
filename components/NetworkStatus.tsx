
import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { ConnectionState } from '../types';

interface NetworkStatusProps {
  state: ConnectionState;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ state }) => {
  const [bars, setBars] = useState(0);

  useEffect(() => {
    if (state === ConnectionState.CONNECTED) {
      setBars(4);
      // Simulate fluctuation
      const interval = setInterval(() => {
        setBars(3 + Math.round(Math.random())); // 3 or 4 bars
      }, 2000);
      return () => clearInterval(interval);
    } else if (state === ConnectionState.CONNECTING) {
      const interval = setInterval(() => {
        setBars(b => (b + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setBars(0);
    }
  }, [state]);

  const getColor = () => {
    if (state === ConnectionState.CONNECTED) return 'text-green-400';
    if (state === ConnectionState.CONNECTING) return 'text-yellow-400';
    if (state === ConnectionState.ERROR) return 'text-red-400';
    return 'text-slate-600';
  };

  const getLabel = () => {
     if (state === ConnectionState.CONNECTED) return 'Live';
     if (state === ConnectionState.CONNECTING) return 'Connecting...';
     if (state === ConnectionState.DISCONNECTED) return 'Offline';
     return 'Error';
  };

  return (
    <div className="flex items-center gap-2 px-2" title={`Connection Status: ${state}`}>
       <div className={`flex items-end gap-0.5 h-3 ${getColor()}`}>
          <div className={`w-1 rounded-sm ${bars > 0 ? 'h-1.5' : 'h-1 opacity-20'}`}></div>
          <div className={`w-1 rounded-sm ${bars > 1 ? 'h-2' : 'h-1.5 opacity-20'}`}></div>
          <div className={`w-1 rounded-sm ${bars > 2 ? 'h-2.5' : 'h-2 opacity-20'}`}></div>
          <div className={`w-1 rounded-sm ${bars > 3 ? 'h-3' : 'h-2.5 opacity-20'}`}></div>
       </div>
       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:block">
         {getLabel()}
       </span>
    </div>
  );
};

export default NetworkStatus;
