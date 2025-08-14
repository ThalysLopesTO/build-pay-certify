import { useState, useEffect, useRef } from 'react';
import { getSupabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRealtimeStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const supabase = getSupabase();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    console.log('🔧 useRealtimeStatus: Setting up effect');
    let reconnectToastId: string | number | undefined;

    const setupSubscription = () => {
      // Clean up existing subscription first
      if (channelRef.current) {
        console.log('🧹 useRealtimeStatus: Cleaning up existing subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create unique channel name to prevent conflicts
      const channelName = `heartbeat-${Date.now()}-${Math.random()}`;
      console.log('📡 useRealtimeStatus: Creating channel:', channelName);
      
      // Listen to connection state changes
      channelRef.current = supabase.channel(channelName)
        .on('presence', { event: 'sync' }, () => {
          console.log('🟢 useRealtimeStatus: Presence sync event');
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
          console.log('📊 useRealtimeStatus: Channel status:', status);
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
      if (channelRef.current) {
        console.log('🧹 useRealtimeStatus: Final cleanup');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Remove isConnected and supabase from dependencies

  return { isConnected, isReconnecting };
};