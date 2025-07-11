import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface EmployeeSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const EmployeeSearch: React.FC<EmployeeSearchProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <Input
          placeholder="Search employees by name, trade, or position..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-md"
        />
      </CardContent>
    </Card>
  );
};

export default EmployeeSearch;