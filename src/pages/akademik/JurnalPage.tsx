import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { GoogleDriveService } from '../../services/googleDrive';
import { PdfExcelService } from '../../services/pdfExcel';
import { Modal } from '../../components/common/Modal';
import { showConfirmModal } from '../../components/common/SweetAlert';
import {
  FileText,
  Plus,
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  Trash2,
  Paperclip,
  ExternalLink
} from 'lucide-react';

export const JurnalPage: React.FC = () => {
  const { user } = useAuth();
  const { subjects, classes, journals, systemSettings, addJournal, deleteJournal } = useData();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || '');
  const [classId, setClassId] = useState<string>(classes[0]?.id || '');
  const [timeSlot, setTimeSlot] = useState<string>('07:30 - 09:00 (Jam 1-2)');
  const [topic, setTopic] = useState<string>('');
  const [method, setMethod] = useState<string>('Problem Based Learning (PBL)');
  const [attendeeCount, setAttendeeCount] = useState<number>(30);
  const [notes, setNotes] = useState<string>('');

  // Attachment state
  const [file, setFile] = useState<File | null>(null);

  const isAdmin = user?.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !subjectId || !classId) return;

    setIsUploading(true);

    let attachmentName = '';
    let attachmentDriveId = '';
    let attachmentWebViewLink = '';
    let attachmentWebContentLink = '';

    if (file) {
      const driveFile = await GoogleDriveService.uploadFile(file, 'Journals', user?.id);
      attachmentName = driveFile.fileName;
      attachmentDriveId = driveFile.fileId;
      attachmentWebViewLink = driveFile.webViewLink;
      attachmentWebContentLink = driveFile.webContentLink;
    }

    addJournal({
      date,
      subjectId,
      classId,
      teacherId: user?.id || 'global_teacher',
      teacherName: user?.fullName || 'Guru Pengajar',
      timeSlot,
      topic,
      method,
      attendeeCount,
      notes,
      attachmentName,
      attachmentDriveId,
      attachmentWebViewLink,
      attachmentWebContentLink
    });

    setIsUploading(false);
    setIsModalOpen(false);
    setTopic('');
    setNotes('');
    setFile(null);
  };

  const handleDelete = async (id: string, topic: string) => {
    const confirm = await showConfirmModal(
      'Hapus Jurnal Mengajar',
      `Apakah Anda yakin ingin menghapus jurnal materi "${topic}"?`,
      'Ya, Hapus'
    );
    if (confirm) {
      deleteJournal(id);
    }
  };

  const filteredJournals = journals.filter((j) => {
    // If guru, only see own journals; if admin, see all
    const isOwner = isAdmin || j.teacherId === user?.id;
    const matchesSearch =
      j.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.teacherName && j.teacherName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      j.method.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubj = selectedSubjectFilter === 'all' || j.subjectId === selectedSubjectFilter;
    const matchesClass = selectedClassFilter === 'all' || j.classId === selectedClassFilter;

    return isOwner && matchesSearch && matchesSubj && matchesClass;
  });

  const handleExportPdf = async () => {
    const subTitle = `Filter Laporan Jurnal Mengajar Guru | Total: ${filteredJournals.length} Entri Jurnal`;
    await PdfExcelService.exportJournalsPdf(filteredJournals, systemSettings, subTitle);
  };

  const handleExportExcel = () => {
    PdfExcelService.exportJournalsExcel(filteredJournals);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#696cff]" /> Jurnal Mengajar Guru
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Catatan materi pembelajaran harian, metode, dan lampiran dokumentasi ke Google Drive</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Cetak PDF (Kop & Margin)
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Isi Jurnal Hari Ini
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari materi, nama guru, metode..."
            className="w-full bg-transparent text-xs focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center">
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="w-full bg-transparent px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full bg-transparent px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.name}
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
                <th className="px-6 py-4">Tanggal & Jam</th>
                <th className="px-6 py-4">Guru & Mapel</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Materi & Metode</th>
                <th className="px-6 py-4 text-center">Hadir</th>
                <th className="px-6 py-4">Lampiran (Google Drive)</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredJournals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Belum ada jurnal mengajar tercatat.
                  </td>
                </tr>
              ) : (
                filteredJournals.map((jrn) => (
                  <tr key={jrn.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
                      <p>{jrn.date}</p>
                      <p className="text-[10px] text-slate-400">{jrn.timeSlot}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{jrn.teacherName}</p>
                      <p className="text-[10px] font-semibold text-[#696cff]">{jrn.subjectName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold bg-indigo-500/10 text-indigo-600 px-2.5 py-1 rounded-xl">
                        {jrn.className}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{jrn.topic}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Metode: {jrn.method}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                      {jrn.attendeeCount} Siswa
                    </td>
                    <td className="px-6 py-4">
                      {jrn.attachmentName ? (
                        <a
                          href={jrn.attachmentWebViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#696cff]/10 text-slate-700 dark:text-slate-200 hover:text-[#696cff] font-semibold text-[10px] transition-colors"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-[#696cff]" />
                          <span className="truncate max-w-[120px]">{jrn.attachmentName}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Tanpa Lampiran</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(jrn.id, jrn.topic)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Jurnal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Isi Jurnal Mengajar Harian"
        subtitle="Data & Lampiran dokumentasi akan disimpan secara realtime ke Google Drive"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Pelajaran *</label>
              <input
                type="text"
                required
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="07:30 - 09:00 (Jam 1-2)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran *</label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kelas *</label>
              <select
                required
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Materi / Topik Pembelajaran *</label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Persamaan Linear Satu Variabel"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Metode Pembelajaran</label>
              <input
                type="text"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="PBL / Diskusi / Demonstrasi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jumlah Siswa Hadir</label>
              <input
                type="number"
                value={attendeeCount}
                onChange={(e) => setAttendeeCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Upload Lampiran (Simpan ke Google Drive)</label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-[#696cff] transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/50">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
                id="jrn-file-upload"
              />
              <label htmlFor="jrn-file-upload" className="cursor-pointer flex flex-col items-center gap-1.5">
                <Upload className="w-6 h-6 text-[#696cff]" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {file ? file.name : 'Pilih file dokumentasi / foto kelas'}
                </span>
                <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan Guru / Keterangan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan keaktifan siswa atau kendala..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
            />
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
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-[#696cff] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 hover:bg-[#5f61e6] disabled:opacity-50"
            >
              {isUploading ? 'Mengunggah ke GDrive...' : 'Simpan Jurnal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
