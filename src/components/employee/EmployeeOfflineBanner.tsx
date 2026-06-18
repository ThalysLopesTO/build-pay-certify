import React from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';

interface EmployeeOfflineBannerProps {
  isOffline: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

/**
 * Slim status strip for offline / pending-sync state. Reassures field workers
 * that their punches are safe and will sync — renders nothing when online and
 * fully synced.
 */
const EmployeeOfflineBanner: React.FC<EmployeeOfflineBannerProps> = ({
  isOffline, pendingCount, isSyncing,
}) => {
  if (!isOffline && pendingCount === 0) return null;

  if (isOffline) {
    return (
      <div className="flex items-center gap-2.5 bg-slate-800 px-4 py-2 text-white">
        <CloudOff className="h-4 w-4 shrink-0 text-amber-300" />
        <span className="text-xs font-medium">
          You're offline — your clock punches are saved and will sync automatically.
          {pendingCount > 0 && ` (${pendingCount} pending)`}
        </span>
      </div>
    );
  }

  // Online with pending items → syncing
  return (
    <div className="flex items-center gap-2.5 bg-blue-600 px-4 py-2 text-white">
      <RefreshCw className={`h-4 w-4 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
      <span className="text-xs font-medium">
        Syncing {pendingCount} pending punch{pendingCount !== 1 ? 'es' : ''}…
      </span>
    </div>
  );
};

export default EmployeeOfflineBanner;
