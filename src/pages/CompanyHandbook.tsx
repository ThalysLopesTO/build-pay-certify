
import React from 'react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, AlertCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';

const CompanyHandbook = () => {
  const { user } = useAuth();
  const { settings, isLoading, error } = useCompanySettings();

  // Check if user is an employee
  if (!user || user.role !== 'employee') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span>📘 Company Handbook</span>
            </h1>
            <p className="text-slate-600">Review company policies, rules, and guidelines</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Company Rules & Policies</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading company handbook...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">Failed to load company handbook</p>
                    <p className="text-slate-600 text-sm mt-2">Please try refreshing the page or contact your administrator</p>
                  </div>
                </div>
              ) : settings?.company_rules_text ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: settings.company_rules_text }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">No company handbook available</p>
                    <p className="text-slate-500 text-sm mt-2">Your company administrator hasn't set up the handbook yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanyHandbook;
