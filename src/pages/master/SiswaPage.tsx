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
  Users
} from 'lucide-react';

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
  const [parsedPreview, setParsedPreview] = useState<Omit<Student, 'id' | 'createdAt'>[]>([]);

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
    setParsedPreview([]);
    setBulkClassId(classes[0]?.id || '');
    setIsBulkModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis || !fullName || !classId) return;

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        nis,
        fullName,
        gender,
        birthPlace: editingStudent.birthPlace || 'Jakarta',
        birthDate: editingStudent.birthDate || '2012-01-01',
        address: editingStudent.address || '',
        parentPhone: editingStudent.parentPhone || '',
        classId
      });
    } else {
      addStudent({
        nis,
        fullName,
        gender,
        birthPlace: 'Jakarta',
        birthDate: '2012-01-01',
        address: '',
        parentPhone: '',
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

    const lines = rawText.split('\n').filter((l) => l.trim() !== '');
    const selectedClass = classes.find((c) => c.id === bulkClassId);
    const parsed: Omit<Student, 'id' | 'createdAt'>[] = [];

    lines.forEach((line, idx) => {
      // Split by tab or comma
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      if (parts.length >= 2) {
        const cleanNis = parts[0]?.trim() || `2026${100 + idx}`;
        const cleanName = parts[1]?.trim() || '';
        const cleanGender = (parts[2]?.trim().toUpperCase() === 'P' ? 'P' : 'L') as 'L' | 'P';
        const cleanPlace = parts[3]?.trim() || 'Jakarta';
        const cleanDate = parts[4]?.trim() || '2012-01-01';
        const cleanAddress = parts[5]?.trim() || 'Alamat Belum Diisi';
        const cleanPhone = parts[6]?.trim() || '081200000000';

        if (cleanName) {
          parsed.push({
            nis: cleanNis,
            fullName: cleanName,
            gender: cleanGender,
            birthPlace: cleanPlace,
            birthDate: cleanDate,
            address: cleanAddress,
            parentPhone: cleanPhone,
            classId: bulkClassId,
            className: selectedClass?.name || 'Tanpa Kelas'
          });
        }
      }
    });

    if (parsed.length === 0) {
      showErrorToast('Format data tidak sesuai. Pastikan format: NIS, Nama, Gender(L/P), Tempat Lahir, Tgl Lahir, Alamat, No HP');
      return;
    }

    setParsedPreview(parsed);
    showSuccessToast(`${parsed.length} baris data siswa berhasil diproses.`);
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

  const handleConfirmBulkUpload = () => {
    if (parsedPreview.length === 0) return;
    bulkAddStudents(parsedPreview);
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

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.includes(searchTerm) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase());
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
                <span>Format Data Teks / CSV / Excel (Dipisahkan Tab atau Koma)</span>
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-[11px]">
                Urutan Kolom: <strong>NIS, Nama Lengkap, Gender(L/P)</strong>
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
                placeholder={`2026101\tAditya Pratama\tL\tJakarta\t2012-05-14\tJl. Merdeka No 12\t081233445566\n2026102\tAnnisa Tri Hapsari\tP\tBandung\t2012-08-20\tJl. Melati No 45\t081277889900`}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-[#696cff]"
              />
            </div>

            <button
              type="button"
              onClick={parseRawTextData}
              className="w-full py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" /> Pratinjau & Saring Data
            </button>

            {/* Parsed Preview Table */}
            {parsedPreview.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Pratinjau Data ({parsedPreview.length} Siswa Siap Diimpor)</span>
                  </h4>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                      <tr>
                        <th className="p-2">NIS</th>
                        <th className="p-2">Nama</th>
                        <th className="p-2">Gender</th>
                        <th className="p-2">Kelas</th>
                        <th className="p-2">No HP Ortu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedPreview.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-[#696cff]">{item.nis}</td>
                          <td className="p-2 font-semibold text-slate-800 dark:text-slate-200">{item.fullName}</td>
                          <td className="p-2">{item.gender}</td>
                          <td className="p-2">{item.className}</td>
                          <td className="p-2">{item.parentPhone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={parsedPreview.length === 0}
                onClick={handleConfirmBulkUpload}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center gap-1.5 ${
                  parsedPreview.length > 0
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Simpan {parsedPreview.length} Data Siswa
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
