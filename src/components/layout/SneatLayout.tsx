import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { SessionTimeoutManager } from '../common/SessionTimeoutManager';
import { ShieldCheck, Heart } from 'lucide-react';

interface SneatLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const SneatLayout: React.FC<SneatLayoutProps> = ({
  activeTab,
  setActiveTab,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#161625] text-slate-800 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-200">
      {/* Auto Logout Session Timeout Manager */}
      <SessionTimeoutManager />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        {/* Sneat Footer */}
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>© 2026</span>
            <span className="font-bold text-[#696cff]">GuruKu Academic Portal</span>
            <span>- All rights reserved.</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              Dibuat dengan <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> untuk Sekolah Indonesia
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1 text-[#696cff] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Supabase & GDrive Ready
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
