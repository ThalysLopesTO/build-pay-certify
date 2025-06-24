
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface QuoteTemplateSectionProps {
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
}

const templates = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional business format with clean lines',
    preview: 'A simple, professional layout with company header and organized sections'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with bold typography',
    preview: 'Sleek design with emphasis on visual hierarchy and modern styling'
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'Industry-specific layout optimized for construction projects',
    preview: 'Specialized format with project details and material-focused sections'
  }
];

const QuoteTemplateSection: React.FC<QuoteTemplateSectionProps> = ({
  selectedTemplate,
  onTemplateChange
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Quote Template</h3>
        <p className="text-sm text-slate-600">Choose the design template for your quote</p>
      </div>
      
      <RadioGroup value={selectedTemplate} onValueChange={onTemplateChange}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id}>
              <RadioGroupItem
                value={template.id}
                id={template.id}
                className="sr-only"
              />
              <Label htmlFor={template.id} className="cursor-pointer">
                <Card className={`transition-all hover:shadow-md ${
                  selectedTemplate === template.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{template.name}</h4>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedTemplate === template.id
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedTemplate === template.id && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{template.description}</p>
                      
                      {/* Template Preview */}
                      <div className="mt-3 p-3 bg-white border rounded text-xs">
                        <div className={`space-y-1 ${
                          template.id === 'classic' ? 'font-serif' :
                          template.id === 'modern' ? 'font-sans' :
                          'font-mono'
                        }`}>
                          <div className="flex justify-between items-center">
                            <div className="font-bold">QUOTE</div>
                            <div className="text-right text-gray-600">#QUO-001</div>
                          </div>
                          <div className="h-px bg-gray-200 my-1"></div>
                          <div className="text-gray-600">Client Name</div>
                          <div className="text-gray-600">Project Details</div>
                          <div className="h-4"></div>
                          <div className="text-right font-bold">Total: $0.00</div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-500 mt-2">{template.preview}</p>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};

export default QuoteTemplateSection;
