import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ConnectionStatus = () => {
  const { isConnected, isOnline, isSupabaseConnected, retryCount } = useConnectionMonitor();

  // Only show when there are connection issues
  if (isConnected) return null;

  return (
    <Alert className="fixed top-4 right-4 w-auto max-w-sm z-50 border-warning bg-warning/10">
      <AlertCircle className="h-4 w-4 text-warning" />
      <AlertDescription className="text-sm">
        {!isOnline ? (
          <div className="flex items-center gap-2">
            <WifiOff className="h-3 w-3" />
            You're offline. Changes will sync when reconnected.
          </div>
        ) : !isSupabaseConnected ? (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            Database connection issues. Retrying... ({retryCount}/3)
          </div>
        ) : null}
      </AlertDescription>
    </Alert>
  );
};