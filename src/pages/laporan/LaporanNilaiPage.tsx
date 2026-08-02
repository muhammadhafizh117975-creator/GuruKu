import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PdfExcelService } from '../../services/pdfExcel';
import { PrintableReportModal, ReportMeta } from '../../components/common/PrintableReportModal';
import { BarChart3, Download, FileSpreadsheet, Search, Printer } from 'lucide-react';

export const LaporanNilaiPage: React.FC = () => {
  const { user } = useAuth();
  const { subjects, classes, grades, systemSettings, activePrincipal } = useData();

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const selectedSubjObj = subjects.find((s) => s.id === selectedSubjectFilter);
  const selectedClassObj = classes.find((c) => c.id === selectedClassFilter);

  const filteredGrades = grades.filter((g) => {
    const matchesSearch =
      (g.studentName && g.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.studentNis && g.studentNis.includes(searchTerm));
    const matchesSubj = selectedSubjectFilter === 'all' || g.subjectId === selectedSubjectFilter;
    const matchesClass = selectedClassFilter === 'all' || g.classId === selectedClassFilter;

    return matchesSearch && matchesSubj && matchesClass;
  });

  const activeAcademicYear = systemSettings.academicYear || '2025/2026';
  const activeSemester = systemSettings.semester || 'Ganjil';

  const metaInfo: ReportMeta = {
    title: 'LAPORAN REKAPITULASI NILAI AKADEMIK SISWA',
    academicYear: activeAcademicYear,
    semester: activeSemester,
    subjectName: selectedSubjObj ? selectedSubjObj.name : 'Semua Mata Pelajaran',
    gradeLevel: selectedClassObj ? `Tingkat ${selectedClassObj.gradeLevel}` : 'Semua Tingkat',
    className: selectedClassObj ? `Kelas ${selectedClassObj.name}` : 'Semua Kelas',
    teacherName: user?.fullName || 'Guru Pengajar'
  };

  const handleExportPdf = async () => {
    const subTitle = `Laporan Rekapitulasi Nilai Akademik | Total Records: ${filteredGrades.length}`;
    await PdfExcelService.exportGradesPdf(filteredGrades, systemSettings, subTitle, user, activePrincipal, metaInfo);
  };

  const handleExportExcel = () => {
    PdfExcelService.exportGradesExcel(filteredGrades, 'Laporan Rekapitulasi Nilai Siswa');
  };

  const tableHeaders = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Tugas', 'Harian', 'PTS', 'PAS', 'Nilai Akhir', 'Predikat'];
  const tableData = filteredGrades.map((g, idx) => [
    idx + 1,
    g.studentNis || '-',
    g.studentName || '-',
    g.className || '-',
    g.assignmentScore,
    g.dailyScore,
    g.ptsScore,
    g.pasScore,
    g.finalScore,
    g.predicate
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#696cff]" /> Laporan Rekapitulasi Nilai Siswa
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Standar format laporan resmi A4 Portrait dengan kop surat dan margin presisi</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#696cff] text-white font-bold text-xs hover:bg-[#5f61e6] shadow-md shadow-[#696cff]/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak Dokumen A4
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Unduh PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
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
            placeholder="Cari nama siswa atau NIS..."
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
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Siswa & NIS</th>
                <th className="px-6 py-4">Mapel & Kelas</th>
                <th className="px-6 py-4 text-center">Tugas</th>
                <th className="px-6 py-4 text-center">Harian</th>
                <th className="px-6 py-4 text-center">PTS</th>
                <th className="px-6 py-4 text-center">PAS</th>
                <th className="px-6 py-4 text-center font-black text-[#696cff]">Nilai Akhir</th>
                <th className="px-6 py-4 text-center">Predikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada rekapan nilai ditemukan.
                  </td>
                </tr>
              ) : (
                filteredGrades.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{g.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">NIS: {g.studentNis}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#696cff]">{g.subjectName}</p>
                      <p className="text-[10px] text-slate-400">Kelas {g.className}</p>
                    </td>
                    <td className="px-6 py-4 text-center">{g.assignmentScore}</td>
                    <td className="px-6 py-4 text-center">{g.dailyScore}</td>
                    <td className="px-6 py-4 text-center">{g.ptsScore}</td>
                    <td className="px-6 py-4 text-center">{g.pasScore}</td>
                    <td className="px-6 py-4 text-center font-black text-sm text-[#696cff]">{g.finalScore}</td>
                    <td className="px-6 py-4 text-center font-bold">{g.predicate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable A4 Modal */}
      <PrintableReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        settings={systemSettings}
        meta={metaInfo}
        activePrincipal={activePrincipal}
        currentUser={user}
        tableHeaders={tableHeaders}
        tableData={tableData}
        summaryBadge={`${filteredGrades.length} Data Siswa`}
        onExportPdf={handleExportPdf}
      />
    </div>
  );
};

