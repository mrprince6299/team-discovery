import Image from "next/image"
import Link from "next/link"
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Flame,
  Star,
  Layers,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground antialiased">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              TD
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight tracking-tight">Team Discovery</span>
              <span className="text-[10px] text-muted-foreground leading-none font-medium">Teammate Matching Platform</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground" aria-label="Main navigation">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#matching-hierarchy" className="hover:text-foreground transition-colors">Matching Engine</a>
            <a href="#features" className="hover:text-foreground transition-colors">Platform Features</a>
            <a href="#trust" className="hover:text-foreground transition-colors">Verified Identity</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="shadow-xs">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              {/* Hero Copy */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="size-3.5" />
                  <span>Deterministic Skill-Based Teammate Matching</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                  Find the <span className="text-emerald-600 dark:text-emerald-400">exact teammates</span> you need for hackathons.
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                  Stop assembling teams through random group chats. Match student candidates to open team roles based on required skills, verifiable project portfolios, and real-time availability.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                  <Button asChild size="lg" className="w-full sm:w-auto gap-2 text-base font-semibold shadow-md">
                    <Link href="/signup">
                      <span>Create Free Account</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base">
                    <Link href="/login">Sign In with College Email</Link>
                  </Button>
                </div>

                {/* Key Indicators */}
                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-border/80 max-w-lg mx-auto lg:mx-0">
                  <div className="text-left">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Match Priority</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">Exact &gt; Related &gt; Interest</div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Seats</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">Zero Overbooking</div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identity</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">Student Verified</div>
                  </div>
                </div>
              </div>

              {/* Hero Image & Dynamic Match Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-2xl border border-border/80 bg-card p-3 shadow-2xl overflow-hidden">
                  <Image
                    src="/images/hero-team-match.jpg"
                    alt="Students collaborating and matching skills for hackathon teams"
                    width={800}
                    height={450}
                    priority
                    className="rounded-xl w-full object-cover"
                  />

                  {/* Floating Interactive Sample Match Card */}
                  <div className="mt-3 p-4 rounded-xl border border-border/80 bg-background/95 backdrop-blur-sm space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                          LC
                        </div>
                        <div>
                          <div className="text-sm font-bold leading-tight">Liam Chen</div>
                          <div className="text-xs text-muted-foreground">Computer Science · Year 3</div>
                        </div>
                      </div>
                      <Badge variant="exact" className="text-xs px-2 py-0.5">
                        Exact Match
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Matched Skills: </span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">React · TypeScript · PostgreSQL</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Star className="size-3.5 fill-amber-400 text-amber-500" />
                        <span className="font-semibold text-foreground">4.9</span> (6 reviews)
                      </div>
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="size-3.5" /> Available Now
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION (The Product Flywheel) */}
        <section id="how-it-works" className="py-16 sm:py-24 border-t border-border/80 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
                The Teammate Flywheel
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                How Team Discovery Works
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                From role definition to project workspace in 6 frictionless steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Step 1: DISCOVER */}
              <Card className="border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
                <CardHeader className="space-y-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    01
                  </div>
                  <CardTitle className="text-lg font-bold">1. Discover &amp; Define</CardTitle>
                  <CardDescription>
                    Team Leaders specify required and preferred skills for open recruitment roles.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Step 2: MATCH */}
              <Card className="border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 transition-colors shadow-xs">
                <CardHeader className="space-y-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                    02
                  </div>
                  <CardTitle className="text-lg font-bold text-emerald-800 dark:text-emerald-200">2. Match Engine</CardTitle>
                  <CardDescription>
                    Candidates are segmented into Exact, Related, and Interest tiers based on verified skills.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Step 3: EVALUATE */}
              <Card className="border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
                <CardHeader className="space-y-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    03
                  </div>
                  <CardTitle className="text-lg font-bold">3. Evaluate Evidence</CardTitle>
                  <CardDescription>
                    Inspect verified project links, GitHub repositories, skill levels, and peer feedback.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Step 4: CONNECT */}
              <Card className="border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
                <CardHeader className="space-y-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    04
                  </div>
                  <CardTitle className="text-lg font-bold">4. Connect &amp; Invite</CardTitle>
                  <CardDescription>
                    Send instant invitations or submit direct role applications with expiry timers.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Step 5: FORM TEAM */}
              <Card className="border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
                <CardHeader className="space-y-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    05
                  </div>
                  <CardTitle className="text-lg font-bold">5. Atomic Team Formation</CardTitle>
                  <CardDescription>
                    Row-level database locks ensure seats are filled atomically with zero overbooking.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Step 6: COLLABORATE */}
              <Card className="border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
                <CardHeader className="space-y-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    06
                  </div>
                  <CardTitle className="text-lg font-bold">6. Collaborate</CardTitle>
                  <CardDescription>
                    Access member-only team workspaces with conversation feeds, shared links, and files.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* MATCHING HIERARCHY SECTION */}
        <section id="matching-hierarchy" className="py-16 sm:py-24 border-t border-border/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
                Transparent Matching
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Strict Skill Hierarchy
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                No black-box algorithms. We rank candidates deterministically so you know exactly why someone is recommended.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Exact Match Tier */}
              <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/5 p-6 space-y-4 shadow-sm relative">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  <Award className="size-3.5" /> Tier 1: Highest Priority
                </div>
                <h3 className="text-xl font-bold text-foreground">Exact Match</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Candidate possesses the exact skills marked as <strong>REQUIRED</strong> by the team leader. They are placed at the top of discovery results.
                </p>
                <div className="pt-3 border-t border-emerald-500/20 space-y-2">
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Visual Badge:</div>
                  <Badge variant="exact" className="text-xs">Exact Match (3/3 Required)</Badge>
                </div>
              </div>

              {/* Related Match Tier */}
              <div className="rounded-2xl border border-blue-500/40 bg-blue-500/5 p-6 space-y-4 shadow-sm">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-xs">
                  <Layers className="size-3.5" /> Tier 2: Secondary Priority
                </div>
                <h3 className="text-xl font-bold text-foreground">Related Match</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Candidate has semantically mapped skills from our skill taxonomy (e.g. PyTorch ~ TensorFlow or React ~ Next.js).
                </p>
                <div className="pt-3 border-t border-blue-500/20 space-y-2">
                  <div className="text-xs font-semibold text-blue-800 dark:text-blue-300">Visual Badge:</div>
                  <Badge variant="related" className="text-xs">Related: PyTorch ~ TensorFlow</Badge>
                </div>
              </div>

              {/* Interest Only Tier */}
              <div className="rounded-2xl border border-slate-500/30 bg-slate-500/5 p-6 space-y-4 shadow-sm">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/20 text-slate-700 dark:text-slate-300 font-bold text-xs">
                  <Flame className="size-3.5" /> Tier 3: Tertiary Priority
                </div>
                <h3 className="text-xl font-bold text-foreground">Interest Only</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Candidate has declared interest in the domain but has not yet registered completed projects in the specific required stack.
                </p>
                <div className="pt-3 border-t border-slate-500/20 space-y-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-300">Visual Badge:</div>
                  <Badge variant="interest" className="text-xs">Interest: Web Development</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST & VERIFICATION SECTION */}
        <section id="trust" className="py-16 sm:py-24 border-t border-border/80 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
                  Institutional Trust
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                  Verified Student Identity &amp; Peer Credibility
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Every participant is verified via their institutional college email, eliminating ghost accounts and ensuring accountable team commitments for high-stakes hackathons.
                </p>

                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-sm text-foreground">Institutional Email Verification: </span>
                      <span className="text-sm text-muted-foreground">Immutable college identity checks prevent fake profiles.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-sm text-foreground">One-Team-Per-Event Guarantee: </span>
                      <span className="text-sm text-muted-foreground">Database constraints prevent candidates from joining multiple teams for the same competition.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-sm text-foreground">Peer Trust Scores: </span>
                      <span className="text-sm text-muted-foreground">Post-event peer ratings provide a secondary reputation signal without replacing skill rankings.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 flex justify-center">
                <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xl max-w-md w-full">
                  <Image
                    src="/images/verify-identity.jpg"
                    alt="Verified student identity and credential checkmark illustration"
                    width={600}
                    height={450}
                    className="rounded-xl w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="py-16 sm:py-20 border-t border-border/80 bg-background text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Ready to assemble your winning hackathon team?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join students discovering teammates with exact skill matches, verified portfolios, and active availability.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto gap-2 text-base font-semibold shadow-md">
                <Link href="/signup">
                  <span>Sign Up Now</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/80 bg-muted/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm">Team Discovery</span>
            <span>· Independent Collegiate Teammate Matching Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            <Link href="/verify" className="hover:text-foreground transition-colors">Account Verification</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
