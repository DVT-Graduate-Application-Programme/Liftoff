"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const starRatingVariants = cva("", {
  variants: {
    variant: {
      default: "fill-primary text-primary",
      culture: "fill-chart-4 text-chart-4",
      tech: "fill-chart-2 text-chart-2",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface StarRatingProps extends VariantProps<typeof starRatingVariants> {
  value: number
  onChange: (rating: number) => void
  disabled?: boolean
  size?: "sm" | "default"
}

function StarRating({ value, onChange, disabled, variant, size = "default" }: StarRatingProps) {
  const [hoveredValue, setHoveredValue] = React.useState<number | null>(null)

  return (
    <div data-slot="star-rating" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isHighlighted = hoveredValue !== null ? star <= hoveredValue : star <= value
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => { onChange(star); }}
            onMouseEnter={() => { if (!disabled) setHoveredValue(star); }}
            onMouseLeave={() => { if (!disabled) setHoveredValue(null); }}
            aria-label={`Rate ${String(star)} star${star > 1 ? "s" : ""}`}
            className="disabled:opacity-50 transition-transform duration-100 hover:scale-110 focus:outline-none"
          >
            <Star
              className={cn(
                size === "sm" ? "size-4" : "size-6",
                "text-muted-foreground transition-colors",
                isHighlighted && starRatingVariants({ variant }),
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export { StarRating, starRatingVariants };
