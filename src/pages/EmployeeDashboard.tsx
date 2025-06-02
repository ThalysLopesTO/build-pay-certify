
import React from 'react';
import Header from '../components/Header';
import TimesheetForm from '../components/employee/TimesheetForm';
import CertificateStatus from '../components/employee/CertificateStatus';

const EmployeeDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Employee Dashboard</h1>
          <p className="text-slate-600">Submit your weekly timesheet and view certification status</p>
        </div>
        
        <div className="space-y-8">
          <TimesheetForm />
          <CertificateStatus />
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
