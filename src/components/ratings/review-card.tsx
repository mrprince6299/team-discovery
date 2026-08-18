'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Star, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface ReviewCardProps {
  rating: {
    id: string
    score: number
    feedback: string | null
    createdAt: Date
    rater: {
      id?: string
      name: string
      username: string
      profilePhoto?: string | null
    }
    team?: {
      id?: string
      name: string
    }
  }
}

export function ReviewCard({ rating }: ReviewCardProps) {
  const initials = rating.rater.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="border-border/80 bg-muted/10 hover:border-border transition-colors rounded-xl overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          {/* Reviewer Header */}
          <div className="flex items-center gap-3">
            <Avatar className="size-9 rounded-xl border border-border/80 shadow-xs">
              <AvatarImage
                src={rating.rater.profilePhoto || undefined}
                alt={rating.rater.name}
              />
              <AvatarFallback className="rounded-xl text-xs font-bold bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                {rating.rater.id ? (
                  <Link
                    href={`/users/${rating.rater.id}`}
                    className="text-xs font-bold text-foreground hover:text-primary transition-colors"
                  >
                    {rating.rater.name}
                  </Link>
                ) : (
                  <span className="text-xs font-bold text-foreground">
                    {rating.rater.name}
                  </span>
                )}
                <ShieldCheck className="size-3 text-emerald-500 shrink-0" />
              </div>
              <p className="text-[11px] text-muted-foreground">@{rating.rater.username}</p>
            </div>
          </div>

          {/* Star Score & Squad Badge */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              <Star className="size-3 fill-amber-400 text-amber-500" />
              <span className="text-xs font-bold text-foreground">{rating.score}/5</span>
            </div>

            {rating.team && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground border-border/60">
                Squad: {rating.team.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Written Feedback Quote */}
        {rating.feedback ? (
          <div className="relative pl-3 border-l-2 border-primary/30 space-y-1">
            <p className="text-xs text-foreground/90 leading-relaxed italic">
              &ldquo;{rating.feedback}&rdquo;
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            (Endorsed with 5-star rating without written comment)
          </p>
        )}

        {/* Date Footer */}
        <div className="text-[10px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border/40">
          <span>Verified Teammate Endorsement</span>
          <span>
            {new Date(rating.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
