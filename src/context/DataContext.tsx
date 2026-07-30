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
  // FIX: State TIDAK LAGI di-inisialisasi dari localStorage.
  // localStorage berbeda-beda di tiap browser/perangkat, itulah sebabnya
  // data "tidak sinkron" saat aplikasi dibuka di browser lain.
  // Sekarang state dimulai dari nilai default, lalu langsung ditimpa oleh
  // data asli dari Supabase melalui loadDataFromSupabase() saat komponen mount (lihat di bawah).
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>(INITIAL_ACADEMIC_YEARS);

  const activeAcademicYear = academicYears.find((ay) => ay.isActive) || academicYears[0] || {
    id: 'ay_default',
    year: '2025/2026',
    semester: '1',
    isActive: true,
    status: 'Aktif',
    createdAt: new Date().toISOString()
  };

  const [teachers, setTeachers] = useState<Profile[]>(INITIAL_PROFILES.filter((p) => p.role === 'guru'));
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [classes, setClasses] = useState<ClassRoom[]>(INITIAL_CLASSES);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [grades, setGrades] = useState<Grade[]>(INITIAL_GRADES);
  const [attendance, setAttendance] = useState<Attendance[]>(INITIAL_ATTENDANCE);
  const [journals, setJournals] = useState<TeachingJournal[]>(INITIAL_JOURNALS);
  const [modules, setModules] = useState<TeachingModule[]>(INITIAL_MODULES);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);

  // FIX: Blok "Sync to localStorage" DIHAPUS.
  // Blok ini sebelumnya menulis seluruh data ke localStorage tiap kali state berubah,
  // yang justru membuat tiap browser punya "salinan data" sendiri-sendiri yang saling
  // tidak tahu-menahu. Sumber data yang benar sekarang HANYA Supabase.

  useEffect(() => {
    // FIX: Listener BroadcastChannel & 'storage' event DIHAPUS.
    // Keduanya hanya bekerja antar-tab dalam browser & perangkat YANG SAMA,
    // jadi tidak pernah benar-benar menyinkronkan data ke browser/perangkat lain.
    // Sinkronisasi lintas perangkat yang sesungguhnya sudah ditangani oleh
    // Supabase Realtime (channel 'schema-db-changes' di bawah) yang tetap dipertahankan.

    // 2. Supabase Realtime Listener & Initial Sync
    const supabase = getSupabaseClient();
    let channel: any = null;

    const loadDataFromSupabase = async () => {
      const client = getSupabaseClient();
      if (!client) return;

      try {
        // Profiles (Guru)
        const { data: profs } = await client.from('profiles').select('*');
        if (profs && profs.length > 0) {
          const guruList: Profile[] = profs
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
              createdAt: p.created_at,
              updatedAt: p.updated_at
            }));
          if (guruList.length > 0) setTeachers(guruList);
        }

        // Classes
        const { data: clsData } = await client.from('classes').select('*');
        let fetchedClasses: ClassRoom[] = [];
        if (clsData && clsData.length > 0) {
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

        // Subjects
        const { data: sbjData } = await client.from('subjects').select('*');
        if (sbjData && sbjData.length > 0) {
          const mappedSbj: Subject[] = sbjData.map((s: any) => ({
            id: s.id,
            code: s.code,
            name: s.name,
            description: s.description,
            teacherIds: s.teacher_ids || [],
            createdAt: s.created_at
          }));
          setSubjects(mappedSbj);
        }

        // Students
        const { data: stdData } = await client.from('students').select('*');
        if (stdData && stdData.length > 0) {
          const mappedStd: Student[] = stdData.map((s: any) => {
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
          setStudents(mappedStd);
        }

        // Grades
        const { data: grdData } = await client.from('grades').select('*');
        if (grdData && grdData.length > 0) {
          const mappedGrd: Grade[] = grdData.map((g: any) => ({
            id: g.id,
            studentId: g.student_id,
            studentName: '',
            studentNis: '',
            subjectId: g.subject_id,
            subjectName: '',
            classId: g.class_id,
            className: '',
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
          }));
          setGrades(mappedGrd);
        }

        // Attendance
        const { data: attData } = await client.from('attendance').select('*');
        if (attData && attData.length > 0) {
          const mappedAtt: Attendance[] = attData.map((a: any) => ({
            id: a.id,
            date: a.date,
            studentId: a.student_id,
            classId: a.class_id,
            subjectId: a.subject_id,
            teacherId: a.teacher_id,
            status: a.status,
            notes: a.notes,
            createdAt: a.created_at
          }));
          setAttendance(mappedAtt);
        }

        // Teaching Journals
        const { data: jrnData } = await client.from('teaching_journals').select('*');
        if (jrnData && jrnData.length > 0) {
          const mappedJrn: TeachingJournal[] = jrnData.map((j: any) => ({
            id: j.id,
            date: j.date,
            subjectId: j.subject_id,
            classId: j.class_id,
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
          }));
          setJournals(mappedJrn);
        }

        // Teaching Modules
        const { data: modData } = await client.from('teaching_modules').select('*');
        if (modData && modData.length > 0) {
          const mappedMod: TeachingModule[] = modData.map((m: any) => ({
            id: m.id,
            title: m.title,
            subjectId: m.subject_id,
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
          }));
          setModules(mappedMod);
        }
      } catch (err) {
        console.warn('Error loading Supabase initial data:', err);
      }
    };

    if (supabase) {
      setIsRealtimeConnected(true);
      loadDataFromSupabase();

      channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
          loadDataFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
          loadDataFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => {
          loadDataFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          loadDataFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, () => {
          loadDataFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
          loadDataFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teaching_journals' }, () => {
          loadDataFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teaching_modules' }, () => {
          loadDataFromSupabase();
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true);
          }
        });
    } else {
      // FIX: Sebelumnya kondisi ini diam-diam menandai "terhubung" (setIsRealtimeConnected(true))
      // padahal Supabase TIDAK terkonfigurasi sama sekali. Akibatnya user tidak pernah tahu
      // kalau browser/perangkat ini sebenarnya tidak tersambung ke database sama sekali,
      // dan hanya memakai data bawaan (INITIAL_*). Sekarang ditandai dengan jelas.
      setIsRealtimeConnected(false);
      showErrorToast(
        'Aplikasi belum terhubung ke database (Supabase). Data yang tampil hanya data bawaan ' +
        'dan TIDAK akan sama dengan perangkat/browser lain. Atur VITE_SUPABASE_URL & ' +
        'VITE_SUPABASE_ANON_KEY di environment variable hosting, lalu deploy ulang.'
      );
    }

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
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

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('system_settings').upsert({
        key: 'academic_years',
        value: academicYears,
        updated_at: new Date().toISOString()
      }).then(({ error }: any) => {
        if (error) { console.warn('Supabase academic year save error:', error); showErrorToast('Supabase academic year save error: ' + (error.message || 'Periksa koneksi database.')); }
      });
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

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('profiles').insert([{
        id: teacher.id,
        email: teacher.email,
        username: teacher.username,
        password: teacher.password,
        full_name: teacher.fullName,
        role: teacher.role || 'guru',
        nip_nuptk: teacher.nipNuptk,
        phone: teacher.phone,
        avatar_url: teacher.avatarUrl,
        created_at: teacher.createdAt || new Date().toISOString(),
        updated_at: teacher.updatedAt || new Date().toISOString()
      }]).then(({ error }: any) => {
        if (error) { console.warn('Supabase add teacher error:', error); showErrorToast('Supabase add teacher error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

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

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('subjects').insert([{
        id: newSubj.id,
        code: newSubj.code,
        name: newSubj.name,
        description: newSubj.description || '',
        teacher_ids: newSubj.teacherIds || [],
        created_at: newSubj.createdAt
      }]).then(({ error }: any) => {
        if (error) { console.warn('Supabase add subject error:', error); showErrorToast('Supabase add subject error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

    logActivity('TAMBAH_MATA_PELAJARAN', `Menambahkan mata pelajaran ${newSubj.name}`);
    showSuccessToast('Mata Pelajaran berhasil ditambahkan.');
  };

  const updateSubject = (id: string, updated: Partial<Subject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));

    const supabase = getSupabaseClient();
    if (supabase) {
      const payload: any = {};
      if (updated.code) payload.code = updated.code;
      if (updated.name) payload.name = updated.name;
      if (updated.description !== undefined) payload.description = updated.description;
      if (updated.teacherIds) payload.teacher_ids = updated.teacherIds;
      
      supabase.from('subjects').update(payload).eq('id', id).then(({ error }: any) => {
        if (error) { console.warn('Supabase update subject error:', error); showErrorToast('Supabase update subject error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

    logActivity('UBAH_MATA_PELAJARAN', `Memperbarui data mata pelajaran`);
    showSuccessToast('Mata Pelajaran berhasil diperbarui.');
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('subjects').delete().eq('id', id).then(({ error }: any) => {
        if (error) { console.warn('Supabase delete subject error:', error); showErrorToast('Supabase delete subject error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

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

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('classes').insert([{
        id: newCls.id,
        name: newCls.name,
        grade_level: newCls.gradeLevel,
        academic_year: newCls.academicYear,
        homeroom_teacher_id: newCls.homeroomTeacherId || null,
        created_at: newCls.createdAt
      }]).then(({ error }: any) => {
        if (error) { console.warn('Supabase add class error:', error); showErrorToast('Supabase add class error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

    logActivity('TAMBAH_KELAS', `Menambahkan kelas ${newCls.name}`);
    showSuccessToast('Kelas berhasil ditambahkan.');
  };

  const updateClass = (id: string, updated: Partial<ClassRoom>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));

    const supabase = getSupabaseClient();
    if (supabase) {
      const payload: any = {};
      if (updated.name) payload.name = updated.name;
      if (updated.gradeLevel) payload.grade_level = updated.gradeLevel;
      if (updated.academicYear) payload.academic_year = updated.academicYear;
      if (updated.homeroomTeacherId !== undefined) payload.homeroom_teacher_id = updated.homeroomTeacherId || null;

      supabase.from('classes').update(payload).eq('id', id).then(({ error }: any) => {
        if (error) { console.warn('Supabase update class error:', error); showErrorToast('Supabase update class error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

    logActivity('UBAH_KELAS', `Memperbarui data kelas`);
    showSuccessToast('Kelas berhasil diperbarui.');
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('classes').delete().eq('id', id).then(({ error }: any) => {
        if (error) { console.warn('Supabase delete class error:', error); showErrorToast('Supabase delete class error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

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

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('students').insert([{
        id: newStd.id,
        nis: newStd.nis,
        full_name: newStd.fullName,
        gender: newStd.gender,
        birth_place: newStd.birthPlace || '',
        birth_date: newStd.birthDate || null,
        address: newStd.address || '',
        parent_phone: newStd.parentPhone || '',
        class_id: newStd.classId || null,
        created_at: newStd.createdAt
      }]).then(({ error }: any) => {
        if (error) { console.warn('Supabase add student error:', error); showErrorToast('Supabase add student error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

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

    const supabase = getSupabaseClient();
    if (supabase && newStudents.length > 0) {
      const payload = newStudents.map((std) => ({
        id: std.id,
        nis: std.nis,
        full_name: std.fullName,
        gender: std.gender,
        birth_place: std.birthPlace || '',
        birth_date: std.birthDate || null,
        address: std.address || '',
        parent_phone: std.parentPhone || '',
        class_id: std.classId || null,
        created_at: std.createdAt
      }));

      supabase.from('students').insert(payload).then(({ error }: any) => {
        if (error) { console.warn('Supabase bulk add students error:', error); showErrorToast('Supabase bulk add students error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

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

    const supabase = getSupabaseClient();
    if (supabase) {
      const payload: any = {};
      if (updated.nis) payload.nis = updated.nis;
      if (updated.fullName) payload.full_name = updated.fullName;
      if (updated.gender) payload.gender = updated.gender;
      if (updated.birthPlace !== undefined) payload.birth_place = updated.birthPlace;
      if (updated.birthDate !== undefined) payload.birth_date = updated.birthDate || null;
      if (updated.address !== undefined) payload.address = updated.address;
      if (updated.parentPhone !== undefined) payload.parent_phone = updated.parentPhone;
      if (updated.classId !== undefined) payload.class_id = updated.classId || null;

      supabase.from('students').update(payload).eq('id', id).then(({ error }: any) => {
        if (error) { console.warn('Supabase update student error:', error); showErrorToast('Supabase update student error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

    logActivity('UBAH_SISWA', `Memperbarui data siswa`);
    showSuccessToast('Data siswa berhasil diperbarui.');
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('students').delete().eq('id', id).then(({ error }: any) => {
        if (error) { console.warn('Supabase delete student error:', error); showErrorToast('Supabase delete student error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

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

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('grades').upsert([{
        id: fullGrade.id,
        student_id: fullGrade.studentId || null,
        subject_id: fullGrade.subjectId || null,
        class_id: fullGrade.classId || null,
        teacher_id: fullGrade.teacherId || null,
        assignment_score: fullGrade.assignmentScore || 0,
        daily_score: fullGrade.dailyScore || 0,
        pts_score: fullGrade.ptsScore || 0,
        pas_score: fullGrade.pasScore || 0,
        final_score: fullGrade.finalScore || 0,
        predicate: fullGrade.predicate,
        notes: fullGrade.notes || '',
        academic_year: fullGrade.academicYear,
        semester: fullGrade.semester,
        updated_at: fullGrade.updatedAt
      }]).then(({ error }: any) => {
        if (error) { console.warn('Supabase save grade error:', error); showErrorToast('Supabase save grade error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

    logActivity('INPUT_NILAI', `Menyimpan nilai ${fullGrade.studentName} (${fullGrade.subjectName})`);
    showSuccessToast('Nilai siswa berhasil disimpan.');
  };

  const deleteGrade = (id: string) => {
    setGrades((prev) => prev.filter((g) => g.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('grades').delete().eq('id', id).then(({ error }: any) => {
        if (error) { console.warn('Supabase delete grade error:', error); showErrorToast('Supabase delete grade error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

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

    const supabase = getSupabaseClient();
    if (supabase && newRecords.length > 0) {
      const payload = newRecords.map((att) => ({
        id: att.id,
        date: att.date,
        student_id: att.studentId || null,
        class_id: att.classId || null,
        subject_id: att.subjectId || null,
        teacher_id: att.teacherId || null,
        status: att.status,
        notes: att.notes || '',
        created_at: att.createdAt
      }));
      supabase.from('attendance').insert(payload).then(({ error }: any) => {
        if (error) { console.warn('Supabase save attendance error:', error); showErrorToast('Supabase save attendance error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

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

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('teaching_journals').insert([{
        id: newJrn.id,
        date: newJrn.date,
        subject_id: newJrn.subjectId || null,
        class_id: newJrn.classId || null,
        teacher_id: newJrn.teacherId || null,
        time_slot: newJrn.timeSlot,
        topic: newJrn.topic,
        method: newJrn.method,
        attendee_count: newJrn.attendeeCount || 0,
        notes: newJrn.notes || '',
        attachment_name: newJrn.attachmentName || null,
        attachment_drive_id: newJrn.attachmentDriveId || null,
        attachment_web_view_link: newJrn.attachmentWebViewLink || null,
        attachment_web_content_link: newJrn.attachmentWebContentLink || null,
        created_at: newJrn.createdAt
      }]).then(({ error }: any) => {
        if (error) { console.warn('Supabase add journal error:', error); showErrorToast('Supabase add journal error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

    logActivity('TAMBAH_JURNAL', `Menambahkan jurnal mengajar ${newJrn.topic}`);
    showSuccessToast('Jurnal mengajar berhasil disimpan.');
  };

  const deleteJournal = (id: string) => {
    setJournals((prev) => prev.filter((j) => j.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('teaching_journals').delete().eq('id', id).then(({ error }: any) => {
        if (error) { console.warn('Supabase delete journal error:', error); showErrorToast('Supabase delete journal error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

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

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('teaching_modules').insert([{
        id: newMod.id,
        title: newMod.title,
        subject_id: newMod.subjectId || null,
        class_level: newMod.classLevel,
        semester: newMod.semester,
        academic_year: newMod.academicYear,
        description: newMod.description || '',
        file_type: newMod.fileType,
        file_name: newMod.fileName,
        file_size: newMod.fileSize || '',
        file_drive_id: newMod.fileDriveId,
        web_view_link: newMod.webViewLink,
        web_content_link: newMod.webContentLink,
        teacher_id: newMod.teacherId || null,
        created_at: newMod.createdAt
      }]).then(({ error }: any) => {
        if (error) { console.warn('Supabase add module error:', error); showErrorToast('Supabase add module error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

    logActivity('UPLOAD_MODUL', `Mengunggah arsip modul/RPP ${newMod.title}`);
    showSuccessToast('Arsip Modul Ajar/RPP berhasil diunggah.');
  };

  const deleteModule = (id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('teaching_modules').delete().eq('id', id).then(({ error }: any) => {
        if (error) { console.warn('Supabase delete module error:', error); showErrorToast('Supabase delete module error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

    logActivity('HAPUS_MODUL', `Menghapus arsip modul/RPP`);
    showSuccessToast('Arsip Modul Ajar/RPP dihapus.');
  };

  const updateSystemSettings = (updated: Partial<SystemSettings>) => {
    const nextSettings = {
      ...systemSettings,
      ...updated,
      updatedAt: new Date().toISOString()
    };
    setSystemSettings(nextSettings);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('system_settings').upsert({
        key: 'main_config',
        value: nextSettings,
        updated_at: nextSettings.updatedAt
      }).then(({ error }: any) => {
        if (error) { console.warn('Supabase update settings error:', error); showErrorToast('Supabase update settings error: ' + (error.message || 'Periksa koneksi database.')); }
      });
    }

    logActivity('PENGATURAN_SISTEM', 'Memperbarui Pengaturan Margin Kertas & Kop Surat');
    showSuccessToast('Pengaturan sistem berhasil diperbarui.');
  };

  const resetAllData = () => {
    // FIX: localStorage.removeItem(...) dihapus karena localStorage bukan lagi sumber data.
    // CATATAN PENTING: fungsi ini hanya mengosongkan tampilan di browser ini saja.
    // Data di Supabase TIDAK ikut terhapus, sehingga saat halaman di-refresh atau Realtime
    // sync berjalan, data dari Supabase akan tampil kembali. Untuk benar-benar menghapus
    // seluruh data, jalankan perintah TRUNCATE/DELETE langsung di Supabase SQL Editor.
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
