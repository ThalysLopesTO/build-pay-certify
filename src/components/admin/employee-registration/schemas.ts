
import { z } from 'zod';

// Certificate schema for dynamic certificates
export const certificateSchema = z.object({
  id: z.string(), // Temporary ID for form management
  name: z.string().min(1, 'Certificate name is required'),
  expiryDate: z.date().optional(),
  noExpiry: z.boolean().default(false),
  file: z.instanceof(File).optional(),
});

export const employeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  role: z.enum(['admin', 'foreman', 'management', 'employee']),
  trade: z.string().min(1, 'Trade is required'),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  workerType: z.enum(['employee', 'subcontractor']).default('subcontractor'),
  // Employee photo
  photo: z.instanceof(File).optional(),
  // Dynamic certificates
  certificates: z.array(certificateSchema).default([]),
});

export type CertificateFormData = z.infer<typeof certificateSchema>;
export type EmployeeFormData = z.infer<typeof employeeSchema>;
