import React, { createContext, useContext, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface RealtimeContextType {
  subscribe: (channelName: string, config: any, callback: (payload: any) => void) => Promise<() => void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Don't use useAuth here to avoid circular dependency issues
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const supabase = getSupabase();

  const subscribe = (channelName: string, config: any, callback: (payload: any) => void) => {
    // Get auth info when needed, not during provider initialization
    const getCurrentAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    };

    return (async () => {
      const session = await getCurrentAuth();
      
      if (!session?.user) {
        console.warn('Cannot subscribe to realtime without authenticated user');
        return () => {};
      }

      // Create unique channel key with timestamp to prevent conflicts
      const channelKey = `${channelName}_${session.user.id}_${Date.now()}`;
      
      console.log('Creating new realtime channel:', channelKey);
      
      const channel = supabase
        .channel(channelKey)
        .on('postgres_changes', config, callback)
        .subscribe((status) => {
          console.log('Realtime channel status:', channelKey, status);
        });

      channelsRef.current.set(channelKey, channel);

      // Return unsubscribe function
      return () => {
        console.log('Unsubscribing from channel:', channelKey);
        const channel = channelsRef.current.get(channelKey);
        if (channel) {
          supabase.removeChannel(channel);
          channelsRef.current.delete(channelKey);
        }
      };
    })();
  };

  // Clean up all channels on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up all realtime channels');
      channelsRef.current.forEach((channel, key) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [supabase]);

  // Handle network reconnection
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network reconnected, refreshing realtime connections');
      // Optionally refresh channels here
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <RealtimeContext.Provider value={{ subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};