import { z } from 'zod';

// Create review schema
export const createReviewSchema = z.object({
  barberProfileId: z.string().uuid('Invalid barber profile ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().max(200, 'Title is too long').optional(),
  comment: z.string().max(2000, 'Comment is too long').optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// Update review schema
export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

// Contact request schema
export const createContactRequestSchema = z.object({
  barberProfileId: z.string().uuid('Invalid barber profile ID'),
  clientName: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  clientEmail: z.string().email('Invalid email address'),
  clientPhone: z.string().max(20, 'Phone number is too long').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long'),
  serviceInterested: z.string().max(200).optional(),
  preferredDate: z.string().optional(), // ISO date string
  preferredTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
});

export type CreateContactRequestInput = z.infer<typeof createContactRequestSchema>;

// Update contact request status schema
export const updateContactRequestStatusSchema = z.object({
  status: z.enum(['new', 'read', 'responded', 'archived']),
});

export type UpdateContactRequestStatusInput = z.infer<typeof updateContactRequestStatusSchema>;
