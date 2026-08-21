"use client"

import * as React from "react"
import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import {
  Compass,
  User,
  GraduationCap,
  Briefcase,
  Code2,
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Plus,
  X,
  Search,
  Check,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AUTHORITATIVE_ROLES,
  AUTHORITATIVE_PROGRAMS,
  getBranchesForProgram,
  ACADEMIC_YEAR_OPTIONS,
  AVAILABILITY_OPTIONS,
} from "@/lib/constants/options"
import { saveOnboardingProfile } from "@/app/actions/profile"
import { toast } from "sonner"
import type { SkillLevel, Availability } from "@prisma/client"

export interface OnboardingInitialData {
  name: string
  username: string
  collegeEmail?: string | null
  erp?: string | null
  college?: string | null
  program?: string | null
  branch?: string | null
  year?: number | null
  primaryRole?: string | null
  bio?: string | null
  availability: Availability
  skills: Array<{ id: string; name: string; level: SkillLevel }>
  interests: Array<{ id: string; name: string }>
}

interface OnboardingWizardProps {
  initialData: OnboardingInitialData
  availableSkills: Array<{ id: string; name: string }>
  colleges: Array<{ id: string; name: string }>
}

type WizardStep = "WELCOME" | "BASIC" | "ACADEMICS" | "ROLE" | "SKILLS" | "INTERESTS" | "AVAILABILITY" | "READY"

const POPULAR_INTERESTS = [
  "Artificial Intelligence",
  "Web Development",
  "Mobile Apps",
  "Cloud & DevOps",
  "Cyber Security",
  "Blockchain / Web3",
  "Data Science & Analytics",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Internet of Things (IoT)",
  "Open Source",
]

const POPULAR_SKILLS = [
  "React",
  "TypeScript",
  "Python",
  "Node.js",
  "Next.js",
  "Tailwind CSS",
  "PostgreSQL",
  "Docker",
  "PyTorch",
  "Figma",
  "Go",
  "Flutter",
  "C++",
  "AWS",
]

export function OnboardingWizard({ initialData, availableSkills, colleges: _colleges }: OnboardingWizardProps) {
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState<WizardStep>("WELCOME")

  // Form State
  const [name, setName] = useState(initialData.name || "")
  const [collegeName, setCollegeName] = useState(initialData.college || "")
  const [collegeEmail, setCollegeEmail] = useState(initialData.collegeEmail || "")
  const [erp, setErp] = useState(initialData.erp || "")
  const [programName, setProgramName] = useState(initialData.program || "")
  const [branchName, setBranchName] = useState(initialData.branch || "")
  const [year, setYear] = useState<number | null>(initialData.year || 3)
  const [role, setRole] = useState(initialData.primaryRole || "")
  const [bio] = useState(initialData.bio || "")
  const [availability, setAvailability] = useState<Availability>(initialData.availability || "AVAILABLE")

  // Selected Skills Map (name/id -> level)
  const [selectedSkills, setSelectedSkills] = useState<Array<{ skillIdOrName: string; name: string; level: SkillLevel }>>(() => {
    return initialData.skills.map((s) => ({
      skillIdOrName: s.id,
      name: s.name,
      level: s.level,
    }))
  })

  // Selected Interests Set
  const [selectedInterests, setSelectedInterests] = useState<string[]>(() => {
    return initialData.interests.map((i) => i.name)
  })

  // Skill Search Query
  const [skillSearch, setSkillSearch] = useState("")

  // Steps Progress Mapping
  const stepsOrder: WizardStep[] = ["BASIC", "ACADEMICS", "ROLE", "SKILLS", "INTERESTS", "AVAILABILITY"]
  const currentStepIndex = stepsOrder.indexOf(currentStep)
  const progressPercentage = currentStep === "WELCOME" ? 0 : currentStep === "READY" ? 100 : Math.round(((currentStepIndex + 1) / stepsOrder.length) * 100)

  // Available Branches for chosen Program
  const availableBranches = useMemo(() => {
    return getBranchesForProgram(programName)
  }, [programName])

  // Skill Search Filter
  const filteredSkills = useMemo(() => {
    if (!skillSearch.trim()) return []
    const q = skillSearch.toLowerCase().trim()
    return availableSkills.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8)
  }, [availableSkills, skillSearch])

  const handleAddSkill = (skillName: string, level: SkillLevel = "INTERMEDIATE") => {
    if (selectedSkills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) return
    setSelectedSkills((prev) => [...prev, { skillIdOrName: skillName, name: skillName, level }])
    setSkillSearch("")
  }

  const handleRemoveSkill = (skillName: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase()))
  }

  const handleSkillLevelChange = (skillName: string, level: SkillLevel) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.name.toLowerCase() === skillName.toLowerCase() ? { ...s, level } : s))
    )
  }

  const handleToggleInterest = (interestName: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestName) ? prev.filter((i) => i !== interestName) : [...prev, interestName]
    )
  }

  const handleSaveAndComplete = () => {
    startTransition(async () => {
      try {
        const res = await saveOnboardingProfile({
          name,
          collegeName,
          collegeEmail,
          erp,
          programName,
          branchName,
          year,
          role,
          bio,
          availability,
          skills: selectedSkills.map((s) => ({
            skillIdOrName: s.skillIdOrName,
            level: s.level,
          })),
          interests: selectedInterests,
        })

        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success("Profile setup completed!")
          setCurrentStep("READY")
        }
      } catch {
        toast.error("Failed to save profile setup")
      }
    })
  }

  // WELCOME SCREEN
  if (currentStep === "WELCOME") {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <Card className="border-border/80 bg-card rounded-2xl p-6 sm:p-10 text-center space-y-6 shadow-sm">
          <div className="size-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Compass className="size-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <Badge variant="outline" className="text-xs font-semibold text-primary mb-1">
              Teammate Onboarding
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome to Team Discovery
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Find compatible teammates for hackathons, innovation challenges, and collegiate build competitions. Let&apos;s build your builder profile in 5 quick steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
              <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <Code2 className="size-3.5 text-primary" />
                <span>Deterministic Matching</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Matches you to squad roles based on verified technical skills.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
              <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <Trophy className="size-3.5 text-indigo-500" />
                <span>Live Hackathons</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Form squads and compete in events launched by administrators.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-1">
              <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span>Student Verification</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Earn verified builder status to unlock higher squad discovery priority.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => setCurrentStep("BASIC")}
              size="default"
              className="gap-2 font-semibold shadow-xs w-full sm:w-auto text-xs sm:text-sm"
            >
              <span>Build My Teammate Profile</span>
              <ArrowRight className="size-4" />
            </Button>
            <Button
              asChild
              variant="ghost"
              size="default"
              className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground"
            >
              <Link href="/dashboard">Skip to Dashboard</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // READY / COMPLETION SCREEN
  if (currentStep === "READY") {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <Card className="border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 via-card to-card rounded-2xl p-6 sm:p-10 text-center space-y-6 shadow-sm">
          <div className="size-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <Badge variant="success" className="text-xs font-semibold py-0.5 px-2">
              Profile Ready
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              You&apos;re All Set, {name.split(" ")[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your teammate profile is saved. You are now discoverable by squad leaders looking for your primary role and technical skills.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-left space-y-2 max-w-md mx-auto text-xs">
            <div className="font-bold text-foreground flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Check className="size-3.5 text-emerald-500" />
              <span>Profile Setup Checklist</span>
            </div>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-emerald-500" />
                <span>Primary Role: <strong>{role || "Declared"}</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-emerald-500" />
                <span>Technical Skills: <strong>{selectedSkills.length} declared</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-emerald-500" />
                <span>Domain Interests: <strong>{selectedInterests.length} selected</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3 text-emerald-500" />
                <span>Availability: <strong>{availability.replace(/_/g, " ")}</strong></span>
              </li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="default" className="gap-2 font-semibold shadow-xs w-full sm:w-auto text-xs sm:text-sm">
              <Link href="/discover">
                <Compass className="size-4" />
                <span>Find Teammates</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="w-full sm:w-auto text-xs">
              <Link href="/events">Explore Hackathons</Link>
            </Button>
            <Button asChild variant="ghost" size="default" className="w-full sm:w-auto text-xs">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Step Header & Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Onboarding</span>
          </div>

          <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
            Skip for now &rarr;
          </Link>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
            <span className="capitalize">
              Step {currentStepIndex + 1} of {stepsOrder.length}: {currentStep.toLowerCase()}
            </span>
            <span className="font-mono">{progressPercentage}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* STEP 1: BASIC INFORMATION */}
      {currentStep === "BASIC" && (
        <Card className="border-border/80 bg-card rounded-2xl shadow-xs">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <User className="size-5 text-primary" />
              <span>Step 1: Basic Information</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Introduce yourself to other collegiate builders and squad leaders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Full Name *</label>
              <Input
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">College / University *</label>
              <Input
                placeholder="e.g. Stanford University or MIT"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Institutional Email</label>
                <Input
                  type="email"
                  placeholder="student@college.edu"
                  value={collegeEmail}
                  onChange={(e) => setCollegeEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Student ERP / ID</label>
                <Input
                  placeholder="e.g. 21BCE1042"
                  value={erp}
                  onChange={(e) => setErp(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border/60 p-4">
            <Button variant="ghost" onClick={() => setCurrentStep("WELCOME")} size="sm" className="text-xs">
              Back
            </Button>
            <Button
              onClick={() => {
                if (!name.trim()) {
                  toast.error("Full name is required")
                  return
                }
                setCurrentStep("ACADEMICS")
              }}
              size="sm"
              className="text-xs font-semibold gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: ACADEMICS */}
      {currentStep === "ACADEMICS" && (
        <Card className="border-border/80 bg-card rounded-2xl shadow-xs">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              <span>Step 2: Academic Program &amp; Major</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Your degree and department help squads balance interdisciplinary skills.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Program / Degree</label>
              <Select value={programName} onValueChange={(val) => {
                setProgramName(val)
                setBranchName("")
              }}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Select degree program..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {AUTHORITATIVE_PROGRAMS.map((prog) => (
                    <SelectItem key={prog.code} value={prog.name} className="text-xs">
                      {prog.name} ({prog.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Branch / Specialization</label>
              {availableBranches.length > 0 ? (
                <Select value={branchName} onValueChange={setBranchName}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select major / department..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {availableBranches.map((branch: string) => (
                      <SelectItem key={branch} value={branch} className="text-xs">
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="e.g. Computer Science, Information Technology"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="text-xs"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Academic Year</label>
              <Select
                value={year ? String(year) : ""}
                onValueChange={(val) => setYear(val ? Number(val) : null)}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Select current year..." />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEAR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border/60 p-4">
            <Button variant="ghost" onClick={() => setCurrentStep("BASIC")} size="sm" className="text-xs">
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep("ROLE")}
              size="sm"
              className="text-xs font-semibold gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: PRIMARY ROLE */}
      {currentStep === "ROLE" && (
        <Card className="border-border/80 bg-card rounded-2xl shadow-xs">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Briefcase className="size-5 text-primary" />
              <span>Step 3: Primary Technical Role</span>
            </CardTitle>
            <CardDescription className="text-xs">
              What do you specialize in when building on a hackathon squad?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AUTHORITATIVE_ROLES.slice(0, 10).map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => setRole(r.name)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                    role === r.name
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "border-border/80 bg-card text-foreground hover:bg-muted/40"
                  }`}
                >
                  <span>{r.name}</span>
                  {role === r.name && <Check className="size-3.5 text-primary shrink-0" />}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-foreground">Or enter a custom role title:</label>
              <Input
                placeholder="e.g. Embedded Systems Engineer, Game Dev"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="text-xs"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border/60 p-4">
            <Button variant="ghost" onClick={() => setCurrentStep("ACADEMICS")} size="sm" className="text-xs">
              Back
            </Button>
            <Button
              onClick={() => {
                if (!role.trim()) {
                  toast.error("Please choose or enter a primary role")
                  return
                }
                setCurrentStep("SKILLS")
              }}
              size="sm"
              className="text-xs font-semibold gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 4: SKILLS */}
      {currentStep === "SKILLS" && (
        <Card className="border-border/80 bg-card rounded-2xl shadow-xs">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Code2 className="size-5 text-primary" />
              <span>Step 4: Technical Skills</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Select key programming languages, frameworks, and tools in your stack.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search or add skill (e.g. React, Python, Docker)..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                className="pl-8.5 text-xs rounded-xl"
              />
              {skillSearch && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-border/80 bg-card p-1 shadow-md space-y-0.5">
                  {filteredSkills.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleAddSkill(s.name)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-muted font-medium flex items-center justify-between"
                    >
                      <span>{s.name}</span>
                      <Plus className="size-3 text-muted-foreground" />
                    </button>
                  ))}
                  {filteredSkills.length === 0 && (
                    <button
                      type="button"
                      onClick={() => handleAddSkill(skillSearch.trim())}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-muted font-medium text-primary flex items-center justify-between"
                    >
                      <span>Add &ldquo;{skillSearch.trim()}&rdquo; as custom skill</span>
                      <Plus className="size-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Popular Skills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground block">Popular Suggestions:</span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SKILLS.map((sk) => {
                  const isSelected = selectedSkills.some((s) => s.name.toLowerCase() === sk.toLowerCase())
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => (isSelected ? handleRemoveSkill(sk) : handleAddSkill(sk))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                          : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {sk}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected Skills List with Proficiency Levels */}
            {selectedSkills.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <span className="text-[11px] font-semibold text-foreground block">
                  Your Declared Skills ({selectedSkills.length}):
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedSkills.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between p-2 rounded-xl border border-border/80 bg-muted/20 text-xs"
                    >
                      <span className="font-semibold text-foreground">{s.name}</span>

                      <div className="flex items-center gap-2">
                        <select
                          value={s.level}
                          onChange={(e) => handleSkillLevelChange(s.name, e.target.value as SkillLevel)}
                          className="h-7 rounded-lg border border-input bg-background px-2 text-[11px]"
                        >
                          <option value="BEGINNER">Beginner</option>
                          <option value="INTERMEDIATE">Intermediate</option>
                          <option value="ADVANCED">Advanced</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s.name)}
                          className="text-muted-foreground hover:text-destructive p-0.5"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border/60 p-4">
            <Button variant="ghost" onClick={() => setCurrentStep("ROLE")} size="sm" className="text-xs">
              Back
            </Button>
            <Button
              onClick={() => {
                if (selectedSkills.length === 0) {
                  toast.error("Please add at least 1 technical skill")
                  return
                }
                setCurrentStep("INTERESTS")
              }}
              size="sm"
              className="text-xs font-semibold gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 5: INTERESTS */}
      {currentStep === "INTERESTS" && (
        <Card className="border-border/80 bg-card rounded-2xl shadow-xs">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <span>Step 5: Hackathon &amp; Project Interests</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Select domain topics you are eager to build projects or hackathon solutions in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {POPULAR_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleToggleInterest(interest)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "border-border/80 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <span>{interest}</span>
                    {isSelected && <Check className="size-3 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border/60 p-4">
            <Button variant="ghost" onClick={() => setCurrentStep("SKILLS")} size="sm" className="text-xs">
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep("AVAILABILITY")}
              size="sm"
              className="text-xs font-semibold gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 6: AVAILABILITY & FINALIZE */}
      {currentStep === "AVAILABILITY" && (
        <Card className="border-border/80 bg-card rounded-2xl shadow-xs">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              <span>Step 6: Squad Availability</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Let teams know how actively you can contribute to upcoming competitions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAvailability(opt.value)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    availability === opt.value
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                      : "border-border/80 bg-card text-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs">{opt.label}</div>
                    <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                  </div>
                  {availability === opt.value && <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                </button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border/60 p-4">
            <Button variant="ghost" onClick={() => setCurrentStep("INTERESTS")} size="sm" className="text-xs">
              Back
            </Button>
            <Button
              onClick={handleSaveAndComplete}
              disabled={isPending}
              size="sm"
              className="text-xs font-semibold gap-1.5 shadow-xs"
            >
              <span>{isPending ? "Saving Profile..." : "Complete Setup & Launch"}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
