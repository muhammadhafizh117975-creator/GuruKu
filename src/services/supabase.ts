import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  getNeonSql,
  resetNeonClient,
  generateNeonSQLScript,
  DEFAULT_KOP_SURAT_SVG,
  DEFAULT_SYSTEM_SETTINGS,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_PROFILES,
  INITIAL_SUBJECTS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_GRADES,
  INITIAL_ATTENDANCE,
  INITIAL_JOURNALS,
  INITIAL_MODULES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_SYSTEM_SETTINGS
} from './neon';

export {
  getNeonSql,
  resetNeonClient,
  generateNeonSQLScript,
  DEFAULT_KOP_SURAT_SVG,
  DEFAULT_SYSTEM_SETTINGS,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_PROFILES,
  INITIAL_SUBJECTS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_GRADES,
  INITIAL_ATTENDANCE,
  INITIAL_JOURNALS,
  INITIAL_MODULES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_SYSTEM_SETTINGS
};

// Helper to create Supabase client dynamically if needed
let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) return supabaseClientInstance;

  const env = (import.meta as any).env || {};
  const url = env.VITE_SUPABASE_URL || localStorage.getItem('guruku_supabase_url');
  const anonKey = env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('guruku_supabase_key');

  if (url && anonKey) {
    try {
      supabaseClientInstance = createClient(url, anonKey);
      return supabaseClientInstance;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }
  return null;
}

export function resetSupabaseClient(url: string, key: string) {
  if (url && key) {
    localStorage.setItem('guruku_supabase_url', url);
    localStorage.setItem('guruku_supabase_key', key);
    supabaseClientInstance = createClient(url, key);
  } else {
    localStorage.removeItem('guruku_supabase_url');
    localStorage.removeItem('guruku_supabase_key');
    supabaseClientInstance = null;
  }
}

export function generateSupabaseSQLScript(): string {
  return generateNeonSQLScript();
}
