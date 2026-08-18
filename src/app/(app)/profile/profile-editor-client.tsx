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
  PenTool,
  Globe,
  Lock,
  Eye,
  Loader2,
  Save,
  Clock,
} from "lucide-react"
import {
  updateBasicProfile,
  addUserSkill,
  removeUserSkill,
  addUserInterest,
  removeUserInterest,
  createProject,
  deleteProject,
  createAchievement,
  deleteAchievement,
} from "@/app/actions/profile"
import { Availability, SkillLevel } from "@prisma/client"
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
      date: Date
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
      date: Date
      link: string | null
    }>
    stats: {
      totalRatings: number
      avgRating: number
    }
  }
  availableSkills: Array<{ id: string; name: string }>
  colleges: Array<{
    id: string
    name: string
    departments: Array<{ id: string; name: string }>
  }>
}

export function ProfileEditorClient({
  initialProfile,
  availableSkills,
  colleges,
}: ProfileEditorClientProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [isPending, startTransition] = useTransition()

  // Basic Form State
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio || "")
  const [year, setYear] = useState<string>(profile.year ? String(profile.year) : "")
  const [availability, setAvailability] = useState<Availability>(profile.availability)
  const [collegeId, setCollegeId] = useState<string>(profile.collegeId || "")
  const [departmentId, setDepartmentId] = useState<string>(profile.departmentId || "")
  const [profilePhoto, setProfilePhoto] = useState(profile.profilePhoto || "")

  // Modal Dialog States
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false)
  const [selectedSkillId, setSelectedSkillId] = useState("")
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<SkillLevel>(SkillLevel.INTERMEDIATE)

  const [isAddInterestOpen, setIsAddInterestOpen] = useState(false)
  const [selectedInterestSkillId, setSelectedInterestSkillId] = useState("")

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

  const [isAddAchievementOpen, setIsAddAchievementOpen] = useState(false)
  const [achievementTitle, setAchievementTitle] = useState("")
  const [achievementDescription, setAchievementDescription] = useState("")
  const [achievementDate, setAchievementDate] = useState("")
  const [achievementLink, setAchievementLink] = useState("")

  // Available departments based on selected college
  const selectedCollege = colleges.find((c) => c.id === collegeId)
  const departments = selectedCollege ? selectedCollege.departments : []

  // Profile Completion Percentage
  const checks = [
    { label: "Basic Info (Name & Bio)", completed: Boolean(profile.name && profile.bio) },
    { label: "Academic Info (Year & Department)", completed: Boolean(profile.year && profile.departmentId) },
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
        availability,
        year: year ? parseInt(year, 10) : null,
        collegeId: collegeId || null,
        departmentId: departmentId || null,
        profilePhoto: profilePhoto || null,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Profile basic information updated successfully!")
      }
    })
  }

  // 2. Add Skill Submit
  const handleAddSkill = () => {
    if (!selectedSkillId) {
      toast.error("Please select a skill to add")
      return
    }

    startTransition(async () => {
      const res = await addUserSkill(selectedSkillId, selectedSkillLevel)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Skill added to profile!")
        const skillObj = availableSkills.find((s) => s.id === selectedSkillId)
        if (skillObj) {
          setProfile((prev) => ({
            ...prev,
            skills: [
              ...prev.skills.filter((s) => s.skill.id !== selectedSkillId),
              { level: selectedSkillLevel, skill: skillObj },
            ],
          }))
        }
        setIsAddSkillOpen(false)
        setSelectedSkillId("")
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
      toast.error("Please select an interest")
      return
    }

    startTransition(async () => {
      const res = await addUserInterest(selectedInterestSkillId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Interest added!")
        const skillObj = availableSkills.find((s) => s.id === selectedInterestSkillId)
        if (skillObj) {
          setProfile((prev) => ({
            ...prev,
            interests: [
              ...prev.interests.filter((i) => i.skill.id !== selectedInterestSkillId),
              { skill: skillObj },
            ],
          }))
        }
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
    if (!projectTitle || !projectDescription || !projectRole) {
      toast.error("Title, description, and role are required")
      return
    }

    startTransition(async () => {
      const res = await createProject({
        title: projectTitle,
        description: projectDescription,
        role: projectRole,
        date: projectDate || new Date().toISOString(),
        githubLink: projectGithub || null,
        figmaLink: projectFigma || null,
        demoLink: projectDemo || null,
        isPrivate: projectIsPrivate,
        skillIds: projectSelectedSkillIds,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Project added to portfolio!")
        if (res.project) {
          const newProj = {
            ...res.project,
            skills: projectSelectedSkillIds.map((sid) => ({
              skill: availableSkills.find((s) => s.id === sid) || { id: sid, name: "Skill" },
            })),
          }
          setProfile((prev) => ({
            ...prev,
            projects: [newProj, ...prev.projects],
          }))
        }
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
        toast.success("Project deleted")
        setProfile((prev) => ({
          ...prev,
          projects: prev.projects.filter((p) => p.id !== projectId),
        }))
      }
    })
  }

  // 8. Create Achievement Submit
  const handleCreateAchievement = () => {
    if (!achievementTitle || !achievementDescription) {
      toast.error("Title and description are required")
      return
    }

    startTransition(async () => {
      const res = await createAchievement({
        title: achievementTitle,
        description: achievementDescription,
        date: achievementDate || new Date().toISOString(),
        link: achievementLink || null,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Achievement added!")
        if (res.achievement) {
          setProfile((prev) => ({
            ...prev,
            achievements: [res.achievement!, ...prev.achievements],
          }))
        }
        setIsAddAchievementOpen(false)
        setAchievementTitle("")
        setAchievementDescription("")
        setAchievementDate("")
        setAchievementLink("")
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
        toast.success("Achievement deleted")
        setProfile((prev) => ({
          ...prev,
          achievements: prev.achievements.filter((a) => a.id !== achievementId),
        }))
      }
    })
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Profile Header Card */}
      <Card className="border-border/80 bg-card shadow-sm rounded-2xl overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary/20 via-emerald-500/10 to-blue-500/20" />
        <CardContent className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <Avatar className="size-24 rounded-2xl border-4 border-background shadow-md">
                <AvatarImage src={profilePhoto || undefined} alt={profile.name} />
                <AvatarFallback className="rounded-2xl text-xl font-bold bg-muted">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{profile.name}</h1>
                  <Badge
                    variant={profile.verificationStatus === "APPROVED" ? "success" : "outline"}
                    className="text-[10px] uppercase font-semibold"
                  >
                    {profile.verificationStatus === "APPROVED" ? "Verified Student" : "Pending Verification"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium">@{profile.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto gap-1.5 text-xs">
                <Link href={`/users/${profile.id}`}>
                  <Eye className="size-3.5" />
                  <span>View Public Profile</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Stats & Badges */}
          <div className="mt-6 pt-4 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block">Availability</span>
              <span className="font-semibold text-foreground mt-0.5 inline-flex items-center gap-1">
                <Clock className="size-3.5 text-emerald-500" />
                {availability.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Academic Year</span>
              <span className="font-semibold text-foreground mt-0.5 block">
                {profile.year ? `Year ${profile.year}` : "Not set"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Verified Skills</span>
              <span className="font-semibold text-foreground mt-0.5 block">
                {profile.skills.length} added
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Projects</span>
              <span className="font-semibold text-foreground mt-0.5 block">
                {profile.projects.length} in portfolio
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion Bar */}
      <Card className="border-border/80 bg-muted/20 shadow-xs rounded-xl">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" />
              <span>Profile Completion</span>
            </span>
            <span className="font-bold text-foreground">{completionPercentage}%</span>
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
        </CardContent>
      </Card>

      {/* Main Tabbed Editor */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-lg bg-muted/60 p-1">
          <TabsTrigger value="basic" className="text-xs font-semibold gap-1.5">
            <UserIcon className="size-3.5" />
            <span>Basic Info</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="text-xs font-semibold gap-1.5">
            <Layers className="size-3.5" />
            <span>Skills</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-xs font-semibold gap-1.5">
            <FolderGit2 className="size-3.5" />
            <span>Portfolio</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs font-semibold gap-1.5">
            <Trophy className="size-3.5" />
            <span>Awards</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: BASIC INFORMATION */}
        <TabsContent value="basic" className="space-y-6">
          <Card className="border-border/80 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription className="text-xs">
                Update your public candidate name, bio, and hackathon availability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
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
                  />
                </div>

                {/* Profile Photo URL */}
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
                  />
                </div>
              </div>

              {/* Bio */}
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
                  placeholder="Full-stack developer passionate about building AI-powered developer tools..."
                  className="min-h-[90px] resize-none"
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Availability */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Availability Status
                  </label>
                  <Select
                    value={availability}
                    onValueChange={(val) => setAvailability(val as Availability)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Availability.AVAILABLE}>Available</SelectItem>
                      <SelectItem value={Availability.LOOKING_FOR_TEAM}>Looking For Team</SelectItem>
                      <SelectItem value={Availability.BUSY}>Busy</SelectItem>
                      <SelectItem value={Availability.TEAM_FULL}>Team Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Academic Year */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Academic Year
                  </label>
                  <Select
                    value={year}
                    onValueChange={(val) => setYear(val)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1 (Freshman)</SelectItem>
                      <SelectItem value="2">Year 2 (Sophomore)</SelectItem>
                      <SelectItem value="3">Year 3 (Junior)</SelectItem>
                      <SelectItem value="4">Year 4 (Senior)</SelectItem>
                      <SelectItem value="5">Year 5 / Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* College Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Institution / College
                  </label>
                  <Select
                    value={collegeId}
                    onValueChange={(val) => {
                      setCollegeId(val)
                      setDepartmentId("")
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select college" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Department Selector */}
              {departments.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Department / Major
                  </label>
                  <Select
                    value={departmentId}
                    onValueChange={(val) => setDepartmentId(val)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end pt-2 border-t border-border/60">
              <Button
                onClick={handleSaveBasicInfo}
                disabled={isPending}
                className="gap-2 font-semibold shadow-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* TAB 2: SKILLS & INTERESTS */}
        <TabsContent value="skills" className="space-y-6">
          {/* Verified Skills */}
          <Card className="border-border/80 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Technical &amp; Design Skills</CardTitle>
                <CardDescription className="text-xs">
                  Declare your skill competencies and experience level for deterministic match ranking.
                </CardDescription>
              </div>

              {/* Add Skill Dialog */}
              <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-xs shadow-xs">
                    <Plus className="size-3.5" />
                    <span>Add Skill</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Technical Skill</DialogTitle>
                    <DialogDescription className="text-xs">
                      Select a standardized skill and declare your proficiency level.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Select Skill
                      </label>
                      <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose skill..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSkills
                            .filter((s) => !profile.skills.some((us) => us.skill.id === s.id))
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Proficiency Level
                      </label>
                      <Select
                        value={selectedSkillLevel}
                        onValueChange={(val) => setSelectedSkillLevel(val as SkillLevel)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SkillLevel.BEGINNER}>Beginner (Familiar / Coursework)</SelectItem>
                          <SelectItem value={SkillLevel.INTERMEDIATE}>Intermediate (Built 1-2 projects)</SelectItem>
                          <SelectItem value={SkillLevel.ADVANCED}>Advanced (Production / Hackathon Winner)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddSkillOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSkill} disabled={isPending || !selectedSkillId}>
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : "Add Skill"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {profile.skills.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-xl space-y-2">
                  <Layers className="size-8 mx-auto text-muted-foreground/60" />
                  <p className="text-sm font-semibold text-foreground">No Skills Added Yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Add your technical skills to appear in Exact Match recommendations for team roles.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {profile.skills.map(({ skill, level }) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20 hover:border-border transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-sm text-foreground">{skill.name}</div>
                        <Badge
                          variant={
                            level === "ADVANCED"
                              ? "exact"
                              : level === "INTERMEDIATE"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          {level}
                        </Badge>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSkill(skill.id)}
                        disabled={isPending}
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${skill.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interests Section */}
          <Card className="border-border/80 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Domain Interests</CardTitle>
                <CardDescription className="text-xs">
                  Declare domains or stacks you want to learn (qualifies for Interest-Only matching).
                </CardDescription>
              </div>

              {/* Add Interest Dialog */}
              <Dialog open={isAddInterestOpen} onOpenChange={setIsAddInterestOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs shadow-xs">
                    <Plus className="size-3.5" />
                    <span>Add Interest</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Domain Interest</DialogTitle>
                    <DialogDescription className="text-xs">
                      Select a field or technology you are interested in exploring.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Select Interest
                      </label>
                      <Select
                        value={selectedInterestSkillId}
                        onValueChange={setSelectedInterestSkillId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose technology or topic..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSkills
                            .filter((s) => !profile.interests.some((ui) => ui.skill.id === s.id))
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddInterestOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddInterest}
                      disabled={isPending || !selectedInterestSkillId}
                    >
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : "Add Interest"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {profile.interests.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-xl space-y-1">
                  <p className="text-xs text-muted-foreground">No declared interests yet.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map(({ skill }) => (
                    <Badge
                      key={skill.id}
                      variant="interest"
                      className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs"
                    >
                      <span>{skill.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(skill.id)}
                        className="hover:text-destructive transition-colors ml-1"
                        aria-label={`Remove ${skill.name} interest`}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PROJECTS / PORTFOLIO */}
        <TabsContent value="projects" className="space-y-6">
          <Card className="border-border/80 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Project Portfolio</CardTitle>
                <CardDescription className="text-xs">
                  Showcase verifiable projects, GitHub repositories, and role contributions.
                </CardDescription>
              </div>

              {/* Add Project Dialog */}
              <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-xs shadow-xs">
                    <Plus className="size-3.5" />
                    <span>Add Project</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Project to Portfolio</DialogTitle>
                    <DialogDescription className="text-xs">
                      Provide project metadata and links to demonstrate hands-on experience.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3.5 py-2 max-h-[60vh] overflow-y-auto pr-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Project Title *
                      </label>
                      <Input
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="Autonomous Navigation Drone"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Your Role *
                        </label>
                        <Input
                          value={projectRole}
                          onChange={(e) => setProjectRole(e.target.value)}
                          placeholder="Lead Frontend Engineer"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Date / Year
                        </label>
                        <Input
                          type="date"
                          value={projectDate}
                          onChange={(e) => setProjectDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Description *
                      </label>
                      <Textarea
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="Brief summary of the problem solved, tech stack used, and key milestones..."
                        className="min-h-[80px]"
                        required
                      />
                    </div>

                    {/* External Links */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Repository &amp; Demo Links
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Code2 className="size-4 text-muted-foreground shrink-0" />
                          <Input
                            value={projectGithub}
                            onChange={(e) => setProjectGithub(e.target.value)}
                            placeholder="https://github.com/user/project"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <PenTool className="size-4 text-muted-foreground shrink-0" />
                          <Input
                            value={projectFigma}
                            onChange={(e) => setProjectFigma(e.target.value)}
                            placeholder="https://figma.com/file/..."
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="size-4 text-muted-foreground shrink-0" />
                          <Input
                            value={projectDemo}
                            onChange={(e) => setProjectDemo(e.target.value)}
                            placeholder="https://my-app.vercel.app"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Associated Skills
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-border rounded-lg bg-muted/20">
                        {availableSkills.map((skill) => {
                          const isSelected = projectSelectedSkillIds.includes(skill.id)
                          return (
                            <Badge
                              key={skill.id}
                              variant={isSelected ? "exact" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => {
                                setProjectSelectedSkillIds((prev) =>
                                  isSelected
                                    ? prev.filter((id) => id !== skill.id)
                                    : [...prev, skill.id]
                                )
                              }}
                            >
                              {skill.name}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>

                    {/* Privacy Checkbox */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        checked={projectIsPrivate}
                        onChange={(e) => setProjectIsPrivate(e.target.checked)}
                        className="rounded border-border"
                      />
                      <label htmlFor="isPrivate" className="text-xs text-muted-foreground cursor-pointer">
                        Mark as Private (only visible to team recruiters after invitation)
                      </label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddProjectOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProject} disabled={isPending}>
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : "Save Project"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {profile.projects.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border rounded-xl space-y-2">
                  <FolderGit2 className="size-8 mx-auto text-muted-foreground/60" />
                  <p className="text-sm font-semibold text-foreground">No Projects Added Yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Adding projects helps recruiters evaluate your real-world development experience.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.projects.map((project) => (
                    <Card
                      key={project.id}
                      className="border-border/80 bg-muted/10 hover:border-border transition-colors rounded-xl flex flex-col justify-between"
                    >
                      <CardHeader className="pb-2 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-bold text-foreground leading-snug">
                            {project.title}
                          </CardTitle>
                          {project.isPrivate ? (
                            <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                              <Lock className="size-3" /> Private
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">
                              Public
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-primary">{project.role}</div>
                        <CardDescription className="text-xs line-clamp-3 leading-relaxed">
                          {project.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pb-3 space-y-3">
                        {/* Skills */}
                        {project.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {project.skills.map(({ skill }) => (
                              <Badge key={skill.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {skill.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Links */}
                        <div className="flex items-center gap-3 text-xs pt-1 border-t border-border/40">
                          {project.githubLink && (
                            <a
                              href={project.githubLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Code2 className="size-3.5" />
                              <span>GitHub</span>
                            </a>
                          )}
                          {project.figmaLink && (
                            <a
                              href={project.figmaLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <PenTool className="size-3.5" />
                              <span>Figma</span>
                            </a>
                          )}
                          {project.demoLink && (
                            <a
                              href={project.demoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Globe className="size-3.5" />
                              <span>Demo</span>
                            </a>
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="pt-2 border-t border-border/40 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={isPending}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          <span>Delete</span>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: ACHIEVEMENTS & AWARDS */}
        <TabsContent value="achievements" className="space-y-6">
          <Card className="border-border/80 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Achievements &amp; Hackathon Awards</CardTitle>
                <CardDescription className="text-xs">
                  Highlight competition placements, certifications, and academic recognitions.
                </CardDescription>
              </div>

              {/* Add Achievement Dialog */}
              <Dialog open={isAddAchievementOpen} onOpenChange={setIsAddAchievementOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-xs shadow-xs">
                    <Plus className="size-3.5" />
                    <span>Add Award</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Achievement</DialogTitle>
                    <DialogDescription className="text-xs">
                      Document your competition placement or recognition.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3.5 py-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Title / Award Name *
                      </label>
                      <Input
                        value={achievementTitle}
                        onChange={(e) => setAchievementTitle(e.target.value)}
                        placeholder="1st Place - Smart City Hackathon 2026"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Date
                      </label>
                      <Input
                        type="date"
                        value={achievementDate}
                        onChange={(e) => setAchievementDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Description *
                      </label>
                      <Textarea
                        value={achievementDescription}
                        onChange={(e) => setAchievementDescription(e.target.value)}
                        placeholder="Built an autonomous waste management pipeline with IoT sensors..."
                        className="min-h-[80px]"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Certificate / Evidence Link
                      </label>
                      <Input
                        value={achievementLink}
                        onChange={(e) => setAchievementLink(e.target.value)}
                        placeholder="https://credential.net/..."
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddAchievementOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAchievement} disabled={isPending}>
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : "Save Award"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {profile.achievements.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-xl space-y-2">
                  <Trophy className="size-8 mx-auto text-muted-foreground/60" />
                  <p className="text-sm font-semibold text-foreground">No Achievements Added Yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Showcase hackathon victories, academic honors, or published projects.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-start justify-between p-4 rounded-xl border border-border/80 bg-muted/20 hover:border-border transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Trophy className="size-4 text-amber-500 shrink-0" />
                          <span className="font-bold text-sm text-foreground">{achievement.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                          {achievement.description}
                        </p>
                        {achievement.link && (
                          <div className="pl-6 pt-1">
                            <a
                              href={achievement.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <span>View Certificate</span>
                              <ExternalLink className="size-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAchievement(achievement.id)}
                        disabled={isPending}
                        className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                        aria-label={`Delete ${achievement.title}`}
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
