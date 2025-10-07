import React, { createContext, useContext, useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/integrations/supabase/client';
// Do not import useAuth here (avoids circular deps)

interface RealtimeContextType {
  /**
   * Subscribe to a realtime channel with postgres_changes config.
   * - channelName: logical topic (e.g., "timesheets")
   * - config: postgres_changes filter config
   * - callback: handler for payloads
   * - options (optional): { companyId?: string } to tenant-scope the channel
   *
   * Returns an unsubscribe function.
   */
  subscribe: (
    channelName: string,
    config: any,
    callback: (payload: any) => void,
    options?: { companyId?: string }
  ) => Promise<() => void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);
const supabase = getSupabase();

/**
 * Module-level registry so channels persist across route changes and StrictMode double-mounts.
 * Key format: company:{tenant}:{channelName}_{userId}
 *  - {tenant} is "unknown" if not supplied
 *  - userId ensures isolation per authenticated session
 */
const channelRegistry = new Map<string, RealtimeChannel>();

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mountedOnce = useRef(false);

  const subscribe: RealtimeContextType['subscribe'] = async (
    channelName,
    config,
    callback,
    options
  ) => {
    // Always fetch session on call (no early auth dependency)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      console.warn('Cannot subscribe to realtime without authenticated user');
      return () => {};
    }

    const tenant = options?.companyId ?? 'unknown';
    const channelKey = `company:${tenant}:${channelName}_${session.user.id}`;

    let channel = channelRegistry.get(channelKey);

    if (!channel) {
      // Create once and store in registry
      channel = supabase.channel(channelKey, { config: { broadcast: { ack: true } } });
      channelRegistry.set(channelKey, channel);

      // Subscribe the channel transport; status logs optional
      channel.subscribe((status) => {
        // You can add a toast/indicator here if desired
        // console.log('Realtime channel status:', channelKey, status);
      });
    }

    // Attach the postgres_changes handler on this (shared) channel.
    // If you call subscribe again with the same key, this will add another handler.
    channel.on('postgres_changes', config, callback);

    // Return an unsubscribe that removes the whole channel instance for this key.
    // NOTE: If you plan to attach multiple handlers to the same channel and
    // need to remove a single handler, you’ll need a handler registry.
    // For now we keep 1 handler per key to stay simple and safe.
    return () => {
      const ch = channelRegistry.get(channelKey);
      if (ch) {
        try {
          supabase.removeChannel(ch);
        } catch(err) {
          console.error("Error Remove Channel: ", err)
        }
        channelRegistry.delete(channelKey);
      }
    };
  };

  // One-time wiring for logout cleanup
  useEffect(() => {
    if (mountedOnce.current) return;
    mountedOnce.current = true;

    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      console.log("EVENT: ", event)
      if (event === 'SIGNED_OUT') {
        // Leave all channels on logout to avoid cross-tenant/session leakage
        for (const ch of channelRegistry.values()) {
          try {
            await ch.unsubscribe();
          } catch(err) {
            console.log("Error Unsubscribe: ", err)
          }
        }
        channelRegistry.clear();
      }
    });

    return () => {
      // Provider itself should never unmount in the new AppProviders shell,
      // but keep this for safety.
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Optional light hook on network regain (no-op here; TanStack Query handles refetch)
  useEffect(() => {
    const handleOnline = () => {
      // Could iterate registry and ensure .subscribe() status is good.
      // Supabase auto-reconnects; we rely on that.
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
