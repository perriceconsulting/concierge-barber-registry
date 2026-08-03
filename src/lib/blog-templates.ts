import { SOCIAL_KEYWORDS } from './social-keywords';

export interface BlogTemplate {
  id: string;
  name: string;
  audience: 'for_clients' | 'for_barbers' | 'industry';
  audienceLabel: string;
  description: string;
  variables: TemplateVariable[];
  generate: (vars: Record<string, string>) => GeneratedPost;
}

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'select' | 'text';
  options?: { value: string; label: string }[];
  // When set, the UI replaces `options` with a live list fetched at render time
  // (e.g. the managed Specialty taxonomy). `options` remains the static fallback
  // used if the fetch fails or returns nothing.
  source?: 'specialties';
  placeholder?: string;
  required?: boolean;
}

export interface GeneratedPost {
  title: string;
  slug: string;
  description: string;
  keywords: string[];
  content: string;
  readingTime: number;
}

const SERVICES = SOCIAL_KEYWORDS.filter(k => k.category === 'services');
const SERVICE_OPTIONS = SERVICES.map(s => ({ value: s.label, label: s.label }));

const PLATFORM_FEATURES = [
  { value: 'Verified Badges', label: 'Verified Badges' },
  { value: 'Portfolio Gallery', label: 'Portfolio Gallery' },
  { value: 'Client Reviews', label: 'Client Reviews' },
  { value: 'Service Listings', label: 'Service Listings' },
  { value: 'Mobile Service', label: 'Mobile Service' },
  { value: 'Travel Dates', label: 'Travel Dates' },
  { value: 'Online Booking', label: 'Online Booking' },
  { value: 'Subscription Tiers', label: 'Subscription Tiers' },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 200);
}

// Specialty names from the DB are often plural ("Fades", "Lineups", "Kids
// Cuts") while the templates write singular nouns and append "s" for plurals
// (`${s}` → "a Fade", `${s}s` → "Fades"). Normalizing the chosen value to its
// singular form makes every existing interpolation read correctly. Compound
// names ("Designs/Patterns") degrade gracefully (→ "Designs/Pattern").
function toSingular(name: string): string {
  const trimmed = name.trim();
  if (/ss$/i.test(trimmed)) return trimmed; // "...ss" is not a plural marker
  if (/ies$/i.test(trimmed)) return trimmed.replace(/ies$/i, 'y');
  if (/s$/i.test(trimmed)) return trimmed.replace(/s$/i, '');
  return trimmed;
}

// ============ CLIENT TEMPLATES ============

const findBarberForService: BlogTemplate = {
  id: 'find-barber-service',
  name: 'Find a Barber for [Service]',
  audience: 'for_clients',
  audienceLabel: 'For Clients',
  description: 'Guide for clients looking for a barber who specializes in a specific service',
  variables: [
    { key: 'service', label: 'Service', type: 'select', options: SERVICE_OPTIONS, source: 'specialties', required: true },
  ],
  generate: (vars) => {
    const s = toSingular(vars.service);
    const sl = s.toLowerCase();
    return {
      title: `How to Find the Best ${s} Barber Near You`,
      slug: slugify(`how-to-find-best-${sl}-barber-near-you`),
      description: `Looking for a barber who specializes in ${sl}s? Learn what to look for, questions to ask, and how to find verified ${sl} specialists in your area.`,
      keywords: [`${sl} barber`, `best ${sl}`, `${sl} near me`, `${sl} specialist`, 'find barber', 'verified barber'],
      readingTime: 6,
      content: `
<p>Finding a barber who truly excels at ${sl}s can make the difference between a good haircut and a great one. Not every barber specializes in every technique, and ${sl}s require specific skills and experience. Here's how to find the right specialist.</p>

<h2>Why Specialization Matters for ${s}s</h2>
<p>A ${sl} isn't just another haircut — it's a specific technique that requires practice, precision, and an understanding of different hair types. A barber who regularly performs ${sl}s will deliver more consistent, higher-quality results than one who only does them occasionally.</p>

<h2>What to Look for in a ${s} Specialist</h2>
<ul>
  <li><strong>Portfolio evidence:</strong> Look for multiple examples of ${sl}s in their portfolio, not just one or two</li>
  <li><strong>Variety of hair types:</strong> A skilled ${sl} barber shows their work on different textures and types</li>
  <li><strong>Client reviews mentioning ${sl}s:</strong> Reviews that specifically praise their ${sl} work are the strongest signal</li>
  <li><strong>License verification:</strong> Ensures they've completed professional training</li>
</ul>

<h2>Questions to Ask Before Booking</h2>
<p>When you've found a potential ${sl} specialist, ask these questions:</p>
<ol>
  <li>How often do you perform ${sl}s?</li>
  <li>Can I see recent examples of your ${sl} work?</li>
  <li>What products do you recommend to maintain a ${sl} between visits?</li>
  <li>How long does a ${sl} appointment typically take?</li>
  <li>How often should I come back to maintain this style?</li>
</ol>

<h2>Where to Search</h2>
<p>Skip generic search engines and use a dedicated barber registry. On <strong>Concierge Barber Registry</strong>, you can browse barber portfolios filtered by specialty, read verified client reviews, and confirm that your barber is licensed. Every barber with a verified badge has had their credentials confirmed.</p>

<h2>Maintaining Your ${s} Between Visits</h2>
<p>A great ${sl} requires maintenance. Ask your barber about:</p>
<ul>
  <li>The right products for your hair type</li>
  <li>Daily styling techniques to keep the shape</li>
  <li>When to schedule your next appointment</li>
  <li>What to avoid between visits (certain products, activities)</li>
</ul>

<h2>Ready to Find Your ${s} Specialist?</h2>
<p>Browse verified barbers who specialize in ${sl}s on <strong>Concierge Barber Registry</strong>. View their portfolios, read reviews from clients who got the exact style you want, and book with confidence.</p>
      `,
    };
  },
};

const whyVerifiedMatters: BlogTemplate = {
  id: 'why-verified-matters',
  name: 'Why Choosing a Verified Barber Matters',
  audience: 'for_clients',
  audienceLabel: 'For Clients',
  description: 'Educates clients on the importance of choosing verified, licensed barbers',
  variables: [
    { key: 'concern', label: 'Client Concern', type: 'select', options: [
      { value: 'safety', label: 'Health & Safety' },
      { value: 'quality', label: 'Quality & Consistency' },
      { value: 'trust', label: 'Trust & Accountability' },
      { value: 'value', label: 'Getting Your Money\'s Worth' },
    ], required: true },
  ],
  generate: (vars) => {
    const concerns: Record<string, { title: string; focus: string; points: string[] }> = {
      safety: {
        title: 'Why a Verified Barber Is Safer for Your Health',
        focus: 'health and safety',
        points: [
          'Licensed barbers are trained in sanitation and bloodborne pathogen prevention',
          'Proper tool sterilization prevents infections and cross-contamination',
          'State board oversight ensures compliance with health codes',
          'Insurance coverage protects you if something goes wrong',
        ],
      },
      quality: {
        title: 'How Verified Barbers Deliver Better Results',
        focus: 'quality and consistency',
        points: [
          'Formal training covers hair science, textures, and advanced techniques',
          'Portfolio verification shows proven skill, not just claims',
          'Client reviews provide real-world quality evidence',
          'Continuing education keeps skills current with trends',
        ],
      },
      trust: {
        title: 'Why You Should Only Trust a Verified Barber',
        focus: 'trust and accountability',
        points: [
          'License verification confirms professional credentials',
          'Registered barbers are accountable to their state board',
          'Review systems create transparency and accountability',
          'Platform verification adds an extra layer of vetting',
        ],
      },
      value: {
        title: 'Why Verified Barbers Are Worth Every Dollar',
        focus: 'value for money',
        points: [
          'Skilled barbers deliver results that last longer between visits',
          'Professional product recommendations save you from trial and error',
          'Consistent quality means fewer bad haircut days',
          'Verified credentials mean you know what you\'re paying for',
        ],
      },
    };

    const c = concerns[vars.concern] || concerns.quality;

    return {
      title: c.title,
      slug: slugify(c.title),
      description: `Discover why choosing a verified barber matters for ${c.focus}. Learn how license verification and platform vetting protect your grooming experience.`,
      keywords: ['verified barber', 'licensed barber', `barber ${c.focus}`, 'barber verification', 'trusted barber', 'professional barber'],
      readingTime: 5,
      content: `
<p>With barbers on every corner and new ones popping up on social media daily, how do you know who to trust with your hair? The answer is verification. Choosing a verified barber directly impacts your ${c.focus}.</p>

<h2>What Does "Verified" Mean?</h2>
<p>On <strong>Concierge Barber Registry</strong>, a verified barber has had their professional license confirmed. This means they've completed accredited barber school, passed their state board exam, and maintain an active license. It's not a self-reported badge — it's independently confirmed.</p>

<h2>Why This Matters for ${c.focus.charAt(0).toUpperCase() + c.focus.slice(1)}</h2>
<ul>
${c.points.map(p => `  <li><strong>${p.split(' ').slice(0, 3).join(' ')}:</strong> ${p}</li>`).join('\n')}
</ul>

<h2>The Risk of Unlicensed Barbers</h2>
<p>Unlicensed barbers may offer lower prices, but the risks include:</p>
<ul>
  <li>No formal training in sanitation or technique</li>
  <li>No accountability if something goes wrong</li>
  <li>No insurance coverage for you as a client</li>
  <li>Inconsistent results with no professional standards</li>
</ul>

<h2>How to Verify Your Barber</h2>
<p>You can check license status through your state's barbering board, but the easiest way is to use a platform that does it for you. <strong>Concierge Barber Registry</strong> verifies every barber's license before awarding the verified badge. You can also review their portfolio, read client feedback, and see their service menu — all in one place.</p>

<h2>The Bottom Line</h2>
<p>Your hair is something you wear every day. Investing in a verified barber means investing in ${c.focus} that you can count on, visit after visit. Browse verified barbers on <strong>Concierge Barber Registry</strong> and book with confidence.</p>
      `,
    };
  },
};

const serviceGuide: BlogTemplate = {
  id: 'service-guide',
  name: 'Complete Guide to [Service]',
  audience: 'for_clients',
  audienceLabel: 'For Clients',
  description: 'In-depth guide to a specific barber service for clients',
  variables: [
    { key: 'service', label: 'Service', type: 'select', options: SERVICE_OPTIONS, source: 'specialties', required: true },
  ],
  generate: (vars) => {
    const s = toSingular(vars.service);
    const sl = s.toLowerCase();
    return {
      title: `The Complete Guide to ${s}s at the Barbershop`,
      slug: slugify(`complete-guide-to-${sl}s-barbershop`),
      description: `Everything you need to know about getting a ${sl} at the barbershop. What to expect, how to prepare, maintenance tips, and how to find the right barber.`,
      keywords: [`${sl} guide`, `${sl} barbershop`, `what is a ${sl}`, `${sl} tips`, `${sl} barber near me`],
      readingTime: 7,
      content: `
<p>Whether you're considering a ${sl} for the first time or looking to refine your current style, this guide covers everything you need to know about this popular barber service.</p>

<h2>What Is a ${s}?</h2>
<p>A ${sl} is a specialized barbering technique that requires skill, precision, and understanding of different hair types. It's one of the most requested services at professional barbershops and a staple of modern men's grooming.</p>

<h2>What to Expect During Your Appointment</h2>
<ol>
  <li><strong>Consultation:</strong> Your barber will discuss your desired look, assess your hair type, and make recommendations</li>
  <li><strong>Preparation:</strong> Hair is washed, dampened, or prepped depending on the technique</li>
  <li><strong>The service:</strong> Your barber performs the ${sl} using professional tools and techniques</li>
  <li><strong>Finishing:</strong> Styling products are applied and final adjustments are made</li>
  <li><strong>Aftercare:</strong> Your barber explains how to maintain the look at home</li>
</ol>

<h2>How to Prepare</h2>
<ul>
  <li>Bring reference photos of ${sl}s you like</li>
  <li>Arrive with clean, product-free hair if possible</li>
  <li>Be ready to discuss your hair care routine and styling preferences</li>
  <li>Allow enough time — rushing leads to compromises</li>
</ul>

<h2>How Long Does a ${s} Last?</h2>
<p>The longevity of a ${sl} depends on your hair growth rate and how well you maintain it. Most clients return every 2-4 weeks to keep the style looking fresh. Your barber can recommend a maintenance schedule based on your specific hair type.</p>

<h2>Maintenance Tips</h2>
<ul>
  <li>Use the products your barber recommends — they know your hair</li>
  <li>Follow the styling technique they show you</li>
  <li>Don't wait too long between appointments — maintenance is easier than starting over</li>
  <li>Protect your style while sleeping with a silk pillowcase if recommended</li>
</ul>

<h2>How Much Does a ${s} Cost?</h2>
<p>Pricing varies by location, barber experience, and the complexity of the service. You can compare ${sl} prices across verified barbers on <strong>Concierge Barber Registry</strong>, where barbers list their services and pricing transparently.</p>

<h2>Finding the Right ${s} Barber</h2>
<p>Not every barber specializes in ${sl}s. Browse barber portfolios on <strong>Concierge Barber Registry</strong> to find verified professionals who showcase ${sl} work. Read client reviews, compare pricing, and book with a specialist who excels at exactly what you want.</p>
      `,
    };
  },
};

// ============ BARBER TEMPLATES ============

const growWithFeature: BlogTemplate = {
  id: 'grow-with-feature',
  name: 'How [Feature] Helps You Get More Clients',
  audience: 'for_barbers',
  audienceLabel: 'For Barbers',
  description: 'Explains how a specific platform feature helps barbers grow their business',
  variables: [
    { key: 'feature', label: 'Platform Feature', type: 'select', options: PLATFORM_FEATURES, required: true },
  ],
  generate: (vars) => {
    const f = vars.feature;
    const fl = f.toLowerCase();
    return {
      title: `How ${f} Help Barbers Get More Clients`,
      slug: slugify(`how-${fl}-help-barbers-get-more-clients`),
      description: `Learn how ${fl} on your barber profile attract more clients and build trust. A practical guide to leveraging ${fl} for business growth.`,
      keywords: [`barber ${fl}`, 'get more barber clients', 'barber marketing', `barber profile ${fl}`, 'grow barber business'],
      readingTime: 5,
      content: `
<p>In a competitive market, barbers need every advantage to stand out. ${f} are one of the most powerful tools available to modern barbers — and many aren't using them to their full potential.</p>

<h2>Why ${f} Matter</h2>
<p>When potential clients are choosing between barbers, they look for signals of quality and professionalism. ${f} provide exactly that — they give clients the confidence to book with you over someone else. In a world where first impressions happen online before they happen in the chair, ${fl} can be the difference between a new client and a missed opportunity.</p>

<h2>How ${f} Drive New Clients</h2>
<ul>
  <li><strong>Build trust instantly:</strong> Clients trust barbers who invest in their professional presence</li>
  <li><strong>Stand out in search:</strong> Profiles with strong ${fl} rank higher and attract more views</li>
  <li><strong>Reduce hesitation:</strong> ${f} answer the questions clients have before they're willing to book</li>
  <li><strong>Encourage referrals:</strong> Impressive profiles are easier for existing clients to share</li>
</ul>

<h2>Best Practices for ${f}</h2>
<ol>
  <li>Keep your ${fl} current and up-to-date</li>
  <li>Invest time in quality — half-hearted efforts can hurt more than help</li>
  <li>Ask clients for feedback on your profile</li>
  <li>Study what top-rated barbers do with their ${fl}</li>
  <li>Update regularly to show you're active and engaged</li>
</ol>

<h2>Common Mistakes to Avoid</h2>
<ul>
  <li>Setting it up once and never updating</li>
  <li>Not taking full advantage of all available options</li>
  <li>Ignoring what clients say about what influenced their decision to book</li>
  <li>Not comparing your profile to successful barbers in your area</li>
</ul>

<h2>Get Started</h2>
<p>If you're not on <strong>Concierge Barber Registry</strong> yet, sign up and start building your profile with ${fl}. If you're already registered, log in to your dashboard and make sure your ${fl} are working as hard as you do. Your next client could be browsing right now.</p>
      `,
    };
  },
};

const marketingForBarbers: BlogTemplate = {
  id: 'marketing-service',
  name: 'Marketing Your [Service] Specialty',
  audience: 'for_barbers',
  audienceLabel: 'For Barbers',
  description: 'Helps barbers market a specific service specialty to attract the right clients',
  variables: [
    { key: 'service', label: 'Service Specialty', type: 'select', options: SERVICE_OPTIONS, source: 'specialties', required: true },
  ],
  generate: (vars) => {
    const s = toSingular(vars.service);
    const sl = s.toLowerCase();
    return {
      title: `How to Market Your ${s} Specialty and Attract Clients`,
      slug: slugify(`market-your-${sl}-specialty-attract-clients`),
      description: `Stand out as a ${sl} specialist. Learn marketing strategies to showcase your ${sl} skills and attract clients who want exactly what you offer.`,
      keywords: [`${sl} specialist barber`, `market ${sl} services`, 'barber specialization', `${sl} barber marketing`, 'barber niche'],
      readingTime: 6,
      content: `
<p>Specializing in ${sl}s can set you apart in a crowded market. Clients looking for a great ${sl} want a specialist, not a generalist. Here's how to position yourself as the go-to ${sl} barber in your area.</p>

<h2>Why Specialization Wins</h2>
<p>Generalist barbers compete on price. Specialists compete on value. When you're known as the best ${sl} barber in your area, clients come to you specifically — and they're willing to pay premium prices for expertise. A focused reputation attracts exactly the clients you want.</p>

<h2>Build a ${s}-Focused Portfolio</h2>
<p>Your portfolio should tell a story of ${sl} mastery:</p>
<ul>
  <li>Photograph every ${sl} you're proud of (with client permission)</li>
  <li>Show variety — different hair types, textures, and variations</li>
  <li>Include before/after shots for maximum impact</li>
  <li>Update weekly so your portfolio reflects your current skill level</li>
</ul>

<h2>Create ${s} Content</h2>
<p>Position yourself as an authority:</p>
<ul>
  <li>Post ${sl} transformations on Instagram and TikTok</li>
  <li>Share ${sl} maintenance tips that help clients between visits</li>
  <li>Create content explaining different ${sl} variations</li>
  <li>Film the process — satisfying technique videos perform extremely well</li>
</ul>

<h2>Optimize Your Registry Profile</h2>
<p>On <strong>Concierge Barber Registry</strong>, make sure your profile highlights your ${sl} specialty:</p>
<ul>
  <li>List ${sl} services with clear pricing</li>
  <li>Feature your best ${sl} work in your portfolio</li>
  <li>Encourage ${sl} clients to leave specific reviews</li>
  <li>Mention ${sl} expertise in your bio</li>
</ul>

<h2>Price Your ${s}s Right</h2>
<p>As a specialist, don't undercharge. Clients seeking ${sl} expertise expect to pay for it. Research what other ${sl} specialists charge in your market and price based on your skill level and demand. If you're booked solid, it's time to raise your prices.</p>

<h2>Build Your Reputation</h2>
<p>Become the name people think of when they think "${sl}." Consistent quality, a strong online presence, and a verified profile on <strong>Concierge Barber Registry</strong> create a reputation that attracts clients on autopilot.</p>
      `,
    };
  },
};

const whyJoinRegistry: BlogTemplate = {
  id: 'why-join-registry',
  name: 'Why Barbers Should Join a Registry',
  audience: 'for_barbers',
  audienceLabel: 'For Barbers',
  description: 'Convinces barbers to join the platform by highlighting benefits',
  variables: [
    { key: 'pain', label: 'Barber Pain Point', type: 'select', options: [
      { value: 'finding-clients', label: 'Finding New Clients' },
      { value: 'standing-out', label: 'Standing Out from Competition' },
      { value: 'building-trust', label: 'Building Trust Online' },
      { value: 'going-mobile', label: 'Growing a Mobile Business' },
    ], required: true },
  ],
  generate: (vars) => {
    const pains: Record<string, { title: string; problem: string; solutions: string[] }> = {
      'finding-clients': {
        title: 'Struggling to Find New Clients? Here\'s What Top Barbers Do',
        problem: 'finding enough new clients to fill your chair consistently',
        solutions: [
          'Get discovered by clients actively searching for barbers in your area',
          'Your verified profile appears when clients search by location and specialty',
          'Portfolio and reviews do the selling for you — clients arrive pre-sold',
          'Platform marketing drives traffic you\'d never reach on your own',
        ],
      },
      'standing-out': {
        title: 'How to Stand Out When Every Barber Is on Instagram',
        problem: 'differentiating yourself in a sea of barbers all posting on social media',
        solutions: [
          'A verified badge instantly separates you from unverified competition',
          'Detailed service menus with transparent pricing build confidence',
          'Client reviews provide social proof that followers alone can\'t match',
          'A professional profile shows you take your career seriously',
        ],
      },
      'building-trust': {
        title: 'How to Build Client Trust Before They Sit in Your Chair',
        problem: 'getting new clients to trust you enough to book their first appointment',
        solutions: [
          'License verification proves your credentials are real',
          'Client reviews from real people provide authentic social proof',
          'A curated portfolio shows exactly what clients can expect',
          'Transparent pricing eliminates surprises and builds confidence',
        ],
      },
      'going-mobile': {
        title: 'Growing Your Mobile Barber Business: The Platform Advantage',
        problem: 'building a mobile barbering business without a fixed location for walk-ins',
        solutions: [
          'Travel dates let clients know when you\'re in their area',
          'Service areas show exactly where you operate',
          'Mobile service badge attracts clients specifically looking for house calls',
          'Reviews from mobile clients build your traveling reputation',
        ],
      },
    };

    const p = pains[vars.pain] || pains['finding-clients'];

    return {
      title: p.title,
      slug: slugify(p.title),
      description: `Are you ${p.problem}? Learn how successful barbers solve this problem and grow their business using a professional barber registry.`,
      keywords: ['barber registry', 'grow barber business', 'find barber clients', 'barber platform', 'barber marketing'],
      readingTime: 6,
      content: `
<p>If you're ${p.problem}, you're not alone. It's one of the most common challenges barbers face, especially in competitive markets. But the barbers who solve this problem share one thing in common: they make it easy for clients to find, trust, and book them.</p>

<h2>The Problem</h2>
<p>Most barbers rely on word of mouth and social media. Both are valuable, but both have limits. Word of mouth is slow. Social media algorithms are unpredictable. You need a channel that puts you in front of clients who are actively looking for a barber — right now, in your area.</p>

<h2>The Solution: A Professional Barber Registry</h2>
<p>A barber registry like <strong>Concierge Barber Registry</strong> solves this by connecting you directly with clients who are ready to book. Here's how:</p>
<ul>
${p.solutions.map(s => `  <li><strong>${s.split(' ').slice(0, 4).join(' ')}:</strong> ${s}</li>`).join('\n')}
</ul>

<h2>What Makes a Registry Different from Social Media</h2>
<ul>
  <li><strong>Intent:</strong> People on a barber registry are looking for a barber. People on Instagram are scrolling for entertainment</li>
  <li><strong>Verification:</strong> Your license is confirmed, not self-reported</li>
  <li><strong>Structure:</strong> Services, pricing, reviews, and portfolio in one organized profile</li>
  <li><strong>Search:</strong> Clients filter by location, specialty, and rating — your profile matches their exact needs</li>
</ul>

<h2>Getting Started</h2>
<p>Signing up on <strong>Concierge Barber Registry</strong> takes minutes:</p>
<ol>
  <li>Create your account and submit your barber license</li>
  <li>Build your profile with services, pricing, and portfolio photos</li>
  <li>Get verified and start appearing in client searches</li>
  <li>Collect reviews and watch your client base grow</li>
</ol>

<h2>The Bottom Line</h2>
<p>The barbers who succeed long-term aren't just skilled — they're visible, trusted, and easy to book. A professional registry gives you all three. Start free on <strong>Concierge Barber Registry</strong> today.</p>
      `,
    };
  },
};

// ============ INDUSTRY TEMPLATES ============

const industryTrend: BlogTemplate = {
  id: 'industry-trend',
  name: '[Service] Trends and What\'s Next',
  audience: 'industry',
  audienceLabel: 'Industry',
  description: 'Industry trend piece about a service category and where it\'s heading',
  variables: [
    { key: 'service', label: 'Service/Style', type: 'select', options: SERVICE_OPTIONS, source: 'specialties', required: true },
  ],
  generate: (vars) => {
    const s = toSingular(vars.service);
    const sl = s.toLowerCase();
    return {
      title: `${s} Trends: What's Popular and What's Next`,
      slug: slugify(`${sl}-trends-whats-popular-whats-next`),
      description: `The latest ${sl} trends shaping men's grooming. From classic styles to modern variations, see what's trending and where ${sl}s are headed.`,
      keywords: [`${sl} trends`, `${sl} styles`, `popular ${sl}`, `${sl} 2026`, 'mens hair trends', 'barber trends'],
      readingTime: 6,
      content: `
<p>The ${sl} continues to evolve as barbers push creative boundaries and clients demand fresh interpretations of this classic technique. Here's what's trending and where the ${sl} is headed.</p>

<h2>Why ${s}s Remain Popular</h2>
<p>The ${sl} has staying power because it's fundamentally versatile. It can be adapted for any face shape, hair type, and personal style. Unlike trend-dependent styles that come and go, the ${sl} has a foundation of timeless appeal that barbers can build on with modern touches.</p>

<h2>Current ${s} Trends</h2>
<ul>
  <li><strong>Textured variations:</strong> Adding natural texture and movement to the ${sl} for a lived-in look</li>
  <li><strong>Hybrid styles:</strong> Combining the ${sl} with other techniques for unique, personalized results</li>
  <li><strong>Low-maintenance versions:</strong> ${s}s that grow out gracefully, requiring fewer visits</li>
  <li><strong>Bold interpretations:</strong> Creative barbers pushing the ${sl} in unexpected directions</li>
</ul>

<h2>What's Driving the Trends</h2>
<p>Several factors are shaping ${sl} trends:</p>
<ul>
  <li><strong>Social media:</strong> Barbers share techniques instantly, spreading innovations globally</li>
  <li><strong>Client expectations:</strong> Men are more informed about grooming and expect personalized service</li>
  <li><strong>Tool innovation:</strong> Better clippers and trimmers enable more precise work</li>
  <li><strong>Cultural influence:</strong> Music, sports, and entertainment continue to drive style preferences</li>
</ul>

<h2>What's Next for ${s}s</h2>
<p>The future of the ${sl} points toward even more personalization. Barbers are moving away from one-size-fits-all approaches and toward custom ${sl} designs that reflect individual personality, face shape, and lifestyle. Expect to see more creative integration of ${sl}s with other techniques.</p>

<h2>Finding a Trend-Forward ${s} Barber</h2>
<p>The best way to get a modern ${sl} is to find a barber whose portfolio shows they're current with trends. Browse ${sl} specialists on <strong>Concierge Barber Registry</strong> — check their recent portfolio uploads to see if their work reflects the latest styles.</p>
      `,
    };
  },
};

const platformBenefit: BlogTemplate = {
  id: 'platform-benefit',
  name: 'How a Barber Registry Benefits Everyone',
  audience: 'industry',
  audienceLabel: 'Industry',
  description: 'Explains the barber registry concept and how it helps the industry',
  variables: [
    { key: 'angle', label: 'Article Angle', type: 'select', options: [
      { value: 'trust', label: 'Building Trust in Barbering' },
      { value: 'technology', label: 'Technology Meets Tradition' },
      { value: 'standards', label: 'Raising Industry Standards' },
      { value: 'community', label: 'Building Barber Community' },
    ], required: true },
  ],
  generate: (vars) => {
    const angles: Record<string, { title: string; hook: string; sections: string[][] }> = {
      trust: {
        title: 'How Barber Registries Are Building Trust in Grooming',
        hook: 'Trust is the foundation of the barber-client relationship. Barber registries are creating new ways to establish that trust before the first appointment.',
        sections: [
          ['License Verification', 'When a barber\'s license is independently verified, clients can book with confidence. No more wondering if the person holding the clippers is actually trained and licensed.'],
          ['Transparent Reviews', 'Authentic client reviews provide honest feedback that helps both clients choose wisely and barbers improve their service.'],
          ['Portfolio Proof', 'Seeing a barber\'s actual work — not stock photos — gives clients realistic expectations and barbers a platform to showcase their skills.'],
          ['Accountability', 'Being part of a professional registry creates accountability. Barbers maintain higher standards when their reputation is visible and trackable.'],
        ],
      },
      technology: {
        title: 'How Technology Is Empowering Traditional Barbering',
        hook: 'The barbershop has always been about human connection. Technology isn\'t replacing that — it\'s making it easier for the right barbers and clients to find each other.',
        sections: [
          ['Discovery', 'Online barber registries make it possible for clients to find specialized barbers they\'d never discover through word of mouth alone.'],
          ['Convenience', 'Digital profiles with services, pricing, and portfolios let clients make informed decisions on their own schedule.'],
          ['Mobile Service', 'Technology enables mobile barbers to advertise their travel schedules and service areas, reaching clients in places without traditional barbershops.'],
          ['Quality Signals', 'Verified badges, client reviews, and curated portfolios create quality signals that benefit skilled barbers and protect discerning clients.'],
        ],
      },
      standards: {
        title: 'How Barber Registries Are Raising Industry Standards',
        hook: 'The barbering industry thrives when standards are high. Professional registries create upward pressure on quality that benefits everyone.',
        sections: [
          ['Verification as Standard', 'When clients expect verification, barbers invest in maintaining their credentials. This raises the baseline for the entire industry.'],
          ['Transparent Competition', 'When barbers can see what successful peers offer — services, pricing, portfolio quality — it motivates improvement.'],
          ['Client Education', 'Registries educate clients about what to expect from a professional barber, which creates demand for higher-quality service.'],
          ['Professional Recognition', 'Being listed on a curated, verified registry is a mark of professionalism that distinguishes serious barbers from hobbyists.'],
        ],
      },
      community: {
        title: 'How Barber Registries Are Building Professional Community',
        hook: 'Barbering has always been a community profession. Modern registries are expanding that community beyond the local shop.',
        sections: [
          ['Connecting Professionals', 'Registries help barbers discover and connect with peers across different markets, fostering knowledge sharing and collaboration.'],
          ['Mentorship Opportunities', 'New barbers can study the profiles, portfolios, and reviews of established professionals to learn what success looks like.'],
          ['Industry Visibility', 'A collective platform gives the barbering profession greater visibility and recognition as skilled, licensed professionals.'],
          ['Shared Growth', 'When the registry grows, every barber on it benefits from increased client traffic and platform marketing efforts.'],
        ],
      },
    };

    const a = angles[vars.angle] || angles.trust;

    return {
      title: a.title,
      slug: slugify(a.title),
      description: `${a.hook} Learn how professional barber registries are transforming the grooming industry.`,
      keywords: ['barber registry', 'barber industry', 'barbering profession', 'barber platform', 'grooming industry'],
      readingTime: 6,
      content: `
<p>${a.hook}</p>

${a.sections.map(([heading, body]) => `<h2>${heading}</h2>\n<p>${body}</p>`).join('\n\n')}

<h2>The Future of Barbering</h2>
<p>The barbering industry is evolving rapidly. Clients expect more transparency, barbers need better tools to grow their businesses, and the profession deserves greater recognition. Professional registries like <strong>Concierge Barber Registry</strong> are at the center of this evolution — connecting skilled barbers with clients who value quality, verification, and professionalism.</p>

<h2>Be Part of It</h2>
<p>Whether you're a barber looking to grow your career or a client looking for your next great cut, <strong>Concierge Barber Registry</strong> is where verified professionals and discerning clients connect. Explore the platform today.</p>
      `,
    };
  },
};

const customArticle: BlogTemplate = {
  id: 'custom-article',
  name: 'Custom Article',
  audience: 'industry',
  audienceLabel: 'Any',
  description: 'Generate an article with a custom topic — you provide the title and angle',
  variables: [
    { key: 'title', label: 'Article Title', type: 'text', placeholder: 'e.g. Why Every Man Needs a Trusted Barber', required: true },
    { key: 'audience', label: 'Target Audience', type: 'select', options: [
      { value: 'for_clients', label: 'For Clients' },
      { value: 'for_barbers', label: 'For Barbers' },
      { value: 'industry', label: 'Industry' },
    ], required: true },
    { key: 'focus', label: 'Key Focus', type: 'text', placeholder: 'e.g. building a long-term barber relationship', required: true },
  ],
  generate: (vars) => {
    const title = vars.title;
    const focus = vars.focus;
    return {
      title,
      slug: slugify(title),
      description: `An in-depth look at ${focus}. Expert insights and practical advice from the barbering industry.`,
      keywords: [focus, 'barber', 'grooming', 'barbershop', 'mens grooming'],
      readingTime: 6,
      content: `
<p>${focus.charAt(0).toUpperCase() + focus.slice(1)} is a topic that matters to everyone in the grooming industry. Whether you're a client making choices about your appearance or a barber building your career, understanding this subject helps you make better decisions.</p>

<h2>Why This Matters</h2>
<p>In today's grooming landscape, ${focus} isn't optional — it's essential. The barbers and clients who understand this are the ones who build lasting, successful relationships. This article breaks down what you need to know.</p>

<h2>The Current Landscape</h2>
<p>The grooming industry has changed dramatically in recent years. With more options than ever — from traditional barbershops to mobile services to online booking platforms — understanding ${focus} helps you navigate these choices effectively.</p>

<h2>What the Best Barbers Know</h2>
<p>Top-rated barbers on platforms like <strong>Concierge Barber Registry</strong> consistently demonstrate their understanding of ${focus} through their service, their profiles, and their client relationships. Their approach offers lessons for both aspiring barbers and discerning clients.</p>

<h2>Practical Steps</h2>
<ul>
  <li>Research and educate yourself on ${focus}</li>
  <li>Look for barbers who demonstrate expertise in this area</li>
  <li>Ask questions and communicate your preferences clearly</li>
  <li>Build relationships with professionals who share your values</li>
  <li>Stay current with how the industry is evolving</li>
</ul>

<h2>Finding the Right Fit</h2>
<p>The best grooming experiences come from finding the right match between client and barber. Browse verified professionals on <strong>Concierge Barber Registry</strong> to find barbers who align with what matters to you.</p>
      `,
    };
  },
};

export const BLOG_TEMPLATES: BlogTemplate[] = [
  // For Clients
  findBarberForService,
  whyVerifiedMatters,
  serviceGuide,
  // For Barbers
  growWithFeature,
  marketingForBarbers,
  whyJoinRegistry,
  // Industry
  industryTrend,
  platformBenefit,
  customArticle,
];

export function getTemplatesByAudience(audience?: string): BlogTemplate[] {
  if (!audience) return BLOG_TEMPLATES;
  return BLOG_TEMPLATES.filter(t => t.audience === audience);
}
