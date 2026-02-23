import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const SKIP_WORDS = new Set([
  'bin', 'binti', 'bte', 'bt',
  'dr', 'dato', "dato'", 'datuk', 'datin', 'tan', 'sri',
  'prof', 'haji', 'hajah', 'hj', 'hjh',
  'mr', 'mrs', 'ms', 'miss',
])

export function getFirstName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(p => !SKIP_WORDS.has(p.toLowerCase().replace(/\.$/, '')))

  return parts[0] ?? name.split(/\s+/)[0] ?? name
}

export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(p => !SKIP_WORDS.has(p.toLowerCase().replace(/\.$/, '')))

  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()

  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
