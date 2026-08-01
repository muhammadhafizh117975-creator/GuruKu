import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  BookOpen,
  School,
  GraduationCap,
  FileText,
  FolderArchive,
  Award,
  CalendarCheck,
  Activity,
  PlusCircle,
  HardDrive
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const {
    subjects,
    classes,
    teachers,
    academicYears,
    students,
    journals,
    modules,
    grades,
    attendance,
    activityLogs,
    activeAcademicYear
  } = useData();

  const isAdmin = user?.role === 'admin';

  // Stats calculation
  const totalSubjects = subjects.length;
  const totalClasses = classes.length;
  const totalStudents = students.length;
  const totalJournals = journals.length;
  const totalModules = modules.length;

  // Filter States for Monthly Attendance Chart
  const [dashClassFilter, setDashClassFilter] = React.useState<string>('all');
  const [dashSubjectFilter, setDashSubjectFilter] = React.useState<string>('all');
  const [dashTeacherFilter, setDashTeacherFilter] = React.useState<string>('all');
  const [dashAcademicYearFilter, setDashAcademicYearFilter] = React.useState<string>('all');
  const [dashSemesterFilter, setDashSemesterFilter] = React.useState<string>('all');

  // RBAC & Interactive Filtered Attendance
  const filteredAttendance = attendance.filter((a) => {
    // 1. RBAC Isolation
    if (!isAdmin) {
      const isTeacherRecord = a.teacherId === user?.id;
      const isClassAssigned = classes.some((c) => c.id === a.classId);
      const isSubjectAssigned = subjects.some((s) => s.id === a.subjectId);
      if (!isTeacherRecord && !isClassAssigned && !isSubjectAssigned) return false;
    }

    // 2. Class Filter
    if (dashClassFilter !== 'all' && a.classId !== dashClassFilter) return false;

    // 3. Subject Filter
    if (dashSubjectFilter !== 'all' && a.subjectId !== dashSubjectFilter) return false;

    // 4. Teacher Filter (Admin only)
    if (isAdmin && dashTeacherFilter !== 'all' && a.teacherId !== dashTeacherFilter) return false;

    return true;
  });

  // Calculate Monthly Counts (Jan - Des) for Bar Chart
  const monthsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyHadir = new Array(12).fill(0);
  const monthlySakit = new Array(12).fill(0);
  const monthlyIzin = new Array(12).fill(0);
  const monthlyAlfa = new Array(12).fill(0);

  filteredAttendance.forEach((a) => {
    if (!a.date) return;
    const dateObj = new Date(a.date);
    const monthIndex = dateObj.getMonth();
    if (monthIndex >= 0 && monthIndex < 12) {
      if (a.status === 'Hadir') monthlyHadir[monthIndex]++;
      else if (a.status === 'Sakit') monthlySakit[monthIndex]++;
      else if (a.status === 'Izin') monthlyIzin[monthIndex]++;
      else if (a.status === 'Alfa') monthlyAlfa[monthIndex]++;
    }
  });

  const monthlyAttendanceChartData = {
    labels: monthsLabels,
    datasets: [
      {
        label: 'Hadir',
        data: monthlyHadir,
        backgroundColor: '#28c76f',
        borderRadius: 4
      },
      {
        label: 'Sakit',
        data: monthlySakit,
        backgroundColor: '#00cfdd',
        borderRadius: 4
      },
      {
        label: 'Izin',
        data: monthlyIzin,
        backgroundColor: '#ff9f43',
        borderRadius: 4
      },
      {
        label: 'Alfa',
        data: monthlyAlfa,
        backgroundColor: '#ea5455',
        borderRadius: 4
      }
    ]
  };

  // Chart Data: Distribusi Predikat Nilai
  const predicateCounts = {
    A: grades.filter((g) => g.predicate === 'A').length,
    B: grades.filter((g) => g.predicate === 'B').length,
    C: grades.filter((g) => g.predicate === 'C').length,
    D: grades.filter((g) => g.predicate === 'D').length
  };

  const gradeChartData = {
    labels: ['Predikat A (≥88)', 'Predikat B (≥78)', 'Predikat C (≥68)', 'Predikat D (<68)'],
    datasets: [
      {
        label: 'Jumlah Siswa',
        data: [
          predicateCounts.A,
          predicateCounts.B,
          predicateCounts.C,
          predicateCounts.D
        ],
        borderColor: '#696cff',
        backgroundColor: 'rgba(105, 108, 255, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#696cff] via-[#787bff] to-[#8592a3] p-6 sm:p-8 text-white shadow-xl shadow-[#696cff]/20">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block text-xs font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white">
                Portal Akademik {isAdmin ? 'Administrator' : 'Guru Pengajar'}
              </span>
              <span className="inline-block text-xs font-extrabold uppercase tracking-widest bg-emerald-500/80 backdrop-blur-md px-3 py-1 rounded-full text-white border border-emerald-300/40">
                TA: {activeAcademicYear.year} (Semester {activeAcademicYear.semester})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {user?.fullName}! 👋
            </h1>
            <p className="text-sm text-white/90 max-w-xl">
              {isAdmin
                ? 'Kelola seluruh mata pelajaran, kelas, nilai, absensi, jurnal, dan arsip modul ajar secara realtime.'
                : 'Kelola kelas, nilai siswa, presensi harian, jurnal mengajar, dan unggah Modul Ajar / RPP ke Google Drive.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('nilai')}
              className="px-4 py-2.5 rounded-xl bg-white text-[#696cff] font-bold text-xs shadow-md hover:bg-slate-100 transition-all flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" /> Input Nilai
            </button>
            <button
              onClick={() => setActiveTab('jurnal')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs transition-all flex items-center gap-1.5 border border-white/20"
            >
              <FileText className="w-4 h-4" /> Jurnal Mengajar
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Mapel */}
        <div 
          onClick={() => setActiveTab('mata-pelajaran')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Mata Pelajaran</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">{totalSubjects}</p>
          <p className="text-[11px] text-slate-400 mt-1">Mapel Terdaftar</p>
        </div>

        {/* Kelas */}
        <div 
          onClick={() => setActiveTab('kelas')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Kelas</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <School className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">{totalClasses}</p>
          <p className="text-[11px] text-slate-400 mt-1">Rombongan Belajar</p>
        </div>

        {/* Siswa */}
        <div 
          onClick={() => setActiveTab('siswa')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Total Siswa</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">{totalStudents}</p>
          <p className="text-[11px] text-slate-400 mt-1">Siswa Aktif</p>
        </div>

        {/* Jurnal */}
        <div 
          onClick={() => setActiveTab('jurnal')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Jurnal</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">{totalJournals}</p>
          <p className="text-[11px] text-slate-400 mt-1">Jurnal Terisi</p>
        </div>

        {/* Modul Ajar / GDrive */}
        <div 
          onClick={() => setActiveTab('arsip-modul')}
          className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Modul/RPP</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderArchive className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">{totalModules}</p>
          <p className="text-[11px] text-slate-400 mt-1">Google Drive Sync</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Kehadiran Siswa per Bulan */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#696cff]" /> Grafik Batang Kehadiran Siswa per Bulan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Statistik presensi bulanan (Hadir, Sakit, Izin, Alfa)</p>
            </div>
            <button 
              onClick={() => setActiveTab('laporan-absensi')}
              className="text-xs font-bold text-[#696cff] hover:underline cursor-pointer"
            >
              Lihat Detail Laporan
            </button>
          </div>

          {/* Filters Bar for Monthly Chart */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
            {/* Filter Kelas */}
            <select
              value={dashClassFilter}
              onChange={(e) => setDashClassFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>

            {/* Filter Mapel */}
            <select
              value={dashSubjectFilter}
              onChange={(e) => setDashSubjectFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="all">Semua Mapel</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Filter Guru (Khusus Admin) */}
            {isAdmin && (
              <select
                value={dashTeacherFilter}
                onChange={(e) => setDashTeacherFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="all">Semua Guru</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="h-64 flex items-center justify-center">
            {filteredAttendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <CalendarCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Belum ada data presensi harian untuk filter ini</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Grafik akan terisi secara otomatis setelah data presensi diinput.</p>
              </div>
            ) : (
              <Bar
                data={monthlyAttendanceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        boxWidth: 10,
                        usePointStyle: true,
                        font: { size: 10, weight: 'bold' }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { display: false }
                    },
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Chart 2: Predikat Nilai */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#696cff]" /> Grafik Distribusi Predikat Nilai
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Statistik pencapaian akademik siswa</p>
            </div>
            <button 
              onClick={() => setActiveTab('laporan-nilai')}
              className="text-xs font-bold text-[#696cff] hover:underline"
            >
              Lihat Detail
            </button>
          </div>
          <div className="h-64 flex items-center justify-center">
            {grades.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2 stroke-[1.5]" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Belum ada data nilai siswa</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Grafik akan terisi secara otomatis setelah data nilai diinput.</p>
              </div>
            ) : (
              <Line
                data={gradeChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: { beginAtZero: true }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Realtime Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500 animate-pulse" /> Aktivitas Sistem Terbaru (Realtime)
            </h3>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-600 font-bold px-2.5 py-1 rounded-full">
              Postgres Changes Active
            </span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-2">
            {activityLogs.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs">Belum ada aktivitas tercatat.</p>
            ) : (
              activityLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <div className="w-8 h-8 rounded-full bg-[#696cff]/10 text-[#696cff] flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{log.userName}</p>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{log.details}</p>
                    <p className="text-[10px] font-semibold text-[#696cff] uppercase mt-1">{log.action}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#696cff]" /> Aksi Cepat
          </h3>

          <div className="space-y-2.5">
            <button
              onClick={() => setActiveTab('absensi')}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-[#696cff]/10 hover:border-[#696cff]/30 border border-slate-200 dark:border-slate-700 text-left transition-all group flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Catat Absensi Siswa</p>
                <p className="text-[10px] text-slate-400">Presensi Hadir, Sakit, Izin, Alfa</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('jurnal')}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-[#696cff]/10 hover:border-[#696cff]/30 border border-slate-200 dark:border-slate-700 text-left transition-all group flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Isi Jurnal Mengajar</p>
                <p className="text-[10px] text-slate-400">Materi, Metode & Lampiran GDrive</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('arsip-modul')}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-[#696cff]/10 hover:border-[#696cff]/30 border border-slate-200 dark:border-slate-700 text-left transition-all group flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Unggah Modul Ajar / RPP</p>
                <p className="text-[10px] text-slate-400">Simpan otomatis ke Google Drive</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
