import type { TemplateType, SocialPlatform } from '@/types/social';

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
  'instagram-story': ['#instastory', '#storytime'],
  'tiktok': ['#fyp', '#foryou', '#barbertok', '#hairtok'],
  'snapchat': [],
  'x-twitter': [],
  'pinterest': ['#pinterestinspired', '#menstyleinspo'],
  'facebook': [],
};

const CAPTIONS: Record<TemplateType, { barberCaption: string; clientCaption: string }> = {
  'join-registry': {
    barberCaption: '🪒 Ready to grow your client base? Join Concierge Barber Registry — the platform built for barbers who want to be found.\n\n✅ Get verified\n✅ Showcase your portfolio\n✅ Accept bookings from new clients\n✅ Travel & mobile service support\n\nSign up free today 👇\nconciergebarberregistry.com',
    clientCaption: '',
  },
  'barber-features': {
    barberCaption: '💈 Everything you need to grow your barber business — in one platform.\n\n📸 Portfolio gallery\n⭐ Client reviews\n✈️ Travel dates\n🚗 Mobile service\n🛡️ Verified badge\n📱 Marketing tools\n\nJoin for free 👇\nconciergebarberregistry.com',
    clientCaption: '',
  },
  'find-your-barber': {
    barberCaption: '',
    clientCaption: '🔍 Looking for a skilled barber you can trust?\n\nConcierge Barber Registry connects you with licensed, verified barbers in your area.\n\n✅ Browse portfolios\n✅ Read real reviews\n✅ Find mobile barbers\n✅ 100% free for clients\n\nFind your next barber 👇\nconciergebarberregistry.com',
  },
  'why-choose-us': {
    barberCaption: '',
    clientCaption: '💈 Why thousands of clients trust Concierge Barber Registry:\n\n🛡️ Every barber is license-verified\n⭐ Authentic client reviews\n📸 See their work before you book\n🚗 Find barbers who come to you\n\nSearch free — no account needed 👇\nconciergebarberregistry.com',
  },
  'custom-announcement': {
    barberCaption: '📣 Big news from Concierge Barber Registry!\n\nStay tuned for details 👇\nconciergebarberregistry.com',
    clientCaption: '📣 Big news from Concierge Barber Registry!\n\nStay tuned for details 👇\nconciergebarberregistry.com',
  },
};

const PLATFORM_TIPS: Record<SocialPlatform, string> = {
  'instagram-post': 'Best: 3-5 hashtags in caption, rest in first comment. Post at 11am-1pm or 7-9pm. Use Reels for 3x reach.',
  'instagram-story': 'Add poll/question sticker for engagement. Use location tag. Post during peak hours (11am-1pm).',
  'tiktok': 'First 3 seconds matter most. Use trending sounds. Post 3-5x/week. Best times: 7-9am, 12-3pm, 7-11pm.',
  'snapchat': 'Keep it casual and authentic. Use as a Story. Best for behind-the-scenes content.',
  'x-twitter': 'Keep caption under 280 chars. Use 1-3 hashtags max. Engage in replies. Post 3-5x/day.',
  'pinterest': 'Add keyword-rich description. Pin to relevant boards. Vertical pins get 60% more engagement.',
  'facebook': 'Ask a question in caption for engagement. Tag location. Post at 1-4pm weekdays.',
};

export function generateCaptionData(
  template: TemplateType,
  platform: SocialPlatform,
): CaptionData {
  const templateCaptions = CAPTIONS[template];
  const isBarberTemplate = ['join-registry', 'barber-features'].includes(template);

  const caption = isBarberTemplate
    ? templateCaptions.barberCaption
    : (templateCaptions.clientCaption || templateCaptions.barberCaption);

  const baseHashtags = isBarberTemplate
    ? BARBER_HASHTAGS.slice(0, 12)
    : CLIENT_HASHTAGS.slice(0, 12);

  const platformSpecific = PLATFORM_HASHTAGS[platform] || [];

  const hashtags = [...new Set([
    '#conciergebarberregistry',
    ...platformSpecific,
    ...baseHashtags,
  ])];

  return {
    caption,
    hashtags,
    platformTip: PLATFORM_TIPS[platform],
  };
}
