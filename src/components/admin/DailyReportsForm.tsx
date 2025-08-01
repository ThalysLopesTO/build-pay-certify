import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X, Upload, FileImage } from 'lucide-react';
import { useJobsites } from '@/hooks/useJobsites';
import { useDailyReportSubmission, DailyReportFormData } from '@/hooks/useDailyReports';

const formSchema = z.object({
  jobsite_id: z.string().min(1, 'Please select a jobsite'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
});

type FormData = z.infer<typeof formSchema>;

interface DailyReportsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DailyReportsForm: React.FC<DailyReportsFormProps> = ({ open, onOpenChange }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { data: jobsites = [], isLoading: jobsitesLoading } = useJobsites();
  const submitMutation = useDailyReportSubmission();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobsite_id: '',
      summary: '',
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnderLimit = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isImage && isUnderLimit;
    });

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 10)); // Max 10 files
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    const formData: DailyReportFormData = {
      jobsite_id: data.jobsite_id,
      summary: data.summary,
      photos: selectedFiles,
    };

    await submitMutation.mutateAsync(formData);
    
    // Reset form
    form.reset();
    setSelectedFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle>Create Daily Report</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-1 space-y-6 py-4">
              <FormField
                control={form.control}
                name="jobsite_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jobsite</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a jobsite" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobsitesLoading ? (
                          <SelectItem value="loading" disabled>Loading jobsites...</SelectItem>
                        ) : jobsites.length === 0 ? (
                          <SelectItem value="empty" disabled>No jobsites available</SelectItem>
                        ) : (
                          jobsites.map((jobsite) => (
                            <SelectItem key={jobsite.id} value={jobsite.id}>
                              {jobsite.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary / Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter detailed summary of today's work, progress, issues, or observations..."
                        className="min-h-[120px] max-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Photos (Optional)</FormLabel>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 bg-muted/10">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload photos or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Images only, max 10MB each, up to 10 files
                      </p>
                    </div>
                  </label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/5">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="mt-3 grid grid-cols-3 md:grid-cols-4 gap-2 max-h-[250px] overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="w-[110px] h-[110px] rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden shadow-sm">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileImage className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <Button
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFile(index)}
                            title="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-[110px]">
                            {file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4 border-t pt-4 bg-background sticky bottom-0 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DailyReportsForm;