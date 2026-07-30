import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getNeonSql, resetNeonClient, generateNeonSQLScript } from './neon';
import {
  AcademicYearItem,
  Profile,
  Subject,
  ClassRoom,
  Student,
  Grade,
  Attendance,
  TeachingJournal,
  TeachingModule,
  SystemSettings,
  ActivityLog
} from '../types';

export { getNeonSql, resetNeonClient, generateNeonSQLScript };

// Default Kop Surat Base64 SVG fallback
export const DEFAULT_KOP_SURAT_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="120" viewBox="0 0 800 120">
  <rect width="800" height="120" fill="%23ffffff"/>
  <path d="M0,0 L800,0 L800,10 L0,10 Z" fill="%23696cff"/>
  <circle cx="65" cy="65" r="35" fill="%23696cff" opacity="0.1"/>
  <path d="M50 75 L65 45 L80 75 Z" fill="%23696cff"/>
  <text x="120" y="45" font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="%232b2c40">PEMERINTAH KOTA GURUKU - DINAS PENDIDIKAN</text>
  <text x="120" y="68" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="%23696cff">SMP / SMA UNGGULAN GURUKU INDONESIA</text>
  <text x="120" y="88" font-family="Arial, sans-serif" font-size="11" fill="%23697a8d">Jl. Pendidikan No. 100, Jakarta Pusat 10110 | Telp: (021) 555-0192 | Email: info@guruku.sch.id</text>
  <line x1="20" y1="106" x2="780" y2="106" stroke="%232b2c40" stroke-width="3"/>
  <line x1="20" y1="110" x2="780" y2="110" stroke="%23696cff" stroke-width="1"/>
</svg>`;

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  paperMargin: {
    unit: 'mm',
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
  },
  letterhead: {
    imageUrl: DEFAULT_KOP_SURAT_SVG,
    heightMm: 35,
    showInPdf: true,
    institutionName: 'SMP / SMA UNGGULAN GURUKU INDONESIA',
    address: 'Jl. Pendidikan No. 100, Jakarta Pusat 10110'
  },
  googleDriveConnected: true,
  googleDriveFolderName: 'GuruKu_Master_Directory',
  updatedAt: new Date().toISOString()
};

export const INITIAL_ACADEMIC_YEARS: AcademicYearItem[] = [
  { id: 'ay_2025_2026_1', year: '2025/2026', semester: '1', isActive: true, status: 'Aktif', createdAt: new Date().toISOString() }
];

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user_admin_01',
    email: 'admin@guruku.sch.id',
    username: 'admin',
    fullName: 'Administrator Sekolah',
    role: 'admin',
    nipNuptk: '19800101 200501 1 001',
    phone: '081234567890',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_SUBJECTS: Subject[] = [];
export const INITIAL_CLASSES: ClassRoom[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_GRADES: Grade[] = [];
export const INITIAL_ATTENDANCE: Attendance[] = [];
export const INITIAL_JOURNALS: TeachingJournal[] = [];
export const INITIAL_MODULES: TeachingModule[] = [];
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  paperMargin: {
    unit: 'mm',
    top: 20,
    bottom: 20,
    left: 25,
    right: 20
  },
  letterhead: {
    imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop&q=80',
    heightMm: 35,
    showInPdf: true,
    institutionName: 'DINAS PENDIDIKAN DAN KEBUDAYAAN SMP NEGERI 1 GURUKU ACADEMIA',
    address: 'Jl. Pendidikan No. 45, Kompleks Akademik, Jakarta Selatan | Telp: (021) 7890123'
  },
  googleDriveConnected: true,
  googleDriveFolderName: 'GuruKu_Storage',
  updatedAt: new Date().toISOString()
};

// Singleton Supabase Client Instance
let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) return supabaseClientInstance;

  const env = (import.meta as any).env || {};
  let url = (env.VITE_SUPABASE_URL || localStorage.getItem('guruku_supabase_url') || '').trim();
  let anonKey = (env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('guruku_supabase_key') || '').trim();

  if (url) {
    url = url.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  }

  if (url && anonKey) {
    try {
      supabaseClientInstance = createClient(url, anonKey);
      return supabaseClientInstance;
    } catch (e) {
      console.warn('Gagal menginisialisasi client Supabase:', e);
    }
  }
  return null;
}

export function resetSupabaseClient(url: string, key: string) {
  let cleanUrl = (url || '').trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  let cleanKey = (key || '').trim();

  if (cleanUrl && cleanKey) {
    localStorage.setItem('guruku_supabase_url', cleanUrl);
    localStorage.setItem('guruku_supabase_key', cleanKey);
    supabaseClientInstance = createClient(cleanUrl, cleanKey);
  } else {
    localStorage.removeItem('guruku_supabase_url');
    localStorage.removeItem('guruku_supabase_key');
    supabaseClientInstance = null;
  }
}

// Exported supabase instance proxy for direct component/context imports
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      if (prop === 'channel') {
        return () => ({
          on: () => ({ subscribe: () => {} }),
          subscribe: () => {}
        });
      }
      if (prop === 'removeChannel') {
        return () => {};
      }
      return undefined;
    }
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  }
});

// Master SQL Script untuk Reset Total & Inisialisasi Ulang Supabase Database
export function generateSupabaseSQLScript(): string {
  return `-- ============================================================
-- MASTER RESET & SETUP DATABASE SUPABASE GURUKU APP
-- File: supabase.schema.sql
-- Run this script in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. DROP EXISTING TABLES & STORAGE POLICIES (TOTAL RESET)
DROP TABLE IF EXISTS public.teaching_modules CASCADE;
DROP TABLE IF EXISTS public.teaching_journals CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop Storage Policies if exist
DROP POLICY IF EXISTS "Public Access Modul Ajar" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Arsip" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Foto Profil" ON storage.objects;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. FUNCTION TO UPDATE UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABEL PROFILES (AKUN USER/GURU/ADMIN/SUPER_ADMIN)
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'guru')),
  nip_nuptk TEXT,
  phone TEXT,
  avatar_url TEXT,
  avatar_drive_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at pada Profiles
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed Default Admin & Super Admin Profile
INSERT INTO public.profiles (id, email, username, password, full_name, role, nip_nuptk, phone)
VALUES 
  ('user_superadmin_01', 'superadmin@guruku.sch.id', 'superadmin', 'super123', 'Super Admin Utama', 'super_admin', '19750101 199801 1 001', '081111111111'),
  ('user_admin_01', 'admin@guruku.sch.id', 'admin', 'admin123', 'Administrator Sekolah', 'admin', '19800101 200501 1 001', '081234567890')
ON CONFLICT (id) DO NOTHING;

-- 5. TABEL SUBJECTS (MATA PELAJARAN)
CREATE TABLE public.subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  teacher_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. TABEL CLASSES (KELAS & TINGKATAN)
CREATE TABLE public.classes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  homeroom_teacher_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. TABEL STUDENTS (DATA SISWA)
CREATE TABLE public.students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nis TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  gender CHAR(1) CHECK (gender IN ('L', 'P')),
  birth_place TEXT,
  birth_date DATE,
  address TEXT,
  parent_phone TEXT,
  class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. TABEL GRADES (NILAI SISWA)
CREATE TABLE public.grades (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignment_score NUMERIC DEFAULT 0,
  daily_score NUMERIC DEFAULT 0,
  pts_score NUMERIC DEFAULT 0,
  pas_score NUMERIC DEFAULT 0,
  final_score NUMERIC DEFAULT 0,
  predicate CHAR(1) CHECK (predicate IN ('A', 'B', 'C', 'D')),
  notes TEXT,
  academic_year TEXT NOT NULL,
  semester CHAR(1) CHECK (semester IN ('1', '2')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. TABEL ATTENDANCE (PRESENSI / ABSENSI SISWA)
CREATE TABLE public.attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL,
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Hadir', 'Izin', 'Sakit', 'Alfa')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. TABEL TEACHING_JOURNALS (JURNAL MENGAJAR GURU)
CREATE TABLE public.teaching_journals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  time_slot TEXT NOT NULL,
  topic TEXT NOT NULL,
  method TEXT NOT NULL,
  attendee_count INT DEFAULT 0,
  notes TEXT,
  attachment_name TEXT,
  attachment_drive_id TEXT,
  attachment_web_view_link TEXT,
  attachment_web_content_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_teaching_journals_updated_at
  BEFORE UPDATE ON public.teaching_journals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. TABEL TEACHING_MODULES (ARSIP MODUL AJAR / RPP)
CREATE TABLE public.teaching_modules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_level TEXT NOT NULL,
  semester CHAR(1) CHECK (semester IN ('1', '2')),
  academic_year TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  file_drive_id TEXT NOT NULL,
  web_view_link TEXT NOT NULL,
  web_content_link TEXT NOT NULL,
  teacher_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_teaching_modules_updated_at
  BEFORE UPDATE ON public.teaching_modules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 12. TABEL SYSTEM_SETTINGS (PENGATURAN KOP SURAT, MARGIN, TAHUN AJARAN)
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SUPABASE STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('modul-ajar', 'modul-ajar', true),
  ('arsip', 'arsip', true),
  ('foto-profil', 'foto-profil', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
CREATE POLICY "Public Read/Write Modul Ajar" ON storage.objects
  FOR ALL USING (bucket_id = 'modul-ajar') WITH CHECK (bucket_id = 'modul-ajar');

CREATE POLICY "Public Read/Write Arsip" ON storage.objects
  FOR ALL USING (bucket_id = 'arsip') WITH CHECK (bucket_id = 'arsip');

CREATE POLICY "Public Read/Write Foto Profil" ON storage.objects
  FOR ALL USING (bucket_id = 'foto-profil') WITH CHECK (bucket_id = 'foto-profil');

-- 14. INDEXES UNTUK PERFORMA OPTIMAL
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_class_id ON public.grades(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_journals_date ON public.teaching_journals(date);
CREATE INDEX IF NOT EXISTS idx_modules_subject_id ON public.teaching_modules(subject_id);

-- 15. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on teaching_journals" ON public.teaching_journals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on teaching_modules" ON public.teaching_modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- 16. SUPABASE REALTIME PUBLICATION
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT;
`;
}
