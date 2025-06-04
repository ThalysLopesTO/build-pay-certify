
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Building, Users } from 'lucide-react';

interface QuickActionsSectionProps {
  onAddJobsite: () => void;
  onAddEmployee: () => void;
  onCreateInvoice: () => void;
  onViewLicense: () => void;
}

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  onAddJobsite,
  onAddEmployee,
  onCreateInvoice,
  onViewLicense
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="flex items-center space-x-2 h-12"
            onClick={onAddJobsite}
          >
            <Plus className="h-4 w-4" />
            <span>Add Jobsite</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center space-x-2 h-12"
            onClick={onAddEmployee}
          >
            <Users className="h-4 w-4" />
            <span>Add Employee</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center space-x-2 h-12"
            onClick={onCreateInvoice}
          >
            <FileText className="h-4 w-4" />
            <span>Create Invoice</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center space-x-2 h-12"
            onClick={onViewLicense}
          >
            <Building className="h-4 w-4" />
            <span>License Details</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsSection;
