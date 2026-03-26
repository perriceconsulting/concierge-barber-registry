export type SocialPlatform =
  | 'instagram-post'
  | 'instagram-story'
  | 'tiktok'
  | 'snapchat'
  | 'x-twitter'
  | 'pinterest'
  | 'facebook'
  | 'youtube-shorts';

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
  captionLimit: number;
  hashtagTip: string;
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
  'instagram-post':  { name: 'Instagram Post',  width: 1080, height: 1080, aspectRatio: '1:1',     captionLimit: 2200, hashtagTip: 'Max 30 hashtags, best 3-5 in caption' },
  'instagram-story': { name: 'Instagram Story', width: 1080, height: 1920, aspectRatio: '9:16',    captionLimit: 2200, hashtagTip: 'Use sticker hashtags instead' },
  'tiktok':          { name: 'TikTok',          width: 1080, height: 1920, aspectRatio: '9:16',    captionLimit: 4000, hashtagTip: 'Max 5 hashtags for best reach' },
  'snapchat':        { name: 'Snapchat',        width: 1080, height: 1920, aspectRatio: '9:16',    captionLimit: 250,  hashtagTip: 'Hashtags not used on Snapchat' },
  'x-twitter':       { name: 'X / Twitter',     width: 1200, height: 675,  aspectRatio: '16:9',    captionLimit: 280,  hashtagTip: 'Max 1-3 hashtags, keep it brief' },
  'pinterest':       { name: 'Pinterest',       width: 1000, height: 1500, aspectRatio: '2:3',     captionLimit: 500,  hashtagTip: 'Max 20 hashtags in description' },
  'facebook':        { name: 'Facebook Post',   width: 1200, height: 630,  aspectRatio: '~1.91:1', captionLimit: 63206, hashtagTip: 'Max 3-5 hashtags, less is more' },
  'youtube-shorts':  { name: 'YouTube Shorts',  width: 1080, height: 1920, aspectRatio: '9:16',    captionLimit: 100,   hashtagTip: 'Max 3 hashtags in title, use tags field for more' },
};

export const TEMPLATE_CONFIGS: Record<TemplateType, TemplateConfig> = {
  'join-registry':      { name: 'Join the Registry',  description: 'Recruit barbers — grow your business, get verified',    icon: '✂️', audience: 'barbers' },
  'barber-features':    { name: 'Barber Features',    description: 'Showcase platform features for barbers',                icon: '🚀', audience: 'barbers' },
  'find-your-barber':   { name: 'Find Your Barber',   description: 'Attract clients — discover verified barbers near you',  icon: '🔍', audience: 'clients' },
  'why-choose-us':      { name: 'Why Choose Us',      description: 'Trust signals — verified licenses, real reviews',       icon: '🛡️', audience: 'clients' },
  'custom-announcement': { name: 'Custom Announcement', description: 'Custom headline and message with platform branding', icon: '📣', audience: 'general' },
};
