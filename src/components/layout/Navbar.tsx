import React, { useState, useEffect, useRef } from 'react';
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
  const {
    isRealtimeConnected,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useData();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when activeTab changes (navigation)
  useEffect(() => {
    setNotifDropdownOpen(false);
    setUserDropdownOpen(false);
  }, [activeTab]);

  // Handle click outside and Escape key press
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifDropdownOpen(false);
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
      'pengaturan-sistem': 'Pengaturan Sistem & Akademik',
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
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              const nextOpen = !notifDropdownOpen;
              setNotifDropdownOpen(nextOpen);
              setUserDropdownOpen(false);
              if (nextOpen && unreadCount > 0) {
                // Automatically mark as read and sync to database
                markAllNotificationsAsRead();
              }
            }}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#696cff] transition-colors"
            title="Notifikasi System Realtime"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </>
            )}
          </button>

          {/* Dropdown Notifikasi Panel */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">Notifikasi System</h3>
                  {unreadCount > 0 && (
                    <span className="bg-[#696cff]/10 text-[#696cff] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {unreadCount} Belum Dibaca
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-[11px] font-bold text-[#696cff] hover:underline"
                  >
                    Tandai Semua Dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 stroke-[1.5]" />
                    <p className="text-xs font-semibold">Belum ada notifikasi.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                        !n.isRead
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-80'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {!n.isRead ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#696cff] block" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 block" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold truncate ${!n.isRead ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={userRef}>
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
