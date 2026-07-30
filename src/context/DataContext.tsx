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
  INITIAL_SYSTEM_SETTINGS,
  getSupabaseClient
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

  // State initialized purely from memory (No LocalStorage persistence)
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>(INITIAL_ACADEMIC_YEARS);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [journals, setJournals] = useState<TeachingJournal[]>([]);
  const [modules, setModules] = useState<TeachingModule[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);

  const activeAcademicYear = academicYears.find((ay) => ay.isActive) || academicYears[0] || {
    id: 'ay_default',
    year: '2025/2026',
    semester: '1',
    isActive: true,
    status: 'Aktif',
    createdAt: new Date().toISOString()
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

  // Primary Database Re-Fetch Function (Single Source of Truth)
  const loadDataFromSupabase = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      console.log('[Supabase DB Sync] Fetching full database state...');

      // 1. System Settings & Academic Years
      const { data: sysData, error: sysErr } = await client.from('system_settings').select('*');
      if (!sysErr && sysData) {
        const cfgRow = sysData.find((r: any) => r.key === 'main_config');
        if (cfgRow && cfgRow.value) {
          setSystemSettings(cfgRow.value);
        }
        const ayRow = sysData.find((r: any) => r.key === 'academic_years');
        if (ayRow && Array.isArray(ayRow.value) && ayRow.value.length > 0) {
          setAcademicYears(ayRow.value);
        }
      }

      // 2. Profiles (Guru)
      const { data: profs, error: profErr } = await client.from('profiles').select('*');
      let fetchedTeachers: Profile[] = [];
      if (!profErr && profs) {
        fetchedTeachers = profs
          .filter((p: any) => p.role === 'guru')
          .map((p: any) => ({
            id: p.id,
            email: p.email,
            username: p.username,
            password: p.password,
            fullName: p.full_name,
            role: p.role,
            nipNuptk: p.nip_nuptk,
            phone: p.phone,
            avatarUrl: p.avatar_url,
            avatarDriveId: p.avatar_drive_id,
            createdAt: p.created_at,
            updatedAt: p.updated_at
          }));
        setTeachers(fetchedTeachers);
      }

      // 3. Classes
      const { data: clsData, error: clsErr } = await client.from('classes').select('*');
      let fetchedClasses: ClassRoom[] = [];
      if (!clsErr && clsData) {
        fetchedClasses = clsData.map((c: any) => ({
          id: c.id,
          name: c.name,
          gradeLevel: c.grade_level,
          academicYear: c.academic_year,
          homeroomTeacherId: c.homeroom_teacher_id,
          createdAt: c.created_at
        }));
        setClasses(fetchedClasses);
      }

      // 4. Subjects
      const { data: sbjData, error: sbjErr } = await client.from('subjects').select('*');
      let fetchedSubjects: Subject[] = [];
      if (!sbjErr && sbjData) {
        fetchedSubjects = sbjData.map((s: any) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          description: s.description,
          teacherIds: s.teacher_ids || [],
          createdAt: s.created_at
        }));
        setSubjects(fetchedSubjects);
      }

      // 5. Students
      const { data: stdData, error: stdErr } = await client.from('students').select('*');
      let fetchedStudents: Student[] = [];
      if (!stdErr && stdData) {
        fetchedStudents = stdData.map((s: any) => {
          const cls = fetchedClasses.find((c) => c.id === s.class_id);
          return {
            id: s.id,
            nis: s.nis,
            fullName: s.full_name,
            gender: s.gender,
            birthPlace: s.birth_place,
            birthDate: s.birth_date,
            address: s.address,
            parentPhone: s.parent_phone,
            classId: s.class_id || '',
            className: cls ? cls.name : 'Belum Ada Kelas',
            createdAt: s.created_at
          };
        });
        setStudents(fetchedStudents);
      }

      // 6. Grades
      const { data: grdData, error: grdErr } = await client.from('grades').select('*');
      if (!grdErr && grdData) {
        const fetchedGrades: Grade[] = grdData.map((g: any) => {
          const student = fetchedStudents.find((s) => s.id === g.student_id);
          const subject = fetchedSubjects.find((s) => s.id === g.subject_id);
          const cls = fetchedClasses.find((c) => c.id === g.class_id);
          return {
            id: g.id,
            studentId: g.student_id,
            studentName: student?.fullName || 'Siswa',
            studentNis: student?.nis || '',
            subjectId: g.subject_id,
            subjectName: subject?.name || 'Mata Pelajaran',
            classId: g.class_id,
            className: cls?.name || 'Kelas',
            teacherId: g.teacher_id,
            assignmentScore: Number(g.assignment_score || 0),
            dailyScore: Number(g.daily_score || 0),
            ptsScore: Number(g.pts_score || 0),
            pasScore: Number(g.pas_score || 0),
            finalScore: Number(g.final_score || 0),
            predicate: g.predicate || 'D',
            notes: g.notes || '',
            academicYear: g.academic_year,
            semester: g.semester,
            updatedAt: g.updated_at
          };
        });
        setGrades(fetchedGrades);
      }

      // 7. Attendance
      const { data: attData, error: attErr } = await client.from('attendance').select('*');
      if (!attErr && attData) {
        const fetchedAttendance: Attendance[] = attData.map((a: any) => {
          const student = fetchedStudents.find((s) => s.id === a.student_id);
          return {
            id: a.id,
            date: a.date,
            studentId: a.student_id,
            studentName: student?.fullName,
            studentNis: student?.nis,
            classId: a.class_id,
            subjectId: a.subject_id,
            teacherId: a.teacher_id,
            status: a.status,
            notes: a.notes,
            createdAt: a.created_at
          };
        });
        setAttendance(fetchedAttendance);
      }

      // 8. Teaching Journals
      const { data: jrnData, error: jrnErr } = await client.from('teaching_journals').select('*');
      if (!jrnErr && jrnData) {
        const fetchedJournals: TeachingJournal[] = jrnData.map((j: any) => {
          const subject = fetchedSubjects.find((s) => s.id === j.subject_id);
          const cls = fetchedClasses.find((c) => c.id === j.class_id);
          return {
            id: j.id,
            date: j.date,
            subjectId: j.subject_id,
            subjectName: subject?.name,
            classId: j.class_id,
            className: cls?.name,
            teacherId: j.teacher_id,
            timeSlot: j.time_slot,
            topic: j.topic,
            method: j.method,
            attendeeCount: j.attendee_count,
            notes: j.notes,
            attachmentName: j.attachment_name,
            attachmentDriveId: j.attachment_drive_id,
            attachmentWebViewLink: j.attachment_web_view_link,
            attachmentWebContentLink: j.attachment_web_content_link,
            createdAt: j.created_at
          };
        });
        setJournals(fetchedJournals);
      }

      // 9. Teaching Modules
      const { data: modData, error: modErr } = await client.from('teaching_modules').select('*');
      if (!modErr && modData) {
        const fetchedModules: TeachingModule[] = modData.map((m: any) => {
          const subject = fetchedSubjects.find((s) => s.id === m.subject_id);
          return {
            id: m.id,
            title: m.title,
            subjectId: m.subject_id,
            subjectName: subject?.name,
            classLevel: m.class_level,
            semester: m.semester,
            academicYear: m.academic_year,
            description: m.description,
            fileType: m.file_type,
            fileName: m.file_name,
            fileSize: m.file_size,
            fileDriveId: m.file_drive_id,
            webViewLink: m.web_view_link,
            webContentLink: m.web_content_link,
            teacherId: m.teacher_id,
            createdAt: m.created_at
          };
        });
        setModules(fetchedModules);
      }
    } catch (err) {
      console.warn('[Supabase DB Sync Error] Failed to load data:', err);
    }
  }, []);

  // Initialize Data Fetch and Realtime Subscriptions on Mount
  useEffect(() => {
    const supabase = getSupabaseClient();
    let channel: any = null;

    if (supabase) {
      setIsRealtimeConnected(true);
      loadDataFromSupabase();

      channel = supabase
        .channel('public-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload: any) => {
          console.log('[Supabase DB Realtime] Table change detected:', payload.table, payload.eventType);
          loadDataFromSupabase();
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true);
          }
        });
    } else {
      setIsRealtimeConnected(false);
    }

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadDataFromSupabase]);

  // Academic Year Actions
  const saveAcademicYearsToSupabase = async (newYears: AcademicYearItem[]) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('system_settings').upsert({
        key: 'academic_years',
        value: newYears,
        updated_at: new Date().toISOString()
      });
      await loadDataFromSupabase();
    }
  };

  const addAcademicYear = async (ay: Omit<AcademicYearItem, 'id' | 'createdAt'>) => {
    const newAy: AcademicYearItem = {
      ...ay,
      id: `ay_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    let nextAy: AcademicYearItem[];
    if (ay.isActive) {
      nextAy = academicYears.map((item) => ({ ...item, isActive: false, status: 'Non-Aktif' })).concat(newAy);
    } else {
      nextAy = [newAy, ...academicYears];
    }
    setAcademicYears(nextAy);
    await saveAcademicYearsToSupabase(nextAy);
    logActivity('TAMBAH_TAHUN_AJARAN', `Menambahkan tahun pelajaran ${newAy.year} Semester ${newAy.semester}`);
    showSuccessToast('Tahun Pelajaran berhasil ditambahkan.');
  };

  const updateAcademicYear = async (id: string, updated: Partial<AcademicYearItem>) => {
    const nextAy = academicYears.map((item) => {
      if (item.id === id) {
        const nextIsActive = updated.isActive !== undefined ? updated.isActive : item.isActive;
        return { ...item, ...updated, status: nextIsActive ? 'Aktif' : 'Non-Aktif' };
      }
      if (updated.isActive) {
        return { ...item, isActive: false, status: 'Non-Aktif' };
      }
      return item;
    });
    setAcademicYears(nextAy);
    await saveAcademicYearsToSupabase(nextAy);
    logActivity('UBAH_TAHUN_AJARAN', `Memperbarui data tahun pelajaran`);
    showSuccessToast('Tahun Pelajaran berhasil diperbarui.');
  };

  const setActiveAcademicYear = async (id: string) => {
    const nextAy = academicYears.map((item) => ({
      ...item,
      isActive: item.id === id,
      status: item.id === id ? 'Aktif' : 'Non-Aktif'
    }));
    setAcademicYears(nextAy);
    await saveAcademicYearsToSupabase(nextAy);
    const selected = academicYears.find((ay) => ay.id === id);
    logActivity('AKTIFKAN_TAHUN_AJARAN', `Mengaktifkan tahun pelajaran ${selected?.year || id}`);
    showSuccessToast(`Tahun Pelajaran ${selected?.year} Semester ${selected?.semester} diaktifkan.`);
  };

  const deleteAcademicYear = async (id: string) => {
    const nextAy = academicYears.filter((item) => item.id !== id);
    setAcademicYears(nextAy);
    await saveAcademicYearsToSupabase(nextAy);
    logActivity('HAPUS_TAHUN_AJARAN', `Menghapus tahun pelajaran`);
    showSuccessToast('Tahun Pelajaran berhasil dihapus.');
  };

  // Teacher Actions
  const addTeacher = async (teacher: Profile) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Adding teacher to profiles:', teacher.fullName);
      const { error } = await supabase.from('profiles').insert([{
        id: teacher.id || `user_guru_${Date.now()}`,
        email: teacher.email,
        username: teacher.username,
        password: teacher.password || 'Gk-123456',
        full_name: teacher.fullName,
        role: teacher.role || 'guru',
        nip_nuptk: teacher.nipNuptk,
        phone: teacher.phone,
        avatar_url: teacher.avatarUrl,
        created_at: teacher.createdAt || new Date().toISOString(),
        updated_at: teacher.updatedAt || new Date().toISOString()
      }]);
      if (error) {
        console.error('[Supabase DB Error] Insert teacher failed:', error);
        showErrorToast(`Gagal menyimpan data guru: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('TAMBAH_GURU', `Menambahkan akun guru ${teacher.fullName}`);
        showSuccessToast('Data guru berhasil ditambahkan.');
      }
    }
  };

  const updateTeacher = async (id: string, updated: Partial<Profile>) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Updating teacher profile:', id);
      const { error } = await supabase.from('profiles').update({
        full_name: updated.fullName,
        username: updated.username,
        email: updated.email,
        nip_nuptk: updated.nipNuptk,
        phone: updated.phone,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Update teacher failed:', error);
        showErrorToast(`Gagal memperbarui data guru: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('UBAH_GURU', `Memperbarui data guru ${updated.fullName || ''}`);
        showSuccessToast('Data guru berhasil diperbarui.');
      }
    }
  };

  const deleteTeacher = async (id: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Deleting teacher profile:', id);
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete teacher failed:', error);
        showErrorToast(`Gagal menghapus data guru: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('HAPUS_GURU', `Menghapus data guru`);
        showSuccessToast('Data guru berhasil dihapus.');
      }
    }
  };

  // Subject Actions
  const addSubject = async (subj: Omit<Subject, 'id' | 'createdAt'>) => {
    const supabase = getSupabaseClient();
    const newSubjId = `subj_${Date.now()}`;
    if (supabase) {
      console.log('[Supabase DB] Adding subject:', subj.name);
      const { error } = await supabase.from('subjects').insert([{
        id: newSubjId,
        code: subj.code,
        name: subj.name,
        description: subj.description || '',
        teacher_ids: subj.teacherIds || [],
        created_at: new Date().toISOString()
      }]);
      if (error) {
        console.error('[Supabase DB Error] Insert subject failed:', error);
        showErrorToast(`Gagal menambah mata pelajaran: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('TAMBAH_MATA_PELAJARAN', `Menambahkan mata pelajaran ${subj.name}`);
        showSuccessToast('Mata Pelajaran berhasil ditambahkan.');
      }
    }
  };

  const updateSubject = async (id: string, updated: Partial<Subject>) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Updating subject:', id);
      const payload: any = {};
      if (updated.code) payload.code = updated.code;
      if (updated.name) payload.name = updated.name;
      if (updated.description !== undefined) payload.description = updated.description;
      if (updated.teacherIds) payload.teacher_ids = updated.teacherIds;

      const { error } = await supabase.from('subjects').update(payload).eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Update subject failed:', error);
        showErrorToast(`Gagal memperbarui mata pelajaran: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('UBAH_MATA_PELAJARAN', `Memperbarui data mata pelajaran`);
        showSuccessToast('Mata Pelajaran berhasil diperbarui.');
      }
    }
  };

  const deleteSubject = async (id: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Deleting subject:', id);
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete subject failed:', error);
        showErrorToast(`Gagal menghapus mata pelajaran: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('HAPUS_MATA_PELAJARAN', `Menghapus mata pelajaran`);
        showSuccessToast('Mata Pelajaran berhasil dihapus.');
      }
    }
  };

  // Class Actions
  const addClass = async (cls: Omit<ClassRoom, 'id' | 'createdAt'>) => {
    const supabase = getSupabaseClient();
    const newClassId = `class_${Date.now()}`;
    if (supabase) {
      console.log('[Supabase DB] Adding class:', cls.name);
      const { error } = await supabase.from('classes').insert([{
        id: newClassId,
        name: cls.name,
        grade_level: cls.gradeLevel,
        academic_year: cls.academicYear,
        homeroom_teacher_id: cls.homeroomTeacherId || null,
        created_at: new Date().toISOString()
      }]);
      if (error) {
        console.error('[Supabase DB Error] Insert class failed:', error);
        showErrorToast(`Gagal menambah kelas: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('TAMBAH_KELAS', `Menambahkan kelas ${cls.name}`);
        showSuccessToast('Kelas berhasil ditambahkan.');
      }
    }
  };

  const updateClass = async (id: string, updated: Partial<ClassRoom>) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Updating class:', id);
      const payload: any = {};
      if (updated.name) payload.name = updated.name;
      if (updated.gradeLevel) payload.grade_level = updated.gradeLevel;
      if (updated.academicYear) payload.academic_year = updated.academicYear;
      if (updated.homeroomTeacherId !== undefined) payload.homeroom_teacher_id = updated.homeroomTeacherId || null;

      const { error } = await supabase.from('classes').update(payload).eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Update class failed:', error);
        showErrorToast(`Gagal memperbarui kelas: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('UBAH_KELAS', `Memperbarui data kelas`);
        showSuccessToast('Kelas berhasil diperbarui.');
      }
    }
  };

  const deleteClass = async (id: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Deleting class:', id);
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete class failed:', error);
        showErrorToast(`Gagal menghapus kelas: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('HAPUS_KELAS', `Menghapus kelas`);
        showSuccessToast('Kelas berhasil dihapus.');
      }
    }
  };

  // Student Actions
  const addStudent = async (std: Omit<Student, 'id' | 'createdAt'>) => {
    const supabase = getSupabaseClient();
    const newStdId = `std_${Date.now()}`;
    if (supabase) {
      console.log('[Supabase DB] Adding student:', std.fullName);
      const { error } = await supabase.from('students').insert([{
        id: newStdId,
        nis: std.nis,
        full_name: std.fullName,
        gender: std.gender,
        birth_place: std.birthPlace || '',
        birth_date: std.birthDate || null,
        address: std.address || '',
        parent_phone: std.parentPhone || '',
        class_id: std.classId || null,
        created_at: new Date().toISOString()
      }]);
      if (error) {
        console.error('[Supabase DB Error] Insert student failed:', error);
        showErrorToast(`Gagal menambah siswa: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('TAMBAH_SISWA', `Menambahkan siswa ${std.fullName}`);
        showSuccessToast('Siswa berhasil ditambahkan.');
      }
    }
  };

  const bulkAddStudents = async (stdsList: Omit<Student, 'id' | 'createdAt'>[]) => {
    const supabase = getSupabaseClient();
    if (supabase && stdsList.length > 0) {
      console.log('[Supabase DB] Bulk inserting students:', stdsList.length);
      const now = new Date().toISOString();
      const payload = stdsList.map((std, idx) => {
        const cls = classes.find((c) => c.id === std.classId || c.name.toLowerCase() === (std.className || '').toLowerCase());
        return {
          id: `std_bulk_${Date.now()}_${idx}`,
          nis: std.nis,
          full_name: std.fullName,
          gender: std.gender,
          birth_place: std.birthPlace || '',
          birth_date: std.birthDate || null,
          address: std.address || '',
          parent_phone: std.parentPhone || '',
          class_id: cls?.id || std.classId || null,
          created_at: now
        };
      });

      const { error } = await supabase.from('students').insert(payload);
      if (error) {
        console.error('[Supabase DB Error] Bulk insert students failed:', error);
        showErrorToast(`Gagal mengunggah data siswa: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('BULK_UPLOAD_SISWA', `Berhasil mengunggah ${stdsList.length} data siswa baru`);
        showSuccessToast(`Berhasil mengimpor ${stdsList.length} data siswa baru.`);
      }
    }
  };

  const updateStudent = async (id: string, updated: Partial<Student>) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Updating student:', id);
      const payload: any = {};
      if (updated.nis) payload.nis = updated.nis;
      if (updated.fullName) payload.full_name = updated.fullName;
      if (updated.gender) payload.gender = updated.gender;
      if (updated.birthPlace !== undefined) payload.birth_place = updated.birthPlace;
      if (updated.birthDate !== undefined) payload.birth_date = updated.birthDate || null;
      if (updated.address !== undefined) payload.address = updated.address;
      if (updated.parentPhone !== undefined) payload.parent_phone = updated.parentPhone;
      if (updated.classId !== undefined) payload.class_id = updated.classId || null;

      const { error } = await supabase.from('students').update(payload).eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Update student failed:', error);
        showErrorToast(`Gagal memperbarui data siswa: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('UBAH_SISWA', `Memperbarui data siswa`);
        showSuccessToast('Data siswa berhasil diperbarui.');
      }
    }
  };

  const deleteStudent = async (id: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Deleting student:', id);
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete student failed:', error);
        showErrorToast(`Gagal menghapus siswa: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('HAPUS_SISWA', `Menghapus siswa`);
        showSuccessToast('Data siswa berhasil dihapus.');
      }
    }
  };

  // Grade Actions
  const calculateGradeDetails = (tugas: number, harian: number, pts: number, pas: number) => {
    const finalScore = Math.round(tugas * 0.2 + harian * 0.3 + pts * 0.25 + pas * 0.25);
    let predicate: 'A' | 'B' | 'C' | 'D' = 'D';
    if (finalScore >= 88) predicate = 'A';
    else if (finalScore >= 78) predicate = 'B';
    else if (finalScore >= 68) predicate = 'C';
    else predicate = 'D';

    return { finalScore, predicate };
  };

  const saveGrade = async (gradeData: Omit<Grade, 'id' | 'finalScore' | 'predicate' | 'updatedAt'>) => {
    const { finalScore, predicate } = calculateGradeDetails(
      gradeData.assignmentScore,
      gradeData.dailyScore,
      gradeData.ptsScore,
      gradeData.pasScore
    );

    const existingGrade = grades.find(
      (g) =>
        g.studentId === gradeData.studentId &&
        g.subjectId === gradeData.subjectId &&
        g.semester === gradeData.semester
    );

    const fullGradeId = existingGrade ? existingGrade.id : `grd_${Date.now()}`;
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Saving grade for student:', gradeData.studentId);
      const { error } = await supabase.from('grades').upsert([{
        id: fullGradeId,
        student_id: gradeData.studentId || null,
        subject_id: gradeData.subjectId || null,
        class_id: gradeData.classId || null,
        teacher_id: gradeData.teacherId || null,
        assignment_score: gradeData.assignmentScore || 0,
        daily_score: gradeData.dailyScore || 0,
        pts_score: gradeData.ptsScore || 0,
        pas_score: gradeData.pasScore || 0,
        final_score: finalScore,
        predicate: predicate,
        notes: gradeData.notes || '',
        academic_year: gradeData.academicYear,
        semester: gradeData.semester,
        updated_at: new Date().toISOString()
      }]);
      if (error) {
        console.error('[Supabase DB Error] Save grade failed:', error);
        showErrorToast(`Gagal menyimpan nilai: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('INPUT_NILAI', `Menyimpan nilai siswa`);
        showSuccessToast('Nilai siswa berhasil disimpan.');
      }
    }
  };

  const deleteGrade = async (id: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Deleting grade:', id);
      const { error } = await supabase.from('grades').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete grade failed:', error);
        showErrorToast(`Gagal menghapus nilai: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('HAPUS_NILAI', `Menghapus rekaman nilai`);
        showSuccessToast('Nilai berhasil dihapus.');
      }
    }
  };

  // Attendance Actions
  const saveAttendanceBatch = async (records: Omit<Attendance, 'id' | 'createdAt'>[]) => {
    const supabase = getSupabaseClient();
    if (supabase && records.length > 0) {
      console.log('[Supabase DB] Saving attendance batch:', records.length);
      const now = new Date().toISOString();
      const payload = records.map((r, index) => ({
        id: `att_${Date.now()}_${index}`,
        date: r.date,
        student_id: r.studentId || null,
        class_id: r.classId || null,
        subject_id: r.subjectId || null,
        teacher_id: r.teacherId || null,
        status: r.status,
        notes: r.notes || '',
        created_at: now
      }));
      const { error } = await supabase.from('attendance').insert(payload);
      if (error) {
        console.error('[Supabase DB Error] Save attendance failed:', error);
        showErrorToast(`Gagal menyimpan absensi: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('INPUT_ABSENSI', `Memproses absensi untuk ${records.length} siswa`);
        showSuccessToast(`Berhasil menyimpan absensi ${records.length} siswa.`);
      }
    }
  };

  // Journal Actions
  const addJournal = async (journal: Omit<TeachingJournal, 'id' | 'createdAt'>) => {
    const supabase = getSupabaseClient();
    const newJrnId = `jrn_${Date.now()}`;
    if (supabase) {
      console.log('[Supabase DB] Adding teaching journal:', journal.topic);
      const { error } = await supabase.from('teaching_journals').insert([{
        id: newJrnId,
        date: journal.date,
        subject_id: journal.subjectId || null,
        class_id: journal.classId || null,
        teacher_id: journal.teacherId || null,
        time_slot: journal.timeSlot,
        topic: journal.topic,
        method: journal.method,
        attendee_count: journal.attendeeCount || 0,
        notes: journal.notes || '',
        attachment_name: journal.attachmentName || null,
        attachment_drive_id: journal.attachmentDriveId || null,
        attachment_web_view_link: journal.attachmentWebViewLink || null,
        attachment_web_content_link: journal.attachmentWebContentLink || null,
        created_at: new Date().toISOString()
      }]);
      if (error) {
        console.error('[Supabase DB Error] Add journal failed:', error);
        showErrorToast(`Gagal menyimpan jurnal: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('TAMBAH_JURNAL', `Menambahkan jurnal mengajar ${journal.topic}`);
        showSuccessToast('Jurnal mengajar berhasil disimpan.');
      }
    }
  };

  const deleteJournal = async (id: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Deleting journal:', id);
      const { error } = await supabase.from('teaching_journals').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete journal failed:', error);
        showErrorToast(`Gagal menghapus jurnal: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('HAPUS_JURNAL', `Menghapus jurnal mengajar`);
        showSuccessToast('Jurnal mengajar berhasil dihapus.');
      }
    }
  };

  // Module Actions
  const addModule = async (mod: Omit<TeachingModule, 'id' | 'createdAt'>) => {
    const supabase = getSupabaseClient();
    const newModId = `mod_${Date.now()}`;
    if (supabase) {
      console.log('[Supabase DB] Adding module:', mod.title);
      const { error } = await supabase.from('teaching_modules').insert([{
        id: newModId,
        title: mod.title,
        subject_id: mod.subjectId || null,
        class_level: mod.classLevel,
        semester: mod.semester,
        academic_year: mod.academicYear,
        description: mod.description || '',
        file_type: mod.fileType,
        file_name: mod.fileName,
        file_size: mod.fileSize || '',
        file_drive_id: mod.fileDriveId,
        web_view_link: mod.webViewLink,
        web_content_link: mod.webContentLink,
        teacher_id: mod.teacherId || null,
        created_at: new Date().toISOString()
      }]);
      if (error) {
        console.error('[Supabase DB Error] Add module failed:', error);
        showErrorToast(`Gagal mengunggah modul: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('UPLOAD_MODUL', `Mengunggah arsip modul/RPP ${mod.title}`);
        showSuccessToast('Arsip Modul Ajar/RPP berhasil diunggah.');
      }
    }
  };

  const deleteModule = async (id: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('[Supabase DB] Deleting module:', id);
      const { error } = await supabase.from('teaching_modules').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete module failed:', error);
        showErrorToast(`Gagal menghapus modul: ${error.message}`);
      } else {
        await loadDataFromSupabase();
        logActivity('HAPUS_MODUL', `Menghapus arsip modul/RPP`);
        showSuccessToast('Arsip Modul Ajar/RPP dihapus.');
      }
    }
  };

  // System Settings Action
  const updateSystemSettings = async (updated: Partial<SystemSettings>) => {
    const nextSettings = {
      ...systemSettings,
      ...updated,
      updatedAt: new Date().toISOString()
    };
    setSystemSettings(nextSettings);

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('system_settings').upsert({
        key: 'main_config',
        value: nextSettings,
        updated_at: nextSettings.updatedAt
      });
      if (error) {
        console.error('[Supabase DB Error] Update system settings failed:', error);
      } else {
        await loadDataFromSupabase();
        logActivity('PENGATURAN_SISTEM', 'Memperbarui Pengaturan Margin Kertas & Kop Surat');
        showSuccessToast('Pengaturan sistem berhasil diperbarui.');
      }
    }
  };

  // Reset local state to empty
  const resetAllData = () => {
    setTeachers([]);
    setSubjects([]);
    setClasses([]);
    setStudents([]);
    setGrades([]);
    setAttendance([]);
    setJournals([]);
    setModules([]);
    setActivityLogs([]);

    logActivity('RESET_DATA', 'Mereset tampilan data lokal');
    showSuccessToast('Seluruh data di layar telah dibersihkan.');
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
