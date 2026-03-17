import { z } from 'zod';

// Create barber profile schema
export const createBarberProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(150, 'Display name is too long'),
  bio: z.string().max(2000, 'Bio is too long').optional(),
  tagline: z.string().max(255, 'Tagline is too long').optional(),
  yearsExperience: z.number().int().min(0).max(100).optional(),
  licenseNumber: z.string().max(100, 'License number is too long').optional(),
  licenseState: z.string().length(2, 'State must be a 2-letter code').optional(),
  licenseExpirationDate: z.string().optional(),
  shopName: z.string().max(200, 'Shop name is too long').optional(),
  shopAddressLine1: z.string().max(255, 'Address is too long').optional(),
  shopAddressLine2: z.string().max(255, 'Address is too long').optional(),
  city: z.string().min(1, 'City is required').max(100, 'City is too long'),
  state: z.string().length(2, 'State must be a 2-letter code'),
  zipCode: z.string().min(5, 'ZIP code must be at least 5 characters').max(10, 'ZIP code is too long'),
  offersMobileService: z.boolean().default(false),
  mobileServiceRadiusMiles: z.number().int().min(0).max(500).optional(),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagramHandle: z.string().max(100, 'Instagram handle is too long').optional(),
  tiktokHandle: z.string().max(100, 'TikTok handle is too long').optional(),
  acceptsWalkins: z.boolean().default(true),
  acceptsAppointments: z.boolean().default(true),
  vacationMode: z.boolean().default(false),
  specialtyIds: z.array(z.number().int()).min(1, 'At least one specialty is required'),
});

export type CreateBarberProfileInput = z.infer<typeof createBarberProfileSchema>;

// Update barber profile schema
export const updateBarberProfileSchema = createBarberProfileSchema.partial().extend({
  specialtyIds: z.array(z.number().int()).optional(),
});

export type UpdateBarberProfileInput = z.infer<typeof updateBarberProfileSchema>;

// Service schema
export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(150, 'Service name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  priceCents: z.number().int().min(0, 'Price must be positive'),
  durationMinutes: z.number().int().min(5, 'Duration must be at least 5 minutes').max(480, 'Duration cannot exceed 8 hours'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = createServiceSchema.partial();

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

// Portfolio image schema
export const createPortfolioImageSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
  caption: z.string().max(255, 'Caption is too long').optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export type CreatePortfolioImageInput = z.infer<typeof createPortfolioImageSchema>;



// Service area schema
export const serviceAreaSchema = z.object({
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().length(2, 'State must be 2 letters').regex(/^[A-Z]{2}$/, 'State must be uppercase'),
  notes: z.string().max(255).optional(),
});

export type ServiceAreaInput = z.infer<typeof serviceAreaSchema>;

// Travel date schema
export const travelDateSchema = z.object({
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().length(2, 'State must be 2 letters').regex(/^[A-Z]{2}$/, 'State must be uppercase'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  notes: z.string().max(500).optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export type TravelDateInput = z.infer<typeof travelDateSchema>;

export const updateTravelDateSchema = z.object({
  city: z.string().min(1).max(100).optional(),
  state: z.string().length(2).regex(/^[A-Z]{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTravelDateInput = z.infer<typeof updateTravelDateSchema>;

// Barber search/filter schema
export const barberSearchSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  zip: z.string().optional(),
  radius: z.number().int().min(1).max(500).optional(),
  specialty: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  mobileService: z.boolean().optional(),
  walkIns: z.boolean().optional(),
  sort: z.enum(['rating', 'distance', 'newest', 'name']).default('rating'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export type BarberSearchInput = z.infer<typeof barberSearchSchema>;
