import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PdfExcelService } from '../../services/pdfExcel';
import { Award, Save, FileSpreadsheet, Download } from 'lucide-react';

export const NilaiPage: React.FC = () => {
  const { user } = useAuth();
  const { subjects, classes, students, grades, systemSettings, saveGrade, activeAcademicYear, activePrincipal } = useData();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [semester, setSemester] = useState<'1' | '2'>(activeAcademicYear.semester || '1');
  const academicYear = activeAcademicYear.year || '2025/2026';

  React.useEffect(() => {
    if (activeAcademicYear?.semester) {
      setSemester(activeAcademicYear.semester);
    }
  }, [activeAcademicYear]);

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

  // Matrix state for inputs
  const classStudents = students.filter((s) => s.classId === selectedClassId);

  const [scores, setScores] = useState<
    Record<
      string,
      {
        assignmentScore: number;
        dailyScore: number;
        ptsScore: number;
        pasScore: number;
        notes: string;
      }
    >
  >({});

  // Sync initial grades when filter changes
  React.useEffect(() => {
    const initialScores: typeof scores = {};
    classStudents.forEach((std) => {
      const existing = grades.find(
        (g) =>
          g.studentId === std.id &&
          g.subjectId === selectedSubjectId &&
          g.semester === semester
      );
      initialScores[std.id] = {
        assignmentScore: existing?.assignmentScore ?? 80,
        dailyScore: existing?.dailyScore ?? 80,
        ptsScore: existing?.ptsScore ?? 80,
        pasScore: existing?.pasScore ?? 80,
        notes: existing?.notes ?? ''
      };
    });
    setScores(initialScores);
  }, [selectedSubjectId, selectedClassId, semester, grades]);

  const handleScoreChange = (
    studentId: string,
    field: 'assignmentScore' | 'dailyScore' | 'ptsScore' | 'pasScore' | 'notes',
    value: any
  ) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: field === 'notes' ? value : Math.min(100, Math.max(0, Number(value) || 0))
      }
    }));
  };

  const handleSaveAll = () => {
    classStudents.forEach((std) => {
      const sc = scores[std.id] || {
        assignmentScore: 80,
        dailyScore: 80,
        ptsScore: 80,
        pasScore: 80,
        notes: ''
      };

      saveGrade({
        studentId: std.id,
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        teacherId: user?.id || 'global_teacher',
        assignmentScore: sc.assignmentScore,
        dailyScore: sc.dailyScore,
        ptsScore: sc.ptsScore,
        pasScore: sc.pasScore,
        academicYear,
        semester,
        notes: sc.notes
      });
    });
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentClass = classes.find((c) => c.id === selectedClassId);

  const weights = systemSettings?.gradeWeights || { assignment: 20, daily: 30, pts: 25, pas: 25 };
  const preds = systemSettings?.predicateThresholds || { aMin: 88, bMin: 78, cMin: 68, kkmDefault: 75 };
  const totalWeight = (weights.assignment || 20) + (weights.daily || 30) + (weights.pts || 25) + (weights.pas || 25);
  const divisor = totalWeight > 0 ? totalWeight : 100;

  const activeGradesForReport = classStudents.map((std) => {
    const sc = scores[std.id] || { assignmentScore: 80, dailyScore: 80, ptsScore: 80, pasScore: 80, notes: '' };
    const rawScore = (sc.assignmentScore * (weights.assignment || 20) +
                      sc.dailyScore * (weights.daily || 30) +
                      sc.ptsScore * (weights.pts || 25) +
                      sc.pasScore * (weights.pas || 25)) / divisor;
    const finalScore = Math.round(rawScore);
    let predicate: 'A' | 'B' | 'C' | 'D' = 'D';
    if (finalScore >= (preds.aMin || 88)) predicate = 'A';
    else if (finalScore >= (preds.bMin || 78)) predicate = 'B';
    else if (finalScore >= (preds.cMin || 68)) predicate = 'C';

    return {
      id: `preview_${std.id}`,
      studentId: std.id,
      studentName: std.fullName,
      studentNis: std.nis,
      subjectId: selectedSubjectId,
      subjectName: currentSubject?.name,
      classId: selectedClassId,
      className: currentClass?.name,
      teacherId: user?.id || '',
      assignmentScore: sc.assignmentScore,
      dailyScore: sc.dailyScore,
      ptsScore: sc.ptsScore,
      pasScore: sc.pasScore,
      finalScore,
      predicate,
      notes: sc.notes,
      academicYear,
      semester,
      updatedAt: new Date().toISOString()
    };
  });

  const handleExportPdf = async () => {
    const subTitle = `Mapel: ${currentSubject?.name || '-'} | Kelas: ${currentClass?.name || '-'} | Semester ${semester} T.A. ${academicYear}`;
    await PdfExcelService.exportGradesPdf(activeGradesForReport, systemSettings, subTitle, user, activePrincipal);
  };

  const handleExportExcel = () => {
    const subTitle = `Mapel: ${currentSubject?.name || '-'} | Kelas: ${currentClass?.name || '-'}`;
    PdfExcelService.exportGradesExcel(activeGradesForReport, subTitle);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#696cff]" /> Penilaian & Rekap Nilai Siswa
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Input Tugas, Harian, PTS, PAS dengan kalkulasi Nilai Akhir & Predikat otomatis</p>
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
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-[#696cff] hover:bg-[#5f61e6] text-white font-bold text-xs shadow-md shadow-[#696cff]/20 transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Simpan Semua Nilai
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
          <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Semester & Tahun Ajaran (Otomatis)</label>
          <div className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between shadow-2xs">
            <span>Semester {activeAcademicYear.semester || '1'} ({activeAcademicYear.semester === '2' ? 'Genap' : 'Ganjil'})</span>
            <span className="text-[10px] bg-[#696cff]/10 text-[#696cff] font-extrabold px-2 py-0.5 rounded-md border border-[#696cff]/20">
              T.A. {activeAcademicYear.year || '2025/2026'}
            </span>
          </div>
        </div>
      </div>

      {/* Formula Info Banner */}
      <div className="p-3.5 rounded-2xl bg-[#696cff]/10 border border-[#696cff]/20 text-xs text-[#696cff] font-medium flex items-center justify-between">
        <span>
          💡 <strong>Rumus Otomatis:</strong> Nilai Akhir = (Tugas × {weights.assignment}%) + (Harian × {weights.daily}%) + (PTS × {weights.pts}%) + (PAS × {weights.pas}%)
        </span>
        <span className="font-bold hidden sm:inline">
          Predikat: A (≥{preds.aMin}) | B (≥{preds.bMin}) | C (≥{preds.cMin}) | D (&lt;{preds.cMin})
        </span>
      </div>

      {/* Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">NIS & Nama Siswa</th>
                <th className="px-3 py-3.5 w-24 text-center">Tugas ({weights.assignment}%)</th>
                <th className="px-3 py-3.5 w-24 text-center">Harian ({weights.daily}%)</th>
                <th className="px-3 py-3.5 w-24 text-center">PTS ({weights.pts}%)</th>
                <th className="px-3 py-3.5 w-24 text-center">PAS ({weights.pas}%)</th>
                <th className="px-3 py-3.5 w-28 text-center bg-[#696cff]/5 text-[#696cff]">Nilai Akhir</th>
                <th className="px-3 py-3.5 w-20 text-center">Predikat</th>
                <th className="px-4 py-3.5">Catatan Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400">
                    Tidak ada siswa terdaftar di kelas ini.
                  </td>
                </tr>
              ) : (
                classStudents.map((std, idx) => {
                  const sc = scores[std.id] || { assignmentScore: 80, dailyScore: 80, ptsScore: 80, pasScore: 80, notes: '' };
                  const rawScore = (sc.assignmentScore * (weights.assignment || 20) +
                                    sc.dailyScore * (weights.daily || 30) +
                                    sc.ptsScore * (weights.pts || 25) +
                                    sc.pasScore * (weights.pas || 25)) / divisor;
                  const finalScore = Math.round(rawScore);
                  let predicate: 'A' | 'B' | 'C' | 'D' = 'D';
                  if (finalScore >= (preds.aMin || 88)) predicate = 'A';
                  else if (finalScore >= (preds.bMin || 78)) predicate = 'B';
                  else if (finalScore >= (preds.cMin || 68)) predicate = 'C';

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{std.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">NIS: {std.nis}</p>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={sc.assignmentScore}
                          onChange={(e) => handleScoreChange(std.id, 'assignmentScore', e.target.value)}
                          className="w-16 text-center font-bold px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#696cff]"
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={sc.dailyScore}
                          onChange={(e) => handleScoreChange(std.id, 'dailyScore', e.target.value)}
                          className="w-16 text-center font-bold px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#696cff]"
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={sc.ptsScore}
                          onChange={(e) => handleScoreChange(std.id, 'ptsScore', e.target.value)}
                          className="w-16 text-center font-bold px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#696cff]"
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={sc.pasScore}
                          onChange={(e) => handleScoreChange(std.id, 'pasScore', e.target.value)}
                          className="w-16 text-center font-bold px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#696cff]"
                        />
                      </td>
                      <td className="px-2 py-3 text-center bg-[#696cff]/5">
                        <span className="font-black text-sm text-[#696cff]">{finalScore}</span>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-black text-xs ${
                          predicate === 'A'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : predicate === 'B'
                            ? 'bg-indigo-500/10 text-indigo-600'
                            : predicate === 'C'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}>
                          {predicate}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={sc.notes}
                          onChange={(e) => handleScoreChange(std.id, 'notes', e.target.value)}
                          placeholder="Catatan perkembangan..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
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
