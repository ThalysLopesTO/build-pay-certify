
import React from 'react';
import { Download, Trash2, FileText, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSafetyTemplateActions } from '@/hooks/useSafetyTemplateActions';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface SafetyTemplate {
  id: string;
  template_name: string;
  description?: string;
  upload_date: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
}

interface SafetyTemplateCardProps {
  template: SafetyTemplate;
}

const SafetyTemplateCard: React.FC<SafetyTemplateCardProps> = ({ template }) => {
  const { deleteTemplate, downloadTemplate } = useSafetyTemplateActions();
  const { isCompanyAdmin } = useAuth();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${template.template_name}"? This action cannot be undone.`)) {
      try {
        await deleteTemplate.mutateAsync(template.id);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleDownload = async () => {
    try {
      await downloadTemplate.mutateAsync(template.file_url);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const formatUploadDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-3">
            <FileText className="h-6 w-6 text-red-600 mt-1" />
            <div>
              <h3 className="font-semibold text-lg">{template.template_name}</h3>
              {template.description && (
                <p className="text-gray-600 text-sm mt-1">{template.description}</p>
              )}
              <p className="text-sm text-gray-500 flex items-center mt-2">
                <Calendar className="h-3 w-3 mr-1" />
                Uploaded: {formatUploadDate(template.upload_date)}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloadTemplate.isPending}
              className="flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
            {isCompanyAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteTemplate.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyTemplateCard;
