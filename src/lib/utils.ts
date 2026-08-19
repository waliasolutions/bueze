import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Splits an array into batches of `size`.
 * Used to keep `.in(...)` filters below PostgREST's request-URL length limit
 * (a single `.in()` with a few hundred UUIDs produces a 414 URI Too Long).
 */
export function chunk<T>(items: T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

