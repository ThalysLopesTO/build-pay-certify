
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
    <div className="bg-slate-900 text-white p-6 rounded-xl">
      <div className="text-4xl md:text-5xl font-mono font-bold tracking-wider">
        {formatTime(currentTime)}
      </div>
      <div className="text-slate-300 text-sm mt-2">
        Current Time
      </div>
    </div>
  );
};

export default DigitalClock;
