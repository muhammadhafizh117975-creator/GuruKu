import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { School, ArrowRight, Sun, Moon, AtSign, Lock, ShieldAlert, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [forgotModalOpen, setForgotModalOpen] = useState<boolean>(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Dark/Light Mode Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md transition-all cursor-pointer"
          title="Toggle Theme Mode"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </div>

      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#696cff]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6 transition-colors duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#696cff] to-[#8592a3] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#696cff]/30 mx-auto">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Guru<span className="text-[#696cff]">Ku</span> Academic</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sistem Manajemen Sekolah & Portal Akademik Terpadu</p>
        </div>

        {/* Portal Notice */}
        <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl text-center">
          <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-center gap-1.5">
            <UserCheck className="w-4 h-4 text-[#696cff]" />
            <span>Login Menggunakan Username Akun</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Admin & Guru dapat masuk menggunakan Username dan Kata Sandi resmi.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Username Akun
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan Username Anda..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#696cff]"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Gunakan Username resmi akun Admin atau Guru Anda.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kata Sandi (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#696cff]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-[#696cff] focus:ring-[#696cff]"
              />
              <span className="font-medium">Ingat Sesi Saya</span>
            </label>
            <button
              type="button"
              onClick={() => setForgotModalOpen(true)}
              className="text-[#696cff] font-bold hover:underline cursor-pointer"
            >
              Lupa Sandi?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-extrabold text-sm shadow-xl shadow-[#696cff]/25 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <span>Masuk ke System GuruKu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
          Integrated with <strong className="text-slate-600 dark:text-slate-300">Supabase Realtime</strong> & <strong className="text-slate-600 dark:text-slate-300">Google Drive API</strong>
        </div>
      </div>

      {/* Lupa Sandi Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Lupa Kata Sandi Akun"
        subtitle="Petunjuk pemulihan kata sandi aplikasi GuruKu"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Ketentuan Reset Password Guru</span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              Berdasarkan kebijakan keamanan sistem GuruKu, akun <strong>Guru</strong> tidak melakukan reset password secara mandiri. Reset password Guru dilakukan terpusat oleh <strong>Administrator Sekolah</strong>.
            </p>
          </div>

          <div className="space-y-2 text-slate-700 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-slate-100">Langkah untuk Pengguna Guru:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>Hubungi Admin Sekolah atau Tim IT Kurikulum Anda.</li>
              <li>Mintalah Admin untuk membuka menu <strong>Data Guru &gt; Reset Pass</strong>.</li>
              <li>Admin akan memberikan password baru untuk akun Anda.</li>
            </ol>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-[#696cff] text-white font-bold"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
