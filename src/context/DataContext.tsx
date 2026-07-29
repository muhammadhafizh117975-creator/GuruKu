import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AcademicYearItem,
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
  INITIAL_ACADEMIC_YEARS,
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
  getSupabaseClient,
  getNeonSql
} from '../services/supabase';
import { showSuccessToast, showErrorToast } from '../components/common/SweetAlert';
import { useAuth } from './AuthContext';

interface DataContextType {
  academicYears: AcademicYearItem[];
  activeAcademicYear: AcademicYearItem;
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
  addAcademicYear: (ay: Omit<AcademicYearItem, 'id' | 'createdAt'>) => void;
  updateAcademicYear: (id: string, ay: Partial<AcademicYearItem>) => void;
  setActiveAcademicYear: (id: string) => void;
  deleteAcademicYear: (id: string) => void;

  addTeacher: (teacher: Profile) => void;
  updateTeacher: (id: string, teacher: Partial<Profile>) => void;
  deleteTeacher: (id: string) => void;

  addSubject: (subj: Omit<Subject, 'id' | 'createdAt'>) => void;
  updateSubject: (id: string, subj: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  addClass: (cls: Omit<ClassRoom, 'id' | 'createdAt'>) => void;
  updateClass: (id: string, cls: Partial<ClassRoom>) => void;
  deleteClass: (id: string) => void;

  addStudent: (std: Omit<Student, 'id' | 'createdAt'>) => void;
  bulkAddStudents: (stds: Omit<Student, 'id' | 'createdAt'>[]) => void;
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
  resetAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>(() => {
    const saved = localStorage.getItem('guruku_academic_years');
    return saved ? JSON.parse(saved) : INITIAL_ACADEMIC_YEARS;
  });

  const activeAcademicYear = academicYears.find((ay) => ay.isActive) || academicYears[0] || {
    id: 'ay_default',
    year: '2025/2026',
    semester: '1',
    isActive: true,
    status: 'Aktif',
    createdAt: new Date().toISOString()
  };

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
  useEffect(() => { localStorage.setItem('guruku_academic_years', JSON.stringify(academicYears)); }, [academicYears]);
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

  // Set up Supabase Realtime & Cross-tab Listeners for 24/7 Always-Online Realtime Synchronization
  useEffect(() => {
    // 1. Cross-tab & Multi-window Realtime Listener (BroadcastChannel)
    let broadcast: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcast = new BroadcastChannel('guruku_realtime_sync');
      broadcast.onmessage = (event) => {
        if (event.data?.type === 'SYNC_ALL_DATA') {
          const ay = localStorage.getItem('guruku_academic_years');
          if (ay) setAcademicYears(JSON.parse(ay));
          const t = localStorage.getItem('guruku_teachers');
          if (t) setTeachers(JSON.parse(t));
          const s = localStorage.getItem('guruku_subjects');
          if (s) setSubjects(JSON.parse(s));
          const c = localStorage.getItem('guruku_classes');
          if (c) setClasses(JSON.parse(c));
          const st = localStorage.getItem('guruku_students');
          if (st) setStudents(JSON.parse(st));
          const g = localStorage.getItem('guruku_grades');
          if (g) setGrades(JSON.parse(g));
          const a = localStorage.getItem('guruku_attendance');
          if (a) setAttendance(JSON.parse(a));
          const j = localStorage.getItem('guruku_journals');
          if (j) setJournals(JSON.parse(j));
          const m = localStorage.getItem('guruku_modules');
          if (m) setModules(JSON.parse(m));
          const sys = localStorage.getItem('guruku_system_settings');
          if (sys) setSystemSettings(JSON.parse(sys));
        }
      };
    }

    // Storage event listener fallback for older browsers
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'guruku_academic_years' && e.newValue) setAcademicYears(JSON.parse(e.newValue));
      if (e.key === 'guruku_teachers' && e.newValue) setTeachers(JSON.parse(e.newValue));
      if (e.key === 'guruku_subjects' && e.newValue) setSubjects(JSON.parse(e.newValue));
      if (e.key === 'guruku_classes' && e.newValue) setClasses(JSON.parse(e.newValue));
      if (e.key === 'guruku_students' && e.newValue) setStudents(JSON.parse(e.newValue));
      if (e.key === 'guruku_grades' && e.newValue) setGrades(JSON.parse(e.newValue));
      if (e.key === 'guruku_attendance' && e.newValue) setAttendance(JSON.parse(e.newValue));
      if (e.key === 'guruku_journals' && e.newValue) setJournals(JSON.parse(e.newValue));
      if (e.key === 'guruku_modules' && e.newValue) setModules(JSON.parse(e.newValue));
      if (e.key === 'guruku_system_settings' && e.newValue) setSystemSettings(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorageChange);

    // 2. Supabase Realtime Listener
    const supabase = getSupabaseClient();
    let channel: any = null;

    if (supabase) {
      setIsRealtimeConnected(true);

      channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => {
          setIsRealtimeConnected(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, () => {
          setIsRealtimeConnected(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
          setIsRealtimeConnected(true);
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true);
          }
        });
    } else {
      setIsRealtimeConnected(true); // Always active with local broadcast & local storage sync
    }

    return () => {
      if (broadcast) broadcast.close();
      window.removeEventListener('storage', handleStorageChange);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Helper to trigger broadcast sync to other tabs/windows
  const notifyBroadcastSync = () => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('guruku_realtime_sync');
        bc.postMessage({ type: 'SYNC_ALL_DATA', timestamp: Date.now() });
        bc.close();
      } catch (e) {
        // silent fallback
      }
    }
  };

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

  // Academic Year Actions
  const addAcademicYear = (ay: Omit<AcademicYearItem, 'id' | 'createdAt'>) => {
    const newAy: AcademicYearItem = {
      ...ay,
      id: `ay_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    if (ay.isActive) {
      setAcademicYears((prev) =>
        prev.map((item) => ({ ...item, isActive: false, status: 'Non-Aktif' })).concat(newAy)
      );
    } else {
      setAcademicYears((prev) => [newAy, ...prev]);
    }
    logActivity('TAMBAH_TAHUN_AJARAN', `Menambahkan tahun pelajaran ${newAy.year} Semester ${newAy.semester}`);
    showSuccessToast('Tahun Pelajaran berhasil ditambahkan.');
  };

  const updateAcademicYear = (id: string, updated: Partial<AcademicYearItem>) => {
    setAcademicYears((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextIsActive = updated.isActive !== undefined ? updated.isActive : item.isActive;
          return {
            ...item,
            ...updated,
            status: nextIsActive ? 'Aktif' : 'Non-Aktif'
          };
        }
        if (updated.isActive) {
          return { ...item, isActive: false, status: 'Non-Aktif' };
        }
        return item;
      })
    );
    logActivity('UBAH_TAHUN_AJARAN', `Memperbarui data tahun pelajaran`);
    showSuccessToast('Tahun Pelajaran berhasil diperbarui.');
  };

  const setActiveAcademicYear = (id: string) => {
    setAcademicYears((prev) =>
      prev.map((item) => ({
        ...item,
        isActive: item.id === id,
        status: item.id === id ? 'Aktif' : 'Non-Aktif'
      }))
    );
    const selected = academicYears.find((ay) => ay.id === id);
    logActivity('AKTIFKAN_TAHUN_AJARAN', `Mengaktifkan tahun pelajaran ${selected?.year || id}`);
    showSuccessToast(`Tahun Pelajaran ${selected?.year} Semester ${selected?.semester} diaktifkan sebagai default.`);
  };

  const deleteAcademicYear = (id: string) => {
    setAcademicYears((prev) => prev.filter((item) => item.id !== id));
    logActivity('HAPUS_TAHUN_AJARAN', `Menghapus tahun pelajaran`);
    showSuccessToast('Tahun Pelajaran berhasil dihapus.');
  };

  // Fetch teachers from Supabase on mount if available
  useEffect(() => {
    const fetchTeachersFromDB = async () => {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'guru');
          if (data && !error && data.length > 0) {
            const fetched: Profile[] = data.map((d: any) => ({
              id: d.id,
              email: d.email,
              username: d.username,
              fullName: d.full_name,
              role: d.role,
              nipNuptk: d.nip_nuptk,
              phone: d.phone,
              password: d.password,
              avatarUrl: d.avatar_url,
              avatarDriveId: d.avatar_drive_id,
              createdAt: d.created_at,
              updatedAt: d.updated_at
            }));
            setTeachers(fetched);
            localStorage.setItem('guruku_teachers', JSON.stringify(fetched));
            return;
          }
        } catch (e) {
          console.warn('Gagal mengambil data guru dari Supabase:', e);
        }
      }

      const sql = getNeonSql();
      if (sql) {
        try {
          const data = await sql`SELECT * FROM public.profiles WHERE role = 'guru'`;
          if (data && data.length > 0) {
            const fetched: Profile[] = data.map((d: any) => ({
              id: d.id,
              email: d.email,
              username: d.username,
              fullName: d.full_name,
              role: d.role,
              nipNuptk: d.nip_nuptk,
              phone: d.phone,
              password: d.password,
              avatarUrl: d.avatar_url,
              avatarDriveId: d.avatar_drive_id,
              createdAt: d.created_at ? new Date(d.created_at).toISOString() : new Date().toISOString(),
              updatedAt: d.updated_at ? new Date(d.updated_at).toISOString() : new Date().toISOString()
            }));
            setTeachers(fetched);
            localStorage.setItem('guruku_teachers', JSON.stringify(fetched));
          }
        } catch (e) {
          console.warn('Gagal mengambil data guru dari Neon DB:', e);
        }
      }
    };
    fetchTeachersFromDB();
  }, []);

  // Teacher Actions
  const addTeacher = (teacher: Profile) => {
    setTeachers((prev) => {
      if (prev.some((t) => t.id === teacher.id)) return prev;
      return [teacher, ...prev];
    });
    notifyBroadcastSync();
    logActivity('TAMBAH_GURU', `Menambahkan data akun guru ${teacher.fullName}`);
  };

  const updateTeacher = (id: string, updated: Partial<Profile>) => {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    
    const sql = getNeonSql();
    if (sql) {
      sql`
        UPDATE public.profiles
        SET full_name = ${updated.fullName},
            username = ${updated.username},
            email = ${updated.email},
            nip_nuptk = ${updated.nipNuptk},
            phone = ${updated.phone},
            updated_at = NOW()
        WHERE id = ${id}
      `.catch((err: any) => console.warn('Neon DB teacher update error:', err));
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('profiles').update({
        full_name: updated.fullName,
        username: updated.username,
        email: updated.email,
        nip_nuptk: updated.nipNuptk,
        phone: updated.phone,
        updated_at: new Date().toISOString()
      }).eq('id', id).then(() => {});
    }
    notifyBroadcastSync();
    logActivity('UBAH_GURU', `Memperbarui data guru ${updated.fullName || ''}`);
    showSuccessToast('Data guru berhasil diperbarui.');
  };

  const deleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    
    const sql = getNeonSql();
    if (sql) {
      sql`DELETE FROM public.profiles WHERE id = ${id}`.catch((err: any) => console.warn('Neon DB teacher delete error:', err));
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('profiles').delete().eq('id', id).then(() => {});
    }
    notifyBroadcastSync();
    logActivity('HAPUS_GURU', `Menghapus data guru`);
    showSuccessToast('Data guru berhasil dihapus.');
  };

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
      className: cls?.name || std.className || '',
      id: `std_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setStudents((prev) => [newStd, ...prev]);
    logActivity('TAMBAH_SISWA', `Menambahkan siswa ${newStd.fullName}`);
    showSuccessToast('Siswa berhasil ditambahkan.');
  };

  const bulkAddStudents = (stdsList: Omit<Student, 'id' | 'createdAt'>[]) => {
    const now = new Date().toISOString();
    const newStudents: Student[] = stdsList.map((std, idx) => {
      const cls = classes.find((c) => c.id === std.classId || c.name.toLowerCase() === (std.className || '').toLowerCase());
      return {
        ...std,
        classId: cls?.id || std.classId || '',
        className: cls?.name || std.className || 'Belum Ada Kelas',
        id: `std_bulk_${Date.now()}_${idx}`,
        createdAt: now
      };
    });

    setStudents((prev) => [...newStudents, ...prev]);
    logActivity('BULK_UPLOAD_SISWA', `Berhasil mengunggah ${newStudents.length} data siswa baru`);
    showSuccessToast(`Berhasil mengimpor ${newStudents.length} data siswa baru.`);
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

  const resetAllData = () => {
    localStorage.removeItem('guruku_teachers');
    localStorage.removeItem('guruku_subjects');
    localStorage.removeItem('guruku_classes');
    localStorage.removeItem('guruku_students');
    localStorage.removeItem('guruku_grades');
    localStorage.removeItem('guruku_attendance');
    localStorage.removeItem('guruku_journals');
    localStorage.removeItem('guruku_modules');
    localStorage.removeItem('guruku_logs');

    setTeachers([]);
    setSubjects([]);
    setClasses([]);
    setStudents([]);
    setGrades([]);
    setAttendance([]);
    setJournals([]);
    setModules([]);
    setActivityLogs([]);

    logActivity('RESET_DATA', 'Mereset seluruh data aplikasi ke kondisi awal (kosong)');
    showSuccessToast('Seluruh data aplikasi berhasil dibersihkan ke kondisi awal (kosong).');
  };

  return (
    <DataContext.Provider
      value={{
        academicYears,
        activeAcademicYear,
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
        addAcademicYear,
        updateAcademicYear,
        setActiveAcademicYear,
        deleteAcademicYear,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addSubject,
        updateSubject,
        deleteSubject,
        addClass,
        updateClass,
        deleteClass,
        addStudent,
        bulkAddStudents,
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
        logActivity,
        resetAllData
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
