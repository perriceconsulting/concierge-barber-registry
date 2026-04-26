import type { SPECIALTIES } from '@/config';

type SpecialtyName = (typeof SPECIALTIES)[number];

export interface SpecialtyContent {
  intro: string;
  faqs: Array<{ question: string; answer: string }>;
}

export const SPECIALTY_CONTENT: Record<SpecialtyName, SpecialtyContent> = {
  Fades: {
    intro:
      'A fade is a haircut that gradually transitions from longer hair on top to shorter hair on the sides and back, blending into the skin. Fades range from low (above the ear) to mid (at the temple) to high (above the temple) and from skin (bald at the bottom) to taper (slightly longer guard at the bottom). A clean fade requires precise blending, sharp clipper-over-comb work, and an eye for symmetry — which is why most clients prefer a license-verified barber who specializes in the technique. Fades pair well with longer styles on top (pompadours, comb-overs, curls, dreads) and remain one of the most-requested cuts in modern barbering.',
    faqs: [
      {
        question: 'How long does a fade take?',
        answer:
          'A standard fade typically takes 30 to 45 minutes. Detailed fades with intricate blending or design work can run 45 to 60 minutes. First-time appointments usually run a bit longer because the barber is learning your hair pattern.',
      },
      {
        question: 'How much does a fade cost?',
        answer:
          'Most professional barbers charge $25–$60 for a fade depending on city, experience level, and shop type. Concierge or mobile barbers typically charge a 30–50% premium for the convenience. Always confirm pricing on the barber’s profile before booking.',
      },
      {
        question: 'What’s the difference between a low, mid, and high fade?',
        answer:
          'The number refers to where the fade starts on the head. A low fade starts just above the ears, a mid fade at the temple, and a high fade above the temple. Higher fades show more contrast; lower fades read more conservative. Tell your barber the look you want or show a reference photo.',
      },
    ],
  },
  Tapers: {
    intro:
      'A taper is a gradual shortening of the hair around the ears, neckline, and sometimes the temples — softer than a fade and never going down to the skin. Where a fade contrasts dramatically, a taper blends subtly: long hair stays long on top and the sides ease down a half-inch or so toward the natural hairline. Tapers work for nearly every hair type and are a favorite for professional environments where a clean look is required without an aggressive contrast. License-verified barbers who specialize in tapers can adjust the depth and length to match your specific hair growth and head shape.',
    faqs: [
      {
        question: 'How long does a taper take?',
        answer:
          'Tapers usually take 20 to 35 minutes — slightly faster than a full fade because there’s less aggressive blending. A taper combined with a full haircut on top runs about 35 to 50 minutes total.',
      },
      {
        question: 'How much does a taper cost?',
        answer:
          'Tapers typically run $20–$45 at most professional barbershops. Some barbers price tapers and fades the same; others charge slightly less for tapers since the technique is less time-intensive.',
      },
      {
        question: 'Should I get a taper or a fade?',
        answer:
          'Choose a taper for a softer, more conservative look that grows out gracefully. Choose a fade for sharper contrast and a more modern style. Tapers are easier to maintain between cuts; fades typically need touching up every 2–3 weeks to look their best.',
      },
    ],
  },
  Lineups: {
    intro:
      'A lineup (also called an edge-up or shape-up) is the precise straightening of the hairline at the forehead, temples, sideburns, and around the ears. It’s the finishing touch that makes a haircut look intentional and professional rather than grown out. Skilled barbers use a straight razor or detail trimmer to create crisp, geometric edges that complement the cut and the client’s natural hairline. Lineups are often booked alone between full haircuts to keep the look sharp, especially for clients with darker hair where contrast against the skin is most visible.',
    faqs: [
      {
        question: 'How long does a lineup take?',
        answer:
          'A standalone lineup takes 10 to 20 minutes. When included with a full haircut it’s built into the overall appointment time and adds about 5 minutes.',
      },
      {
        question: 'How much does a lineup cost?',
        answer:
          'Standalone lineups typically run $15–$25. Most barbers include the lineup at no extra charge as part of a regular haircut booking.',
      },
      {
        question: 'How often should I get a lineup?',
        answer:
          'Most clients get a fresh lineup every 1 to 2 weeks between full cuts to maintain the crisp edge. Hair grows about a half-inch per month, so the line softens noticeably within 7–10 days for clients who care about a sharp look.',
      },
    ],
  },
  'Beard Trim': {
    intro:
      'A beard trim shapes and maintains the length, line, and overall profile of facial hair. A professional trim isn’t just length removal — it includes defining the cheek line, neckline, and mustache, blending different beard zones, and balancing the beard to the face shape. Skilled barbers use a combination of clippers, scissors, and a straight razor to produce a finished look that’s symmetric and proportional. License-verified barbers trained in beard work can advise on whether your beard is best left full, sculpted shorter, or shaped specifically for your face shape.',
    faqs: [
      {
        question: 'How long does a beard trim take?',
        answer:
          'A standalone beard trim typically takes 15 to 25 minutes. Combined with a haircut, expect to add 10 to 15 minutes to the appointment.',
      },
      {
        question: 'How much does a beard trim cost?',
        answer:
          'Beard trims usually run $15–$35 standalone, or $10–$20 as an add-on to a haircut booking. Sculpting work or beard color services price separately.',
      },
      {
        question: 'How often should I get my beard trimmed?',
        answer:
          'For shaped, defined beards: every 2–3 weeks. For longer, more rugged beards: every 4–6 weeks for a maintenance trim. The neckline and cheek line need attention more often than the bulk length.',
      },
    ],
  },
  'Beard Shaping': {
    intro:
      'Beard shaping goes beyond a basic trim — it’s the strategic sculpting of the beard to complement your face shape, jawline, and personal style. A shaped beard might be tapered shorter on the cheeks and longer at the chin, contoured to elongate a round face, or angled to soften a square jaw. The work involves precise clipper and scissor technique, often a straight-razor edge, and an experienced eye for facial proportion. Beard shaping is often where license-verified barbers really earn their reputation — it’s a craft skill that separates a good cut from a memorable one.',
    faqs: [
      {
        question: 'How long does beard shaping take?',
        answer:
          'A full beard-shaping appointment takes 25 to 45 minutes depending on beard length and complexity. The first appointment usually takes longer because the barber is establishing the shape from scratch.',
      },
      {
        question: 'How much does beard shaping cost?',
        answer:
          'Beard shaping typically runs $30–$60 — more than a basic trim because of the design work and time involved. Some barbers offer ongoing maintenance pricing for clients who return regularly.',
      },
      {
        question: 'What face shape works for what beard style?',
        answer:
          'Square faces benefit from a slightly rounded beard to soften the jawline. Round faces look better with a beard that’s longer at the chin to elongate. Oval faces suit most styles. A skilled barber will assess your face shape and recommend a profile during the consultation.',
      },
    ],
  },
  'Hot Towel Shave': {
    intro:
      'A hot towel shave is a traditional barbershop service combining steam, pre-shave oil, hot lather, a straight razor, and aftershave balm — the closest, smoothest shave possible. The hot towel softens the beard and opens pores, the lather lifts whiskers away from the skin, and the straight razor delivers a level of precision no electric shaver or cartridge can match. It’s as much an experience as a service: 30 minutes of steam, hot towels, and skilled hands on a leather chair. License-verified barbers complete specific training and licensure for straight-razor work in most states because of the safety considerations.',
    faqs: [
      {
        question: 'How long does a hot towel shave take?',
        answer:
          'A full hot towel shave runs 30 to 45 minutes. The service includes pre-shave preparation, two passes with the straight razor (with the grain and against), hot towel applications, and aftershave finish.',
      },
      {
        question: 'How much does a hot towel shave cost?',
        answer:
          'Hot towel shaves typically cost $35–$75 depending on the shop tier and city. Premium concierge or luxury shop experiences can run $100+. The service is priced higher than a standard shave because of the time, technique, and consumables involved.',
      },
      {
        question: 'Is a straight-razor shave safe for sensitive skin?',
        answer:
          'When performed by a license-verified barber, a hot towel shave is generally easier on sensitive skin than cartridge shaving — the single sharp blade requires fewer passes and the hot towel preparation reduces irritation. Tell your barber about any skin sensitivities so they can adjust the lather and aftershave choices.',
      },
    ],
  },
  'Hair Systems': {
    intro:
      'Hair systems are non-surgical hair replacements — custom-made hairpieces (sometimes called toupees, units, or systems) that are bonded or clipped to the scalp to provide natural-looking coverage for thinning or balding areas. Modern hair systems use lace and skin bases that are virtually undetectable when fitted by a trained specialist. License-verified barbers who specialize in hair systems handle the cut-in (trimming the unit to match your hair), bonding application, color matching, and maintenance schedule. This is a niche specialty — not every barber offers it — so client trust in the practitioner’s training matters more here than almost anywhere else.',
    faqs: [
      {
        question: 'How long does a hair system fitting take?',
        answer:
          'Initial fittings (consultation, base sizing, color matching, cut-in) typically take 90 to 120 minutes. Maintenance appointments (clean, re-bond, trim) usually run 60 to 90 minutes. Most clients schedule maintenance every 4–6 weeks.',
      },
      {
        question: 'How much do hair systems cost?',
        answer:
          'A custom hair system itself typically runs $300–$1,500 depending on base type and hair quality. Service appointments (application, maintenance, cut-in) typically run $75–$200 per visit. Clients usually budget $1,500–$3,000+ per year for a complete maintenance schedule.',
      },
      {
        question: 'Will it look natural?',
        answer:
          'When fitted and maintained by a trained specialist, modern hair systems are designed to be undetectable in normal social and professional situations. Quality depends heavily on the practitioner’s skill in cut-in, color matching, and bonding — which is why working with a license-verified specialist matters more than the brand of system.',
      },
    ],
  },
  'Hair Coloring': {
    intro:
      'Hair coloring for men ranges from gray-blending and root touch-ups to full color transformations and creative effects. A skilled barber-stylist can match your natural color, blend gray strategically (rather than dye uniformly), or take you several shades different. The work requires understanding hair structure, color theory, and how different formulas develop on different hair types. License-verified barbers and stylists who offer color services have completed additional training beyond basic cutting — the chemistry and timing aren’t something you learn by watching videos.',
    faqs: [
      {
        question: 'How long does hair coloring take?',
        answer:
          'Gray-blending takes 30 to 60 minutes including processing time. A full color service runs 60 to 120 minutes. Highlights or creative color (vivid colors, bleach-and-tone) can take 2–4 hours. Always book color services as a separate appointment from a regular cut.',
      },
      {
        question: 'How much does hair coloring cost?',
        answer:
          'Gray-blending and root touch-ups typically run $40–$80. Full single-process color: $60–$150. Highlights or creative color: $100–$300+. Pricing varies significantly based on hair length, density, and the specific service requested.',
      },
      {
        question: 'Will color damage my hair?',
        answer:
          'Modern color formulas (especially demi-permanent and ammonia-free options) are far gentler than older products. A trained barber-stylist will assess your hair condition, choose an appropriate formula, and recommend conditioning treatments to maintain hair health. Gray-blending is typically the lowest-impact color service available.',
      },
    ],
  },
  'Kids Cuts': {
    intro:
      'A kids cut is a haircut for children from toddlers through pre-teens — and it’s a different skill from cutting adults. A barber who specializes in kids needs patience, the right chair setup (some shops have child-specific seats), distraction techniques, and the ability to work fast and safely with a moving target. License-verified barbers who specialize in children’s cuts often have first-haircut packages, parent-friendly waiting areas, and experience with kids who have sensory sensitivities or autism. The right barber for a child can turn a stressful errand into a routine the child actually looks forward to.',
    faqs: [
      {
        question: 'How long does a kids cut take?',
        answer:
          'A kids cut typically takes 15 to 30 minutes — faster than an adult cut. First haircuts and cuts for younger toddlers may take a bit longer if the child needs breaks or extra reassurance.',
      },
      {
        question: 'How much does a kids cut cost?',
        answer:
          'Kids cuts typically run $15–$30 — usually priced lower than adult cuts. Some barbers offer first-haircut packages that include a photo and certificate. Pricing varies by city and shop tier.',
      },
      {
        question: 'How do I prepare a young child for their haircut?',
        answer:
          'Bring a snack or favorite toy, schedule the appointment during a non-fussy time of day, and let the barber lead the interaction. Many kid-specialist barbers will let an anxious child sit on a parent’s lap or watch a video during the cut. Tell the barber in advance if your child has sensory sensitivities so they can prepare a gentler approach.',
      },
    ],
  },
  Afro: {
    intro:
      'An afro is a natural hairstyle worn by clients with tightly coiled hair, shaped into a rounded silhouette around the head. A well-cut afro requires understanding of natural Black hair texture, growth patterns, and density — it’s not just letting the hair grow. Barbers shape afros by cutting all hair to a uniform length around the head while accounting for shrinkage, density variation, and the client’s desired silhouette (round, taller on top, asymmetric, etc.). License-verified barbers who specialize in natural Black hair offer expertise that’s essential for healthy, balanced afros — including advice on moisturizing routines and pick-out technique.',
    faqs: [
      {
        question: 'How long does shaping an afro take?',
        answer:
          'Initial afro shaping typically takes 30 to 50 minutes. Maintenance trims to keep the silhouette balanced run 20 to 35 minutes. Larger afros and tighter coil patterns often need more time for even shaping.',
      },
      {
        question: 'How much does an afro shape-up cost?',
        answer:
          'Afro shaping typically runs $30–$60 depending on size, density, and the barber’s experience with natural hair. Some shops include a basic moisturizing treatment in the price.',
      },
      {
        question: 'How often should I shape my afro?',
        answer:
          'For a defined silhouette: every 4 to 6 weeks. Hair growth accumulates unevenly across the head, so regular shape-ups keep the afro looking balanced. Between visits, daily picking and moisturizing maintain shape and shine.',
      },
    ],
  },
  Dreadlocks: {
    intro:
      'Dreadlocks (also called locs) are sectioned strands of hair that have been deliberately matted into ropes through palm-rolling, twisting, interlocking, or backcombing techniques. Starting and maintaining dreadlocks is a long-term commitment that benefits from professional care — especially in the first 6–12 months when the locs are forming. A barber-stylist who specializes in locs can start them properly, perform retwists or interlocks during the maintenance phase, and trim or style mature locs without compromising the structure. License-verified specialists in this category often have years of additional training in natural Black hair care.',
    faqs: [
      {
        question: 'How long does a loc retwist take?',
        answer:
          'A retwist for shoulder-length locs typically runs 60 to 120 minutes. Longer locs and interlocking technique take longer (2–4 hours). Initial loc starts can take 4–8 hours depending on hair length and starting method.',
      },
      {
        question: 'How much does loc maintenance cost?',
        answer:
          'Retwist appointments typically run $60–$150 depending on length and method. Interlocking is usually priced higher than palm-rolling. Initial loc starts run $100–$300+. Most clients schedule maintenance every 4–8 weeks.',
      },
      {
        question: 'Can I start locs on any hair type?',
        answer:
          'Locs can be started on most hair textures, but the method varies — coily/kinky hair locs naturally with palm-rolling or interlocking, while looser textures usually need backcombing or twist-and-rip methods to lock. Consult with a specialist before starting; the wrong method for your texture can lead to slow loc formation or hair damage.',
      },
    ],
  },
  Braids: {
    intro:
      'Braids are a protective style where hair is interwoven into patterns — cornrows close to the scalp, box braids hanging free, or dozens of other styles. A skilled barber-stylist who specializes in braids understands tension, parting precision, scalp health, and how different braid styles wear over time. Quality braids should look clean from day one and stay neat for weeks without causing breakage. License-verified specialists who braid will assess your hair density and scalp before starting and recommend a style that protects your hair rather than stresses it.',
    faqs: [
      {
        question: 'How long does it take to get braids?',
        answer:
          'Cornrows typically take 1 to 3 hours depending on pattern complexity. Box braids and other longer styles run 4 to 8 hours, sometimes more for very long or thick installations. Plan a full afternoon for most braid services.',
      },
      {
        question: 'How much do braids cost?',
        answer:
          'Cornrows: $40–$120 depending on pattern. Box braids and similar long styles: $150–$400+. Pricing varies significantly based on length, thickness, and number of braids. Hair extensions used in the install are usually billed separately ($20–$60).',
      },
      {
        question: 'How long do braids last?',
        answer:
          'Cornrows typically last 1 to 2 weeks. Box braids and similar protective styles can last 4 to 8 weeks with proper care. Longer than that and the new growth at the scalp puts stress on the hair — clean the scalp regularly, sleep with a satin bonnet, and remove the braids before they cause breakage.',
      },
    ],
  },
  'Designs/Patterns': {
    intro:
      'Hair designs (also called hair art or carved patterns) are decorative cuts or shaved patterns on the scalp — geometric lines, symbols, words, gradients, or freehand artwork. The work is done with detail trimmers and a straight razor on the shorter sections of a fade or cut. A barber doing serious design work needs steady hands, an artistic eye, and experience with how different designs read on different hair types and head shapes. License-verified barbers who advertise designs as a specialty typically have portfolios — always look at the portfolio before booking to confirm the style you want is in their wheelhouse.',
    faqs: [
      {
        question: 'How long does a hair design take?',
        answer:
          'A simple design (a single line or basic geometric pattern) adds 10 to 20 minutes to a haircut. Detailed freehand artwork or full-side designs can add 30 to 60+ minutes. Always book the haircut and design together as a single longer appointment.',
      },
      {
        question: 'How much does a hair design cost?',
        answer:
          'Simple designs add $10–$25 to the haircut price. Detailed designs or large pieces add $30–$80+. Custom artwork from photos or sketches is usually quoted in advance based on complexity.',
      },
      {
        question: 'How long does a hair design last?',
        answer:
          'A clean design looks sharpest for the first 3 to 7 days. As hair grows in (about an eighth of an inch per week), the lines soften. Most clients touch up designs every 1 to 2 weeks if they want to maintain the crisp look, or let it grow out naturally between cuts.',
      },
    ],
  },
  'Scissor Cut': {
    intro:
      'A scissor cut uses scissors instead of (or alongside) clippers to shape the hair, producing softer edges and more textural variation than clipper-only work. Scissor work is essential for longer styles — pompadours, fringes, layered cuts, mid-length looks — where clipper guards can’t produce the right shape. It’s also more forgiving on hair that grows in different directions. A skilled scissor barber understands point cutting, slide cutting, and texturizing techniques that clippers simply can’t replicate. Many license-verified barbers consider scissor proficiency the mark of a complete craftsman.',
    faqs: [
      {
        question: 'How long does a scissor cut take?',
        answer:
          'A full scissor cut typically takes 35 to 60 minutes — longer than a clipper cut because of the precision required. First appointments often run on the longer end as the barber learns your hair pattern.',
      },
      {
        question: 'How much does a scissor cut cost?',
        answer:
          'Scissor cuts typically run $35–$75. The premium over clipper cuts reflects the additional time and skill — it’s a slower, more deliberate technique.',
      },
      {
        question: 'Is a scissor cut better than a clipper cut?',
        answer:
          'Neither is better — they’re different tools for different looks. Clipper work excels at short, blended cuts (fades, tapers). Scissor work excels at longer styles where you need texture, layering, and softer edges. Many cuts use both — clippers for the lower portion, scissors on top.',
      },
    ],
  },
  'Flat Top': {
    intro:
      'A flat top is a sharp, geometric haircut where the hair on top is cut to a uniform length and styled to stand straight up, forming a flat plane parallel to the floor. The sides are typically faded or tapered close, creating dramatic contrast. Flat tops require precise scissor and clipper technique — every hair on top has to be the same length to create the flat plane, which means cutting against a comb that’s held parallel to the floor across the entire crown. License-verified barbers who specialize in flat tops are getting rarer; the cut is technical and demands consistent practice to keep the eye sharp.',
    faqs: [
      {
        question: 'How long does a flat top take?',
        answer:
          'A flat top haircut typically runs 40 to 60 minutes — longer than most cuts because of the precision required to create a uniform top plane.',
      },
      {
        question: 'How much does a flat top cost?',
        answer:
          'Flat tops typically run $35–$70. The pricing reflects both the time and the specific skill required — not every barber can deliver a clean flat top, so specialists often command a slight premium.',
      },
      {
        question: 'Will a flat top work with my hair type?',
        answer:
          'Flat tops work best on hair with enough density and texture to stand straight up — typically coarse, thick, or coily hair. Fine or thin hair can be styled into a flat top with product but may not hold the shape as well throughout the day. A skilled barber will assess your hair during the consultation.',
      },
    ],
  },
  Mohawk: {
    intro:
      'A mohawk is a cut where the sides of the head are shaved or cut very short while a strip down the center is left long. Variations range from the traditional shaved-sides punk mohawk to fauxhawks (short on the sides, longer in the center but not shaved), to faded mohawks where the sides taper rather than disappear entirely. A skilled mohawk requires symmetric shaping, clean transitions between the strip and the sides, and styling product knowledge. License-verified barbers who specialize in mohawks understand head shape and how to choose strip width, length, and edge style to flatter the client.',
    faqs: [
      {
        question: 'How long does a mohawk take?',
        answer:
          'A traditional mohawk takes 30 to 45 minutes. A faded or styled mohawk with detail work runs 45 to 60 minutes. Maintenance cuts (touching up the sides without redoing the strip) take 20 to 30 minutes.',
      },
      {
        question: 'How much does a mohawk cost?',
        answer:
          'Mohawks typically run $30–$60. Maintenance touch-ups for the shaved sides run $15–$25. Pricing varies based on whether you want a traditional shave or a faded transition.',
      },
      {
        question: 'How often does a mohawk need maintenance?',
        answer:
          'The shaved sides need touching up every 1 to 2 weeks to maintain a clean look. The center strip can be trimmed every 4 to 6 weeks like a normal cut. Many clients book the maintenance side-shave between full appointments.',
      },
    ],
  },
  Mullet: {
    intro:
      'A mullet is a haircut that’s short on top and on the sides but long in the back — "business in the front, party in the back." Modern mullets range from subtle (slight length differential) to full revival mullets (dramatic contrast). A good mullet is more sophisticated than the cut’s reputation suggests — it requires balancing the front-to-back transition, shaping the back length to flatter the neck, and choosing the right length on top. License-verified barbers who can cut a clean modern mullet are seeing higher demand as the style has come back into fashion.',
    faqs: [
      {
        question: 'How long does a mullet take?',
        answer:
          'A mullet haircut typically takes 30 to 45 minutes. Longer for first-time clients who need full style consultation, shorter for maintenance trims.',
      },
      {
        question: 'How much does a mullet cost?',
        answer:
          'Mullets typically run $30–$60 — comparable to a standard scissor cut. Pricing varies based on hair length and the complexity of the specific mullet variation.',
      },
      {
        question: 'Will a mullet look weird in professional settings?',
        answer:
          'Modern mullets can be cut subtle enough to read as just a "longer-in-back" look that’s perfectly acceptable in most professional settings. Discuss your work environment with the barber and ask for a more conservative variant if needed. Bold revival mullets are louder and read more counter-cultural.',
      },
    ],
  },
  'Senior Cuts': {
    intro:
      'Senior cuts are haircuts tailored for older clients — typically 65+ — where comfort, mobility considerations, and changing hair texture (thinning, gray) shape the service. A skilled senior-cut barber understands how to work efficiently for clients who shouldn\'t sit too long, knows how to disguise thinning crown areas with cut technique, and can adjust styling to match the client’s lifestyle and hair-care ability. Many shops offer senior pricing, and license-verified barbers who specialize in this demographic often have a chair-side manner and patience that make the visit feel like a conversation rather than a transaction.',
    faqs: [
      {
        question: 'How long does a senior cut take?',
        answer:
          'Senior cuts typically take 20 to 35 minutes. Many clients in this demographic prefer slightly faster appointments and a comfortable, low-key chair experience.',
      },
      {
        question: 'How much does a senior cut cost?',
        answer:
          'Most barbers offer senior discounts of $5–$10 off the standard cut price. Typical senior cut pricing: $15–$30. Some shops have a designated senior day with deeper discounts.',
      },
      {
        question: 'Can a barber help with thinning hair?',
        answer:
          'Yes — experienced barbers know how to cut around crown thinning, layer to add the appearance of density, and recommend products and styling techniques that flatter thinning hair without trying to hide it. Clients with significant hair loss may also want to consider a hair-system specialist.',
      },
    ],
  },
  'Head Shave': {
    intro:
      'A head shave is the complete removal of all hair from the scalp, typically with a straight razor or clippers followed by a razor for a smooth finish. A professional head shave includes hot towel preparation, lathering, careful razor work, and aftershave — similar to a hot towel face shave but covering the whole head. Many clients choose head shaves to manage thinning hair, while others prefer the look year-round. License-verified barbers trained in straight-razor work deliver a smoother, longer-lasting shave than home methods, with less irritation and fewer ingrown hairs.',
    faqs: [
      {
        question: 'How long does a head shave take?',
        answer:
          'A full head shave with hot towel preparation runs 25 to 40 minutes. Maintenance head shaves (clients who keep the head shaved year-round) typically run 20 to 30 minutes once the barber knows the head shape.',
      },
      {
        question: 'How much does a head shave cost?',
        answer:
          'Professional head shaves typically run $30–$70. Premium experiences with full hot towel and aftershave routines can run $80+. Pricing varies based on shop tier and whether the shave is a one-time service or part of an ongoing maintenance schedule.',
      },
      {
        question: 'How smooth is a professional head shave vs at-home?',
        answer:
          'A straight-razor shave done by a trained barber typically lasts 2–3 days at full smoothness — significantly longer than at-home cartridge or electric methods. The technique also reduces ingrown hairs and razor bumps because the single sharp blade requires fewer passes.',
      },
    ],
  },
  'Eyebrow Threading': {
    intro:
      'Eyebrow threading is a hair-removal technique that uses a twisted cotton thread to remove rows of hair at once — extremely precise, all-natural, and gentler on skin than waxing. Threading originated in South Asia and the Middle East and is performed by trained specialists who can shape brows for any face, including for men who want subtle cleanup of strays without obviously plucked eyebrows. License-verified specialists who offer threading have specific training in the technique; it looks simple but takes hundreds of hours to master without nicking skin or pulling unevenly.',
    faqs: [
      {
        question: 'How long does eyebrow threading take?',
        answer:
          'Eyebrow threading takes 5 to 15 minutes. It’s typically the fastest add-on service offered alongside a haircut or beard trim.',
      },
      {
        question: 'How much does eyebrow threading cost?',
        answer:
          'Threading typically runs $10–$25 for eyebrows alone. Some shops offer it as a $5 add-on to a haircut booking. Threading other facial areas (upper lip, chin, sideburns) is usually priced separately at similar rates.',
      },
      {
        question: 'Does threading hurt?',
        answer:
          'Threading produces a quick pinching sensation as hairs are removed in rows. Most clients find it less painful than waxing and easier on sensitive skin. The discomfort is brief — the entire service is usually under 15 minutes.',
      },
    ],
  },
  'Facial Treatment': {
    intro:
      'Facial treatments at a barbershop are skin-care services tailored for men — cleansing, exfoliating, steaming, masking, and moisturizing the face. Services range from a basic cleansing facial to full multi-step routines addressing specific concerns (oily skin, ingrown hairs from shaving, sun damage, aging). Barbers who offer facials have completed esthetician or barber-esthetician licensure in most states, with training in skin biology and product chemistry beyond standard barber education. License-verified facial specialists can recommend at-home routines that complement the in-shop treatment.',
    faqs: [
      {
        question: 'How long does a facial treatment take?',
        answer:
          'A basic men’s facial typically runs 30 to 45 minutes. More involved treatments (deep cleansing, extractions, anti-aging routines) run 60 to 90 minutes. Most clients book facials as a separate appointment from a regular haircut.',
      },
      {
        question: 'How much does a facial treatment cost?',
        answer:
          'Basic men’s facials typically run $50–$100. Premium treatments with extractions, masks, or specialty serums run $100–$200+. Pricing varies significantly based on shop tier, products used, and the specialist’s training.',
      },
      {
        question: 'How often should I get a facial?',
        answer:
          'For maintenance: every 4 to 6 weeks (matching your skin’s natural cycle). For active skin concerns (acne, ingrown hairs from shaving): every 2 to 4 weeks until the issue is resolved. Your specialist will recommend a schedule based on your skin and goals.',
      },
    ],
  },
};
