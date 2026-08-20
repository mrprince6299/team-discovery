import { parseProfileRole } from './constants/options'

export interface ProfileCompletenessInput {
  name?: string | null
  bio?: string | null
  year?: number | null
  department?: { name: string } | null
  college?: { name: string } | null
  skills?: Array<{ skill?: { name: string } | string }> | null
  interests?: Array<{ skill?: { name: string } | string }> | null
  projects?: Array<{ id: string }> | null
  privateData?: { collegeEmail?: string | null; erp?: string | null } | null
}

export function calculateProfileCompleteness(profile: ProfileCompletenessInput): {
  percentage: number
  breakdown: Array<{ label: string; completed: boolean; weight: number }>
} {
  const { role, cleanBio } = parseProfileRole(profile.bio || null)

  const items = [
    { label: 'Full Name', completed: Boolean(profile.name && profile.name.trim().length > 0), weight: 15 },
    { label: 'Primary Role', completed: Boolean(role && role.trim().length > 0), weight: 15 },
    { label: 'Bio / Intro', completed: Boolean(cleanBio && cleanBio.trim().length > 0), weight: 10 },
    { label: 'Program & Branch', completed: Boolean(profile.department?.name && profile.department.name.trim().length > 0), weight: 15 },
    { label: 'College / University', completed: Boolean(profile.college?.name && profile.college.name.trim().length > 0), weight: 10 },
    { label: 'Academic Year', completed: Boolean(profile.year && profile.year > 0), weight: 10 },
    { label: 'Technical Skills (1+)', completed: Boolean(profile.skills && profile.skills.length > 0), weight: 15 },
    { label: 'Portfolio Projects or Interests', completed: Boolean((profile.projects && profile.projects.length > 0) || (profile.interests && profile.interests.length > 0)), weight: 10 },
  ]

  const totalCompletedWeight = items.reduce((acc, item) => acc + (item.completed ? item.weight : 0), 0)

  return {
    percentage: Math.min(100, totalCompletedWeight),
    breakdown: items,
  }
}
