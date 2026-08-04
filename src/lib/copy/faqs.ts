/**
 * Page-targeted FAQ content for AIO/AEO/SGE — surfaces as both visible UI
 * and FAQPage JSON-LD on the landing pages.
 *
 * Each entry is engineered to answer a specific high-intent search query
 * from the v2 keyword research. Q&A pairs are 40-100 words on the answer
 * (sweet spot for AI extraction), use named entities ("Concierge Barber
 * Registry", "Verified Member", "Founding Member"), and link back to a
 * BOFU surface (`/search`, `/register`, `/black-label`) where appropriate.
 *
 * Imported by <FaqSection> on each landing page. Schema and visible HTML
 * are kept in lockstep — Google demotes FAQPage schema whose answers don't
 * also appear visibly on the page.
 */

import { VETTING_FEE_PRICING, VERIFIED_TRIAL_DAYS } from '@/lib/copy/v2';

export interface FaqEntry {
  question: string;
  /**
   * Plain text. NOT HTML — the FaqSection renders this as text and emits it
   * as schema.org Answer.text. Keep answers self-contained (don't say "see
   * above"); each answer is read independently by AI engines.
   */
  answer: string;
}

const HOMEPAGE_FAQS: readonly FaqEntry[] = [
  {
    question: 'What is the Concierge Barber Registry?',
    answer:
      'Concierge Barber Registry (CBR) is a license-verified directory of independent master barbers and stylists. Every professional on the registry has had their state license manually verified by our team — no automated approvals. Clients use CBR to find credentialed barbers near them; barbers use it to keep 100% of their service revenue with no booking fees or middleman cut.',
  },
  {
    question: 'How is CBR different from Booksy, theCut, or other booking apps?',
    answer:
      'CBR is a directory, not a booking platform. We do not process payments or take a percentage of any service. Clients contact barbers directly through their profiles, and barbers own the entire client relationship. Every barber is also manually license-verified, which most booking apps do not do — so the "Verified" badge on CBR is a real credentialing promise, not a self-attested label.',
  },
  {
    question: 'How do I find the best barber near me?',
    answer:
      'Use the search page to filter verified barbers by city, ZIP code, specialty (fades, beard trim, hot-towel shave, etc.), and review score. Every result is a manually license-verified professional. You can view their portfolio, services, and pricing, then contact them directly without booking fees.',
  },
  {
    question: 'What makes a barber "verified" on CBR?',
    answer:
      'Verification on CBR is a manual three-point check performed by our team: state license number, state of issue, and license expiration date. Barbers must upload a clear copy of their license document, which we cross-reference against their professional history before approving. The Verified badge displays on their public profile and is revoked automatically if the license expires.',
  },
];

const FOR_CLIENTS_FAQS: readonly FaqEntry[] = [
  {
    question: 'How do I find the best barber near me?',
    answer:
      'Open the search page, enter your ZIP code or city, and optionally filter by specialty (fades, beard trim, hot-towel shave, scissor cut, kids cuts, designs, and more). Every result is a manually license-verified barber. You can view their portfolio, read reviews, and contact them directly — there are no booking fees and CBR never takes a cut.',
  },
  {
    question: 'How much does a good haircut cost in 2026?',
    answer:
      'Independent licensed barber prices in the US typically range from $25 for a basic cut at a neighborhood shop to $80+ for a master barber in a major metro. Specialty services like a hot-towel shave or beard sculpt usually add $20-40. CBR profiles show each barber\'s own pricing transparently, so you can compare before contacting them.',
  },
  {
    question: 'What\'s the best haircut for my face shape?',
    answer:
      'Round faces are usually flattered by cuts with height and shorter sides (high fades, pompadours). Oval faces work with almost any style. Square faces look strong with textured tops and soft sides. Long faces benefit from fuller sides and shorter tops. A verified CBR barber will recommend specifics after consulting in person — search for a master barber near you to get a personalized opinion.',
  },
  {
    question: 'What is the Grooming Passport?',
    answer:
      'The Grooming Passport is an encrypted vault of your technical grooming specs — guard sizes, density, products you react well or poorly to, allergies, and preferences. You build it once on CBR, and when you travel you show a short-lived QR code to any verified CBR partner in another city. They scan it, see the exact specs, and the cut is identical to what you get at home.',
  },
  {
    question: 'Can I trust a barber I\'ve never met before?',
    answer:
      'Every barber on CBR has had their state license manually verified by our team before appearing in the directory — that is the minimum bar for trust. Beyond that, profiles include portfolio images and client reviews so you can evaluate craft and consistency. If you book travel or last-minute services, the Grooming Passport lets you communicate your exact technical preferences without re-explaining your routine.',
  },
];

const FOR_BARBERS_FAQS: readonly FaqEntry[] = [
  {
    question: 'How do barbers make money on the Concierge Barber Registry?',
    answer:
      'CBR is a directory — we do not process payments or take a percentage of your services. You keep 100% of every cut. Clients contact you directly through your profile. Additionally, when one of your clients travels and uses a verified CBR partner in another city, you earn a 10% travel referral royalty paid out monthly — the only platform-mediated income on the system.',
  },
  {
    question: 'How much does it cost to join CBR as a verified barber?',
    answer:
      `There is a one-time application fee — $${VETTING_FEE_PRICING.intro} for the first ${VETTING_FEE_PRICING.intro_limit} Founding Members and $${VETTING_FEE_PRICING.standard} standard afterwards — that funds the manual three-point license verification. Once approved, you receive a ${VERIFIED_TRIAL_DAYS}-day free trial of the full Verified Member toolkit. After the trial, membership is a single flat subscription. There is no chair rent, no booking fee, and no per-cut percentage.`,
  },
  {
    question: 'How long does verification take?',
    answer:
      'Standard verification is completed within 24 to 48 hours of receiving your license document. An optional expedited add-on (+$50) returns approval within 24 hours. We verify your license number, state of issue, expiration date, and professional standing manually — no automated approvals — which is why the Verified badge means something to clients.',
  },
  {
    question: 'How does the 10% travel royalty work?',
    answer:
      'When one of your clients travels and books a verified CBR barber in another city, the performing barber submits a referral note crediting you. Our admin team reviews and approves the referral, and you receive 10% of the service fee as a royalty. Royalties are batched and paid out monthly. This makes your client list an asset that generates passive income across the CBR network.',
  },
  {
    question: 'Who qualifies for Founding Member status?',
    answer:
      'The first ten approved barbers on the registry receive perpetual Founding Member status. Founding Members get a distinct certificate, a permanent badge on their public profile, the $49 intro application rate, and lifetime recognition as inaugural members of the platform. Founding status is not transferable and is awarded in order of verification approval.',
  },
];

const PRO_FAQS: readonly FaqEntry[] = [
  {
    question: 'What is a Verified Master Barber on the Concierge Barber Registry?',
    answer:
      'A Verified Master Barber is a licensed professional whose state license has been manually reviewed and approved by the CBR verification team. The Verified badge on a profile is a real credentialing promise, not a self-attested label. Verified Members get access to the full toolkit: the Grooming Passport, 10% travel referral royalties, digital wallet pass, certificate of selection, and NDA template.',
  },
  {
    question: `What does the ${VERIFIED_TRIAL_DAYS}-day Verified Member trial include?`,
    answer:
      `On approval, every Verified Member receives a ${VERIFIED_TRIAL_DAYS}-day trial of the complete toolkit at no cost: the Global Grooming Passport (scan client specs anywhere), the Travel Royalty Network (10% on cross-city referrals), the encrypted client vault, the digital wallet pass and printable credentials, the Concierge Privacy Agreement template, and full profile visibility to high-net-worth clients searching the registry.`,
  },
  {
    question: `What is the difference between the $${VETTING_FEE_PRICING.intro} intro and $${VETTING_FEE_PRICING.standard} standard application fee?`,
    answer:
      `The intro $${VETTING_FEE_PRICING.intro} rate is reserved for the first ${VETTING_FEE_PRICING.intro_limit} approved barbers — Founding Members — and includes perpetual Founding status. After the first ${VETTING_FEE_PRICING.intro_limit} approvals fill, the standard $${VETTING_FEE_PRICING.standard} application fee applies. Both fees fund the same manual three-point license verification; the difference is the Founding Member badge, certificate, and permanent recognition that the intro tier carries.`,
  },
  {
    question: 'What is the expedited vetting add-on?',
    answer:
      'Expedited vetting is an optional +$50 add-on that returns your verification result within 24 hours instead of the standard 24-48 hour window. It is useful if you are applying ahead of a launch, an event, or a media appearance. The actual verification process is identical — same manual three-point check — only the turnaround is prioritized.',
  },
];

const CLIENT_FAQS: readonly FaqEntry[] = [
  {
    question: 'What is the Grooming Passport and how do I use it?',
    answer:
      'The Grooming Passport is an encrypted record of your technical grooming preferences — guard sizes, density, products that work for your hair, allergies, and any notes for your barber. You build it once in your CBR account, then generate a short-lived QR code (5 minute expiration, single-use) at any verified CBR barber. They scan it and see your exact specs. The cut is identical whether you are in your home city or traveling.',
  },
  {
    question: 'How do CBR barbers compare to chain salon barbers?',
    answer:
      'Chain salons typically employ licensed staff but do not verify their credentials publicly per cut, and their pricing folds in a corporate margin. CBR is a directory of independent licensed master barbers — every license is manually verified by our team before the barber appears in the directory, and there is no middleman fee, so you pay the barber\'s own posted rate directly.',
  },
  {
    question: 'How do I know a verified barber is safe to visit at home or in a hotel?',
    answer:
      'Every CBR barber has had their state license manually verified, and Verified Members operate under the Concierge Privacy Protocol — a written commitment to confidentiality covering your home, schedule, conversations, and identity. For high-discretion bookings, ask the barber for a signed copy of the Concierge Professional Privacy Agreement; it is a 5-section privacy contract standard across the network.',
  },
  {
    question: 'Is the Concierge Barber Registry free for clients?',
    answer:
      'Yes. Browsing barber profiles, viewing portfolios and reviews, building your Grooming Passport, and contacting barbers directly are all free for clients. CBR does not process payments or take a percentage of any service — you pay the barber directly at their posted rate. Membership for clients is free and unlimited.',
  },
];

const BLACK_LABEL_FAQS: readonly FaqEntry[] = [
  {
    question: 'What is Black Label?',
    answer:
      'Black Label is the Concierge Barber Registry\'s invite-only tier for executives, public figures, and family offices who need zero-effort global grooming. Members get standing appointments, a 4-hour rapid-response network of background-checked master barbers across major hubs, pre-signed NDAs on file for every assigned barber, and travel-ready Grooming Passport hand-off so the same cut follows them anywhere in the world.',
  },
  {
    question: 'Who qualifies for Black Label?',
    answer:
      'Black Label is invite-only and approved on a case-by-case basis. Typical members are executives at major firms, public figures, professional athletes, and family-office principals who need confidentiality, speed, and consistency across multiple cities. You can submit a request for access from the public Black Label request form; our team reviews each application individually.',
  },
  {
    question: 'How is Black Label different from the standard Verified Member tier?',
    answer:
      'A standard Verified Member is a license-verified barber on the public directory; clients contact them directly. Black Label is a private concierge service layered on top: every assigned barber has 10+ years of experience, additional background clearance, a signed NDA on file, and is committed to a 4-hour rapid-response window. Black Label members pay an annual concierge fee rather than per-cut directly.',
  },
  {
    question: 'What is concierge grooming?',
    answer:
      'Concierge grooming is the practice of bringing a licensed master barber to the client\'s home, office, or hotel rather than the client visiting a shop. It typically includes pre-signed privacy agreements, travel-ready grooming kits, and consistency-of-cut guarantees across cities. CBR\'s Black Label tier is built around this model for clients whose schedules and discretion requirements do not fit a chair-based appointment.',
  },
  {
    question: 'How do I request access to Black Label?',
    answer:
      'Submit the request-access form at /black-label/request-access. The form captures your name, email, city, and a short note about your grooming needs. Our team reviews every submission individually. Approval involves a brief vetting call to understand your schedule, travel pattern, and discretion requirements before we assign you a primary barber.',
  },
];

export const FAQS = {
  homepage: HOMEPAGE_FAQS,
  forClients: FOR_CLIENTS_FAQS,
  forBarbers: FOR_BARBERS_FAQS,
  pro: PRO_FAQS,
  client: CLIENT_FAQS,
  blackLabel: BLACK_LABEL_FAQS,
} as const;

export type FaqPageKey = keyof typeof FAQS;
