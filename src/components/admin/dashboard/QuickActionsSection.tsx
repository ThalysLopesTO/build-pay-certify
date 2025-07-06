import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
interface QuickActionsSectionProps {
  setActiveTab: (tab: string) => void;
}
const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  setActiveTab
}) => {
  const quickActions = [{
    id: 'add-employee',
    title: 'Add New Employee',
    icon: '👷‍♀️',
    action: () => setActiveTab('employee-registration'),
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900'
  }, {
    id: 'create-invoice',
    title: 'Create Invoice',
    icon: '📄',
    action: () => setActiveTab('invoices'),
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-200',
    textColor: 'text-green-900'
  }, {
    id: 'view-suppliers',
    title: 'View Suppliers',
    icon: '🏪',
    action: () => setActiveTab('suppliers'),
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-900'
  }];
  return <Card className="shadow-sm border-gray-200 rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-slate-50">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map(action => <Button key={action.id} onClick={action.action} variant="outline" className={`h-24 flex flex-col items-center justify-center space-y-3 ${action.bgColor} ${action.borderColor} ${action.textColor} border-2 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 w-full`}>
              <span className="text-3xl">{action.icon}</span>
              <span className="text-sm font-medium text-center leading-tight">{action.title}</span>
            </Button>)}
        </div>
      </CardContent>
    </Card>;
};
export default QuickActionsSection;