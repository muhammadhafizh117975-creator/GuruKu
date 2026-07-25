import React, { useState } from 'react';
import { showSuccessToast } from '../../components/common/SweetAlert';
import {
  ShieldAlert,
  Database,
  HardDrive,
  Copy,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Settings,
  Key,
  Server,
  Terminal,
  Check,
  FolderTree,
  Lock,
  Layers
} from 'lucide-react';

export const PanduanAdminPage: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'supabase' | 'gdrive' | 'checklist'>('supabase');

  // Checklist items
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    supa_proj: true,
    supa_auth: true,
    supa_tables: true,
    supa_realtime: true,
    supa_keys: false,
    gdrive_proj: true,
    gdrive_api: true,
    gdrive_sa: true,
    gdrive_folder: true
  });

  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sqlSchemaScript = `-- ==========================================
-- SCRIPT SKEMA DATABASE GURUKU SUPABASE
-- Silakan jalankan script ini di SQL Editor Supabase
-- ==========================================

-- 1. Buat Tabel Data Guru
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  nip_nuptk TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'guru',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buat Tabel Mata Pelajaran
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Umum',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Buat Tabel Kelas & Tingkat
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  homeroom_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Buat Tabel Data Siswa
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nisn TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Buat Tabel Nilai Siswa
CREATE TABLE IF NOT EXISTS public.student_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  daily_score NUMERIC DEFAULT 0,
  pts_score NUMERIC DEFAULT 0,
  pas_score NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Buat Tabel Presensi / Absensi
CREATE TABLE IF NOT EXISTS public.attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL, -- 'Hadir', 'Izin', 'Sakit', 'Alfa'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Buat Tabel Jurnal Mengajar
CREATE TABLE IF NOT EXISTS public.teaching_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  materi TEXT NOT NULL,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Buat Tabel Arsip Modul Ajar / RPP (Google Drive)
CREATE TABLE IF NOT EXISTS public.teaching_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_level TEXT NOT NULL,
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  file_drive_id TEXT,
  web_view_link TEXT,
  web_content_link TEXT,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Buat Tabel Pengaturan Sistem
CREATE TABLE IF NOT EXISTS public.system_settings (
  id INT PRIMARY KEY DEFAULT 1,
  paper_margin JSONB,
  letterhead JSONB,
  google_drive_connected BOOLEAN DEFAULT true,
  google_drive_folder_name TEXT DEFAULT 'GuruKu_Storage',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Mengaktifkan Row Level Security (RLS)
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 11. Kebijakan RLS (Public Read / Authenticated Write)
CREATE POLICY "Public Read Access" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.student_grades FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.attendances FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.teaching_journals FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.teaching_modules FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.system_settings FOR SELECT USING (true);

-- 12. Mengaktifkan Fitur Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.teachers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_grades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teaching_journals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teaching_modules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaScript);
    setCopiedSql(true);
    showSuccessToast('Script SQL Supabase berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1e1e38] to-slate-900 p-8 rounded-3xl text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[#696cff]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#696cff]/20 text-[#696cff] border border-[#696cff]/30 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> Khusus Administrator Sekolah
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Panduan Complete Setup Infrastructure GuruKu
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Ikuti instruksi langkah demi langkah ini untuk menghubungkan database Supabase (Authentication & Realtime) dan Google Drive API sebagai pusat penyimpanan dokumen sekolah.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'supabase'
                ? 'bg-[#696cff] text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Database className="w-4 h-4" /> 1. Setup Supabase
          </button>
          <button
            onClick={() => setActiveTab('gdrive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'gdrive'
                ? 'bg-[#696cff] text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <HardDrive className="w-4 h-4" /> 2. Setup Google Drive API
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'checklist'
                ? 'bg-[#696cff] text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" /> Checklist Kesiapan
          </button>
        </div>
      </div>

      {/* SECTION 1: SUPABASE SETUP */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          {/* Step Steps */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
              <Database className="w-5 h-5 text-[#696cff]" /> Langkah-langkah Konfigurasi Supabase
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-[#696cff] text-white font-extrabold text-xs flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Buat Project Supabase Baru</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kunjungi{' '}
                  <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#696cff] hover:underline font-semibold inline-flex items-center gap-0.5">
                    supabase.com <ExternalLink className="w-3 h-3" />
                  </a>
                  , buat akun baru, lalu klik "New Project". Isikan nama project misal "GuruKu Academia" dan set Password Database.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-[#696cff] text-white font-extrabold text-xs flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Aktifkan Authentication</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Buka menu <strong>Authentication &gt; Providers</strong> di dashboard Supabase Anda. Pastikan Provider <strong>Email / Password</strong> dalam status Enabled.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-[#696cff] text-white font-extrabold text-xs flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Dapatkan API URL & Anon Key</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Buka menu <strong>Project Settings &gt; API</strong>. Salin <code>Project URL</code> dan <code>anon / public key</code>. Inputkan di menu Pengaturan Sistem aplikasi ini.
                </p>
              </div>
            </div>

            {/* SQL Script Box */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#696cff]" /> SQL Schema Installation Script
                  </h3>
                  <p className="text-xs text-slate-400">
                    Buka menu <strong>SQL Editor</strong> di dashboard Supabase, tempelkan (paste) script berikut lalu klik <strong>RUN</strong>.
                  </p>
                </div>

                <button
                  onClick={handleCopySql}
                  className="px-4 py-2 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 transition-all flex items-center gap-1.5"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin SQL Script'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 max-h-96 overflow-y-auto custom-scrollbar">
                <pre>{sqlSchemaScript}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: GOOGLE DRIVE SETUP */}
      {activeTab === 'gdrive' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
              <HardDrive className="w-5 h-5 text-emerald-500" /> Panduan Menghubungkan 1 Akun Google Drive Utama
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Seluruh file Modul Ajar, RPP, Kop Surat, dan foto profil sekolah tersimpan terpusat di 1 akun Google Drive sekolah agar tidak boros penyimpanan lokal.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Buat Google Cloud Project</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Buka{' '}
                  <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-[#696cff] font-semibold hover:underline inline-flex items-center gap-0.5">
                    Google Cloud Console <ExternalLink className="w-3 h-3" />
                  </a>
                  , buat proyek baru dengan nama "GuruKu-Drive-Storage".
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Aktifkan API Google Drive</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Buka menu <strong>APIs & Services &gt; Library</strong>. Cari "Google Drive API" dan klik <strong>ENABLE</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Buat Service Account & Key</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Buka <strong>Credentials &gt; Create Credentials &gt; Service Account</strong>. Setelah dibuat, buka tab <strong>KEYS</strong> lalu pilih <strong>Add Key &gt; Create New Key (JSON)</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                4
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Bagikan Folder Root Google Drive Sekolah</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Buka Google Drive utama sekolah Anda, buat folder bernama <code>GuruKu_Storage</code>. Klik kanan folder, pilih <strong>Share / Bagikan</strong>, lalu masukkan email Service Account (misal: <i>guruku-sa@project.iam.gserviceaccount.com</i>) dengan akses <strong>Editor</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <FolderTree className="w-4 h-4 text-emerald-500" /> Standar Folder: /GuruKu_Storage/Modules/ & /GuruKu_Storage/System/
            </div>
            <span className="text-[10px] uppercase font-black bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded-md">
              Terhubung Otomatis
            </span>
          </div>
        </div>
      )}

      {/* SECTION 3: CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Interactive Setup Readiness Checklist
          </h2>
          <p className="text-xs text-slate-400">
            Tandai setiap langkah di bawah ini untuk memastikan seluruh infrastruktur telah siap diproduksi:
          </p>

          <div className="space-y-2 pt-2">
            {[
              { id: 'supa_proj', label: 'Project Supabase telah dibuat' },
              { id: 'supa_auth', label: 'Authentication Provider Email/Password diaktifkan' },
              { id: 'supa_tables', label: 'Tabel database telah di-install melalui SQL Editor' },
              { id: 'supa_realtime', label: 'Fitur Supabase Realtime telah di-enable untuk publikasi' },
              { id: 'supa_keys', label: 'Supabase URL & Anon Key telah diinput di Pengaturan Sistem' },
              { id: 'gdrive_proj', label: 'Google Cloud Project telah disiapkan' },
              { id: 'gdrive_api', label: 'Google Drive API telah di-Enable' },
              { id: 'gdrive_sa', label: 'Service Account & JSON Key telah dikonfigurasi' },
              { id: 'gdrive_folder', label: 'Folder GuruKu_Storage di Google Drive telah dibagikan akses Editor' }
            ].map((item) => (
              <label
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  checklist[item.id]
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-slate-800 dark:text-slate-100'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="text-xs font-bold flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs ${
                      checklist[item.id] ? 'bg-emerald-500 text-white' : 'border border-slate-400'
                    }`}
                  >
                    {checklist[item.id] && <Check className="w-3.5 h-3.5" />}
                  </span>
                  {item.label}
                </span>

                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                    checklist[item.id]
                      ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {checklist[item.id] ? 'Selesai' : 'Belum'}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
