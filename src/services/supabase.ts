import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

// Default Kop Surat Base64 fallback (stylish vector header badge for demo)
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

// Initial Mock Seed Data
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

// Helper to create Supabase client dynamically
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

// Full Supabase SQL Migration Script Generator for aaPanel VPS / Supabase Dashboard
export function generateSupabaseSQLScript(): string {
  return `-- ============================================================
-- SQL SCHEMA & RLS POLICIES UNTUK APLIKASI GURUKU (SUPABASE)
-- Silakan jalankan script ini di Supabase SQL Editor
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guru')),
  nip_nuptk TEXT,
  phone TEXT,
  avatar_url TEXT,
  avatar_drive_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Admin
INSERT INTO public.profiles (id, email, username, password, full_name, role, nip_nuptk, phone)
VALUES ('user_admin_01', 'admin@guruku.sch.id', 'admin', 'admin123', 'Administrator Sekolah', 'admin', '19800101 200501 1 001', '081234567890')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS and grant public access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- 3. TABLE SUBJECTS (MATA PELAJARAN)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  teacher_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE CLASSES (KELAS)
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  homeroom_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE STUDENTS (SISWA)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nis TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  gender CHAR(1) CHECK (gender IN ('L', 'P')),
  birth_place TEXT,
  birth_date DATE,
  address TEXT,
  parent_phone TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLE GRADES (NILAI)
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignment_score NUMERIC DEFAULT 0,
  daily_score NUMERIC DEFAULT 0,
  pts_score NUMERIC DEFAULT 0,
  pas_score NUMERIC DEFAULT 0,
  final_score NUMERIC DEFAULT 0,
  predicate CHAR(1) CHECK (predicate IN ('A', 'B', 'C', 'D')),
  notes TEXT,
  academic_year TEXT NOT NULL,
  semester CHAR(1) CHECK (semester IN ('1', '2')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLE ATTENDANCE (ABSENSI)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Hadir', 'Izin', 'Sakit', 'Alfa')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLE TEACHING_JOURNALS (JURNAL MENGAJAR)
CREATE TABLE IF NOT EXISTS public.teaching_journals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  time_slot TEXT NOT NULL,
  topic TEXT NOT NULL,
  method TEXT NOT NULL,
  attendee_count INT DEFAULT 0,
  notes TEXT,
  attachment_name TEXT,
  attachment_drive_id TEXT,
  attachment_web_view_link TEXT,
  attachment_web_content_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLE TEACHING_MODULES (ARSIP MODUL AJAR / RPP)
CREATE TABLE IF NOT EXISTS public.teaching_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
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
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLE SYSTEM_SETTINGS (PENGATURAN KOP SURAT & MARGIN)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read & update for system_settings
CREATE POLICY "Allow read all on system_settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow update admin on system_settings" ON public.system_settings FOR ALL USING (true);

-- Allow authenticated users full read access
CREATE POLICY "Allow read all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow read all subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Allow read all classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Allow read all students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow read all grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Allow read all attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow read all journals" ON public.teaching_journals FOR SELECT USING (true);
CREATE POLICY "Allow read all modules" ON public.teaching_modules FOR SELECT USING (true);

-- Allow full mutations for authenticated users
CREATE POLICY "Allow all mutations" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow all subjects mutations" ON public.subjects FOR ALL USING (true);
CREATE POLICY "Allow all classes mutations" ON public.classes FOR ALL USING (true);
CREATE POLICY "Allow all students mutations" ON public.students FOR ALL USING (true);
CREATE POLICY "Allow all grades mutations" ON public.grades FOR ALL USING (true);
CREATE POLICY "Allow all attendance mutations" ON public.attendance FOR ALL USING (true);
CREATE POLICY "Allow all journals mutations" ON public.teaching_journals FOR ALL USING (true);
CREATE POLICY "Allow all modules mutations" ON public.teaching_modules FOR ALL USING (true);

-- 12. ENABLE SUPABASE REALTIME REPLICATION FOR ALL TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teaching_journals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teaching_modules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
`;
}
