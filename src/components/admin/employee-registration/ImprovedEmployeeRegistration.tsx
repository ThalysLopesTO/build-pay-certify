import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Save, User, Camera, Shield, Mail, Smartphone, MapPin, DollarSign, Briefcase, Users, AlertTriangle } from 'lucide-react';
import { useEmployeeLimit } from '@/hooks/useEmployeeLimit';
import { useEmployeeRegistrationForm } from './useEmployeeRegistrationForm';
import ImprovedPersonalDetailsSection from './ImprovedPersonalDetailsSection';
import DynamicCertificatesSection from './DynamicCertificatesSection';
import EmployeeLimitAlert from './EmployeeLimitAlert';

const ImprovedEmployeeRegistration = () => {
  const { data: employeeLimit, isLoading: isLoadingLimit } = useEmployeeLimit();
  const { form, loading, handleSubmit } = useEmployeeRegistrationForm();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(value);
  };

  if (isLoadingLimit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <UserPlus className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Employee Registration</h2>
            <p className="text-muted-foreground">Loading employee limit information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Add New Employee</h2>
              <p className="text-muted-foreground">Register employees with their work details, photos, and certificates</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{employeeLimit?.currentCount || 0} / {employeeLimit?.employeeLimit || 0}</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Employee Limit Status */}
      {employeeLimit && <EmployeeLimitAlert employeeLimit={employeeLimit} />}

      {/* Main Form Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <span>Employee Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              
              {/* Personal & Work Details Section */}
              <ImprovedPersonalDetailsSection form={form} formatCurrency={formatCurrency} />

              <Separator className="my-8" />

              {/* Certificates Section */}
              <DynamicCertificatesSection form={form} />

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t bg-muted/20 -mx-6 px-6 pb-0">
                <div className="flex items-center text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>Employee will receive login credentials via email</span>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => form.reset()}
                    disabled={loading}
                  >
                    Reset Form
                  </Button>
                  {employeeLimit && employeeLimit.currentCount < employeeLimit.employeeLimit ? (
                    <Button 
                      type="submit" 
                      className="min-w-[140px]"
                      disabled={loading || !employeeLimit?.canAddEmployee}
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Creating...</span>
                        </div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Register Employee
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button disabled variant="outline">
                      Employee limit reached
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedEmployeeRegistration;