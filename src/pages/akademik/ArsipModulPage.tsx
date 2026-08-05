import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { GoogleDriveService } from '../../services/googleDrive';
import { showConfirmModal, showSuccessToast, showErrorToast } from '../../components/common/SweetAlert';
import { TeachingModule, ArchiveDocumentType } from '../../types';
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
  FolderCheck,
  Eye,
  Edit,
  X,
  RefreshCw,
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  Filter,
  Calendar,
  UserCheck,
  Layers,
  BookOpen,
  Database,
  Folder,
  FolderOpen,
  ChevronRight,
  User,
  Info
} from 'lucide-react';

// Categories list
const ARCHIVE_CATEGORIES: { type: ArchiveDocumentType; name: string; desc: string; iconBg: string; textColor: string }[] = [
  { type: 'CP', name: 'CP (Capaian Pembelajaran)', desc: 'Dokumen Capaian Pembelajaran Kurikulum Merdeka', iconBg: 'bg-indigo-50 dark:bg-indigo-950/40', textColor: 'text-indigo-600 dark:text-indigo-400' },
  { type: 'ATP', name: 'ATP (Alur Tujuan Pembelajaran)', desc: 'Alur Tujuan Pembelajaran per Fase & Tingkat', iconBg: 'bg-sky-50 dark:bg-sky-950/40', textColor: 'text-sky-600 dark:text-sky-400' },
  { type: 'KKTP', name: 'KKTP (Kriteria Ketercapaian)', desc: 'Kriteria Ketercapaian Tujuan Pembelajaran', iconBg: 'bg-teal-50 dark:bg-teal-950/40', textColor: 'text-teal-600 dark:text-teal-400' },
  { type: 'Prota', name: 'Prota (Program Tahunan)', desc: 'Rencana Alokasi Waktu Pembelajaran Satu Tahun', iconBg: 'bg-amber-50 dark:bg-amber-950/40', textColor: 'text-amber-600 dark:text-amber-400' },
  { type: 'Promes', name: 'Promes (Program Semester)', desc: 'Rencana Alokasi Waktu Pembelajaran Per Semester', iconBg: 'bg-purple-50 dark:bg-purple-950/40', textColor: 'text-purple-600 dark:text-purple-400' },
  { type: 'Modul Ajar', name: 'Modul Ajar / RPP', desc: 'Perencanaan Pembelajaran & Modul Ajar PDF', iconBg: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-600 dark:text-emerald-400' }
];

// PDF & Document Pratinjau Component
const PdfPreviewViewer: React.FC<{ mod: TeachingModule }> = ({ mod }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(false);
    let createdUrl: string | null = null;

    if (mod.webViewLink && mod.webViewLink.startsWith('data:')) {
      try {
        const parts = mod.webViewLink.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } catch (err) {
        console.error('Failed to convert base64 data to Blob:', err);
        setLoadError(true);
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }

    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [mod.webViewLink, mod.fileDriveId]);

  let directPdfUrl = '';
  if (blobUrl) {
    directPdfUrl = blobUrl;
  } else if (mod.fileDriveId && !mod.fileDriveId.startsWith('data:') && !mod.fileDriveId.startsWith('gdrive_mod_')) {
    directPdfUrl = `https://drive.google.com/uc?export=download&id=${mod.fileDriveId}`;
  } else if (mod.webContentLink && mod.webContentLink.startsWith('http')) {
    directPdfUrl = mod.webContentLink;
  } else if (mod.webViewLink && mod.webViewLink.startsWith('http')) {
    directPdfUrl = mod.webViewLink;
  }

  const nativePdfSrc = directPdfUrl ? `${directPdfUrl}#toolbar=1&navpanes=1&scrollbar=1` : '';
  const externalOpenUrl =
    mod.webViewLink && mod.webViewLink.startsWith('http')
      ? mod.webViewLink
      : mod.fileDriveId && !mod.fileDriveId.startsWith('gdrive_')
      ? `https://drive.google.com/file/d/${mod.fileDriveId}/view?usp=sharing`
      : directPdfUrl || GoogleDriveService.getDriveDownloadUrl(mod.webContentLink, mod.fileDriveId);

  return (
    <div className="w-full h-[75vh] min-h-[500px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 relative flex flex-col">
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700/80 text-white text-xs">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">Pratinjau Dokumen PDF</span>
          <span className="bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-500/30 flex items-center gap-1">
            <Database className="w-3 h-3 text-emerald-400" /> Supabase Storage
          </span>
          <span className="bg-rose-500/20 text-rose-300 font-extrabold px-2 py-0.5 rounded text-[10px]">PDF ONLY</span>
        </div>
        <div className="flex items-center gap-2">
          {externalOpenUrl && externalOpenUrl.startsWith('http') && (
            <a
              href={externalOpenUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-300 hover:text-indigo-200 flex items-center gap-1.5 text-[11px] font-semibold bg-slate-700/80 hover:bg-slate-700 px-3 py-1 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka PDF di Tab Baru
            </a>
          )}
        </div>
      </div>

      <div className="flex-1 relative bg-slate-950 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white gap-3 z-10">
            <RefreshCw className="w-8 h-8 text-[#696cff] animate-spin" />
            <p className="text-xs font-semibold">Memuat Pratinjau Dokumen PDF...</p>
          </div>
        )}

        {loadError || !nativePdfSrc ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-300 space-y-4">
            <div className="p-5 bg-amber-500/10 text-amber-300 rounded-2xl border border-amber-500/20 max-w-lg space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
              <p className="text-sm font-bold text-amber-200">Pratinjau PDF Tidak Dapat Ditampilkan Langsung</p>
              <p className="text-xs text-slate-300">
                Silakan buka file PDF di tab baru atau unduh langsung file ke perangkat Anda.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {externalOpenUrl && externalOpenUrl.startsWith('http') && (
                <a
                  href={externalOpenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#696cff] hover:bg-[#5f61e6] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Buka PDF di Tab Baru
                </a>
              )}
              <a
                href={GoogleDriveService.getDriveDownloadUrl(mod.webContentLink, mod.fileDriveId)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </div>
          </div>
        ) : (
          <object
            data={nativePdfSrc}
            type="application/pdf"
            className="w-full h-full border-0"
            onError={() => setLoadError(true)}
          >
            <embed
              src={nativePdfSrc}
              type="application/pdf"
              className="w-full h-full border-0"
            />
            <iframe
              src={nativePdfSrc}
              title={mod.title}
              className="w-full h-full border-0"
            />
          </object>
        )}
      </div>
    </div>
  );
};

export const ArsipModulPage: React.FC = () => {
  const { user } = useAuth();
  const { subjects, modules, teachers, classes, addModule, updateModule, deleteModule, activeAcademicYear, academicYears, refreshData } = useData();

  const [activeTab, setActiveTab] = useState<'arsip' | 'upload' | 'gdrive_status'>('arsip');
  const [viewMode, setViewMode] = useState<'folder' | 'grid' | 'table'>('folder');

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedDocTypeFilter, setSelectedDocTypeFilter] = useState<string>('all');

  // Folder Navigation State
  const [selectedCategoryFolder, setSelectedCategoryFolder] = useState<{ semester: '1' | '2'; category: ArchiveDocumentType } | null>(null);

  // Upload Form State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [documentType, setDocumentType] = useState<ArchiveDocumentType>('Modul Ajar');
  const [uploadTeacherId, setUploadTeacherId] = useState<string>(user?.id || '');
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classLevel, setClassLevel] = useState<string>('');
  const [semester, setSemester] = useState<'1' | '2'>(activeAcademicYear.semester || '1');
  const [academicYear, setAcademicYear] = useState<string>(activeAcademicYear.year || '2025/2026');
  const [description, setDescription] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Preview Modal State
  const [previewModule, setPreviewModule] = useState<TeachingModule | null>(null);

  // Edit Modal State
  const [editingModule, setEditingModule] = useState<TeachingModule | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDocumentType, setEditDocumentType] = useState<ArchiveDocumentType>('Modul Ajar');
  const [editSubjectId, setEditSubjectId] = useState<string>('');
  const [editClassId, setEditClassId] = useState<string>('');
  const [editClassLevel, setEditClassLevel] = useState<string>('');
  const [editSemester, setEditSemester] = useState<'1' | '2'>('1');
  const [editAcademicYear, setEditAcademicYear] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editReplacementFile, setEditReplacementFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const isAdmin = user?.role === 'admin';

  // Compute Active Classes filtered by Active Academic Year and Role (RBAC)
  const availableClasses = useMemo(() => {
    if (!classes || classes.length === 0) return [];

    let list = classes.filter((c) => {
      // Synchronize with Active Academic Year
      if (c.academicYear && activeAcademicYear?.year) {
        return c.academicYear === activeAcademicYear.year;
      }
      return true;
    });

    // Role-based Access Control (Guru only sees assigned classes)
    if (!isAdmin && user?.id) {
      list = list.filter((c) => {
        const isHomeroom = c.homeroomTeacherId === user.id;
        const isTeacherAssigned = c.teacherIds && c.teacherIds.includes(user.id);
        return isHomeroom || isTeacherAssigned;
      });
    }

    // Sort by Grade Level / Class Name
    return list.sort((a, b) => {
      const nameA = (a.name || '').toUpperCase();
      const nameB = (b.name || '').toUpperCase();
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [classes, activeAcademicYear, isAdmin, user]);

  useEffect(() => {
    if (availableClasses.length > 0) {
      const existing = availableClasses.find((c) => c.id === selectedClassId || c.name === classLevel);
      if (!existing) {
        setSelectedClassId(availableClasses[0].id);
        setClassLevel(availableClasses[0].name);
      } else {
        if (selectedClassId !== existing.id) setSelectedClassId(existing.id);
        if (classLevel !== existing.name) setClassLevel(existing.name);
      }
    } else {
      setSelectedClassId('');
      setClassLevel('');
    }
  }, [availableClasses]);

  useEffect(() => {
    if (activeAcademicYear) {
      setAcademicYear(activeAcademicYear.year);
      setSemester(activeAcademicYear.semester);
    }
  }, [activeAcademicYear]);

  useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  useEffect(() => {
    if (user?.id && !uploadTeacherId) {
      setUploadTeacherId(user.id);
    }
  }, [user, uploadTeacherId]);

  // STRICT PDF VALIDATION
  const validateAndSetFile = (selectedFile: File) => {
    // Max 25MB
    if (selectedFile.size > 25 * 1024 * 1024) {
      showErrorToast('Ukuran file tidak boleh melebihi 25 MB.');
      return;
    }

    const lowerName = selectedFile.name.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf') || selectedFile.type === 'application/pdf';

    if (!isPdf) {
      showErrorToast('Hanya file PDF (.pdf) yang diperbolehkan untuk diunggah.');
      return;
    }

    setFile(selectedFile);
    showSuccessToast(`File PDF "${selectedFile.name}" berhasil dipilih.`);
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

  // Upload Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showErrorToast('Judul Dokumen wajib diisi.');
      return;
    }
    if (!subjectId) {
      showErrorToast('Pilih Mata Pelajaran terlebih dahulu.');
      return;
    }
    if (!file) {
      showErrorToast('Silakan pilih file PDF untuk diunggah.');
      return;
    }

    // Double-check PDF extension
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      showErrorToast('Hanya file PDF (.pdf) yang diperbolehkan untuk diunggah.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      const selectedSubjectObj = subjects.find((s) => s.id === subjectId);
      const subjectName = selectedSubjectObj ? selectedSubjectObj.name : 'Informatika';
      const targetTeacherId = isAdmin && uploadTeacherId ? uploadTeacherId : user?.id || 'global_teacher';
      const targetTeacherObj = teachers.find((t) => t.id === targetTeacherId);
      const targetTeacherName = targetTeacherObj ? targetTeacherObj.fullName : user?.fullName || 'Guru Pengajar';

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 250);

      // Upload binary file to Google Drive
      const driveFile = await GoogleDriveService.uploadModuleFile(file, {
        academicYear,
        semester,
        subjectName,
        classLevel,
        uploaderIdOrName: targetTeacherName
      });

      clearInterval(progressInterval);
      setUploadProgress(95);

      // Save metadata to Supabase PostgreSQL
      await addModule({
        title,
        documentType,
        subjectId,
        subjectName,
        classId: selectedClassId,
        classLevel,
        semester,
        academicYear,
        description,
        fileType: 'pdf',
        fileName: driveFile.fileName,
        fileSize: driveFile.fileSize,
        fileDriveId: driveFile.googleDriveFileId,
        driveFolderId: driveFile.driveFolderId,
        folderPath: driveFile.folderPath,
        webViewLink: driveFile.webViewLink,
        webContentLink: driveFile.webContentLink,
        teacherId: targetTeacherId,
        teacherName: targetTeacherName,
        uploadedBy: user?.id || targetTeacherId
      });

      setUploadProgress(100);
      setIsUploading(false);

      // Auto refresh data from database
      if (refreshData) {
        await refreshData();
      }

      // Reset filters so the newly uploaded PDF is immediately visible in the list
      setSelectedCategoryFolder(null);
      setSearchTerm('');
      setSelectedDocTypeFilter('all');
      setSelectedSemesterFilter('all');
      setSelectedLevelFilter('all');
      setSelectedSubjectFilter('all');
      if (isAdmin) setSelectedTeacherFilter('all');

      // Construct uploaded module object for instant PDF preview
      const uploadedMod: TeachingModule = {
        id: `mod_${Date.now()}`,
        title,
        documentType,
        subjectId,
        subjectName,
        classId: selectedClassId,
        classLevel,
        semester,
        academicYear,
        description,
        fileType: 'pdf',
        fileName: driveFile.fileName,
        fileSize: driveFile.fileSize,
        fileDriveId: driveFile.googleDriveFileId,
        webViewLink: driveFile.webViewLink,
        webContentLink: driveFile.webContentLink,
        teacherId: targetTeacherId,
        teacherName: targetTeacherName,
        uploadedBy: user?.id || targetTeacherId,
        createdAt: new Date().toISOString()
      };

      setTitle('');
      setDescription('');
      setFile(null);

      // Show success notification
      showSuccessToast('✅ Upload Modul Ajar berhasil. File PDF berhasil disimpan.');

      // Switch to archive tab and set preview
      setActiveTab('arsip');
      setPreviewModule(uploadedMod);
    } catch (error: any) {
      setIsUploading(false);
      setUploadProgress(0);
      showErrorToast(error.message || 'Gagal mengunggah file ke Google Drive dan Supabase.');
    }
  };

  // Open Edit Modal
  const openEditModal = (mod: TeachingModule) => {
    setEditingModule(mod);
    setEditTitle(mod.title);
    setEditDocumentType(mod.documentType || 'Modul Ajar');
    setEditSubjectId(mod.subjectId);
    setEditClassLevel(mod.classLevel);
    const matchingCls = classes.find((c) => c.id === mod.classId || c.name === mod.classLevel);
    setEditClassId(matchingCls ? matchingCls.id : mod.classId || '');
    setEditSemester(mod.semester);
    setEditAcademicYear(mod.academicYear);
    setEditDescription(mod.description || '');
    setEditReplacementFile(null);
  };

  // Save Edit Changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule) return;
    if (!editTitle.trim()) {
      showErrorToast('Judul Dokumen wajib diisi.');
      return;
    }

    setIsUpdating(true);

    try {
      let updatedDriveInfo: any = {};

      if (editReplacementFile) {
        const isPdf = editReplacementFile.name.toLowerCase().endsWith('.pdf') || editReplacementFile.type === 'application/pdf';
        if (!isPdf) {
          showErrorToast('Hanya file PDF (.pdf) yang diperbolehkan untuk diunggah.');
          setIsUpdating(false);
          return;
        }

        const selectedSubjectObj = subjects.find((s) => s.id === editSubjectId);
        const subjectName = selectedSubjectObj ? selectedSubjectObj.name : 'Informatika';

        if (editingModule.fileDriveId) {
          await GoogleDriveService.deleteFile(editingModule.fileDriveId);
        }

        const newDriveFile = await GoogleDriveService.uploadModuleFile(editReplacementFile, {
          academicYear: editAcademicYear,
          semester: editSemester,
          subjectName,
          classLevel: editClassLevel,
          uploaderIdOrName: editingModule.teacherName || user?.fullName || 'Guru'
        });

        updatedDriveInfo = {
          fileName: newDriveFile.fileName,
          fileSize: newDriveFile.fileSize,
          fileDriveId: newDriveFile.googleDriveFileId,
          driveFolderId: newDriveFile.driveFolderId,
          folderPath: newDriveFile.folderPath,
          webViewLink: newDriveFile.webViewLink,
          webContentLink: newDriveFile.webContentLink
        };
      }

      await updateModule(editingModule.id, {
        title: editTitle,
        documentType: editDocumentType,
        subjectId: editSubjectId,
        classId: editClassId,
        classLevel: editClassLevel,
        semester: editSemester,
        academicYear: editAcademicYear,
        description: editDescription,
        ...updatedDriveInfo
      });

      setIsUpdating(false);
      setEditingModule(null);
    } catch (err: any) {
      setIsUpdating(false);
      showErrorToast(err.message || 'Gagal memperbarui metadata modul.');
    }
  };

  // Delete Module Handler
  const handleDelete = async (id: string, moduleTitle: string) => {
    const confirm = await showConfirmModal(
      'Hapus Arsip Modul / RPP',
      `Apakah Anda yakin ingin menghapus arsip "${moduleTitle}"? File PDF di Google Drive dan metadata di Supabase akan dihapus permanen.`,
      'Ya, Hapus Permanen'
    );
    if (confirm) {
      deleteModule(id);
    }
  };

  // Filter Logic (Admin sees all teachers by default, Guru sees ONLY their own)
  const userFilteredModules = modules.filter((m) => {
    if (isAdmin) return true;
    return m.teacherId === user?.id || m.uploadedBy === user?.id;
  });

  const filteredModules = userFilteredModules.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.teacherName && m.teacherName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.subjectName && m.subjectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.classLevel && m.classLevel.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTeacher = selectedTeacherFilter === 'all' || m.teacherId === selectedTeacherFilter || m.uploadedBy === selectedTeacherFilter;
    const matchesSubj = selectedSubjectFilter === 'all' || m.subjectId === selectedSubjectFilter;
    const matchesLevel = selectedLevelFilter === 'all' || m.classLevel === selectedLevelFilter || m.classLevel?.includes(selectedLevelFilter);
    const matchesSemester = selectedSemesterFilter === 'all' || m.semester === selectedSemesterFilter;
    const matchesYear = selectedYearFilter === 'all' || m.academicYear === selectedYearFilter;
    const matchesDocType = selectedDocTypeFilter === 'all' || m.documentType === selectedDocTypeFilter;

    const matchesFolder = !selectedCategoryFolder || (m.semester === selectedCategoryFolder.semester && (m.documentType || 'Modul Ajar') === selectedCategoryFolder.category);

    return matchesSearch && matchesTeacher && matchesSubj && matchesLevel && matchesSemester && matchesYear && matchesDocType && matchesFolder;
  });

  // Calculate Dashboard Metrics
  const totalModulCount = userFilteredModules.length;
  const totalPDFCount = userFilteredModules.filter((m) => m.fileName.toLowerCase().endsWith('.pdf') || m.fileType === 'pdf').length;
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const thisMonthUploads = userFilteredModules.filter((m) => m.createdAt && m.createdAt.startsWith(currentMonthStr)).length;
  const lastUploadDate = userFilteredModules.length > 0 
    ? new Date(Math.max(...userFilteredModules.map((m) => new Date(m.createdAt).getTime()))).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

  const formatFileSize = (bytes?: string | number) => {
    if (!bytes) return 'PDF Doc';
    if (typeof bytes === 'string' && !/^\d+$/.test(bytes)) return bytes;
    const num = Number(bytes);
    if (isNaN(num)) return 'Document';
    if (num < 1024) return num + ' B';
    if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
    return (num / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-[#696cff]" /> Arsip Modul Ajar / RPP (Struktur Folder Hirarki)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manajemen arsip terstruktur berdasarkan Semester (Semester 1 & 2) dan Kategori (CP, ATP, KKTP, Prota, Promes, Modul Ajar) dalam format PDF.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => { setActiveTab('arsip'); setSelectedCategoryFolder(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'arsip'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Arsip Dokumen ({filteredModules.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Unggah PDF Baru
          </button>
          <button
            onClick={() => setActiveTab('gdrive_status')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'gdrive_status'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Status Storage & DB
          </button>
        </div>
      </div>

      {/* DASHBOARD METRICS CARDS (Admin Only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Arsip Dokumen</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalModulCount} <span className="text-xs font-normal text-slate-400">File</span></h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-[#696cff] rounded-2xl">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Format Valid PDF</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalPDFCount} <span className="text-xs font-normal text-slate-400">PDF</span></h3>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upload Bulan Ini</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{thisMonthUploads} <span className="text-xs font-normal text-slate-400">Dokumen</span></h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Upload className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upload Terakhir</p>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2">{lastUploadDate}</h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: DAFTAR ARSIP MODUL */}
      {activeTab === 'arsip' && (
        <div className="space-y-6">
          {/* Breadcrumb Navigation when viewing folder content */}
          {selectedCategoryFolder && (
            <div className="flex items-center gap-2 bg-indigo-50/80 dark:bg-indigo-950/40 px-4 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-xs text-slate-700 dark:text-slate-200">
              <button
                onClick={() => setSelectedCategoryFolder(null)}
                className="font-bold text-[#696cff] hover:underline flex items-center gap-1"
              >
                <Folder className="w-4 h-4" /> Beranda Arsip
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-500">Semester {selectedCategoryFolder.semester}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-black text-[#696cff] bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                {selectedCategoryFolder.category}
              </span>
              <button
                onClick={() => setSelectedCategoryFolder(null)}
                className="ml-auto px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 text-[11px] font-bold border border-slate-200 dark:border-slate-700"
              >
                Kembali ke Semua Folder
              </button>
            </div>
          )}

          {/* Filter Bar & View Toggle */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Search */}
              <div className="bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2.5 col-span-1 sm:col-span-2 lg:col-span-1">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari judul, guru, mapel..."
                  className="w-full bg-transparent text-xs focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
                />
              </div>

              {/* Admin Guru Filter */}
              {isAdmin && (
                <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center">
                  <select
                    value={selectedTeacherFilter}
                    onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
                  >
                    <option value="all">Semua Guru</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              {/* Jenis Dokumen Filter */}
              <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center">
                <select
                  value={selectedDocTypeFilter}
                  onChange={(e) => setSelectedDocTypeFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="all">Semua Jenis Dokumen</option>
                  <option value="CP">CP (Capaian Pembelajaran)</option>
                  <option value="ATP">ATP (Alur Tujuan Pembelajaran)</option>
                  <option value="KKTP">KKTP (Kriteria Ketercapaian)</option>
                  <option value="Prota">Prota (Program Tahunan)</option>
                  <option value="Promes">Promes (Program Semester)</option>
                  <option value="Modul Ajar">Modul Ajar / RPP</option>
                </select>
              </div>

              {/* Class Filter */}
              <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center">
                <select
                  value={selectedLevelFilter}
                  onChange={(e) => setSelectedLevelFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="all">Semua Kelas</option>
                  {(isAdmin ? classes : availableClasses).map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
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

              {/* Academic Year Filter */}
              <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center">
                <select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="all">Semua Tahun Ajaran</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.year}>
                      {ay.year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-xs font-bold text-slate-500">
                Menampilkan <strong className="text-[#696cff]">{filteredModules.length}</strong> dokumen arsip ({isAdmin ? 'Role Administrator - Seluruh Sekolah' : 'Khusus Modul Saya'})
              </span>

              {/* View Switcher (Admin Only) */}
              {isAdmin && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => { setViewMode('folder'); setSelectedCategoryFolder(null); }}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      viewMode === 'folder'
                        ? 'bg-white dark:bg-slate-700 text-[#696cff] shadow-xs'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                    title="Tampilan Hirarki Folder"
                  >
                    <Folder className="w-4 h-4" /> Folder
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-700 text-[#696cff] shadow-xs'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                    title="Tampilan Grid Card"
                  >
                    <LayoutGrid className="w-4 h-4" /> Grid
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
                    <List className="w-4 h-4" /> Tabel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: STRUKTUR FOLDER HIRARKI */}
          {viewMode === 'folder' && !selectedCategoryFolder && (
            <div className="space-y-8">
              {/* SEMESTER 1 SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-[#696cff]" /> Semester 1 (Ganjil)
                  </h3>
                  <span className="text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {userFilteredModules.filter((m) => m.semester === '1').length} File Dokumen
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ARCHIVE_CATEGORIES.map((cat) => {
                    const count = userFilteredModules.filter((m) => m.semester === '1' && (m.documentType || 'Modul Ajar') === cat.type).length;
                    return (
                      <div
                        key={`sem1_${cat.type}`}
                        onClick={() => setSelectedCategoryFolder({ semester: '1', category: cat.type })}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-[#696cff]/40 transition-all cursor-pointer group flex items-start gap-4"
                      >
                        <div className={`p-3.5 rounded-2xl ${cat.iconBg} ${cat.textColor} shrink-0 group-hover:scale-105 transition-transform`}>
                          <Folder className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-[#696cff] transition-colors truncate">
                              {cat.type}
                            </h4>
                            <span className="text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md shrink-0">
                              {count} PDF
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{cat.desc}</p>
                          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#696cff] opacity-80 group-hover:opacity-100">
                            <span>Buka Folder</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEMESTER 2 SECTION */}
              <div className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-[#696cff]" /> Semester 2 (Genap)
                  </h3>
                  <span className="text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {userFilteredModules.filter((m) => m.semester === '2').length} File Dokumen
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ARCHIVE_CATEGORIES.map((cat) => {
                    const count = userFilteredModules.filter((m) => m.semester === '2' && (m.documentType || 'Modul Ajar') === cat.type).length;
                    return (
                      <div
                        key={`sem2_${cat.type}`}
                        onClick={() => setSelectedCategoryFolder({ semester: '2', category: cat.type })}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-[#696cff]/40 transition-all cursor-pointer group flex items-start gap-4"
                      >
                        <div className={`p-3.5 rounded-2xl ${cat.iconBg} ${cat.textColor} shrink-0 group-hover:scale-105 transition-transform`}>
                          <Folder className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-[#696cff] transition-colors truncate">
                              {cat.type}
                            </h4>
                            <span className="text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md shrink-0">
                              {count} PDF
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{cat.desc}</p>
                          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#696cff] opacity-80 group-hover:opacity-100">
                            <span>Buka Folder</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* GRID VIEW or FOLDER INSIDE VIEW */}
          {(viewMode === 'grid' || selectedCategoryFolder) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModules.length === 0 ? (
                <div className="col-span-full bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                  <FolderArchive className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Belum ada dokumen PDF ditemukan pada folder ini.</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Klik tombol "Unggah PDF Baru" untuk mengunggah dokumen baru. Hanya format file PDF (.pdf) yang diperbolehkan.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 rounded-xl bg-[#696cff] text-white text-xs font-bold shadow-md shadow-[#696cff]/20 inline-flex items-center gap-2 mt-2"
                  >
                    <Upload className="w-4 h-4" /> Unggah PDF Sekarang
                  </button>
                </div>
              ) : (
                filteredModules.map((mod) => (
                  <div
                    key={mod.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase bg-indigo-500/10 text-[#696cff] px-2.5 py-1 rounded-full flex items-center gap-1 border border-indigo-200 dark:border-indigo-800">
                          {mod.documentType || 'Modul Ajar'}
                        </span>
                        <span className="text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <FileText className="w-3 h-3 text-rose-500" /> PDF • {formatFileSize(mod.fileSize)}
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5 mb-2">
                        <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-[#696cff] transition-colors">
                            {mod.title}
                          </h3>
                          <p className="text-xs text-[#696cff] font-bold mt-0.5">
                            {mod.subjectName} • Kelas {mod.classLevel} (Sem {mod.semester} - {mod.academicYear})
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <p className="font-semibold text-slate-700 dark:text-slate-200 truncate flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-rose-500" /> {mod.fileName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {mod.description || 'Tidak ada catatan deskripsi.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Oleh: <strong className="text-slate-700 dark:text-slate-300">{mod.teacherName || 'Guru'}</strong></span>
                        <span>{new Date(mod.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewModule(mod)}
                          className="px-3 py-1.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                          title="Lihat Pratinjau Dokumen PDF"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <a
                          href={GoogleDriveService.getDriveDownloadUrl(mod.webContentLink, mod.fileDriveId)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#696cff] transition-colors"
                          title="Unduh dari Google Drive"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>

                      {(isAdmin || mod.teacherId === user?.id || mod.uploadedBy === user?.id) && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(mod)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 transition-colors"
                            title="Edit Metadata / Ganti File PDF"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(mod.id, mod.title)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Hapus Arsip PDF"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === 'table' && !selectedCategoryFolder && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Jenis & Judul Dokumen</th>
                      <th className="p-4">Mata Pelajaran</th>
                      <th className="p-4">Kelas & Semester</th>
                      <th className="p-4">Guru / Pengunggah</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredModules.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          Tidak ada data arsip modul PDF ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredModules.map((mod) => (
                        <tr key={mod.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-bold text-slate-800 dark:text-slate-100 max-w-xs">
                            <div className="flex items-start gap-2.5">
                              <FileText className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <span className="text-[10px] font-black uppercase text-[#696cff] bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md mb-1 inline-block">
                                  {mod.documentType || 'Modul Ajar'}
                                </span>
                                <p className="truncate font-bold text-slate-800 dark:text-slate-100">{mod.title}</p>
                                <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                                  {mod.fileName} ({formatFileSize(mod.fileSize)})
                                </span>
                              </div>
                            </div>
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
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setPreviewModule(mod)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold transition-colors inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> Preview
                              </button>
                              <a
                                href={GoogleDriveService.getDriveDownloadUrl(mod.webContentLink, mod.fileDriveId)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#696cff]"
                                title="Unduh File PDF"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              {(isAdmin || mod.teacherId === user?.id || mod.uploadedBy === user?.id) && (
                                <>
                                  <button
                                    onClick={() => openEditModal(mod)}
                                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500"
                                    title="Edit Metadata"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(mod.id, mod.title)}
                                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
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
              <Upload className="w-5 h-5 text-[#696cff]" /> Formulir Unggah Dokumen PDF (Struktur Folder Hirarki)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Dokumen PDF akan diunggah otomatis ke Google Drive dan metadatanya tersimpan di Supabase PostgreSQL. <strong>Hanya file PDF (.pdf) yang diperbolehkan.</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            {/* Target Folder Preview */}
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-1 font-mono text-xs text-slate-700 dark:text-slate-200">
              <p className="text-[10px] uppercase font-black tracking-wider text-[#696cff] flex items-center gap-1">
                <FolderCheck className="w-3.5 h-3.5" /> Target Lokasi Folder Otomatis:
              </p>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                📁 Semester {semester} / {documentType} / {subjects.find((s) => s.id === subjectId)?.name || 'Mata Pelajaran'} ({classLevel})
              </p>
            </div>

            {/* SECTION 1: METADATA FORM */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">1. Informasi & Metadata Dokumen PDF</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Judul Dokumen *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Modul Ajar Bab 1 Algoritma dan Pemrograman"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff] font-medium text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jenis Dokumen *</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as ArchiveDocumentType)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100"
                  >
                    <option value="CP">CP (Capaian Pembelajaran)</option>
                    <option value="ATP">ATP (Alur Tujuan Pembelajaran)</option>
                    <option value="KKTP">KKTP (Kriteria Ketercapaian)</option>
                    <option value="Prota">Prota (Program Tahunan)</option>
                    <option value="Promes">Promes (Program Semester)</option>
                    <option value="Modul Ajar">Modul Ajar / RPP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isAdmin && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Guru Pengajar (Role Admin) *</label>
                    <select
                      value={uploadTeacherId}
                      onChange={(e) => setUploadTeacherId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran *</label>
                  <select
                    required
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tingkat / Kelas *</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      const clsId = e.target.value;
                      setSelectedClassId(clsId);
                      const clsObj = availableClasses.find((c) => c.id === clsId);
                      if (clsObj) {
                        setClassLevel(clsObj.name);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100"
                  >
                    {availableClasses.length === 0 ? (
                      <option value="">Tidak ada kelas aktif</option>
                    ) : (
                      availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Semester *</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value as '1' | '2')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Catatan Dokumen
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ringkasan materi, instruksi, atau catatan CP/ATP/KKTP/Modul Ajar..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* SECTION 2: FILE DROPZONE (STRICT PDF ONLY) */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">2. Pilih File Dokumen (Khusus File PDF)</h4>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900">
                  Strict Validation: Hanya PDF (.pdf)
                </span>
              </div>

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
                  accept=".pdf"
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
                      <FileText className="w-10 h-10 text-rose-500" />
                    </div>
                  )}

                  <div>
                    {file ? (
                      <div>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                          <FileText className="w-4 h-4 text-rose-500" /> {file.name}
                        </p>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                          Ukuran: {(file.size / (1024 * 1024)).toFixed(2)} MB • Klik untuk mengganti file PDF
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                          Tarik & Lepas File PDF di Sini, atau Klik untuk Memilih Dokumen PDF
                        </p>
                        <p className="text-xs text-rose-500 font-bold mt-1">
                          Hanya diperbolehkan file PDF (.pdf). File DOC, DOCX, XLS, PPT, Gambar, dsb. akan ditolak otomatis.
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-[#696cff] border-t-transparent rounded-full animate-spin"></span>
                      Mengunggah file PDF ke Google Drive & menyimpan metadata ke Supabase...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#696cff] transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-500" /> Storage: <strong>Google Drive & Supabase PostgreSQL</strong>
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
                      <span>Mengunggah File PDF...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Simpan & Unggah PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: GDRIVE & SUPABASE STATUS */}
      {activeTab === 'gdrive_status' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-emerald-500" /> Integrasi Storage & Database Versi Hirarki
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Single Source of Truth Metadata: Supabase PostgreSQL (Tabel archive_categories, archive_folders, archive_documents) + Google Drive API.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> GDrive Connected
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[#696cff] text-xs font-bold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Supabase Synchronized
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Penyimpanan File Fisik</p>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Google Drive API</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Folder Semester & Category</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Database Single Source of Truth</p>
                <p className="text-sm font-extrabold text-[#696cff]">Supabase PostgreSQL</p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">archive_documents Active</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Validasi File</p>
                <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400">PDF (.pdf) Strict</p>
                <p className="text-[11px] text-slate-400 font-semibold">Tolak Otomatis Non-PDF</p>
              </div>
            </div>

            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
              <h4 className="text-xs font-extrabold text-[#696cff] flex items-center gap-1.5">
                <FolderCheck className="w-4 h-4" /> Hirarki Folder Arsip Modul Ajar / RPP:
              </h4>
              <pre className="text-xs text-slate-700 dark:text-slate-200 font-mono bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 overflow-x-auto">
{`Arsip Modul Ajar / RPP
│
├── Semester 1
│   ├── CP
│   ├── ATP
│   ├── KKTP
│   ├── Prota
│   ├── Promes
│   └── Modul Ajar
│
└── Semester 2
    ├── CP
    ├── ATP
    ├── KKTP
    ├── Prota
    ├── Promes
    └── Modul Ajar`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewModule && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase text-[#696cff] bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">
                    {previewModule.documentType || 'Modul Ajar'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                    {previewModule.subjectName} • Kelas {previewModule.classLevel}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900 flex items-center gap-1">
                    <Database className="w-3 h-3 text-emerald-500" /> Supabase DB
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mt-1">
                  <FileText className="w-5 h-5 text-rose-500" /> {previewModule.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Guru: <strong className="text-slate-700 dark:text-slate-200">{previewModule.teacherName}</strong> • Tanggal Upload: {new Date(previewModule.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <button
                onClick={() => setPreviewModule(null)}
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Detail Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Jenis Dokumen</span>
                <span className="font-extrabold text-[#696cff]">{previewModule.documentType || 'Modul Ajar'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Mata Pelajaran</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{previewModule.subjectName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Semester & Tahun</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Sem {previewModule.semester} ({previewModule.academicYear})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tingkat Kelas</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Kelas {previewModule.classLevel}</span>
              </div>
            </div>

            {/* Document Viewer */}
            <PdfPreviewViewer mod={previewModule} />

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-xs text-slate-400 truncate max-w-md">
                Nama File: <strong className="text-slate-700 dark:text-slate-300">{previewModule.fileName}</strong> ({formatFileSize(previewModule.fileSize)})
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={GoogleDriveService.getDriveDownloadUrl(previewModule.webContentLink, previewModule.fileDriveId)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" /> Unduh Dokumen PDF
                </a>
                <button
                  onClick={() => setPreviewModule(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingModule && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#696cff]" /> Ubah Metadata Arsip Modul / RPP
              </h3>
              <button
                onClick={() => setEditingModule(null)}
                className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Judul Dokumen *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jenis Dokumen *</label>
                  <select
                    value={editDocumentType}
                    onChange={(e) => setEditDocumentType(e.target.value as ArchiveDocumentType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    <option value="CP">CP (Capaian Pembelajaran)</option>
                    <option value="ATP">ATP (Alur Tujuan Pembelajaran)</option>
                    <option value="KKTP">KKTP (Kriteria Ketercapaian)</option>
                    <option value="Prota">Prota (Program Tahunan)</option>
                    <option value="Promes">Promes (Program Semester)</option>
                    <option value="Modul Ajar">Modul Ajar / RPP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran</label>
                  <select
                    value={editSubjectId}
                    onChange={(e) => setEditSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tingkat Kelas</label>
                  <select
                    value={editClassId}
                    onChange={(e) => {
                      const clsVal = e.target.value;
                      setEditClassId(clsVal);
                      const clsObj = availableClasses.find((c) => c.id === clsVal) || classes.find((c) => c.id === clsVal);
                      if (clsObj) {
                        setEditClassLevel(clsObj.name);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    {availableClasses.length === 0 ? (
                      <option value="">Tidak ada kelas aktif</option>
                    ) : (
                      availableClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                  <select
                    value={editSemester}
                    onChange={(e) => setEditSemester(e.target.value as '1' | '2')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    <option value="1">Semester 1 (Ganjil)</option>
                    <option value="2">Semester 2 (Genap)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={editAcademicYear}
                    onChange={(e) => setEditAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Dokumen</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ganti File Dokumen PDF (Hanya .pdf)
                </label>
                <input
                  type="file"
                  onChange={(e) => e.target.files && setEditReplacementFile(e.target.files[0])}
                  accept=".pdf"
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#696cff] file:text-white hover:file:bg-[#5f61e6]"
                />
                {editReplacementFile && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    File PDF pengganti dipilih: {editReplacementFile.name} ({(editReplacementFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
