import { useState, useEffect } from 'react';
import { getSupabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRealtimeStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    let reconnectToastId: string | number | undefined;
    let subscription: any = null;

    const setupSubscription = () => {
      // Clean up existing subscription first
      if (subscription) {
        supabase.removeChannel(subscription);
      }

      // Create unique channel name to prevent conflicts
      const channelName = `heartbeat-${Date.now()}-${Math.random()}`;
      
      // Listen to connection state changes
      subscription = supabase.channel(channelName)
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
    };

    setupSubscription();

    // Also listen to browser connectivity
    const handleOnline = () => {
      if (!isConnected) {
        setIsReconnecting(true);
        // Re-establish subscription on reconnect
        setupSubscription();
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
      if (subscription) {
        supabase.removeChannel(subscription);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Remove isConnected and supabase from dependencies

  return { isConnected, isReconnecting };
};