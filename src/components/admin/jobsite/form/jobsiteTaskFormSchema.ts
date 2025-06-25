
import { z } from 'zod';

export const jobsiteTaskFormSchema = z.object({
  task_name: z.string().min(1, 'Task name is required').min(2, 'Task name must be at least 2 characters'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  status: z.enum(['pending', 'in_progress', 'completed'] as const),
}).refine((data) => {
  return new Date(data.end_date) >= new Date(data.start_date);
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

export type JobsiteTaskFormData = z.infer<typeof jobsiteTaskFormSchema>;
