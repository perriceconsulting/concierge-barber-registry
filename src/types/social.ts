export type SocialPlatform =
  | 'instagram-post'
  | 'instagram-story'
  | 'tiktok'
  | 'snapchat'
  | 'x-twitter'
  | 'pinterest'
  | 'facebook';

export type TemplateType =
  | 'join-registry'
  | 'barber-features'
  | 'find-your-barber'
  | 'why-choose-us'
  | 'custom-announcement';

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
  audience: 'barbers' | 'clients' | 'general';
}

export interface MarketingPostData {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  backgroundImageUrl?: string;
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
  'join-registry':      { name: 'Join the Registry',  description: 'Recruit barbers — grow your business, get verified',    icon: '✂️', audience: 'barbers' },
  'barber-features':    { name: 'Barber Features',    description: 'Showcase platform features for barbers',                icon: '🚀', audience: 'barbers' },
  'find-your-barber':   { name: 'Find Your Barber',   description: 'Attract clients — discover verified barbers near you',  icon: '🔍', audience: 'clients' },
  'why-choose-us':      { name: 'Why Choose Us',      description: 'Trust signals — verified licenses, real reviews',       icon: '🛡️', audience: 'clients' },
  'custom-announcement': { name: 'Custom Announcement', description: 'Custom headline and message with platform branding', icon: '📣', audience: 'general' },
};
