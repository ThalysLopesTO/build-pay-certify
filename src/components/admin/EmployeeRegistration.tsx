
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { UserPlus, Save, User } from 'lucide-react';
import { useEmployeeLimit } from '@/hooks/useEmployeeLimit';
import { useEmployeeRegistrationForm } from './employee-registration/useEmployeeRegistrationForm';
import PersonalDetailsSection from './employee-registration/PersonalDetailsSection';
import LoginCredentialsSection from './employee-registration/LoginCredentialsSection';
import CertificatesSection from './employee-registration/CertificatesSection';
import EmployeeLimitAlert from './employee-registration/EmployeeLimitAlert';

const EmployeeRegistration = () => {
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
          <UserPlus className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-2xl font-bold">Employee Registration</h2>
            <p className="text-slate-600">Loading employee limit information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <UserPlus className="h-6 w-6 text-orange-600" />
        <div>
          <h2 className="text-2xl font-bold">Employee Registration</h2>
          <p className="text-slate-600">Register new employees and set their permissions and certificates</p>
        </div>
      </div>

      {/* Employee Limit Status */}
      {employeeLimit && <EmployeeLimitAlert employeeLimit={employeeLimit} />}

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Add New Employee</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              
              {/* Personal & Work Details Section */}
              <PersonalDetailsSection form={form} formatCurrency={formatCurrency} />

              {/* Login Credentials Section */}
              <LoginCredentialsSection form={form} />

              {/* Certificates Section */}
              <CertificatesSection form={form} />

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => form.reset()}
                >
                  Reset Form
                </Button>
                {employeeLimit && employeeLimit.currentCount < employeeLimit.employeeLimit ? (
                  <Button 
                    type="submit" 
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={loading || !employeeLimit?.canAddEmployee}
                  >
                    {loading ? (
                      'Registering...'
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Register Employee
                      </>
                    )}
                  </Button>
                ) : null }
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeRegistration;
