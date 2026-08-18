import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, Clock, HelpCircle, LayoutDashboard, LogOut, ShieldAlert, ShieldCheck } from "lucide-react"
import { logout } from "@/app/actions/auth"

export default async function VerifyPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let userRecord = null
  if (authUser) {
    userRecord = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { privateData: true }
    })
  }

  const status = userRecord?.verificationStatus || (authUser ? "PENDING" : "UNAUTHENTICATED")
  const email = userRecord?.privateData?.collegeEmail || authUser?.email || "student@institution.edu"

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-muted/20 selection:bg-primary selection:text-primary-foreground">
      {/* Brand Header */}
      <div className="mb-6 text-center space-y-1">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
            TD
          </span>
          <span className="font-bold text-xl tracking-tight text-foreground">Team Discovery</span>
        </Link>
        <p className="text-xs text-muted-foreground">Collegiate Identity &amp; Verification Center</p>
      </div>

      <Card className="w-full max-w-lg border-border/80 bg-card shadow-xl rounded-2xl overflow-hidden">
        {/* Visual Header */}
        <div className="p-4 bg-muted/30 border-b border-border/60 flex items-center justify-center">
          <div className="max-w-[240px] w-full">
            <Image
              src="/images/verify-identity.jpg"
              alt="Student Identity Verification Illustration"
              width={400}
              height={300}
              className="rounded-xl object-cover shadow-xs"
            />
          </div>
        </div>

        <CardHeader className="text-center space-y-2 pt-6">
          <div className="flex justify-center">
            {status === "APPROVED" ? (
              <Badge variant="success" className="gap-1.5 px-3 py-1 text-xs uppercase tracking-wider">
                <CheckCircle2 className="size-4" />
                <span>Account Verified</span>
              </Badge>
            ) : status === "REJECTED" ? (
              <Badge variant="destructive" className="gap-1.5 px-3 py-1 text-xs uppercase tracking-wider">
                <ShieldAlert className="size-4" />
                <span>Verification Rejected</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 border-amber-500/40 bg-amber-500/10">
                <Clock className="size-4 text-amber-600" />
                <span>Verification Under Review</span>
              </Badge>
            )}
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight">
            {status === "APPROVED"
              ? "Your Account is Fully Verified"
              : status === "REJECTED"
              ? "Verification Needs Attention"
              : "Student Verification Pending"}
          </CardTitle>

          <CardDescription className="text-sm max-w-md mx-auto leading-relaxed">
            {status === "APPROVED"
              ? "You have full access to recruit teammates, apply to open roles, and form hackathon teams."
              : status === "REJECTED"
              ? "Your student credential review was not approved. Please contact your campus administrator or support team."
              : `Your institutional email (${email}) is registered. Verification ensures all hackathon participants are authenticated students.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          {status !== "APPROVED" && (
            <div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-3">
              <div className="font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <span>What can you do while pending?</span>
              </div>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>Explore public hackathon events and browse open teams.</li>
                <li>Set up your skills and project portfolio.</li>
                <li>Recruiting candidates and forming new teams unlocks upon approval.</li>
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-blue-800 dark:text-blue-300">
            <HelpCircle className="size-4 shrink-0" />
            <span>
              Institutional verification typically completes automatically or within 1 business day.
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2 pb-6 border-t border-border/60 bg-muted/10">
          {status === "APPROVED" ? (
            <Button asChild className="w-full h-10 gap-2 font-semibold shadow-xs">
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" />
                <span>Go to Dashboard</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : authUser ? (
            <div className="w-full flex flex-col sm:flex-row items-center gap-2">
              <Button asChild variant="outline" className="w-full sm:flex-1 h-9 text-xs">
                <Link href="/">Return to Home</Link>
              </Button>
              <form action={logout} className="w-full sm:w-auto">
                <Button type="submit" variant="ghost" className="w-full h-9 text-xs gap-1.5 text-muted-foreground hover:text-destructive">
                  <LogOut className="size-3.5" />
                  <span>Sign Out</span>
                </Button>
              </form>
            </div>
          ) : (
            <Button asChild className="w-full h-10 font-semibold">
              <Link href="/login">Sign In to View Status</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
