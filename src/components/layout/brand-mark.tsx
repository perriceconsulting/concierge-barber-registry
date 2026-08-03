import Image from 'next/image';
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
      {/* next/image optimizes the 2048px source down to the rendered size, so the
          full-res logo never ships at full weight. */}
      <Image
        src={APP_CONFIG.logo}
        alt={APP_CONFIG.name}
        width={mark}
        height={mark}
        priority
        className="shrink-0 rounded-lg object-cover ring-1 ring-cbr-gold/30"
      />
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
