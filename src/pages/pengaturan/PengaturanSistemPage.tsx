import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AcademicYearItem } from '../../types';
import { GoogleDriveService } from '../../services/googleDrive';
import { generateSupabaseSQLScript, resetSupabaseClient, resetNeonClient, getSupabaseClient, getNeonSql, INITIAL_PROFILES } from '../../services/supabase';
import { KopSuratPreview } from '../../components/common/KopSuratPreview';
import { Modal } from '../../components/common/Modal';
import { showConfirmModal, showSuccessToast, showErrorToast } from '../../components/common/SweetAlert';
import {
  Settings,
  Upload,
  Database,
  Copy,
  Check,
  ShieldAlert,
  FileText,
  Calendar,
  Plus,
  CheckCircle2,
  Edit2,
  Trash2,
  Award,
  RotateCcw,
  Building2,
  Globe,
  Sliders,
  CheckSquare,
  AlertCircle,
  HardDrive,
  Terminal,
  FolderTree,
  ExternalLink,
  GitFork,
  Radio,
  Table,
  Save,
  RefreshCw,
  Lock,
  Key,
  Server,
  Layers
} from 'lucide-react';

interface PengaturanSistemPageProps {
  defaultTab?: 'akademik' | 'dokumen' | 'sistem' | 'admin' | 'database';
}

export const PengaturanSistemPage: React.FC<PengaturanSistemPageProps> = ({ defaultTab = 'akademik' }) => {
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
    teachers,
    resetAllData
  } = useData();

  const [activeTab, setActiveTab] = useState<'akademik' | 'dokumen' | 'sistem' | 'admin' | 'database'>(defaultTab);

  // Admin Management State
  const [copiedAdminSql, setCopiedAdminSql] = useState<boolean>(false);
  const [adminSubTab, setAdminSubTab] = useState<'supabase' | 'gdrive' | 'checklist'>('supabase');
  const [adminChecklist, setAdminChecklist] = useState<Record<string, boolean>>({
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

  const toggleAdminCheck = (key: string) => {
    setAdminChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Academic Year Modal State
  const [isAyModalOpen, setIsAyModalOpen] = useState<boolean>(false);
  const [editingAy, setEditingAy] = useState<AcademicYearItem | null>(null);
  const [ayYear, setAyYear] = useState<string>('2026/2027');
  const [aySemester, setAySemester] = useState<'1' | '2'>('1');
  const [ayIsActive, setAyIsActive] = useState<boolean>(false);

  // 1. Grade Weights State
  const [assignmentWeight, setAssignmentWeight] = useState<number>(systemSettings?.gradeWeights?.assignment ?? 20);
  const [dailyWeight, setDailyWeight] = useState<number>(systemSettings?.gradeWeights?.daily ?? 30);
  const [ptsWeight, setPtsWeight] = useState<number>(systemSettings?.gradeWeights?.pts ?? 25);
  const [pasWeight, setPasWeight] = useState<number>(systemSettings?.gradeWeights?.pas ?? 25);

  // Predicates & KKM State
  const [aMin, setAMin] = useState<number>(systemSettings?.predicateThresholds?.aMin ?? 88);
  const [bMin, setBMin] = useState<number>(systemSettings?.predicateThresholds?.bMin ?? 78);
  const [cMin, setCMin] = useState<number>(systemSettings?.predicateThresholds?.cMin ?? 68);
  const [kkmDefault, setKkmDefault] = useState<number>(systemSettings?.predicateThresholds?.kkmDefault ?? 75);

  // 2. Document & Kop Surat State
  const [unit, setUnit] = useState<'mm' | 'cm'>(systemSettings.paperMargin.unit);
  const [top, setTop] = useState<number>(systemSettings.paperMargin.top);
  const [bottom, setBottom] = useState<number>(systemSettings.paperMargin.bottom);
  const [left, setLeft] = useState<number>(systemSettings.paperMargin.left);
  const [right, setRight] = useState<number>(systemSettings.paperMargin.right);

  const [showInPdf, setShowInPdf] = useState<boolean>(systemSettings.letterhead.showInPdf);
  const [heightMm, setHeightMm] = useState<number>(systemSettings.letterhead.heightMm);
  const [imageUrl, setImageUrl] = useState<string>(systemSettings.letterhead.imageUrl);
  const [institutionName, setInstitutionName] = useState<string>(systemSettings.letterhead.institutionName ?? 'DINAS PENDIDIKAN DAN KEBUDAYAAN SMP NEGERI 1 GURUKU ACADEMIA');
  const [letterheadAddress, setLetterheadAddress] = useState<string>(systemSettings.letterhead.address ?? 'Jl. Pendidikan No. 45, Kompleks Akademik, Jakarta Selatan | Telp: (021) 7890123');

  const [logoUrl, setLogoUrl] = useState<string>(systemSettings?.documentSettings?.logoUrl ?? 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80');
  const [digitalSignatureUrl, setDigitalSignatureUrl] = useState<string>(systemSettings?.documentSettings?.digitalSignatureUrl ?? '');
  const [schoolStampUrl, setSchoolStampUrl] = useState<string>(systemSettings?.documentSettings?.schoolStampUrl ?? '');

  // 3. School Info & System Regional State
  const [schoolName, setSchoolName] = useState<string>(systemSettings?.schoolInfo?.schoolName ?? 'SMP NEGERI 1 GURUKU ACADEMIA');
  const [schoolAddress, setSchoolAddress] = useState<string>(systemSettings?.schoolInfo?.address ?? 'Jl. Pendidikan No. 45, Kompleks Akademik, Jakarta Selatan');
  const [schoolEmail, setSchoolEmail] = useState<string>(systemSettings?.schoolInfo?.email ?? 'info@smpn1guruku.sch.id');
  const [schoolPhone, setSchoolPhone] = useState<string>(systemSettings?.schoolInfo?.phone ?? '(021) 7890123');
  const [timeZone, setTimeZone] = useState<string>(systemSettings?.schoolInfo?.timeZone ?? 'Asia/Jakarta (WIB)');
  const [dateFormat, setDateFormat] = useState<string>(systemSettings?.schoolInfo?.dateFormat ?? 'DD/MM/YYYY');

  // 4. Database Credentials State
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

  // Academic Year Handlers
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

  // 1. Save Academic & Grade Weights Settings
  const totalGradeWeight = Number(assignmentWeight) + Number(dailyWeight) + Number(ptsWeight) + Number(pasWeight);

  const handleSaveAcademicSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalGradeWeight !== 100) {
      showErrorToast(`Total bobot penilaian harus 100%. (Saat ini total: ${totalGradeWeight}%)`);
      return;
    }

    updateSystemSettings({
      gradeWeights: {
        assignment: Number(assignmentWeight),
        daily: Number(dailyWeight),
        pts: Number(ptsWeight),
        pas: Number(pasWeight)
      },
      predicateThresholds: {
        aMin: Number(aMin),
        bMin: Number(bMin),
        cMin: Number(cMin),
        kkmDefault: Number(kkmDefault)
      }
    });
    showSuccessToast('Pengaturan Akademik, KKM, & Bobot Penilaian berhasil diperbarui!');
  };

  // 2. Save Document & Kop Surat Settings
  const handleSaveDocumentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings({
      paperMargin: { unit, top, bottom, left, right },
      letterhead: {
        ...systemSettings.letterhead,
        showInPdf,
        heightMm,
        imageUrl,
        institutionName,
        address: letterheadAddress
      },
      documentSettings: {
        logoUrl,
        digitalSignatureUrl,
        schoolStampUrl
      }
    });
    showSuccessToast('Pengaturan Dokumen, Kop Surat, & Margin Cetak berhasil diperbarui!');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'kop' | 'logo' | 'signature' | 'stamp') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Format validation for Kop Surat / Images
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        showErrorToast('Format file tidak didukung! Gunakan format PNG, JPG, JPEG, atau WEBP.');
        return;
      }

      // Size validation (Max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast('Ukuran file terlalu besar! Maksimal 5MB.');
        return;
      }

      // Read file into base64 for instant preview & persistence
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        if (target === 'kop') setImageUrl(base64Data);
        if (target === 'logo') setLogoUrl(base64Data);
        if (target === 'signature') setDigitalSignatureUrl(base64Data);
        if (target === 'stamp') setSchoolStampUrl(base64Data);

        try {
          const driveFile = await GoogleDriveService.uploadFile(file, 'System');
          if (driveFile?.webViewLink) {
            if (target === 'kop') setImageUrl(driveFile.webViewLink);
            if (target === 'logo') setLogoUrl(driveFile.webViewLink);
            if (target === 'signature') setDigitalSignatureUrl(driveFile.webViewLink);
            if (target === 'stamp') setSchoolStampUrl(driveFile.webViewLink);
          }
        } catch (err) {
          // Fallback to base64 DataURL
        }
        showSuccessToast(`Gambar ${target === 'kop' ? 'Kop Surat' : 'dokumen'} berhasil diunggah!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveKopImage = () => {
    setImageUrl('');
    showSuccessToast('Gambar Kop Surat telah dihapus.');
  };

  // 3. Save School Info & Regional Settings
  const handleSaveSchoolInfoSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings({
      schoolInfo: {
        schoolName,
        address: schoolAddress,
        email: schoolEmail,
        phone: schoolPhone,
        timeZone,
        dateFormat,
        academicYearActive: activeAcademicYear.year,
        semesterActive: activeAcademicYear.semester
      }
    });
    showSuccessToast('Pengaturan Identitas Sekolah & Sistem Regional berhasil diperbarui!');
  };

  // 4. Database Credentials & Reset
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
          showSuccessToast('Kredensial disimpan! KONEKSI SUPABASE TERHUBUNG. Data akun telah disinkronkan.');
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

  // Live Preview Settings Object for KopSuratPreview
  const currentPreviewSettings = {
    ...systemSettings,
    paperMargin: { unit, top, bottom, left, right },
    letterhead: {
      ...systemSettings.letterhead,
      showInPdf,
      heightMm,
      imageUrl,
      institutionName,
      address: letterheadAddress
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#696cff]" /> Pengaturan Sistem & Akademik
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Pusat konfigurasi tahun ajaran, bobot penilaian, dokumen cetak, dan identitas sekolah</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex-wrap">
          <button
            onClick={() => setActiveTab('akademik')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'akademik'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Pengaturan Akademik
          </button>

          <button
            onClick={() => setActiveTab('dokumen')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dokumen'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Pengaturan Dokumen
          </button>

          <button
            onClick={() => setActiveTab('sistem')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sistem'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Pengaturan Sistem
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Manajemen Administrator
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'database'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Database & Reset
          </button>
        </div>
      </div>

      {/* ------------------- TAB 1: PENGATURAN AKADEMIK ------------------- */}
      {activeTab === 'akademik' && (
        <div className="space-y-6">
          {/* Active Academic Year Highlight Banner */}
          <div className="bg-gradient-to-r from-[#696cff] to-indigo-700 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white font-extrabold text-xs backdrop-blur-xs uppercase tracking-wide">
                <Award className="w-3.5 h-3.5" /> Tahun Pelajaran & Semester Aktif
              </span>
              <h3 className="text-2xl font-black tracking-tight">
                Tahun Ajaran {activeAcademicYear.year} — Semester {activeAcademicYear.semester} ({activeAcademicYear.semester === '1' ? 'Ganjil' : 'Genap'})
              </h3>
              <p className="text-xs text-indigo-100 max-w-2xl">
                Tahun ajaran dan semester ini berlaku secara realtime pada pengisian nilai, absensi harian, jurnal mengajar, dan pencetakan laporan.
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
                  <Calendar className="w-5 h-5 text-[#696cff]" /> Daftar Periode Tahun Pelajaran
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Atur status aktif dan beralih semester</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3.5 px-6">Tahun Pelajaran</th>
                    <th className="py-3.5 px-6">Semester</th>
                    <th className="py-3.5 px-6">Status Sistem</th>
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

          {/* Grade Weights & KKM / Predicates Form */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#696cff]/10 text-[#696cff] rounded-2xl">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Konfigurasi Bobot Penilaian, KKM, & Predikat Nilai
                  </h3>
                  <p className="text-xs text-slate-400">
                    Atur persentase bobot Tugas, Harian, PTS, dan PAS (Total WAJIB 100%) serta ambang batas Predikat A, B, C, D
                  </p>
                </div>
              </div>

              {/* Total Indicator Badge */}
              <div className={`px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-2 border ${
                totalGradeWeight === 100
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
              }`}>
                {totalGradeWeight === 100 ? (
                  <>
                    <CheckSquare className="w-4 h-4" /> Total Bobot: 100% (Valid)
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" /> Total Bobot: {totalGradeWeight}% (Harus 100%)
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveAcademicSettings} className="space-y-6">
              {/* Grade Weights Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">1. Persentase Bobot Komponen Nilai (%)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bobot Tugas (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={assignmentWeight}
                      onChange={(e) => setAssignmentWeight(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bobot Harian (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={dailyWeight}
                      onChange={(e) => setDailyWeight(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bobot PTS (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={ptsWeight}
                      onChange={(e) => setPtsWeight(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bobot PAS (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={pasWeight}
                      onChange={(e) => setPasWeight(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>
                </div>
              </div>

              {/* Predicates & KKM Grid */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">2. Ambang Batas Predikat & KKM Minimal Sekolah</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      KKM Default Sekolah
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={kkmDefault}
                      onChange={(e) => setKkmDefault(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Batas Minimal Predikat A
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={aMin}
                      onChange={(e) => setAMin(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Batas Minimal Predikat B
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={bMin}
                      onChange={(e) => setBMin(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Batas Minimal Predikat C
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={cMin}
                      onChange={(e) => setCMin(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={totalGradeWeight !== 100}
                  className="px-6 py-3.5 rounded-2xl bg-[#696cff] hover:bg-[#5f61e6] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg shadow-[#696cff]/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simpan Pengaturan Akademik & Bobot Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------- TAB 2: PENGATURAN DOKUMEN & KOP SURAT ------------------- */}
      {activeTab === 'dokumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-[#696cff]/10 text-[#696cff] rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Format Kop Surat, Margin Cetak, & Atribut Dokumen
                </h3>
                <p className="text-xs text-slate-400">
                  Atur tampilan Kop Surat, logo, stempel, dan batas kertas laporan PDF
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveDocumentSettings} className="space-y-6">
              {/* Kop Surat Gambar Only */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Pengelolaan Gambar Kop Surat</h4>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Image Upload
                  </span>
                </div>

                {/* Kop Surat Image Upload & Preview Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                  {imageUrl ? (
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[90px] shadow-inner overflow-hidden">
                        <img src={imageUrl} alt="Kop Surat Preview" className="max-h-24 w-auto object-contain" />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Gambar Kop Surat Aktif & Tersimpan
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="px-3.5 py-2 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs">
                            <Upload className="w-3.5 h-3.5" /> Ganti Gambar
                            <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={(e) => handleImageUpload(e, 'kop')} className="hidden" />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveKopImage}
                            className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus Gambar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 px-4 space-y-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50">
                      <div className="w-12 h-12 rounded-2xl bg-[#696cff]/10 text-[#696cff] mx-auto flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Belum ada gambar Kop Surat yang diunggah</p>
                        <p className="text-[11px] text-slate-400">Pilih file gambar berukuran maksimal 5MB (Format: PNG, JPG, JPEG, WEBP)</p>
                      </div>
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-[#696cff]/20">
                        <Upload className="w-4 h-4" /> Unggah Gambar Kop Surat
                        <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={(e) => handleImageUpload(e, 'kop')} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tinggi Kop Surat pada PDF (mm)
                    </label>
                    <input
                      type="number"
                      required
                      value={heightMm}
                      onChange={(e) => setHeightMm(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="showInPdf"
                      checked={showInPdf}
                      onChange={(e) => setShowInPdf(e.target.checked)}
                      className="w-4 h-4 rounded-md text-[#696cff] focus:ring-[#696cff]"
                    />
                    <label htmlFor="showInPdf" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Tampilkan Kop Surat pada Hasil Cetak PDF
                    </label>
                  </div>
                </div>
              </div>

              {/* Margins */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Margin Cetak Kertas PDF</h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUnit('mm')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${unit === 'mm' ? 'bg-[#696cff] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                    >
                      mm
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('cm')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${unit === 'cm' ? 'bg-[#696cff] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                    >
                      cm
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Atas ({unit})</label>
                    <input
                      type="number"
                      required
                      value={top}
                      onChange={(e) => setTop(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Bawah ({unit})</label>
                    <input
                      type="number"
                      required
                      value={bottom}
                      onChange={(e) => setBottom(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Kiri ({unit})</label>
                    <input
                      type="number"
                      required
                      value={left}
                      onChange={(e) => setLeft(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Kanan ({unit})</label>
                    <input
                      type="number"
                      required
                      value={right}
                      onChange={(e) => setRight(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Logo, Signature, Stamp */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Logo, Tanda Tangan, & Stempel</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Logo Sekolah URL</label>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Tanda Tangan Digital URL</label>
                    <input
                      type="text"
                      value={digitalSignatureUrl}
                      onChange={(e) => setDigitalSignatureUrl(e.target.value)}
                      placeholder="Opsional"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Stempel Resmi Sekolah URL</label>
                    <input
                      type="text"
                      value={schoolStampUrl}
                      onChange={(e) => setSchoolStampUrl(e.target.value)}
                      placeholder="Opsional"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-2xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-extrabold text-xs shadow-lg shadow-[#696cff]/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simpan Pengaturan Dokumen & Kop Surat
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

      {/* ------------------- TAB 3: PENGATURAN SISTEM & IDENTITAS ------------------- */}
      {activeTab === 'sistem' && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-[#696cff]/10 text-[#696cff] rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Profil Identitas Sekolah & Format Regional
              </h3>
              <p className="text-xs text-slate-400">
                Atur nama instansi sekolah, alamat resmi, email, telepon, zona waktu, dan format tanggal
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSchoolInfoSettings} className="space-y-6">
            {/* School Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">1. Identitas Resmi Instansi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Sekolah / Instansi *
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Resmi Sekolah *
                  </label>
                  <input
                    type="email"
                    required
                    value={schoolEmail}
                    onChange={(e) => setSchoolEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Lengkap Sekolah *
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Telepon / Fax *
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolPhone}
                    onChange={(e) => setSchoolPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                  />
                </div>
              </div>
            </div>

            {/* Regional & Timezone */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">2. Zona Waktu & Format Tanggal Sistem</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#696cff]" /> Zona Waktu Sekolah
                  </label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                  >
                    <option value="Asia/Jakarta (WIB)">WIB — Waktu Indonesia Barat (Asia/Jakarta)</option>
                    <option value="Asia/Makassar (WITA)">WITA — Waktu Indonesia Tengah (Asia/Makassar)</option>
                    <option value="Asia/Jayapura (WIT)">WIT — Waktu Indonesia Timur (Asia/Jayapura)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#696cff]" /> Format Tanggal Tampilan
                  </label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Contoh: 30/07/2026)</option>
                    <option value="DD MMMM YYYY">DD MMMM YYYY (Contoh: 30 Juli 2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (Contoh: 2026-07-30)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-extrabold text-xs shadow-lg shadow-[#696cff]/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Simpan Identitas Sekolah & Pengaturan Sistem
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------- TAB 4: MANAJEMEN ADMINISTRATOR ------------------- */}
      {activeTab === 'admin' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-[#1e1e38] to-slate-900 p-8 rounded-3xl text-white border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[#696cff]/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#696cff]/20 text-[#696cff] border border-[#696cff]/30 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" /> Khusus Administrator Sekolah
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Manajemen Administrator & Setup Infrastruktur System
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Konfigurasi pusat data Supabase (Realtime, Table Editor, Relasi, RLS) dan Google Drive API agar seluruh akun Guru & Admin dapat mengakses aplikasi dari browser & perangkat mana saja secara sinkron.
              </p>
            </div>

            {/* Sub-Tab Switcher */}
            <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800">
              <button
                onClick={() => setAdminSubTab('supabase')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSubTab === 'supabase'
                    ? 'bg-[#696cff] text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Database className="w-4 h-4" /> 1. Konfigurasi Supabase
              </button>
              <button
                onClick={() => setAdminSubTab('gdrive')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSubTab === 'gdrive'
                    ? 'bg-[#696cff] text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <HardDrive className="w-4 h-4" /> 2. Setup Google Drive API
              </button>
              <button
                onClick={() => setAdminSubTab('checklist')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSubTab === 'checklist'
                    ? 'bg-[#696cff] text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Checklist Kesiapan
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: SUPABASE SETUP */}
          {adminSubTab === 'supabase' && (
            <div className="space-y-6">
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
                      Tabel <code>grades</code>, <code>attendance</code>, <code>teaching_journals</code>, dan <code>teaching_modules</code> secara otomatis terhubung ke tabel <code>profiles</code>, <code>students</code>, <code>classes</code>, dan <code>subjects</code> via Kunci Asing.
                    </p>
                  </div>

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
                      Buka menu <strong>Project Settings &gt; API</strong> di Supabase untuk menyalin <code>Project URL</code> dan <code>anon / public key</code>. Simpan dalam formulir di bawah ini agar aplikasi terhubung secara instan di semua perangkat.
                    </p>
                  </div>
                </div>

                {/* Database Credentials Form */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#696cff]" /> Hubungkan Kredensial Database Supabase Runtime
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
                        className="px-5 py-2.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 flex items-center gap-2 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Kredensial & Hubungkan Supabase</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* SQL Installation Script Box */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#696cff]" /> Master Script SQL Installation Database
                      </h3>
                      <p className="text-xs text-slate-400">
                        Buka menu <strong>SQL Editor</strong> pada dashboard Supabase Anda, tempelkan script ini lalu klik <strong>RUN</strong>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generateSupabaseSQLScript());
                        setCopiedAdminSql(true);
                        showSuccessToast('Script SQL Supabase berhasil disalin ke clipboard!');
                        setTimeout(() => setCopiedAdminSql(false), 3000);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedAdminSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedAdminSql ? 'Tersalin!' : 'Salin Script SQL Supabase'}</span>
                    </button>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 max-h-96 overflow-y-auto custom-scrollbar">
                    <pre>{generateSupabaseSQLScript()}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: GOOGLE DRIVE SETUP */}
          {adminSubTab === 'gdrive' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                  <HardDrive className="w-5 h-5 text-emerald-500" /> Panduan Menghubungkan Google Drive Utama Sekolah
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Seluruh file Modul Ajar, RPP, Kop Surat, dan foto profil sekolah tersimpan terpusat di 1 akun Google Drive sekolah.
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
                      Buka Google Drive utama sekolah Anda, buat folder bernama <code>GuruKu_Storage</code>. Bagikan akses <strong>Editor</strong> ke email Service Account.
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

          {/* SUB-TAB 3: CHECKLIST */}
          {adminSubTab === 'checklist' && (
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
                    onClick={() => toggleAdminCheck(item.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      adminChecklist[item.id]
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-slate-800 dark:text-slate-100'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs ${
                          adminChecklist[item.id] ? 'bg-emerald-500 text-white' : 'border border-slate-400'
                        }`}
                      >
                        {adminChecklist[item.id] && <Check className="w-3.5 h-3.5" />}
                      </span>
                      {item.label}
                    </span>

                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                        adminChecklist[item.id]
                          ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {adminChecklist[item.id] ? 'Selesai' : 'Belum'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------- TAB 5: DATABASE & RESET DATA ------------------- */}
      {activeTab === 'database' && (
        <div className="space-y-6 animate-fade-in">
          {/* Supabase Database Credentials Configuration Form */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#696cff]/10 text-[#696cff] rounded-2xl">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Koneksi Database Supabase Realtime <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#696cff]/10 text-[#696cff] dark:bg-[#696cff]/20">Aktif</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Masukkan URL dan Anon Key dari Proyek Supabase Anda untuk mengaktifkan sinkronisasi database 24/7 di seluruh browser & perangkat.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveDatabaseConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Project URL (SUPABASE_URL / VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#696cff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    API Key Anon / Public (SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#696cff]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-2xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-extrabold text-xs shadow-lg shadow-[#696cff]/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Terapkan & Hubungkan Supabase Database
                </button>
              </div>
            </form>
          </div>

          {/* Supabase SQL Migration Script Box */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#696cff]" /> Script SQL Migration (Supabase Database)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Salin script SQL di bawah ini lalu jalankan di <strong>SQL Editor</strong> pada Supabase Dashboard Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generateSupabaseSQLScript());
                  setIsCopied(true);
                  showSuccessToast('Script SQL Supabase disalin ke clipboard!');
                  setTimeout(() => setIsCopied(false), 3000);
                }}
                className="px-4 py-2.5 rounded-2xl bg-[#696cff]/10 hover:bg-[#696cff]/20 border border-[#696cff]/20 text-[#696cff] font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {isCopied ? 'Tersalin!' : 'Salin Script SQL Supabase'}
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 custom-scrollbar">
                {generateSupabaseSQLScript()}
              </pre>
            </div>
          </div>

          {/* Reset All Data Box */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl shrink-0">
                <RotateCcw className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Reset Seluruh Data Aplikasi ke Kondisi Awal (Kosong)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                  Membersihkan seluruh data aplikasi (Mata Pelajaran, Rombongan Belajar, Data Siswa, Nilai, Absensi Harian, Jurnal Mengajar, dan Modul Ajar) agar aplikasi siap digunakan dari nol.
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
              <strong>Peringatan Penting:</strong> Tindakan reset data bersifat permanen dan akan menghapus seluruh entri dummy. Akun Administrator Anda akan tetap aktif.
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
        </div>
      )}

      {/* Modal Academic Year CRUD */}
      <Modal
        isOpen={isAyModalOpen}
        onClose={() => setIsAyModalOpen(false)}
        title={editingAy ? 'Edit Tahun Pelajaran' : 'Tambah Tahun Pelajaran Baru'}
      >
        <form onSubmit={handleAySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tahun Pelajaran *
            </label>
            <input
              type="text"
              required
              value={ayYear}
              onChange={(e) => setAyYear(e.target.value)}
              placeholder="Contoh: 2026/2027"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Semester *
            </label>
            <select
              value={aySemester}
              onChange={(e) => setAySemester(e.target.value as '1' | '2')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
            >
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="ayIsActive"
              checked={ayIsActive}
              onChange={(e) => setAyIsActive(e.target.checked)}
              className="w-4 h-4 rounded-md text-[#696cff] focus:ring-[#696cff]"
            />
            <label htmlFor="ayIsActive" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              Set Sebagai Tahun Pelajaran Aktif Utama
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
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
              {editingAy ? 'Simpan Perubahan' : 'Tambah Tahun Pelajaran'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
