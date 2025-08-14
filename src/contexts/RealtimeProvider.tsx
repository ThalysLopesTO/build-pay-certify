import React, { createContext, useContext, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface RealtimeContextType {
  subscribe: (channelName: string, config: any, callback: (payload: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const supabase = getSupabase();

  const subscribe = (channelName: string, config: any, callback: (payload: any) => void) => {
    if (!session || !user?.companyId) {
      console.warn('Cannot subscribe to realtime without authenticated user');
      return () => {};
    }

    // Create unique channel key including company context
    const channelKey = `${channelName}_${user.companyId}`;
    
    // Check if channel already exists
    if (channelsRef.current.has(channelKey)) {
      console.log('Reusing existing channel:', channelKey);
      return () => {};
    }

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
  };

  // Clean up all channels on unmount or auth change
  useEffect(() => {
    return () => {
      console.log('Cleaning up all realtime channels');
      channelsRef.current.forEach((channel, key) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [supabase, user?.companyId]);

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