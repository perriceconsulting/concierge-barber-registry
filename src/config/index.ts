export const APP_CONFIG = {
  name: 'Concierge Barber Registry',
  domain: 'conciergebarberregistry.com',
  description: 'Discover and connect with verified, top-rated barbers in your area. Browse portfolios, read reviews, and find your perfect cut.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  BARBERS: '/barbers',
  SPECIALTIES: '/specialties',
  ABOUT: '/about',
  CONTACT: '/contact',
  FAQ: '/faq',
  BLOG: '/blog',
  FOR_BARBERS: '/for-barbers',
  FOR_CLIENTS: '/for-clients',
  PRIVACY: '/privacy-policy',
  TERMS: '/terms-of-service',

  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  REGISTER_BARBER: '/register?role=barber',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',

  // Dashboard routes
  DASHBOARD: '/dashboard',
  DASHBOARD_PROFILE: '/dashboard/profile',
  DASHBOARD_SERVICES: '/dashboard/services',
  DASHBOARD_PORTFOLIO: '/dashboard/portfolio',
  DASHBOARD_REVIEWS: '/dashboard/reviews',
  DASHBOARD_REQUESTS: '/dashboard/requests',
  DASHBOARD_SETTINGS: '/dashboard/settings',
  DASHBOARD_SUBSCRIPTION: '/dashboard/subscription',
  DASHBOARD_HELP: '/dashboard/help',
  DASHBOARD_SERVICE_AREAS: '/dashboard/service-areas',
  DASHBOARD_APPEAL: '/dashboard/appeal',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_BARBERS: '/admin/barbers',
  ADMIN_USERS: '/admin/users',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_SPECIALTIES: '/admin/specialties',
  ADMIN_APPEALS: '/admin/appeals',
  ADMIN_SOCIAL: '/admin/social',
  ADMIN_BLOG: '/admin/blog',
  ADMIN_AUDIT_LOG: '/admin/audit-log',

  // API routes
  API_AUTH_REGISTER: '/api/auth/register',
  API_AUTH_LOGIN: '/api/auth/login',
  API_AUTH_LOGOUT: '/api/auth/logout',
  API_AUTH_REFRESH: '/api/auth/refresh',
  API_BARBERS: '/api/barbers',
  API_REVIEWS: '/api/reviews',
  API_SPECIALTIES: '/api/specialties',
  API_FAVORITES: '/api/favorites',
  API_STRIPE_CHECKOUT: '/api/stripe/checkout',
  API_STRIPE_PORTAL: '/api/stripe/portal',
  API_STRIPE_WEBHOOKS: '/api/stripe/webhooks',
  API_BARBERS_SUBSCRIPTION: '/api/barbers/subscription',
} as const;

export const COLORS = {
  primary: '#1A1A2E', // Deep Navy/Black
  secondary: '#C9A96E', // Gold/Brass
  accent: '#E94560', // Bold Red
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  MAX_PORTFOLIO_IMAGES: 20,
  MAX_FILE_SIZE_MB: 5,
  MAX_AVATAR_SIZE_MB: 2,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
} as const;

export const RATE_LIMITS = {
  AUTH_LOGIN: { limit: 5, window: '15m' },
  AUTH_REGISTER: { limit: 3, window: '1h' },
  AUTH_FORGOT_PASSWORD: { limit: 3, window: '1h' },
  CONTACT_FORM: { limit: 5, window: '1h' },
  FILE_UPLOAD: { limit: 10, window: '1h' },
  REVIEW_SUBMIT: { limit: 5, window: '1d' },
  API_GENERAL: { limit: 100, window: '1m' },
} as const;

export const SPECIALTIES = [
  'Fades',
  'Tapers',
  'Lineups',
  'Beard Trim',
  'Beard Shaping',
  'Hot Towel Shave',
  'Hair Systems',
  'Hair Coloring',
  'Kids Cuts',
  'Afro',
  'Dreadlocks',
  'Braids',
  'Designs/Patterns',
  'Scissor Cut',
  'Flat Top',
  'Mohawk',
  'Mullet',
  'Senior Cuts',
  'Head Shave',
  'Eyebrow Threading',
  'Facial Treatment',
] as const;

export const SUBSCRIPTION = {
  TRIAL_DAYS: 14,
  TIERS: {
    STARTER: 'starter',
    PROFESSIONAL: 'professional',
    ELITE: 'elite',
  },
  PRICES: {
    PROFESSIONAL_MONTHLY_CENTS: 2900,
    PROFESSIONAL_ANNUAL_CENTS: 29000,
    ELITE_MONTHLY_CENTS: 5900,
    ELITE_ANNUAL_CENTS: 59000,
  },
} as const;

export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
] as const;
