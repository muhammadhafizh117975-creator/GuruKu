import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Grade, Attendance, TeachingJournal, SystemSettings } from '../types';

export const PdfExcelService = {
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
  async createConfiguredPdf(settings: SystemSettings, title: string, orientation: 'p' | 'l' = 'p') {
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
    if (settings.letterhead.showInPdf && settings.letterhead.imageUrl) {
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
    }

    // Draw Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(43, 44, 64); // Sneat dark text
    doc.text(title.toUpperCase(), doc.internal.pageSize.getWidth() / 2, currentY + 4, { align: 'center' });

    currentY += 12;

    return { doc, currentY, leftMargin, rightMargin, topMargin };
  },

  /**
   * Export Rekap Nilai Siswa to PDF
   */
  async exportGradesPdf(grades: Grade[], settings: SystemSettings, subTitleInfo: string) {
    const title = 'Laporan Rekapitulasi Nilai Siswa';
    const { doc, currentY, leftMargin } = await this.createConfiguredPdf(settings, title, 'p');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(105, 122, 141);
    doc.text(subTitleInfo, leftMargin, currentY);

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
      startY: currentY + 5,
      head: [['No', 'NIS', 'Nama Siswa', 'Kelas', 'Tugas', 'Harian', 'PTS', 'PAS', 'Nilai Akhir', 'Predikat', 'Catatan']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [105, 108, 255], // Sneat primary purple #696cff
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 20 },
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
  async exportAttendancePdf(attendanceRecords: Attendance[], settings: SystemSettings, subTitleInfo: string) {
    const title = 'Laporan Rekapitulasi Absensi Siswa';
    const { doc, currentY, leftMargin } = await this.createConfiguredPdf(settings, title, 'p');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(105, 122, 141);
    doc.text(subTitleInfo, leftMargin, currentY);

    const tableData = attendanceRecords.map((att, index) => [
      index + 1,
      att.date,
      att.studentNis || '-',
      att.studentName || '-',
      att.status,
      att.notes || '-'
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['No', 'Tanggal', 'NIS', 'Nama Siswa', 'Status Kehadiran', 'Keterangan']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [105, 108, 255],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', fontStyle: 'bold' }
      },
      margin: {
        top: settings.paperMargin.unit === 'cm' ? settings.paperMargin.top * 10 : settings.paperMargin.top,
        bottom: settings.paperMargin.unit === 'cm' ? settings.paperMargin.bottom * 10 : settings.paperMargin.bottom,
        left: settings.paperMargin.unit === 'cm' ? settings.paperMargin.left * 10 : settings.paperMargin.left,
        right: settings.paperMargin.unit === 'cm' ? settings.paperMargin.right * 10 : settings.paperMargin.right
      }
    });

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
  async exportJournalsPdf(journals: TeachingJournal[], settings: SystemSettings, subTitleInfo: string) {
    const title = 'Laporan Jurnal Mengajar Guru';
    const { doc, currentY, leftMargin } = await this.createConfiguredPdf(settings, title, 'l'); // Landscape for rich table

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(105, 122, 141);
    doc.text(subTitleInfo, leftMargin, currentY);

    const tableData = journals.map((j, index) => [
      index + 1,
      j.date,
      j.teacherName || '-',
      j.subjectName || '-',
      j.className || '-',
      j.timeSlot,
      j.topic,
      j.method,
      `${j.attendeeCount} siswa`,
      j.notes || '-'
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['No', 'Tanggal', 'Guru', 'Mata Pelajaran', 'Kelas', 'Jam', 'Materi', 'Metode', 'Hadir', 'Catatan']],
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
        4: { halign: 'center', cellWidth: 15 },
        8: { halign: 'center', cellWidth: 18 }
      },
      margin: {
        top: settings.paperMargin.unit === 'cm' ? settings.paperMargin.top * 10 : settings.paperMargin.top,
        bottom: settings.paperMargin.unit === 'cm' ? settings.paperMargin.bottom * 10 : settings.paperMargin.bottom,
        left: settings.paperMargin.unit === 'cm' ? settings.paperMargin.left * 10 : settings.paperMargin.left,
        right: settings.paperMargin.unit === 'cm' ? settings.paperMargin.right * 10 : settings.paperMargin.right
      }
    });

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
