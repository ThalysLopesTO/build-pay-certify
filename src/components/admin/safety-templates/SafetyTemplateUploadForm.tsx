
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useSafetyTemplateActions } from '@/hooks/useSafetyTemplateActions';
import { useToast } from '@/hooks/use-toast';

const templateSchema = z.object({
  template_name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  file: z.instanceof(File).refine(
    (file) => file.type === 'application/pdf',
    'Only PDF files are allowed'
  ).refine(
    (file) => file.size <= 10 * 1024 * 1024,
    'File size must be less than 10MB'
  )
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface SafetyTemplateUploadFormProps {
  onCancel: () => void;
}

const SafetyTemplateUploadForm: React.FC<SafetyTemplateUploadFormProps> = ({ onCancel }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadTemplate } = useSafetyTemplateActions();
  const { toast } = useToast();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue('file', file);
    }
  };

  const onSubmit = async (data: TemplateFormData) => {
    try {
      await uploadTemplate.mutateAsync({
        template_name: data.template_name,
        description: data.description || '',
        file: data.file
      });
      toast({
        title: 'Success',
        description: 'Safety template uploaded successfully',
      });
      onCancel();
    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Safety Template</span>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="template_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter template name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter template description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={() => (
                <FormItem>
                  <FormLabel>PDF File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                  </FormControl>
                  {selectedFile && (
                    <div className="text-sm text-gray-600">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={uploadTemplate.isPending}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>{uploadTemplate.isPending ? 'Uploading...' : 'Upload Template'}</span>
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SafetyTemplateUploadForm;
