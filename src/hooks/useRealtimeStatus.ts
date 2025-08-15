import { useState, useEffect } from 'react';
import { getSupabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRealtimeStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    let reconnectToastId: string | number | undefined;

    // Create unique channel name to avoid conflicts
    const channelName = `heartbeat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Listen to connection state changes
    const subscription = supabase.channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        if (!isConnected) {
          setIsConnected(true);
          setIsReconnecting(false);
          
          // Dismiss reconnecting toast and show success
          if (reconnectToastId) {
            toast.dismiss(reconnectToastId);
          }
          
          toast.success('Back online', {
            description: 'Real-time updates restored',
            duration: 3000,
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          setIsReconnecting(true);
          
          // Show reconnecting toast
          reconnectToastId = toast('Reconnecting...', {
            description: 'Real-time updates may be delayed',
            duration: Infinity, // Keep until dismissed
            action: {
              label: 'Retry',
              onClick: () => {
                window.location.reload();
              },
            },
          });
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
      supabase.removeChannel(subscription);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, supabase]);

  return { isConnected, isReconnecting };
};