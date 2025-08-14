import React from 'react';
import { getSupabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRealtime } from '@/contexts/RealtimeProvider';

export const useRealtimeStatus = () => {
  const [isConnected, setIsConnected] = React.useState(true);
  const [isReconnecting, setIsReconnecting] = React.useState(false);
  const { subscribe } = useRealtime();
  const supabase = getSupabase();

  React.useEffect(() => {
    let reconnectToastId: string | number | undefined;

    // Use the new realtime provider for presence tracking
    const unsubscribe = subscribe({
      key: 'heartbeat_status',
      events: [{
        event: '*',
        schema: 'public',
        table: 'user_profiles' // Use a real table for connection status
      }],
      onMessage: () => {
        // Connection is working if we receive any message
        if (!isConnected) {
          setIsConnected(true);
          setIsReconnecting(false);
          
          if (reconnectToastId) {
            toast.dismiss(reconnectToastId);
          }
          
          toast.success('Back online', {
            description: 'Real-time updates restored',
            duration: 3000,
          });
        }
      }
    });

    // Also listen to browser connectivity
    const handleOnline = () => {
      if (!isConnected) {
        setIsReconnecting(true);
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
      setIsReconnecting(false);
      
      toast.error('Connection lost', {
        description: 'Some features may not work properly',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (reconnectToastId) {
        toast.dismiss(reconnectToastId);
      }
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Empty dependencies - stable subscription

  return { isConnected, isReconnecting };
};