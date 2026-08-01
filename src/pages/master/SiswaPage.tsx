import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Student } from '../../types';
import { Modal } from '../../components/common/Modal';
import { showConfirmModal, showSuccessToast, showErrorToast } from '../../components/common/SweetAlert';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Upload,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';

interface BulkImportRow {
  rowNum: number;
  nis: string;
  fullName: string;
  gender: 'L' | 'P';
  classId: string;
  className: string;
  isValid: boolean;
  errors: string[];
}

export const SiswaPage: React.FC = () => {
  const { user } = useAuth();
  const { students, classes, addStudent, bulkAddStudents, updateStudent, deleteStudent } = useData();

  const isAdmin = user?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Single Form State
  const [nis, setNis] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [classId, setClassId] = useState<string>('');

  // Bulk Upload State
  const [rawText, setRawText] = useState<string>('');
  const [bulkClassId, setBulkClassId] = useState<string>('');
  const [importRows, setImportRows] = useState<BulkImportRow[]>([]);
  const [hasPreviewed, setHasPreviewed] = useState<boolean>(false);

  const openCreateModal = () => {
    setEditingStudent(null);
    setNis(`2026${Math.floor(100 + Math.random() * 900)}`);
    setFullName('');
    setGender('L');
    setClassId(classes[0]?.id || '');
    setIsModalOpen(true);
  };

  const openEditModal = (std: Student) => {
    setEditingStudent(std);
    setNis(std.nis);
    setFullName(std.fullName);
    setGender(std.gender);
    setClassId(std.classId);
    setIsModalOpen(true);
  };

  const openBulkModal = () => {
    setRawText('');
    setImportRows([]);
    setHasPreviewed(false);
    setBulkClassId(classes[0]?.id || '');
    setIsBulkModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis || !fullName || !classId) return;

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        nis: nis.trim(),
        fullName: fullName.replace(/\s+/g, ' ').trim(),
        gender,
        classId
      });
    } else {
      addStudent({
        nis: nis.trim(),
        fullName: fullName.replace(/\s+/g, ' ').trim(),
        gender,
        classId
      });
    }
    setIsModalOpen(false);
  };

  const parseRawTextData = () => {
    if (!rawText.trim()) {
      showErrorToast('Silakan tempel (paste) atau ketik data siswa terlebih dahulu.');
      return;
    }

    const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l !== '');
    const selectedClass = classes.find((c) => c.id === bulkClassId);
    const className = selectedClass ? selectedClass.name : 'Tanpa Kelas';

    const seenNisInFile = new Set<string>();
    const existingNisSet = new Set(students.map((s) => s.nis.trim().toLowerCase()));

    const parsed: BulkImportRow[] = [];

    lines.forEach((line, idx) => {
      let parts: string[] = [];

      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else if (line.includes(',')) {
        parts = line.split(',');
      } else {
        parts = line.split(/\s{2,}/);
        if (parts.length < 3) {
          const regexMatch = line.match(/^(\S+)\s+(.+)\s+(\S+)$/);
          if (regexMatch) {
            parts = [regexMatch[1], regexMatch[2], regexMatch[3]];
          }
        }
      }

      const rawNis = (parts[0] || '').trim();
      const rawName = (parts[1] || '').replace(/\s+/g, ' ').trim();
      const rawGender = (parts[2] || '').trim();

      const errors: string[] = [];

      // 1. NIS Validation
      if (!rawNis) {
        errors.push('NIS wajib diisi');
      } else {
        const nisKey = rawNis.toLowerCase();
        if (seenNisInFile.has(nisKey)) {
          errors.push('NIS duplikat dalam file impor');
        } else {
          seenNisInFile.add(nisKey);
        }

        if (existingNisSet.has(nisKey)) {
          errors.push('NIS sudah terdaftar di database');
        }
      }

      // 2. Nama Lengkap Validation
      if (!rawName) {
        errors.push('Nama Lengkap wajib diisi');
      }

      // 3. Gender Validation
      let normalizedGender: 'L' | 'P' = 'L';
      const upperGen = rawGender.toUpperCase();
      if (upperGen === 'L' || upperGen === 'LAKI-LAKI' || upperGen === 'LAKI LAKI' || upperGen === 'LAKI') {
        normalizedGender = 'L';
      } else if (upperGen === 'P' || upperGen === 'PEREMPUAN') {
        normalizedGender = 'P';
      } else if (!rawGender) {
        errors.push('Gender wajib diisi (L/P)');
      } else {
        errors.push("Gender harus 'L' atau 'P'");
      }

      const isValid = errors.length === 0;

      parsed.push({
        rowNum: idx + 1,
        nis: rawNis,
        fullName: rawName,
        gender: normalizedGender,
        classId: bulkClassId,
        className,
        isValid,
        errors
      });
    });

    setImportRows(parsed);
    setHasPreviewed(true);

    const validCount = parsed.filter((r) => r.isValid).length;
    const invalidCount = parsed.filter((r) => !r.isValid).length;

    if (validCount > 0) {
      showSuccessToast(`${validCount} baris data valid siap diimpor.${invalidCount > 0 ? ` (${invalidCount} data tidak valid)` : ''}`);
    } else {
      showErrorToast(`Tidak ada data valid yang dapat diimpor. Periksa detail kesalahan pada pratinjau.`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmBulkUpload = async () => {
    const validRows = importRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showErrorToast('Tidak ada data valid yang siap disimpan.');
      return;
    }

    const payload: Omit<Student, 'id' | 'createdAt'>[] = validRows.map((r) => ({
      nis: r.nis,
      fullName: r.fullName,
      gender: r.gender,
      classId: r.classId,
      className: r.className
    }));

    await bulkAddStudents(payload);
    setIsBulkModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirm = await showConfirmModal(
      'Hapus Data Siswa',
      `Apakah Anda yakin ingin menghapus data siswa ${name}?`,
      'Ya, Hapus'
    );
    if (confirm) {
      deleteStudent(id);
    }
  };

  const validRowsCount = importRows.filter((r) => r.isValid).length;
  const invalidRowsCount = importRows.filter((r) => !r.isValid).length;
  const selectedBulkClass = classes.find((c) => c.id === bulkClassId);
  const targetClassName = selectedBulkClass ? selectedBulkClass.name : 'Tanpa Kelas';

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.includes(searchTerm);
    const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  // Reset to page 1 on filter/search change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClassFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#696cff]" /> Data Siswa Sekolah
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Direktori terintegrasi seluruh siswa, NIS, rombel, dan kontak wali murid</p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={openBulkModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Bulk Upload Siswa (Excel/CSV)
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Siswa Baru
            </button>
          </div>
        )}
      </div>

      {/* Teacher Role Notice */}
      {!isAdmin && (
        <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 p-4 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-[#696cff] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Data Siswa Terintegrasi Terpusat oleh Administrator
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              Pengelolaan penambahan, pembaruan, dan unggah data siswa dilakukan secara terpusat oleh Admin Sekolah. Sebagai Guru, Anda memiliki akses penuh untuk melihat seluruh siswa dan menggunakannya pada modul Nilai, Absensi, serta Jurnal Mengajar.
            </p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama siswa, NIS, atau alamat..."
            className="w-full bg-transparent text-sm focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full bg-transparent px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Semua Rombongan Belajar (Kelas)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.name} ({c.academicYear})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">NIS</th>
                <th className="px-6 py-4">Nama Lengkap Siswa</th>
                <th className="px-6 py-4">L/P</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada data siswa ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#696cff]">{std.nis}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{std.fullName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        std.gender === 'L' ? 'bg-sky-500/10 text-sky-600' : 'bg-pink-500/10 text-pink-600'
                      }`}>
                        {std.gender === 'L' ? 'L' : 'P'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-xl">
                        {std.className || 'Tanpa Kelas'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(std)}
                          title="Edit Siswa"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#696cff] hover:bg-[#696cff]/10 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(std.id, std.fullName)}
                            title="Hapus Siswa"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

        {/* Pagination Bar */}
        {filteredStudents.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Menampilkan <strong className="text-slate-800 dark:text-slate-200">{filteredStudents.length > 0 ? startIndex + 1 : 0}</strong> - <strong className="text-slate-800 dark:text-slate-200">{Math.min(startIndex + itemsPerPage, filteredStudents.length)}</strong> dari <strong className="text-slate-800 dark:text-slate-200">{filteredStudents.length}</strong> siswa
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-1.5 rounded-xl bg-[#696cff]/10 text-[#696cff] font-bold">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Single CRUD Siswa (Admin Only) */}
      {isAdmin && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingStudent ? 'Edit Biodata Siswa' : 'Tambah Siswa Baru'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">NIS *</label>
                <input
                  type="text"
                  required
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pilih Kelas *</label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Kelas {c.name} ({c.academicYear})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Aditya Pratama"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jenis Kelamin *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#696cff] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 hover:bg-[#5f61e6]"
              >
                Simpan Data Siswa
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Bulk Upload Siswa (Admin Only) */}
      {isAdmin && (
        <Modal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          title="Upload / Impor Banyak Data Siswa (Bulk Import)"
        >
          <div className="space-y-5">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <span>Format Data Teks / CSV / Excel (Dipisahkan Tab, Koma, Titik Koma, atau Spasi)</span>
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-[11px]">
                Urutan Kolom: <strong>NIS, Nama Lengkap, Gender (L/P)</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Kelas Tujuan untuk Data Ini *
                </label>
                <select
                  value={bulkClassId}
                  onChange={(e) => setBulkClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-[#696cff]"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Kelas {c.name} ({c.academicYear})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Unggah File (.csv / .txt)
                </label>
                <input
                  type="file"
                  accept=".csv, .txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#696cff]/10 file:text-[#696cff] hover:file:bg-[#696cff]/20 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Atau Paste Langsung Teks dari Excel / Google Sheets
              </label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`2026101\tAditya Pratama\tL\n2026102\tAnnisa Tri Hapsari\tP\n2026103\tBudi Santoso\tL\n2026104\tCitra Maharani\tP`}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-[#696cff]"
              />
            </div>

            <button
              type="button"
              onClick={parseRawTextData}
              className="w-full py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4" /> Pratinjau & Saring Data
            </button>

            {/* Parsed Preview Table & Statistics */}
            {hasPreviewed && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Total Data: <strong>{importRows.length}</strong> baris
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Valid: {validRowsCount}
                    </span>
                    {invalidRowsCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Tidak Valid: {invalidRowsCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Tujuan: <strong className="text-[#696cff]">Kelas {targetClassName}</strong>
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5 text-center">No</th>
                        <th className="p-2.5">NIS</th>
                        <th className="p-2.5">Nama Lengkap</th>
                        <th className="p-2.5">Gender (L/P)</th>
                        <th className="p-2.5">Status & Validasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {importRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            Tidak ada data yang dapat diproses.
                          </td>
                        </tr>
                      ) : (
                        importRows.map((item) => (
                          <tr key={item.rowNum} className={item.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-rose-50/40 dark:bg-rose-950/20'}>
                            <td className="p-2.5 text-center font-bold text-slate-400">{item.rowNum}</td>
                            <td className="p-2.5 font-bold text-[#696cff]">{item.nis || '-'}</td>
                            <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">{item.fullName || '-'}</td>
                            <td className="p-2.5 font-bold">
                              <span className={item.gender === 'L' ? 'text-sky-600' : 'text-pink-600'}>
                                {item.gender}
                              </span>
                            </td>
                            <td className="p-2.5">
                              {item.isValid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                    <AlertCircle className="w-3 h-3" /> Tidak Valid
                                  </span>
                                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                                    {item.errors.join(', ')}
                                  </p>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={validRowsCount === 0}
                onClick={handleConfirmBulkUpload}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  validRowsCount > 0
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Simpan {validRowsCount} Data Siswa
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
