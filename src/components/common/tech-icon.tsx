"use client"

import * as React from "react"
import {
  Code2,
  Server,
  Database,
  Cpu,
  Layers,
  Shield,
  Smartphone,
  Sparkles,
  Terminal,
  Palette,
  Boxes,
  FileCode,
  Flame,
  Binary,
  Radio,
  Cloud,
} from "lucide-react"

interface TechIconProps {
  name: string
  className?: string
  size?: number
}

export function TechIcon({ name, className = "size-4", size }: TechIconProps) {
  const normalized = name.toLowerCase().trim()

  // Custom styling & icon selection based on technology name
  if (normalized.includes("react")) {
    return <Code2 className={`text-cyan-500 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("next")) {
    return <Layers className={`text-foreground ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("vue") || normalized.includes("nuxt")) {
    return <Code2 className={`text-emerald-500 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("typescript") || normalized === "ts") {
    return <FileCode className={`text-blue-500 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("javascript") || normalized === "js") {
    return <FileCode className={`text-amber-500 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("html") || normalized.includes("css") || normalized.includes("tailwind")) {
    return <Palette className={`text-sky-500 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("node") || normalized.includes("express") || normalized.includes("nest")) {
    return <Server className={`text-emerald-600 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("python") || normalized.includes("django") || normalized.includes("flask") || normalized.includes("fastapi")) {
    return <Terminal className={`text-blue-600 dark:text-blue-400 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("java") || normalized.includes("spring")) {
    return <Flame className={`text-orange-600 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("c++") || normalized.includes("c#") || normalized === "c" || normalized.includes(".net")) {
    return <Binary className={`text-purple-600 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("rust") || normalized.includes("go")) {
    return <Cpu className={`text-amber-700 dark:text-amber-400 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("android") || normalized.includes("kotlin")) {
    return <Smartphone className={`text-emerald-500 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("ios") || normalized.includes("swift")) {
    return <Smartphone className={`text-orange-500 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("flutter") || normalized.includes("dart")) {
    return <Smartphone className={`text-cyan-600 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("postgres") || normalized.includes("sql") || normalized.includes("mongo") || normalized.includes("redis") || normalized.includes("supabase") || normalized.includes("prisma")) {
    return <Database className={`text-blue-500 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("aws") || normalized.includes("cloud") || normalized.includes("azure") || normalized.includes("gcp") || normalized.includes("docker") || normalized.includes("kubernetes")) {
    return <Cloud className={`text-indigo-500 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("ai") || normalized.includes("learning") || normalized.includes("pytorch") || normalized.includes("tensor") || normalized.includes("vision") || normalized.includes("nlp") || normalized.includes("data")) {
    return <Sparkles className={`text-purple-500 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("security") || normalized.includes("hacking") || normalized.includes("crypto") || normalized.includes("owasp")) {
    return <Shield className={`text-rose-500 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("arduino") || normalized.includes("raspberry") || normalized.includes("embedded") || normalized.includes("robot") || normalized.includes("iot") || normalized.includes("pcb")) {
    return <Radio className={`text-amber-600 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("figma") || normalized.includes("design") || normalized.includes("ui") || normalized.includes("ux")) {
    return <Palette className={`text-pink-500 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }
  if (normalized.includes("manage") || normalized.includes("product") || normalized.includes("agile") || normalized.includes("pitch")) {
    return <Boxes className={`text-emerald-600 ${className}`} style={size ? { width: size, height: size } : undefined} />
  }

  // Generic fallback
  return <Code2 className={`text-muted-foreground ${className}`} style={size ? { width: size, height: size } : undefined} />
}
