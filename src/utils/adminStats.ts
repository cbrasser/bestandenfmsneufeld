import { supabase } from '../lib/supabase';

const KEY_STORAGE = 'admin-key';

/** Kennzahlen eines Fachs; year 0 = alle Jahre zusammen. */
export type TopicStats = {
  division: string;
  year: number;
  subject: string;
  students: number;
  grades: number;
  avg: number;
  median: number;
  stddev: number;
  min: number;
  max: number;
  below4: number;
  hist: number[]; // Anzahl Noten pro halbe Note, Index 0 = 1.0 … Index 10 = 6.0
};

export type AdminStats = {
  generatedAt: string;
  users: {
    total: number;
    withGrades: number;
    active30d: number;
    new30d: number;
    byDivision: Record<string, number>;
  };
  grades: { total: number; avg: number | null; below4: number };
  signups: { week: string; count: number }[];
  topics: TopicStats[];
};

export class AdminAccessError extends Error {}

export function getStoredAdminKey(): string | null {
  try {
    return localStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setStoredAdminKey(key: string | null): void {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

/**
 * Lädt die aggregierte Statistik. Der Schlüssel wird server-seitig gegen
 * admin_keys geprüft (supabase/admin.sql); falsch -> AdminAccessError.
 */
export async function fetchAdminStats(key: string): Promise<AdminStats> {
  if (!supabase) throw new Error('Supabase ist nicht konfiguriert (VITE_SUPABASE_*).');
  const { data, error } = await supabase.rpc('admin_stats', { p_key: key });
  if (error) {
    if (error.code === '42501') throw new AdminAccessError('Schlüssel ungültig.');
    throw new Error(error.message);
  }
  return data as AdminStats;
}
