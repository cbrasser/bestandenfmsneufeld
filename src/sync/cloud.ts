import { supabase } from '../lib/supabase';
import { createSyncEngine, type SyncEngine } from './engine';
import { createSupabaseRemote } from './supabaseRemote';
import { createWebSyncStore } from './webStore';

const store = createWebSyncStore(() => localStorage);

/** This browser's sync, or null when the site is built without Supabase values. */
export const syncEngine: SyncEngine | null = supabase
  ? createSyncEngine({ store, remote: createSupabaseRemote(supabase) })
  : null;

export const onCloudData = store.onCloudData;
