import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Grade, Attendance, TeachingJournal, SystemSettings, UserProfile, SchoolPrincipal } from '../types';

export const PdfExcelService = {
  /**
   * Helper to format Indonesian Date: e.g. 30 Juli 2026
   */
  formatIndonesianDate(date: Date = new Date()): string {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  },

  /**
   * Helper to draw standard document signature block (Kiri: Kepala Sekolah, Kanan: Titimangsa & Guru)
   */
  addSignatureBlock(
    doc: jsPDF,
    startY: number,
    settings: SystemSettings,
    user?: UserProfile | null,
    activePrincipal?: SchoolPrincipal | null
  ) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = settings.paperMargin;
    const leftMargin = margin.unit === 'cm' ? margin.left * 10 : margin.left;
    const rightMargin = margin.unit === 'cm' ? margin.right * 10 : margin.right;
    const bottomMargin = margin.unit === 'cm' ? margin.bottom * 10 : margin.bottom;

    // Ensure we don't overflow the page, create a new page if necessary
    const signatureHeight = 45; // mm needed for signatures
    let y = startY + 8;
    if (y + signatureHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = margin.unit === 'cm' ? margin.top * 10 : margin.top;
    }

    const city = settings?.schoolInfo?.city || 'Bandung';
    const currentDateStr = `${city}, ${this.formatIndonesianDate(new Date())}`;
    
    let headmasterName = settings?.schoolInfo?.headmasterName || 'Dr. H. Ahmad Dahlan, M.Pd.';
    let headmasterNuptk = settings?.schoolInfo?.headmasterNip || '19700101 199512 1 002';
    let headmasterPosition = 'Kepala Sekolah';

    if (activePrincipal) {
      headmasterName = activePrincipal.title
        ? `${activePrincipal.fullName}, ${activePrincipal.title}`
        : activePrincipal.fullName;
      headmasterNuptk = activePrincipal.nuptk || activePrincipal.nip || '-';
      headmasterPosition = activePrincipal.position || 'Kepala Sekolah';
    }

    const isAdmin = user?.role === 'admin';
    const teacherName = user?.fullName || (isAdmin ? 'Administrator Sistem' : 'Guru Pengajar');
    const teacherNuptk = user?.nipNuptk || '-';
    const rightRoleTitle = isAdmin ? 'Administrator Sistem' : 'Guru Mata Pelajaran';

    // Column positions
    const leftX = leftMargin;
    const rightX = pageWidth - rightMargin - 65; // Align right column nicely

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    // Kiri: Mengetahui, Kepala Sekolah
    doc.text('Mengetahui,', leftX, y);
    doc.text(headmasterPosition, leftX, y + 5);

    // Kanan: Titimangsa & Role Title
    doc.text(currentDateStr, rightX, y);
    doc.text(rightRoleTitle, rightX, y + 5);

    // Signature Space
    const nameY = y + 28;

    // Kiri: (Nama Kepala Sekolah) underlined
    doc.setFont('helvetica', 'bold');
    doc.text(`(${headmasterName})`, leftX, nameY);
    const headmasterWidth = doc.getTextWidth(`(${headmasterName})`);
    doc.line(leftX, nameY + 1, leftX + headmasterWidth, nameY + 1);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`NUPTK/NIP. ${headmasterNuptk}`, leftX, nameY + 6);

    // Kanan: (Nama Guru) underlined
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`(${teacherName})`, rightX, nameY);
    const teacherWidth = doc.getTextWidth(`(${teacherName})`);
    doc.line(rightX, nameY + 1, rightX + teacherWidth, nameY + 1);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`NUPTK/NIP. ${teacherNuptk}`, rightX, nameY + 6);

    return nameY + 12;
  },

  /**
   * Helper to load an image onto an HTML Canvas or img element to get Base64 format for jsPDF
   */
  async getImageBase64(url: string): Promise<string | null> {
    if (!url) return null;
    if (url.startsWith('data:image/')) return url;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  },

  /**
   * Creates a pre-configured jsPDF instance with exact paper margins & Kop Surat image header
   */
  async createConfiguredPdf(
    settings: SystemSettings,
    title: string,
    meta?: {
      academicYear?: string;
      semester?: string;
      subjectName?: string;
      gradeLevel?: string;
      className?: string;
      teacherName?: string;
      printDate?: string;
    },
    orientation: 'p' | 'l' = 'p'
  ) {
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    const margin = settings.paperMargin;
    // Convert margin to mm if needed
    const topMargin = margin.unit === 'cm' ? margin.top * 10 : margin.top;
    const leftMargin = margin.unit === 'cm' ? margin.left * 10 : margin.left;
    const rightMargin = margin.unit === 'cm' ? margin.right * 10 : margin.right;
    
    let currentY = topMargin;

    // Draw Kop Surat (Letterhead) if enabled
    if (settings?.letterhead?.showInPdf) {
      if (settings.letterhead.imageUrl) {
        try {
          const imgData = await this.getImageBase64(settings.letterhead.imageUrl);
          if (imgData) {
            const pageWidth = doc.internal.pageSize.getWidth();
            const printableWidth = pageWidth - leftMargin - rightMargin;
            const letterheadHeight = settings.letterhead.heightMm || 30;

            doc.addImage(imgData, 'PNG', leftMargin, currentY, printableWidth, letterheadHeight);
            currentY += letterheadHeight + 5;
          }
        } catch (e) {
          console.warn('Failed to load letterhead image into PDF:', e);
        }
      } else if (settings.schoolInfo?.schoolName) {
        // Dynamic text Kop Surat from schoolInfo
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(30, 41, 59);
        doc.text(settings.schoolInfo.schoolName.toUpperCase(), centerX, currentY + 4, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        if (settings.schoolInfo.address) {
          doc.text(settings.schoolInfo.address, centerX, currentY + 9, { align: 'center' });
        }
        const contactLine = [
          settings.schoolInfo.phone ? `Telp: ${settings.schoolInfo.phone}` : '',
          settings.schoolInfo.email ? `Email: ${settings.schoolInfo.email}` : '',
          settings.schoolInfo.website ? `Website: ${settings.schoolInfo.website}` : ''
        ].filter(Boolean).join(' | ');
        if (contactLine) {
          doc.text(contactLine, centerX, currentY + 14, { align: 'center' });
        }

        // Double line separator
        doc.setLineWidth(0.8);
        doc.setDrawColor(30, 41, 59);
        doc.line(leftMargin, currentY + 18, pageWidth - rightMargin, currentY + 18);
        doc.setLineWidth(0.2);
        doc.line(leftMargin, currentY + 19, pageWidth - rightMargin, currentY + 19);

        currentY += 24;
      }
    }

    // Draw Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text(title.toUpperCase(), doc.internal.pageSize.getWidth() / 2, currentY + 4, { align: 'center' });

    currentY += 10;

    // Draw Dynamic Metadata Header Box if meta provided
    if (meta) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const boxWidth = pageWidth - leftMargin - rightMargin;
      const boxY = currentY;

      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(leftMargin, boxY, boxWidth, 18, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // slate-500

      const col1X = leftMargin + 4;
      const col2X = leftMargin + (boxWidth / 2) + 4;

      const printDateStr = meta.printDate || this.formatIndonesianDate();
      const schoolName = settings.schoolInfo?.schoolName || 'SMP Negeri';

      // Line 1
      doc.text(`Sekolah: ${schoolName}`, col1X, boxY + 5);
      doc.text(`Tahun Ajaran: ${meta.academicYear || '2025/2026'}`, col2X, boxY + 5);

      // Line 2
      doc.text(`Mata Pelajaran: ${meta.subjectName || 'Semua Mapel'}`, col1X, boxY + 10);
      doc.text(`Semester: ${meta.semester || 'Ganjil'}`, col2X, boxY + 10);

      // Line 3
      doc.text(`Kelas / Tingkat: ${meta.className || 'Semua Kelas'} (${meta.gradeLevel || 'Semua Tingkat'})`, col1X, boxY + 15);
      doc.text(`Guru: ${meta.teacherName || 'Guru Pengajar'} | Tgl Cetak: ${printDateStr}`, col2X, boxY + 15);

      currentY += 23;
    }

    return { doc, currentY, leftMargin, rightMargin, topMargin };
  },

  /**
   * Export Rekap Nilai Siswa to PDF
   */
  async exportGradesPdf(
    grades: Grade[],
    settings: SystemSettings,
    subTitleInfo: string,
    user?: UserProfile | null,
    activePrincipal?: SchoolPrincipal | null,
    metaInfo?: {
      academicYear?: string;
      semester?: string;
      subjectName?: string;
      gradeLevel?: string;
      className?: string;
    }
  ) {
    const title = 'Laporan Rekapitulasi Nilai Siswa';
    const teacherName = user?.fullName || 'Guru Pengajar';

    const { doc, currentY } = await this.createConfiguredPdf(
      settings,
      title,
      {
        academicYear: metaInfo?.academicYear || '2025/2026',
        semester: metaInfo?.semester || 'Ganjil',
        subjectName: metaInfo?.subjectName || 'Semua Mata Pelajaran',
        gradeLevel: metaInfo?.gradeLevel || 'Semua Tingkat',
        className: metaInfo?.className || 'Semua Kelas',
        teacherName
      },
      'p'
    );

    const tableData = grades.map((g, index) => [
      index + 1,
      g.studentNis || '-',
      g.studentName || '-',
      g.className || '-',
      g.assignmentScore,
      g.dailyScore,
      g.ptsScore,
      g.pasScore,
      g.finalScore,
      g.predicate,
      g.notes || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'NIS', 'Nama Siswa', 'Kelas', 'Tugas', 'Harian', 'PTS', 'PAS', 'Nilai Akhir', 'Predikat', 'Catatan']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [105, 108, 255], // Sneat primary purple #696cff
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 18 },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
        8: { halign: 'center', fontStyle: 'bold' },
        9: { halign: 'center', fontStyle: 'bold' }
      },
      margin: {
        top: settings.paperMargin.unit === 'cm' ? settings.paperMargin.top * 10 : settings.paperMargin.top,
        bottom: settings.paperMargin.unit === 'cm' ? settings.paperMargin.bottom * 10 : settings.paperMargin.bottom,
        left: settings.paperMargin.unit === 'cm' ? settings.paperMargin.left * 10 : settings.paperMargin.left,
        right: settings.paperMargin.unit === 'cm' ? settings.paperMargin.right * 10 : settings.paperMargin.right
      }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 50;
    this.addSignatureBlock(doc, finalY, settings, user, activePrincipal);

    doc.save(`Laporan_Nilai_Siswa_${Date.now()}.pdf`);
  },

  /**
   * Export Rekap Nilai Siswa to Excel (XLSX)
   */
  exportGradesExcel(grades: Grade[], subTitleInfo: string) {
    const data = grades.map((g, index) => ({
      'No': index + 1,
      'NIS': g.studentNis || '-',
      'Nama Siswa': g.studentName || '-',
      'Kelas': g.className || '-',
      'Mata Pelajaran': g.subjectName || '-',
      'Nilai Tugas (20%)': g.assignmentScore,
      'Nilai Harian (30%)': g.dailyScore,
      'Nilai PTS (25%)': g.ptsScore,
      'Nilai PAS (25%)': g.pasScore,
      'Nilai Akhir': g.finalScore,
      'Predikat': g.predicate,
      'Tahun Ajaran': g.academicYear,
      'Semester': g.semester,
      'Catatan Guru': g.notes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai');
    XLSX.writeFile(workbook, `Rekap_Nilai_${Date.now()}.xlsx`);
  },

  /**
   * Export Rekap Absensi Siswa to PDF
   */
  async exportAttendancePdf(
    attendanceRecords: Attendance[],
    settings: SystemSettings,
    subTitleInfo: string,
    user?: UserProfile | null,
    activePrincipal?: SchoolPrincipal | null,
    metaInfo?: {
      academicYear?: string;
      semester?: string;
      subjectName?: string;
      gradeLevel?: string;
      className?: string;
    }
  ) {
    const title = 'Laporan Rekapitulasi Presensi Siswa';
    const teacherName = user?.fullName || 'Guru Pengajar';

    const { doc, currentY } = await this.createConfiguredPdf(
      settings,
      title,
      {
        academicYear: metaInfo?.academicYear || '2025/2026',
        semester: metaInfo?.semester || 'Ganjil',
        subjectName: metaInfo?.subjectName || 'Semua Mata Pelajaran',
        gradeLevel: metaInfo?.gradeLevel || 'Semua Tingkat',
        className: metaInfo?.className || 'Semua Kelas',
        teacherName
      },
      'p'
    );

    const tableData = attendanceRecords.map((att, index) => [
      index + 1,
      att.date,
      att.studentNis || '-',
      att.studentName || '-',
      att.status,
      att.notes || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tanggal', 'NIS', 'Nama Siswa', 'Status Kehadiran', 'Keterangan']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [105, 108, 255],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 22 },
        2: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', fontStyle: 'bold' }
      },
      margin: {
        top: settings.paperMargin.unit === 'cm' ? settings.paperMargin.top * 10 : settings.paperMargin.top,
        bottom: settings.paperMargin.unit === 'cm' ? settings.paperMargin.bottom * 10 : settings.paperMargin.bottom,
        left: settings.paperMargin.unit === 'cm' ? settings.paperMargin.left * 10 : settings.paperMargin.left,
        right: settings.paperMargin.unit === 'cm' ? settings.paperMargin.right * 10 : settings.paperMargin.right
      }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 50;
    this.addSignatureBlock(doc, finalY, settings, user, activePrincipal);

    doc.save(`Laporan_Absensi_${Date.now()}.pdf`);
  },

  /**
   * Export Rekap Absensi to Excel
   */
  exportAttendanceExcel(attendanceRecords: Attendance[]) {
    const data = attendanceRecords.map((att, index) => ({
      'No': index + 1,
      'Tanggal': att.date,
      'NIS': att.studentNis || '-',
      'Nama Siswa': att.studentName || '-',
      'Status Kehadiran': att.status,
      'Keterangan / Catatan': att.notes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Absensi');
    XLSX.writeFile(workbook, `Laporan_Absensi_${Date.now()}.xlsx`);
  },

  /**
   * Export Jurnal Mengajar to PDF
   */
  async exportJournalsPdf(
    journals: TeachingJournal[],
    settings: SystemSettings,
    subTitleInfo: string,
    user?: UserProfile | null,
    activePrincipal?: SchoolPrincipal | null,
    metaInfo?: {
      academicYear?: string;
      semester?: string;
      subjectName?: string;
      gradeLevel?: string;
      className?: string;
    }
  ) {
    const title = 'Laporan Jurnal Mengajar Guru';
    const teacherName = user?.fullName || 'Guru Pengajar';

    const { doc, currentY } = await this.createConfiguredPdf(
      settings,
      title,
      {
        academicYear: metaInfo?.academicYear || '2025/2026',
        semester: metaInfo?.semester || 'Ganjil',
        subjectName: metaInfo?.subjectName || 'Semua Mata Pelajaran',
        gradeLevel: metaInfo?.gradeLevel || 'Semua Tingkat',
        className: metaInfo?.className || 'Semua Kelas',
        teacherName
      },
      'p' // A4 Portrait
    );

    const tableData = journals.map((j, index) => [
      index + 1,
      j.date,
      j.teacherName || '-',
      j.subjectName || '-',
      j.className || '-',
      j.timeSlot,
      j.topic,
      `${j.attendeeCount} Siswa`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tanggal', 'Guru', 'Mata Pelajaran', 'Kelas', 'Jam', 'Materi Pembelajaran', 'Hadir']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [105, 108, 255],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 15 },
        5: { halign: 'center', cellWidth: 18 },
        7: { halign: 'center', cellWidth: 18 }
      },
      margin: {
        top: settings.paperMargin.unit === 'cm' ? settings.paperMargin.top * 10 : settings.paperMargin.top,
        bottom: settings.paperMargin.unit === 'cm' ? settings.paperMargin.bottom * 10 : settings.paperMargin.bottom,
        left: settings.paperMargin.unit === 'cm' ? settings.paperMargin.left * 10 : settings.paperMargin.left,
        right: settings.paperMargin.unit === 'cm' ? settings.paperMargin.right * 10 : settings.paperMargin.right
      }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 50;
    this.addSignatureBlock(doc, finalY, settings, user, activePrincipal);

    doc.save(`Laporan_Jurnal_Mengajar_${Date.now()}.pdf`);
  },

  /**
   * Export Jurnal Mengajar to Excel
   */
  exportJournalsExcel(journals: TeachingJournal[]) {
    const data = journals.map((j, index) => ({
      'No': index + 1,
      'Tanggal': j.date,
      'Nama Guru': j.teacherName || '-',
      'Mata Pelajaran': j.subjectName || '-',
      'Kelas': j.className || '-',
      'Jam Pelajaran': j.timeSlot,
      'Materi Pembelajaran': j.topic,
      'Metode Pembelajaran': j.method,
      'Jumlah Hadir': j.attendeeCount,
      'Catatan Guru': j.notes || '-',
      'Lampiran Drive ID': j.attachmentDriveId || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jurnal Mengajar');
    XLSX.writeFile(workbook, `Jurnal_Mengajar_${Date.now()}.xlsx`);
  }
};

