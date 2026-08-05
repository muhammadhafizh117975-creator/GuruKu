import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { SneatLayout } from './components/layout/SneatLayout';
import { LoginPage } from './pages/auth/LoginPage';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { GuruPage } from './pages/master/GuruPage';
import { MataPelajaranPage } from './pages/master/MataPelajaranPage';
import { KelasPage } from './pages/master/KelasPage';
import { SiswaPage } from './pages/master/SiswaPage';
import { NilaiPage } from './pages/akademik/NilaiPage';
import { AbsensiPage } from './pages/akademik/AbsensiPage';
import { JurnalPage } from './pages/akademik/JurnalPage';
import { ArsipModulPage } from './pages/akademik/ArsipModulPage';
import { LaporanNilaiPage } from './pages/laporan/LaporanNilaiPage';
import { LaporanAbsensiPage } from './pages/laporan/LaporanAbsensiPage';
import { LaporanJurnalPage } from './pages/laporan/LaporanJurnalPage';
import { PengaturanSistemPage } from './pages/pengaturan/PengaturanSistemPage';
import { ProfilPage } from './pages/pengaturan/ProfilPage';
import { PanduanAdminPage } from './pages/panduan/PanduanAdminPage';
import { PanduanGuruPage } from './pages/panduan/PanduanGuruPage';

const getInitialTab = (): string => {
  try {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && hash !== 'login') {
      return hash;
    }
    const savedSession = sessionStorage.getItem('guruku_active_tab');
    if (savedSession && savedSession !== 'login') {
      return savedSession;
    }
    const savedLocal = localStorage.getItem('guruku_active_tab');
    if (savedLocal && savedLocal !== 'login') {
      return savedLocal;
    }
  } catch (e) {
    console.warn('Failed reading initial active tab:', e);
  }
  return 'dashboard';
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  React.useEffect(() => {
    if (user && activeTab && activeTab !== 'login') {
      try {
        sessionStorage.setItem('guruku_active_tab', activeTab);
        localStorage.setItem('guruku_active_tab', activeTab);
        if (window.location.hash !== `#${activeTab}`) {
          window.history.replaceState(null, '', `#${activeTab}`);
        }
      } catch (e) {
        console.warn('Failed persisting active tab:', e);
      }
    }
  }, [user, activeTab]);

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && hash !== 'login') {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') ||
      localStorage.getItem('guruku_theme') !== 'light';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  if (!user) {
    return <LoginPage />;
  }

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'guru':
        return user.role === 'admin' ? <GuruPage /> : <DashboardPage setActiveTab={setActiveTab} />;
      case 'mapel':
      case 'mata-pelajaran':
        return <MataPelajaranPage />;
      case 'kelas':
        return <KelasPage />;
      case 'siswa':
        return <SiswaPage />;
      case 'nilai':
        return <NilaiPage />;
      case 'absensi':
        return <AbsensiPage />;
      case 'jurnal':
        return <JurnalPage />;
      case 'arsip':
      case 'arsip-modul':
        return <ArsipModulPage />;
      case 'laporan-nilai':
        return <LaporanNilaiPage />;
      case 'laporan-absensi':
        return <LaporanAbsensiPage />;
      case 'laporan-jurnal':
        return <LaporanJurnalPage />;
      case 'pengaturan':
      case 'pengaturan-sistem':
        return user.role === 'admin' ? <PengaturanSistemPage /> : <DashboardPage setActiveTab={setActiveTab} />;
      case 'panduan-admin':
        return <PanduanAdminPage />;
      case 'panduan-guru':
        return <PanduanGuruPage />;
      case 'profil':
        return <ProfilPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <SneatLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderCurrentPage()}
    </SneatLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
