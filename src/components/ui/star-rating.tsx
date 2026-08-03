import * as React from "react"
import { cn } from "@/lib/utils"

const MAX_RATING = 5

export interface StarRatingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Filled star count, 0–5. Fractional values are rounded to the nearest whole star. */
  rating: number
}

/**
 * Read-only star rating. Renders as a single labelled image for assistive tech
 * rather than five loose glyphs.
 */
function StarRating({ rating, className, ...props }: StarRatingProps) {
  const filled = Math.max(0, Math.min(MAX_RATING, Math.round(rating)))

  return (
    <div
      role="img"
      aria-label={`${filled} out of ${MAX_RATING} stars`}
      className={cn("flex", className)}
      {...props}
    >
      {Array.from({ length: MAX_RATING }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={i < filled ? "text-primary" : "text-muted-foreground/40"}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export { StarRating, MAX_RATING }
