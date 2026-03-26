import type { TemplateType, SocialPlatform } from '@/types/social';
import { PLATFORM_CONFIGS } from '@/types/social';

interface CaptionData {
  caption: string;
  hashtags: string[];
  platformTip: string;
}

const BARBER_HASHTAGS = [
  '#barber', '#barbershop', '#fade', '#freshcut', '#haircut',
  '#barberlife', '#menshair', '#lineup', '#taper', '#skinfade',
  '#barberlove', '#hairstyle', '#grooming', '#mensgrooming',
  '#barberworld', '#cleancut', '#barbernation',
];

const CLIENT_HASHTAGS = [
  '#findabarber', '#barberneeded', '#freshfade', '#newbarber',
  '#barbershopnearme', '#mensgrooming', '#haircut', '#fade',
  '#barber', '#barbershop', '#grooming', '#mensstyle',
  '#selfcare', '#lookgood', '#confidence',
];

const PLATFORM_HASHTAGS: Record<string, string[]> = {
  'instagram-post': ['#explorepage', '#reels', '#instagood'],
  'instagram-story': ['#instastory'],
  'tiktok': ['#fyp', '#foryou', '#barbertok', '#hairtok'],
  'snapchat': [],
  'x-twitter': [],
  'pinterest': ['#pinterestinspired'],
  'facebook': [],
  'youtube-shorts': ['#shorts', '#youtubeshorts'],
};

// Full captions for long-form platforms (Instagram, TikTok, Facebook)
const LONG_CAPTIONS: Record<TemplateType, { barber: string; client: string }> = {
  'join-registry': {
    barber: '🪒 Ready to grow your client base? Join Concierge Barber Registry — the platform built for barbers who want to be found.\n\n✅ Get verified\n✅ Showcase your portfolio\n✅ Accept bookings from new clients\n✅ Travel & mobile service support\n\nSign up free today 👇\nconciergebarberregistry.com',
    client: '',
  },
  'barber-features': {
    barber: '💈 Everything you need to grow your barber business — in one platform.\n\n📸 Portfolio gallery\n⭐ Client reviews\n✈️ Travel dates\n🚗 Mobile service\n🛡️ Verified badge\n📱 Marketing tools\n\nJoin for free 👇\nconciergebarberregistry.com',
    client: '',
  },
  'find-your-barber': {
    barber: '',
    client: '🔍 Looking for a skilled barber you can trust?\n\nConcierge Barber Registry connects you with licensed, verified barbers in your area.\n\n✅ Browse portfolios\n✅ Read real reviews\n✅ Find mobile barbers\n✅ 100% free for clients\n\nFind your next barber 👇\nconciergebarberregistry.com',
  },
  'why-choose-us': {
    barber: '',
    client: '💈 Why clients trust Concierge Barber Registry:\n\n🛡️ Every barber is license-verified\n⭐ Authentic client reviews\n📸 See their work before you book\n🚗 Find barbers who come to you\n\nSearch free — no account needed 👇\nconciergebarberregistry.com',
  },
  'custom-announcement': {
    barber: '📣 Big news from Concierge Barber Registry!\n\nStay tuned for details 👇\nconciergebarberregistry.com',
    client: '📣 Big news from Concierge Barber Registry!\n\nStay tuned for details 👇\nconciergebarberregistry.com',
  },
};

// Short captions for character-limited platforms (X/Twitter, Snapchat, Pinterest)
const SHORT_CAPTIONS: Record<TemplateType, { barber: string; client: string }> = {
  'join-registry': {
    barber: '🪒 Grow your client base. Get verified. Showcase your work.\n\nJoin free 👇\nconciergebarberregistry.com',
    client: '',
  },
  'barber-features': {
    barber: '💈 Portfolio. Reviews. Mobile service. Travel dates. Everything a barber needs.\n\nconciergebarberregistry.com',
    client: '',
  },
  'find-your-barber': {
    barber: '',
    client: '🔍 Find verified, top-rated barbers near you. Browse portfolios & reviews. 100% free.\n\nconciergebarberregistry.com',
  },
  'why-choose-us': {
    barber: '',
    client: '💈 License-verified barbers. Real reviews. Browse portfolios before you book.\n\nconciergebarberregistry.com',
  },
  'custom-announcement': {
    barber: '📣 News from Concierge Barber Registry 👇\nconciergebarberregistry.com',
    client: '📣 News from Concierge Barber Registry 👇\nconciergebarberregistry.com',
  },
};

const PLATFORM_TIPS: Record<SocialPlatform, string> = {
  'instagram-post': 'Best: 3-5 hashtags in caption, rest in first comment. Post 11am-1pm or 7-9pm.',
  'instagram-story': 'Add poll/question sticker for engagement. Use location tag.',
  'tiktok': 'First 3 seconds matter most. Use trending sounds. Post 7-9am, 12-3pm, or 7-11pm.',
  'snapchat': 'Keep it casual and authentic. Best for behind-the-scenes content.',
  'x-twitter': 'Engage in replies for reach. Post 3-5x/day. Keep it punchy.',
  'pinterest': 'Add keyword-rich description. Pin to relevant boards. Vertical pins get 60% more engagement.',
  'facebook': 'Ask a question for engagement. Tag location. Post 1-4pm weekdays.',
  'youtube-shorts': 'Title is key — front-load keywords. Add 3 hashtags including #shorts. Under 60 seconds.',
};

// Platforms with short character limits
const SHORT_PLATFORMS: SocialPlatform[] = ['x-twitter', 'snapchat', 'pinterest', 'youtube-shorts'];

export function generateCaptionData(
  template: TemplateType,
  platform: SocialPlatform,
): CaptionData {
  const isBarberTemplate = ['join-registry', 'barber-features'].includes(template);
  const isShort = SHORT_PLATFORMS.includes(platform);
  const captions = isShort ? SHORT_CAPTIONS[template] : LONG_CAPTIONS[template];

  const caption = isBarberTemplate
    ? captions.barber
    : (captions.client || captions.barber);

  // Fewer hashtags for short platforms
  const maxHashtags = isShort ? 3 : 12;
  const baseHashtags = isBarberTemplate
    ? BARBER_HASHTAGS.slice(0, maxHashtags)
    : CLIENT_HASHTAGS.slice(0, maxHashtags);

  const platformSpecific = PLATFORM_HASHTAGS[platform] || [];

  // No hashtags for Snapchat
  const hashtags = platform === 'snapchat' ? [] : [...new Set([
    '#conciergebarberregistry',
    ...platformSpecific,
    ...baseHashtags,
  ])].slice(0, maxHashtags + 2);

  // Verify we fit within the platform limit
  const pConfig = PLATFORM_CONFIGS[platform];
  const fullText = caption + (hashtags.length > 0 ? '\n\n' + hashtags.join(' ') : '');
  const withinLimit = fullText.length <= pConfig.captionLimit;

  return {
    caption,
    hashtags,
    platformTip: PLATFORM_TIPS[platform] + (withinLimit ? '' : ' ⚠️ Consider posting hashtags as a separate comment.'),
  };
}
