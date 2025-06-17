
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Calendar } from 'lucide-react';
import { useCompanyRules } from '@/hooks/useCompanyRules';
import { format } from 'date-fns';

const CompanyRules = () => {
  const { data: companyRules, isLoading, error } = useCompanyRules();

  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-600">Loading company rules...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading company rules: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const rulesText = companyRules?.company_rules_text;
  const lastUpdated = companyRules?.rules_updated_at;

  if (!rulesText) {
    return (
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-black">
            <FileText className="h-6 w-6" />
            <span>Company Rules & Policies</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-600 py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No company rules have been set up yet.</p>
            <p className="text-sm">Please contact your administrator.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-black">
          <FileText className="h-6 w-6" />
          <span>Company Rules & Policies</span>
        </CardTitle>
        {lastUpdated && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
            <Calendar className="h-4 w-4" />
            <span>Last Updated: {format(new Date(lastUpdated), 'PPP')}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <div 
            className="whitespace-pre-wrap text-black leading-relaxed"
            style={{ maxHeight: '70vh', overflowY: 'auto' }}
          >
            {rulesText}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyRules;
