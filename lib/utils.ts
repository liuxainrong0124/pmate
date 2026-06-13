import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns HTTP status code for API error — 401 for auth failures, 500 otherwise */
export function apiErrorStatus(err: unknown): number {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("401") || msg.includes("authentication") || msg.includes("api key") || msg.includes("unauthorized")) {
      return 401;
    }
  }
  return 500;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
