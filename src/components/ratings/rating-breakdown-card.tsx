'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Award, ShieldCheck, UserCheck } from 'lucide-react'

interface RatingItem {
  id: string
  score: number
  feedback: string | null
  createdAt: Date
  rater?: {
    name: string
    username: string
  }
}

interface RatingBreakdownCardProps {
  ratings: RatingItem[]
  candidateName: string
  className?: string
}

export function RatingBreakdownCard({
  ratings,
  candidateName,
  className,
}: RatingBreakdownCardProps) {
  const totalRatings = ratings.length
  const avgRating =
    totalRatings > 0
      ? Number(
          (
            ratings.reduce((acc, r) => acc + r.score, 0) / totalRatings
          ).toFixed(1)
        )
      : null

  // Calculate distribution 5★ down to 1★
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = ratings.filter((r) => r.score === star).length
    const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0
    return { star, count, percentage }
  })

  const isTopEndorsed = totalRatings >= 3 && (avgRating || 0) >= 4.5
  const isVerifiedCollaborator = totalRatings >= 1

  return (
    <Card className={`border-border/80 shadow-xs rounded-xl overflow-hidden ${className || ''}`}>
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Star className="size-4 fill-amber-400 text-amber-500" />
              <span>Peer Trust Score &amp; Ratings</span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Verified endorsements from teammates following completed squad collaborations.
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {isTopEndorsed ? (
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] uppercase font-bold flex items-center gap-1">
                <Award className="size-3 text-amber-500" />
                Top Endorsed Builder
              </Badge>
            ) : isVerifiedCollaborator ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-500" />
                Verified Collaborator
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground">
                <UserCheck className="size-3 mr-1" />
                New Builder
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 pb-5 space-y-6">
        {totalRatings === 0 ? (
          <div className="text-center py-6 px-4 space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Star className="size-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">No peer reviews yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {candidateName} will accumulate peer trust ratings after collaborating on active squads in hackathons and build challenges.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Big Score Summary */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-muted/20 border border-border/60 text-center space-y-1">
              <div className="text-4xl font-extrabold tracking-tight text-foreground flex items-baseline gap-1">
                <span>{avgRating}</span>
                <span className="text-sm font-semibold text-muted-foreground">/ 5.0</span>
              </div>

              <div className="flex items-center gap-1 text-amber-500 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-4 ${
                      star <= Math.round(avgRating || 0)
                        ? 'fill-amber-400 text-amber-500'
                        : 'fill-transparent text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs font-medium text-muted-foreground">
                Based on <strong className="text-foreground">{totalRatings}</strong> verified{' '}
                {totalRatings === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Right: 5-Star Distribution Bars */}
            <div className="md:col-span-8 space-y-2">
              {distribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 shrink-0 font-semibold text-muted-foreground">
                    <span>{star}</span>
                    <Star className="size-3 fill-amber-400 text-amber-500" />
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="w-14 text-right shrink-0 text-muted-foreground text-[11px] font-medium">
                    {count} ({percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
