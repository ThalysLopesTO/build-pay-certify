
import React from 'react';
import Header from '../components/Header';
import MaterialRequestForm from '../components/foreman/MaterialRequestForm';

const ForemanDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Foreman Dashboard</h1>
          <p className="text-slate-600">Submit material delivery requests for your jobsites</p>
        </div>
        
        <div className="max-w-2xl">
          <MaterialRequestForm />
        </div>
      </main>
    </div>
  );
};

export default ForemanDashboard;
