import React from 'react';
import LoginForm from '@/components/LoginForm';
import SEO from '@/components/common/SEO';

const AdminLogin = () => {
  return (
    <>
      <SEO
        title="Admin Login | StackBuild"
        description="Sign in to your StackBuild admin, manager, or foreman account to manage payroll, timesheets, and jobsites."
        path="/admin-login"
      />
      <div>
        <LoginForm />
      </div>
    </>
  );
};
export default AdminLogin;
