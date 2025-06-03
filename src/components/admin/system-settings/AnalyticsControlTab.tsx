
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Award, 
  Users,
  Eye,
  EyeOff
} from 'lucide-react';

const dashboardWidgets = [
  {
    id: 'payroll-cost',
    title: 'Weekly Payroll Cost',
    description: 'Total weekly labor costs across all projects',
    icon: DollarSign,
    category: 'financial',
    enabled: true
  },
  {
    id: 'invoicing-trends',
    title: 'Invoicing Trends',
    description: 'Monthly invoice volume and payment trends',
    icon: TrendingUp,
    category: 'financial',
    enabled: true
  },
  {
    id: 'labor-hours',
    title: 'Total Labor Hours by Project',
    description: 'Breakdown of hours worked per project site',
    icon: Clock,
    category: 'operational',
    enabled: true
  },
  {
    id: 'certificate-expiry',
    title: 'Certificate Expiry Trends',
    description: 'Upcoming certificate renewals and compliance tracking',
    icon: Award,
    category: 'compliance',
    enabled: false
  },
  {
    id: 'employee-productivity',
    title: 'Employee Productivity Metrics',
    description: 'Individual and team performance indicators',
    icon: Users,
    category: 'operational',
    enabled: false
  },
  {
    id: 'project-profitability',
    title: 'Project Profitability Analysis',
    description: 'Cost vs revenue analysis by project',
    icon: BarChart3,
    category: 'financial',
    enabled: true
  }
];

export const AnalyticsControlTab = () => {
  const [widgets, setWidgets] = useState(dashboardWidgets);
  const [refreshInterval, setRefreshInterval] = useState('5');
  const [dataRetention, setDataRetention] = useState('365');

  const toggleWidget = (widgetId: string) => {
    setWidgets(widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, enabled: !widget.enabled }
        : widget
    ));
  };

  const getWidgetsByCategory = (category: string) => {
    return widgets.filter(widget => widget.category === category);
  };

  const categories = [
    { id: 'financial', label: 'Financial Analytics', color: 'bg-green-100 text-green-800' },
    { id: 'operational', label: 'Operational Metrics', color: 'bg-blue-100 text-blue-800' },
    { id: 'compliance', label: 'Compliance Tracking', color: 'bg-orange-100 text-orange-800' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Dashboard Widget Control</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge className={category.color}>{category.label}</Badge>
                <span className="text-sm text-gray-500">
                  ({getWidgetsByCategory(category.id).filter(w => w.enabled).length} of {getWidgetsByCategory(category.id).length} enabled)
                </span>
              </div>
              
              <div className="grid gap-3 pl-4 border-l-2 border-gray-200">
                {getWidgetsByCategory(category.id).map((widget) => {
                  const IconComponent = widget.icon;
                  return (
                    <div key={widget.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                        <div>
                          <h4 className="font-medium">{widget.title}</h4>
                          <p className="text-sm text-gray-600">{widget.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {widget.enabled ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <Switch
                          checked={widget.enabled}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Widget Performance Impact</h4>
            <p className="text-sm text-blue-700">
              Disabling widgets that you don't need can improve dashboard loading times. 
              You can always re-enable them later without losing any historical data.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data & Performance Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="refresh">Auto-Refresh Interval</Label>
              <Select
                value={refreshInterval}
                onValueChange={setRefreshInterval}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 minute</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="0">Manual only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                How often dashboard data refreshes automatically
              </p>
            </div>

            <div>
              <Label htmlFor="retention">Data Retention Period</Label>
              <Select
                value={dataRetention}
                onValueChange={setDataRetention}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">3 months</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="730">2 years</SelectItem>
                  <SelectItem value="0">Unlimited</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                How long to keep historical analytics data
              </p>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-900 mb-2">Storage Optimization</h4>
            <p className="text-sm text-amber-700">
              Shorter retention periods use less storage space and can improve performance. 
              Data older than the retention period will be automatically archived.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline">
          Reset to Defaults
        </Button>
        <Button>
          Save Analytics Settings
        </Button>
      </div>
    </div>
  );
};
