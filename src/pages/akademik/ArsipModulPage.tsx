import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { GoogleDriveService } from '../../services/googleDrive';
import { showConfirmModal, showSuccessToast, showErrorToast } from '../../components/common/SweetAlert';
import {
  FolderArchive,
  Upload,
  Search,
  ExternalLink,
  Trash2,
  HardDrive,
  FileText,
  Download,
  CheckCircle2,
  File,
  AlertCircle,
  LayoutGrid,
  List,
  Check,
  FolderCheck
} from 'lucide-react';

export const ArsipModulPage: React.FC = () => {
  const { user } = useAuth();
  const { subjects, modules, addModule, deleteModule, systemSettings } = useData();

  const [activeTab, setActiveTab] = useState<'arsip' | 'upload' | 'gdrive_status'>('arsip');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('all');

  // Upload Form State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || '');
  const [classLevel, setClassLevel] = useState<string>('7');
  const [semester, setSemester] = useState<'1' | '2'>('1');
  const [academicYear, setAcademicYear] = useState<string>('2025/2026');
  const [description, setDescription] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const isAdmin = user?.role === 'admin';

  const validateAndSetFile = (selectedFile: File) => {
    // Max 25MB
    if (selectedFile.size > 25 * 1024 * 1024) {
      showErrorToast('Ukuran file tidak boleh melebihi 25 MB.');
      return;
    }

    const validExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];
    const lowerName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      showErrorToast('Format file harus berupa PDF, Word (.docx), PowerPoint (.pptx), atau Excel (.xlsx).');
      return;
    }

    setFile(selectedFile);
    showSuccessToast(`File "${selectedFile.name}" berhasil dipilih.`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showErrorToast('Judul Modul Ajar / RPP wajib diisi.');
      return;
    }
    if (!subjectId) {
      showErrorToast('Pilih Mata Pelajaran terlebih dahulu.');
      return;
    }
    if (!file) {
      showErrorToast('Silakan pilih file dokumen untuk diunggah.');
      return;
    }

    setIsUploading(true);

    try {
      const driveFile = await GoogleDriveService.uploadFile(file, 'Modules', user?.id);

      let ext: 'pdf' | 'docx' | 'pptx' | 'other' = 'pdf';
      const name = file.name.toLowerCase();
      if (name.endsWith('.docx') || name.endsWith('.doc')) ext = 'docx';
      else if (name.endsWith('.pptx') || name.endsWith('.ppt')) ext = 'pptx';

      addModule({
        title,
        subjectId,
        classLevel,
        semester,
        academicYear,
        description,
        fileType: ext,
        fileName: driveFile.fileName,
        fileSize: driveFile.fileSize,
        fileDriveId: driveFile.fileId,
        webViewLink: driveFile.webViewLink,
        webContentLink: driveFile.webContentLink,
        teacherId: user?.id || 'global_teacher',
        teacherName: user?.fullName || 'Guru Pengajar'
      });

      setIsUploading(false);
      setTitle('');
      setDescription('');
      setFile(null);
      setActiveTab('arsip');
      showSuccessToast('Modul Ajar / RPP berhasil diunggah ke Google Drive dan tersimpan!');
    } catch (error: any) {
      setIsUploading(false);
      showErrorToast(error.message || 'Gagal mengunggah file ke Google Drive.');
    }
  };

  const handleDelete = async (id: string, moduleTitle: string) => {
    const confirm = await showConfirmModal(
      'Hapus Arsip Modul/RPP',
      `Apakah Anda yakin ingin menghapus arsip "${moduleTitle}"?`,
      'Ya, Hapus'
    );
    if (confirm) {
      deleteModule(id);
    }
  };

  const filteredModules = modules.filter((m) => {
    const isOwner = isAdmin || m.teacherId === user?.id;
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.teacherName && m.teacherName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubj = selectedSubjectFilter === 'all' || m.subjectId === selectedSubjectFilter;
    const matchesLevel = selectedLevelFilter === 'all' || m.classLevel === selectedLevelFilter;
    const matchesSemester = selectedSemesterFilter === 'all' || m.semester === selectedSemesterFilter;

    return isOwner && matchesSearch && matchesSubj && matchesLevel && matchesSemester;
  });

  const formatFileSize = (bytes?: string | number) => {
    if (!bytes) return 'PDF Document';
    if (typeof bytes === 'string' && !/^\d+$/.test(bytes)) return bytes;
    const num = Number(bytes);
    if (isNaN(num)) return 'Doc File';
    if (num < 1024) return num + ' B';
    if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
    return (num / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation & Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-[#696cff]" /> Arsip Modul Ajar / RPP (Google Drive)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Penyimpanan terpusat dokumen Modul Ajar, RPP, LKPD, dan media pembelajaran sekolah
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('arsip')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'arsip'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Arsip Dokumen ({filteredModules.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Unggah Baru
          </button>
          <button
            onClick={() => setActiveTab('gdrive_status')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'gdrive_status'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" /> GDrive Status
          </button>
        </div>
      </div>

      {/* TAB 1: DAFTAR ARSIP */}
      {activeTab === 'arsip' && (
        <div className="space-y-6">
          {/* Filter Bar & View Toggle */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari judul, nama file, atau guru..."
                  className="w-full bg-transparent text-xs focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
                />
              </div>

              {/* Subject Filter */}
              <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center">
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="all">Semua Mata Pelajaran</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Level Filter */}
              <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center">
                <select
                  value={selectedLevelFilter}
                  onChange={(e) => setSelectedLevelFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="all">Semua Tingkat Kelas</option>
                  <option value="7">Kelas 7</option>
                  <option value="8">Kelas 8</option>
                  <option value="9">Kelas 9</option>
                  <option value="10">Kelas 10</option>
                  <option value="11">Kelas 11</option>
                  <option value="12">Kelas 12</option>
                </select>
              </div>

              {/* Semester Filter */}
              <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center">
                <select
                  value={selectedSemesterFilter}
                  onChange={(e) => setSelectedSemesterFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="all">Semua Semester</option>
                  <option value="1">Semester 1 (Ganjil)</option>
                  <option value="2">Semester 2 (Genap)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-xs font-bold text-slate-500">
                Menampilkan <strong className="text-[#696cff]">{filteredModules.length}</strong> dokumen
              </span>

              {/* View Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-[#696cff] shadow-xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title="Tampilan Grid Card"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-[#696cff] shadow-xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title="Tampilan Tabel"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModules.length === 0 ? (
                <div className="col-span-full bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                  <FolderArchive className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Belum ada arsip Modul Ajar / RPP.</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Klik tab "Unggah Baru" untuk menambahkan dokumen Modul Ajar dan menyimpannya langsung ke Google Drive.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 rounded-xl bg-[#696cff] text-white text-xs font-bold shadow-md shadow-[#696cff]/20 inline-flex items-center gap-2 mt-2"
                  >
                    <Upload className="w-4 h-4" /> Unggah Modul Sekarang
                  </button>
                </div>
              ) : (
                filteredModules.map((mod) => (
                  <div
                    key={mod.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                          <HardDrive className="w-3 h-3" /> GDrive Sync
                        </span>
                        <span className="text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                          {formatFileSize(mod.fileSize)}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-[#696cff] transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-[#696cff] font-bold mt-1">
                        {mod.subjectName} • Kelas {mod.classLevel} (Sem {mod.semester})
                      </p>

                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <p className="font-semibold text-slate-700 dark:text-slate-200 truncate flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#696cff]" /> {mod.fileName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {mod.description || 'Tidak ada catatan atau deskripsi ringkasan.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Oleh: <strong className="text-slate-700 dark:text-slate-300">{mod.teacherName}</strong></span>
                        <span>{new Date(mod.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={mod.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Google Drive
                        </a>
                        {mod.webContentLink && (
                          <a
                            href={mod.webContentLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#696cff] transition-colors"
                            title="Unduh File Langsung"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      {(isAdmin || mod.teacherId === user?.id) && (
                        <button
                          onClick={() => handleDelete(mod.id, mod.title)}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Hapus Arsip Modul"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Judul & Nama File</th>
                      <th className="p-4">Mata Pelajaran</th>
                      <th className="p-4">Kelas & Semester</th>
                      <th className="p-4">Pengunggah</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredModules.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          Tidak ada data arsip modul ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredModules.map((mod) => (
                        <tr key={mod.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-bold text-slate-800 dark:text-slate-100 max-w-xs">
                            <p className="truncate">{mod.title}</p>
                            <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                              <File className="w-3 h-3 text-[#696cff]" /> {mod.fileName} ({formatFileSize(mod.fileSize)})
                            </span>
                          </td>
                          <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold">{mod.subjectName}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">
                            Kelas {mod.classLevel} • Sem {mod.semester} ({mod.academicYear})
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">
                            {mod.teacherName}
                            <p className="text-[10px] text-slate-400">{new Date(mod.createdAt).toLocaleDateString('id-ID')}</p>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <a
                                href={mod.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold transition-colors inline-flex items-center gap-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> GDrive
                              </a>
                              {(isAdmin || mod.teacherId === user?.id) && (
                                <button
                                  onClick={() => handleDelete(mod.id, mod.title)}
                                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UNGGAH DOKUMEN BARU */}
      {activeTab === 'upload' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#696cff]" /> Formulir Unggah Modul Ajar / RPP ke Google Drive
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Dokumen akan diunggah secara aman ke folder Google Drive sekolah dan metadatanya tersimpan otomatis.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            {/* SECTION 1: METADATA FORM */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">1. Informasi Kurikulum & Dokumen</h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Judul Modul Ajar / RPP *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Modul Ajar Matematika Bab 1 Kurikulum Merdeka"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran *</label>
                  <select
                    required
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tingkat Kelas *</label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  >
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                    <option value="10">Kelas 10</option>
                    <option value="11">Kelas 11</option>
                    <option value="12">Kelas 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Semester *</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as '1' | '2')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  >
                    <option value="1">Semester 1 (Ganjil)</option>
                    <option value="2">Semester 2 (Genap)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tahun Ajaran *</label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2025/2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ringkasan / Capaian Pembelajaran (CP)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan ringkas cakupan LKPD, bab, tujuan pembelajaran, atau instruksi siswa..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>
            </div>

            {/* SECTION 2: FILE UPLOAD DROPZONE */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">2. File Dokumen (Google Drive Target)</h4>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#696cff] bg-[#696cff]/10 scale-[1.01]'
                    : file
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-[#696cff] bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                  className="hidden"
                  id="mod-file-dropzone"
                />
                <label htmlFor="mod-file-dropzone" className="cursor-pointer flex flex-col items-center gap-3">
                  {file ? (
                    <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#696cff]/10 text-[#696cff]">
                      <Upload className="w-10 h-10" />
                    </div>
                  )}

                  <div>
                    {file ? (
                      <div>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{file.name}</p>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                          Ukuran: {(file.size / (1024 * 1024)).toFixed(2)} MB • Klik untuk mengganti file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          Tarik & Lepas File di Sini, atau Klik untuk Memilih Dokumen
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Format yang didukung: PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx) (Maks 25MB)
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-500" /> Disimpan ke folder: <strong>GuruKu_Storage/Modules/</strong>
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('arsip')}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-3 rounded-2xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-extrabold text-xs shadow-lg shadow-[#696cff]/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Mengunggah ke Google Drive...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Simpan & Unggah Dokumen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: GDRIVE STATUS */}
      {activeTab === 'gdrive_status' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-emerald-500" /> Integrasi & Status Folder Google Drive
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Folder Google Drive berfungsi sebagai penyimpanan terstruktur untuk semua modul ajar dan lampiran sekolah.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> GDrive Connected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Nama Folder Root</p>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{systemSettings.googleDriveFolderName || 'GuruKu_Storage'}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total File Modul Tersimpan</p>
                <p className="text-sm font-extrabold text-[#696cff]">{modules.length} File Dokumen</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Keamanan Akses</p>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">Secure Access Link</p>
              </div>
            </div>

            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
              <h4 className="text-xs font-extrabold text-[#696cff] flex items-center gap-1.5">
                <FolderCheck className="w-4 h-4" /> Struktur Sub-Folder Google Drive Terpusat:
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-mono">
                <li>📁 /GuruKu_Storage/Modules/ (Tempat Arsip Modul Ajar & RPP)</li>
                <li>📁 /GuruKu_Storage/System/ (Tempat Kop Surat & Asset Sekolah)</li>
                <li>📁 /GuruKu_Storage/Avatars/ (Foto Profil Guru & Pengguna)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
