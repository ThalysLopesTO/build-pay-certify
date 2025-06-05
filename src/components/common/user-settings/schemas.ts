
import { z } from 'zod';

export const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  trade: z.string().optional(),
  position: z.string().optional(),
  hourly_rate: z.number().min(0, 'Hourly rate must be positive').optional(),
});

export const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;
