
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-6">
      {/* Time Display */}
      <div className="text-center">
        <div className="text-4xl md:text-5xl font-mono font-bold tracking-wider text-primary mb-2">
          {formatTime(currentTime)}
        </div>
        
        {/* Date Display */}
        <div className="text-sm text-muted-foreground mb-3">
          {formatDate(currentTime)}
        </div>
        
        {/* Current Time Label */}
        <div className="text-xs text-muted-foreground/80 uppercase tracking-wide font-medium">
          Current Time
        </div>
      </div>
    </div>
  );
};

export default DigitalClock;
