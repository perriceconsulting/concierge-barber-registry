export interface SocialKeyword {
  value: string;
  label: string;
  category: 'services' | 'lifestyle' | 'business' | 'location';
}

export const SOCIAL_KEYWORDS: SocialKeyword[] = [
  // Services
  { value: 'fade', label: 'Fade', category: 'services' },
  { value: 'taper', label: 'Taper', category: 'services' },
  { value: 'lineup', label: 'Lineup', category: 'services' },
  { value: 'beard-trim', label: 'Beard Trim', category: 'services' },
  { value: 'hot-towel-shave', label: 'Hot Towel Shave', category: 'services' },
  { value: 'skin-fade', label: 'Skin Fade', category: 'services' },
  { value: 'scissor-cut', label: 'Scissor Cut', category: 'services' },
  { value: 'hair-design', label: 'Hair Design', category: 'services' },
  { value: 'kids-cut', label: 'Kids Cut', category: 'services' },
  { value: 'braids', label: 'Braids', category: 'services' },
  { value: 'afro', label: 'Afro', category: 'services' },

  // Lifestyle
  { value: 'grooming', label: 'Grooming', category: 'lifestyle' },
  { value: 'self-care', label: 'Self Care', category: 'lifestyle' },
  { value: 'confidence', label: 'Confidence', category: 'lifestyle' },
  { value: 'fresh-cut', label: 'Fresh Cut', category: 'lifestyle' },
  { value: 'mens-style', label: "Men's Style", category: 'lifestyle' },
  { value: 'clean-look', label: 'Clean Look', category: 'lifestyle' },

  // Business
  { value: 'book-now', label: 'Book Now', category: 'business' },
  { value: 'walk-ins', label: 'Walk-Ins Welcome', category: 'business' },
  { value: 'mobile-barber', label: 'Mobile Barber', category: 'business' },
  { value: 'verified', label: 'Verified', category: 'business' },
  { value: 'licensed', label: 'Licensed', category: 'business' },
  { value: 'appointment', label: 'By Appointment', category: 'business' },
  { value: 'new-clients', label: 'New Clients', category: 'business' },

  // Location
  { value: 'near-me', label: 'Near Me', category: 'location' },
  { value: 'local-barber', label: 'Local Barber', category: 'location' },
  { value: 'traveling-barber', label: 'Traveling Barber', category: 'location' },
  { value: 'house-calls', label: 'House Calls', category: 'location' },
];

export const KEYWORD_CATEGORIES = [
  { value: 'services', label: 'Services' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'business', label: 'Business' },
  { value: 'location', label: 'Location' },
] as const;
