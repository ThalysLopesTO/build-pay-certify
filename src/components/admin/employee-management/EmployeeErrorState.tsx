import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const EmployeeErrorState: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Error loading employees</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeErrorState;