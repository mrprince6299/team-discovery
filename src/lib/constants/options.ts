/**
 * AUTHORITATIVE PLATFORM OPTIONS & CONTROLLED TAXONOMIES
 * Single source of truth for skills, roles, academic programs, branches, academic years, availability, and domains.
 */

import type { SkillLevel, PreferredExperience, Availability } from "@prisma/client"

// ============================================================================
// 1. TECHNICAL & DESIGN SKILLS (Categorized)
// ============================================================================

export interface SkillDefinition {
  name: string
  category: SkillCategory
  aliases?: string[]
}

export type SkillCategory =
  | "Frontend"
  | "Backend"
  | "Mobile"
  | "Databases"
  | "Cloud & DevOps"
  | "AI & Data"
  | "Cybersecurity"
  | "Hardware & Systems"
  | "Design & Product"

export const AUTHORITATIVE_SKILLS: SkillDefinition[] = [
  // --- FRONTEND ---
  { name: "HTML5", category: "Frontend", aliases: ["HTML"] },
  { name: "CSS3", category: "Frontend", aliases: ["CSS"] },
  { name: "JavaScript", category: "Frontend", aliases: ["JS", "ES6"] },
  { name: "TypeScript", category: "Frontend", aliases: ["TS"] },
  { name: "React", category: "Frontend", aliases: ["ReactJS", "React.js"] },
  { name: "Next.js", category: "Frontend", aliases: ["NextJS"] },
  { name: "Vue.js", category: "Frontend", aliases: ["Vue", "VueJS"] },
  { name: "Nuxt.js", category: "Frontend", aliases: ["Nuxt"] },
  { name: "Angular", category: "Frontend" },
  { name: "Svelte", category: "Frontend", aliases: ["SvelteKit"] },
  { name: "Tailwind CSS", category: "Frontend", aliases: ["Tailwind"] },
  { name: "Redux", category: "Frontend", aliases: ["Redux Toolkit"] },
  { name: "WebAssembly", category: "Frontend", aliases: ["Wasm"] },
  { name: "Three.js", category: "Frontend", aliases: ["WebGL"] },
  { name: "Bootstrap", category: "Frontend" },

  // --- BACKEND ---
  { name: "Node.js", category: "Backend", aliases: ["Node", "NodeJS"] },
  { name: "Express.js", category: "Backend", aliases: ["Express"] },
  { name: "NestJS", category: "Backend" },
  { name: "Python", category: "Backend", aliases: ["Python3"] },
  { name: "Django", category: "Backend" },
  { name: "Flask", category: "Backend" },
  { name: "FastAPI", category: "Backend" },
  { name: "Java", category: "Backend" },
  { name: "Spring Boot", category: "Backend", aliases: ["Spring"] },
  { name: "C", category: "Backend" },
  { name: "C++", category: "Backend", aliases: ["CPP"] },
  { name: "C#", category: "Backend", aliases: ["CSharp"] },
  { name: ".NET", category: "Backend", aliases: ["ASP.NET", "DotNet"] },
  { name: "Go", category: "Backend", aliases: ["Golang"] },
  { name: "Rust", category: "Backend" },
  { name: "PHP", category: "Backend" },
  { name: "Laravel", category: "Backend" },
  { name: "Ruby", category: "Backend" },
  { name: "Ruby on Rails", category: "Backend", aliases: ["Rails"] },
  { name: "GraphQL", category: "Backend" },
  { name: "REST APIs", category: "Backend", aliases: ["RESTful"] },
  { name: "gRPC", category: "Backend" },
  { name: "WebSockets", category: "Backend", aliases: ["Socket.io"] },

  // --- MOBILE ---
  { name: "Android", category: "Mobile", aliases: ["Android Development"] },
  { name: "Kotlin", category: "Mobile" },
  { name: "Java Android", category: "Mobile" },
  { name: "Swift", category: "Mobile" },
  { name: "SwiftUI", category: "Mobile" },
  { name: "iOS", category: "Mobile", aliases: ["iOS Development"] },
  { name: "React Native", category: "Mobile" },
  { name: "Flutter", category: "Mobile" },
  { name: "Dart", category: "Mobile" },
  { name: "Jetpack Compose", category: "Mobile" },

  // --- DATABASES ---
  { name: "PostgreSQL", category: "Databases", aliases: ["Postgres"] },
  { name: "MySQL", category: "Databases" },
  { name: "SQLite", category: "Databases" },
  { name: "MongoDB", category: "Databases", aliases: ["Mongo"] },
  { name: "Redis", category: "Databases" },
  { name: "Supabase", category: "Databases" },
  { name: "Firebase", category: "Databases", aliases: ["Firestore"] },
  { name: "Prisma ORM", category: "Databases", aliases: ["Prisma"] },
  { name: "SQL", category: "Databases" },
  { name: "Elasticsearch", category: "Databases" },
  { name: "Cassandra", category: "Databases" },
  { name: "Neo4j", category: "Databases", aliases: ["Graph Databases"] },

  // --- CLOUD & DEVOPS ---
  { name: "AWS", category: "Cloud & DevOps", aliases: ["Amazon Web Services"] },
  { name: "Microsoft Azure", category: "Cloud & DevOps", aliases: ["Azure"] },
  { name: "Google Cloud Platform", category: "Cloud & DevOps", aliases: ["GCP"] },
  { name: "Docker", category: "Cloud & DevOps" },
  { name: "Kubernetes", category: "Cloud & DevOps", aliases: ["K8s"] },
  { name: "CI/CD", category: "Cloud & DevOps", aliases: ["GitHub Actions", "GitLab CI"] },
  { name: "Terraform", category: "Cloud & DevOps", aliases: ["IaC"] },
  { name: "Linux", category: "Cloud & DevOps", aliases: ["Ubuntu", "Bash", "Shell"] },
  { name: "Nginx", category: "Cloud & DevOps" },
  { name: "Vercel", category: "Cloud & DevOps" },

  // --- AI & DATA ---
  { name: "Machine Learning", category: "AI & Data", aliases: ["ML"] },
  { name: "Deep Learning", category: "AI & Data", aliases: ["DL"] },
  { name: "PyTorch", category: "AI & Data" },
  { name: "TensorFlow", category: "AI & Data", aliases: ["TF", "Keras"] },
  { name: "OpenCV", category: "AI & Data", aliases: ["Computer Vision", "CV"] },
  { name: "Natural Language Processing", category: "AI & Data", aliases: ["NLP"] },
  { name: "Large Language Models", category: "AI & Data", aliases: ["LLM", "Generative AI", "LangChain"] },
  { name: "Data Science", category: "AI & Data" },
  { name: "Pandas", category: "AI & Data" },
  { name: "NumPy", category: "AI & Data" },
  { name: "Scikit-Learn", category: "AI & Data", aliases: ["sklearn"] },
  { name: "Data Visualization", category: "AI & Data", aliases: ["Matplotlib", "Seaborn", "Tableau"] },
  { name: "R", category: "AI & Data" },

  // --- CYBERSECURITY ---
  { name: "Ethical Hacking", category: "Cybersecurity", aliases: ["Penetration Testing", "PenTest"] },
  { name: "Network Security", category: "Cybersecurity" },
  { name: "Cryptography", category: "Cybersecurity" },
  { name: "Web Application Security", category: "Cybersecurity", aliases: ["OWASP"] },
  { name: "Reverse Engineering", category: "Cybersecurity" },
  { name: "SIEM & SOC", category: "Cybersecurity" },

  // --- HARDWARE & SYSTEMS ---
  { name: "Arduino", category: "Hardware & Systems" },
  { name: "Raspberry Pi", category: "Hardware & Systems" },
  { name: "Internet of Things", category: "Hardware & Systems", aliases: ["IoT"] },
  { name: "Embedded C", category: "Hardware & Systems" },
  { name: "Robotics", category: "Hardware & Systems", aliases: ["ROS"] },
  { name: "FPGA & Verilog", category: "Hardware & Systems" },
  { name: "PCB Design", category: "Hardware & Systems", aliases: ["Altium", "KiCad"] },

  // --- DESIGN & PRODUCT ---
  { name: "Figma", category: "Design & Product" },
  { name: "UI/UX Design", category: "Design & Product", aliases: ["User Interface", "User Experience"] },
  { name: "Product Design", category: "Design & Product" },
  { name: "Graphic Design", category: "Design & Product", aliases: ["Photoshop", "Illustrator"] },
  { name: "Wireframing & Prototyping", category: "Design & Product" },
  { name: "Design Systems", category: "Design & Product" },
  { name: "Pitching & Presentation", category: "Design & Product" },
  { name: "Product Management", category: "Design & Product", aliases: ["Agile", "Scrum"] },
]

// ============================================================================
// 2. AUTHORITATIVE TEAM & PROFILE ROLES
// ============================================================================

export interface RoleTemplate {
  name: string
  category: "Engineering" | "Data & AI" | "Design & Product" | "Hardware & Security" | "Leadership & Other"
  description: string
  defaultSkills: string[]
}

export const AUTHORITATIVE_ROLES: RoleTemplate[] = [
  // Engineering
  {
    name: "Frontend Developer",
    category: "Engineering",
    description: "Builds responsive, accessible web interfaces and user-facing clients.",
    defaultSkills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "HTML5"],
  },
  {
    name: "Backend Developer",
    category: "Engineering",
    description: "Architects scalable server APIs, business logic, and database schemas.",
    defaultSkills: ["Node.js", "Python", "PostgreSQL", "REST APIs", "Docker"],
  },
  {
    name: "Full Stack Developer",
    category: "Engineering",
    description: "Builds end-to-end features spanning client interfaces and server services.",
    defaultSkills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Next.js"],
  },
  {
    name: "Mobile Developer",
    category: "Engineering",
    description: "Builds cross-platform or native mobile apps for iOS and Android.",
    defaultSkills: ["React Native", "Flutter", "Kotlin", "Swift", "Dart"],
  },
  {
    name: "Android Developer",
    category: "Engineering",
    description: "Builds native Android applications using Kotlin and Jetpack Compose.",
    defaultSkills: ["Kotlin", "Android", "Jetpack Compose", "Java Android"],
  },
  {
    name: "iOS Developer",
    category: "Engineering",
    description: "Builds native iOS applications using Swift and SwiftUI.",
    defaultSkills: ["Swift", "SwiftUI", "iOS"],
  },
  {
    name: "DevOps / Cloud Engineer",
    category: "Engineering",
    description: "Manages infrastructure, CI/CD pipelines, containerization, and deployments.",
    defaultSkills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
  },

  // Data & AI
  {
    name: "AI / ML Engineer",
    category: "Data & AI",
    description: "Trains, fine-tunes, and deploys machine learning and deep learning models.",
    defaultSkills: ["Python", "PyTorch", "TensorFlow", "Machine Learning", "FastAPI"],
  },
  {
    name: "Data Scientist",
    category: "Data & AI",
    description: "Extracts insights from large datasets using statistical modeling and analytics.",
    defaultSkills: ["Python", "Pandas", "Scikit-Learn", "Data Science", "SQL"],
  },
  {
    name: "Data Analyst",
    category: "Data & AI",
    description: "Transforms raw data into dashboards, reports, and actionable metrics.",
    defaultSkills: ["SQL", "Python", "Data Visualization", "Pandas"],
  },

  // Hardware & Security
  {
    name: "Cybersecurity Specialist",
    category: "Hardware & Security",
    description: "Audits security posture, penetration tests web apps, and ensures data safety.",
    defaultSkills: ["Ethical Hacking", "Network Security", "Web Application Security", "Linux"],
  },
  {
    name: "Embedded Systems Engineer",
    category: "Hardware & Security",
    description: "Programs microcontrollers, firmware, and low-level hardware devices.",
    defaultSkills: ["C", "C++", "Embedded C", "Arduino", "PCB Design"],
  },
  {
    name: "Robotics Engineer",
    category: "Hardware & Security",
    description: "Develops robotic kinematics, perception algorithms, and control systems.",
    defaultSkills: ["Robotics", "ROS", "C++", "Python", "OpenCV"],
  },
  {
    name: "IoT Engineer",
    category: "Hardware & Security",
    description: "Connects smart physical sensors and devices to cloud telemetry.",
    defaultSkills: ["Internet of Things", "Raspberry Pi", "Arduino", "MQTT", "Python"],
  },

  // Design & Product
  {
    name: "UI/UX Designer",
    category: "Design & Product",
    description: "Designs wireframes, design systems, interactive prototypes, and user flows.",
    defaultSkills: ["Figma", "UI/UX Design", "Wireframing & Prototyping", "Design Systems"],
  },
  {
    name: "Product Designer",
    category: "Design & Product",
    description: "Balances visual aesthetics, usability testing, and strategic product requirements.",
    defaultSkills: ["Figma", "Product Design", "UI/UX Design"],
  },
  {
    name: "Graphic Designer",
    category: "Design & Product",
    description: "Creates visual branding, marketing assets, vector graphics, and illustrations.",
    defaultSkills: ["Graphic Design", "Figma"],
  },
  {
    name: "Product Manager",
    category: "Design & Product",
    description: "Defines product vision, sprint roadmaps, user stories, and feature prioritization.",
    defaultSkills: ["Product Management", "Agile", "Wireframing & Prototyping"],
  },
  {
    name: "Project Manager",
    category: "Design & Product",
    description: "Coordinates team deliverables, timeline milestones, and task tracking.",
    defaultSkills: ["Product Management", "Agile"],
  },

  // Leadership & Other
  {
    name: "Technical Writer",
    category: "Leadership & Other",
    description: "Authors API documentation, system architecture guides, and user manuals.",
    defaultSkills: ["Documentation", "Markdown", "REST APIs"],
  },
  {
    name: "Researcher",
    category: "Leadership & Other",
    description: "Conducts domain research, literature reviews, and empirical benchmarking.",
    defaultSkills: ["Data Science", "Python", "Data Visualization"],
  },
  {
    name: "Pitch / Presentation Lead",
    category: "Leadership & Other",
    description: "Crafts the pitch deck, delivers demo presentations, and handles investor Q&A.",
    defaultSkills: ["Pitching & Presentation", "Figma", "Product Management"],
  },
]

// ============================================================================
// 3. ACADEMIC PROGRAMS & BRANCHES (SEPARATE & CONDITIONAL)
// ============================================================================

export interface ProgramOption {
  code: string
  name: string
  branches: string[]
}

export const AUTHORITATIVE_PROGRAMS: ProgramOption[] = [
  {
    code: "BTECH_BE",
    name: "B.Tech / B.E.",
    branches: [
      "Computer Science and Engineering (CSE)",
      "Information Technology (IT)",
      "Artificial Intelligence and Data Science",
      "Artificial Intelligence and Machine Learning",
      "Electronics and Communication Engineering (ECE)",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Chemical Engineering",
      "Aerospace Engineering",
      "Automobile Engineering",
      "Robotics and Automation",
      "Mechatronics Engineering",
      "Biotechnology",
      "Biomedical Engineering",
      "Electronics and Instrumentation",
      "Instrumentation and Control",
      "Production / Industrial Engineering",
      "Other",
    ],
  },
  {
    code: "BCA",
    name: "BCA",
    branches: ["BCA", "Other / General"],
  },
  {
    code: "BBA",
    name: "BBA",
    branches: ["BBA", "Other / General"],
  },
  {
    code: "BPHARM",
    name: "B.Pharm",
    branches: ["B.Pharm", "Other / General"],
  },
  {
    code: "BSC",
    name: "B.Sc.",
    branches: [
      "Computer Science",
      "Data Science",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biotechnology",
      "Agriculture",
      "Other",
    ],
  },
  {
    code: "BCOM",
    name: "B.Com",
    branches: [
      "General / Accounting & Finance",
      "Banking & Insurance",
      "Computer Applications",
      "Other",
    ],
  },
  {
    code: "BA",
    name: "BA",
    branches: [
      "Economics",
      "English",
      "Psychology",
      "Political Science",
      "Journalism & Mass Comm",
      "Other",
    ],
  },
  {
    code: "DIPLOMA",
    name: "Diploma",
    branches: [
      "Computer Engineering",
      "Mechanical Engineering",
      "Electrical Engineering",
      "Civil Engineering",
      "Electronics Engineering",
      "Chemical Engineering",
      "Automobile Engineering",
      "Other",
    ],
  },
  {
    code: "MTECH_ME",
    name: "M.Tech / M.E.",
    branches: [
      "Computer Science & Engineering",
      "AI & Data Science",
      "VLSI & Embedded Systems",
      "Thermal / Mechanical Engineering",
      "Structural / Civil Engineering",
      "Power Systems / Electrical",
      "Biotechnology",
      "Other",
    ],
  },
  {
    code: "MCA",
    name: "MCA",
    branches: ["MCA", "Other / General"],
  },
  {
    code: "MBA",
    name: "MBA",
    branches: [
      "Finance",
      "Marketing",
      "Human Resources",
      "Operations & Supply Chain",
      "Business Analytics",
      "Information Technology",
      "Other",
    ],
  },
  {
    code: "MPHARM",
    name: "M.Pharm",
    branches: [
      "Pharmaceutics",
      "Pharmacology",
      "Pharmaceutical Chemistry",
      "Other",
    ],
  },
  {
    code: "MSC",
    name: "M.Sc.",
    branches: [
      "Computer Science",
      "Data Science",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biotechnology",
      "Other",
    ],
  },
  {
    code: "PHD",
    name: "PhD",
    branches: [
      "Computer Science & AI",
      "Engineering & Technology",
      "Basic Sciences & Mathematics",
      "Management & Business",
      "Pharmacy & Health Sciences",
      "Humanities & Social Sciences",
      "Other",
    ],
  },
  {
    code: "OTHER",
    name: "Other",
    branches: ["General / Other Specialization"],
  },
]

export function getBranchesForProgram(programNameOrCode: string): string[] {
  if (!programNameOrCode) return []
  const prog = AUTHORITATIVE_PROGRAMS.find(
    (p) => p.name === programNameOrCode || p.code === programNameOrCode
  )
  return prog ? prog.branches : ["General / Other"]
}

// Flat departments list for filter compatibility
export const AUTHORITATIVE_DEPARTMENTS = AUTHORITATIVE_PROGRAMS.flatMap((p) =>
  p.branches.map((b) => ({
    code: p.code,
    name: p.name === b ? b : `${p.name} - ${b}`,
    program: p.name,
    branch: b,
  }))
)

// Profile role parsing and bio formatting helpers (100% schema-safe)
export function parseProfileRole(bio?: string | null): { role: string | null; cleanBio: string } {
  if (!bio) return { role: null, cleanBio: "" }
  const match = bio.match(/^\[Role:\s*(.*?)\]\s*\n?([\s\S]*)$/)
  if (match) {
    return { role: match[1].trim() || null, cleanBio: match[2].trim() }
  }
  return { role: null, cleanBio: bio }
}

export function formatProfileBio(role?: string | null, bio?: string | null): string {
  const clean = bio?.trim() || ""
  if (role && role.trim()) {
    return `[Role: ${role.trim()}]${clean ? `\n${clean}` : ""}`.trim()
  }
  return clean
}

// ============================================================================
// 4. ACADEMIC YEARS
// ============================================================================

export interface AcademicYearOption {
  value: number
  label: string
  shortLabel: string
}

export const ACADEMIC_YEAR_OPTIONS: AcademicYearOption[] = [
  { value: 1, label: "Year 1 (Freshman / 1st Year)", shortLabel: "Year 1" },
  { value: 2, label: "Year 2 (Sophomore / 2nd Year)", shortLabel: "Year 2" },
  { value: 3, label: "Year 3 (Junior / 3rd Year)", shortLabel: "Year 3" },
  { value: 4, label: "Year 4 (Senior / 4th Year)", shortLabel: "Year 4" },
  { value: 5, label: "Year 5+ / Graduate / Master's / PhD", shortLabel: "Year 5 / Grad" },
]

// ============================================================================
// 5. AVAILABILITY STATUSES
// ============================================================================

export interface AvailabilityOption {
  value: Availability
  label: string
  description: string
  badgeVariant: "success" | "exact" | "outline" | "secondary"
}

export const AVAILABILITY_OPTIONS: AvailabilityOption[] = [
  {
    value: "AVAILABLE",
    label: "Available for Teams",
    description: "Open to joining new squads or hackathon teams.",
    badgeVariant: "success",
  },
  {
    value: "LOOKING_FOR_TEAM",
    label: "Actively Looking for Team",
    description: "Seeking a squad actively for upcoming competitions.",
    badgeVariant: "exact",
  },
  {
    value: "BUSY",
    label: "Busy / Limited Availability",
    description: "Currently working on other commitments.",
    badgeVariant: "outline",
  },
  {
    value: "TEAM_FULL",
    label: "Squad Full / Not Looking",
    description: "Already committed to a full team.",
    badgeVariant: "secondary",
  },
]

// ============================================================================
// 6. SKILL PROFICIENCY LEVELS
// ============================================================================

export interface SkillLevelOption {
  value: SkillLevel
  label: string
  description: string
  color: string
}

export const SKILL_LEVEL_OPTIONS: SkillLevelOption[] = [
  {
    value: "BEGINNER",
    label: "Beginner",
    description: "Fundamental knowledge; learning basic concepts and syntax.",
    color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30",
  },
  {
    value: "INTERMEDIATE",
    label: "Intermediate",
    description: "Competent; able to build functional features independently.",
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
  {
    value: "ADVANCED",
    label: "Advanced",
    description: "Expert / Lead; deep architectural mastery and optimization.",
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
]

// ============================================================================
// 7. PREFERRED EXPERIENCE LEVELS
// ============================================================================

export interface ExperienceLevelOption {
  value: PreferredExperience
  label: string
  description: string
}

export const EXPERIENCE_LEVEL_OPTIONS: ExperienceLevelOption[] = [
  {
    value: "ANY",
    label: "Any Experience Level",
    description: "Open to all candidates regardless of project count.",
  },
  {
    value: "BEGINNER",
    label: "Beginner (0 Projects)",
    description: "Introductory level; eager to learn and contribute.",
  },
  {
    value: "SOME_EXPERIENCE",
    label: "Some Experience (1+ Projects)",
    description: "Has completed at least one portfolio or coursework project.",
  },
  {
    value: "EXPERIENCED",
    label: "Experienced (2+ Projects)",
    description: "Has built multiple completed projects in portfolio.",
  },
]

// ============================================================================
// 8. PROJECT & HACKATHON DOMAINS / INTERESTS
// ============================================================================

export const AUTHORITATIVE_INTERESTS: string[] = [
  "Web Development",
  "Mobile Development",
  "AI & Machine Learning",
  "Data Science & Big Data",
  "Cybersecurity & Privacy",
  "Cloud & Distributed Systems",
  "Robotics & Autonomous Systems",
  "Internet of Things (IoT)",
  "Blockchain & Web3",
  "FinTech & DeFi",
  "HealthTech & BioInformatics",
  "EdTech & E-Learning",
  "CleanTech & Sustainability",
  "Gaming & Game Development",
  "AR / VR & Spatial Computing",
  "Open Source Software",
  "Developer Tools & Infrastructure",
  "Civic Tech & Social Good",
  "Hardware & Embedded Systems",
  "E-Commerce & RetailTech",
]
