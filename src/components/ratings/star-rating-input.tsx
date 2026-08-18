'use client'

import * as React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingInputProps {
  value: number
  onChange: (score: number) => void
  disabled?: boolean
  className?: string
}

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Exceptional',
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  className,
}: StarRatingInputProps) {
  const [hoveredValue, setHoveredValue] = React.useState<number | null>(null)

  const activeValue = hoveredValue !== null ? hoveredValue : value

  const handleKeyDown = (e: React.KeyboardEvent, star: number) => {
    if (disabled) return

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(5, star + 1)
      onChange(next)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      const prev = Math.max(1, star - 1)
      onChange(prev)
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(1)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(5)
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange(star)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        role="radiogroup"
        aria-label="Peer Rating: 1 to 5 stars"
        className="flex items-center gap-1.5"
        onMouseLeave={() => setHoveredValue(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeValue
          const isCurrentSelected = star === value

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={isCurrentSelected}
              aria-label={`${star} Stars - ${RATING_LABELS[star]}`}
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoveredValue(star)}
              onFocus={() => setHoveredValue(star)}
              onBlur={() => setHoveredValue(null)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              className={cn(
                'p-1 rounded-md transition-transform motion-safe:hover:scale-110 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              )}
            >
              <Star
                className={cn(
                  'h-7 w-7 transition-colors duration-150',
                  isFilled
                    ? 'fill-amber-400 text-amber-500 stroke-amber-500 drop-shadow-xs'
                    : 'fill-transparent text-muted-foreground/40 hover:text-muted-foreground'
                )}
              />
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="font-bold text-foreground">
          {activeValue > 0 ? `${activeValue} / 5` : 'Select a rating'}
        </span>
        {activeValue > 0 && (
          <span className="text-muted-foreground font-medium">
            — {RATING_LABELS[activeValue]}
          </span>
        )}
      </div>
    </div>
  )
}
