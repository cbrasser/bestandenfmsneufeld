import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** A point in time, as a student in Switzerland reads it, for example 04.11.2026, 14:30. */
export function formatDateTime(isoTime: string, language: string): string {
  return new Date(isoTime).toLocaleString(`${language}-CH`, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
