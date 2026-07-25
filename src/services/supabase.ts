import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
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
export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user_admin_01',
    email: 'admin@guruku.sch.id',
    username: 'admin',
    fullName: 'Dr. Ahmad Sanusi, M.Pd.',
    role: 'admin',
    nipNuptk: '19780312 200212 1 002',
    phone: '081234567890',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user_guru_01',
    email: 'guru.matematika@guruku.sch.id',
    username: 'siti_rahma',
    fullName: 'Siti Rahmawati, S.Pd.',
    role: 'guru',
    nipNuptk: '19850614 201001 2 015',
    phone: '081987654321',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user_guru_02',
    email: 'guru.ipa@guruku.sch.id',
    username: 'budi_santoso',
    fullName: 'Budi Santoso, M.Si.',
    role: 'guru',
    nipNuptk: '19821105 200804 1 008',
    phone: '081311223344',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'subj_01', code: 'MTK-01', name: 'Matematika Terapan', description: 'Aljabar, Geometri, dan Statistika', teacherIds: ['user_guru_01'], createdAt: '2026-01-10' },
  { id: 'subj_02', code: 'IPA-01', name: 'Ilmu Pengetahuan Alam (Fisika & Biologi)', description: 'Konsep Alam dan Ekosistem', teacherIds: ['user_guru_02'], createdAt: '2026-01-10' },
  { id: 'subj_03', code: 'BIN-01', name: 'Bahasa Indonesia', description: 'Literasi dan Penulisan Karya Ilmiah', teacherIds: ['user_guru_01'], createdAt: '2026-01-10' },
  { id: 'subj_04', code: 'ING-01', name: 'Bahasa Inggris', description: 'Grammar and Conversational English', teacherIds: ['user_guru_02'], createdAt: '2026-01-10' }
];

export const INITIAL_CLASSES: ClassRoom[] = [
  { id: 'class_01', name: '7-A', gradeLevel: '7', academicYear: '2025/2026', homeroomTeacherId: 'user_guru_01', createdAt: '2026-01-10' },
  { id: 'class_02', name: '7-B', gradeLevel: '7', academicYear: '2025/2026', homeroomTeacherId: 'user_guru_02', createdAt: '2026-01-10' },
  { id: 'class_03', name: '8-A', gradeLevel: '8', academicYear: '2025/2026', homeroomTeacherId: 'user_guru_01', createdAt: '2026-01-10' }
];

export const INITIAL_STUDENTS: Student[] = [
  { id: 'std_01', nis: '2026001', fullName: 'Aditya Pratama', gender: 'L', birthPlace: 'Jakarta', birthDate: '2012-05-14', address: 'Jl. Merdeka No. 12, Jakarta', parentPhone: '081233445566', classId: 'class_01', className: '7-A', createdAt: '2026-01-10' },
  { id: 'std_02', nis: '2026002', fullName: 'Annisa Tri Hapsari', gender: 'P', birthPlace: 'Bandung', birthDate: '2012-08-20', address: 'Jl. Melati No. 45, Jakarta', parentPhone: '081277889900', classId: 'class_01', className: '7-A', createdAt: '2026-01-10' },
  { id: 'std_03', nis: '2026003', fullName: 'Bayu Wijaya', gender: 'L', birthPlace: 'Bogor', birthDate: '2012-01-30', address: 'Jl. Pajajaran No. 8, Jakarta', parentPhone: '081399887766', classId: 'class_01', className: '7-A', createdAt: '2026-01-10' },
  { id: 'std_04', nis: '2026004', fullName: 'Clarissa Putri', gender: 'P', birthPlace: 'Surabaya', birthDate: '2012-11-12', address: 'Jl. Kenanga No. 3, Jakarta', parentPhone: '081566778899', classId: 'class_02', className: '7-B', createdAt: '2026-01-10' },
  { id: 'std_05', nis: '2026005', fullName: 'Daffa Rizky', gender: 'L', birthPlace: 'Depok', birthDate: '2012-04-05', address: 'Jl. Margonda No. 101, Depok', parentPhone: '081822334455', classId: 'class_02', className: '7-B', createdAt: '2026-01-10' }
];

export const INITIAL_GRADES: Grade[] = [
  { id: 'grd_01', studentId: 'std_01', studentName: 'Aditya Pratama', studentNis: '2026001', subjectId: 'subj_01', subjectName: 'Matematika Terapan', classId: 'class_01', className: '7-A', teacherId: 'user_guru_01', assignmentScore: 85, dailyScore: 88, ptsScore: 90, pasScore: 92, finalScore: 89, predicate: 'A', notes: 'Sangat menguasai konsep aljabar', academicYear: '2025/2026', semester: '1', updatedAt: '2026-07-20' },
  { id: 'grd_02', studentId: 'std_02', studentName: 'Annisa Tri Hapsari', studentNis: '2026002', subjectId: 'subj_01', subjectName: 'Matematika Terapan', classId: 'class_01', className: '7-A', teacherId: 'user_guru_01', assignmentScore: 80, dailyScore: 82, ptsScore: 85, pasScore: 84, finalScore: 83, predicate: 'B', notes: 'Aktif dan dapat meningkatkan logika numerik', academicYear: '2025/2026', semester: '1', updatedAt: '2026-07-20' },
  { id: 'grd_03', studentId: 'std_03', studentName: 'Bayu Wijaya', studentNis: '2026003', subjectId: 'subj_01', subjectName: 'Matematika Terapan', classId: 'class_01', className: '7-A', teacherId: 'user_guru_01', assignmentScore: 75, dailyScore: 78, ptsScore: 70, pasScore: 76, finalScore: 75, predicate: 'C', notes: 'Perlu latihan ekstra soal cerita', academicYear: '2025/2026', semester: '1', updatedAt: '2026-07-20' }
];

export const INITIAL_ATTENDANCE: Attendance[] = [
  { id: 'att_01', date: '2026-07-24', studentId: 'std_01', studentName: 'Aditya Pratama', studentNis: '2026001', classId: 'class_01', subjectId: 'subj_01', teacherId: 'user_guru_01', status: 'Hadir', notes: '', createdAt: '2026-07-24T08:00:00' },
  { id: 'att_02', date: '2026-07-24', studentId: 'std_02', studentName: 'Annisa Tri Hapsari', studentNis: '2026002', classId: 'class_01', subjectId: 'subj_01', teacherId: 'user_guru_01', status: 'Hadir', notes: '', createdAt: '2026-07-24T08:00:00' },
  { id: 'att_03', date: '2026-07-24', studentId: 'std_03', studentName: 'Bayu Wijaya', studentNis: '2026003', classId: 'class_01', subjectId: 'subj_01', teacherId: 'user_guru_01', status: 'Izin', notes: 'Acara keluarga dengan surat ortu', createdAt: '2026-07-24T08:00:00' }
];

export const INITIAL_JOURNALS: TeachingJournal[] = [
  {
    id: 'jrn_01',
    date: '2026-07-24',
    subjectId: 'subj_01',
    subjectName: 'Matematika Terapan',
    classId: 'class_01',
    className: '7-A',
    teacherId: 'user_guru_01',
    teacherName: 'Siti Rahmawati, S.Pd.',
    timeSlot: '07:30 - 09:00 (Jam 1-2)',
    topic: 'Persamaan Linear Satu Variabel',
    method: 'Problem Based Learning (PBL)',
    attendeeCount: 31,
    notes: 'Siswa antusias mengerjakan kuis kelompok di papan tulis.',
    attachmentName: 'Dokumentasi_Kuis_7A.pdf',
    attachmentDriveId: 'gdrive_jrn_102',
    attachmentWebViewLink: 'https://drive.google.com',
    attachmentWebContentLink: 'https://drive.google.com',
    createdAt: '2026-07-24T09:15:00'
  }
];

export const INITIAL_MODULES: TeachingModule[] = [
  {
    id: 'mod_01',
    title: 'Modul Ajar Matematika Kurikulum Merdeka - Bab 1 Persamaan Linear',
    subjectId: 'subj_01',
    subjectName: 'Matematika Terapan',
    classLevel: '7',
    semester: '1',
    academicYear: '2025/2026',
    description: 'Modul Ajar lengkap dengan LKPD, Asesmen Diagnostik & Formatif',
    fileType: 'pdf',
    fileName: 'Modul_Ajar_MTK_Kelas7_Bab1.pdf',
    fileSize: '2.4 MB',
    fileDriveId: 'gdrive_mod_771',
    webViewLink: 'https://drive.google.com',
    webContentLink: 'https://drive.google.com',
    teacherId: 'user_guru_01',
    teacherName: 'Siti Rahmawati, S.Pd.',
    createdAt: '2026-07-15T10:00:00'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act_01',
    userId: 'user_admin_01',
    userName: 'Dr. Ahmad Sanusi, M.Pd.',
    userRole: 'admin',
    action: 'SYSTEM_BOOT',
    details: 'Aplikasi GuruKu berhasil diinisialisasi.',
    timestamp: new Date().toISOString()
  },
  {
    id: 'act_02',
    userId: 'user_guru_01',
    userName: 'Siti Rahmawati, S.Pd.',
    userRole: 'guru',
    action: 'INPUT_NILAI',
    details: 'Menginput nilai Tugas & PTS Matematika Kelas 7-A',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

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
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guru')),
  nip_nuptk TEXT,
  phone TEXT,
  avatar_url TEXT,
  avatar_drive_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
