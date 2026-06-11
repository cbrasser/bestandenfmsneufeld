import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Cloud-Sync ist nur aktiv, wenn beide Env-Variablen gesetzt sind. */
export const isCloudConfigured = Boolean(url && anonKey);

/**
 * Wir nutzen KEIN Supabase-Auth. Der Zugriff läuft ausschliesslich über
 * RPC-Funktionen, die den Code prüfen. Daher keine Session-Persistenz.
 */
export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
