import { z } from 'zod';

export const trialEmbedSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  plan: z.enum(['start', 'builder', 'builder_pro'], {
    errorMap: () => ({ message: "Please select a plan" })
  })
});

export type TrialEmbedFormSchema = z.infer<typeof trialEmbedSchema>;
