import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PdfExcelService } from '../../services/pdfExcel';
import { PrintableReportModal, ReportMeta } from '../../components/common/PrintableReportModal';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Search,
  Calendar,
  Filter,
  School,
  BookOpen,
  User,
  RotateCcw,
  Printer
} from 'lucide-react';

export const LaporanAbsensiPage: React.FC = () => {
  const { user } = useAuth();
  const { classes, subjects, teachers, attendance, systemSettings, activePrincipal, academicYears } = useData();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedGradeLevelFilter, setSelectedGradeLevelFilter] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all');
  const [selectedAcademicYearFilter, setSelectedAcademicYearFilter] = useState<string>('all');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const gradeLevels = Array.from(new Set(classes.map((c) => c.gradeLevel))).sort();

  const selectedSubjObj = subjects.find((s) => s.id === selectedSubjectFilter);
  const selectedClassObj = classes.find((c) => c.id === selectedClassFilter);

  const monthsList = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  const weeksList = [
    { value: 'w1', label: 'Minggu ke-1 (Tgl 1-7)' },
    { value: 'w2', label: 'Minggu ke-2 (Tgl 8-14)' },
    { value: 'w3', label: 'Minggu ke-3 (Tgl 15-21)' },
    { value: 'w4', label: 'Minggu ke-4 (Tgl 22-28)' },
    { value: 'w5', label: 'Minggu ke-5 (Tgl 29-31)' }
  ];

  const isGuru = user?.role === 'guru';

  const filteredAttendance = attendance.filter((a) => {
    // RBAC check for Guru: only see attendance records for assigned teacher
    const matchesTeacherAssignment = !isGuru || !a.teacherId || a.teacherId === user?.id;

    // 1. Search term
    const matchesSearch =
      isGuru ||
      !searchTerm ||
      (a.studentName && a.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.studentNis && a.studentNis.includes(searchTerm));

    // 2. Class
    const matchesClass = isGuru || selectedClassFilter === 'all' || a.classId === selectedClassFilter;

    // 3. Subject
    const matchesSubject = isGuru || selectedSubjectFilter === 'all' || a.subjectId === selectedSubjectFilter;

    // 4. Teacher
    const matchesTeacher = isGuru || selectedTeacherFilter === 'all' || a.teacherId === selectedTeacherFilter;

    // 5. Grade Level
    const targetClass = classes.find((c) => c.id === a.classId);
    const matchesGradeLevel =
      isGuru ||
      selectedGradeLevelFilter === 'all' ||
      (targetClass && targetClass.gradeLevel === selectedGradeLevelFilter);

    // 6. Month & Week
    const attDate = new Date(a.date);
    const monthStr = (attDate.getMonth() + 1).toString().padStart(2, '0');
    const matchesMonth = selectedMonthFilter === 'all' || monthStr === selectedMonthFilter;

    const dayNum = attDate.getDate();
    let weekKey = 'w1';
    if (dayNum >= 1 && dayNum <= 7) weekKey = 'w1';
    else if (dayNum >= 8 && dayNum <= 14) weekKey = 'w2';
    else if (dayNum >= 15 && dayNum <= 21) weekKey = 'w3';
    else if (dayNum >= 22 && dayNum <= 28) weekKey = 'w4';
    else weekKey = 'w5';

    const matchesWeek = selectedWeekFilter === 'all' || weekKey === selectedWeekFilter;

    return (
      matchesTeacherAssignment &&
      matchesSearch &&
      matchesClass &&
      matchesSubject &&
      matchesTeacher &&
      matchesGradeLevel &&
      matchesMonth &&
      matchesWeek
    );
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedClassFilter('all');
    setSelectedGradeLevelFilter('all');
    setSelectedSubjectFilter('all');
    setSelectedTeacherFilter('all');
    setSelectedAcademicYearFilter('all');
    setSelectedSemesterFilter('all');
    setSelectedMonthFilter('all');
    setSelectedWeekFilter('all');
  };

  const activeAcademicYear = systemSettings.academicYear || '2025/2026';
  const activeSemester = systemSettings.semester || 'Ganjil';

  const metaInfo: ReportMeta = {
    title: 'LAPORAN REKAPITULASI PRESENSI SISWA',
    academicYear: activeAcademicYear,
    semester: activeSemester,
    subjectName: selectedSubjObj ? selectedSubjObj.name : 'Semua Mata Pelajaran',
    gradeLevel: selectedGradeLevelFilter !== 'all' ? `Tingkat ${selectedGradeLevelFilter}` : 'Semua Tingkat',
    className: selectedClassObj ? `Kelas ${selectedClassObj.name}` : 'Semua Kelas',
    teacherName: user?.fullName || 'Guru Pengajar'
  };

  const handleExportPdf = async () => {
    const subTitle = `Laporan Presensi Siswa | Total Records: ${filteredAttendance.length}`;
    await PdfExcelService.exportAttendancePdf(filteredAttendance, systemSettings, subTitle, user, activePrincipal, metaInfo);
  };

  const handleExportExcel = () => {
    PdfExcelService.exportAttendanceExcel(filteredAttendance);
  };

  const tableHeaders = ['No', 'Tanggal', 'NIS', 'Nama Siswa', 'Status Kehadiran', 'Keterangan'];
  const tableData = filteredAttendance.map((att, idx) => [
    idx + 1,
    att.date,
    att.studentNis || '-',
    att.studentName || '-',
    att.status,
    att.notes || '-'
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#696cff]" /> Laporan Rekapitulasi Absensi Siswa
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

      {/* Filter Control Box */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#696cff]" /> Filter Multi-Kriteria Absensi
          </h3>
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filter
          </button>
        </div>

        {isGuru ? (
          /* Tampilan Filter khusus Role Guru: Hanya Bulan dan Minggu */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Filter Bulanan */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#696cff] shrink-0" />
              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="all">Semua Bulan</option>
                {monthsList.map((m) => (
                  <option key={m.value} value={m.value}>
                    Bulan {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Mingguan */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              <select
                value={selectedWeekFilter}
                onChange={(e) => setSelectedWeekFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="all">Semua Minggu</option>
                {weeksList.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* Tampilan Filter Administrator: Seluruh Filter Tersedia */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Pencarian */}
            <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama siswa atau NIS..."
                className="w-full bg-transparent text-xs font-medium focus:outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {/* Filter Bulanan */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#696cff] shrink-0" />
              <select
                value={selectedMonthFilter}
                onChange={(e) => setSelectedMonthFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="all">Semua Bulan</option>
                {monthsList.map((m) => (
                  <option key={m.value} value={m.value}>
                    Bulan {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Mingguan */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              <select
                value={selectedWeekFilter}
                onChange={(e) => setSelectedWeekFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="all">Semua Minggu</option>
                {weeksList.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tingkat */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
              <School className="w-4 h-4 text-indigo-500 shrink-0" />
              <select
                value={selectedGradeLevelFilter}
                onChange={(e) => setSelectedGradeLevelFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="all">Semua Tingkat</option>
                {gradeLevels.map((gl) => (
                  <option key={gl} value={gl}>
                    Tingkat {gl}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kelas */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
              <School className="w-4 h-4 text-[#696cff] shrink-0" />
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="all">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Mata Pelajaran */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="all">Semua Mapel</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Guru */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-500 shrink-0" />
              <select
                value={selectedTeacherFilter}
                onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="all">Semua Guru Pengajar</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Menampilkan {filteredAttendance.length} data presensi</span>
          <span>Single Source of Truth: Supabase Backend</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Tanggal & Periode</th>
                <th className="px-6 py-4">NIS & Nama Siswa</th>
                <th className="px-6 py-4 text-center">Status Kehadiran</th>
                <th className="px-6 py-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada catatan absensi ditemukan sesuai filter yang dipilih.
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
        summaryBadge={`${filteredAttendance.length} Records Presensi`}
        onExportPdf={handleExportPdf}
      />
    </div>
  );
};
