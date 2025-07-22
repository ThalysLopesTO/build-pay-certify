import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  AlertTriangle, 
  Bell, 
  Calendar, 
  DollarSign,
  Eye,
  CheckCircle
} from 'lucide-react';
import { BillReminder, useBillReminders } from '@/hooks/notifications/useBillReminders';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const BillReminderDropdown = () => {
  const { data: reminders = [], refetch } = useBillReminders();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const criticalReminders = reminders.filter(r => r.daysUntilDue <= 2);
  const warningReminders = reminders.filter(r => r.daysUntilDue > 2);

  const handleMarkAsPaid = async (billId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('bills_expenses')
        .update({ payment_status: 'paid' })
        .eq('id', billId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bill marked as paid",
      });
      
      refetch();
    } catch (error) {
      console.error('Error updating bill:', error);
      toast({
        title: "Error",
        description: "Failed to update bill status",
        variant: "destructive",
      });
    }
  };

  const handleViewBill = (billId: string) => {
    navigate(`/admin/bills-expenses?highlight=${billId}`);
    setIsOpen(false);
  };

  const getUrgencyColor = (daysUntilDue: number) => {
    if (daysUntilDue <= 1) return 'text-red-600';
    if (daysUntilDue <= 2) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getUrgencyIcon = (daysUntilDue: number) => {
    if (daysUntilDue <= 2) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <Bell className="h-4 w-4 text-orange-500" />;
  };

  if (reminders.length === 0) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0 hover:bg-slate-100"
        >
          <Bell className="h-4 w-4" />
          {reminders.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {reminders.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-slate-900">Upcoming Bills</h3>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            You have {reminders.length} bill{reminders.length !== 1 ? 's' : ''} due this week
          </p>
        </div>

        <ScrollArea className="max-h-80">
          <div className="space-y-1">
            {/* Critical reminders (1-2 days) */}
            {criticalReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="p-3 hover:bg-red-50 cursor-pointer border-l-2 border-l-red-500 transition-colors"
                onClick={() => handleViewBill(reminder.id)}
              >
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {getUrgencyIcon(reminder.daysUntilDue)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {reminder.expense_title}
                      </p>
                      <p className="text-xs text-gray-600 mb-1">
                        {reminder.vendor_payee} • ${reminder.amount.toFixed(2)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className={`text-xs font-medium ${getUrgencyColor(reminder.daysUntilDue)}`}>
                          {reminder.daysUntilDue === 0 ? 'Due today' : 
                           reminder.daysUntilDue === 1 ? 'Due tomorrow' :
                           `Due in ${reminder.daysUntilDue} days`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-green-100"
                      onClick={(e) => handleMarkAsPaid(reminder.id, e)}
                      title="Mark as paid"
                    >
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-blue-100"
                      onClick={() => handleViewBill(reminder.id)}
                      title="View details"
                    >
                      <Eye className="h-3 w-3 text-blue-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Warning reminders (3-7 days) */}
            {warningReminders.map((reminder, index) => (
              <div key={reminder.id}>
                {criticalReminders.length > 0 && index === 0 && <Separator />}
                <div
                  className="p-3 hover:bg-orange-50 cursor-pointer border-l-2 border-l-orange-400 transition-colors"
                  onClick={() => handleViewBill(reminder.id)}
                >
                  <div className="flex items-start justify-between space-x-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {getUrgencyIcon(reminder.daysUntilDue)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {reminder.expense_title}
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          {reminder.vendor_payee} • ${reminder.amount.toFixed(2)}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className={`text-xs ${getUrgencyColor(reminder.daysUntilDue)}`}>
                            Due {format(new Date(reminder.expense_date), 'MMM dd')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-green-100"
                        onClick={(e) => handleMarkAsPaid(reminder.id, e)}
                        title="Mark as paid"
                      >
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-blue-100"
                        onClick={() => handleViewBill(reminder.id)}
                        title="View details"
                      >
                        <Eye className="h-3 w-3 text-blue-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t bg-slate-50">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              navigate('/admin/bills-expenses');
              setIsOpen(false);
            }}
          >
            View All Bills
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};