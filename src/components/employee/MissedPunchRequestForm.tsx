import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateMissedPunchRequest } from '@/hooks/useMissedPunchRequests';
import { useJobsites } from '@/hooks/useJobsites';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const missedPunchSchema = z.object({
  request_date: z.date({
    required_error: "Please select a date",
  }),
  punch_type: z.enum(['in', 'out', 'both'], {
    required_error: "Please select punch type",
  }),
  corrected_time_in: z.string().optional(),
  corrected_time_out: z.string().optional(),
  reason: z.string().min(1, "Please provide a reason"),
  supervisor_on_site: z.string().min(1, "Supervisor name is required"),
  jobsite_id: z.string().min(1, "Please select a jobsite"),
}).refine((data) => {
  if (data.punch_type === 'in' && !data.corrected_time_in) {
    return false;
  }
  if (data.punch_type === 'out' && !data.corrected_time_out) {
    return false;
  }
  if (data.punch_type === 'both' && (!data.corrected_time_in || !data.corrected_time_out)) {
    return false;
  }
  return true;
}, {
  message: "Please provide corrected times for the selected punch type",
  path: ["corrected_time_in"]
});

type MissedPunchFormData = z.infer<typeof missedPunchSchema>;

interface MissedPunchRequestFormProps {
  onSuccess?: () => void;
}

const MissedPunchRequestForm = ({ onSuccess }: MissedPunchRequestFormProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const { data: jobsites = [] } = useJobsites('active');
  const createRequest = useCreateMissedPunchRequest();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<MissedPunchFormData>({
    resolver: zodResolver(missedPunchSchema),
  });

  const watchPunchType = watch('punch_type');
  const watchRequestDate = watch('request_date');

  const handleFileUpload = async (file: File) => {
    if (!file) return null;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `missed-punch-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('employee-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload attachment');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: MissedPunchFormData) => {
    try {
      let attachmentUrl: string | undefined;
      
      if (uploadedFile) {
        attachmentUrl = await handleFileUpload(uploadedFile) || undefined;
      }

      const requestData = {
        request_date: format(data.request_date, 'yyyy-MM-dd'),
        punch_type: data.punch_type,
        corrected_time_in: data.corrected_time_in || undefined,
        corrected_time_out: data.corrected_time_out || undefined,
        reason: data.reason,
        supervisor_on_site: data.supervisor_on_site,
        jobsite_id: data.jobsite_id,
        attachment_url: attachmentUrl,
      };

      await createRequest.mutateAsync(requestData);
      reset();
      setUploadedFile(null);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit request:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Submit Missed Punch Request
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="request_date">Date of Missed Punch *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watchRequestDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchRequestDate ? format(watchRequestDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watchRequestDate}
                  onSelect={(date) => setValue('request_date', date!)}
                  disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.request_date && (
              <p className="text-sm text-red-500">{errors.request_date.message}</p>
            )}
          </div>

          {/* Punch Type */}
          <div className="space-y-2">
            <Label htmlFor="punch_type">Punch Type *</Label>
            <Select onValueChange={(value) => setValue('punch_type', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select punch type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Punch In</SelectItem>
                <SelectItem value="out">Punch Out</SelectItem>
                <SelectItem value="both">Both (In & Out)</SelectItem>
              </SelectContent>
            </Select>
            {errors.punch_type && (
              <p className="text-sm text-red-500">{errors.punch_type.message}</p>
            )}
          </div>

          {/* Corrected Times */}
          {(watchPunchType === 'in' || watchPunchType === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="corrected_time_in">Corrected Punch In Time *</Label>
              <Input
                type="time"
                {...register('corrected_time_in')}
                className="w-full"
              />
            </div>
          )}

          {(watchPunchType === 'out' || watchPunchType === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="corrected_time_out">Corrected Punch Out Time *</Label>
              <Input
                type="time"
                {...register('corrected_time_out')}
                className="w-full"
              />
            </div>
          )}

          {errors.corrected_time_in && (
            <p className="text-sm text-red-500">{errors.corrected_time_in.message}</p>
          )}

          {/* Jobsite */}
          <div className="space-y-2">
            <Label htmlFor="jobsite_id">Jobsite *</Label>
            <Select onValueChange={(value) => setValue('jobsite_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select jobsite" />
              </SelectTrigger>
              <SelectContent>
                {jobsites.map((jobsite) => (
                  <SelectItem key={jobsite.id} value={jobsite.id}>
                    {jobsite.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.jobsite_id && (
              <p className="text-sm text-red-500">{errors.jobsite_id.message}</p>
            )}
          </div>

          {/* Supervisor */}
          <div className="space-y-2">
            <Label htmlFor="supervisor_on_site">Supervisor on Site *</Label>
            <Input
              {...register('supervisor_on_site')}
              placeholder="Enter supervisor's name"
              className="w-full"
            />
            {errors.supervisor_on_site && (
              <p className="text-sm text-red-500">{errors.supervisor_on_site.message}</p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Request *</Label>
            <Textarea
              {...register('reason')}
              placeholder="Please explain why you missed the punch..."
              className="w-full min-h-[100px]"
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="attachment">Optional Attachment</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {uploadedFile ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{uploadedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-sm text-primary hover:text-primary/80">
                        Upload a file
                      </span>
                      <input
                        id="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setUploadedFile(file);
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={createRequest.isPending || uploading}
          >
            {createRequest.isPending || uploading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MissedPunchRequestForm;