import { useState, useEffect } from 'react';
import { getSupabase } from '@/integrations/supabase/client';

export const useRealtimeStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    // Simple connection status tracking without realtime channels
    // The main realtime functionality is handled in useNotifications
    setIsConnected(true);
    setIsReconnecting(false);

    // Only listen to browser connectivity
    const handleOnline = () => {
      setIsConnected(true);
      setIsReconnecting(false);
    };

    const handleOffline = () => {
      setIsConnected(false);
      setIsReconnecting(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isConnected, isReconnecting };
};