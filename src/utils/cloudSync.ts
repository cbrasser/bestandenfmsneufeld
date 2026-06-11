import { supabase, isCloudConfigured } from '../lib/supabase';
import type { StudentData } from '../types';

const CODE_KEY = 'cloud-code';

// Eindeutige Zeichen (ohne 0/O, 1/I/L) -> weniger Tippfehler beim Abschreiben.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Erzeugt einen kryptografisch zufälligen Code (16 Zeichen ~ 79 bit Entropie).
 * Rückgabe ist die "kanonische" Form ohne Bindestriche (so wird auch gehasht).
 */
export function generateCode(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

/** Nutzereingabe -> kanonische Form (Grossbuchstaben, nur A-Z/0-9). */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Kanonischer Code -> hübsche Anzeige in 4er-Gruppen (XXXX-XXXX-...). */
export function formatCode(code: string): string {
  return (code.match(/.{1,4}/g) ?? [code]).join('-');
}

export function getStoredCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}

export function setStoredCode(code: string): void {
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {
    /* ignore */
  }
}

export function clearStoredCode(): void {
  try {
    localStorage.removeItem(CODE_KEY);
  } catch {
    /* ignore */
  }
}

export const cloudSync = {
  /** true, wenn VITE_SUPABASE_* gesetzt sind. */
  isConfigured: isCloudConfigured,

  /**
   * Legt ein neues "Konto" an, speichert die aktuellen Daten und gibt den
   * frisch erzeugten (kanonischen) Code zurück. Der Code wird lokal gemerkt.
   */
  async createAccount(data: StudentData): Promise<string> {
    if (!supabase) throw new Error('Cloud-Sync ist nicht konfiguriert.');
    const code = generateCode();
    const { error } = await supabase.rpc('create_account', {
      p_code: code,
      p_data: data,
    });
    if (error) throw error;
    setStoredCode(code);
    return code;
  },

  /**
   * Lädt die Daten zu einem Code. Gibt null zurück, wenn der Code unbekannt ist.
   */
  async load(code: string): Promise<StudentData | null> {
    if (!supabase) throw new Error('Cloud-Sync ist nicht konfiguriert.');
    const canonical = normalizeCode(code);
    const { data, error } = await supabase.rpc('load_data', { p_code: canonical });
    if (error) throw error;
    return (data as StudentData | null) ?? null;
  },

  /**
   * Speichert die Daten zu einem Code. Gibt false zurück, wenn der Code
   * (server-seitig) nicht existiert.
   */
  async save(code: string, data: StudentData): Promise<boolean> {
    if (!supabase) return false;
    const canonical = normalizeCode(code);
    const { data: ok, error } = await supabase.rpc('save_data', {
      p_code: canonical,
      p_data: data,
    });
    if (error) throw error;
    return Boolean(ok);
  },
};
