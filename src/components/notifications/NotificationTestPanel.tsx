
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotificationTriggers } from '@/hooks/notifications/useNotificationTriggers';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { RefreshCw, Calendar, AlertCircle, Trash2 } from 'lucide-react';

const NotificationTestPanel = () => {
  const { user } = useAuth();
  const { 
    checkExpiringCertificates, 
    checkOverdueJobsites, 
    cleanupOldNotifications,
    isLoading 
  } = useNotificationTriggers();

  // Only show for super admins and admins
  if (!user || !['admin', 'super_admin'].includes(user.role || '')) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5" />
          <span>Notification Management</span>
        </CardTitle>
        <CardDescription>
          Manually trigger notification checks and maintenance tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            onClick={() => checkExpiringCertificates()}
            disabled={isLoading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Check Certificates</span>
          </Button>
          
          <Button
            onClick={() => checkOverdueJobsites()}
            disabled={isLoading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Check Jobsites</span>
          </Button>
          
          <Button
            onClick={() => cleanupOldNotifications()}
            disabled={isLoading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Cleanup Old</span>
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          These checks normally run automatically, but you can manually trigger them here for testing.
        </p>
      </CardContent>
    </Card>
  );
};

export default NotificationTestPanel;
