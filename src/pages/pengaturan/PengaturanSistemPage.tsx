import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { GoogleDriveService } from '../../services/googleDrive';
import { generateSupabaseSQLScript, resetSupabaseClient } from '../../services/supabase';
import { KopSuratPreview } from '../../components/common/KopSuratPreview';
import { showSuccessToast } from '../../components/common/SweetAlert';
import {
  Settings,
  Upload,
  Database,
  Copy,
  Check,
  ShieldAlert,
  HardDrive,
  FileText
} from 'lucide-react';

export const PengaturanSistemPage: React.FC = () => {
  const { user } = useAuth();
  const { systemSettings, updateSystemSettings } = useData();

  const [activeTab, setActiveTab] = useState<'margin_kop' | 'supabase_sql'>('margin_kop');

  // Margin State
  const [unit, setUnit] = useState<'mm' | 'cm'>(systemSettings.paperMargin.unit);
  const [top, setTop] = useState<number>(systemSettings.paperMargin.top);
  const [bottom, setBottom] = useState<number>(systemSettings.paperMargin.bottom);
  const [left, setLeft] = useState<number>(systemSettings.paperMargin.left);
  const [right, setRight] = useState<number>(systemSettings.paperMargin.right);

  // Letterhead State
  const [showInPdf, setShowInPdf] = useState<boolean>(systemSettings.letterhead.showInPdf);
  const [heightMm, setHeightMm] = useState<number>(systemSettings.letterhead.heightMm);
  const [imageUrl, setImageUrl] = useState<string>(systemSettings.letterhead.imageUrl);

  // Supabase State
  const [supabaseUrl, setSupabaseUrl] = useState<string>(systemSettings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(systemSettings.supabaseAnonKey || '');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-8 rounded-3xl text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Akses Terbatas</h3>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Pengaturan Sistem hanya dapat diakses oleh Administrator Sekolah.
        </p>
      </div>
    );
  }

  const handleSaveMarginKop = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings({
      paperMargin: { unit, top, bottom, left, right },
      letterhead: {
        ...systemSettings.letterhead,
        showInPdf,
        heightMm,
        imageUrl
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const driveFile = await GoogleDriveService.uploadFile(file, 'System');
      setImageUrl(driveFile.webViewLink);
      showSuccessToast('Gambar Kop Surat berhasil diunggah ke Google Drive!');
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    resetSupabaseClient(supabaseUrl, supabaseAnonKey);
    updateSystemSettings({
      supabaseUrl,
      supabaseAnonKey
    });
    showSuccessToast('Konfigurasi Supabase berhasil diperbarui.');
  };

  const sqlScript = generateSupabaseSQLScript();

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setIsCopied(true);
    showSuccessToast('SQL Script disalin ke clipboard!');
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Preview object for KopSuratPreview component
  const currentPreviewSettings = {
    ...systemSettings,
    paperMargin: { unit, top, bottom, left, right },
    letterhead: {
      ...systemSettings.letterhead,
      showInPdf,
      heightMm,
      imageUrl
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#696cff]" /> Pengaturan Sistem (Khusus Admin)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Atur margin cetak PDF, gambar Kop Surat, dan koneksi Supabase & Google Drive</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('margin_kop')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'margin_kop'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Margin & Kop Surat
          </button>
          <button
            onClick={() => setActiveTab('supabase_sql')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'supabase_sql'
                ? 'bg-[#696cff] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Supabase SQL & aaPanel VPS
          </button>
        </div>
      </div>

      {activeTab === 'margin_kop' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <form onSubmit={handleSaveMarginKop} className="space-y-6">
              {/* SECTION 1: MARGIN KERTAS */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#696cff]" /> 1. Pengaturan Margin Kertas PDF
                  </h3>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500">Satuan:</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as 'mm' | 'cm')}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-[#696cff]"
                    >
                      <option value="mm">Milimeter (mm)</option>
                      <option value="cm">Centimeter (cm)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Margin Atas ({unit})</label>
                    <input
                      type="number"
                      value={top}
                      onChange={(e) => setTop(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Margin Bawah ({unit})</label>
                    <input
                      type="number"
                      value={bottom}
                      onChange={(e) => setBottom(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Margin Kiri ({unit})</label>
                    <input
                      type="number"
                      value={left}
                      onChange={(e) => setLeft(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Margin Kanan ({unit})</label>
                    <input
                      type="number"
                      value={right}
                      onChange={(e) => setRight(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: KOP SURAT */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-[#696cff]" /> 2. Gambar Kop Surat (Letterhead)
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInPdf}
                      onChange={(e) => setShowInPdf(e.target.checked)}
                      className="rounded text-[#696cff] focus:ring-[#696cff]"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tampilkan pada Cetak PDF</span>
                  </label>
                </div>

                {/* Upload Box */}
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-[#696cff] transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="kop-image-upload"
                  />
                  <label htmlFor="kop-image-upload" className="cursor-pointer flex flex-col items-center gap-1.5">
                    <Upload className="w-6 h-6 text-[#696cff]" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Unggah Gambar Kop Surat Baru (Simpan ke GDrive)
                    </span>
                    <span className="text-[10px] text-slate-400">PNG atau JPG dengan latar belakang transparan direkomendasikan</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Tinggi Kop Surat (mm)</label>
                    <input
                      type="number"
                      value={heightMm}
                      onChange={(e) => setHeightMm(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setImageUrl(systemSettings.letterhead.imageUrl)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
                    >
                      Reset Gambar Default
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-extrabold text-xs shadow-lg shadow-[#696cff]/30 transition-all"
                >
                  Simpan Pengaturan Margin & Kop Surat
                </button>
              </div>
            </form>
          </div>

          {/* Interactive Live Preview Box */}
          <div className="lg:col-span-5">
            <KopSuratPreview settings={currentPreviewSettings} />
          </div>
        </div>
      ) : (
        /* SUPABASE & AAPANEL TAB */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#696cff]" /> Konfigurasi Kredensial Supabase Runtime
            </h3>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">VITE_SUPABASE_URL</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">VITE_SUPABASE_ANON_KEY</label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#696cff]"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#696cff] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 hover:bg-[#5f61e6]"
              >
                Terapkan Kredensial Supabase
              </button>
            </form>
          </div>

          {/* SQL Migration Exporter */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" /> SQL Schema & RLS Replication Exporter (aaPanel VPS)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Salin script SQL di bawah ini dan paste ke Supabase SQL Editor untuk membuat tabel dan mengaktifkan Realtime postgres_changes
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Tersalin!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl text-[11px] font-mono h-80 overflow-y-auto custom-scrollbar leading-relaxed">
                {sqlScript}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
