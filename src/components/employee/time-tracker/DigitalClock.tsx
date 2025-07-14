
import React, { useState, useEffect } from 'react';

const DigitalClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 animate-pulse"></div>
      
      {/* Digital clock display */}
      <div className="relative z-10">
        <div className="text-5xl md:text-6xl lg:text-7xl font-mono font-black tracking-wider text-center bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent animate-pulse">
          {formatTime(currentTime)}
        </div>
        <div className="text-slate-300 text-lg font-medium mt-4 text-center tracking-wide">
          Current Time
        </div>
      </div>
      
      {/* Corner accent elements */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-blue-400/50 rounded-tl-lg"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-blue-400/50 rounded-tr-lg"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-blue-400/50 rounded-bl-lg"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-blue-400/50 rounded-br-lg"></div>
    </div>
  );
};

export default DigitalClock;
