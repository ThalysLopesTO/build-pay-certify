
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCompanyRules } from '@/hooks/useCompanyRules';
import { FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const CompanyRules = () => {
  const { rules, isLoading } = useCompanyRules();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading company rules...</p>
        </div>
      </div>
    );
  }

  if (!rules?.company_rules_text) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No Company Rules Available</h3>
            <p>Company rules have not been set up yet. Please contact your administrator.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Company Rules & Policies</h1>
          <p className="text-slate-600">Important guidelines and safety policies</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Company Policies</span>
            {rules.rules_updated_at && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Last updated: {format(new Date(rules.rules_updated_at), 'PPP')}</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full rounded-md border p-6">
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {rules.company_rules_text}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyRules;
