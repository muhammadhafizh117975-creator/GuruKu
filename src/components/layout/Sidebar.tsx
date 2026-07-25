import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  School,
  GraduationCap,
  Award,
  CalendarCheck,
  FileText,
  FolderArchive,
  BarChart3,
  Settings,
  User,
  LogOut,
  ChevronRight,
  ShieldCheck,
  HardDrive,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen
}) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const navSectionHeader = (title: string) => (
    <div className="px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
      {title}
    </div>
  );

  const navItem = (id: string, label: string, icon: React.ReactNode, badge?: string) => {
    const isActive = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => handleNavClick(id)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
          isActive
            ? 'bg-[#696cff] text-white shadow-md shadow-[#696cff]/30 font-semibold'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
            {icon}
          </span>
          <span>{label}</span>
        </div>
        {badge && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            isActive ? 'bg-white/20 text-white' : 'bg-[#696cff]/10 text-[#696cff]'
          }`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sneat Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#696cff] to-[#8592a3] flex items-center justify-center text-white shadow-lg shadow-[#696cff]/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                Guru<span className="text-[#696cff]">Ku</span>
              </h1>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Portal Akademik
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <ChevronRight className="w-5 h-5 transform rotate-180" />
          </button>
        </div>

        {/* User Role Badge Card */}
        <div className="p-3 mx-3 mt-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
            alt="Avatar"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-[#696cff]/30"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{user?.fullName}</p>
            <p className="text-[10px] text-[#696cff] font-semibold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {isAdmin ? 'Administrator' : 'Guru Pengajar'}
            </p>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          {navItem('dashboard', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}

          {/* DATA MASTER SECTION */}
          {navSectionHeader('DATA MASTER')}
          {isAdmin && navItem('guru', 'Data Guru', <Users className="w-4 h-4" />, 'Admin')}
          {navItem('mata-pelajaran', 'Mata Pelajaran', <BookOpen className="w-4 h-4" />)}
          {navItem('kelas', 'Kelas & Tingkat', <School className="w-4 h-4" />)}
          {navItem('siswa', 'Data Siswa', <GraduationCap className="w-4 h-4" />)}

          {/* AKADEMIK SECTION */}
          {navSectionHeader('AKADEMIK')}
          {navItem('nilai', 'Nilai Siswa', <Award className="w-4 h-4" />)}
          {navItem('absensi', 'Absensi Siswa', <CalendarCheck className="w-4 h-4" />)}
          {navItem('jurnal', 'Jurnal Mengajar', <FileText className="w-4 h-4" />)}
          {navItem('arsip-modul', 'Arsip Modul / RPP', <FolderArchive className="w-4 h-4" />, 'GDrive')}

          {/* LAPORAN SECTION */}
          {navSectionHeader('LAPORAN')}
          {navItem('laporan-nilai', 'Laporan Nilai', <BarChart3 className="w-4 h-4" />)}
          {navItem('laporan-absensi', 'Laporan Absensi', <BarChart3 className="w-4 h-4" />)}
          {navItem('laporan-jurnal', 'Laporan Jurnal', <BarChart3 className="w-4 h-4" />)}

          {/* PENGATURAN SISTEM (KHUSUS ADMIN) */}
          {isAdmin && (
            <>
              {navSectionHeader('PENGATURAN SISTEM')}
              {navItem('pengaturan-sistem', 'Margin & Kop Surat', <Settings className="w-4 h-4" />, 'Khusus Admin')}
            </>
          )}

          {/* PANDUAN BANTUAN */}
          {navSectionHeader('PANDUAN & BANTUAN')}
          {navItem('panduan-guru', 'Panduan Guru', <HelpCircle className="w-4 h-4" />)}
          {isAdmin && navItem('panduan-admin', 'Setup Admin', <ShieldAlert className="w-4 h-4" />, 'Guide')}

          {/* USER PROFILE & SETTINGS */}
          {navSectionHeader('PENGATURAN')}
          {navItem('profil', isAdmin ? 'Profil Admin' : 'Profil Guru', <User className="w-4 h-4" />)}
        </div>

        {/* Storage status & Logout Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="mb-2 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5" /> GDrive Connected
            </span>
            <span className="font-bold text-[10px] bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded">Active</span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
};
