import React from 'react';
import { Modal } from './Modal';
import { SystemSettings, UserProfile, SchoolPrincipal } from '../../types';
import { Printer, Download, FileText } from 'lucide-react';

export interface ReportMeta {
  title: string;
  academicYear?: string;
  semester?: string;
  subjectName?: string;
  gradeLevel?: string;
  className?: string;
  teacherName?: string;
  printDate?: string;
}

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  meta: ReportMeta;
  activePrincipal?: SchoolPrincipal | null;
  currentUser?: UserProfile | null;
  tableHeaders: string[];
  tableData: (string | number)[][];
  summaryBadge?: string;
  onExportPdf?: () => void;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  isOpen,
  onClose,
  settings,
  meta,
  activePrincipal,
  currentUser,
  tableHeaders,
  tableData,
  summaryBadge,
  onExportPdf
}) => {
  if (!isOpen) return null;

  const { paperMargin, letterhead, schoolInfo } = settings;

  // Format Indonesian date
  const formatIndoDate = (date = new Date()) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const currentDateStr = meta.printDate || formatIndoDate();
  const city = schoolInfo?.city || 'Bandung';

  // Kepala Sekolah info
  let headmasterName = schoolInfo?.headmasterName || 'Dr. H. Ahmad Dahlan, M.Pd.';
  let headmasterNuks = schoolInfo?.headmasterNuks || '21023L0130924241123456';
  let headmasterPosition = 'Kepala Sekolah';

  if (activePrincipal) {
    headmasterName = activePrincipal.title
      ? `${activePrincipal.fullName}, ${activePrincipal.title}`
      : activePrincipal.fullName;
    headmasterNuks = activePrincipal.nuks || '-';
    headmasterPosition = activePrincipal.position || 'Kepala Sekolah';
  }

  // Guru info
  const isAdmin = currentUser?.role === 'admin';
  const teacherName = meta.teacherName || currentUser?.fullName || (isAdmin ? 'Administrator Sistem' : 'Guru Pengajar');
  const teacherNuptk = currentUser?.nipNuptk || '-';
  const teacherRoleTitle = isAdmin ? 'Administrator Sistem' : 'Guru Mata Pelajaran';

  // Margins converted to mm or css string
  const marginUnit = paperMargin.unit || 'mm';
  const topMargin = `${paperMargin.top}${marginUnit}`;
  const bottomMargin = `${paperMargin.bottom}${marginUnit}`;
  const leftMargin = `${paperMargin.left}${marginUnit}`;
  const rightMargin = `${paperMargin.right}${marginUnit}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pratinjau Format Cetak Dokumen (A4 Portrait)"
      subtitle="Standardisasi laporan resmi dengan kop surat, margin presisi, dan blok tanda tangan otomatis"
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4">
        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <FileText className="w-4 h-4 text-[#696cff]" />
            <span>Format Kertas: <strong className="text-[#696cff]">A4 Portrait (210 x 297 mm)</strong></span>
            {summaryBadge && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-[#696cff] text-[11px]">
                {summaryBadge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onExportPdf && (
              <button
                type="button"
                onClick={onExportPdf}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" /> Unduh PDF
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak Langsung (Print)
            </button>
          </div>
        </div>

        {/* CSS for @media print */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-report-area, #printable-report-area * {
              visibility: visible !important;
            }
            #printable-report-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
            }
            @page {
              size: A4 portrait;
              margin: ${topMargin} ${rightMargin} ${bottomMargin} ${leftMargin};
            }
          }
        `}</style>

        {/* Scrollable Document Container */}
        <div className="max-h-[70vh] overflow-y-auto p-4 bg-slate-200 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 flex justify-center">
          {/* Simulated A4 Paper */}
          <div
            id="printable-report-area"
            className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm font-sans flex flex-col justify-between"
            style={{
              paddingTop: topMargin,
              paddingBottom: bottomMargin,
              paddingLeft: leftMargin,
              paddingRight: rightMargin,
              boxSizing: 'border-box'
            }}
          >
            <div>
              {/* KOP SURAT */}
              {letterhead?.showInPdf && letterhead.imageUrl ? (
                <div className="mb-4 border-b-2 border-slate-800 pb-2 flex justify-center">
                  <img
                    src={letterhead.imageUrl}
                    alt="Kop Surat"
                    className="w-full object-contain max-h-[110px]"
                  />
                </div>
              ) : (
                <div className="mb-4 text-center border-b-2 border-slate-800 pb-3">
                  <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
                    {schoolInfo?.schoolName || 'SEKOLAH MENENGAH PERTAMA (SMP) NEGERI'}
                  </h1>
                  {schoolInfo?.address && (
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{schoolInfo.address}</p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {[
                      schoolInfo?.phone ? `Telp: ${schoolInfo.phone}` : '',
                      schoolInfo?.email ? `Email: ${schoolInfo.email}` : '',
                      schoolInfo?.website ? `Website: ${schoolInfo.website}` : ''
                    ]
                      .filter(Boolean)
                      .join(' | ')}
                  </p>
                </div>
              )}

              {/* JUDUL LAPORAN */}
              <div className="text-center my-4">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 underline decoration-2 underline-offset-4">
                  {meta.title}
                </h2>
              </div>

              {/* HEADER INFORMASI DINAMIS LAPORAN (GRID META DATA) */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-semibold text-slate-500">Sekolah:</span>{' '}
                  <strong className="text-slate-800">{schoolInfo?.schoolName || '-'}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Tahun Ajaran:</span>{' '}
                  <strong className="text-slate-800">{meta.academicYear || '2025/2026'}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Mata Pelajaran:</span>{' '}
                  <strong className="text-[#696cff]">{meta.subjectName || 'Semua Mata Pelajaran'}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Semester:</span>{' '}
                  <strong className="text-slate-800">{meta.semester || 'Ganjil'}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Kelas / Rombel:</span>{' '}
                  <strong className="text-slate-800">{meta.className || 'Semua Kelas'}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Tingkat:</span>{' '}
                  <strong className="text-slate-800">{meta.gradeLevel || 'Semua Tingkat'}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Guru Pengajar:</span>{' '}
                  <strong className="text-slate-800">{teacherName}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Tanggal Cetak:</span>{' '}
                  <strong className="text-slate-800">{currentDateStr}</strong>
                </div>
              </div>

              {/* TABLE DATA LAPORAN */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold border border-slate-800">
                      {tableHeaders.map((header, idx) => (
                        <th key={idx} className="p-2 border border-slate-700 text-center uppercase tracking-wider font-bold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 border border-slate-300">
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan={tableHeaders.length} className="p-4 text-center text-slate-400 font-medium">
                          Tidak ada data untuk ditampilkan dalam laporan.
                        </td>
                      </tr>
                    ) : (
                      tableData.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`p-2 border border-slate-200 ${
                                cIdx === 0 || typeof cell === 'number' || cell === 'A' || cell === 'B' || cell === 'C' || cell === 'D' || cell === 'Hadir' || cell === 'Izin' || cell === 'Sakit' || cell === 'Alfa'
                                  ? 'text-center font-medium'
                                  : 'text-left'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BLOK TANDA TANGAN (FOOTER & SIGNATURES) */}
            <div className="pt-6 border-t border-slate-200 mt-auto grid grid-cols-2 gap-8 text-xs text-slate-800 page-break-inside-avoid">
              {/* Kiri: Kepala Sekolah */}
              <div>
                <p className="font-medium">Mengetahui,</p>
                <p className="font-bold text-slate-900 mt-0.5">{headmasterPosition}</p>

                <div className="h-16"></div>

                <p className="font-extrabold text-slate-900 underline decoration-1 underline-offset-2">
                  {headmasterName}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  NUKS. {headmasterNuks}
                </p>
              </div>

              {/* Kanan: Titimangsa & Guru */}
              <div className="text-right">
                <p className="font-medium">{city}, {currentDateStr}</p>
                <p className="font-bold text-slate-900 mt-0.5">{teacherRoleTitle}</p>

                <div className="h-16"></div>

                <p className="font-extrabold text-slate-900 underline decoration-1 underline-offset-2">
                  {teacherName}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  NUPTK. {teacherNuptk}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 cursor-pointer"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </Modal>
  );
};
