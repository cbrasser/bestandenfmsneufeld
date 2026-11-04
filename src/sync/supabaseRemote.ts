import type { SupabaseClient } from '@supabase/supabase-js';
import type { StudentData } from '../types';
import type { CloudSnapshot, SaveResult, SyncRemote } from './engine';

type LoadResponse = { data: StudentData; version: number; updated_at: string } | null;

type SaveResponse =
  | { status: 'saved' | 'conflict'; version: number; updated_at: string }
  | { status: 'unknown_code' };

/** The sync calls of the database's API contract, see supabase/migrations. */
export function createSupabaseRemote(client: SupabaseClient): SyncRemote {
  return {
    async createAccount(code, data) {
      const { error } = await client.rpc('create_account', { p_code: code, p_data: data });
      if (error) throw error;
    },

    async delete(code) {
      const { data, error } = await client.rpc('delete_student', { p_code: code });
      if (error) throw error;
      return data as boolean;
    },

    async load(code): Promise<CloudSnapshot | null> {
      const { data, error } = await client.rpc('load_student', { p_code: code });
      if (error) throw error;
      const row = data as LoadResponse;
      return row && { data: row.data, version: row.version, updatedAt: row.updated_at };
    },

    async save(code, studentData, expectedVersion): Promise<SaveResult> {
      const { data, error } = await client.rpc('save_student', {
        p_code: code,
        p_data: studentData,
        p_expected_version: expectedVersion,
      });
      if (error) throw error;
      const result = data as SaveResponse;
      return result.status === 'unknown_code'
        ? result
        : { status: result.status, version: result.version, updatedAt: result.updated_at };
    },
  };
}
