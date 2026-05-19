import React from 'react';
import EmployeeLoginForm from '@/components/EmployeeLoginForm';
import SEO from '@/components/common/SEO';

const EmployeeLogin = () => {
  return (
    <>
      <SEO
        title="Employee Login | StackBuild"
        description="Sign in to your StackBuild employee account to clock in, view timesheets, and upload safety certificates."
        path="/employee-login"
      />
      <EmployeeLoginForm />
    </>
  );
};

export default EmployeeLogin;
