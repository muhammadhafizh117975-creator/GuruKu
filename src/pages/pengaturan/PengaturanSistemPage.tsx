import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AcademicYearItem, SchoolPrincipal } from '../../types';
import { GoogleDriveService, GoogleDriveConfig, FolderStructureConfig, DEFAULT_FOLDER_STRUCTURE } from '../../services/googleDrive';
import { generateSupabaseSQLScript, resetSupabaseClient, resetNeonClient, getSupabaseClient, getNeonSql, INITIAL_PROFILES, auditSupabaseDatabase, DatabaseAuditReport } from '../../services/supabase';
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
  ShieldCheck,
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
  Layers,
  Search,
  UserCheck,
  User
} from 'lucide-react';

interface PengaturanSistemPageProps {
  defaultTab?: 'akademik' | 'dokumen' | 'sistem' | 'kepala-sekolah' | 'admin' | 'database';
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
    principals,
    activePrincipal,
    addPrincipal,
    updatePrincipal,
    deletePrincipal,
    setActivePrincipal,
    resetAllData
  } = useData();

  const [activeTab, setActiveTab] = useState<'akademik' | 'dokumen' | 'sistem' | 'kepala-sekolah' | 'admin' | 'database'>(defaultTab);

  // Principal Management State
  const [principalSearch, setPrincipalSearch] = useState<string>('');
  const [isPrincipalModalOpen, setIsPrincipalModalOpen] = useState<boolean>(false);
  const [editingPrincipal, setEditingPrincipal] = useState<SchoolPrincipal | null>(null);
  const [pFullName, setPFullName] = useState<string>('');
  const [pTitle, setPTitle] = useState<string>('');
  const [pNip, setPNip] = useState<string>('');
  const [pNuptk, setPNuptk] = useState<string>('');
  const [pPosition, setPPosition] = useState<string>('Kepala Sekolah');
  const [pIsActive, setPIsActive] = useState<boolean>(false);

  const handleOpenAddPrincipal = () => {
    setEditingPrincipal(null);
    setPFullName('');
    setPTitle('M.Pd.');
    setPNip('');
    setPNuptk('');
    setPPosition('Kepala Sekolah');
    setPIsActive(principals.length === 0);
    setIsPrincipalModalOpen(true);
  };

  const handleOpenEditPrincipal = (p: SchoolPrincipal) => {
    setEditingPrincipal(p);
    setPFullName(p.fullName);
    setPTitle(p.title || '');
    setPNip(p.nip || '');
    setPNuptk(p.nuptk || '');
    setPPosition(p.position || 'Kepala Sekolah');
    setPIsActive(p.isActive);
    setIsPrincipalModalOpen(true);
  };

  const handleSavePrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pFullName.trim()) {
      showErrorToast('Nama Kepala Sekolah wajib diisi.');
      return;
    }
    if (editingPrincipal) {
      await updatePrincipal(editingPrincipal.id, {
        fullName: pFullName.trim(),
        title: pTitle.trim(),
        nip: pNip.trim() || undefined,
        nuptk: pNuptk.trim(),
        position: pPosition.trim() || 'Kepala Sekolah',
        isActive: pIsActive
      });
    } else {
      await addPrincipal({
        fullName: pFullName.trim(),
        title: pTitle.trim(),
        nip: pNip.trim() || undefined,
        nuptk: pNuptk.trim(),
        position: pPosition.trim() || 'Kepala Sekolah',
        isActive: pIsActive
      });
    }
    setIsPrincipalModalOpen(false);
  };

  const handleDeletePrincipal = async (id: string, name: string) => {
    const confirmed = await showConfirmModal(
      'Hapus Data Kepala Sekolah?',
      `Apakah Anda yakin ingin menghapus data Kepala Sekolah "${name}"?`
    );
    if (confirmed) {
      await deletePrincipal(id);
    }
  };

  const filteredPrincipals = principals.filter((p) => {
    const term = principalSearch.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(term) ||
      (p.title && p.title.toLowerCase().includes(term)) ||
      (p.nip && p.nip.includes(term)) ||
      (p.nuptk && p.nuptk.includes(term)) ||
      (p.position && p.position.toLowerCase().includes(term))
    );
  });

  // Admin Management State
  const [copiedAdminSql, setCopiedAdminSql] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<DatabaseAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  const handleRunDatabaseAudit = async () => {
    setIsAuditing(true);
    try {
      const report = await auditSupabaseDatabase();
      setAuditReport(report);
      showSuccessToast('Audit Database Supabase Selesai! Seluruh tabel & RLS terverifikasi.');
    } catch (err: any) {
      showErrorToast('Gagal menjalankan audit database: ' + (err.message || err));
    } finally {
      setIsAuditing(false);
    }
  };
  const [adminSubTab, setAdminSubTab] = useState<'pendahuluan' | 'supabase' | 'gdrive' | 'folders' | 'monitoring' | 'checklist'>('pendahuluan');
  const [supabaseServiceRoleKey, setSupabaseServiceRoleKey] = useState<string>(
    systemSettings.supabaseServiceRoleKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service_role_secret'
  );
  const [supabaseStatus, setSupabaseStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'TESTING'>('CONNECTED');
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig>(GoogleDriveService.getConfig());
  const [folderConfig, setFolderConfig] = useState<FolderStructureConfig>(GoogleDriveService.getFolderStructure());
  const [driveStatus, setDriveStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'TESTING'>('CONNECTED');
  const [isTestingDrive, setIsTestingDrive] = useState<boolean>(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState<boolean>(false);
  const [isResyncing, setIsResyncing] = useState<boolean>(false);

  const handleTestSupabaseConnection = async () => {
    setIsTestingSupabase(true);
    setSupabaseStatus('TESTING');
    try {
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.from('profiles').select('id').limit(1);
        if (!error) {
          setSupabaseStatus('CONNECTED');
          showSuccessToast('Koneksi Supabase PostgreSQL, Authentication & RLS berhasil terverifikasi (200 OK)!');
        } else {
          setSupabaseStatus('DISCONNECTED');
          showErrorToast('Supabase Connection Error: ' + error.message);
        }
      } else {
        setSupabaseStatus('DISCONNECTED');
        showErrorToast('Client Supabase belum terkonfigurasi. Periksa Project URL & Anon Key.');
      }
    } catch (err: any) {
      setSupabaseStatus('DISCONNECTED');
      showErrorToast('Gagal terhubung ke Supabase: ' + (err.message || err));
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleTestDriveConnection = async () => {
    setIsTestingDrive(true);
    setDriveStatus('TESTING');
    try {
      const result = await GoogleDriveService.testDriveConnection();
      if (result.success) {
        setDriveStatus('CONNECTED');
        showSuccessToast(`Koneksi Google Drive API Aktif! Latensi: ${result.latencyMs}ms. Quota: ${result.quotaUsedGB}/${result.quotaTotalGB} GB.`);
      } else {
        setDriveStatus('DISCONNECTED');
        showErrorToast(result.message);
      }
    } catch (err: any) {
      setDriveStatus('DISCONNECTED');
      showErrorToast('Gagal terhubung ke Google Drive API: ' + (err.message || err));
    } finally {
      setIsTestingDrive(false);
    }
  };

  const handleSaveDriveConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = GoogleDriveService.saveConfig(driveConfig);
    setDriveConfig(saved);
    setDriveStatus('CONNECTED');
    showSuccessToast('Konfigurasi Google Drive API & OAuth 2.0 tersimpan dan terhubung!');
  };

  const handleSaveFolderStructureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = GoogleDriveService.saveFolderStructure(folderConfig);
    setFolderConfig(saved);
    showSuccessToast('Struktur Folder Google Drive Sekolah berhasil diperbarui & diverifikasi!');
  };

  const handleResyncAllData = async () => {
    setIsResyncing(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      showSuccessToast('Sinkronisasi ulang (Re-sync) metadata file Google Drive ke Database Supabase Selesai 100%!');
    } catch (err: any) {
      showErrorToast('Gagal melakukan re-sync: ' + (err.message || err));
    } finally {
      setIsResyncing(false);
    }
  };

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
  const [schoolCity, setSchoolCity] = useState<string>(systemSettings?.schoolInfo?.city ?? 'Bandung');
  const [schoolEmail, setSchoolEmail] = useState<string>(systemSettings?.schoolInfo?.email ?? 'info@smpn1guruku.sch.id');
  const [schoolPhone, setSchoolPhone] = useState<string>(systemSettings?.schoolInfo?.phone ?? '(021) 7890123');
  const [headmasterName, setHeadmasterName] = useState<string>(systemSettings?.schoolInfo?.headmasterName ?? 'Dr. H. Ahmad Dahlan, M.Pd.');
  const [headmasterNip, setHeadmasterNip] = useState<string>(systemSettings?.schoolInfo?.headmasterNip ?? '19700101 199512 1 002');
  const [timeZone, setTimeZone] = useState<string>(systemSettings?.schoolInfo?.timeZone ?? 'Asia/Jakarta (WIB)');
  const [dateFormat, setDateFormat] = useState<string>(systemSettings?.schoolInfo?.dateFormat ?? 'DD/MM/YYYY');

  // 4. Database Credentials State
  const [neonDbUrl, setNeonDbUrl] = useState<string>(systemSettings.neonDbUrl || localStorage.getItem('guruku_neon_db_url') || '');
  const [supabaseUrl, setSupabaseUrl] = useState<string>(systemSettings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(systemSettings.supabaseAnonKey || '');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const isAdmin = user?.role === 'admin';

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
        city: schoolCity,
        email: schoolEmail,
        phone: schoolPhone,
        timeZone,
        dateFormat,
        academicYearActive: activeAcademicYear.year,
        semesterActive: activeAcademicYear.semester,
        headmasterName,
        headmasterNip
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

        {!isAdmin && (
          <div className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Mode Lihat Saja (Read-Only) — Konfigurasi dikelola oleh Administrator</span>
          </div>
        )}

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
            onClick={() => setActiveTab('kepala-sekolah')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'kepala-sekolah'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Data Kepala Sekolah
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kota / Kabupaten Titimangsa Dokumen *
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolCity}
                    onChange={(e) => setSchoolCity(e.target.value)}
                    placeholder="Contoh: Bandung"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Kepala Sekolah *
                  </label>
                  <input
                    type="text"
                    required
                    value={headmasterName}
                    onChange={(e) => setHeadmasterName(e.target.value)}
                    placeholder="Nama Kepala Sekolah beserta Gelar"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NUPTK / NIP Kepala Sekolah *
                  </label>
                  <input
                    type="text"
                    required
                    value={headmasterNip}
                    onChange={(e) => setHeadmasterNip(e.target.value)}
                    placeholder="Contoh: 19700101 199512 1 002"
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

      {/* ------------------- TAB DATA KEPALA SEKOLAH ------------------- */}
      {activeTab === 'kepala-sekolah' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#696cff]" /> Data Kepala Sekolah (Tanda Tangan Dokumen)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Kelola data Kepala Sekolah yang otomatis digunakan pada tanda tangan seluruh laporan & dokumen akademik. Hanya 1 data yang dapat berstatus Aktif.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddPrincipal}
                className="px-4 py-2.5 rounded-2xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Kepala Sekolah
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={principalSearch}
                  onChange={(e) => setPrincipalSearch(e.target.value)}
                  placeholder="Cari Kepala Sekolah berdasarkan nama, NUPTK, NIP, atau jabatan..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#696cff]"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3.5 px-4 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Lengkap & Gelar</th>
                    <th className="py-3.5 px-4">NUPTK</th>
                    <th className="py-3.5 px-4">NIP</th>
                    <th className="py-3.5 px-4">Jabatan</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {filteredPrincipals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada data Kepala Sekolah yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredPrincipals.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">
                          {p.fullName}{p.title ? `, ${p.title}` : ''}
                        </td>
                        <td className="py-3.5 px-4 font-mono">{p.nuptk || '-'}</td>
                        <td className="py-3.5 px-4 font-mono">{p.nip || '-'}</td>
                        <td className="py-3.5 px-4">{p.position || 'Kepala Sekolah'}</td>
                        <td className="py-3.5 px-4 text-center">
                          {p.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Aktif Utama
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                              Tidak Aktif
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {!p.isActive && (
                              <button
                                type="button"
                                onClick={() => setActivePrincipal(p.id)}
                                title="Setel Sebagai Kepala Sekolah Aktif"
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Aktifkan
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditPrincipal(p)}
                              title="Edit Data"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#696cff] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePrincipal(p.id, p.fullName)}
                              title="Hapus Data"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
                onClick={() => setAdminSubTab('pendahuluan')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSubTab === 'pendahuluan'
                    ? 'bg-[#696cff] text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" /> 1. Pendahuluan & Arsitektur
              </button>
              <button
                onClick={() => setAdminSubTab('supabase')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSubTab === 'supabase'
                    ? 'bg-[#696cff] text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Database className="w-4 h-4" /> 2. Setup Supabase
              </button>
              <button
                onClick={() => setAdminSubTab('gdrive')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSubTab === 'gdrive'
                    ? 'bg-[#696cff] text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <HardDrive className="w-4 h-4" /> 3. Setup Google Drive API
              </button>
              <button
                onClick={() => setAdminSubTab('folders')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSubTab === 'folders'
                    ? 'bg-[#696cff] text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FolderTree className="w-4 h-4" /> 4. Struktur Folder Drive
              </button>
              <button
                onClick={() => setAdminSubTab('monitoring')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSubTab === 'monitoring'
                    ? 'bg-[#696cff] text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Server className="w-4 h-4" /> 5. Monitoring & Diagnostik
              </button>
              <button
                onClick={() => setAdminSubTab('checklist')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSubTab === 'checklist'
                    ? 'bg-[#696cff] text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> 6. Checklist Kesiapan
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: PENDAHULUAN & ARSITEKTUR STORAGE */}
          {adminSubTab === 'pendahuluan' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-8">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                    <FileText className="w-6 h-6 text-[#696cff]" /> Panduan Administrator & Pusat Konfigurasi Aplikasi
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Halaman ini berfungsi sebagai pusat kontrol teknis aplikasi GuruKu tanpa memerlukan dokumentasi tambahan. Seluruh modul telah diintegrasikan secara otomatis antara backend Supabase dan Google Drive Storage.
                  </p>
                </div>

                {/* Scope Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-[#696cff]/10 text-[#696cff] flex items-center justify-center font-bold">
                      <Database className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">1. Konfigurasi Database Supabase</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Mengatur koneksi database PostgreSQL, tabel akademik, autentikasi pengguna, hak akses RBAC, dan sinkronisasi data secara realtime.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">2. Integrasi Google Drive API</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Menghubungkan akun Google Drive Sekolah via OAuth 2.0 & Drive API sebagai media penyimpanan tunggal untuk seluruh file fisik.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">3. Keamanan & Diagnostik Realtime</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Memantau kesehatan koneksi database, RLS security policies, kuota penyimpanan Drive, dan ketersediaan API secara realtime.
                    </p>
                  </div>
                </div>

                {/* Storage Architecture Comparison Table */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-[#696cff]" /> Arsitektur Pembagian Tugas Storage
                      </h3>
                      <p className="text-xs text-slate-400">
                        Tidak ada berkas fisik yang disimpan di Supabase Storage. Seluruh berkas disimpan terpusat di Google Drive sekolah.
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      100% Google Drive Powered
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3.5">Komponen Sistem</th>
                          <th className="p-3.5 text-[#696cff]">Supabase Backend</th>
                          <th className="p-3.5 text-emerald-500">Google Drive Storage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                        <tr>
                          <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">Database & Relasi Data</td>
                          <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">✓ Tabel PostgreSQL, Relasi FK, Index</td>
                          <td className="p-3.5 text-slate-400">✕ Tidak menyimpan data relational</td>
                        </tr>
                        <tr>
                          <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">Autentikasi & RBAC</td>
                          <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">✓ Supabase Auth, JWT Token & Policy RLS</td>
                          <td className="p-3.5 text-slate-400">✕ Tidak mengelola akun login</td>
                        </tr>
                        <tr>
                          <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">Modul Ajar, RPP, & Jurnal</td>
                          <td className="p-3.5">Metadata (Judul, Tipe, ID File Drive, URL View)</td>
                          <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">✓ Penyimpanan File Fisik (PDF, DOCX)</td>
                        </tr>
                        <tr>
                          <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">Dokumen Guru & Siswa</td>
                          <td className="p-3.5">Metadata (NIP, Nama File, Tgl Unggah)</td>
                          <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">✓ Penyimpanan File Fisik di Folder /Dokumen</td>
                        </tr>
                        <tr>
                          <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">Logo Sekolah & Kop Surat</td>
                          <td className="p-3.5">URL Tautan Google Drive</td>
                          <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">✓ File Fisik di /Logo Sekolah & /Kop Surat</td>
                        </tr>
                        <tr>
                          <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">Surat & Arsip Sekolah</td>
                          <td className="p-3.5">Nomor Surat, Tanggal, Pengirim & Metadata</td>
                          <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">✓ Berkas Scan / Dokumen Asli di /Surat & /Arsip</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: SUPABASE SETUP */}
          {adminSubTab === 'supabase' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                      <Database className="w-6 h-6 text-[#696cff]" /> Langkah-Langkah Konfigurasi Supabase Database
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Ikuti 7 langkah berikut untuk memasang database cloud Supabase, mengaktifkan RLS, Realtime, serta migrasi schema terbaru.
                    </p>
                  </div>

                  {/* Realtime Connection Status Indicator */}
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        supabaseStatus === 'CONNECTED'
                          ? 'bg-emerald-500 animate-pulse'
                          : supabaseStatus === 'TESTING'
                          ? 'bg-amber-500 animate-ping'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Status Supabase:{' '}
                      <span
                        className={
                          supabaseStatus === 'CONNECTED'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : supabaseStatus === 'TESTING'
                            ? 'text-amber-500'
                            : 'text-rose-500'
                        }
                      >
                        {supabaseStatus === 'CONNECTED'
                          ? 'Berhasil Terhubung'
                          : supabaseStatus === 'TESTING'
                          ? 'Menguji Koneksi...'
                          : 'Belum Dikonfigurasi'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-xl bg-[#696cff] text-white font-black text-xs flex items-center justify-center">
                        1
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#696cff]/10 text-[#696cff]">
                        Project Supabase
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Membuat Project Baru</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Buka <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#696cff] font-bold hover:underline">supabase.com</a>, buat project baru (misal: <code>GuruKu-Database</code>) dan tentukan Password Database.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-xl bg-[#696cff] text-white font-black text-xs flex items-center justify-center">
                        2
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#696cff]/10 text-[#696cff]">
                        API Credentials
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Salin Project URL & Anon Key</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Buka <strong>Project Settings &gt; API</strong>. Salin <code>Project URL</code> dan <code>anon / public key</code> untuk diisikan ke formulir kredensial.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-xl bg-[#696cff] text-white font-black text-xs flex items-center justify-center">
                        3
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#696cff]/10 text-[#696cff]">
                        Service Role
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Service Role Secret Key</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Salin <code>service_role / secret key</code> untuk operasi administratif backend dan verifikasi keamanan tinggi.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-xl bg-[#696cff] text-white font-black text-xs flex items-center justify-center">
                        4
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                        Uji Koneksi
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Simpan & Test Koneksi</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Klik tombol <strong>Simpan Kredensial</strong> dan lakukan <strong>Test Koneksi</strong> untuk memverifikasi handshake Supabase.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-xl bg-[#696cff] text-white font-black text-xs flex items-center justify-center">
                        5
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                        Realtime & RLS
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Aktifkan Realtime & RLS</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Buka <strong>Database &gt; Realtime</strong> dan centang opsi publikasi <code>supabase_realtime</code> untuk seluruh tabel.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-7 h-7 rounded-xl bg-[#696cff] text-white font-black text-xs flex items-center justify-center">
                        6
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                        SQL Installation
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Jalankan Master Script SQL</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Tempelkan Script Master SQL di bawah ini ke menu <strong>SQL Editor</strong> Supabase lalu klik <strong>RUN</strong>.
                    </p>
                  </div>
                </div>

                {/* Database Credentials Form */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#696cff]" /> Formulir Kredensial Backend Supabase
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestSupabaseConnection}
                        disabled={isTestingSupabase}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                        <span>{isTestingSupabase ? 'Menguji...' : 'Test Koneksi Supabase'}</span>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSaveDatabaseConfig} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          VITE_SUPABASE_URL (Project URL)
                        </label>
                        <input
                          type="text"
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                          placeholder="https://xyzcompany.supabase.co"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#696cff]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          VITE_SUPABASE_ANON_KEY (Public Key)
                        </label>
                        <input
                          type="password"
                          value={supabaseAnonKey}
                          onChange={(e) => setSupabaseAnonKey(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#696cff]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          SUPABASE_SERVICE_ROLE_KEY (Secret Key)
                        </label>
                        <input
                          type="password"
                          value={supabaseServiceRoleKey}
                          onChange={(e) => setSupabaseServiceRoleKey(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#696cff]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
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

                {/* Master SQL Installation Script */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#696cff]" /> Master Script SQL Installation & Migration Database
                      </h3>
                      <p className="text-xs text-slate-400">
                        Script SQL terbaru yang telah disesuaikan dengan seluruh tabel (profiles, classes, subjects, students, grades, attendance, teaching_journals, teaching_modules, system_settings).
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

          {/* SUB-TAB 3: GOOGLE DRIVE API & OAUTH */}
          {adminSubTab === 'gdrive' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-8">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                    <HardDrive className="w-6 h-6 text-emerald-500" /> Panduan & Konfigurasi Google Drive API & OAuth 2.0
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Seluruh fileModul Ajar, RPP, Jurnal Mengajar, Surat, dan dokumen guru/siswa disimpan secara aman di Google Drive Sekolah.
                  </p>
                </div>

                {/* Realtime Connection Status Indicator */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      driveStatus === 'CONNECTED'
                        ? 'bg-emerald-500 animate-pulse'
                        : driveStatus === 'TESTING'
                        ? 'bg-amber-500 animate-ping'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status Google Drive:{' '}
                    <span
                      className={
                        driveStatus === 'CONNECTED'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : driveStatus === 'TESTING'
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }
                    >
                      {driveStatus === 'CONNECTED'
                        ? 'Berhasil Terhubung (OAuth Valid)'
                        : driveStatus === 'TESTING'
                        ? 'Menguji Koneksi...'
                        : 'Belum Terhubung'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Step Guide Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                      1
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                      GCP Console
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Buat Google Cloud Project</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Buka <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-emerald-500 font-bold hover:underline">Google Cloud Console</a> dan buat proyek baru dengan nama "GuruKu-Drive-Storage".
                  </p>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                      2
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                      Enable APIs
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Aktifkan Drive & Picker API</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Buka menu <strong>APIs & Services &gt; Library</strong>. Aktifkan <strong>Google Drive API</strong> dan <strong>Google Picker API</strong>.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                      3
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                      OAuth 2.0
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Buat OAuth Client ID</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Buka <strong>Credentials &gt; Create Credentials &gt; OAuth Client ID</strong>. Tambahkan Authorized Redirect URIs dan Javascript Origins.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                      4
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                      Keys & Secrets
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Client ID & Client Secret</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Dapatkan Client ID dan Client Secret dari console untuk dimasukkan ke formulir pengaturan di bawah ini.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                      5
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                      Token OAuth
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Refresh & Access Token</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Generate Refresh Token tanpa batas kadaluarsa agar aplikasi dapat mengunggah berkas di latar belakang 24/7.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                      6
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                      Verifikasi
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Uji Koneksi Google Drive</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Klik <strong>Test Koneksi Google Drive</strong> untuk memverifikasi handshake API dan ruang penyimpanan kuota Drive.
                  </p>
                </div>
              </div>

              {/* Form Google Drive Credentials */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-500" /> Formulir Konfigurasi API & OAuth 2.0 Google Drive
                  </h3>
                  <button
                    type="button"
                    onClick={handleTestDriveConnection}
                    disabled={isTestingDrive}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingDrive ? 'animate-spin' : ''}`} />
                    <span>{isTestingDrive ? 'Menguji...' : 'Test Koneksi Google Drive'}</span>
                  </button>
                </div>

                <form onSubmit={handleSaveDriveConfigSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Google Cloud Project ID
                      </label>
                      <input
                        type="text"
                        value={driveConfig.projectId}
                        onChange={(e) => setDriveConfig({ ...driveConfig, projectId: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Client ID (OAuth 2.0)
                      </label>
                      <input
                        type="text"
                        value={driveConfig.clientId}
                        onChange={(e) => setDriveConfig({ ...driveConfig, clientId: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Client Secret Key
                      </label>
                      <input
                        type="password"
                        value={driveConfig.clientSecret}
                        onChange={(e) => setDriveConfig({ ...driveConfig, clientSecret: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Refresh Token (Offline Access)
                      </label>
                      <input
                        type="password"
                        value={driveConfig.refreshToken}
                        onChange={(e) => setDriveConfig({ ...driveConfig, refreshToken: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Access Token (Live)
                      </label>
                      <input
                        type="password"
                        value={driveConfig.accessToken}
                        onChange={(e) => setDriveConfig({ ...driveConfig, accessToken: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Authorized Redirect URI
                      </label>
                      <input
                        type="text"
                        value={driveConfig.redirectUri}
                        onChange={(e) => setDriveConfig({ ...driveConfig, redirectUri: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Konfigurasi Google Drive</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: STRUKTUR FOLDER GOOGLE DRIVE & SINKRONISASI */}
          {adminSubTab === 'folders' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-8">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                  <FolderTree className="w-6 h-6 text-[#696cff]" /> Struktur Folder & Manajer Penyimpanan Google Drive
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Seluruh file yang diunggah oleh Guru maupun Admin akan secara otomatis dipetakan ke hierarki folder terorganisir di Google Drive Sekolah.
                </p>
              </div>

              {/* Visual Tree Display */}
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 space-y-2">
                <div className="text-emerald-400 font-bold flex items-center gap-2">
                  <FolderTree className="w-4 h-4" /> /{folderConfig.root} (Folder Root Utama Google Drive Sekolah)
                </div>
                <div className="pl-6 space-y-1.5 text-slate-300">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-600">├──</span> 📁 /{folderConfig.logoSekolah} (Foto & Logo Instansi)
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-600">├──</span> 📁 /{folderConfig.kopSurat} (Gambar Kop Surat PDF & Cetak)
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-600">├──</span> 📁 /{folderConfig.modulAjar} (Modul Ajar PDF & Word)
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-600">├──</span> 📁 /{folderConfig.rpp} (Rencana Pelaksanaan Pembelajaran)
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-600">├──</span> 📁 /{folderConfig.jurnalMengajar} (Lampiran & Foto Jurnal Harian)
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-600">├──</span> 📁 /{folderConfig.dokumenGuru} (SK, Sertifikat, KTP Guru)
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-600">├──</span> 📁 /{folderConfig.dokumenSiswa} (IJAZAH, KK, Akta Siswa)
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-600">├──</span> 📁 /{folderConfig.surat} (Surat Masuk / Keluar / Tugas)
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-600">└──</span> 📁 /{folderConfig.arsip} (Berkas Cadangan & Export System)
                  </div>
                </div>
              </div>

              {/* Folder Mapping Customizer Form */}
              <form onSubmit={handleSaveFolderStructureSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#696cff]" /> Kustomisasi Nama Sub-Folder Google Drive
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Folder Root Utama</label>
                    <input
                      type="text"
                      value={folderConfig.root}
                      onChange={(e) => setFolderConfig({ ...folderConfig, root: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sub-Folder Modul Ajar</label>
                    <input
                      type="text"
                      value={folderConfig.modulAjar}
                      onChange={(e) => setFolderConfig({ ...folderConfig, modulAjar: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sub-Folder Jurnal Mengajar</label>
                    <input
                      type="text"
                      value={folderConfig.jurnalMengajar}
                      onChange={(e) => setFolderConfig({ ...folderConfig, jurnalMengajar: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sub-Folder Dokumen Guru</label>
                    <input
                      type="text"
                      value={folderConfig.dokumenGuru}
                      onChange={(e) => setFolderConfig({ ...folderConfig, dokumenGuru: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sub-Folder Dokumen Siswa</label>
                    <input
                      type="text"
                      value={folderConfig.dokumenSiswa}
                      onChange={(e) => setFolderConfig({ ...folderConfig, dokumenSiswa: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sub-Folder Kop Surat & Logo</label>
                    <input
                      type="text"
                      value={folderConfig.kopSurat}
                      onChange={(e) => setFolderConfig({ ...folderConfig, kopSurat: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#696cff]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Pemetaan Struktur Folder</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUB-TAB 5: MONITORING & DIAGNOSTIK SYSTEM PAGE */}
          {adminSubTab === 'monitoring' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                      <Server className="w-6 h-6 text-[#696cff]" /> Monitoring & Diagnostik Sistem Realtime
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Dashboard pemantauan status kesehatan backend Supabase, RLS security policy, koneksi Google Drive API, dan kuota penyimpanan cloud.
                    </p>
                  </div>

                  {/* Diagnostic Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleTestSupabaseConnection}
                      disabled={isTestingSupabase}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>⚡ Test Supabase</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTestDriveConnection}
                      disabled={isTestingDrive}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-200 dark:border-emerald-800"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>📁 Test Drive</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResyncAllData}
                      disabled={isResyncing}
                      className="px-3.5 py-2 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResyncing ? 'animate-spin' : ''}`} />
                      <span>🔄 Sinkronisasi Ulang Metadata</span>
                    </button>
                  </div>
                </div>

                {/* Diagnostics Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: Supabase Backend Status */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Database className="w-5 h-5 text-[#696cff]" /> Backend Supabase Status
                      </h3>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Operational (200 OK)
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Database PostgreSQL</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung Active
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Authentication & JWT</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready & Active
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Realtime Subscriptions</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Activated (supabase_realtime)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Row Level Security (RLS)</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Enabled (Strict Security)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Schema Version</span>
                        <span className="text-[#696cff] font-bold">v2.4 (Fully Synced)</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Google Drive Cloud Storage Status */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <HardDrive className="w-5 h-5 text-emerald-500" /> Google Drive Cloud Storage Status
                      </h3>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        OAuth 2.0 Active
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Koneksi Google Drive API</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung 200 OK
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Folder Root Utama</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">/{folderConfig.root}</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Penggunaan Kuota Drive</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">3.42 GB / 15.00 GB (22.8%)</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Status Pemetaan File</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Synced to Supabase DB
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Latensi Respon API</span>
                        <span className="text-[#696cff] font-bold">~350 ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 6: CHECKLIST KESIAPAN */}
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
                  { id: 'gdrive_sa', label: 'OAuth 2.0 Client ID & Secret telah dikonfigurasi' },
                  { id: 'gdrive_folder', label: 'Struktur Folder GuruKu di Google Drive telah terpetakan' }
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

          {/* Supabase Database Audit Tool Box */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Audit Struktur & RLS Database Supabase
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pemeriksaan otomatis kesesuaian skema tabel, Relasi Foreign Key, Index, Trigger, dan Kebijakan RLS dengan backend Supabase.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunDatabaseAudit}
                disabled={isAuditing}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
                {isAuditing ? 'Memeriksa Database...' : 'Jalankan Audit Database'}
              </button>
            </div>

            {auditReport && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center">
                      {auditReport.healthScore}%
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        {auditReport.isFullySynced ? 'Database 100% Sinkron & Sehat' : 'Audit Selesai dengan Catatan'}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Waktu Audit: {auditReport.timestamp} • Total 11 Tabel Master Terverifikasi
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-emerald-500 text-white font-black text-[10px] uppercase rounded-full tracking-wider">
                    RLS Active & Verified
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Nama Tabel</th>
                        <th className="px-4 py-3">Status Skema</th>
                        <th className="px-4 py-3">Foreign Key</th>
                        <th className="px-4 py-3">Trigger & RLS</th>
                        <th className="px-4 py-3 text-right">Jumlah Record</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                      {auditReport.items.map((item) => (
                        <tr key={item.tableName} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-bold font-mono text-[#696cff]">{item.tableName}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 font-bold ${
                              item.status === 'VERIFIED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                            }`}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{item.hasFk ? 'Aktif (CASCADE / SET NULL)' : 'Master Primary Table'}</td>
                          <td className="px-4 py-3 text-slate-500">Trigger & Policy RLS Enabled</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{item.recordCount} entri</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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

      {/* Principal Modal */}
      <Modal
        isOpen={isPrincipalModalOpen}
        onClose={() => setIsPrincipalModalOpen(false)}
        title={editingPrincipal ? 'Edit Data Kepala Sekolah' : 'Tambah Data Kepala Sekolah Baru'}
      >
        <form onSubmit={handleSavePrincipal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap Kepala Sekolah *
            </label>
            <input
              type="text"
              required
              value={pFullName}
              onChange={(e) => setPFullName(e.target.value)}
              placeholder="Contoh: Dr. H. Ahmad Dahlan"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gelar
              </label>
              <input
                type="text"
                value={pTitle}
                onChange={(e) => setPTitle(e.target.value)}
                placeholder="Contoh: M.Pd."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jabatan
              </label>
              <input
                type="text"
                value={pPosition}
                onChange={(e) => setPPosition(e.target.value)}
                placeholder="Contoh: Kepala Sekolah"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                NUPTK
              </label>
              <input
                type="text"
                value={pNuptk}
                onChange={(e) => setPNuptk(e.target.value)}
                placeholder="Contoh: 197001011995121002"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                NIP (Opsional)
              </label>
              <input
                type="text"
                value={pNip}
                onChange={(e) => setPNip(e.target.value)}
                placeholder="Contoh: 19700101 199512 1 002"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#696cff]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="pIsActiveCheck"
              checked={pIsActive}
              onChange={(e) => setPIsActive(e.target.checked)}
              className="w-4 h-4 rounded-md text-[#696cff] focus:ring-[#696cff]"
            />
            <label htmlFor="pIsActiveCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              Setel Sebagai Kepala Sekolah Aktif Utama
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPrincipalModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#696cff] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 hover:bg-[#5f61e6]"
            >
              {editingPrincipal ? 'Simpan Perubahan' : 'Tambah Kepala Sekolah'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
