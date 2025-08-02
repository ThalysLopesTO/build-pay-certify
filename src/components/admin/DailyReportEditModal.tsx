import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DailyReport, useDailyReportUpdate } from '@/hooks/useDailyReports';
import { useJobsites } from '@/hooks/useJobsites';

const formSchema = z.object({
  jobsite_id: z.string().min(1, 'Please select a jobsite'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  report_date: z.date({ required_error: 'Please select a report date' }),
});

type FormData = z.infer<typeof formSchema>;

interface DailyReportEditModalProps {
  report: DailyReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DailyReportEditModal: React.FC<DailyReportEditModalProps> = ({
  report,
  open,
  onOpenChange,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  const { data: jobsites = [] } = useJobsites();
  const updateReport = useDailyReportUpdate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobsite_id: '',
      summary: '',
      report_date: new Date(),
    },
  });

  // Update form when report changes
  useEffect(() => {
    if (report) {
      form.reset({
        jobsite_id: report.jobsite_id,
        summary: report.summary,
        report_date: new Date(report.report_date),
      });
    }
  }, [report, form]);

  // Calculate time remaining for editing
  useEffect(() => {
    if (!report || !open) return;

    const updateTimeRemaining = () => {
      const createdAt = new Date(report.created_at);
      const now = new Date();
      const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      const remaining = expiresAt.getTime() - now.getTime();

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [report, open]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    // Validate file types and sizes
    const validFiles = selectedFiles.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== selectedFiles.length) {
      // Some files were invalid
      return;
    }

    // Limit total files to 10
    const totalFiles = files.length + validFiles.length;
    if (totalFiles > 10) {
      const allowedFiles = validFiles.slice(0, 10 - files.length);
      setFiles([...files, ...allowedFiles]);
    } else {
      setFiles([...files, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (!report) return;

    try {
      await updateReport.mutateAsync({
        reportId: report.id,
        data: {
          jobsite_id: data.jobsite_id,
          summary: data.summary,
          report_date: data.report_date,
          photos: files,
        }
      });
      
      onOpenChange(false);
      setFiles([]);
      form.reset();
    } catch (error) {
      console.error('Failed to update report:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setFiles([]);
    form.reset();
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Daily Report</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Edit available for {timeRemaining} more</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This report can be edited for 24 hours after submission. After that, it will be locked.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Report Date */}
            <FormField
              control={form.control}
              name="report_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Report Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jobsite Selection */}
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
                      {jobsites.map((jobsite) => (
                        <SelectItem key={jobsite.id} value={jobsite.id}>
                          {jobsite.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary */}
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter daily report summary..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Upload */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Photos (Optional)
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload up to 10 photos, max 10MB each
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {files.length < 10 && (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateReport.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateReport.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {updateReport.isPending ? "Updating..." : "Update Report"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DailyReportEditModal;