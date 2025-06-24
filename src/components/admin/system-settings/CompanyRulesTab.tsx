
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCompanyRules, useUpdateCompanyRules } from '@/hooks/useCompanyRules';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FileText, Save } from 'lucide-react';

export const CompanyRulesTab = () => {
  const { rules, isLoading, error } = useCompanyRules();
  const updateRulesMutation = useUpdateCompanyRules();
  const [rulesText, setRulesText] = useState('');

  // Update rulesText when rules data is loaded
  useEffect(() => {
    if (rules?.company_rules_text) {
      setRulesText(rules.company_rules_text);
    } else {
      // Default to empty string if no rules exist
      setRulesText('');
    }
  }, [rules]);

  const handleSave = () => {
    updateRulesMutation.mutate(rulesText);
  };

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

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center text-red-600">
          <p>Error loading company rules. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Company Rules Editor</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-rules">Company Rules & Policies</Label>
            <RichTextEditor
              value={rulesText}
              onChange={setRulesText}
              placeholder="Enter your company rules, safety policies, and guidelines here. Use the toolbar above to format your content with headings, lists, images, and more..."
              className="w-full"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Visibility Information</h4>
            <p className="text-sm text-blue-700">
              These rules will be visible to all Foremen and Employees in the "Company Rules" page in their sidebar. 
              They cannot edit this content - it's read-only for them. Rich formatting, images, and links will be preserved in the display.
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={updateRulesMutation.isPending}
            className="w-full flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{updateRulesMutation.isPending ? 'Saving...' : 'Save Company Rules'}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
