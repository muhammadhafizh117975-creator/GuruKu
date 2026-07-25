import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { PdfExcelService } from '../../services/pdfExcel';
import { BarChart3, Download, FileSpreadsheet, Search } from 'lucide-react';

export const LaporanJurnalPage: React.FC = () => {
  const { subjects, classes, journals, systemSettings } = useData();

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredJournals = journals.filter((j) => {
    const matchesSearch =
      j.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.teacherName && j.teacherName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubj = selectedSubjectFilter === 'all' || j.subjectId === selectedSubjectFilter;
    const matchesClass = selectedClassFilter === 'all' || j.classId === selectedClassFilter;

    return matchesSearch && matchesSubj && matchesClass;
  });

  const handleExportPdf = async () => {
    const subTitle = `Laporan Rekapitulasi Jurnal Mengajar Guru | Total: ${filteredJournals.length} Entri`;
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
            <BarChart3 className="w-6 h-6 text-[#696cff]" /> Laporan Jurnal Mengajar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Ekspor rekapitulasi pelaksanaan pembelajaran guru</p>
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
            placeholder="Cari materi atau nama guru..."
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
                <th className="px-6 py-4">Guru Pengajar</th>
                <th className="px-6 py-4">Mapel & Kelas</th>
                <th className="px-6 py-4">Materi & Metode</th>
                <th className="px-6 py-4 text-center">Hadir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredJournals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada data jurnal ditemukan.
                  </td>
                </tr>
              ) : (
                filteredJournals.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
                      <p>{j.date}</p>
                      <p className="text-[10px] text-slate-400">{j.timeSlot}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{j.teacherName}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#696cff]">{j.subjectName}</p>
                      <p className="text-[10px] text-slate-400">Kelas {j.className}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{j.topic}</p>
                      <p className="text-[10px] text-slate-400">Metode: {j.method}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{j.attendeeCount} Siswa</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
