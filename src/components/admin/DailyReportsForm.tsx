import React, { useState, useEffect } from 'react';
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
import { useActiveJobsites } from '@/hooks/useJobsites';
import { useDailyReportSubmission, DailyReportFormData } from '@/hooks/useDailyReports';
import DatePickerField from '@/components/foreman/DatePickerField';
import { DailyReportValidation } from '@/components/foreman/DailyReportValidation';
import { DailyReportProgressIndicator } from '@/components/foreman/DailyReportProgressIndicator';

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

interface SubmissionStep {
  key: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  errorMessage?: string;
}

const DailyReportsForm: React.FC<DailyReportsFormProps> = ({ open, onOpenChange }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [submissionSteps, setSubmissionSteps] = useState<SubmissionStep[]>([
    { key: 'validation', label: 'Validating form data', status: 'pending' },
    { key: 'photos', label: 'Uploading photos', status: 'pending' },
    { key: 'database', label: 'Creating report record', status: 'pending' },
    { key: 'complete', label: 'Submission complete', status: 'pending' }
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  
  const { data: jobsites = [], isLoading: jobsitesLoading } = useActiveJobsites();
  const submitMutation = useDailyReportSubmission();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    if (!isOnline) {
      console.error('Cannot submit report while offline');
      return;
    }

    // Reset submission state
    setSubmissionSteps(steps => steps.map(step => ({ ...step, status: 'pending' as SubmissionStep['status'], errorMessage: undefined })));
    setCurrentStep(0);
    setSubmissionProgress(0);

    try {
      // Step 1: Validation
      setSubmissionSteps(steps => steps.map((step, index) => 
        index === 0 ? { ...step, status: 'active' as SubmissionStep['status'] } : step
      ));
      setSubmissionProgress(10);

      const formData: DailyReportFormData = {
        jobsite_id: data.jobsite_id,
        summary: data.summary,
        photos: selectedFiles,
        report_date: data.report_date,
      };

      setSubmissionSteps(steps => steps.map((step, index) => 
        index === 0 ? { ...step, status: 'completed' as SubmissionStep['status'] } : step
      ));
      setCurrentStep(1);
      setSubmissionProgress(25);

      // Submit with progress tracking
      await submitMutation.mutateAsync(formData);
      
      // Complete all steps
      setSubmissionSteps(steps => steps.map(step => ({ ...step, status: 'completed' as SubmissionStep['status'] })));
      setSubmissionProgress(100);
      
      // Reset form
      form.reset();
      setSelectedFiles([]);
      
      // Close dialog after short delay
      setTimeout(() => {
        onOpenChange(false);
        setSubmissionSteps(steps => steps.map(step => ({ ...step, status: 'pending' as SubmissionStep['status'] })));
        setSubmissionProgress(0);
      }, 1500);
      
    } catch (error) {
      console.error('Submission failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setSubmissionSteps(steps => steps.map((step, index) => 
        index === currentStep ? { ...step, status: 'error' as SubmissionStep['status'], errorMessage } : step
      ));
    }
  };

  // Form validation state
  const watchedValues = form.watch();
  const hasJobsite = !!watchedValues.jobsite_id;
  const hasSummary = !!watchedValues.summary;
  const summaryLength = watchedValues.summary?.length || 0;
  const hasValidDate = !!watchedValues.report_date;
  const canSubmit = hasJobsite && hasSummary && summaryLength >= 10 && hasValidDate && isOnline;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-xl shadow-2xl">
        {/* Fixed Header with Shadow */}
        <div className="px-6 py-5 border-b bg-background/95 backdrop-blur-sm flex-shrink-0 rounded-t-xl shadow-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Create Daily Report
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Submit your daily progress report for the selected jobsite
            </p>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="px-6 py-6 space-y-6">
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
                        <FormLabel className="text-sm font-semibold text-foreground">
                          Jobsite
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-muted-foreground/20 focus:border-primary">
                              <SelectValue placeholder="Select a jobsite" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobsitesLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading jobsites...
                              </SelectItem>
                            ) : jobsites.length === 0 ? (
                              <SelectItem value="empty" disabled>
                                No jobsites available
                              </SelectItem>
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
                        <FormLabel className="text-sm font-semibold text-foreground">
                          Summary / Notes
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter detailed summary of today's work, progress, issues, or observations..."
                            className="min-h-[120px] max-h-[200px] resize-none border-muted-foreground/20 focus:border-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-2">
                          Minimum 10 characters required
                        </p>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Photos Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-foreground">
                      Photos (Optional)
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Upload photos to document work progress, issues, or completed tasks
                    </p>
                  </div>
                  
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 bg-primary/5 hover:bg-primary/10 transition-all duration-200 hover:border-primary/50">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer block">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          Click to upload photos
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Images only, max 10MB each, up to 10 files
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="border rounded-xl p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-foreground">
                          {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
                        </p>
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          {selectedFiles.length}/10 files
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[240px] overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg border-2 border-muted bg-muted/50 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors">
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
                              className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              onClick={() => removeFile(index)}
                              title="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2 truncate text-center px-1">
                              {file.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Validation Status */}
                <DailyReportValidation
                  isOnline={isOnline}
                  hasJobsite={hasJobsite}
                  hasSummary={hasSummary}
                  summaryLength={summaryLength}
                  hasValidDate={hasValidDate}
                  photoCount={selectedFiles.length}
                />

                {/* Submission Progress */}
                {(submitMutation.isPending || submissionSteps.some(step => step.status !== 'pending')) && (
                  <DailyReportProgressIndicator
                    isSubmitting={submitMutation.isPending}
                    steps={submissionSteps}
                    currentStep={currentStep}
                    overallProgress={submissionProgress}
                  />
                )}

                {/* Bottom Spacer for Better Scrolling */}
                <div className="pb-4"></div>
              </div>
            </div>

            {/* Fixed Footer with Shadow */}
            <div className="border-t bg-background/98 backdrop-blur-sm flex-shrink-0 shadow-lg rounded-b-xl">
              <div className="px-6 py-5">
                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={submitMutation.isPending}
                    className="min-w-[100px] h-10 border-muted-foreground/20 hover:bg-muted/50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending || !canSubmit}
                    className="min-w-[140px] h-10 bg-primary hover:bg-primary/90 shadow-md disabled:opacity-50"
                  >
                    {submitMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </div>
                    ) : canSubmit ? (
                      'Submit Report'
                    ) : (
                      'Complete Form'
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