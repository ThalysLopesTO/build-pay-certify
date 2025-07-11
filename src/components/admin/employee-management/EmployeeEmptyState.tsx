import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

const EmployeeEmptyState: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-500">No employees found matching your search</p>
      </CardContent>
    </Card>
  );
};

export default EmployeeEmptyState;