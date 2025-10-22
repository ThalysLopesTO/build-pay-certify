import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const WebhookLogs = () => {
  const { user } = useAuth();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['webhook-logs', user?.companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('company_id', user?.companyId)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.companyId,
  });

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <span>Webhook Delivery Logs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground">
          <Activity className="h-5 w-5 text-primary" />
          <span>Webhook Delivery Logs</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Recent webhook delivery attempts (last 50 records)
        </p>
      </CardHeader>
      <CardContent>
        {!logs || logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No webhook logs found</p>
            <p className="text-sm">Webhook delivery logs will appear here once you enable webhooks</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {logs.map((log: any) => (
                <div key={log.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {log.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : log.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      <p className="font-medium text-foreground">{log.event_type}</p>
                    </div>
                    <Badge 
                      variant={log.status === 'success' ? 'default' : 'destructive'}
                      className="capitalize"
                    >
                      {log.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium">Sent:</span>{' '}
                      {format(new Date(log.sent_at), 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                    
                    <p className="text-muted-foreground">
                      <span className="font-medium">URL:</span>{' '}
                      <span className="font-mono text-xs break-all">{log.webhook_url}</span>
                    </p>
                    
                    {log.http_status_code && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Status Code:</span>{' '}
                        <span className={log.http_status_code >= 200 && log.http_status_code < 300 ? 'text-green-600' : 'text-red-600'}>
                          {log.http_status_code}
                        </span>
                      </p>
                    )}
                    
                    {log.retry_count > 0 && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Retries:</span> {log.retry_count}
                      </p>
                    )}
                    
                    {log.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-600 font-medium">Error:</p>
                        <p className="text-xs text-red-700">{log.error_message}</p>
                      </div>
                    )}
                    
                    {log.payload && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View Payload
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default WebhookLogs;
