import type { TemplateType, SocialPlatform } from '@/types/social';
import { PLATFORM_CONFIGS } from '@/types/social';
import { APP_CONFIG, ROUTES } from '@/config';

interface CaptionData {
  caption: string;
  hashtags: string[];
  platformTip: string;
}

const BRAND_HASHTAG = '#conciergebarberregistry';

const BARBER_HASHTAGS = [
  '#licenseverifiedbarber',
  '#independentbarber',
  '#barbermarketing',
  '#nochairrent',
  '#barber',
  '#barberlife',
  '#barbershop',
  '#barbergrowth',
  '#barbernation',
  '#fade',
  '#freshcut',
  '#barberlove',
  '#mensgrooming',
  '#barberworld',
];

const CLIENT_HASHTAGS = [
  '#licenseverifiedbarber',
  '#findabarber',
  '#barbershopnearme',
  '#freshfade',
  '#trustedbarber',
  '#barber',
  '#barbershop',
  '#mensgrooming',
  '#haircut',
  '#freshcut',
  '#mensstyle',
  '#selfcare',
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

// Map each template to the destination URL that matches its audience funnel.
// Barber-recruiting posts -> /for-barbers; client-discovery posts -> /for-clients;
// announcements default to homepage.
const TEMPLATE_DESTINATIONS: Record<TemplateType, string> = {
  'join-registry': ROUTES.FOR_BARBERS,
  'barber-features': ROUTES.FOR_BARBERS,
  'find-your-barber': ROUTES.FOR_CLIENTS,
  'why-choose-us': ROUTES.FOR_CLIENTS,
  'custom-announcement': ROUTES.HOME,
};

function destinationUrl(template: TemplateType): string {
  // Strip protocol+slash for caption display, then add path after the bare domain
  const path = TEMPLATE_DESTINATIONS[template];
  return path === '/'
    ? APP_CONFIG.domain
    : `${APP_CONFIG.domain}${path}`;
}

// Long captions for Instagram, TikTok, Facebook — full pitch + bullets + URL.
// Voice: aligned with site (license-verified, "Keep 100% of your cut", "no booking fees",
// "no chair rent"). Brand entity ("Concierge Barber Registry") used in full at least once
// for NLP entity disambiguation.
const LONG_CAPTIONS: Record<TemplateType, { barber: string; client: string }> = {
  'join-registry': {
    barber: `🪒 Keep 100% of your cut. 0% of the shop drama.

Concierge Barber Registry is the license-verified directory built for independent barbers and stylists.

✅ Verified badge clients trust
✅ Zero booking fees — own every client
✅ No chair rent. No middleman.
✅ Free Starter tier, 14-day trial on paid plans

Claim your professional profile 👇
${destinationUrl('join-registry')}`,
    client: '',
  },
  'barber-features': {
    barber: `💈 Everything an independent barber needs — in one license-verified platform.

📸 Curated portfolio gallery
⭐ Authentic client reviews
✈️ Travel & mobile service tools
🛡️ Verified-pro badge on your profile
📱 Built-in marketing assets

No chair rent. No booking fees. Just premium clients.

Claim your professional profile 👇
${destinationUrl('barber-features')}`,
    client: '',
  },
  'find-your-barber': {
    barber: '',
    client: `🔍 Looking for a barber you can trust?

Concierge Barber Registry is a license-verified directory of independent barbers in your area.

✅ Every barber is credentialed before approval
✅ Real client reviews, not paid placements
✅ Browse portfolios before you book
✅ Mobile barbers who come to you
✅ 100% free for clients — no booking fees

Find your next cut 👇
${destinationUrl('find-your-barber')}`,
  },
  'why-choose-us': {
    barber: '',
    client: `💈 Why clients trust Concierge Barber Registry:

🛡️ Every barber is license-verified
⭐ Authentic reviews from real clients
📸 See their work before you book
🚗 Mobile barbers who come to you
💸 Zero booking fees — book direct

The verified barber directory. Free for clients.

Browse the registry 👇
${destinationUrl('why-choose-us')}`,
  },
  'custom-announcement': {
    barber: `📣 News from ${APP_CONFIG.name} — the license-verified barber directory.

Stay tuned for details 👇
${destinationUrl('custom-announcement')}`,
    client: `📣 News from ${APP_CONFIG.name} — the license-verified barber directory.

Stay tuned for details 👇
${destinationUrl('custom-announcement')}`,
  },
};

// Short captions for X/Twitter, Snapchat, Pinterest — single-message form.
const SHORT_CAPTIONS: Record<TemplateType, { barber: string; client: string }> = {
  'join-registry': {
    barber: `🪒 Keep 100% of your cut. License-verified directory built for independent barbers. Free Starter tier.\n\n${destinationUrl('join-registry')}`,
    client: '',
  },
  'barber-features': {
    barber: `💈 Verified profile. Portfolio. Reviews. Mobile tools. Zero booking fees. Built for independent barbers.\n\n${destinationUrl('barber-features')}`,
    client: '',
  },
  'find-your-barber': {
    barber: '',
    client: `🔍 License-verified barbers near you. Browse portfolios + real reviews. Free for clients.\n\n${destinationUrl('find-your-barber')}`,
  },
  'why-choose-us': {
    barber: '',
    client: `💈 License-verified barbers. Real reviews. Zero booking fees. Browse before you book.\n\n${destinationUrl('why-choose-us')}`,
  },
  'custom-announcement': {
    barber: `📣 News from ${APP_CONFIG.name} 👇\n${destinationUrl('custom-announcement')}`,
    client: `📣 News from ${APP_CONFIG.name} 👇\n${destinationUrl('custom-announcement')}`,
  },
};

// Ultra-short captions for YouTube Shorts (100 char title limit — hashtags go in tags field, not title).
const YT_SHORTS_CAPTIONS: Record<TemplateType, { barber: string; client: string }> = {
  'join-registry': {
    barber: 'Keep 100% of Your Cut — License-Verified Barber Directory #shorts',
    client: '',
  },
  'barber-features': {
    barber: 'Built for Independent Barbers — Free to Start #shorts',
    client: '',
  },
  'find-your-barber': {
    barber: '',
    client: 'License-Verified Barbers Near You — Free for Clients #shorts',
  },
  'why-choose-us': {
    barber: '',
    client: 'Why Clients Trust License-Verified Barbers #shorts',
  },
  'custom-announcement': {
    barber: `News from ${APP_CONFIG.name} #shorts`,
    client: `News from ${APP_CONFIG.name} #shorts`,
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

const SHORT_PLATFORMS: SocialPlatform[] = ['x-twitter', 'snapchat', 'pinterest'];

export function generateCaptionData(
  template: TemplateType,
  platform: SocialPlatform,
): CaptionData {
  const isBarberTemplate = ['join-registry', 'barber-features'].includes(template);

  // YouTube Shorts gets its own ultra-short captions — no separate hashtags (baked into title)
  if (platform === 'youtube-shorts') {
    const ytCaptions = YT_SHORTS_CAPTIONS[template];
    const caption = isBarberTemplate
      ? ytCaptions.barber
      : (ytCaptions.client || ytCaptions.barber);
    return {
      caption,
      hashtags: [],
      platformTip: PLATFORM_TIPS[platform],
    };
  }

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
    BRAND_HASHTAG,
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
