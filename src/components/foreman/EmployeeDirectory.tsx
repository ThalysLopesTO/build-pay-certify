
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Phone, MapPin, Briefcase } from 'lucide-react';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';

const EmployeeDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: employees = [], isLoading, error } = useEmployeeDirectory();

  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.toLowerCase();
    const trade = (employee.trade || '').toLowerCase();
    const position = (employee.position || '').toLowerCase();
    
    return fullName.includes(searchTerm.toLowerCase()) ||
           trade.includes(searchTerm.toLowerCase()) ||
           position.includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading employees...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Error loading employees</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Employee Directory</span>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, trade, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredEmployees.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchTerm ? 'No employees match your search.' : 'No employees found.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                      {employee.trade && (
                        <div className="flex items-center space-x-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{employee.trade}</span>
                        </div>
                      )}
                      
                      {employee.position && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{employee.position}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end space-y-2">
                    <Badge variant="secondary">
                      {employee.role || 'Employee'}
                    </Badge>
                    
                    {employee.hourly_rate && (
                      <div className="text-sm text-gray-600">
                        ${employee.hourly_rate}/hr
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeDirectory;
