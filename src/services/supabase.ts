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
  ActivityLog,
  SchoolPrincipal
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
  gradeWeights: {
    assignment: 20,
    daily: 30,
    pts: 25,
    pas: 25
  },
  predicateThresholds: {
    aMin: 88,
    bMin: 78,
    cMin: 68,
    kkmDefault: 75
  },
  schoolInfo: {
    schoolName: 'SMP / SMA UNGGULAN GURUKU INDONESIA',
    address: 'Jl. Pendidikan No. 100, Jakarta Pusat 10110',
    email: 'info@guruku.sch.id',
    phone: '(021) 555-0192',
    timeZone: 'Asia/Jakarta (WIB)',
    dateFormat: 'DD/MM/YYYY',
    academicYearActive: '2025/2026',
    semesterActive: '1'
  },
  documentSettings: {
    logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80',
    digitalSignatureUrl: '',
    schoolStampUrl: ''
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

export const INITIAL_PRINCIPALS: SchoolPrincipal[] = [
  {
    id: 'prn_01',
    fullName: 'Dr. H. Ahmad Dahlan',
    title: 'M.Pd.',
    nip: '19700101 199512 1 002',
    nuptk: '3456789012345678',
    position: 'Kepala Sekolah',
    isActive: true,
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
  gradeWeights: {
    assignment: 20,
    daily: 30,
    pts: 25,
    pas: 25
  },
  predicateThresholds: {
    aMin: 88,
    bMin: 78,
    cMin: 68,
    kkmDefault: 75
  },
  schoolInfo: {
    schoolName: 'SMP NEGERI 1 GURUKU ACADEMIA',
    address: 'Jl. Pendidikan No. 45, Kompleks Akademik, Jakarta Selatan',
    email: 'info@smpn1guruku.sch.id',
    phone: '(021) 7890123',
    timeZone: 'Asia/Jakarta (WIB)',
    dateFormat: 'DD/MM/YYYY',
    academicYearActive: '2025/2026',
    semesterActive: '1'
  },
  documentSettings: {
    logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80',
    digitalSignatureUrl: '',
    schoolStampUrl: ''
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
  const envUrl = (env.VITE_SUPABASE_URL || '').trim();
  const envKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();
  const lsUrl = (localStorage.getItem('guruku_supabase_url') || '').trim();
  const lsKey = (localStorage.getItem('guruku_supabase_key') || '').trim();

  let url = (envUrl || lsUrl).trim();
  let anonKey = (envKey || lsKey).trim();

  if (url) {
    url = url.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  }

  // FIX: log dengan jelas kredensial mana yang dipakai. Kalau ini mencetak
  // "localStorage (per-browser)" di dua browser berbeda, itu tandanya kredensial
  // BELUM di-set sebagai environment variable saat build/deploy — sumber utama
  // kenapa data terlihat beda antar browser.
  if (url && anonKey) {
    const source = envUrl && envKey ? 'environment variable (VITE_SUPABASE_URL/ANON_KEY)' : 'localStorage (per-browser, TIDAK ikut ke browser/perangkat lain)';
    console.info(`[GuruKu] Koneksi Supabase memakai kredensial dari: ${source}`);
  } else {
    console.warn('[GuruKu] Supabase belum terkonfigurasi. Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di environment variable hosting.');
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
// Master SQL Script untuk Inisialisasi & Migrasi Aman Supabase Database (Non-Destructive)
export function generateSupabaseSQLScript(): string {
  return `-- ============================================================
-- AUDIT & MIGRASI AMAN DATABASE SUPABASE GURUKU APP (NON-DESTRUCTIVE)
-- File: supabase.schema.sql
-- Keterangan: Aman dijalankan berkali-kali tanpa menghapus data siswa.
-- Jalankan di: Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TRIGGER FUNCTION UNTUK UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. AUDIT & MIGRASI TABEL PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guru',
  nip_nuptk TEXT,
  phone TEXT,
  avatar_url TEXT,
  avatar_drive_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'guru';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nip_nuptk TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_drive_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Seed Default Admin & Super Admin Profile jika belum ada
INSERT INTO public.profiles (id, email, username, password, full_name, role, nip_nuptk, phone)
VALUES 
  ('user_superadmin_01', 'superadmin@guruku.sch.id', 'superadmin', 'super123', 'Super Admin Utama', 'super_admin', '19750101 199801 1 001', '081111111111'),
  ('user_admin_01', 'admin@guruku.sch.id', 'admin', 'admin123', 'Administrator Sekolah', 'admin', '19800101 200501 1 001', '081234567890')
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. AUDIT & MIGRASI TABEL SUBJECTS (MATA PELAJARAN)
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  teacher_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS teacher_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS set_subjects_updated_at ON public.subjects;
CREATE TRIGGER set_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. AUDIT & MIGRASI TABEL CLASSES (KELAS)
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  homeroom_teacher_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS homeroom_teacher_id TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS set_classes_updated_at ON public.classes;
CREATE TRIGGER set_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. AUDIT & MIGRASI AMAN TABEL STUDENTS (DATA SISWA)
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nis TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  gender CHAR(1) CHECK (gender IN ('L', 'P')),
  birth_place TEXT,
  birth_date DATE,
  address TEXT,
  parent_phone TEXT,
  class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
  grade_id TEXT,
  academic_year_id TEXT,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Lulus', 'Pindah', 'Keluar')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Penambahan Kolom Secara Aman (IF NOT EXISTS)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS nis TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS gender CHAR(1);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS birth_place TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_id TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS grade_id TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS academic_year_id TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Aktif';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Sinkronisasi Kolom 'alamat' jika sebelumnya dibuat dengan nama 'alamat'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'alamat'
  ) THEN
    UPDATE public.students SET address = alamat WHERE address IS NULL AND alamat IS NOT NULL;
  END IF;
END $$;

-- Penambahan Constraint & Safe Check
DO $$
BEGIN
  -- Foreign key class_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_students_class' AND table_name = 'students'
  ) THEN
    ALTER TABLE public.students 
    ADD CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;
  END IF;

  -- Constraint Gender Validation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_students_gender' AND table_name = 'students'
  ) THEN
    ALTER TABLE public.students 
    ADD CONSTRAINT chk_students_gender CHECK (gender IS NULL OR gender IN ('L', 'P'));
  END IF;

  -- Constraint Status Validation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chk_students_status' AND table_name = 'students'
  ) THEN
    ALTER TABLE public.students 
    ADD CONSTRAINT chk_students_status CHECK (status IS NULL OR status IN ('Aktif', 'Lulus', 'Pindah', 'Keluar'));
  END IF;
END $$;

-- Trigger updated_at pada Students
DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Index Performa untuk Tabel Students
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_grade_id ON public.students(grade_id);
CREATE INDEX IF NOT EXISTS idx_students_academic_year_id ON public.students(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);

-- 7. TABEL GRADES (NILAI SISWA)
CREATE TABLE IF NOT EXISTS public.grades (
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

DROP TRIGGER IF EXISTS set_grades_updated_at ON public.grades;
CREATE TRIGGER set_grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. TABEL ATTENDANCE (PRESENSI SISWA)
CREATE TABLE IF NOT EXISTS public.attendance (
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

DROP TRIGGER IF EXISTS set_attendance_updated_at ON public.attendance;
CREATE TRIGGER set_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. TABEL TEACHING_JOURNALS (JURNAL MENGAJAR GURU)
CREATE TABLE IF NOT EXISTS public.teaching_journals (
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

DROP TRIGGER IF EXISTS set_teaching_journals_updated_at ON public.teaching_journals;
CREATE TRIGGER set_teaching_journals_updated_at
  BEFORE UPDATE ON public.teaching_journals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. TABEL TEACHING_MODULES (ARSIP MODUL AJAR / RPP)
CREATE TABLE IF NOT EXISTS public.teaching_modules (
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

DROP TRIGGER IF EXISTS set_teaching_modules_updated_at ON public.teaching_modules;
CREATE TRIGGER set_teaching_modules_updated_at
  BEFORE UPDATE ON public.teaching_modules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. TABEL SYSTEM_SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TABEL SCHOOL_PRINCIPALS (DATA KEPALA SEKOLAH)
CREATE TABLE IF NOT EXISTS public.school_principals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name TEXT NOT NULL,
  title TEXT,
  nip TEXT,
  nuptk TEXT,
  position TEXT DEFAULT 'Kepala Sekolah',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Principal jika belum ada
INSERT INTO public.school_principals (id, full_name, title, nip, nuptk, position, is_active)
VALUES 
  ('prn_01', 'Dr. H. Ahmad Dahlan', 'M.Pd.', '19700101 199512 1 002', '3456789012345678', 'Kepala Sekolah', true)
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS set_school_principals_updated_at ON public.school_principals;
CREATE TRIGGER set_school_principals_updated_at
  BEFORE UPDATE ON public.school_principals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 13. TABEL NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. INDEXES UNTUK KINERJA QUERY DENGAN KECEPATAN TINGGI
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_class_id ON public.grades(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_journals_date ON public.teaching_journals(date);
CREATE INDEX IF NOT EXISTS idx_modules_subject_id ON public.teaching_modules(subject_id);
CREATE INDEX IF NOT EXISTS idx_principals_is_active ON public.school_principals(is_active);

-- 15. ROW LEVEL SECURITY (RLS) POLICIES PERMISSION (RBAC)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_principals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow full access on subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow full access on classes" ON public.classes;
DROP POLICY IF EXISTS "Allow full access on students" ON public.students;
DROP POLICY IF EXISTS "Allow full access on grades" ON public.grades;
DROP POLICY IF EXISTS "Allow full access on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow full access on teaching_journals" ON public.teaching_journals;
DROP POLICY IF EXISTS "Allow full access on teaching_modules" ON public.teaching_modules;
DROP POLICY IF EXISTS "Allow full access on system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow full access on school_principals" ON public.school_principals;

CREATE POLICY "Allow full access on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on teaching_journals" ON public.teaching_journals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on teaching_modules" ON public.teaching_modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on school_principals" ON public.school_principals FOR ALL USING (true) WITH CHECK (true);

-- 15. REFRESH SCHEMA CACHE POSTGREST / SUPABASE
NOTIFY pgrst, 'reload schema';
`;
}
