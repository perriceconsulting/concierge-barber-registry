import { SOCIAL_LINKS } from '@/config';

/**
 * Official social profiles as a card grid.
 *
 * Renders its own icons: lucide-react dropped brand glyphs, so these are
 * inline paths using `currentColor` — no icon dependency, no network request,
 * and they inherit hover colour for free.
 *
 * Keep this OUTSIDE any `prose` wrapper. Tailwind Typography styles bare `a`
 * and `li` elements, which turns these cards into an underlined bulleted list.
 */

const ICONS: Record<string, React.ReactNode> = {
  Instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  X: (
    <path
      d="M3 3h4.2l5 6.6L17.6 3H21l-7.3 8.6L21.4 21H17l-5.2-6.9L5.9 21H2.5l7.7-9L3 3z"
      fill="currentColor"
      stroke="none"
    />
  ),
  TikTok: (
    <path
      d="M14 3v10.6a3.2 3.2 0 1 1-2.6-3.15V7.6A6.6 6.6 0 1 0 17.4 14V9.1a6.4 6.4 0 0 0 3.6 1.1V7.2A3.9 3.9 0 0 1 17 3h-3z"
      fill="currentColor"
      stroke="none"
    />
  ),
  Facebook: (
    <path
      d="M14.5 8.5V6.8c0-.8.2-1.2 1.4-1.2H17V2.6c-.3 0-1.2-.1-2.3-.1-2.4 0-4 1.4-4 4.1v1.9H8v3h2.7V21h3.3v-9.5h2.7l.4-3h-3.1z"
      fill="currentColor"
      stroke="none"
    />
  ),
};

export function SocialLinks() {
  return (
    <ul className="not-prose grid grid-cols-2 gap-3 sm:grid-cols-4 list-none p-0 m-0">
      {SOCIAL_LINKS.map((profile) => (
        <li key={profile.name} className="m-0 p-0">
          {/* rel="me" is the other half of schema.org sameAs — it lets the
              profile claim this site back, which is what verifies the pair. */}
          <a
            href={profile.url}
            target="_blank"
            rel="me noopener noreferrer"
            aria-label={`${profile.name} — ${profile.handle}`}
            className="group flex h-full flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-5 no-underline transition-colors hover:border-primary/60 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICONS[profile.name]}
            </svg>
            <span className="text-sm font-semibold text-heading no-underline">
              {profile.name}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
