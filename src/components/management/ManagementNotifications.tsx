import React, { useState, useMemo } from 'react';
import { Bell, Filter, Search, DollarSign, AlertTriangle, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/hooks/notifications/useNotifications';
import { useNotificationActions } from '@/hooks/notifications/useNotificationActions';
import { Notification } from '@/hooks/notifications/types';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/common/DashboardHeader';

const ManagementNotifications = () => {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const { markAsRead, markAllAsRead, dismiss, isLoading: isActionLoading } = useNotificationActions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Search filter
      const matchesSearch = !searchTerm || 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = filterType === 'all' || notification.type === filterType;

      // Status filter
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'unread' && !notification.is_read) ||
        (filterStatus === 'read' && notification.is_read);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, searchTerm, filterType, filterStatus]);

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bill_due_soon':
      case 'bill_overdue':
        return <DollarSign className="h-5 w-5 text-yellow-600" />;
      case 'certificate':
        return <Award className="h-5 w-5 text-blue-600" />;
      case 'attention_report':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  // Get type display name
  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'bill_due_soon':
        return 'Bills Due Soon';
      case 'bill_overdue':
        return 'Bills Overdue';
      case 'certificate':
        return 'Certificates';
      case 'attention_report':
        return 'Reports';
      default:
        return 'Other';
    }
  };

  // Get management redirect URL
  const getManagementRedirectUrl = (notification: Notification): string => {
    switch (notification.type) {
      case 'bill_due_soon':
      case 'bill_overdue':
        return '/management/bills-expenses';
      case 'certificate':
        return '/management/employees';
      case 'attention_report':
        return '/management/reports';
      default:
        return '/management/dashboard';
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    const url = getManagementRedirectUrl(notification);
    navigate(url);
  };

  // Get notification counts by type
  const notificationCounts = useMemo(() => {
    return notifications.reduce((acc, notification) => {
      acc.total++;
      if (!notification.is_read) acc.unread++;
      
      if (notification.type.includes('bill')) {
        acc.bills++;
      } else if (notification.type === 'certificate') {
        acc.certificates++;
      } else if (notification.type === 'attention_report') {
        acc.reports++;
      }
      
      return acc;
    }, { total: 0, unread: 0, bills: 0, certificates: 0, reports: 0 });
  }, [notifications]);

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        title="Notifications"
        subtitle="Manage your company notifications"
        onRefresh={refetch}
        isRefreshing={isLoading}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notificationCounts.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{notificationCounts.unread}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{notificationCounts.bills}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{notificationCounts.certificates}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-80"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bill_due_soon">Bills Due Soon</SelectItem>
                <SelectItem value="bill_overdue">Bills Overdue</SelectItem>
                <SelectItem value="certificate">Certificates</SelectItem>
                <SelectItem value="attention_report">Reports</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {notificationCounts.unread > 0 && (
          <Button 
            onClick={() => markAllAsRead()} 
            disabled={isActionLoading}
            variant="outline"
            size="sm"
          >
            Mark All Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'No notifications match your filters'
                  : 'No notifications yet'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                !notification.is_read 
                  ? 'border-l-4 border-l-green-500 bg-green-50/50' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        {notification.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {getTypeDisplayName(notification.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          {!notification.is_read && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Unread
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            disabled={isActionLoading}
                          >
                            Mark Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(notification.id);
                          }}
                          disabled={isActionLoading}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ManagementNotifications;