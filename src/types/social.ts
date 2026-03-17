export type SocialPlatform =
  | 'instagram-post'
  | 'instagram-story'
  | 'tiktok'
  | 'snapchat'
  | 'x-twitter'
  | 'pinterest'
  | 'facebook';

export type TemplateType =
  | 'portfolio-showcase'
  | 'service-spotlight'
  | 'review-testimonial'
  | 'in-town'
  | 'new-client-special';

export interface PlatformConfig {
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export interface TemplateConfig {
  name: string;
  description: string;
  icon: string;
  requiredData: string[];
}

export interface SocialPostData {
  barberName: string;
  tagline?: string;
  city: string;
  state: string;
  tier: 'starter' | 'professional' | 'elite';
  instagramHandle?: string;
  tiktokHandle?: string;

  // Portfolio Showcase
  portfolioImageUrl?: string;
  portfolioCaption?: string;

  // Service Spotlight
  serviceName?: string;
  servicePriceCents?: number;
  serviceDurationMinutes?: number;

  // Review Testimonial
  reviewRating?: number;
  reviewComment?: string;
  reviewerName?: string;

  // In Town
  travelCity?: string;
  travelState?: string;
  travelStartDate?: string;
  travelEndDate?: string;

  // New Client Special
  promoText?: string;
}

export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  'instagram-post':  { name: 'Instagram Post',  width: 1080, height: 1080, aspectRatio: '1:1' },
  'instagram-story': { name: 'Instagram Story', width: 1080, height: 1920, aspectRatio: '9:16' },
  'tiktok':          { name: 'TikTok',          width: 1080, height: 1920, aspectRatio: '9:16' },
  'snapchat':        { name: 'Snapchat',        width: 1080, height: 1920, aspectRatio: '9:16' },
  'x-twitter':       { name: 'X / Twitter',     width: 1200, height: 675,  aspectRatio: '16:9' },
  'pinterest':       { name: 'Pinterest',       width: 1000, height: 1500, aspectRatio: '2:3' },
  'facebook':        { name: 'Facebook Post',   width: 1200, height: 630,  aspectRatio: '~1.91:1' },
};

export const TEMPLATE_CONFIGS: Record<TemplateType, TemplateConfig> = {
  'portfolio-showcase':  { name: 'Portfolio Showcase',  description: 'Feature a portfolio image with your branding', icon: '📸', requiredData: ['portfolio'] },
  'service-spotlight':   { name: 'Service Spotlight',   description: 'Highlight a specific service with pricing',    icon: '✂️', requiredData: ['services'] },
  'review-testimonial':  { name: 'Review Testimonial',  description: 'Show off a great client review',              icon: '⭐', requiredData: ['reviews'] },
  'in-town':             { name: "I'm in Town",         description: 'Announce your travel dates',                   icon: '✈️', requiredData: ['travelDates'] },
  'new-client-special':  { name: 'New Client Special',  description: 'Promote a special offer',                     icon: '🎉', requiredData: [] },
};
