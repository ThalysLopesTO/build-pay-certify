import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Phone, Mail, MapPin, Briefcase, User, Building, Calendar, Award, Upload, Shield, AlertTriangle, CheckCircle, XCircle, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useEmployeeCertificateStatus } from '@/hooks/useEmployeeCertificateStatus';
import { useEmployeeCertificates } from '@/hooks/useEmployeeCertificates';
import { getCertStatusIcon, getCertStatusText } from '@/components/admin/employee-management/employeeHelpers';
import CertificateUploadModal from '@/components/admin/CertificateUploadModal';
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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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

  // Use the enhanced certificate hooks
  const { 
    certificates: employeeCertificates, 
    isLoading: isCertificatesLoading,
    deleteCertificate,
    isDeletingCertificate,
    refreshCertificates 
  } = useEmployeeCertificates(employee?.user_id);
  const { data: certificateStatus } = useEmployeeCertificateStatus(employee?.user_id);

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

          {/* Safety Certificates Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Safety Certificates
              </h3>
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Certificate
              </Button>
            </div>

            {isCertificatesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-slate-600">Loading certificates...</p>
              </div>
            ) : employeeCertificates.length === 0 ? (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  No certificates found for this employee.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {employeeCertificates.map((cert: any) => (
                  <div key={cert.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {cert.status === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {cert.status === 'expiring' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          {cert.status === 'expired' && <XCircle className="h-4 w-4 text-red-500" />}
                          <h3 className="font-semibold">{cert.certificate_name}</h3>
                          <Badge className={
                            cert.status === 'valid' ? 'bg-green-100 text-green-800' :
                            cert.status === 'expiring' ? 'bg-yellow-100 text-yellow-800' :
                            cert.status === 'expired' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800'
                          }>
                            {cert.status === 'valid' ? 'Valid' :
                             cert.status === 'expiring' ? 'Expiring Soon' :
                             cert.status === 'expired' ? 'Expired' : 'Unknown'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Type:</span>
                            <p>{cert.certificate_type}</p>
                          </div>
                          <div>
                            <span className="font-medium">Expiry Date:</span>
                            <p>{cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : 'No Expiry'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Upload Date:</span>
                            <p>{new Date(cert.upload_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium">File:</span>
                            {cert.file_url ? (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto text-blue-600"
                                onClick={() => window.open(cert.file_url!, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View File
                              </Button>
                            ) : (
                              <p className="text-slate-400">No file attached</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this certificate?')) {
                            deleteCertificate(cert.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isDeletingCertificate}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Status summary */}
            {employeeCertificates.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Certificate Status Summary</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-green-600 font-semibold">
                      {employeeCertificates.filter((c: any) => c.status === 'valid').length}
                    </div>
                    <div className="text-slate-600">Valid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-600 font-semibold">
                      {employeeCertificates.filter((c: any) => c.status === 'expiring').length}
                    </div>
                    <div className="text-slate-600">Expiring</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-600 font-semibold">
                      {employeeCertificates.filter((c: any) => c.status === 'expired').length}
                    </div>
                    <div className="text-slate-600">Expired</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Certificate Upload Modal */}
        <CertificateUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          employee={employee ? {
            id: employee.user_id,
            user_id: employee.user_id,
            first_name: employee.first_name,
            last_name: employee.last_name
          } : null}
          onSuccess={() => {
            refreshCertificates();
            setIsUploadModalOpen(false);
          }}
         />
      </SheetContent>
    </Sheet>
  );
};

// Enhanced Employee Card Component
const EmployeeCard: React.FC<{ employee: Employee; onClick: () => void }> = ({ employee, onClick }) => {
  const { data: certificateStatus } = useEmployeeCertificateStatus(employee.user_id);

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

  return (
    <div
      onClick={onClick}
      className="group border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer bg-card hover:bg-muted/30"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-12 w-12 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
            <AvatarImage 
              src={employee.photo_url} 
              alt={`${employee.first_name} ${employee.last_name}`} 
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(employee.first_name, employee.last_name)}
            </AvatarFallback>
          </Avatar>
          {/* Certificate Status Indicator */}
          {certificateStatus && (
            <div className="absolute -top-1 -right-1 bg-background rounded-full p-1 border border-border">
              {getCertStatusIcon(certificateStatus)}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {employee.first_name} {employee.last_name}
          </h3>
          
          {/* Certificate Status Badge */}
          {certificateStatus && (
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={certificateStatus === 'all-valid' ? 'default' : 
                        certificateStatus === 'expiring' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {getCertStatusText(certificateStatus)}
              </Badge>
            </div>
          )}
          
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
            variant={employee.is_active ? 'outline' : 'secondary'} 
            className="text-xs"
          >
            {employee.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
    </div>
  );
};

const EmployeeDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [certificateFilter, setCertificateFilter] = useState<string>('all');
  const { data: employees = [], isLoading, error } = useEmployeeDirectory();

  const filteredEmployees = employees.filter((employee: Employee) => {
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.toLowerCase();
    const trade = (employee.trade || '').toLowerCase();
    const position = (employee.position || '').toLowerCase();
    
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         trade.includes(searchTerm.toLowerCase()) ||
                         position.includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedEmployee(null);
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
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, trade, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-border focus:ring-primary/20"
              />
            </div>
            <Select value={certificateFilter} onValueChange={setCertificateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by certificates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                <SelectItem value="all-valid">Valid Certificates</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired Certificates</SelectItem>
                <SelectItem value="no-certificates">No Certificates</SelectItem>
              </SelectContent>
            </Select>
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
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onClick={() => handleEmployeeClick(employee)}
                />
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