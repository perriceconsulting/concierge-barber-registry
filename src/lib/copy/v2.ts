/**
 * CBR v2.0 — Centralized marketing copy.
 *
 * All locked v2 strings live here so devs swap copy without touching components.
 * Source: PRD session that produced the JSON spec (see plan file).
 */

export const HERO = {
  pro: {
    eyebrow: 'For Master Barbers',
    headline: "Upgrade Your Career to 'Verified' Status",
    subhead: 'The Industry Standard for Verified Professional Grooming.',
    body: 'A license-verified registry built for elite, independent professionals. Manual vetting. Zero middleman fees. Direct concierge clientele who pay for craft, not convenience.',
    primaryCta: { label: 'Apply for Verification', href: '/register?role=barber' },
    secondaryCta: { label: 'See How Verification Works', href: '#how-it-works' },
  },
  client: {
    eyebrow: 'For Discerning Clients',
    headline: 'Exceptional Grooming, Delivered',
    subhead: 'Find a Licensed Master Who Respects Your Time and Privacy.',
    body: 'Every barber on the registry is manually license-verified. Browse specialists, contact them directly, and bring your Grooming Passport so the cut is identical wherever you are in the world.',
    primaryCta: { label: 'Find a Verified Master', href: '/search' },
    secondaryCta: { label: 'How the Grooming Passport Works', href: '#passport' },
  },
  blackLabel: {
    eyebrow: 'Black Label',
    headline: 'Your Image, Managed Globally',
    subhead: 'Zero-effort concierge grooming for executives, public figures, and family offices.',
    body: 'Standing appointments. Travel-ready profiles. NDA-protected sessions. A 4-hour rapid-response network of background-checked masters across every major hub.',
    primaryCta: { label: 'Request Membership', href: '/black-label/request-access' },
    secondaryCta: { label: 'What’s Included', href: '#included' },
  },
} as const;

export const VETTING_FEE_NOTICE =
  'To maintain the integrity of the Registry, all applications undergo a manual 3-point background and license check. A non-refundable processing fee ensures that our platform remains an elite space for verified professionals only.';

export const VETTING_FEE_PRICING = {
  intro: 49,
  standard: 99,
  expedited_addon: 50,
  intro_limit: 10,
} as const;

/**
 * Length of the Verified Member trial started at admin approval.
 *
 * Lives here, beside the fee pricing, rather than in lib/subscription.ts —
 * subscription.ts imports from this file (and pulls in Prisma), so copy cannot
 * import from it without a cycle. subscription.ts re-exports this so existing
 * call sites keep working.
 *
 * Every customer-facing mention of the trial length interpolates this. It used
 * to be written out as "30-day" in thirteen places, which meant changing the
 * constant would leave the platform promising a trial length it no longer
 * honoured — with nothing to catch it.
 */
export const VERIFIED_TRIAL_DAYS = 30;

/**
 * Founding Members get their first full year included with the ${VETTING_FEE_PRICING.intro}
 * application fee.
 *
 * Same code path as everyone else — approval creates one subscription on the
 * plan the barber chose, and the trial length is the only difference between
 * cohorts. This replaces the old arrangement where founding members skipped
 * subscription creation entirely and carried
 * `subscriptionWaivedUntil = 2099-12-31`, meaning they never paid at all.
 *
 * Founding status is derived from the fee they paid, not granted separately —
 * see the setup-fee webhook. Paying the intro rate IS what makes someone a
 * Founding Member.
 */
export const FOUNDING_TRIAL_DAYS = 365;

/** Monthly and annual membership dues, after the trial ends. */
export const MEMBERSHIP_PRICING = {
  monthly: 39,
  annual: 299,
} as const;

/** Rounded saving from paying annually — used to justify the default. */
export const ANNUAL_SAVING_PERCENT = Math.round(
  (1 - MEMBERSHIP_PRICING.annual / (MEMBERSHIP_PRICING.monthly * 12)) * 100,
);

/**
 * Accepted payment methods. Single source — every surface that states this rule
 * derives from here: Stripe Checkout's `custom_text` (shown on Stripe's own
 * payment page, beside the card field), the pricing copy on /pro, and Terms.
 *
 * Prepaid cards are excluded because a subscription cannot be collected from a
 * card that runs out of balance: the renewal simply fails and the account sits
 * in past_due. Setup fees are one-time and would survive a prepaid card, but the
 * rule is stated once for the whole platform rather than per-flow.
 *
 * NOTE: stating this is a commitment. Stripe-hosted Checkout and the Billing
 * Portal collect the card, so nothing in this codebase can refuse a prepaid card
 * before it is charged. The webhook records `card.funding` on every payment and
 * flags prepaid ones for review — that is what currently backs this sentence up.
 * If enforcement is ever removed, remove this copy too, or the platform is
 * claiming something it does not do.
 */
export const PAYMENT_POLICY = {
  prepaidNotAccepted: 'Prepaid cards are not accepted.',
  prepaidNotAcceptedLong:
    'Prepaid cards are not accepted. Please use a credit or debit card — a prepaid card cannot support recurring membership billing.',
} as const;

export const WHY_PRO_BLOCKS = [
  {
    title: 'Manual License Verification',
    body: 'Our team reviews every application by hand — license number, state, expiration, photo. No automated approvals. The badge means something because we vet by hand.',
  },
  {
    title: 'Keep 100% of Your Service Revenue',
    body: 'No middleman booking fees. No 30% "Boost" cut. Clients contact you directly. You own the relationship and the payment.',
  },
  {
    title: 'Travel Royalties (10%)',
    body: 'When your client travels and books a verified CBR partner in another city, you earn a 10% referral royalty on the session — paid out monthly. Your data, your equity.',
  },
] as const;

export const WHY_CLIENT_BLOCKS = [
  {
    title: 'Manually Vetted Professionals',
    body: 'Every barber’s state license is reviewed by hand before they appear in the directory. The verified badge is a real promise of safety and skill.',
  },
  {
    title: 'The Grooming Passport',
    body: 'Your encrypted technical profile — guard sizes, density, products, allergies — follows you globally. Show the QR to any verified CBR barber and the cut is identical.',
  },
  {
    title: 'Discretion by Default',
    body: 'CBR professionals operate under the Concierge Privacy Protocol. Your home, your conversations, your schedule — all confidential.',
  },
] as const;

export const BLACK_LABEL_INCLUSIONS = [
  {
    title: 'Standing Appointments',
    body: 'Your preferred slot is locked in for the year. The platform manages travel and holiday adjustments for you.',
  },
  {
    title: '4-Hour Rapid Response',
    body: 'Guaranteed emergency window for last-minute trims before televised appearances, board meetings, or red-carpet events.',
  },
  {
    title: 'NDA on File',
    body: 'A pre-signed Non-Disclosure Agreement is standard for every barber assigned to your account. Your home and conversations stay private.',
  },
  {
    title: 'Travel-Ready Grooming',
    body: 'Your Grooming Passport is shared securely with verified CBR partners in any city you travel to — the cut never changes.',
  },
  {
    title: 'Background-Checked Elite',
    body: 'Only barbers with 10+ years of experience and additional security clearances are eligible to serve Black Label.',
  },
  {
    title: 'Private Label Supply',
    body: 'Monthly delivery of grooming products curated to your specific hair and skin profile. You never run out of the right product.',
  },
] as const;

export const HOW_IT_WORKS_PRO = [
  {
    step: '1',
    title: 'Apply',
    body: `Submit your professional license, portfolio link, and the $${VETTING_FEE_PRICING.standard} application fee (— reduced to $${VETTING_FEE_PRICING.intro} for the first ${VETTING_FEE_PRICING.intro_limit} Founding Members).`,
  },
  {
    step: '2',
    title: 'Manual Vetting',
    body: 'Our team verifies your license against the state board, reviews your portfolio, and confirms your professional standing within 24–48 hours.',
  },
  {
    step: '3',
    title: `Verified Status + ${VERIFIED_TRIAL_DAYS}-Day Trial`,
    body: `On approval you receive your digital wallet pass, certificate, and a ${VERIFIED_TRIAL_DAYS}-day free trial of the full Verified Member toolkit — Passport access, referral network, NDA templates.`,
  },
] as const;

export const HOW_IT_WORKS_CLIENT = [
  {
    step: '1',
    title: 'Search Verified Masters',
    body: 'Browse by ZIP code or specialty. Every profile carries the manual-verification badge.',
  },
  {
    step: '2',
    title: 'Build Your Grooming Passport',
    body: 'Your barber documents your technical specs into your encrypted profile. You control who can scan it.',
  },
  {
    step: '3',
    title: 'Travel — Same Cut, Anywhere',
    body: 'In a new city? Show your Passport QR to any verified CBR barber and walk out with the same cut you get at home.',
  },
] as const;

export const FOUNDING_MEMBER_TAGLINE =
  '"Excellence is not an act, but a habit. We recognize yours."';

export const TRIAL_EXPIRING_EMAIL = {
  subject: 'Your Verified Status: 5 Days Remaining in Your Elite Access',
  preheader: `Your ${VERIFIED_TRIAL_DAYS}-day Verified Member trial transitions to standard subscription on {date}.`,
  body: (params: { barberName: string; date: string; rate: string; dashboardUrl: string }) => `
Hi ${params.barberName},

Since your license was verified 25 days ago, you've been part of a select group of professionals on the Concierge Barber Registry.

Your ${VERIFIED_TRIAL_DAYS}-day trial of the Verified Member toolkit — including the Global Grooming Passport and the Referral Royalty Network — is set to transition to your standard subscription on ${params.date}.

What stays active with your membership:

• The Global Badge: Your "Verified" status remains visible to high-net-worth clients searching for elite grooming.
• The Travel Network: Continued access to our 10% referral royalties when your clients travel.
• The Vault: Secure storage for your clients' technical specs, ensuring you never miss a detail.

No action is required. Your subscription will automatically activate on ${params.date} at your locked-in rate of ${params.rate}. This ensures your practice remains live in our directory without any interruption in service.

Need to make a change? You can manage your plan or update your billing info at any time at ${params.dashboardUrl}.

Stay Elite,
The Concierge Barber Registry Team
`.trim(),
} as const;

/**
 * Concierge Professional Privacy Agreement (NDA) — generic template barbers
 * download as a PDF and bring to discerning clients on first appointment.
 * Not a signed-on-CBR e-signature flow (that's post-v2). Five sections.
 */
export const NDA_TEMPLATE = {
  title: 'Concierge Professional Privacy Agreement',
  intro:
    'This Privacy Agreement (the "Agreement") is entered into between the undersigned licensed barber ("Professional") and the Client whose name appears below ("Client"), in connection with grooming services provided by the Professional through or in association with the Concierge Barber Registry ("CBR"). By signing below, both parties acknowledge and agree to the following:',
  sections: [
    {
      heading: '1. Confidential Information',
      body:
        'The Professional acknowledges that during the course of grooming services, they may be exposed to information about the Client of a personal, professional, or commercial nature, including but not limited to: home or office address; family members and household composition; daily routines, schedules, or travel plans; visible conversations, calls, or correspondence; physical characteristics including any medical or dermatological conditions; and the identity of any other individuals served at the same location. All such information is deemed "Confidential Information."',
    },
    {
      heading: '2. Non-Disclosure',
      body:
        'The Professional agrees that, during and after the term of services rendered, they will not, directly or indirectly, disclose, publish, photograph, record, or share any Confidential Information with any third party — including via social media, press inquiries, or casual conversation — without the Client\'s prior written consent. The Professional will not solicit autographs, selfies, or testimonials. Any portfolio images involving the Client require separate, explicit written authorization.',
    },
    {
      heading: '3. Conduct on Premises',
      body:
        'When providing services at the Client\'s home, office, hotel, or other private location, the Professional will: arrive and depart at the agreed time; bring only the equipment required for the service; refrain from photographing or recording the premises; not engage household staff or other occupants beyond what is necessary for the appointment; and treat the location and any individuals present with discretion equivalent to that expected of a private medical professional.',
    },
    {
      heading: '4. Term & Survival',
      body:
        'The obligations of confidentiality under this Agreement begin on the date of first service and survive indefinitely, regardless of whether the Professional continues to provide services to the Client. Termination of the professional relationship does not release the Professional from these obligations.',
    },
    {
      heading: '5. Remedies',
      body:
        'The Professional acknowledges that breach of this Agreement may cause irreparable harm for which monetary damages would be insufficient, and the Client is therefore entitled to seek injunctive relief in addition to any other remedies available at law or in equity. The Professional further acknowledges that breach may result in immediate suspension or removal from the Concierge Barber Registry and forfeiture of Verified status.',
    },
  ],
  signatureBlock:
    'By signing below, the parties confirm that they have read, understood, and agreed to the terms of this Agreement.',
} as const;

export const CREDENTIALS_READY_NOTICE = {
  subject: 'Welcome to the Elite',
  body: (params: { barberName: string }) =>
    `Congratulations, ${params.barberName}. Your professional license has been verified. Your digital Founding Member Pass is now ready for your wallet. Tap to download your credentials and unlock the Registry.`,
} as const;
