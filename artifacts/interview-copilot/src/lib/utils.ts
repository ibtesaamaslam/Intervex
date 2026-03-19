import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreColor(score: number) {
  if (score >= 8) return "text-emerald-400 stroke-emerald-400";
  if (score >= 6) return "text-amber-400 stroke-amber-400";
  return "text-rose-400 stroke-rose-400";
}

export function getScoreBg(score: number) {
  if (score >= 8) return "bg-emerald-400/10 border-emerald-400/20";
  if (score >= 6) return "bg-amber-400/10 border-amber-400/20";
  return "bg-rose-400/10 border-rose-400/20";
}
