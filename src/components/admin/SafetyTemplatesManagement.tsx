
import React, { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSafetyTemplates } from '@/hooks/useSafetyTemplates';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import SafetyTemplateUploadForm from './safety-templates/SafetyTemplateUploadForm';
import SafetyTemplateList from './safety-templates/SafetyTemplateList';

const SafetyTemplatesManagement = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { data: templates = [], isLoading } = useSafetyTemplates();
  const { isCompanyAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Safety Templates</span>
          </CardTitle>
          {isCompanyAdmin && (
            <Button 
              onClick={() => setIsUploading(!isUploading)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Upload Template</span>
            </Button>
          )}
        </CardHeader>
        
        <CardContent>
          {isUploading && (
            <SafetyTemplateUploadForm onCancel={() => setIsUploading(false)} />
          )}

          <SafetyTemplateList templates={templates} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default SafetyTemplatesManagement;
