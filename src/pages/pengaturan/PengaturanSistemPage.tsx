import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AcademicYearItem, Profile } from '../../types';
import { GoogleDriveService } from '../../services/googleDrive';
import { generateSupabaseSQLScript, generateNeonSQLScript, resetSupabaseClient, resetNeonClient, getSupabaseClient, getNeonSql, INITIAL_PROFILES } from '../../services/supabase';
import { KopSuratPreview } from '../../components/common/KopSuratPreview';
import { Modal } from '../../components/common/Modal';
import { showConfirmModal, showSuccessToast } from '../../components/common/SweetAlert';
import {
  Settings,
  Upload,
  Database,
  Copy,
  Check,
  ShieldAlert,
  HardDrive,
  FileText,
  Calendar,
  Plus,
  CheckCircle2,
  Edit2,
  Trash2,
  Award,
  RotateCcw
} from 'lucide-react';

export const PengaturanSistemPage: React.FC = () => {
  const { user } = useAuth();
  const {
    systemSettings,
    updateSystemSettings,
    academicYears,
    activeAcademicYear,
    addAcademicYear,
    updateAcademicYear,
    setActiveAcademicYear,
    deleteAcademicYear,
    resetAllData
  } = useData();

  const [activeTab, setActiveTab] = useState<'margin_kop' | 'tahun_pelajaran' | 'supabase_sql' | 'reset_data'>('tahun_pelajaran');

  // Academic Year Modal State
  const [isAyModalOpen, setIsAyModalOpen] = useState<boolean>(false);
  const [editingAy, setEditingAy] = useState<AcademicYearItem | null>(null);
  const [ayYear, setAyYear] = useState<string>('2026/2027');
  const [aySemester, setAySemester] = useState<'1' | '2'>('1');
  const [ayIsActive, setAyIsActive] = useState<boolean>(false);

  // Margin State
  const [unit, setUnit] = useState<'mm' | 'cm'>(systemSettings.paperMargin.unit);
  const [top, setTop] = useState<number>(systemSettings.paperMargin.top);
  const [bottom, setBottom] = useState<number>(systemSettings.paperMargin.bottom);
  const [left, setLeft] = useState<number>(systemSettings.paperMargin.left);
  const [right, setRight] = useState<number>(systemSettings.paperMargin.right);

  // Letterhead State
  const [showInPdf, setShowInPdf] = useState<boolean>(systemSettings.letterhead.showInPdf);
  const [heightMm, setHeightMm] = useState<number>(systemSettings.letterhead.heightMm);
  const [imageUrl, setImageUrl] = useState<string>(systemSettings.letterhead.imageUrl);

  // Database State (Neon Postgres & Supabase)
  const [neonDbUrl, setNeonDbUrl] = useState<string>(systemSettings.neonDbUrl || localStorage.getItem('guruku_neon_db_url') || '');
  const [supabaseUrl, setSupabaseUrl] = useState<string>(systemSettings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(systemSettings.supabaseAnonKey || '');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-8 rounded-3xl text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Akses Terbatas</h3>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Pengaturan Sistem hanya dapat diakses oleh Administrator Sekolah.
        </p>
      </div>
    );
  }

  const openCreateAyModal = () => {
    setEditingAy(null);
    setAyYear('2026/2027');
    setAySemester('1');
    setAyIsActive(false);
    setIsAyModalOpen(true);
  };

  const openEditAyModal = (ay: AcademicYearItem) => {
    setEditingAy(ay);
    setAyYear(ay.year);
    setAySemester(ay.semester);
    setAyIsActive(ay.isActive);
    setIsAyModalOpen(true);
  };

  const handleAySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAy) {
      updateAcademicYear(editingAy.id, {
        year: ayYear,
        semester: aySemester,
        isActive: ayIsActive
      });
    } else {
      addAcademicYear({
        year: ayYear,
        semester: aySemester,
        isActive: ayIsActive,
        status: ayIsActive ? 'Aktif' : 'Non-Aktif'
      });
    }
    setIsAyModalOpen(false);
  };

  const handleDeleteAy = async (id: string, name: string) => {
    const confirm = await showConfirmModal(
      'Hapus Tahun Pelajaran',
      `Apakah Anda yakin ingin menghapus data Tahun Pelajaran ${name}?`,
      'Ya, Hapus'
    );
    if (confirm) {
      deleteAcademicYear(id);
    }
  };

  const handleSaveMarginKop = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings({
      paperMargin: { unit, top, bottom, left, right },
      letterhead: {
        ...systemSettings.letterhead,
        showInPdf,
        heightMm,
        imageUrl
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const driveFile = await GoogleDriveService.uploadFile(file, 'System');
      setImageUrl(driveFile.webViewLink);
      showSuccessToast('Gambar Kop Surat berhasil diunggah ke Google Drive!');
    }
  };

  const handleSaveDatabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
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
          // Sync profiles to Neon DB
          const savedTeachersRaw = localStorage.getItem('guruku_teachers');
          let savedTeachers: Profile[] = [];
          if (savedTeachersRaw) {
            try { savedTeachers = JSON.parse(savedTeachersRaw); } catch (err) {}
          }
          const allProfs = [...INITIAL_PROFILES, ...savedTeachers];
          for (const p of allProfs) {
            await neonSql`
              INSERT INTO public.profiles (id, email, username, password, full_name, role, nip_nuptk, phone, avatar_url, created_at, updated_at)
              VALUES (${p.id}, ${p.email}, ${p.username}, ${p.password || 'Gk-123456'}, ${p.fullName}, ${p.role}, ${p.nipNuptk}, ${p.phone}, ${p.avatarUrl}, NOW(), NOW())
              ON CONFLICT (id) DO NOTHING
            `;
          }
          showSuccessToast('KONEKSI NEON DATABASE (SERVERLESS POSTGRES) BERHASIL! Seluruh data akun telah disinkronkan.');
          return;
        }
      } catch (err: any) {
        console.warn('Neon test query failure:', err);
      }
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('profiles').select('id').limit(1);
        if (!error) {
          const savedTeachersRaw = localStorage.getItem('guruku_teachers');
          let savedTeachers: Profile[] = [];
          if (savedTeachersRaw) {
            try { savedTeachers = JSON.parse(savedTeachersRaw); } catch (err) {}
          }
          const allProfs = [...INITIAL_PROFILES, ...savedTeachers];
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
          showSuccessToast('Kredensial disimpan! KONEKSI SUPABASE TERHUBUNG. Seluruh data akun telah disinkronkan.');
          return;
        }
      } catch (err) {
        console.warn(err);
      }
    }
    showSuccessToast('Konfigurasi Database berhasil disimpan.');
  };

  const handleResetDataClick = async () => {
    const confirm = await showConfirmModal(
      'Reset Seluruh Data Aplikasi',
      'Apakah Anda yakin ingin menghapus SELURUH data aplikasi (Mata Pelajaran, Kelas, Siswa, Nilai, Absensi, Jurnal, dan Modul) sehingga aplikasi bersih tanpa data contoh?',
      'Ya, Reset Semua Data'
    );
    if (confirm) {
      resetAllData();
    }
  };

  const sqlScript = generateSupabaseSQLScript();

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setIsCopied(true);
    showSuccessToast('SQL Script disalin ke clipboard!');
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Preview object for KopSuratPreview component
  const currentPreviewSettings = {
    ...systemSettings,
    paperMargin: { unit, top, bottom, left, right },
    letterhead: {
      ...systemSettings.letterhead,
      showInPdf,
      heightMm,
      imageUrl
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#696cff]" /> Pengaturan Sistem & Akademik (Admin)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Atur Tahun Pelajaran aktif, margin cetak PDF, gambar Kop Surat, dan database Supabase</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex-wrap">
          <button
            onClick={() => setActiveTab('tahun_pelajaran')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tahun_pelajaran'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Tahun Pelajaran
          </button>
          <button
            onClick={() => setActiveTab('margin_kop')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'margin_kop'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Margin & Kop Surat
          </button>
          <button
            onClick={() => setActiveTab('supabase_sql')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'supabase_sql'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Supabase & VPS
          </button>
          <button
            onClick={() => setActiveTab('reset_data')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'reset_data'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Data Aplikasi
          </button>
        </div>
      </div>

      {activeTab === 'tahun_pelajaran' && (
        <div className="space-y-6">
          {/* Active Academic Year Highlight Card */}
          <div className="bg-gradient-to-r from-[#696cff] to-indigo-700 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white font-extrabold text-xs backdrop-blur-xs uppercase tracking-wide">
                <Award className="w-3.5 h-3.5" /> Tahun Pelajaran Aktif (Default Aplikasi)
              </span>
              <h3 className="text-2xl font-black tracking-tight">
                Tahun Ajaran {activeAcademicYear.year} — Semester {activeAcademicYear.semester} ({activeAcademicYear.semester === '1' ? 'Ganjil' : 'Genap'})
              </h3>
              <p className="text-xs text-indigo-100 max-w-2xl">
                Tahun pelajaran ini secara otomatis diterapkan sebagai standar pada pembuatan Rombongan Belajar, Penilaian Siswa, Absensi Harian, Jurnal Mengajar Guru, dan Modul Ajar.
              </p>
            </div>
            <button
              onClick={openCreateAyModal}
              className="px-5 py-3 rounded-2xl bg-white text-[#696cff] hover:bg-slate-50 font-black text-xs shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Tahun Pelajaran
            </button>
          </div>

          {/* Academic Years Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#696cff]" /> Daftar Tahun Pelajaran Sekolah
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Kelola status aktif dan buat periode akademik baru</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3.5 px-6">Tahun Pelajaran</th>
                    <th className="py-3.5 px-6">Semester</th>
                    <th className="py-3.5 px-6">Status Sistem</th>
                    <th className="py-3.5 px-6">Tanggal Buat</th>
                    <th className="py-3.5 px-6 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {academicYears.map((ay) => (
                    <tr key={ay.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-extrabold text-slate-800 dark:text-slate-100">
                        {ay.year}
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                        Semester {ay.semester} ({ay.semester === '1' ? 'Ganjil' : 'Genap'})
                      </td>
                      <td className="py-4 px-6">
                        {ay.isActive ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aktif (Default)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold">
                            Non-Aktif
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {ay.createdAt ? ay.createdAt.split('T')[0] : '-'}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {!ay.isActive && (
                          <button
                            onClick={() => setActiveAcademicYear(ay.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Set Aktif
                          </button>
                        )}
                        <button
                          onClick={() => openEditAyModal(ay)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#696cff]/10 text-slate-700 dark:text-slate-200 hover:text-[#696cff] text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        {!ay.isActive && (
                          <button
                            onClick={() => handleDeleteAy(ay.id, `${ay.year} Sem ${ay.semester}`)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-700 dark:text-slate-200 hover:text-rose-500 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal CRUD Academic Year */}
          <Modal
            isOpen={isAyModalOpen}
            onClose={() => setIsAyModalOpen(false)}
            title={editingAy ? 'Edit Tahun Pelajaran' : 'Tambah Tahun Pelajaran Baru'}
          >
            <form onSubmit={handleAySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tahun Pelajaran (Format: YYYY/YYYY) *
                </label>
                <input
                  type="text"
                  required
                  value={ayYear}
                  onChange={(e) => setAyYear(e.target.value)}
                  placeholder="Contoh: 2026/2027"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-[#696cff]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Semester *
                </label>
                <select
                  value={aySemester}
                  onChange={(e) => setAySemester(e.target.value as '1' | '2')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-[#696cff]"
                >
                  <option value="1">Semester 1 (Ganjil)</option>
                  <option value="2">Semester 2 (Genap)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ayIsActive}
                    onChange={(e) => setAyIsActive(e.target.checked)}
                    className="rounded text-[#696cff] focus:ring-[#696cff]"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Aktifkan Langsung Sebagai Default Aplikasi
                  </span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#696cff] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 hover:bg-[#5f61e6]"
                >
                  Simpan Tahun Pelajaran
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {activeTab === 'margin_kop' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <form onSubmit={handleSaveMarginKop} className="space-y-6">
              {/* SECTION 1: MARGIN KERTAS */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#696cff]" /> 1. Pengaturan Margin Kertas PDF
                  </h3>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500">Satuan:</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as 'mm' | 'cm')}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-[#696cff]"
                    >
                      <option value="mm">Milimeter (mm)</option>
                      <option value="cm">Centimeter (cm)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Margin Atas ({unit})</label>
                    <input
                      type="number"
                      value={top}
                      onChange={(e) => setTop(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Margin Bawah ({unit})</label>
                    <input
                      type="number"
                      value={bottom}
                      onChange={(e) => setBottom(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Margin Kiri ({unit})</label>
                    <input
                      type="number"
                      value={left}
                      onChange={(e) => setLeft(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Margin Kanan ({unit})</label>
                    <input
                      type="number"
                      value={right}
                      onChange={(e) => setRight(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: KOP SURAT */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-[#696cff]" /> 2. Gambar Kop Surat (Letterhead)
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInPdf}
                      onChange={(e) => setShowInPdf(e.target.checked)}
                      className="rounded text-[#696cff] focus:ring-[#696cff]"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tampilkan pada Cetak PDF</span>
                  </label>
                </div>

                {/* Upload Box */}
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-[#696cff] transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="kop-image-upload"
                  />
                  <label htmlFor="kop-image-upload" className="cursor-pointer flex flex-col items-center gap-1.5">
                    <Upload className="w-6 h-6 text-[#696cff]" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Unggah Gambar Kop Surat Baru (Simpan ke GDrive)
                    </span>
                    <span className="text-[10px] text-slate-400">PNG atau JPG dengan latar belakang transparan direkomendasikan</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Tinggi Kop Surat (mm)</label>
                    <input
                      type="number"
                      value={heightMm}
                      onChange={(e) => setHeightMm(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setImageUrl(systemSettings.letterhead.imageUrl)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
                    >
                      Reset Gambar Default
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-extrabold text-xs shadow-lg shadow-[#696cff]/30 transition-all"
                >
                  Simpan Pengaturan Margin & Kop Surat
                </button>
              </div>
            </form>
          </div>

          {/* Interactive Live Preview Box */}
          <div className="lg:col-span-5">
            <KopSuratPreview settings={currentPreviewSettings} />
          </div>
        </div>
      )}

      {activeTab === 'supabase_sql' && (
        <div className="space-y-6 animate-fade-in">
          {/* Neon Database (Serverless Postgres) Configuration Form */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Koneksi Database Neon (Serverless Postgres) <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Aktif</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Masukkan URL Koneksi Neon PostgreSQL Anda (format: postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require) untuk sinkronisasi Serverless Postgres instan.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveDatabaseConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Neon Database URL (DATABASE_URL / VITE_NEON_DATABASE_URL)
                </label>
                <input
                  type="text"
                  value={neonDbUrl}
                  onChange={(e) => setNeonDbUrl(e.target.value)}
                  placeholder="postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-3">Konfigurasi Opsional Supabase (Legacy):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Project URL (SUPABASE_URL)
                    </label>
                    <input
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      API Key Anon (SUPABASE_ANON_KEY)
                    </label>
                    <input
                      type="password"
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1Ni..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Terapkan & Hubungkan Neon Database
                </button>
              </div>
            </form>
          </div>

          {/* Neon Serverless Postgres SQL Migration Script Box */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" /> Script SQL Migration Database (Neon Serverless Postgres)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Salin script SQL di bawah ini lalu jalankan di <strong>Neon Console SQL Editor</strong> untuk secara otomatis membuat tabel, relasi, index, dan akun Admin bawaan di Neon.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generateNeonSQLScript());
                  setIsCopied(true);
                  showSuccessToast('Script SQL Neon Postgres disalin ke clipboard!');
                  setTimeout(() => setIsCopied(false), 3000);
                }}
                className="px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer hover:bg-emerald-100"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {isCopied ? 'Tersalin!' : 'Salin Script SQL Neon'}
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 custom-scrollbar">
                {generateNeonSQLScript()}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reset_data' && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl shrink-0">
              <RotateCcw className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Reset Seluruh Data Aplikasi ke Kondisi Awal (Kosong)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                Fitur ini digunakan untuk membersihkan seluruh data aplikasi (Mata Pelajaran, Rombongan Belajar, Data Siswa, Nilai, Absensi Harian, Jurnal Mengajar, dan Modul Ajar) sehingga aplikasi siap digunakan secara resmi dari nol tanpa data contoh/dummy.
              </p>
            </div>
          </div>

          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
            <strong>Peringatan Penting:</strong> Tindakan reset data bersifat permanen dan akan menghapus seluruh entri dummy yang pernah tersimpan. Akun Administrator Anda akan tetap aktif untuk mengelola aplikasi.
          </div>

          <div>
            <button
              onClick={handleResetDataClick}
              className="px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-lg shadow-rose-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Reset Seluruh Data Aplikasi Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
