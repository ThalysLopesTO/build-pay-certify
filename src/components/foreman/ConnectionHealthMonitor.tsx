import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionHealthMonitorProps {
  children: React.ReactNode;
}

const ConnectionHealthMonitor: React.FC<ConnectionHealthMonitorProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const [lastPingTime, setLastPingTime] = useState<number>(0);

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ping Supabase to check actual connection quality
  useEffect(() => {
    const pingSupabase = async () => {
      if (!isOnline) {
        setConnectionQuality('offline');
        return;
      }

      try {
        const startTime = Date.now();
        const { error } = await supabase
          .from('companies')
          .select('id')
          .limit(1);
        
        const endTime = Date.now();
        const pingTime = endTime - startTime;
        setLastPingTime(pingTime);

        if (error) {
          setConnectionQuality('poor');
        } else if (pingTime > 3000) {
          setConnectionQuality('poor');
        } else {
          setConnectionQuality('good');
        }
      } catch {
        setConnectionQuality('poor');
      }
    };

    // Initial ping
    pingSupabase();

    // Ping every 30 seconds when online
    const interval = setInterval(pingSupabase, 30000);

    return () => clearInterval(interval);
  }, [isOnline]);

  const getStatusDisplay = () => {
    if (!isOnline || connectionQuality === 'offline') {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        text: 'Offline',
        className: 'bg-red-100 text-red-700 border-red-200'
      };
    }

    if (connectionQuality === 'poor') {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Poor Connection',
        className: 'bg-amber-100 text-amber-700 border-amber-200'
      };
    }

    return {
      icon: <Wifi className="h-4 w-4" />,
      text: 'Online',
      className: 'bg-green-100 text-green-700 border-green-200'
    };
  };

  const status = getStatusDisplay();

  return (
    <div className="relative">
      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${status.className}`}>
          {status.icon}
          <span>{status.text}</span>
          {connectionQuality === 'good' && lastPingTime > 0 && (
            <span className="text-xs opacity-75">({lastPingTime}ms)</span>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

export default ConnectionHealthMonitor;