import { z } from 'zod';

export const requestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  department: z.string().min(1, 'Please select a department'),
  timeframe: z.string().min(1, 'Please provide a timeframe'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  contactEmail: z.string().email('Please provide a valid email'),
});

export type RequestFormData = z.infer<typeof requestSchema>;
