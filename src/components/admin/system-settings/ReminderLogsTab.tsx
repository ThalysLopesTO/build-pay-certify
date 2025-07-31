import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReminderLogs } from '@/hooks/useReminderLogs';
import { Loader2, Mail, FileText, Receipt } from 'lucide-react';
import { format } from 'date-fns';

export const ReminderLogsTab = () => {
  const { data: reminderLogs, isLoading, error } = useReminderLogs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reminder logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load reminder logs. Please try again.
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <Receipt className="h-4 w-4" />;
      case 'quote':
        return <FileText className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'invoice':
        return <Badge variant="secondary">Invoice</Badge>;
      case 'quote':
        return <Badge variant="outline">Quote</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Reminder Logs
        </CardTitle>
        <CardDescription>
          View a history of all automated reminders sent to clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!reminderLogs || reminderLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reminders have been sent yet.</p>
            <p className="text-sm">Automated reminders will appear here once the system starts sending them.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Total reminders sent: {reminderLogs.length}
              </p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminderLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(log.type)}
                        {getTypeBadge(log.type)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.record_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {format(new Date(log.sent_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(log.sent_at), 'h:mm a')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};