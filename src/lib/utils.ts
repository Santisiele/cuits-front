import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS class names, resolving conflicts via tailwind-merge.
 * @param inputs - Class values to merge
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}