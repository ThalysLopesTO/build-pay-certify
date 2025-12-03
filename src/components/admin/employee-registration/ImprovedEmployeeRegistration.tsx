import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Save, User, Camera, Shield, Mail, Smartphone, MapPin, DollarSign, Briefcase, Users, AlertTriangle, X } from 'lucide-react';
import { useEmployeeLimit } from '@/hooks/useEmployeeLimit';
import { useEmployeeRegistrationForm } from './useEmployeeRegistrationForm';
import ImprovedPersonalDetailsSection from './ImprovedPersonalDetailsSection';
import DynamicCertificatesSection from './DynamicCertificatesSection';
import EmployeeLimitAlert from './EmployeeLimitAlert';
import { useIsMobile } from '@/hooks/use-mobile';

const ImprovedEmployeeRegistration = () => {
  const { data: employeeLimit, isLoading: isLoadingLimit } = useEmployeeLimit();
  const { form, loading, loadingStep, handleSubmit, cancelRegistration } = useEmployeeRegistrationForm();
  const isMobile = useIsMobile();

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
    <div className="space-y-4 md:space-y-6 max-w-5xl mx-auto overflow-x-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 md:p-6 rounded-lg border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="bg-primary/10 p-2 md:p-3 rounded-full shrink-0">
              <UserPlus className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-bold">Add New Employee</h2>
              <p className="text-sm md:text-base text-muted-foreground line-clamp-2">Register employees with their work details, photos, and certificates</p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center space-x-1 w-fit shrink-0">
            <Users className="h-3 w-3" />
            <span>{employeeLimit?.currentCount || 0} / {employeeLimit?.employeeLimit || 0}</span>
          </Badge>
        </div>
      </div>

      {/* Employee Limit Status */}
      {employeeLimit && <EmployeeLimitAlert employeeLimit={employeeLimit} />}

      {/* Main Form Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-4 md:p-6">
          <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
            <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <span>Employee Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              
              {/* Personal & Work Details Section */}
              <ImprovedPersonalDetailsSection form={form} formatCurrency={formatCurrency} />

              <Separator className="my-8" />

              {/* Certificates Section */}
              <DynamicCertificatesSection form={form} />

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 pt-4 md:pt-6 border-t bg-muted/20 -mx-4 md:-mx-6 px-4 md:px-6 pb-0">
                {/* Info message - centered on mobile, left on desktop */}
                <div className="flex items-center justify-center md:justify-start text-xs md:text-sm text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 mr-2 shrink-0" />
                  <span className="text-center md:text-left">
                    {loading ? (
                      loadingStep || 'Processing registration...'
                    ) : (
                      'Employee will receive login credentials via email'
                    )}
                  </span>
                </div>
                
                {/* Buttons - stacked on mobile, row on desktop */}
                <div className="flex flex-col gap-2 md:flex-row md:justify-end md:space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => form.reset()}
                    disabled={loading}
                    className="w-full md:w-auto order-2 md:order-1"
                  >
                    Reset Form
                  </Button>
                  {loading && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={cancelRegistration}
                      className="w-full md:w-auto md:min-w-[100px] order-3 md:order-2"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                  {employeeLimit && employeeLimit.currentCount < employeeLimit.employeeLimit ? (
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto md:min-w-[200px] order-1 md:order-3"
                      disabled={loading || !employeeLimit?.canAddEmployee}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="truncate text-xs">{loadingStep || 'Creating...'}</span>
                        </div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Register Employee
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="w-full md:w-auto order-1 md:order-3">
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