import { z } from 'zod';

// Date range schema
const dateRangeSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  preset: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['startDate'],
});

export const requestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  department: z.string().min(1, 'Please select a department'),
  dateRange: dateRangeSchema,
  description: z.string().min(20, 'Description must be at least 20 characters'),
  contactEmail: z.string().email('Please provide a valid email'),
  attachments: z.array(z.any()).optional(), // Files are handled separately since they're not JSON serializable
});

export type RequestFormData = z.infer<typeof requestSchema>;

// Extended type for internal form handling including files
export interface RequestFormDataWithFiles extends RequestFormData {
  files?: File[];
}
