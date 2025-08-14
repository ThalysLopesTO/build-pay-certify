import React, { createContext, useContext, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/integrations/supabase/client';

interface ChannelRegistry {
  channel: RealtimeChannel;
  listeners: Set<string>;
  subscribedOnce: boolean;
}

interface RealtimeSubscribeOptions {
  key: string;
  events: {
    event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
    schema: string;
    table: string;
    filter?: string;
  }[];
  onMessage: (payload: any) => void;
}

interface RealtimeContextType {
  subscribe: (options: RealtimeSubscribeOptions) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const registryRef = useRef<Map<string, ChannelRegistry>>(new Map());
  const mountGuardRef = useRef<Set<string>>(new Set()); // Strict Mode protection
  const supabase = getSupabase();

  const subscribe = (options: RealtimeSubscribeOptions) => {
    const { key, events, onMessage } = options;
    
    // Create deterministic channel key (no random timestamps)
    const channelKey = `realtime_${key}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('[realtime] subscribe request:', channelKey);
    }
    
    // Strict Mode protection
    if (process.env.NODE_ENV === 'development' && mountGuardRef.current.has(channelKey)) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[realtime] strict mode detected, reusing existing subscription:', channelKey);
      }
      
      // Return existing unsubscribe function
      const existingRegistry = registryRef.current.get(channelKey);
      if (existingRegistry) {
        const listenerId = `listener_${Date.now()}_${Math.random()}`;
        existingRegistry.listeners.add(listenerId);
        
        return () => {
          const registry = registryRef.current.get(channelKey);
          if (registry) {
            registry.listeners.delete(listenerId);
            
            // If no more listeners, cleanup
            if (registry.listeners.size === 0) {
              if (process.env.NODE_ENV === 'development') {
                console.debug('[realtime] removeChannel (no listeners):', channelKey);
              }
              supabase.removeChannel(registry.channel);
              registryRef.current.delete(channelKey);
              mountGuardRef.current.delete(channelKey);
            }
          }
        };
      }
    }

    // Check if channel already exists
    const existingRegistry = registryRef.current.get(channelKey);
    if (existingRegistry) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[realtime] attach to existing channel:', channelKey);
      }
      
      // Add listener to existing channel
      const listenerId = `listener_${Date.now()}_${Math.random()}`;
      existingRegistry.listeners.add(listenerId);
      
      return () => {
        const registry = registryRef.current.get(channelKey);
        if (registry) {
          registry.listeners.delete(listenerId);
          
          // If no more listeners, cleanup
          if (registry.listeners.size === 0) {
            if (process.env.NODE_ENV === 'development') {
              console.debug('[realtime] removeChannel (no listeners):', channelKey);
            }
            supabase.removeChannel(registry.channel);
            registryRef.current.delete(channelKey);
            mountGuardRef.current.delete(channelKey);
          }
        }
      };
    }

    // Create new channel
    if (process.env.NODE_ENV === 'development') {
      console.debug('[realtime] create new channel:', channelKey);
    }
    
    const channel = supabase.channel(channelKey);
    
    // Register event listeners
    events.forEach(eventConfig => {
      channel.on('postgres_changes', eventConfig as any, onMessage);
    });
    
    // Create registry entry
    const listenerId = `listener_${Date.now()}_${Math.random()}`;
    const registry: ChannelRegistry = {
      channel,
      listeners: new Set([listenerId]),
      subscribedOnce: false
    };
    
    registryRef.current.set(channelKey, registry);
    mountGuardRef.current.add(channelKey);
    
    // Subscribe only once per channel instance
    if (!registry.subscribedOnce) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[realtime] subscribeOnce:', channelKey);
      }
      
      channel.subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[realtime] status:', channelKey, status);
        }
      });
      
      registry.subscribedOnce = true;
    }
    
    // Return unsubscribe function
    return () => {
      const currentRegistry = registryRef.current.get(channelKey);
      if (currentRegistry) {
        currentRegistry.listeners.delete(listenerId);
        
        // If no more listeners, cleanup
        if (currentRegistry.listeners.size === 0) {
          if (process.env.NODE_ENV === 'development') {
            console.debug('[realtime] removeChannel (cleanup):', channelKey);
          }
          supabase.removeChannel(currentRegistry.channel);
          registryRef.current.delete(channelKey);
          mountGuardRef.current.delete(channelKey);
        }
      }
    };
  };

  // Cleanup all channels on unmount
  useEffect(() => {
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[realtime] provider cleanup, removing all channels');
      }
      
      registryRef.current.forEach((registry, key) => {
        supabase.removeChannel(registry.channel);
      });
      registryRef.current.clear();
      mountGuardRef.current.clear();
    };
  }, [supabase]);

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