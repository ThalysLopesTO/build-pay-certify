import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionState {
  isOnline: boolean;
  isSupabaseConnected: boolean;
  lastChecked: Date;
  retryCount: number;
}

export const useConnectionMonitor = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isOnline: navigator.onLine,
    isSupabaseConnected: true,
    lastChecked: new Date(),
    retryCount: 0,
  });
  
  const queryClient = useQueryClient();

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionState(prev => ({
        ...prev,
        isOnline: true,
        retryCount: 0,
      }));
      
      // Resume queries when back online
      queryClient.resumePausedMutations();
      queryClient.invalidateQueries();
    };

    const handleOffline = () => {
      setConnectionState(prev => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);

  // Monitor Supabase connection health
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Simple health check query
        const { error } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
          .single();

        const isConnected = !error || error.code !== 'PGRST301'; // Not a connection error

        setConnectionState(prev => ({
          ...prev,
          isSupabaseConnected: isConnected,
          lastChecked: new Date(),
          retryCount: isConnected ? 0 : prev.retryCount + 1,
        }));

        // If connection restored, invalidate queries
        if (isConnected && !connectionState.isSupabaseConnected) {
          queryClient.invalidateQueries();
        }
      } catch (error) {
        setConnectionState(prev => ({
          ...prev,
          isSupabaseConnected: false,
          lastChecked: new Date(),
          retryCount: prev.retryCount + 1,
        }));
      }
    };

    // Check connection periodically, with exponential backoff for failures
    const interval = connectionState.isSupabaseConnected 
      ? 30000 // 30 seconds when healthy
      : Math.min(5000 * Math.pow(2, connectionState.retryCount), 60000); // Exponential backoff, max 1 minute

    const intervalId = setInterval(checkSupabaseConnection, interval);

    return () => clearInterval(intervalId);
  }, [connectionState.isSupabaseConnected, connectionState.retryCount, queryClient]);

  return {
    ...connectionState,
    isConnected: connectionState.isOnline && connectionState.isSupabaseConnected,
  };
};