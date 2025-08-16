import { z } from 'zod';

export const editEmployeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  position: z.string().optional(),
  trade: z.string().optional(),
  role: z.enum(['admin', 'foreman', 'management', 'employee']),
  hourly_rate: z.number().min(0, 'Hourly rate must be positive').optional(),
  worker_type: z.enum(['employee', 'subcontractor']).default('employee'),
  photo: z.instanceof(File).optional(),
});

export type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;