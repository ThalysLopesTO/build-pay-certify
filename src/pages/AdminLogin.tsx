import React from 'react';
import LoginForm from '@/components/LoginForm';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminLogin = () => {
  return (
    <div>
      <LoginForm />
      <div className="text-center mt-6">
        <p className="text-slate-600 mb-4">New company?</p>
        <Link to="/subscription-plan">
          <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
            View Plans & Start Free Trial
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AdminLogin;