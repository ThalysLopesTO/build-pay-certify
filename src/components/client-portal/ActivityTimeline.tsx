import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Edit, Eye, Send, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Activity {
  type: 'quote_sent' | 'quote_viewed' | 'quote_approved' | 'quote_declined' | 'quote_changes_requested' | 'invoice_sent';
  title: string;
  date: string;
  icon: React.ElementType;
  color: string;
}

interface ActivityTimelineProps {
  quotes: any[];
  invoices: any[];
}

export function ActivityTimeline({ quotes, invoices }: ActivityTimelineProps) {
  const activities: Activity[] = [];

  // Process quotes
  quotes.forEach(quote => {
    if (quote.sent_date) {
      activities.push({
        type: 'quote_sent',
        title: `Quote #${quote.quote_number} sent`,
        date: quote.sent_date,
        icon: Send,
        color: 'text-blue-500',
      });
    }
    if (quote.client_viewed_at) {
      activities.push({
        type: 'quote_viewed',
        title: `Quote #${quote.quote_number} viewed`,
        date: quote.client_viewed_at,
        icon: Eye,
        color: 'text-purple-500',
      });
    }
    if (quote.client_approved_at) {
      activities.push({
        type: 'quote_approved',
        title: `Quote #${quote.quote_number} approved`,
        date: quote.client_approved_at,
        icon: CheckCircle,
        color: 'text-green-500',
      });
    }
    if (quote.client_declined_at) {
      activities.push({
        type: 'quote_declined',
        title: `Quote #${quote.quote_number} declined`,
        date: quote.client_declined_at,
        icon: XCircle,
        color: 'text-red-500',
      });
    }
    if (quote.public_status === 'changes_requested') {
      activities.push({
        type: 'quote_changes_requested',
        title: `Changes requested for Quote #${quote.quote_number}`,
        date: quote.client_approved_at || quote.sent_date,
        icon: Edit,
        color: 'text-orange-500',
      });
    }
  });

  // Process invoices
  invoices.forEach(invoice => {
    if (invoice.sent_date) {
      activities.push({
        type: 'invoice_sent',
        title: `Invoice #${invoice.invoice_number} sent`,
        date: invoice.sent_date,
        icon: Send,
        color: 'text-blue-500',
      });
    }
  });

  // Sort by date descending
  const sortedActivities = activities.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 10); // Show only last 10 activities

  if (sortedActivities.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedActivities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
