"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import Link from "next/link"
import {
  User as UserIcon,
  Sparkles,
  Layers,
  FolderGit2,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Code2,
  Globe,
  Eye,
  Loader2,
  Save,
  Clock,
  Briefcase,
  GraduationCap,
  Building,
  ArrowRight,
  ShieldCheck,
  Edit3,
} from "lucide-react"
import {
  updateBasicProfile,
  addUserSkillsBatch,
  removeUserSkill,
  addUserInterest,
  removeUserInterest,
  createProject,
  deleteProject,
  createAchievement,
  deleteAchievement,
} from "@/app/actions/profile"
import type { Availability, SkillLevel } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { SearchableSkillSelector } from "@/components/common/searchable-skill-selector"
import { RoleCombobox } from "@/components/common/role-combobox"
import { TechIcon } from "@/components/common/tech-icon"
import {
  AUTHORITATIVE_INTERESTS,
  ACADEMIC_YEAR_OPTIONS,
  AVAILABILITY_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  AUTHORITATIVE_PROGRAMS,
  getBranchesForProgram,
  parseProfileRole,
} from "@/lib/constants/options"

interface ProfileEditorClientProps {
  initialProfile: {
    id: string
    name: string
    username: string
    bio: string | null
    profilePhoto: string | null
    year: number | null
    availability: Availability
    verificationStatus: string
    collegeId: string | null
    departmentId: string | null
    college?: { id: string; name: string } | null
    department?: { id: string; name: string } | null
    skills: Array<{
      level: SkillLevel
      skill: { id: string; name: string }
    }>
    interests: Array<{
      skill: { id: string; name: string }
    }>
    projects: Array<{
      id: string
      title: string
      description: string
      role: string
      date: Date | string
      githubLink: string | null
      figmaLink: string | null
      demoLink: string | null
      isPrivate: boolean
      skills: Array<{ skill: { id: string; name: string } }>
    }>
    achievements: Array<{
      id: string
      title: string
      description: string
      date: Date | string
      link: string | null
    }>
    stats: {
      totalRatings: number
      avgRating: number
    }
  }
  availableSkills: Array<{ id: string; name: string }>
  colleges?: Array<{
    id: string
    name: string
    departments: Array<{ id: string; name: string }>
  }>
}

export function ProfileEditorClient({
  initialProfile,
  availableSkills,
}: ProfileEditorClientProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [isPending, startTransition] = useTransition()

  // Parse Role & Bio from Bio string
  const { role: initialRole, cleanBio: initialCleanBio } = parseProfileRole(profile.bio)
  const [role, setRole] = useState<string>(initialRole || "")
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(initialCleanBio)
  const [year, setYear] = useState<string>(profile.year ? String(profile.year) : "")
  const [availability, setAvailability] = useState<Availability>(profile.availability)
  const [collegeName, setCollegeName] = useState<string>(profile.college?.name || "")
  const [profilePhoto, setProfilePhoto] = useState(profile.profilePhoto || "")

  // Parse Program & Branch from Department name
  const initialDeptName = profile.department?.name || ""
  let initialProg = "B.Tech / B.E."
  let initialBranch = "Computer Science and Engineering (CSE)"

  if (initialDeptName.includes(" - ")) {
    const parts = initialDeptName.split(" - ")
    const pFound = AUTHORITATIVE_PROGRAMS.find((p) => p.name === parts[0].trim())
    if (pFound) {
      initialProg = pFound.name
      initialBranch = parts.slice(1).join(" - ").trim()
    }
  } else if (initialDeptName) {
    const pFound = AUTHORITATIVE_PROGRAMS.find((p) => p.name === initialDeptName)
    if (pFound) {
      initialProg = pFound.name
      initialBranch = pFound.branches[0] || "General"
    } else {
      for (const p of AUTHORITATIVE_PROGRAMS) {
        if (p.branches.some((b) => b.toLowerCase() === initialDeptName.toLowerCase())) {
          initialProg = p.name
          initialBranch = initialDeptName
          break
        }
      }
    }
  }

  const [program, setProgram] = useState<string>(initialProg)
  const [branch, setBranch] = useState<string>(initialBranch)

  // When Program changes, update available branch list
  const availableBranches = getBranchesForProgram(program)

  const handleProgramChange = (newProg: string) => {
    setProgram(newProg)
    const branches = getBranchesForProgram(newProg)
    setBranch(branches[0] || "General")
  }

  // Multi-Select Skill Modal States
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false)
  const [selectedSkillNames, setSelectedSkillNames] = useState<string[]>([])
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<SkillLevel>("INTERMEDIATE")

  // Interest Modal States
  const [isAddInterestOpen, setIsAddInterestOpen] = useState(false)
  const [selectedInterestSkillId, setSelectedInterestSkillId] = useState("")

  // Project Modal States
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [projectTitle, setProjectTitle] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [projectRole, setProjectRole] = useState("")
  const [projectDate, setProjectDate] = useState("")
  const [projectGithub, setProjectGithub] = useState("")
  const [projectFigma, setProjectFigma] = useState("")
  const [projectDemo, setProjectDemo] = useState("")
  const [projectIsPrivate, setProjectIsPrivate] = useState(false)
  const [projectSelectedSkillIds, setProjectSelectedSkillIds] = useState<string[]>([])

  // Achievement Modal States
  const [isAddAchievementOpen, setIsAddAchievementOpen] = useState(false)
  const [achievementTitle, setAchievementTitle] = useState("")
  const [achievementDescription, setAchievementDescription] = useState("")
  const [achievementDate, setAchievementDate] = useState("")
  const [achievementLink, setAchievementLink] = useState("")

  // Profile Completion Percentage
  const checks = [
    { label: "Basic Info (Name & Bio)", completed: Boolean(profile.name && bio) },
    { label: "Primary Role", completed: Boolean(role) },
    { label: "Academic Info (Program & Branch)", completed: Boolean(program && branch) },
    { label: "Skills (At least 1)", completed: profile.skills.length > 0 },
    { label: "Interests (At least 1)", completed: profile.interests.length > 0 },
    { label: "Projects (At least 1)", completed: profile.projects.length > 0 },
  ]
  const completedCount = checks.filter((c) => c.completed).length
  const completionPercentage = Math.round((completedCount / checks.length) * 100)

  // 1. Basic Info Submit
  const handleSaveBasicInfo = () => {
    startTransition(async () => {
      const res = await updateBasicProfile({
        name,
        bio,
        role,
        availability,
        year: year ? parseInt(year, 10) : null,
        collegeName: collegeName || null,
        programName: program || null,
        branchName: branch || null,
        profilePhoto: profilePhoto || null,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Profile information updated successfully!")
        setProfile((prev) => ({
          ...prev,
          name,
          bio: res.user?.bio || null,
          year: year ? parseInt(year, 10) : null,
          availability,
          department: { id: res.user?.departmentId || "dept", name: `${program} - ${branch}` },
          college: collegeName ? { id: res.user?.collegeId || "col", name: collegeName } : null,
        }))
      }
    })
  }

  // 2. Add Skills Multi-Select Submit
  const handleAddSkillsBatch = () => {
    if (selectedSkillNames.length === 0) {
      toast.error("Please select at least one skill to add")
      return
    }

    startTransition(async () => {
      const batch = selectedSkillNames.map((skillName) => ({
        skillIdOrName: skillName,
        level: selectedSkillLevel,
      }))

      const res = await addUserSkillsBatch(batch)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Added ${res.addedCount} skill${res.addedCount === 1 ? "" : "s"} to your profile!`)
        
        const newlyAdded = selectedSkillNames.map((sName) => {
          const match = availableSkills.find((a) => a.name.toLowerCase() === sName.toLowerCase())
          return {
            level: selectedSkillLevel,
            skill: { id: match ? match.id : `new-${sName}`, name: sName },
          }
        })

        const filteredExisting = profile.skills.filter(
          (s) => !selectedSkillNames.some((n) => n.toLowerCase() === s.skill.name.toLowerCase())
        )

        setProfile((prev) => ({
          ...prev,
          skills: [...filteredExisting, ...newlyAdded],
        }))
        setIsAddSkillOpen(false)
        setSelectedSkillNames([])
      }
    })
  }

  // 3. Remove Skill Submit
  const handleRemoveSkill = (skillId: string) => {
    startTransition(async () => {
      const res = await removeUserSkill(skillId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Skill removed")
        setProfile((prev) => ({
          ...prev,
          skills: prev.skills.filter((s) => s.skill.id !== skillId),
        }))
      }
    })
  }

  // 4. Add Interest Submit
  const handleAddInterest = () => {
    if (!selectedInterestSkillId) {
      toast.error("Please select or type an interest")
      return
    }

    startTransition(async () => {
      const res = await addUserInterest(selectedInterestSkillId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Domain interest added!")
        const interestName = availableSkills.find((s) => s.id === selectedInterestSkillId)?.name || selectedInterestSkillId
        const newId = res.skillId || selectedInterestSkillId
        setProfile((prev) => ({
          ...prev,
          interests: [
            ...prev.interests.filter((i) => i.skill.name.toLowerCase() !== interestName.toLowerCase()),
            { skill: { id: newId, name: interestName } },
          ],
        }))
        setIsAddInterestOpen(false)
        setSelectedInterestSkillId("")
      }
    })
  }

  // 5. Remove Interest Submit
  const handleRemoveInterest = (skillId: string) => {
    startTransition(async () => {
      const res = await removeUserInterest(skillId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Interest removed")
        setProfile((prev) => ({
          ...prev,
          interests: prev.interests.filter((i) => i.skill.id !== skillId),
        }))
      }
    })
  }

  // 6. Create Project Submit
  const handleCreateProject = () => {
    if (!projectTitle.trim() || !projectDescription.trim() || !projectRole.trim() || !projectDate) {
      toast.error("Title, role, description, and completion date are required")
      return
    }

    startTransition(async () => {
      const res = await createProject({
        title: projectTitle,
        description: projectDescription,
        role: projectRole,
        date: projectDate,
        githubLink: projectGithub || undefined,
        figmaLink: projectFigma || undefined,
        demoLink: projectDemo || undefined,
        isPrivate: projectIsPrivate,
        skillIds: projectSelectedSkillIds,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Project added to portfolio!")
        setIsAddProjectOpen(false)
        setProjectTitle("")
        setProjectDescription("")
        setProjectRole("")
        setProjectDate("")
        setProjectGithub("")
        setProjectFigma("")
        setProjectDemo("")
        setProjectIsPrivate(false)
        setProjectSelectedSkillIds([])
        if (res.project) {
          setProfile((prev) => ({
            ...prev,
            projects: [res.project as any, ...prev.projects],
          }))
        }
      }
    })
  }

  // 7. Delete Project Submit
  const handleDeleteProject = (projectId: string) => {
    startTransition(async () => {
      const res = await deleteProject(projectId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Project removed")
        setProfile((prev) => ({
          ...prev,
          projects: prev.projects.filter((p) => p.id !== projectId),
        }))
      }
    })
  }

  // 8. Create Achievement Submit
  const handleCreateAchievement = () => {
    if (!achievementTitle.trim() || !achievementDescription.trim() || !achievementDate) {
      toast.error("Title, description, and date are required")
      return
    }

    startTransition(async () => {
      const res = await createAchievement({
        title: achievementTitle,
        description: achievementDescription,
        date: achievementDate,
        link: achievementLink || undefined,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Achievement recorded!")
        setIsAddAchievementOpen(false)
        setAchievementTitle("")
        setAchievementDescription("")
        setAchievementDate("")
        setAchievementLink("")
        if (res.achievement) {
          setProfile((prev) => ({
            ...prev,
            achievements: [res.achievement as any, ...prev.achievements],
          }))
        }
      }
    })
  }

  // 9. Delete Achievement Submit
  const handleDeleteAchievement = (achievementId: string) => {
    startTransition(async () => {
      const res = await deleteAchievement(achievementId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Achievement removed")
        setProfile((prev) => ({
          ...prev,
          achievements: prev.achievements.filter((a) => a.id !== achievementId),
        }))
      }
    })
  }

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Top Header & Public View Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Edit Profile
            </h1>
            <Badge variant="outline" className="gap-1 text-[11px] font-semibold text-primary border-primary/30 bg-primary/10">
              <Edit3 className="size-3" />
              <span>Profile Settings</span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your candidate presence, technical skills, academic degree, and project portfolio.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="gap-1.5 shadow-2xs font-semibold">
            <Link href={`/users/${profile.id}`}>
              <Eye className="size-4 text-primary" />
              <span>View Public Profile</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero Overview Card */}
      <Card className="border-border/80 bg-card shadow-sm rounded-2xl overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary/20 via-emerald-500/10 to-blue-500/20" />
        <CardContent className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <Avatar className="size-24 rounded-2xl border-4 border-background shadow-md">
                <AvatarImage src={profilePhoto || profile.profilePhoto || undefined} alt={profile.name} />
                <AvatarFallback className="rounded-2xl text-2xl font-bold bg-muted">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {name || profile.name}
                  </h2>
                  {role && (
                    <Badge variant="default" className="text-xs font-semibold bg-primary text-primary-foreground gap-1">
                      <Briefcase className="size-3" />
                      <span>{role}</span>
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium">@{profile.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant={profile.verificationStatus === "APPROVED" ? "outline" : "default"} className="h-8 gap-1.5 text-xs shadow-xs font-semibold">
                <Link href="/verify/student">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  <span>
                    {profile.verificationStatus === "APPROVED"
                      ? "Verified Student"
                      : profile.verificationStatus === "PENDING"
                      ? "Verification Pending"
                      : "Get Verified"}
                  </span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="mt-6 pt-4 border-t border-border/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>Profile Strength</span>
              </span>
              <span className="font-mono font-bold text-primary">{completionPercentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1">
              {checks.map((check) => (
                <span key={check.label} className="inline-flex items-center gap-1">
                  {check.completed ? (
                    <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="size-3 text-muted-foreground shrink-0" />
                  )}
                  <span className={check.completed ? "text-foreground font-medium" : ""}>
                    {check.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabbed Editor */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="basic" className="text-xs font-semibold gap-1.5 rounded-lg">
            <UserIcon className="size-3.5" />
            <span>Basic Info</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="text-xs font-semibold gap-1.5 rounded-lg">
            <Layers className="size-3.5" />
            <span>Skills ({profile.skills.length})</span>
          </TabsTrigger>
          <TabsTrigger value="interests" className="text-xs font-semibold gap-1.5 rounded-lg">
            <Sparkles className="size-3.5" />
            <span>Interests ({profile.interests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-xs font-semibold gap-1.5 rounded-lg">
            <FolderGit2 className="size-3.5" />
            <span>Portfolio ({profile.projects.length})</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs font-semibold gap-1.5 rounded-lg">
            <Trophy className="size-3.5" />
            <span>Awards ({profile.achievements.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: BASIC INFORMATION */}
        <TabsContent value="basic" className="space-y-6">
          <Card className="border-border/80 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Candidate Profile Information</CardTitle>
              <CardDescription className="text-xs">
                Update your primary role, academic program, branch, and introduction for hackathon teams.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Row 1: Name & Avatar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    disabled={isPending}
                    className="h-10 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="photo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Avatar Image URL
                  </label>
                  <Input
                    id="photo"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    disabled={isPending}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Row 2: Primary Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="size-3.5 text-primary" />
                  <span>Primary Role / Specialization *</span>
                </label>
                <RoleCombobox
                  value={role}
                  onChange={(val) => setRole(val)}
                  disabled={isPending}
                  placeholder="Select or type your primary role (e.g. Frontend Developer, AI / ML Engineer, UI/UX Designer)..."
                />
                <p className="text-[11px] text-muted-foreground">
                  Select your primary discipline. This helps team leaders identify your core competency during matching.
                </p>
              </div>

              {/* Row 3: Bio */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bio / Introduction
                  </label>
                  <span className="text-[10px] text-muted-foreground">{bio.length}/300 characters</span>
                </div>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                  placeholder="Full-stack developer passionate about building AI-powered developer tools and hackathon projects..."
                  className="min-h-[85px] resize-none rounded-xl"
                  disabled={isPending}
                />
              </div>

              {/* Row 4: Availability & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-emerald-500" />
                    <span>Availability Status</span>
                  </label>
                  <Select
                    value={availability}
                    onValueChange={(val) => setAvailability(val as Availability)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full h-10 rounded-xl">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 text-primary" />
                    <span>Academic Year</span>
                  </label>
                  <Select
                    value={year}
                    onValueChange={(val) => setYear(val)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full h-10 rounded-xl">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACADEMIC_YEAR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 5: Separate College, Program & Branch */}
              <div className="space-y-4 pt-2 border-t border-border/60">
                <div className="flex items-center gap-2">
                  <Building className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Academic Institution &amp; Degree</h3>
                </div>

                {/* College / Institution Field */}
                <div className="space-y-1.5">
                  <label htmlFor="college" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    College / University Name
                  </label>
                  <Input
                    id="college"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Stanford University, MIT, Georgia Tech..."
                    disabled={isPending}
                    className="h-10 rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Enter the name of your college or university.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field A: Program / Degree */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Program / Degree *
                    </label>
                    <Select
                      value={program}
                      onValueChange={handleProgramChange}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full h-10 rounded-xl">
                        <SelectValue placeholder="Select degree program..." />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTHORITATIVE_PROGRAMS.map((prog) => (
                          <SelectItem key={prog.code} value={prog.name}>
                            {prog.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Field B: Branch / Specialization (Conditionally Updated) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Branch / Specialization *
                    </label>
                    <Select
                      value={branch}
                      onValueChange={(val) => setBranch(val)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full h-10 rounded-xl">
                        <SelectValue placeholder="Select specialization..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBranches.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end pt-2 pb-6 border-t border-border/60 bg-muted/10 rounded-b-2xl">
              <Button
                onClick={handleSaveBasicInfo}
                disabled={isPending}
                className="gap-2 font-semibold shadow-xs h-10 px-6 rounded-xl"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>Save Profile</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* TAB 2: TECHNICAL SKILLS (MULTI-SELECT REDESIGN) */}
        <TabsContent value="skills" className="space-y-6">
          <Card className="border-border/80 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Technical Skills &amp; Stack</CardTitle>
                <CardDescription className="text-xs">
                  Add multiple languages, frameworks, databases, and tools to highlight your competencies.
                </CardDescription>
              </div>
              <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 font-semibold shadow-xs rounded-xl">
                    <Plus className="size-4" />
                    <span>Add Technical Skills</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="size-5 text-primary" />
                      <span>Select Technical Skills</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Select one or multiple skills from our authoritative catalog. Click skills to toggle them on or off.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    {/* Proficiency Level Picker for Selected Batch */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Proficiency Level for Selected Skills
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {SKILL_LEVEL_OPTIONS.map((lvl) => (
                          <button
                            key={lvl.value}
                            type="button"
                            onClick={() => setSelectedSkillLevel(lvl.value)}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              selectedSkillLevel === lvl.value
                                ? "border-primary bg-primary/10 font-bold ring-1 ring-primary shadow-xs"
                                : "border-border/70 hover:bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            <div className="text-xs text-foreground font-semibold">{lvl.label}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{lvl.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Redesigned Multi-Select Searchable Skill Selector */}
                    <SearchableSkillSelector
                      isMultiSelect
                      selectedSkills={selectedSkillNames}
                      onSelectedSkillsChange={setSelectedSkillNames}
                      excludeSkills={profile.skills.map((s) => s.skill.name)}
                      availableSkills={availableSkills}
                      placeholder="Search 80+ skills (e.g. React, Next.js, Python, PostgreSQL, Docker)..."
                    />
                  </div>

                  <DialogFooter className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsAddSkillOpen(false)
                        setSelectedSkillNames([])
                      }}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddSkillsBatch}
                      disabled={isPending || selectedSkillNames.length === 0}
                      className="gap-2 font-semibold shadow-xs"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Adding Skills...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="size-4" />
                          <span>Add {selectedSkillNames.length} Selected Skill{selectedSkillNames.length === 1 ? "" : "s"}</span>
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {profile.skills.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border/70 rounded-2xl space-y-3 bg-muted/20">
                  <Layers className="size-10 text-muted-foreground mx-auto opacity-50" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">No technical skills added yet</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Add your skills to allow team leaders to discover you via deterministic skill-matching.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsAddSkillOpen(true)}
                    className="gap-1.5 font-semibold"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Technical Skills</span>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {profile.skills.map(({ skill, level }) => {
                    const levelMeta = SKILL_LEVEL_OPTIONS.find((l) => l.value === level)
                    return (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-2xs transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="size-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 shadow-2xs">
                            <TechIcon name={skill.name} className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground truncate block">
                              {skill.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase tracking-wider font-semibold py-0 px-1.5 mt-0.5 ${levelMeta?.color || ""}`}
                            >
                              {level}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSkill(skill.id)}
                          disabled={isPending}
                          className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                          aria-label={`Remove ${skill.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: DOMAIN INTERESTS */}
        <TabsContent value="interests" className="space-y-6">
          <Card className="border-border/80 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Domain Interests</CardTitle>
                <CardDescription className="text-xs">
                  Highlight hackathon categories and industries you are passionate about exploring.
                </CardDescription>
              </div>
              <Dialog open={isAddInterestOpen} onOpenChange={setIsAddInterestOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 font-semibold shadow-xs rounded-xl">
                    <Plus className="size-4" />
                    <span>Add Interest</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Add Domain Interest</DialogTitle>
                    <DialogDescription className="text-xs">
                      Choose from our standard list of hackathon domains or type a custom domain.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Select Standard Interest
                      </label>
                      <Select
                        value={selectedInterestSkillId}
                        onValueChange={setSelectedInterestSkillId}
                      >
                        <SelectTrigger className="w-full h-10 rounded-xl">
                          <SelectValue placeholder="Choose a domain..." />
                        </SelectTrigger>
                        <SelectContent>
                          {AUTHORITATIVE_INTERESTS.map((interest) => (
                            <SelectItem key={interest} value={interest}>
                              {interest}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="pt-2 border-t border-border/60">
                    <Button
                      type="button"
                      onClick={handleAddInterest}
                      disabled={isPending || !selectedInterestSkillId}
                      className="w-full font-semibold shadow-xs"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-2" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <span>Add Interest</span>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {profile.interests.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border/70 rounded-2xl space-y-3 bg-muted/20">
                  <Sparkles className="size-10 text-purple-500 mx-auto opacity-50" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">No domain interests added yet</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Add domains like AI, Web3, FinTech, or HealthTech to discover relevant hackathon teams.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsAddInterestOpen(true)}
                    className="gap-1.5 font-semibold"
                  >
                    <Plus className="size-3.5" />
                    <span>Add First Interest</span>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map(({ skill }) => (
                    <Badge
                      key={skill.id}
                      variant="outline"
                      className="gap-2 pl-3 pr-1.5 py-1.5 text-xs font-medium bg-muted/40 border-border/80 rounded-xl"
                    >
                      <span>{skill.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(skill.id)}
                        disabled={isPending}
                        className="rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                        aria-label={`Remove ${skill.name}`}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: PORTFOLIO & PROJECTS */}
        <TabsContent value="projects" className="space-y-6">
          <Card className="border-border/80 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Project Portfolio</CardTitle>
                <CardDescription className="text-xs">
                  Showcase projects you have built to boost your matching experience rank.
                </CardDescription>
              </div>
              <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 font-semibold shadow-xs rounded-xl">
                    <Plus className="size-4" />
                    <span>Add Project</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Add Portfolio Project</DialogTitle>
                    <DialogDescription className="text-xs">
                      Enter details of a completed or ongoing hackathon project.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Project Title *
                      </label>
                      <Input
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="AI Code Assistant"
                        className="h-10 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Your Role in Project *
                      </label>
                      <Input
                        value={projectRole}
                        onChange={(e) => setProjectRole(e.target.value)}
                        placeholder="Lead Frontend Engineer"
                        className="h-10 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Completion Date *
                      </label>
                      <Input
                        type="date"
                        value={projectDate}
                        onChange={(e) => setProjectDate(e.target.value)}
                        className="h-10 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Project Description *
                      </label>
                      <Textarea
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="Describe the problem solved, tech stack used, and key features..."
                        className="min-h-[80px] rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          GitHub Repo URL
                        </label>
                        <Input
                          value={projectGithub}
                          onChange={(e) => setProjectGithub(e.target.value)}
                          placeholder="https://github.com/..."
                          className="h-9 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Live Demo URL
                        </label>
                        <Input
                          value={projectDemo}
                          onChange={(e) => setProjectDemo(e.target.value)}
                          placeholder="https://demo.app"
                          className="h-9 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="pt-2 border-t border-border/60">
                    <Button
                      type="button"
                      onClick={handleCreateProject}
                      disabled={isPending}
                      className="w-full font-semibold shadow-xs"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-2" />
                          <span>Saving Project...</span>
                        </>
                      ) : (
                        <span>Save Project</span>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {profile.projects.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border/70 rounded-2xl space-y-3 bg-muted/20">
                  <FolderGit2 className="size-10 text-muted-foreground mx-auto opacity-50" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">No projects added yet</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Add projects to showcase your practical experience to potential team leaders.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsAddProjectOpen(true)}
                    className="gap-1.5 font-semibold"
                  >
                    <Plus className="size-3.5" />
                    <span>Add First Project</span>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-4 rounded-xl border border-border/80 bg-card space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-foreground leading-tight">{proj.title}</h4>
                          <span className="text-xs text-primary font-medium">{proj.role}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProject(proj.id)}
                          disabled={isPending}
                          className="size-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-xs">
                        {proj.githubLink && (
                          <a
                            href={proj.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                          >
                            <Code2 className="size-3.5" />
                            <span>Code</span>
                          </a>
                        )}
                        {proj.demoLink && (
                          <a
                            href={proj.demoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            <Globe className="size-3.5" />
                            <span>Live Demo</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: AWARDS & ACHIEVEMENTS */}
        <TabsContent value="achievements" className="space-y-6">
          <Card className="border-border/80 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Awards &amp; Hackathon Honors</CardTitle>
                <CardDescription className="text-xs">
                  Highlight podium finishes, certifications, and collegiate awards.
                </CardDescription>
              </div>
              <Dialog open={isAddAchievementOpen} onOpenChange={setIsAddAchievementOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 font-semibold shadow-xs rounded-xl">
                    <Plus className="size-4" />
                    <span>Add Award</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Record Achievement</DialogTitle>
                    <DialogDescription className="text-xs">
                      Enter details of an award or hackathon win.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Achievement Title *
                      </label>
                      <Input
                        value={achievementTitle}
                        onChange={(e) => setAchievementTitle(e.target.value)}
                        placeholder="1st Place - Smart India Hackathon"
                        className="h-10 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Date Awarded *
                      </label>
                      <Input
                        type="date"
                        value={achievementDate}
                        onChange={(e) => setAchievementDate(e.target.value)}
                        className="h-10 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Description *
                      </label>
                      <Textarea
                        value={achievementDescription}
                        onChange={(e) => setAchievementDescription(e.target.value)}
                        placeholder="Built a real-time IoT monitoring system evaluated by judges..."
                        className="min-h-[80px] rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Certificate / Proof Link
                      </label>
                      <Input
                        value={achievementLink}
                        onChange={(e) => setAchievementLink(e.target.value)}
                        placeholder="https://credential.net/..."
                        className="h-10 rounded-xl"
                      />
                    </div>
                  </div>

                  <DialogFooter className="pt-2 border-t border-border/60">
                    <Button
                      type="button"
                      onClick={handleCreateAchievement}
                      disabled={isPending}
                      className="w-full font-semibold shadow-xs"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-2" />
                          <span>Saving Award...</span>
                        </>
                      ) : (
                        <span>Save Achievement</span>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {profile.achievements.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border/70 rounded-2xl space-y-3 bg-muted/20">
                  <Trophy className="size-10 text-muted-foreground mx-auto opacity-50" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">No awards added yet</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Add your competitive wins and certifications to stand out to team organizers.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsAddAchievementOpen(true)}
                    className="gap-1.5 font-semibold"
                  >
                    <Plus className="size-3.5" />
                    <span>Add First Award</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className="flex items-start justify-between p-4 rounded-xl border border-border/80 bg-card space-y-1 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Trophy className="size-4 text-amber-500 shrink-0" />
                          <h4 className="font-bold text-sm text-foreground">{ach.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                          {ach.description}
                        </p>
                        {ach.link && (
                          <div className="pl-6 pt-1">
                            <a
                              href={ach.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              <ExternalLink className="size-3" />
                              <span>View Certificate</span>
                            </a>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAchievement(ach.id)}
                        disabled={isPending}
                        className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
