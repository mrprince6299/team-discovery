/**
 * AUTHORITATIVE PLATFORM OPTIONS & CONTROLLED TAXONOMIES
 * Single source of truth for skills, roles, departments, academic years, availability, and domains.
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
  { name: "Google Cloud", category: "Cloud & DevOps", aliases: ["GCP"] },
  { name: "Docker", category: "Cloud & DevOps" },
  { name: "Kubernetes", category: "Cloud & DevOps", aliases: ["K8s"] },
  { name: "Terraform", category: "Cloud & DevOps" },
  { name: "CI/CD", category: "Cloud & DevOps", aliases: ["Continuous Integration"] },
  { name: "GitHub Actions", category: "Cloud & DevOps" },
  { name: "Linux", category: "Cloud & DevOps", aliases: ["Ubuntu", "Bash"] },
  { name: "Nginx", category: "Cloud & DevOps" },
  { name: "Vercel", category: "Cloud & DevOps" },
  { name: "Cloudflare", category: "Cloud & DevOps" },
  { name: "Serverless", category: "Cloud & DevOps", aliases: ["AWS Lambda"] },

  // --- AI & DATA ---
  { name: "Machine Learning", category: "AI & Data", aliases: ["ML"] },
  { name: "Deep Learning", category: "AI & Data", aliases: ["DL"] },
  { name: "Artificial Intelligence", category: "AI & Data", aliases: ["AI"] },
  { name: "Data Science", category: "AI & Data" },
  { name: "Data Analysis", category: "AI & Data", aliases: ["Data Analytics"] },
  { name: "Natural Language Processing", category: "AI & Data", aliases: ["NLP"] },
  { name: "Computer Vision", category: "AI & Data", aliases: ["CV"] },
  { name: "Generative AI", category: "AI & Data", aliases: ["GenAI", "LLMs"] },
  { name: "TensorFlow", category: "AI & Data" },
  { name: "PyTorch", category: "AI & Data" },
  { name: "Pandas", category: "AI & Data" },
  { name: "NumPy", category: "AI & Data" },
  { name: "Scikit-learn", category: "AI & Data", aliases: ["sklearn"] },
  { name: "OpenCV", category: "AI & Data" },
  { name: "Hugging Face", category: "AI & Data" },
  { name: "LangChain", category: "AI & Data" },

  // --- CYBERSECURITY ---
  { name: "Cybersecurity", category: "Cybersecurity", aliases: ["InfoSec"] },
  { name: "Network Security", category: "Cybersecurity" },
  { name: "Ethical Hacking", category: "Cybersecurity" },
  { name: "Penetration Testing", category: "Cybersecurity", aliases: ["PenTesting"] },
  { name: "Cryptography", category: "Cybersecurity" },
  { name: "OWASP", category: "Cybersecurity" },
  { name: "Security Auditing", category: "Cybersecurity" },

  // --- HARDWARE & SYSTEMS ---
  { name: "Arduino", category: "Hardware & Systems" },
  { name: "Raspberry Pi", category: "Hardware & Systems" },
  { name: "Embedded Systems", category: "Hardware & Systems", aliases: ["Embedded C"] },
  { name: "Internet of Things", category: "Hardware & Systems", aliases: ["IoT"] },
  { name: "Robotics", category: "Hardware & Systems", aliases: ["ROS"] },
  { name: "MATLAB", category: "Hardware & Systems" },
  { name: "Simulink", category: "Hardware & Systems" },
  { name: "PCB Design", category: "Hardware & Systems", aliases: ["KiCAD", "Altium"] },
  { name: "CAD Modeling", category: "Hardware & Systems", aliases: ["SolidWorks", "AutoCAD"] },
  { name: "3D Printing", category: "Hardware & Systems" },
  { name: "Microcontrollers", category: "Hardware & Systems", aliases: ["STM32", "ESP32"] },

  // --- DESIGN & PRODUCT ---
  { name: "UI/UX Design", category: "Design & Product", aliases: ["UI/UX", "User Interface"] },
  { name: "Figma", category: "Design & Product" },
  { name: "Product Design", category: "Design & Product" },
  { name: "Graphic Design", category: "Design & Product" },
  { name: "Wireframing & Prototyping", category: "Design & Product", aliases: ["Prototyping"] },
  { name: "Product Management", category: "Design & Product", aliases: ["PM"] },
  { name: "Technical Writing", category: "Design & Product", aliases: ["Documentation"] },
  { name: "User Research", category: "Design & Product" },
  { name: "Adobe XD", category: "Design & Product" },
  { name: "Photoshop", category: "Design & Product" },
  { name: "Illustrator", category: "Design & Product" },
]

export const SKILL_CATEGORIES: SkillCategory[] = [
  "Frontend",
  "Backend",
  "Mobile",
  "Databases",
  "Cloud & DevOps",
  "AI & Data",
  "Cybersecurity",
  "Hardware & Systems",
  "Design & Product",
]

// ============================================================================
// 2. SQUAD RECRUITMENT ROLES (Categorized)
// ============================================================================

export interface RoleTemplate {
  name: string
  category: "Engineering" | "Design & Product" | "Data & AI" | "Hardware & Security" | "Leadership & Other"
  defaultSkills: string[]
}

export const AUTHORITATIVE_ROLES: RoleTemplate[] = [
  // Engineering
  { name: "Frontend Developer", category: "Engineering", defaultSkills: ["React", "TypeScript", "Tailwind CSS"] },
  { name: "Backend Developer", category: "Engineering", defaultSkills: ["Node.js", "PostgreSQL", "REST APIs"] },
  { name: "Full Stack Developer", category: "Engineering", defaultSkills: ["Next.js", "TypeScript", "PostgreSQL"] },
  { name: "Mobile App Developer", category: "Engineering", defaultSkills: ["Flutter", "React Native", "Firebase"] },
  { name: "Android Developer", category: "Engineering", defaultSkills: ["Kotlin", "Android", "Jetpack Compose"] },
  { name: "iOS Developer", category: "Engineering", defaultSkills: ["Swift", "SwiftUI", "iOS"] },
  { name: "DevOps & Cloud Engineer", category: "Engineering", defaultSkills: ["Docker", "Kubernetes", "AWS"] },
  { name: "QA & Automation Engineer", category: "Engineering", defaultSkills: ["Python", "CI/CD", "TypeScript"] },
  { name: "Blockchain / Web3 Developer", category: "Engineering", defaultSkills: ["Rust", "TypeScript", "Cryptography"] },

  // Data & AI
  { name: "AI / ML Engineer", category: "Data & AI", defaultSkills: ["Python", "PyTorch", "Machine Learning"] },
  { name: "Data Scientist", category: "Data & AI", defaultSkills: ["Python", "Pandas", "Scikit-learn"] },
  { name: "Data Analyst", category: "Data & AI", defaultSkills: ["SQL", "Python", "Data Analysis"] },
  { name: "NLP / LLM Specialist", category: "Data & AI", defaultSkills: ["Python", "Generative AI", "PyTorch"] },
  { name: "Computer Vision Engineer", category: "Data & AI", defaultSkills: ["Python", "OpenCV", "Deep Learning"] },

  // Hardware & Security
  { name: "Embedded Systems Engineer", category: "Hardware & Security", defaultSkills: ["C++", "Embedded Systems", "Arduino"] },
  { name: "Robotics Engineer", category: "Hardware & Security", defaultSkills: ["Robotics", "C++", "Python"] },
  { name: "IoT Engineer", category: "Hardware & Security", defaultSkills: ["Internet of Things", "Raspberry Pi", "Python"] },
  { name: "Cybersecurity Specialist", category: "Hardware & Security", defaultSkills: ["Cybersecurity", "Network Security", "Linux"] },

  // Design & Product
  { name: "UI/UX Designer", category: "Design & Product", defaultSkills: ["Figma", "UI/UX Design", "Wireframing & Prototyping"] },
  { name: "Product Designer", category: "Design & Product", defaultSkills: ["Figma", "Product Design", "User Research"] },
  { name: "Graphic & Brand Designer", category: "Design & Product", defaultSkills: ["Graphic Design", "Illustrator", "Photoshop"] },

  // Leadership & Other
  { name: "Product Manager", category: "Leadership & Other", defaultSkills: ["Product Management", "Wireframing & Prototyping"] },
  { name: "Project Coordinator", category: "Leadership & Other", defaultSkills: ["Product Management", "Technical Writing"] },
  { name: "Technical Writer & Docs", category: "Leadership & Other", defaultSkills: ["Technical Writing"] },
  { name: "Pitch & Presentation Lead", category: "Leadership & Other", defaultSkills: ["Product Management"] },
]

// ============================================================================
// 3. DEPARTMENTS & ACADEMIC BRANCHES
// ============================================================================

export interface DepartmentOption {
  code: string
  name: string
  category: "Computer & Info" | "Electrical & Electronics" | "Mechanical & Core" | "Interdisciplinary & Sciences" | "Design & Management"
}

export const AUTHORITATIVE_DEPARTMENTS: DepartmentOption[] = [
  // Computer & Info
  { code: "CSE", name: "Computer Science & Engineering", category: "Computer & Info" },
  { code: "IT", name: "Information Technology", category: "Computer & Info" },
  { code: "AIML", name: "Artificial Intelligence & Machine Learning", category: "Computer & Info" },
  { code: "DS", name: "Data Science & Big Data", category: "Computer & Info" },
  { code: "CSBS", name: "Computer Science & Business Systems", category: "Computer & Info" },
  { code: "CYBER", name: "Cybersecurity & Information Security", category: "Computer & Info" },
  { code: "SWE", name: "Software Engineering", category: "Computer & Info" },

  // Electrical & Electronics
  { code: "ECE", name: "Electronics & Communication Engineering", category: "Electrical & Electronics" },
  { code: "EEE", name: "Electrical & Electronics Engineering", category: "Electrical & Electronics" },
  { code: "ICE", name: "Instrumentation & Control Engineering", category: "Electrical & Electronics" },
  { code: "EIE", name: "Electronics & Instrumentation Engineering", category: "Electrical & Electronics" },

  // Mechanical & Core
  { code: "MECH", name: "Mechanical Engineering", category: "Mechanical & Core" },
  { code: "CIVIL", name: "Civil & Environmental Engineering", category: "Mechanical & Core" },
  { code: "AERO", name: "Aerospace & Aeronautical Engineering", category: "Mechanical & Core" },
  { code: "AUTO", name: "Automobile Engineering", category: "Mechanical & Core" },
  { code: "ROBO", name: "Robotics & Automation", category: "Mechanical & Core" },
  { code: "MECHATRONICS", name: "Mechatronics Engineering", category: "Mechanical & Core" },
  { code: "CHEM", name: "Chemical Engineering", category: "Mechanical & Core" },
  { code: "PROD", name: "Production & Industrial Engineering", category: "Mechanical & Core" },

  // Interdisciplinary & Sciences
  { code: "BIOTECH", name: "Biotechnology & Bioinformatics", category: "Interdisciplinary & Sciences" },
  { code: "BME", name: "Biomedical Engineering", category: "Interdisciplinary & Sciences" },
  { code: "MATH", name: "Mathematics & Computing", category: "Interdisciplinary & Sciences" },
  { code: "PHYSICS", name: "Engineering Physics / Applied Sciences", category: "Interdisciplinary & Sciences" },

  // Design & Management
  { code: "DESIGN", name: "Design, Animation & Media Arts", category: "Design & Management" },
  { code: "MGMT", name: "Business Administration & Management", category: "Design & Management" },
  { code: "OTHER", name: "Other Academic Department", category: "Design & Management" },
]

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
