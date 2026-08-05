import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AttendanceStatus } from '../../types';
import { PdfExcelService } from '../../services/pdfExcel';
import {
  CalendarCheck,
  CheckCircle2,
  Save,
  Download,
  FileSpreadsheet
} from 'lucide-react';

export const AbsensiPage: React.FC = () => {
  const { user } = useAuth();
  const { subjects, classes, students, attendance, systemSettings, saveAttendanceBatch, activePrincipal } = useData();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  React.useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const classStudents = students
    .filter((s) => s.classId === selectedClassId)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'id', { sensitivity: 'base' }));

  const [statusMap, setStatusMap] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});

  // Sync state
  React.useEffect(() => {
    const initialMap: typeof statusMap = {};
    classStudents.forEach((std) => {
      const existing = attendance.find(
        (a) =>
          a.studentId === std.id &&
          a.subjectId === selectedSubjectId &&
          a.date === date
      );
      initialMap[std.id] = {
        status: existing?.status || 'Hadir',
        notes: existing?.notes || ''
      };
    });
    setStatusMap(initialMap);
  }, [selectedSubjectId, selectedClassId, date, attendance]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const handleMarkAllHadir = () => {
    const newMap: typeof statusMap = {};
    classStudents.forEach((std) => {
      newMap[std.id] = {
        status: 'Hadir',
        notes: statusMap[std.id]?.notes || ''
      };
    });
    setStatusMap(newMap);
  };

  const handleSave = () => {
    const records = classStudents.map((std) => ({
      date,
      studentId: std.id,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      teacherId: user?.id || 'global_teacher',
      status: statusMap[std.id]?.status || 'Hadir',
      notes: statusMap[std.id]?.notes || ''
    }));

    saveAttendanceBatch(records);
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentClass = classes.find((c) => c.id === selectedClassId);

  // Counters
  const statusValues = Object.values(statusMap) as { status: AttendanceStatus; notes: string }[];
  const countHadir = statusValues.filter((s) => s.status === 'Hadir').length;
  const countIzin = statusValues.filter((s) => s.status === 'Izin').length;
  const countSakit = statusValues.filter((s) => s.status === 'Sakit').length;
  const countAlfa = statusValues.filter((s) => s.status === 'Alfa').length;

  const currentRecordsForReport = classStudents.map((std) => ({
    id: `att_rep_${std.id}`,
    date,
    studentId: std.id,
    studentName: std.fullName,
    studentNis: std.nis,
    classId: selectedClassId,
    subjectId: selectedSubjectId,
    teacherId: user?.id || '',
    status: statusMap[std.id]?.status || 'Hadir',
    notes: statusMap[std.id]?.notes || '',
    createdAt: new Date().toISOString()
  }));

  const handleExportPdf = async () => {
    const subTitle = `Mata Pelajaran: ${currentSubject?.name || '-'} | Kelas: ${currentClass?.name || '-'} | Tanggal: ${date}`;
    await PdfExcelService.exportAttendancePdf(currentRecordsForReport, systemSettings, subTitle, user, activePrincipal);
  };

  const handleExportExcel = () => {
    PdfExcelService.exportAttendanceExcel(currentRecordsForReport);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#696cff]" /> Absensi & Presensi Siswa Harian
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Pencatatan status Kehadiran, Izin, Sakit, dan Alfa siswa</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Cetak PDF (Kop & Margin)
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Simpan Presensi
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Mata Pelajaran</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Kelas / Rombel</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Kelas {c.name} ({c.academicYear})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tanggal Presensi</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Counters & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase">Ringkasan:</span>
          <span className="text-xs font-bold bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full">
            Hadir: {countHadir}
          </span>
          <span className="text-xs font-bold bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full">
            Izin: {countIzin}
          </span>
          <span className="text-xs font-bold bg-cyan-500/10 text-cyan-600 px-3 py-1 rounded-full">
            Sakit: {countSakit}
          </span>
          <span className="text-xs font-bold bg-rose-500/10 text-rose-600 px-3 py-1 rounded-full">
            Alfa: {countAlfa}
          </span>
        </div>

        <button
          onClick={handleMarkAllHadir}
          className="px-3.5 py-1.5 rounded-xl bg-[#696cff]/10 text-[#696cff] hover:bg-[#696cff]/20 font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" /> Tandai Semua Hadir
        </button>
      </div>

      {/* Student List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 w-12 text-center">No</th>
                <th className="px-6 py-4">NIS & Nama Siswa</th>
                <th className="px-6 py-4 text-center">Status Kehadiran</th>
                <th className="px-6 py-4">Keterangan / Catatan Suratan Ortu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada siswa terdaftar di kelas ini.
                  </td>
                </tr>
              ) : (
                classStudents.map((std, idx) => {
                  const currentStatus = statusMap[std.id]?.status || 'Hadir';

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{std.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">NIS: {std.nis}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                          {(['Hadir', 'Izin', 'Sakit', 'Alfa'] as AttendanceStatus[]).map((st) => {
                            const isSelected = currentStatus === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(std.id, st)}
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                                  isSelected
                                    ? st === 'Hadir'
                                      ? 'bg-emerald-500 text-white shadow-xs'
                                      : st === 'Izin'
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : st === 'Sakit'
                                      ? 'bg-cyan-500 text-white shadow-xs'
                                      : 'bg-rose-500 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={statusMap[std.id]?.notes || ''}
                          onChange={(e) => handleNotesChange(std.id, e.target.value)}
                          placeholder="Contoh: Surat sakit dokter, acara keluarga..."
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
