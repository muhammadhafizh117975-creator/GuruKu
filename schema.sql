-- ====================================================================
-- SISTEM INFORMASI AKADEMIK GURUKU - REVISED DATABASE SCHEMA (PostgreSQL / Supabase)
-- Single Source of Truth for Data Siswa & Management Data Kepala Sekolah
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HELPER FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABEL PROFILES (PENGGUNA SYSTEM / GURU / ADMIN)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guru')),
  nip_nuptk TEXT,
  phone TEXT,
  password TEXT,
  avatar_url TEXT,
  avatar_drive_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. TABEL SUBJECTS (MATA PELAJARAN)
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  teacher_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_subjects_updated_at ON public.subjects;
CREATE TRIGGER trg_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. TABEL CLASSES (KELAS / ROMBEL)
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  homeroom_teacher_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_classes_updated_at ON public.classes;
CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. TABEL STUDENTS (DATA MASTER SISWA - SINGLE SOURCE OF TRUTH)
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
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Lulus', 'Pindah', 'Keluar')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_students_updated_at ON public.students;
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);

-- 7. TABEL SCHOOL_PRINCIPALS (DATA KEPALA SEKOLAH)
CREATE TABLE IF NOT EXISTS public.school_principals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  nip TEXT,
  nuptk TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT 'Kepala Sekolah',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_school_principals_updated_at ON public.school_principals;
CREATE TRIGGER trg_school_principals_updated_at
  BEFORE UPDATE ON public.school_principals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger untuk memastikan HANYA SATU Kepala Sekolah yang berstatus is_active = true
CREATE OR REPLACE FUNCTION ensure_single_active_principal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.school_principals
    SET is_active = false
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_active_principal ON public.school_principals;
CREATE TRIGGER trg_single_active_principal
  BEFORE INSERT OR UPDATE OF is_active ON public.school_principals
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION ensure_single_active_principal();

CREATE INDEX IF NOT EXISTS idx_school_principals_is_active ON public.school_principals(is_active);

-- 8. TABEL GRADES (NILAI SISWA)
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

DROP TRIGGER IF EXISTS trg_grades_updated_at ON public.grades;
CREATE TRIGGER trg_grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_class_id ON public.grades(class_id);

-- 9. TABEL ATTENDANCE (PRESENSI SISWA)
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

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON public.attendance;
CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);

-- 10. TABEL TEACHING_JOURNALS (JURNAL MENGAJAR GURU)
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

DROP TRIGGER IF EXISTS trg_teaching_journals_updated_at ON public.teaching_journals;
CREATE TRIGGER trg_teaching_journals_updated_at
  BEFORE UPDATE ON public.teaching_journals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_journals_date ON public.teaching_journals(date);

-- 11. TABEL TEACHING_MODULES (ARSIP MODUL AJAR / RPP)
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

DROP TRIGGER IF EXISTS trg_teaching_modules_updated_at ON public.teaching_modules;
CREATE TRIGGER trg_teaching_modules_updated_at
  BEFORE UPDATE ON public.teaching_modules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_modules_subject_id ON public.teaching_modules(subject_id);

-- 12. TABEL SYSTEM_SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow write profiles" ON public.profiles;
CREATE POLICY "Allow read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow write profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow write subjects" ON public.subjects;
CREATE POLICY "Allow read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Allow write subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read classes" ON public.classes;
DROP POLICY IF EXISTS "Allow write classes" ON public.classes;
CREATE POLICY "Allow read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Allow write classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read students" ON public.students;
DROP POLICY IF EXISTS "Allow write students" ON public.students;
CREATE POLICY "Allow read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow write students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read school_principals" ON public.school_principals;
DROP POLICY IF EXISTS "Allow write school_principals" ON public.school_principals;
CREATE POLICY "Allow read school_principals" ON public.school_principals FOR SELECT USING (true);
CREATE POLICY "Allow write school_principals" ON public.school_principals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read grades" ON public.grades;
DROP POLICY IF EXISTS "Allow write grades" ON public.grades;
CREATE POLICY "Allow read grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Allow write grades" ON public.grades FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow write attendance" ON public.attendance;
CREATE POLICY "Allow read attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow write attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read teaching_journals" ON public.teaching_journals;
DROP POLICY IF EXISTS "Allow write teaching_journals" ON public.teaching_journals;
CREATE POLICY "Allow read teaching_journals" ON public.teaching_journals FOR SELECT USING (true);
CREATE POLICY "Allow write teaching_journals" ON public.teaching_journals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read teaching_modules" ON public.teaching_modules;
DROP POLICY IF EXISTS "Allow write teaching_modules" ON public.teaching_modules;
CREATE POLICY "Allow read teaching_modules" ON public.teaching_modules FOR SELECT USING (true);
CREATE POLICY "Allow write teaching_modules" ON public.teaching_modules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow write system_settings" ON public.system_settings;
CREATE POLICY "Allow read system_settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow write system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow write notifications" ON public.notifications;
CREATE POLICY "Allow read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow write notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- 15. SEED DATA DUMMY INITIAL KEPALA SEKOLAH
INSERT INTO public.school_principals (id, full_name, title, nip, nuptk, position, is_active)
VALUES 
  ('prn_01', 'Dr. H. Ahmad Dahlan', 'M.Pd.', '19700101 199512 1 002', '3456789012345678', 'Kepala Sekolah', true)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
