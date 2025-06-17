
import React from 'react';
import SafetyTemplateCard from './SafetyTemplateCard';

interface SafetyTemplate {
  id: string;
  template_name: string;
  description?: string;
  upload_date: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
}

interface SafetyTemplateListProps {
  templates: SafetyTemplate[];
  isLoading: boolean;
}

const SafetyTemplateList: React.FC<SafetyTemplateListProps> = ({ templates, isLoading }) => {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading safety templates...
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No safety templates found. Upload your first template to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <SafetyTemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
};

export default SafetyTemplateList;
