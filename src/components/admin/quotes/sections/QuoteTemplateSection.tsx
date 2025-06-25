
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileText, Zap, HardHat } from 'lucide-react';

interface QuoteTemplateSectionProps {
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
}

const templates = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Professional business format',
    subtitle: 'Clean, traditional layout for all industries',
    icon: FileText,
    preview: {
      header: 'QUOTE',
      number: '#QUO-001',
      client: 'Acme Corporation',
      project: 'Office Renovation',
      total: '$12,500.00'
    }
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with bold typography',
    subtitle: 'Sleek styling with visual emphasis',
    icon: Zap,
    preview: {
      header: 'QUOTE',
      number: '#QUO-001',
      client: 'Tech Startup Inc.',
      project: 'Digital Workspace',
      total: '$8,750.00'
    }
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'Industry-specific optimized layout',
    subtitle: 'Perfect for construction & contracting',
    icon: HardHat,
    preview: {
      header: 'PROJECT QUOTE',
      number: '#QUO-001',
      client: 'BuildCorp LLC',
      project: 'Commercial Build-out',
      total: '$25,000.00'
    }
  }
];

const QuoteTemplateSection: React.FC<QuoteTemplateSectionProps> = ({
  selectedTemplate,
  onTemplateChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Quote Template</h3>
        <p className="text-sm text-gray-600 mt-1">Choose the design template for your quote</p>
      </div>
      
      <RadioGroup value={selectedTemplate} onValueChange={onTemplateChange}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const IconComponent = template.icon;
            const isSelected = selectedTemplate === template.id;
            
            return (
              <div key={template.id} className="relative">
                <RadioGroupItem
                  value={template.id}
                  id={template.id}
                  className="sr-only"
                />
                <Label htmlFor={template.id} className="cursor-pointer block">
                  <Card className={`
                    transition-all duration-200 hover:shadow-lg hover:-translate-y-1
                    ${isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200 shadow-md' 
                      : 'hover:border-gray-300 border-gray-200'
                    }
                  `}>
                    <CardContent className="p-6">
                      {/* Header with icon and radio indicator */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`
                            p-2 rounded-lg 
                            ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                          `}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{template.name}</h4>
                            <p className="text-xs text-gray-500">{template.description}</p>
                          </div>
                        </div>
                        
                        {/* Custom radio indicator */}
                        <div className={`
                          w-5 h-5 rounded-full border-2 transition-colors
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                          }
                        `}>
                          {isSelected && (
                            <div className="w-full h-full rounded-full bg-white scale-50 transition-transform" />
                          )}
                        </div>
                      </div>

                      {/* Subtitle */}
                      <p className="text-sm text-gray-600 mb-4">{template.subtitle}</p>
                      
                      {/* Template Preview */}
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className={`space-y-2 text-xs ${
                          template.id === 'classic' ? 'font-serif' :
                          template.id === 'modern' ? 'font-sans' :
                          'font-mono'
                        }`}>
                          {/* Header */}
                          <div className="flex justify-between items-center">
                            <div className={`font-bold text-sm ${
                              template.id === 'modern' ? 'text-blue-600' : 
                              template.id === 'construction' ? 'text-gray-700' :
                              'text-gray-800'
                            }`}>
                              {template.preview.header}
                            </div>
                            <div className="text-gray-500 font-medium">
                              {template.preview.number}
                            </div>
                          </div>
                          
                          {/* Divider */}
                          <div className={`h-px ${
                            template.id === 'modern' ? 'bg-blue-200' : 'bg-gray-200'
                          }`}></div>
                          
                          {/* Content */}
                          <div className="space-y-1">
                            <div className="text-gray-700 font-medium">{template.preview.client}</div>
                            <div className="text-gray-600">{template.preview.project}</div>
                          </div>
                          
                          {/* Spacing */}
                          <div className="h-3"></div>
                          
                          {/* Total */}
                          <div className={`text-right font-bold ${
                            template.id === 'modern' ? 'text-blue-600' : 'text-gray-800'
                          }`}>
                            Total: {template.preview.total}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Label>
              </div>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
};

export default QuoteTemplateSection;
