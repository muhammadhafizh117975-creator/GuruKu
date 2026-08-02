import React from 'react';
import { SystemSettings } from '../../types';
import { FileText } from 'lucide-react';

interface KopSuratPreviewProps {
  settings: SystemSettings;
}

export const KopSuratPreview: React.FC<KopSuratPreviewProps> = ({ settings }) => {
  const { paperMargin, letterhead } = settings;

  // Scale down A4 representation for preview box
  // A4 ratio: 210mm x 297mm
  const isCm = paperMargin.unit === 'cm';
  const topMm = isCm ? paperMargin.top * 10 : paperMargin.top;
  const bottomMm = isCm ? paperMargin.bottom * 10 : paperMargin.bottom;
  const leftMm = isCm ? paperMargin.left * 10 : paperMargin.left;
  const rightMm = isCm ? paperMargin.right * 10 : paperMargin.right;

  // Percentage conversion based on 210mm width and 297mm height
  const topPct = (topMm / 297) * 100;
  const bottomPct = (bottomMm / 297) * 100;
  const leftPct = (leftMm / 210) * 100;
  const rightPct = (rightMm / 210) * 100;

  return (
    <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#696cff]" />
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Interactive Preview Dokumen PDF (A4)</h4>
        </div>
        <span className="text-xs bg-[#696cff]/10 text-[#696cff] font-semibold px-2.5 py-1 rounded-full">
          A4 (210 x 297 mm)
        </span>
      </div>

      {/* Simulated Paper Sheet */}
      <div className="relative mx-auto w-full max-w-[340px] aspect-[1/1.414] bg-white text-slate-800 shadow-xl rounded-sm border border-slate-300 p-2 overflow-hidden flex flex-col">
        {/* Margin Highlight Bounds */}
        <div 
          className="absolute border border-dashed border-indigo-400 bg-indigo-50/20 flex flex-col pointer-events-none transition-all duration-300"
          style={{
            top: `${topPct}%`,
            bottom: `${bottomPct}%`,
            left: `${leftPct}%`,
            right: `${rightPct}%`
          }}
        >
          {/* Top-Left Margin Badge */}
          <span className="absolute -top-3 -left-1 text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow">
            Top: {paperMargin.top}{paperMargin.unit} | Left: {paperMargin.left}{paperMargin.unit}
          </span>
        </div>

        {/* Inner Content Container inside margins */}
        <div 
          className="w-full h-full flex flex-col relative z-10"
          style={{
            paddingTop: `${topMm * 0.8}px`,
            paddingBottom: `${bottomMm * 0.8}px`,
            paddingLeft: `${leftMm * 0.8}px`,
            paddingRight: `${rightMm * 0.8}px`
          }}
        >
          {/* Kop Surat / Letterhead */}
          {letterhead.showInPdf && letterhead.imageUrl ? (
            <div className="mb-2 border-b border-slate-300 pb-2">
              <img 
                src={letterhead.imageUrl} 
                alt="Kop Surat Letterhead" 
                className="w-full object-contain max-h-[48px]"
              />
            </div>
          ) : (
            <div className="mb-2 p-2 bg-slate-100 border border-dashed border-slate-300 text-center text-[10px] text-slate-400 rounded">
              (Kop Surat Nonaktif)
            </div>
          )}

          {/* Document Content Skeleton */}
          <div className="space-y-1.5 mt-1 flex-1">
            <div className="h-3 w-2/3 bg-slate-800 rounded mx-auto my-2"></div>
            <div className="h-2 w-full bg-slate-200 rounded"></div>
            <div className="h-2 w-5/6 bg-slate-200 rounded"></div>
            <div className="h-2 w-4/5 bg-slate-200 rounded"></div>

            {/* Table Mockup */}
            <div className="mt-3 border border-slate-200 rounded overflow-hidden text-[8px]">
              <div className="bg-[#696cff] text-white p-1 font-bold flex justify-between">
                <span>NO</span>
                <span>NIS / NAMA</span>
                <span>NILAI</span>
              </div>
              <div className="p-1 border-b border-slate-100 flex justify-between text-slate-600">
                <span>1</span>
                <span>2026001 - Aditya P.</span>
                <span>89 (A)</span>
              </div>
              <div className="p-1 border-b border-slate-100 flex justify-between text-slate-600">
                <span>2</span>
                <span>2026002 - Annisa T.</span>
                <span>83 (B)</span>
              </div>
            </div>
          </div>

          {/* Footer Signature Mockup */}
          <div className="mt-auto pt-2 flex justify-end text-[8px] text-slate-600">
            <div className="text-center">
              <p>Jakarta, 2026</p>
              <p className="font-semibold mt-4">Siti Rahmawati, S.Pd.</p>
              <p className="text-[7px] text-slate-400">NUPTK. 3456789012345678</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
