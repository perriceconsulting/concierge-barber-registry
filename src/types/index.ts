// User types
export type UserRole = 'barber' | 'client' | 'admin';

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type ContactRequestStatus = 'new' | 'read' | 'responded' | 'archived';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Barber types
export interface BarberProfile {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  bio?: string | null;
  tagline?: string | null;
  yearsExperience?: number | null;
  licenseNumber?: string | null;
  licenseState?: string | null;
  licenseVerified: boolean;
  verificationStatus: VerificationStatus;
  shopName?: string | null;
  shopAddressLine1?: string | null;
  shopAddressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number | null;
  longitude?: number | null;
  offersMobileService: boolean;
  mobileServiceRadiusMiles?: number | null;
  websiteUrl?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  acceptsWalkins: boolean;
  acceptsAppointments: boolean;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  profileViews: number;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  specialties?: Specialty[];
  services?: Service[];
  portfolioImages?: PortfolioImage[];
  reviews?: Review[];
  operatingHours?: OperatingHours[];
}

// Specialty types
export interface Specialty {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
}

// Service types
export interface Service {
  id: string;
  barberProfileId: string;
  name: string;
  description?: string | null;
  priceCents: number;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

// Portfolio types
export interface PortfolioImage {
  id: string;
  barberProfileId: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  sortOrder: number;
  createdAt: Date;
}

// Review types
export interface Review {
  id: string;
  barberProfileId: string;
  clientUserId?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerified: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  client?: User;
}

// Operating Hours types
export interface OperatingHours {
  id: number;
  barberProfileId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime?: string | null;
  closeTime?: string | null;
  isClosed: boolean;
}

// Contact Request types
export interface ContactRequest {
  id: string;
  barberProfileId: string;
  clientUserId?: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  message: string;
  serviceInterested?: string | null;
  preferredDate?: Date | null;
  preferredTime?: string | null;
  status: ContactRequestStatus;
  createdAt: Date;
  barberProfile?: BarberProfile;
}

// Favorite types
export interface Favorite {
  clientUserId: string;
  barberProfileId: string;
  createdAt: Date;
  barberProfile?: BarberProfile;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search/Filter types
export interface BarberSearchFilters {
  q?: string;
  city?: string;
  state?: string;
  zip?: string;
  radius?: number;
  specialty?: string;
  minRating?: number;
  mobileService?: boolean;
  walkIns?: boolean;
  sort?: 'rating' | 'distance' | 'newest' | 'name';
  page?: number;
  limit?: number;
}
