import { APP_CONFIG } from '@/config';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { mark: 28, wordmark: 'text-base' },
  md: { mark: 36, wordmark: 'text-xl sm:text-2xl' },
  lg: { mark: 48, wordmark: 'text-2xl sm:text-3xl' },
} as const;

export function BrandMark({
  size = 'md',
  showWordmark = true,
  className = '',
}: BrandMarkProps) {
  const { mark, wordmark } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="cbr-mark-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8C46B" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#9C7E1E" />
          </linearGradient>
        </defs>
        <rect
          width="48"
          height="48"
          rx="10"
          fill="#0D0D0D"
          stroke="url(#cbr-mark-gold)"
          strokeWidth="1.5"
        />
        <text
          x="24"
          y="33"
          fontSize="28"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          textAnchor="middle"
          fill="url(#cbr-mark-gold)"
          letterSpacing="-0.02em"
        >
          C
        </text>
      </svg>
      {showWordmark && (
        <span
          className={`font-serif font-bold tracking-tight text-cbr-gold leading-none ${wordmark}`}
        >
          {APP_CONFIG.name}
        </span>
      )}
    </div>
  );
}
