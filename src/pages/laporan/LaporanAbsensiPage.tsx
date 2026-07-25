import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { PdfExcelService } from '../../services/pdfExcel';
import { BarChart3, Download, FileSpreadsheet, Search } from 'lucide-react';

export const LaporanAbsensiPage: React.FC = () => {
  const { classes, attendance, systemSettings } = useData();

  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredAttendance = attendance.filter((a) => {
    const matchesSearch =
      (a.studentName && a.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.studentNis && a.studentNis.includes(searchTerm));
    const matchesClass = selectedClassFilter === 'all' || a.classId === selectedClassFilter;

    return matchesSearch && matchesClass;
  });

  const handleExportPdf = async () => {
    const subTitle = `Laporan Presensi Siswa | Total Records: ${filteredAttendance.length}`;
    await PdfExcelService.exportAttendancePdf(filteredAttendance, systemSettings, subTitle);
  };

  const handleExportExcel = () => {
    PdfExcelService.exportAttendanceExcel(filteredAttendance);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#696cff]" /> Laporan Rekapitulasi Absensi Siswa
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Ekspor rekapitulasi kehadiran siswa harian dan bulanan</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama siswa atau NIS..."
            className="w-full bg-transparent text-xs focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
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
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">NIS & Nama Siswa</th>
                <th className="px-6 py-4 text-center">Status Kehadiran</th>
                <th className="px-6 py-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada catatan absensi ditemukan.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((att, idx) => (
                  <tr key={att.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{att.date}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{att.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">NIS: {att.studentNis}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                        att.status === 'Hadir'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : att.status === 'Izin'
                          ? 'bg-amber-500/10 text-amber-600'
                          : att.status === 'Sakit'
                          ? 'bg-cyan-500/10 text-cyan-600'
                          : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {att.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{att.notes || '-'}</td>
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
