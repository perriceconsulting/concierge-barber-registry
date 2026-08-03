import { Container } from '@/components/layout/container';
import { FAQStructuredData } from '@/components/seo/faq-structured-data';
import type { FaqEntry } from '@/lib/copy/faqs';

interface FaqSectionProps {
  /** The page's FAQ bank from `src/lib/copy/faqs.ts`. */
  items: readonly FaqEntry[];
  /** Section heading shown above the Q&A list. Defaults to "Frequently Asked Questions". */
  heading?: string;
  /** Optional short paragraph under the heading — frames the topical scope. */
  lede?: string;
  /** Background variant. `'card'` (default) uses `bg-card`; `'transparent'` for sections that already have their own background. */
  background?: 'card' | 'transparent';
  /** Override the anchor `id` used for in-page linking + Speakable schema targeting. */
  id?: string;
}

/**
 * Visible FAQ block + FAQPage JSON-LD in one drop-in. Google's FAQPage
 * structured-data guideline requires the answers to be visibly on the page —
 * schema without rendered content gets demoted or ignored. This component
 * keeps the two in lockstep by sourcing both from the same `items` array.
 *
 * Uses native `<details>` for the expand/collapse behavior — that's
 * keyboard-accessible by default and doesn't require client JS.
 */
export function FaqSection({
  items,
  heading = 'Frequently Asked Questions',
  lede,
  background = 'card',
  id = 'faqs',
}: FaqSectionProps) {
  if (items.length === 0) return null;

  const bgClass = background === 'card' ? 'bg-card border-y border-border' : '';

  return (
    <section id={id} className={`py-20 ${bgClass}`} aria-labelledby={`${id}-heading`}>
      <FAQStructuredData
        items={items.map((i) => ({ question: i.question, answer: i.answer }))}
      />
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2
              id={`${id}-heading`}
              className="font-serif text-3xl font-bold tracking-tight text-heading sm:text-4xl"
            >
              {heading}
            </h2>
            {lede && (
              <p className="mt-4 text-lg text-muted-foreground">{lede}</p>
            )}
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <details
                key={item.question}
                className="group rounded-lg border border-border bg-background p-5 open:bg-card transition-colors"
                // First entry open by default — surfaces an answer above the fold
                // for SGE/AI Overview readout, and signals to the user the block
                // is interactive.
                {...(idx === 0 ? { open: true } : {})}
              >
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 font-serif text-lg font-semibold text-primary marker:hidden">
                  <span>{item.question}</span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-secondary text-xl leading-none transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
