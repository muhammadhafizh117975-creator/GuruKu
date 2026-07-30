import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { resetSupabaseClient, resetNeonClient, generateSupabaseSQLScript, generateNeonSQLScript, getSupabaseClient, getNeonSql, INITIAL_PROFILES } from '../../services/supabase';
import { showSuccessToast } from '../../components/common/SweetAlert';
import { Profile } from '../../types';
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
  Layers,
  Save,
  RefreshCw,
  Table,
  GitFork,
  Radio
} from 'lucide-react';

export const PanduanAdminPage: React.FC = () => {
  const { systemSettings, updateSystemSettings, teachers } = useData();

  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'supabase' | 'gdrive' | 'checklist'>('supabase');

  // Database Credentials State
  const [neonDbUrl, setNeonDbUrl] = useState<string>(systemSettings.neonDbUrl || localStorage.getItem('guruku_neon_db_url') || '');
  const [supabaseUrl, setSupabaseUrl] = useState<string>(systemSettings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(systemSettings.supabaseAnonKey || '');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSaveDatabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    if (neonDbUrl) {
      resetNeonClient(neonDbUrl);
    }
    if (supabaseUrl && supabaseAnonKey) {
      resetSupabaseClient(supabaseUrl, supabaseAnonKey);
    }
    updateSystemSettings({
      neonDbUrl,
      supabaseUrl,
      supabaseAnonKey
    });

    const neonSql = getNeonSql();
    if (neonSql) {
      try {
        const rows = await neonSql`SELECT id FROM public.profiles LIMIT 1`;
        if (rows) {
          const allProfs = [...INITIAL_PROFILES, ...teachers];
          for (const p of allProfs) {
            await neonSql`
              INSERT INTO public.profiles (id, email, username, password, full_name, role, nip_nuptk, phone, avatar_url, created_at, updated_at)
              VALUES (${p.id}, ${p.email}, ${p.username}, ${p.password || 'Gk-123456'}, ${p.fullName}, ${p.role}, ${p.nipNuptk}, ${p.phone}, ${p.avatarUrl}, NOW(), NOW())
              ON CONFLICT (id) DO NOTHING
            `;
          }
          showSuccessToast('Kredensial Disimpan! KONEKSI NEON DATABASE (SERVERLESS POSTGRES) BERHASIL & Data disinkronkan.');
          setIsSyncing(false);
          return;
        }
      } catch (err) {
        console.warn(err);
      }
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('profiles').select('id').limit(1);
        if (!error) {
          const allProfs = [...INITIAL_PROFILES, ...teachers];
          for (const p of allProfs) {
            await client.from('profiles').upsert({
              id: p.id,
              email: p.email,
              username: p.username,
              password: p.password || 'Gk-123456',
              full_name: p.fullName,
              role: p.role,
              nip_nuptk: p.nipNuptk,
              phone: p.phone,
              avatar_url: p.avatarUrl,
              created_at: p.createdAt,
              updated_at: p.updatedAt
            });
          }
          showSuccessToast('Kredensial disimpan! KONEKSI DATABASE TERHUBUNG & Data akun telah disinkronkan.');
          setIsSyncing(false);
          return;
        }
      } catch (err) {
        console.warn(err);
      }
    }
    showSuccessToast('Konfigurasi Database Runtime berhasil diperbarui.');
    setIsSyncing(false);
  };

  // Checklist items
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    supa_proj: true,
    supa_tables: true,
    supa_relasi: true,
    supa_realtime: true,
    supa_env: true,
    gdrive_proj: true,
    gdrive_api: true,
    gdrive_sa: true,
    gdrive_folder: true
  });

  const toggleCheck = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sqlSchemaScript = generateSupabaseSQLScript();

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
            Panduan Lengkap Setup Database Supabase & Infrastruktur GuruKu
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Petunjuk konfigurasi pusat data Supabase (Realtime, Table Editor, Relasi, RLS) dan Google Drive API agar seluruh akun Guru & Admin dapat mengakses aplikasi dari browser & perangkat mana saja secara sinkron.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'supabase'
                ? 'bg-[#696cff] text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Database className="w-4 h-4" /> 1. Panduan Konfigurasi Supabase
          </button>
          <button
            onClick={() => setActiveTab('gdrive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'gdrive'
                ? 'bg-[#696cff] text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <HardDrive className="w-4 h-4" /> 2. Setup Google Drive API
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
          {/* Detailed 5 Steps Guide */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-8">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                <Database className="w-6 h-6 text-[#696cff]" /> Langkah-Langkah Konfigurasi Supabase Database
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ikuti 5 langkah utama berikut untuk memasang database cloud Supabase, mengonfigurasikan tabel, relasi, RLS, serta menyinkronkan data secara realtime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#696cff] text-white font-extrabold text-xs flex items-center justify-center">
                    1
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#696cff]/10 text-[#696cff]">
                    Proyek Supabase
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Membuat Project Supabase</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Buka{' '}
                  <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#696cff] hover:underline font-bold inline-flex items-center gap-0.5">
                    supabase.com <ExternalLink className="w-3 h-3" />
                  </a>
                  , login/register, lalu klik <strong>New Project</strong>. Beri nama proyek (contoh: <code>GuruKu-Database</code>), tentukan Password Database, dan pilih region terdekat (misal: Singapore).
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#696cff] text-white font-extrabold text-xs flex items-center justify-center">
                    2
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                    Table & SQL Editor
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-emerald-500" /> Membuat Database & Tabel
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Anda dapat membuat tabel melalui menu <strong>Table Editor</strong> di Supabase, atau lebih praktis salin script SQL di bawah ini dan jalankan di menu <strong>SQL Editor</strong> untuk menginstalasikan 9 tabel utama secara otomatis.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#696cff] text-white font-extrabold text-xs flex items-center justify-center">
                    3
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                    Foreign Keys
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <GitFork className="w-4 h-4 text-indigo-500" /> Mengatur Relasi Antar Tabel
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tabel <code>grades</code>, <code>attendance</code>, <code>teaching_journals</code>, dan <code>teaching_modules</code> secara otomatis terhubung ke tabel <code>profiles</code>, <code>students</code>, <code>classes</code>, dan <code>subjects</code> via Kunci Asing (Foreign Keys & Cascade Delete).
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#696cff] text-white font-extrabold text-xs flex items-center justify-center">
                    4
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                    Realtime & RLS
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-amber-500" /> Realtime & Row Level Security
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Script SQL di bawah ini akan mengaktifkan <strong>Row Level Security (RLS)</strong> untuk semua tabel dengan kebijakan izin operasi, serta mendaftarkan seluruh tabel ke publikasi <code>supabase_realtime</code>.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3 col-span-1 md:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-[#696cff] text-white font-extrabold text-xs flex items-center justify-center">
                    5
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#696cff]/10 text-[#696cff]">
                    Environment & Sinkronisasi
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-[#696cff]" /> Sinkronisasi Kredensial & File .env
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Buka menu <strong>Project Settings &gt; API</strong> di Supabase untuk menyalin <code>Project URL</code> dan <code>anon / public key</code>. Simpan dalam file <code>.env</code> project (sebagai <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code>) atau langsung masukkan pada formulir di bawah ini agar aplikasi terhubung secara instan di semua perangkat.
                </p>
              </div>
            </div>

            {/* Form Input Live Credentials */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#696cff]" /> Hubungkan Kredensial Database Supabase
                </h3>
                <span className="text-[11px] font-bold text-[#696cff] bg-[#696cff]/10 px-2.5 py-1 rounded-lg">
                  Akses Multi-Browser & Multi-Perangkat 24/7
                </span>
              </div>

              <form onSubmit={handleSaveDatabaseConfig} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">VITE_SUPABASE_URL</label>
                    <input
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">VITE_SUPABASE_ANON_KEY</label>
                    <input
                      type="password"
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="px-5 py-2.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Simpan Kredensial & Hubungkan Supabase'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* SQL Script Box */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#696cff]" /> Master Script SQL Installation Database
                  </h3>
                  <p className="text-xs text-slate-400">
                    Buka menu <strong>SQL Editor</strong> pada dashboard Supabase Anda, tempelkan (paste) script ini lalu klik <strong>RUN</strong>.
                  </p>
                </div>

                <button
                  onClick={handleCopySql}
                  className="px-4 py-2 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin Script SQL Supabase'}</span>
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
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
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
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Interactive Setup Readiness Checklist
          </h2>
          <p className="text-xs text-slate-400">
            Tandai setiap langkah di bawah ini untuk memastikan seluruh infrastruktur telah siap diproduksi:
          </p>

          <div className="space-y-2 pt-2">
            {[
              { id: 'supa_proj', label: 'Proyek Supabase telah dibuat di Supabase.com' },
              { id: 'supa_tables', label: 'Seluruh 9 Tabel utama dibuat via SQL Editor / Table Editor' },
              { id: 'supa_relasi', label: 'Relasi antar tabel (Foreign Keys & Constraints) telah terpasang' },
              { id: 'supa_realtime', label: 'Fitur Supabase Realtime & RLS Policies telah diaktifkan' },
              { id: 'supa_env', label: 'Supabase URL & Anon Key dikonfigurasi di file .env dan Setup Admin' },
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
