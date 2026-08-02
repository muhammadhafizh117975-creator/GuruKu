import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabaseClient } from '../../services/supabase';
import { showSuccessToast, Toast } from './SweetAlert';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

const TIMEOUT_MINUTES = 15;
const WARNING_BEFORE_MINUTES = 1;
const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000; // 15 minutes = 900,000 ms
const WARNING_MS = (TIMEOUT_MINUTES - WARNING_BEFORE_MINUTES) * 60 * 1000; // 14 minutes = 840,000 ms

export const SessionTimeoutManager: React.FC = () => {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const lastActivityRef = useRef<number>(Date.now());
  const showWarningRef = useRef<boolean>(false);

  // Synchronize ref with state
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  // Handler to reset activity timer when user interacts
  const handleUserActivity = useCallback(() => {
    // Only update activity time if warning modal is NOT active
    if (!showWarningRef.current) {
      lastActivityRef.current = Date.now();
    }
  }, []);

  // Handle auto logout procedure
  const performAutoLogout = useCallback(async () => {
    setShowWarning(false);
    showWarningRef.current = false;

    // 1. Securely clear storage
    localStorage.removeItem('guruku_session_user');
    sessionStorage.clear();

    // 2. Sign out from Supabase Auth if initialized
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase auth signout error during auto-logout:', e);
      }
    }

    // 3. Trigger context logout
    logout();

    // 4. Show security toast message
    Toast.fire({
      icon: 'warning',
      title: 'Sesi Berakhir (Timeout)',
      text: 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 15 menit. Silakan login kembali.'
    });
  }, [logout]);

  // Extend session handler when user clicks "Tetap Login"
  const handleExtendSession = () => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    showWarningRef.current = false;
    showSuccessToast('Sesi Anda berhasil diperpanjang.');
  };

  // Register event listeners for user activity
  useEffect(() => {
    if (!user) return;

    const activityEvents = [
      'mousedown',
      'click',
      'mousemove',
      'keydown',
      'keypress',
      'scroll',
      'touchstart',
      'pointerdown',
      'input',
      'change'
    ];

    // Throttle user activity handler
    let lastThrottledTime = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastThrottledTime > 2000) {
        lastThrottledTime = now;
        handleUserActivity();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, throttledHandler);
      });
    };
  }, [user, handleUserActivity]);

  // Interval check loop running every second
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= TIMEOUT_MS) {
        // Timeout reached -> perform auto logout
        performAutoLogout();
      } else if (elapsed >= WARNING_MS) {
        // Warning threshold reached -> display countdown modal
        const remaining = Math.max(0, Math.ceil((TIMEOUT_MS - elapsed) / 1000));
        setSecondsRemaining(remaining);
        if (!showWarningRef.current) {
          setShowWarning(true);
        }
      } else {
        if (showWarningRef.current) {
          setShowWarning(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, performAutoLogout]);

  if (!user || !showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Top Decorative Header */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>

        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">
          Sesi Anda Akan Berakhir!
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          Tidak ada aktivitas terdeteksi pada akun{' '}
          <strong className="text-slate-800 dark:text-slate-100 font-bold">{user.fullName}</strong>.
          Demi keamanan data akademik sekolah, sesi Anda akan otomatis diakhiri dalam:
        </p>

        {/* Countdown Timer Display */}
        <div className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 mb-6 text-amber-700 dark:amber-300">
          <Clock className="w-5 h-5 animate-pulse text-amber-500" />
          <span className="text-2xl font-black font-mono tracking-wider">
            00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            detik
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleExtendSession}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-sm shadow-lg shadow-[#696cff]/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Tetap Login
          </button>

          <button
            onClick={performAutoLogout}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 font-bold text-sm border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Keluar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};
