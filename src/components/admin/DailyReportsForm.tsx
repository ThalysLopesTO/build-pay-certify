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
import DatePickerField from '@/components/foreman/DatePickerField';

const formSchema = z.object({
  jobsite_id: z.string().min(1, 'Please select a jobsite'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  report_date: z.date({
    required_error: 'Please select a report date',
  }),
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
      report_date: new Date(),
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
      report_date: data.report_date,
    };

    await submitMutation.mutateAsync(formData);
    
    // Reset form
    form.reset();
    setSelectedFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Fixed Header */}
        <DialogHeader className="px-6 py-4 border-b bg-background flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">Create Daily Report</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Submit your daily progress report for the selected jobsite
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            {/* Scrollable Content Area with Visible Scrollbar */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
              <div className="space-y-8 pb-4">
                {/* Report Date Section */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="report_date"
                    render={({ field }) => (
                      <FormItem>
                        <DatePickerField
                          value={field.value}
                          onChange={field.onChange}
                          label="Report Date"
                          placeholder="Select report date"
                        />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Jobsite Section */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="jobsite_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Jobsite</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10">
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
                </div>

                {/* Summary Section */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Summary / Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter detailed summary of today's work, progress, issues, or observations..."
                            className="min-h-[120px] max-h-[200px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Minimum 10 characters required
                        </p>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Photos Section with Better Visual Separation */}
                <div className="space-y-4 bg-muted/20 p-6 rounded-lg border">
                  <div>
                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                      📸 Photos (Optional)
                    </FormLabel>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload photos to document work progress, issues, or completed tasks
                    </p>
                  </div>
                  
                  <div className="border-2 border-dashed border-primary/25 rounded-lg p-6 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
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
                        <Upload className="h-10 w-10 text-primary mb-3" />
                        <p className="text-sm font-medium text-foreground mb-1">
                          Click to upload photos
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Images only, max 10MB each, up to 10 files
                        </p>
                      </div>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="border rounded-lg p-4 bg-muted/5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium">
                          {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedFiles.length}/10 files
                        </p>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-[200px] overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg border bg-muted/50 flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                              onClick={() => removeFile(index)}
                              title="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2 truncate text-center">
                              {file.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Spacer for Better Scrolling */}
                <div className="h-8"></div>
              </div>
            </div>

            {/* Fixed Footer with Shadow */}
            <div className="border-t bg-background/95 backdrop-blur-sm flex-shrink-0 shadow-lg">
              <div className="px-6 py-4">
                {/* Scroll Indicator */}
                <div className="mb-3 text-center">
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    <div className="h-1 w-1 bg-muted-foreground rounded-full animate-pulse"></div>
                    Scroll up to review all fields
                    <div className="h-1 w-1 bg-muted-foreground rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={submitMutation.isPending}
                    className="min-w-[100px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="min-w-[140px] bg-primary hover:bg-primary/90"
                  >
                    {submitMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </div>
                    ) : (
                      'Submit Report'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DailyReportsForm;