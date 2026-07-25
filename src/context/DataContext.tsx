import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Profile,
  Subject,
  ClassRoom,
  Student,
  Grade,
  Attendance,
  TeachingJournal,
  TeachingModule,
  SystemSettings,
  ActivityLog
} from '../types';
import {
  INITIAL_PROFILES,
  INITIAL_SUBJECTS,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_GRADES,
  INITIAL_ATTENDANCE,
  INITIAL_JOURNALS,
  INITIAL_MODULES,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_ACTIVITY_LOGS,
  getSupabaseClient
} from '../services/supabase';
import { showSuccessToast, showErrorToast } from '../components/common/SweetAlert';
import { useAuth } from './AuthContext';

interface DataContextType {
  teachers: Profile[];
  subjects: Subject[];
  classes: ClassRoom[];
  students: Student[];
  grades: Grade[];
  attendance: Attendance[];
  journals: TeachingJournal[];
  modules: TeachingModule[];
  systemSettings: SystemSettings;
  activityLogs: ActivityLog[];
  isRealtimeConnected: boolean;

  // Actions
  addSubject: (subj: Omit<Subject, 'id' | 'createdAt'>) => void;
  updateSubject: (id: string, subj: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  addClass: (cls: Omit<ClassRoom, 'id' | 'createdAt'>) => void;
  updateClass: (id: string, cls: Partial<ClassRoom>) => void;
  deleteClass: (id: string) => void;

  addStudent: (std: Omit<Student, 'id' | 'createdAt'>) => void;
  updateStudent: (id: string, std: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  saveGrade: (gradeData: Omit<Grade, 'id' | 'finalScore' | 'predicate' | 'updatedAt'>) => void;
  deleteGrade: (id: string) => void;

  saveAttendanceBatch: (records: Omit<Attendance, 'id' | 'createdAt'>[]) => void;

  addJournal: (journal: Omit<TeachingJournal, 'id' | 'createdAt'>) => void;
  deleteJournal: (id: string) => void;

  addModule: (mod: Omit<TeachingModule, 'id' | 'createdAt'>) => void;
  deleteModule: (id: string) => void;

  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  logActivity: (action: string, details: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('guruku_teachers');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES.filter((p) => p.role === 'guru');
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('guruku_subjects');
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    const saved = localStorage.getItem('guruku_classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('guruku_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [grades, setGrades] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('guruku_grades');
    return saved ? JSON.parse(saved) : INITIAL_GRADES;
  });

  const [attendance, setAttendance] = useState<Attendance[]>(() => {
    const saved = localStorage.getItem('guruku_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [journals, setJournals] = useState<TeachingJournal[]>(() => {
    const saved = localStorage.getItem('guruku_journals');
    return saved ? JSON.parse(saved) : INITIAL_JOURNALS;
  });

  const [modules, setModules] = useState<TeachingModule[]>(() => {
    const saved = localStorage.getItem('guruku_modules');
    return saved ? JSON.parse(saved) : INITIAL_MODULES;
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('guruku_system_settings');
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_SETTINGS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('guruku_logs');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('guruku_teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('guruku_subjects', JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem('guruku_classes', JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem('guruku_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('guruku_grades', JSON.stringify(grades)); }, [grades]);
  useEffect(() => { localStorage.setItem('guruku_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('guruku_journals', JSON.stringify(journals)); }, [journals]);
  useEffect(() => { localStorage.setItem('guruku_modules', JSON.stringify(modules)); }, [modules]);
  useEffect(() => { localStorage.setItem('guruku_system_settings', JSON.stringify(systemSettings)); }, [systemSettings]);
  useEffect(() => { localStorage.setItem('guruku_logs', JSON.stringify(activityLogs)); }, [activityLogs]);

  // Set up Supabase Realtime Listeners if connected
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsRealtimeConnected(false);
      return;
    }

    setIsRealtimeConnected(true);

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => {
        // Handle realtime change
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, () => {
        // Handle realtime change
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        // Handle realtime change
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const logActivity = useCallback((action: string, details: string) => {
    if (!user) return;
    const newLog: ActivityLog = {
      id: `act_${Date.now()}`,
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, [user]);

  // Actions
  const addSubject = (subj: Omit<Subject, 'id' | 'createdAt'>) => {
    const newSubj: Subject = {
      ...subj,
      id: `subj_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setSubjects((prev) => [newSubj, ...prev]);
    logActivity('TAMBAH_MATA_PELAJARAN', `Menambahkan mata pelajaran ${newSubj.name}`);
    showSuccessToast('Mata Pelajaran berhasil ditambahkan.');
  };

  const updateSubject = (id: string, updated: Partial<Subject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    logActivity('UBAH_MATA_PELAJARAN', `Memperbarui data mata pelajaran`);
    showSuccessToast('Mata Pelajaran berhasil diperbarui.');
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    logActivity('HAPUS_MATA_PELAJARAN', `Menghapus mata pelajaran`);
    showSuccessToast('Mata Pelajaran berhasil dihapus.');
  };

  const addClass = (cls: Omit<ClassRoom, 'id' | 'createdAt'>) => {
    const newCls: ClassRoom = {
      ...cls,
      id: `class_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setClasses((prev) => [newCls, ...prev]);
    logActivity('TAMBAH_KELAS', `Menambahkan kelas ${newCls.name}`);
    showSuccessToast('Kelas berhasil ditambahkan.');
  };

  const updateClass = (id: string, updated: Partial<ClassRoom>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    logActivity('UBAH_KELAS', `Memperbarui data kelas`);
    showSuccessToast('Kelas berhasil diperbarui.');
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    logActivity('HAPUS_KELAS', `Menghapus kelas`);
    showSuccessToast('Kelas berhasil dihapus.');
  };

  const addStudent = (std: Omit<Student, 'id' | 'createdAt'>) => {
    const cls = classes.find((c) => c.id === std.classId);
    const newStd: Student = {
      ...std,
      className: cls?.name || '',
      id: `std_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setStudents((prev) => [newStd, ...prev]);
    logActivity('TAMBAH_SISWA', `Menambahkan siswa ${newStd.fullName}`);
    showSuccessToast('Siswa berhasil ditambahkan.');
  };

  const updateStudent = (id: string, updated: Partial<Student>) => {
    const cls = updated.classId ? classes.find((c) => c.id === updated.classId) : null;
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              ...updated,
              className: cls ? cls.name : s.className
            }
          : s
      )
    );
    logActivity('UBAH_SISWA', `Memperbarui data siswa`);
    showSuccessToast('Data siswa berhasil diperbarui.');
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    logActivity('HAPUS_SISWA', `Menghapus siswa`);
    showSuccessToast('Data siswa berhasil dihapus.');
  };

  const calculateGradeDetails = (tugas: number, harian: number, pts: number, pas: number) => {
    const finalScore = Math.round(tugas * 0.2 + harian * 0.3 + pts * 0.25 + pas * 0.25);
    let predicate: 'A' | 'B' | 'C' | 'D' = 'D';
    if (finalScore >= 88) predicate = 'A';
    else if (finalScore >= 78) predicate = 'B';
    else if (finalScore >= 68) predicate = 'C';
    else predicate = 'D';

    return { finalScore, predicate };
  };

  const saveGrade = (gradeData: Omit<Grade, 'id' | 'finalScore' | 'predicate' | 'updatedAt'>) => {
    const { finalScore, predicate } = calculateGradeDetails(
      gradeData.assignmentScore,
      gradeData.dailyScore,
      gradeData.ptsScore,
      gradeData.pasScore
    );

    const student = students.find((s) => s.id === gradeData.studentId);
    const subject = subjects.find((s) => s.id === gradeData.subjectId);
    const cls = classes.find((c) => c.id === gradeData.classId);

    const existingIndex = grades.findIndex(
      (g) =>
        g.studentId === gradeData.studentId &&
        g.subjectId === gradeData.subjectId &&
        g.semester === gradeData.semester
    );

    const fullGrade: Grade = {
      ...gradeData,
      id: existingIndex >= 0 ? grades[existingIndex].id : `grd_${Date.now()}`,
      studentName: student?.fullName || gradeData.studentName,
      studentNis: student?.nis || gradeData.studentNis,
      subjectName: subject?.name || gradeData.subjectName,
      className: cls?.name || gradeData.className,
      finalScore,
      predicate,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      setGrades((prev) => prev.map((g, idx) => (idx === existingIndex ? fullGrade : g)));
    } else {
      setGrades((prev) => [fullGrade, ...prev]);
    }

    logActivity('INPUT_NILAI', `Menyimpan nilai ${fullGrade.studentName} (${fullGrade.subjectName})`);
    showSuccessToast('Nilai siswa berhasil disimpan.');
  };

  const deleteGrade = (id: string) => {
    setGrades((prev) => prev.filter((g) => g.id !== id));
    logActivity('HAPUS_NILAI', `Menghapus rekaman nilai`);
    showSuccessToast('Nilai berhasil dihapus.');
  };

  const saveAttendanceBatch = (records: Omit<Attendance, 'id' | 'createdAt'>[]) => {
    const newRecords: Attendance[] = records.map((r, index) => {
      const student = students.find((s) => s.id === r.studentId);
      return {
        ...r,
        id: `att_${Date.now()}_${index}`,
        studentName: student?.fullName,
        studentNis: student?.nis,
        createdAt: new Date().toISOString()
      };
    });

    setAttendance((prev) => [...newRecords, ...prev]);
    logActivity('INPUT_ABSENSI', `Memproses absensi untuk ${records.length} siswa`);
    showSuccessToast(`Berhasil menyimpan absensi ${records.length} siswa.`);
  };

  const addJournal = (journal: Omit<TeachingJournal, 'id' | 'createdAt'>) => {
    const subject = subjects.find((s) => s.id === journal.subjectId);
    const cls = classes.find((c) => c.id === journal.classId);

    const newJrn: TeachingJournal = {
      ...journal,
      id: `jrn_${Date.now()}`,
      subjectName: subject?.name,
      className: cls?.name,
      createdAt: new Date().toISOString()
    };

    setJournals((prev) => [newJrn, ...prev]);
    logActivity('TAMBAH_JURNAL', `Menambahkan jurnal mengajar ${newJrn.topic}`);
    showSuccessToast('Jurnal mengajar berhasil disimpan.');
  };

  const deleteJournal = (id: string) => {
    setJournals((prev) => prev.filter((j) => j.id !== id));
    logActivity('HAPUS_JURNAL', `Menghapus jurnal mengajar`);
    showSuccessToast('Jurnal mengajar berhasil dihapus.');
  };

  const addModule = (mod: Omit<TeachingModule, 'id' | 'createdAt'>) => {
    const subject = subjects.find((s) => s.id === mod.subjectId);
    const newMod: TeachingModule = {
      ...mod,
      id: `mod_${Date.now()}`,
      subjectName: subject?.name,
      createdAt: new Date().toISOString()
    };

    setModules((prev) => [newMod, ...prev]);
    logActivity('UPLOAD_MODUL', `Mengunggah arsip modul/RPP ${newMod.title}`);
    showSuccessToast('Arsip Modul Ajar/RPP berhasil diunggah.');
  };

  const deleteModule = (id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
    logActivity('HAPUS_MODUL', `Menghapus arsip modul/RPP`);
    showSuccessToast('Arsip Modul Ajar/RPP dihapus.');
  };

  const updateSystemSettings = (updated: Partial<SystemSettings>) => {
    setSystemSettings((prev) => ({
      ...prev,
      ...updated,
      updatedAt: new Date().toISOString()
    }));
    logActivity('PENGATURAN_SISTEM', 'Memperbarui Pengaturan Margin Kertas & Kop Surat');
    showSuccessToast('Pengaturan sistem berhasil diperbarui.');
  };

  return (
    <DataContext.Provider
      value={{
        teachers,
        subjects,
        classes,
        students,
        grades,
        attendance,
        journals,
        modules,
        systemSettings,
        activityLogs,
        isRealtimeConnected,
        addSubject,
        updateSubject,
        deleteSubject,
        addClass,
        updateClass,
        deleteClass,
        addStudent,
        updateStudent,
        deleteStudent,
        saveGrade,
        deleteGrade,
        saveAttendanceBatch,
        addJournal,
        deleteJournal,
        addModule,
        deleteModule,
        updateSystemSettings,
        logActivity
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
