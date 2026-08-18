"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Award, Layers, Flame } from "lucide-react"

interface MatchBadgeProps {
  category: "EXACT" | "RELATED" | "INTEREST_ONLY"
  coverage?: {
    matched: number
    total: number
  }
  relatedInfo?: string
  interestName?: string
  className?: string
}

export function MatchBadge({
  category,
  coverage,
  relatedInfo,
  interestName,
  className,
}: MatchBadgeProps) {
  if (category === "EXACT") {
    return (
      <Badge
        variant="exact"
        className={`gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${className || ""}`}
      >
        <Award className="size-3.5" />
        <span>
          Exact Match {coverage ? `(${coverage.matched}/${coverage.total} Skills)` : ""}
        </span>
      </Badge>
    )
  }

  if (category === "RELATED") {
    return (
      <Badge
        variant="related"
        className={`gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${className || ""}`}
      >
        <Layers className="size-3.5" />
        <span>Related Match {relatedInfo ? `(${relatedInfo})` : ""}</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="interest"
      className={`gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${className || ""}`}
    >
      <Flame className="size-3.5 text-slate-500" />
      <span>Interest Match {interestName ? `(${interestName})` : ""}</span>
    </Badge>
  )
}
