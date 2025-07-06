
import { z } from 'zod';

export const employeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  role: z.enum(['admin', 'foreman', 'payroll', 'employee']),
  trade: z.string().min(1, 'Trade is required'),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  // Employee photo
  photo: z.instanceof(File).optional(),
  // Certificate expiry dates
  workAtHeightsExpiry: z.date().optional(),
  whmisExpiry: z.date().optional(),
  fourStepsExpiry: z.date().optional(),
  fiveStepsExpiry: z.date().optional(),
  liftOperatorExpiry: z.date().optional(),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;
