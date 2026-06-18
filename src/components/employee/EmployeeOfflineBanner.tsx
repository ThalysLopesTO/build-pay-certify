import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  if (!isOffline && pendingCount === 0) return null;

  if (isOffline) {
    return (
      <div className="flex items-center gap-2.5 bg-slate-800 px-4 py-2 text-white">
        <CloudOff className="h-4 w-4 shrink-0 text-amber-300" />
        <span className="text-xs font-medium">
          {t('offline.banner')}
          {pendingCount > 0 && ` ${t('offline.pending', { count: pendingCount })}`}
        </span>
      </div>
    );
  }

  // Online with pending items → syncing
  return (
    <div className="flex items-center gap-2.5 bg-blue-600 px-4 py-2 text-white">
      <RefreshCw className={`h-4 w-4 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
      <span className="text-xs font-medium">{t('offline.syncing', { count: pendingCount })}</span>
    </div>
  );
};

export default EmployeeOfflineBanner;
