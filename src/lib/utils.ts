import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    WAITING: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    RESOLVED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    CLOSED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };
  return colors[status] || colors.OPEN;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
    CRITICAL: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  };
  return colors[priority] || colors.MEDIUM;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
