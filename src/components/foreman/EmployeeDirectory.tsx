import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Users, Search, Phone, Mail, MapPin, Briefcase, User, Building, Calendar, Award } from 'lucide-react';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  trade?: string;
  position?: string;
  role: string;
  is_active: boolean;
}

interface EmployeeDetailsProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ employee, isOpen, onClose }) => {
  // Fetch additional details for the selected employee
  const { data: employeeJobsites = [] } = useQuery({
    queryKey: ['employee-jobsites', employee?.user_id],
    queryFn: async () => {
      if (!employee?.user_id) return [];
      
      // Get jobsites where this employee has recent timesheets
      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          jobsite_id,
          jobsites!inner(
            id,
            name,
            address,
            status
          )
        `)
        .eq('user_id', employee.user_id)
        .gte('check_in_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('check_in_time', { ascending: false });

      if (error) {
        console.error('Error fetching employee jobsites:', error);
        return [];
      }

      // Remove duplicates and return unique jobsites
      const uniqueJobsites = data.reduce((acc: any[], current: any) => {
        const currentJobsite = Array.isArray(current.jobsites) ? current.jobsites[0] : current.jobsites;
        const exists = acc.find((item: any) => {
          const jobsite = Array.isArray(item.jobsites) ? item.jobsites[0] : item.jobsites;
          return jobsite?.id === currentJobsite?.id;
        });
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      return uniqueJobsites.map((item: any) => {
        const jobsite = Array.isArray(item.jobsites) ? item.jobsites[0] : item.jobsites;
        return jobsite;
      });
    },
    enabled: !!employee?.user_id && isOpen,
  });

  // Fetch certificates for the employee (optional - can be shown to foremen)
  const { data: employeeCertificates = [] } = useQuery({
    queryKey: ['employee-certificates', employee?.user_id],
    queryFn: async () => {
      if (!employee?.user_id) return [];
      
      const { data, error } = await supabase
        .from('employee_certificates')
        .select('*')
        .eq('employee_id', employee.user_id)
        .order('expiry_date', { ascending: true });

      if (error) {
        console.error('Error fetching employee certificates:', error);
        return [];
      }

      return data;
    },
    enabled: !!employee?.user_id && isOpen,
  });

  if (!employee) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatExpiryDate = (date: string) => {
    const expiry = new Date(date);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Expired', color: 'text-red-600', badge: 'destructive' };
    } else if (diffDays <= 30) {
      return { text: `${diffDays} days`, color: 'text-orange-600', badge: 'secondary' };
    } else {
      return { text: expiry.toLocaleDateString(), color: 'text-green-600', badge: 'default' };
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={employee.photo_url} alt={`${employee.first_name} ${employee.last_name}`} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {getInitials(employee.first_name, employee.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-xl font-bold">
                {employee.first_name} {employee.last_name}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {employee.role}
                </Badge>
                <Badge variant={employee.is_active ? 'default' : 'secondary'} className="text-xs">
                  {employee.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Contact Information
            </h3>
            <div className="space-y-3 pl-6">
              {employee.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.phone}</span>
                </div>
              )}
              {employee.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.email}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Work Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Work Information
            </h3>
            <div className="space-y-3 pl-6">
              {employee.trade && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Trade</div>
                    <div className="text-sm text-muted-foreground">{employee.trade}</div>
                  </div>
                </div>
              )}
              {employee.position && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Position</div>
                    <div className="text-sm text-muted-foreground">{employee.position}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Assigned Jobsites */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              Recent Jobsites
            </h3>
            <div className="pl-6">
              {employeeJobsites.length > 0 ? (
                <div className="space-y-3">
                  {employeeJobsites.map((jobsite: any) => (
                    <div key={jobsite.id} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div className="font-medium text-sm">{jobsite.name}</div>
                      {jobsite.address && (
                        <div className="text-xs text-muted-foreground mt-1">{jobsite.address}</div>
                      )}
                      <Badge variant="outline" className="text-xs mt-2">
                        {jobsite.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No recent jobsite assignments</div>
              )}
            </div>
          </div>

          <Separator />

          {/* Certificates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Certificates
            </h3>
            <div className="pl-6">
              {employeeCertificates.length > 0 ? (
                <div className="space-y-3">
                  {employeeCertificates.map((cert: any) => {
                    const expiryInfo = cert.expiry_date ? formatExpiryDate(cert.expiry_date) : null;
                    return (
                      <div key={cert.id} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{cert.certificate_name}</div>
                            <div className="text-xs text-muted-foreground mt-1">{cert.certificate_type}</div>
                          </div>
                          {expiryInfo && (
                            <div className="text-right">
                              <Badge 
                                variant={expiryInfo.badge as any} 
                                className="text-xs"
                              >
                                {cert.status}
                              </Badge>
                              <div className={`text-xs mt-1 ${expiryInfo.color}`}>
                                {expiryInfo.text}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No certificates on file</div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const EmployeeDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { data: employees = [], isLoading, error } = useEmployeeDirectory();

  const filteredEmployees = employees.filter((employee: Employee) => {
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.toLowerCase();
    const trade = (employee.trade || '').toLowerCase();
    const position = (employee.position || '').toLowerCase();
    
    return fullName.includes(searchTerm.toLowerCase()) ||
           trade.includes(searchTerm.toLowerCase()) ||
           position.includes(searchTerm.toLowerCase());
  });

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedEmployee(null);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'foreman':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'management':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-border shadow-md rounded-xl">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mx-auto mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-border shadow-md rounded-xl">
        <CardContent className="p-8">
          <div className="text-center text-destructive">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            Error loading employees. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-border shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            Employee Directory
            <Badge variant="outline" className="ml-auto">
              {filteredEmployees.length} {filteredEmployees.length === 1 ? 'Employee' : 'Employees'}
            </Badge>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, trade, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border focus:ring-primary/20"
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? 'No employees match your search' : 'No employees found'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'Check back later as employees are added.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredEmployees.map((employee: Employee) => (
                <div
                  key={employee.id}
                  onClick={() => handleEmployeeClick(employee)}
                  className="group border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer bg-card hover:bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                      <AvatarImage 
                        src={employee.photo_url} 
                        alt={`${employee.first_name} ${employee.last_name}`} 
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(employee.first_name, employee.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {employee.trade && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Briefcase className="h-3 w-3" />
                            <span className="truncate">{employee.trade}</span>
                          </div>
                        )}
                        
                        {employee.position && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{employee.position}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        className={`text-xs font-medium ${getRoleColor(employee.role)}`}
                      >
                        {employee.role === 'super_admin' ? 'Super Admin' : 
                         employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                      </Badge>
                      
                      <Badge 
                        variant={employee.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeDetails
        employee={selectedEmployee}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    </>
  );
};

export default EmployeeDirectory;