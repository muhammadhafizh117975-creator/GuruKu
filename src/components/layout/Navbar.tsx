import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Menu,
  Sun,
  Moon,
  User,
  ShieldAlert,
  LogOut,
  ChevronDown,
  Wifi,
  WifiOff,
  Bell
} from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  setSidebarOpen,
  activeTab
}) => {
  const { user, logout } = useAuth();
  const { isRealtimeConnected } = useData();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  // Initialize theme
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') ||
      localStorage.getItem('guruku_theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('guruku_theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('guruku_theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const getPageTitle = (tab: string) => {
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard Utama',
      'guru': 'Manajemen Data Guru',
      'mata-pelajaran': 'Mata Pelajaran',
      'kelas': 'Kelas & Tahun Ajaran',
      'siswa': 'Data Siswa Sekolah',
      'nilai': 'Manajemen Nilai Siswa',
      'absensi': 'Presensi / Absensi Harian',
      'jurnal': 'Jurnal Mengajar Guru',
      'arsip-modul': 'Arsip Modul Ajar & RPP (Google Drive)',
      'laporan-nilai': 'Laporan Rekapitulasi Nilai',
      'laporan-absensi': 'Laporan Rekapitulasi Absensi',
      'laporan-jurnal': 'Laporan Rekapitulasi Jurnal',
      'pengaturan-sistem': 'Pengaturan Sistem (Margin & Kop Surat)',
      'panduan-admin': 'Panduan Setup Infrastructure Admin',
      'panduan-guru': 'Panduan Penggunaan Guru',
      'profil': 'Profil Pengguna'
    };
    return titles[tab] || 'GuruKu Admin';
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {getPageTitle(activeTab)}
          </h2>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Realtime Connection Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
          {isRealtimeConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="text-emerald-600 dark:text-emerald-400">Realtime Active</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400">Local Mode</span>
            </>
          )}
        </div>

        {/* Static Account Role Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
          <span className="w-2 h-2 rounded-full bg-[#696cff]"></span>
          <span>Role: <strong className="text-[#696cff] capitalize">{user?.role}</strong></span>
        </div>

        {/* Dark / Light Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#696cff] dark:hover:text-[#696cff] transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#696cff] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
              alt="Avatar"
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#696cff]/40"
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400 capitalize mt-0.5">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {/* Menu Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-fade-in">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{user?.fullName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                <p className="text-[10px] text-[#696cff] font-semibold mt-1">NIP: {user?.nipNuptk || 'N/A'}</p>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
