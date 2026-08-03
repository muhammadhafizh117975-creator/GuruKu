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
  ActivityLog,
  NotificationItem,
  SchoolPrincipal
} from '../types';
import {
  INITIAL_ACADEMIC_YEARS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_PRINCIPALS,
  getSupabaseClient,
  supabase,
  resetSupabaseDatabaseTables
} from '../services/supabase';
import { GoogleDriveService } from '../services/googleDrive';
import { showSuccessToast, showErrorToast } from '../components/common/SweetAlert';
import { useAuth } from './AuthContext';

export interface BulkImportResult {
  total: number;
  success: number;
  skipped: number;
  updated: number;
  failed: number;
  logs: { nis: string; name: string; reason: string; status: 'skipped' | 'updated' | 'failed' | 'success' }[];
}

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
  principals: SchoolPrincipal[];
  activePrincipal: SchoolPrincipal | null;
  activityLogs: ActivityLog[];
  notifications: NotificationItem[];
  unreadCount: number;
  isRealtimeConnected: boolean;

  // Actions
  addPrincipal: (p: Omit<SchoolPrincipal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePrincipal: (id: string, p: Partial<SchoolPrincipal>) => Promise<void>;
  deletePrincipal: (id: string) => Promise<void>;
  setActivePrincipal: (id: string) => Promise<void>;

  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  addNotification: (notif: { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error'; userId?: string }) => Promise<void>;
  addAcademicYear: (ay: Omit<AcademicYearItem, 'id' | 'createdAt'>) => Promise<void>;
  updateAcademicYear: (id: string, ay: Partial<AcademicYearItem>) => Promise<void>;
  setActiveAcademicYear: (id: string) => Promise<void>;
  deleteAcademicYear: (id: string) => Promise<void>;

  addTeacher: (teacher: Profile) => Promise<void>;
  updateTeacher: (id: string, teacher: Partial<Profile>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;

  addSubject: (subj: Omit<Subject, 'id' | 'createdAt'>) => Promise<void>;
  updateSubject: (id: string, subj: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  addClass: (cls: Omit<ClassRoom, 'id' | 'createdAt'>) => Promise<void>;
  updateClass: (id: string, cls: Partial<ClassRoom>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;

  addStudent: (std: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  bulkAddStudents: (stds: Omit<Student, 'id' | 'createdAt'>[], mode?: 'skip' | 'update' | 'abort') => Promise<BulkImportResult>;
  updateStudent: (id: string, std: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  saveGrade: (gradeData: Omit<Grade, 'id' | 'finalScore' | 'predicate' | 'updatedAt'>) => Promise<void>;
  deleteGrade: (id: string) => Promise<void>;

  saveAttendanceBatch: (records: Omit<Attendance, 'id' | 'createdAt'>[]) => Promise<void>;

  addJournal: (journal: Omit<TeachingJournal, 'id' | 'createdAt'>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;

  addModule: (mod: Omit<TeachingModule, 'id' | 'createdAt'>) => Promise<void>;
  updateModule: (id: string, mod: Partial<TeachingModule>) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;

  updateSystemSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  assignTeacherToSubjectsAndClasses: (teacherId: string, subjectIds: string[], classIds: string[]) => Promise<void>;
  logActivity: (action: string, details: string) => void;
  resetAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Primary State loaded dynamically from Supabase
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
  const [principals, setPrincipals] = useState<SchoolPrincipal[]>(INITIAL_PRINCIPALS);
  const [activePrincipalState, setActivePrincipalState] = useState<SchoolPrincipal | null>(INITIAL_PRINCIPALS[0] || null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_init_1',
      title: 'Sistem Terhubung ke Supabase',
      message: 'Database Supabase & Realtime aktif. Data siswa, nilai, presensi, dan jurnal tersinkron terpusat.',
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif_init_2',
      title: 'Tahun Pelajaran 2025/2026 Aktif',
      message: 'Tahun Pelajaran 2025/2026 Semester 1 diaktifkan sebagai acuan nilai dan presensi harian.',
      type: 'info',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);

  // Filter notifications for current user role & ID
  const visibleNotifications = notifications.filter((n) => {
    if (n.userId && user?.id && n.userId !== user.id) return false;
    if (n.role && user?.role && n.role !== 'all' && n.role !== user.role) return false;
    return true;
  });

  const unreadCount = visibleNotifications.filter((n) => !n.isRead).length;

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

  // Primary Database Fetching Function (Single Source of Truth)
  const loadDataFromSupabase = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setIsRealtimeConnected(false);
      return;
    }

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
      } else if (sysErr) {
        console.warn('[Supabase DB Sync Error] Failed fetching system_settings:', sysErr);
      }

      // 1b. School Principals
      const { data: prnData, error: prnErr } = await client.from('school_principals').select('*');
      if (!prnErr && prnData && prnData.length > 0) {
        const fetchedPrincipals: SchoolPrincipal[] = prnData.map((p: any) => ({
          id: p.id,
          fullName: p.full_name,
          title: p.title || '',
          nuks: p.nuks || '',
          position: p.position || 'Kepala Sekolah',
          isActive: Boolean(p.is_active),
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
        setPrincipals(fetchedPrincipals);
        const activePrn = fetchedPrincipals.find((p) => p.isActive) || fetchedPrincipals[0];
        if (activePrn) {
          setActivePrincipalState(activePrn);
        }
      } else if (!prnErr && prnData && prnData.length === 0) {
        // Seed default principal if table is empty
        const initP = INITIAL_PRINCIPALS[0];
        await client.from('school_principals').insert([{
          id: initP.id,
          full_name: initP.fullName,
          title: initP.title,
          nuks: initP.nuks,
          position: initP.position,
          is_active: true,
          created_at: new Date().toISOString()
        }]);
        setPrincipals([initP]);
        setActivePrincipalState(initP);
      } else if (prnErr) {
        console.warn('[Supabase DB Sync Error] Failed fetching school_principals:', prnErr);
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
      } else if (profErr) {
        console.warn('[Supabase DB Sync Error] Failed fetching profiles:', profErr);
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
          teacherIds: c.teacher_ids || [],
          createdAt: c.created_at
        }));

        try {
          const { data: assignData } = await client.from('teacher_assignments').select('*');
          if (assignData && assignData.length > 0) {
            const classTeachersMap: Record<string, Set<string>> = {};
            assignData.forEach((a: any) => {
              if (a.is_active !== false && a.class_id && a.teacher_id) {
                if (!classTeachersMap[a.class_id]) classTeachersMap[a.class_id] = new Set();
                classTeachersMap[a.class_id].add(a.teacher_id);
              }
            });
            fetchedClasses = fetchedClasses.map((c) => {
              const extraIds = classTeachersMap[c.id] ? Array.from(classTeachersMap[c.id]) : [];
              const combined = Array.from(new Set([...(c.teacherIds || []), ...extraIds]));
              return { ...c, teacherIds: combined };
            });
          }
        } catch (assignErr) {
          console.warn('[Supabase DB Sync Notice] teacher_assignments table read:', assignErr);
        }

        setClasses(fetchedClasses);
      } else if (clsErr) {
        console.warn('[Supabase DB Sync Error] Failed fetching classes:', clsErr);
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
      } else if (sbjErr) {
        console.warn('[Supabase DB Sync Error] Failed fetching subjects:', sbjErr);
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
            classId: s.class_id || '',
            className: cls ? cls.name : 'Belum Ada Kelas',
            createdAt: s.created_at
          };
        });
        setStudents(fetchedStudents);
      } else if (stdErr) {
        console.warn('[Supabase DB Sync Error] Failed fetching students:', stdErr);
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
      } else if (grdErr) {
        console.warn('[Supabase DB Sync Error] Failed fetching grades:', grdErr);
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
      } else if (attErr) {
        console.warn('[Supabase DB Sync Error] Failed fetching attendance:', attErr);
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
      } else if (jrnErr) {
        console.warn('[Supabase DB Sync Error] Failed fetching teaching_journals:', jrnErr);
      }

      // 9. Teaching Modules / Module Archives
      let rawModData: any[] = [];
      const { data: maData, error: maErr } = await client.from('module_archives').select('*');
      if (!maErr && maData && maData.length > 0) {
        rawModData = maData;
      } else {
        const { data: tmData, error: tmErr } = await client.from('teaching_modules').select('*');
        if (!tmErr && tmData) {
          rawModData = tmData;
        } else if (maErr && tmErr) {
          console.warn('[Supabase DB Sync Error] Failed fetching module_archives / teaching_modules:', maErr, tmErr);
        }
      }

      if (rawModData.length > 0) {
        const fetchedModules: TeachingModule[] = rawModData.map((m: any) => {
          const subject = fetchedSubjects.find((s) => s.id === (m.subject_id || m.subjectId));
          const teacher = fetchedTeachers.find((p) => p.id === (m.uploaded_by || m.teacher_id));
          return {
            id: m.id,
            title: m.title,
            subjectId: m.subject_id || m.subjectId || '',
            subjectName: subject?.name || m.subject_name || 'Mata Pelajaran',
            classLevel: m.class_level || m.class_id || '7',
            classId: m.class_id || m.class_level,
            semester: m.semester || '1',
            academicYear: m.academic_year || '2025/2026',
            description: m.description || '',
            fileType: m.file_type || (m.mime_type?.includes('pdf') ? 'pdf' : m.mime_type?.includes('word') ? 'docx' : 'pptx'),
            fileName: m.file_name || m.fileName || 'Dokumen.pdf',
            mimeType: m.mime_type,
            fileSize: m.file_size || m.fileSize || '1.2 MB',
            fileDriveId: m.drive_file_id || m.file_drive_id || m.google_drive_file_id || m.id,
            driveFolderId: m.drive_folder_id || m.google_drive_folder_id,
            folderPath: m.folder_path,
            webViewLink: m.drive_url || m.web_view_link || m.google_drive_url || '#',
            webContentLink: m.web_content_link || m.drive_url || m.web_view_link || '#',
            teacherId: m.uploaded_by || m.teacher_id || 'global_teacher',
            teacherName: teacher?.fullName || m.teacher_name || 'Guru Pengajar',
            createdAt: m.created_at || m.uploaded_at || new Date().toISOString(),
            updatedAt: m.updated_at
          };
        });
        setModules(fetchedModules);
      }

      // 10. Notifications
      const { data: notifData, error: notifErr } = await client
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!notifErr && notifData && notifData.length > 0) {
        setNotifications(
          notifData.map((n: any) => ({
            id: n.id,
            userId: n.user_id || undefined,
            role: n.role || 'all',
            title: n.title,
            message: n.message,
            type: n.type || 'info',
            icon: n.icon || undefined,
            isRead: Boolean(n.is_read),
            createdAt: n.created_at || new Date().toISOString(),
            updatedAt: n.updated_at
          }))
        );
      }
    } catch (err) {
      console.error('[Supabase DB Sync Critical Error] Failed to load database state:', err);
    }
  }, []);

  const markNotificationAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, updatedAt: new Date().toISOString() } : n))
    );
    const client = getSupabaseClient();
    if (client) {
      try {
        await client
          .from('notifications')
          .update({ is_read: true, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (e) {
        console.warn('Failed updating notification in Supabase:', e);
      }
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, updatedAt: new Date().toISOString() })));
    const client = getSupabaseClient();
    if (client) {
      try {
        await client
          .from('notifications')
          .update({ is_read: true, updated_at: new Date().toISOString() })
          .eq('is_read', false);
      } catch (e) {
        console.warn('Failed marking all notifications read in Supabase:', e);
      }
    }
    // After 2.5s auto re-sync to ensure Realtime propagation & zero-count state persistence
    setTimeout(() => {
      loadDataFromSupabase();
    }, 2500);
  }, [loadDataFromSupabase]);

  const addNotification = useCallback(
    async (notif: {
      title: string;
      message: string;
      type?: 'info' | 'success' | 'warning' | 'error';
      role?: 'admin' | 'guru' | 'all' | null;
      userId?: string | null;
      icon?: string;
    }) => {
      const now = new Date().toISOString();
      const newNotif: NotificationItem = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: notif.userId || null,
        role: notif.role || 'all',
        title: notif.title,
        message: notif.message,
        type: notif.type || 'info',
        icon: notif.icon,
        isRead: false,
        createdAt: now,
        updatedAt: now
      };

      setNotifications((prev) => [newNotif, ...prev]);

      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from('notifications').insert([
            {
              id: newNotif.id,
              user_id: newNotif.userId || null,
              role: newNotif.role || 'all',
              title: newNotif.title,
              message: newNotif.message,
              type: newNotif.type,
              icon: newNotif.icon || null,
              is_read: false,
              created_at: newNotif.createdAt,
              updated_at: newNotif.updatedAt
            }
          ]);
        } catch (e) {
          console.warn('Failed inserting notification in Supabase:', e);
        }
      }
    },
    []
  );

  // Initialization: Initial Fetch, Realtime Subscriptions, and Tab Focus Auto-Fetch
  useEffect(() => {
    const client = getSupabaseClient();
    if (client) {
      setIsRealtimeConnected(true);
    } else {
      setIsRealtimeConnected(false);
    }

    // 1. Initial Data Load
    loadDataFromSupabase();

    // 2. Supabase Realtime Subscription globally listening to schema 'public'
    const channel = supabase
      .channel('db-changes-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('[Supabase Realtime] Event received on public schema:', payload);
          loadDataFromSupabase();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        }
      });

    // 3. Auto-Fetch when window/tab receives focus
    const handleFocus = () => {
      console.log('[Window Focus] Re-syncing database data from Supabase...');
      loadDataFromSupabase();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadDataFromSupabase]);

  // Academic Year Actions
  const saveAcademicYearsToSupabase = async (newYears: AcademicYearItem[]) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi Supabase tidak tersedia.');
      return false;
    }
    try {
      const { error } = await client.from('system_settings').upsert({
        key: 'academic_years',
        value: newYears,
        updated_at: new Date().toISOString()
      });
      if (error) {
        console.error('[Supabase DB Error] Upsert academic_years failed:', error);
        showErrorToast(`Gagal menyimpan Tahun Pelajaran: ${error.message}`);
        return false;
      }
      await loadDataFromSupabase();
      return true;
    } catch (err: any) {
      console.error('[Supabase DB Exception] saveAcademicYearsToSupabase failed:', err);
      showErrorToast(`Gagal menyimpan Tahun Pelajaran: ${err.message || err}`);
      return false;
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
    const success = await saveAcademicYearsToSupabase(nextAy);
    if (success) {
      logActivity('TAMBAH_TAHUN_AJARAN', `Menambahkan tahun pelajaran ${newAy.year} Semester ${newAy.semester}`);
      showSuccessToast('Tahun Pelajaran berhasil ditambahkan.');
    }
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
    const success = await saveAcademicYearsToSupabase(nextAy);
    if (success) {
      logActivity('UBAH_TAHUN_AJARAN', `Memperbarui data tahun pelajaran`);
      showSuccessToast('Tahun Pelajaran berhasil diperbarui.');
    }
  };

  const setActiveAcademicYear = async (id: string) => {
    const nextAy = academicYears.map((item) => ({
      ...item,
      isActive: item.id === id,
      status: item.id === id ? 'Aktif' : 'Non-Aktif'
    }));
    const success = await saveAcademicYearsToSupabase(nextAy);
    if (success) {
      const selected = academicYears.find((ay) => ay.id === id);
      logActivity('AKTIFKAN_TAHUN_AJARAN', `Mengaktifkan tahun pelajaran ${selected?.year || id}`);
      addNotification({
        title: 'Tahun Ajaran & Semester Aktif Diubah',
        message: `Administrator mengubah Tahun Ajaran Aktif menjadi ${selected?.year} Semester ${selected?.semester}.`,
        type: 'warning',
        role: 'all'
      });
      showSuccessToast(`Tahun Pelajaran ${selected?.year} Semester ${selected?.semester} diaktifkan.`);
    }
  };

  const deleteAcademicYear = async (id: string) => {
    const nextAy = academicYears.filter((item) => item.id !== id);
    const success = await saveAcademicYearsToSupabase(nextAy);
    if (success) {
      logActivity('HAPUS_TAHUN_AJARAN', `Menghapus tahun pelajaran`);
      showSuccessToast('Tahun Pelajaran berhasil dihapus.');
    }
  };

  // Teacher Actions
  const addTeacher = async (teacher: Profile) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB] Adding teacher:', teacher.fullName);
      const { error } = await client.from('profiles').insert([{
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
        return;
      }
      await loadDataFromSupabase();
      logActivity('TAMBAH_GURU', `Menambahkan akun guru ${teacher.fullName}`);
      addNotification({
        title: 'Guru Baru Ditambahkan',
        message: `Administrator menambahkan akun Guru baru: ${teacher.fullName} (${teacher.nipNuptk || 'NUPTK'}).`,
        type: 'info',
        role: 'all'
      });
      showSuccessToast('Data guru berhasil ditambahkan.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] addTeacher failed:', err);
      showErrorToast(`Gagal menyimpan data guru: ${err.message || err}`);
    }
  };

  const updateTeacher = async (id: string, updated: Partial<Profile>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB] Updating teacher profile:', id);
      const { error } = await client.from('profiles').update({
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
        return;
      }
      await loadDataFromSupabase();
      logActivity('UBAH_GURU', `Memperbarui data guru ${updated.fullName || ''}`);
      showSuccessToast('Data guru berhasil diperbarui.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] updateTeacher failed:', err);
      showErrorToast(`Gagal memperbarui data guru: ${err.message || err}`);
    }
  };

  const deleteTeacher = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB] Deleting teacher profile:', id);
      const { error } = await client.from('profiles').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete teacher failed:', error);
        showErrorToast(`Gagal menghapus data guru: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('HAPUS_GURU', `Menghapus data guru`);
      showSuccessToast('Data guru berhasil dihapus.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] deleteTeacher failed:', err);
      showErrorToast(`Gagal menghapus data guru: ${err.message || err}`);
    }
  };

  // Subject Actions
  const addSubject = async (subj: Omit<Subject, 'id' | 'createdAt'>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      const newSubjId = `subj_${Date.now()}`;
      console.log('[Supabase DB] Adding subject:', subj.name);
      const { error } = await client.from('subjects').insert([{
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
        return;
      }
      await loadDataFromSupabase();
      logActivity('TAMBAH_MATA_PELAJARAN', `Menambahkan mata pelajaran ${subj.name}`);
      addNotification({
        title: 'Mata Pelajaran Baru',
        message: `Administrator menambahkan mata pelajaran baru: ${subj.name} (Kode: ${subj.code}).`,
        type: 'info',
        role: 'all'
      });
      showSuccessToast('Mata Pelajaran berhasil ditambahkan.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] addSubject failed:', err);
      showErrorToast(`Gagal menambah mata pelajaran: ${err.message || err}`);
    }
  };

  const updateSubject = async (id: string, updated: Partial<Subject>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB] Updating subject:', id);
      const payload: any = {};
      if (updated.code) payload.code = updated.code;
      if (updated.name) payload.name = updated.name;
      if (updated.description !== undefined) payload.description = updated.description;
      if (updated.teacherIds) payload.teacher_ids = updated.teacherIds;

      const { error } = await client.from('subjects').update(payload).eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Update subject failed:', error);
        showErrorToast(`Gagal memperbarui mata pelajaran: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('UBAH_MATA_PELAJARAN', `Memperbarui data mata pelajaran`);
      showSuccessToast('Mata Pelajaran berhasil diperbarui.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] updateSubject failed:', err);
      showErrorToast(`Gagal memperbarui mata pelajaran: ${err.message || err}`);
    }
  };

  const deleteSubject = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB] Deleting subject:', id);
      const { error } = await client.from('subjects').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete subject failed:', error);
        showErrorToast(`Gagal menghapus mata pelajaran: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('HAPUS_MATA_PELAJARAN', `Menghapus mata pelajaran`);
      showSuccessToast('Mata Pelajaran berhasil dihapus.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] deleteSubject failed:', err);
      showErrorToast(`Gagal menghapus mata pelajaran: ${err.message || err}`);
    }
  };

  // Class Actions
  const addClass = async (cls: Omit<ClassRoom, 'id' | 'createdAt'>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      const newClassId = `class_${Date.now()}`;
      console.log('[Supabase DB] Adding class:', cls.name);
      const { error } = await client.from('classes').insert([{
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
        return;
      }
      await loadDataFromSupabase();
      logActivity('TAMBAH_KELAS', `Menambahkan kelas ${cls.name}`);
      addNotification({
        title: 'Kelas Baru Dibuat',
        message: `Administrator membuat kelas baru: ${cls.name} (${cls.gradeLevel}).`,
        type: 'info',
        role: 'all'
      });
      showSuccessToast('Kelas berhasil ditambahkan.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] addClass failed:', err);
      showErrorToast(`Gagal menambah kelas: ${err.message || err}`);
    }
  };

  const updateClass = async (id: string, updated: Partial<ClassRoom>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB] Updating class:', id);
      const payload: any = {};
      if (updated.name) payload.name = updated.name;
      if (updated.gradeLevel) payload.grade_level = updated.gradeLevel;
      if (updated.academicYear) payload.academic_year = updated.academicYear;
      if (updated.homeroomTeacherId !== undefined) payload.homeroom_teacher_id = updated.homeroomTeacherId || null;

      const { error } = await client.from('classes').update(payload).eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Update class failed:', error);
        showErrorToast(`Gagal memperbarui kelas: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('UBAH_KELAS', `Memperbarui data kelas`);
      showSuccessToast('Kelas berhasil diperbarui.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] updateClass failed:', err);
      showErrorToast(`Gagal memperbarui kelas: ${err.message || err}`);
    }
  };

  const deleteClass = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB] Deleting class:', id);
      const { error } = await client.from('classes').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete class failed:', error);
        showErrorToast(`Gagal menghapus kelas: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('HAPUS_KELAS', `Menghapus kelas`);
      showSuccessToast('Kelas berhasil dihapus.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] deleteClass failed:', err);
      showErrorToast(`Gagal menghapus kelas: ${err.message || err}`);
    }
  };

  // Student Actions
  const addStudent = async (std: Omit<Student, 'id' | 'createdAt'>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      const newStdId = `std_${Date.now()}`;
      console.log('[Supabase DB] Adding student:', std.fullName);
      const { error } = await client.from('students').insert([{
        id: newStdId,
        nis: std.nis,
        full_name: std.fullName,
        gender: std.gender,
        class_id: (std.classId && typeof std.classId === 'string' && std.classId.trim() !== '') ? std.classId : null,
        created_at: new Date().toISOString()
      }]);
      if (error) {
        console.error('[Supabase DB Error] Insert student failed:', error);
        showErrorToast(`Gagal menambah siswa: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('TAMBAH_SISWA', `Menambahkan siswa ${std.fullName}`);
      addNotification({
        title: 'Data Siswa Ditambahkan',
        message: `Administrator menambahkan data siswa baru: ${std.fullName}.`,
        type: 'info',
        role: 'all'
      });
      showSuccessToast('Siswa berhasil ditambahkan.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] addStudent failed:', err);
      showErrorToast(`Gagal menambah siswa: ${err.message || err}`);
    }
  };

  const bulkAddStudents = async (
    stdsList: Omit<Student, 'id' | 'createdAt'>[],
    mode: 'skip' | 'update' | 'abort' = 'skip'
  ): Promise<BulkImportResult> => {
    const result: BulkImportResult = {
      total: stdsList.length,
      success: 0,
      skipped: 0,
      updated: 0,
      failed: 0,
      logs: []
    };

    if (stdsList.length === 0) return result;

    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      result.failed = stdsList.length;
      return result;
    }

    try {
      console.log('[Supabase DB] Bulk processing students with mode:', mode);
      const now = new Date().toISOString();

      // 1. Ambil data siswa yang sudah ada di Supabase untuk mencocokkan NIS
      const { data: existingDbStudents } = await client.from('students').select('id, nis, full_name, class_id');
      const existingMap = new Map<string, any>();
      if (existingDbStudents) {
        existingDbStudents.forEach((st) => {
          if (st.nis) {
            existingMap.set(st.nis.trim().toLowerCase(), st);
          }
        });
      }

      // 2. Deteksi duplikat di dalam file impor dan di database
      const fileNisTracker = new Set<string>();
      const duplicateDetectedList: { row: Omit<Student, 'id' | 'createdAt'>; reason: string }[] = [];

      for (const std of stdsList) {
        const nisKey = (std.nis || '').trim().toLowerCase();
        if (fileNisTracker.has(nisKey)) {
          duplicateDetectedList.push({ row: std, reason: `NIS ${std.nis} duplikat dalam file impor.` });
        } else {
          fileNisTracker.add(nisKey);
          if (existingMap.has(nisKey)) {
            duplicateDetectedList.push({ row: std, reason: `NIS ${std.nis} sudah terdaftar.` });
          }
        }
      }

      // Jika Mode = ABORT dan terdapat duplikat -> batalkan seluruh proses
      if (mode === 'abort' && duplicateDetectedList.length > 0) {
        result.failed = stdsList.length;
        duplicateDetectedList.forEach((dup) => {
          result.logs.push({
            nis: dup.row.nis,
            name: dup.row.fullName,
            reason: dup.reason,
            status: 'failed'
          });
        });
        showErrorToast(`Proses impor dibatalkan: Ditemukan ${duplicateDetectedList.length} data NIS duplikat.`);
        return result;
      }

      // 3. Proses Impor Per Baris sesuai Opsi Pilihan
      const processedFileNis = new Set<string>();
      const rowsToInsert: any[] = [];

      for (let idx = 0; idx < stdsList.length; idx++) {
        const std = stdsList[idx];
        const nisKey = (std.nis || '').trim().toLowerCase();
        const cls = classes.find((c) => c.id === std.classId || c.name.toLowerCase() === (std.className || '').toLowerCase());
        const targetClassId = cls?.id || std.classId;
        const validClassId = (targetClassId && typeof targetClassId === 'string' && targetClassId.trim() !== '') ? targetClassId : null;

        const isDuplicateInFile = processedFileNis.has(nisKey);
        processedFileNis.add(nisKey);
        const existingInDb = existingMap.get(nisKey);

        if (isDuplicateInFile) {
          result.skipped++;
          result.logs.push({
            nis: std.nis,
            name: std.fullName,
            reason: `NIS ${std.nis} duplikat dalam file impor.`,
            status: 'skipped'
          });
          continue;
        }

        if (existingInDb) {
          if (mode === 'skip') {
            result.skipped++;
            result.logs.push({
              nis: std.nis,
              name: std.fullName,
              reason: `NIS ${std.nis} sudah terdaftar.`,
              status: 'skipped'
            });
          } else if (mode === 'update') {
            const { error: updateErr } = await client
              .from('students')
              .update({
                full_name: std.fullName,
                gender: std.gender,
                class_id: validClassId,
                updated_at: now
              })
              .eq('id', existingInDb.id);

            if (updateErr) {
              result.failed++;
              result.logs.push({
                nis: std.nis,
                name: std.fullName,
                reason: `Gagal memperbarui NIS ${std.nis}: ${updateErr.message}`,
                status: 'failed'
              });
            } else {
              result.updated++;
              result.logs.push({
                nis: std.nis,
                name: std.fullName,
                reason: `NIS ${std.nis} berhasil diperbarui.`,
                status: 'updated'
              });
            }
          }
        } else {
          // Data NIS Baru -> Disiapkan untuk Insert
          rowsToInsert.push({
            id: `std_bulk_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            nis: std.nis,
            full_name: std.fullName,
            gender: std.gender,
            class_id: validClassId,
            created_at: now,
            updated_at: now
          });
        }
      }

      // Execution Insert
      if (rowsToInsert.length > 0) {
        const { error: insertErr } = await client.from('students').insert(rowsToInsert);
        if (insertErr) {
          console.warn('[Supabase DB] Bulk insert error, retrying individual items:', insertErr.message);
          for (const item of rowsToInsert) {
            const { error: singleErr } = await client.from('students').insert([item]);
            if (singleErr) {
              result.failed++;
              result.logs.push({
                nis: item.nis,
                name: item.full_name,
                reason: `Gagal menyimpan NIS ${item.nis}: ${singleErr.message}`,
                status: 'failed'
              });
            } else {
              result.success++;
              result.logs.push({
                nis: item.nis,
                name: item.full_name,
                reason: `NIS ${item.nis} berhasil disimpan.`,
                status: 'success'
              });
            }
          }
        } else {
          result.success += rowsToInsert.length;
          rowsToInsert.forEach((item) => {
            result.logs.push({
              nis: item.nis,
              name: item.full_name,
              reason: `NIS ${item.nis} berhasil disimpan.`,
              status: 'success'
            });
          });
        }
      }

      await loadDataFromSupabase();
      logActivity(
        'BULK_UPLOAD_SISWA',
        `Selesai impor data siswa: Total ${result.total}, Berhasil ${result.success}, Diperbarui ${result.updated}, Dilewati ${result.skipped}`
      );

      addNotification({
        title: 'Impor Data Siswa Selesai',
        message: `Impor selesai: ${result.success} disimpan, ${result.updated} diperbarui, ${result.skipped} dilewati.`,
        type: 'success',
        role: 'all'
      });

      return result;
    } catch (err: any) {
      console.error('[Supabase DB Exception] bulkAddStudents failed:', err);
      showErrorToast(`Gagal mengunggah data siswa: ${err.message || err}`);
      result.failed = stdsList.length;
      return result;
    }
  };

  const updateStudent = async (id: string, updated: Partial<Student>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB] Updating student:', id);
      const payload: any = {};
      if (updated.nis !== undefined) payload.nis = updated.nis;
      if (updated.fullName !== undefined) payload.full_name = updated.fullName;
      if (updated.gender !== undefined) payload.gender = updated.gender;
      if (updated.classId !== undefined) {
        payload.class_id = (updated.classId && typeof updated.classId === 'string' && updated.classId.trim() !== '') ? updated.classId : null;
      }
      payload.updated_at = new Date().toISOString();

      const { error } = await client.from('students').update(payload).eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Update student failed:', error);
        showErrorToast(`Gagal memperbarui data siswa: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('UBAH_SISWA', `Memperbarui data siswa`);
      addNotification({
        title: 'Data Siswa Diperbarui',
        message: `Administrator memperbarui data siswa: ${updated.fullName || 'Siswa'}.`,
        type: 'info',
        role: 'all'
      });
      showSuccessToast('Data siswa berhasil diperbarui.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] updateStudent failed:', err);
      showErrorToast(`Gagal memperbarui data siswa: ${err.message || err}`);
    }
  };

  const deleteStudent = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB] Deleting student:', id);
      const { error } = await client.from('students').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete student failed:', error);
        showErrorToast(`Gagal menghapus siswa: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('HAPUS_SISWA', `Menghapus siswa`);
      showSuccessToast('Data siswa berhasil dihapus.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] deleteStudent failed:', err);
      showErrorToast(`Gagal menghapus siswa: ${err.message || err}`);
    }
  };

  // Grade Actions
  const calculateGradeDetails = (tugas: number, harian: number, pts: number, pas: number) => {
    const weights = systemSettings?.gradeWeights || { assignment: 20, daily: 30, pts: 25, pas: 25 };
    const preds = systemSettings?.predicateThresholds || { aMin: 88, bMin: 78, cMin: 68, kkmDefault: 75 };

    const totalWeight = (weights.assignment || 20) + (weights.daily || 30) + (weights.pts || 25) + (weights.pas || 25);
    const divisor = totalWeight > 0 ? totalWeight : 100;

    const rawScore = (tugas * (weights.assignment || 20) + harian * (weights.daily || 30) + pts * (weights.pts || 25) + pas * (weights.pas || 25)) / divisor;
    const finalScore = Math.round(rawScore);

    let predicate: 'A' | 'B' | 'C' | 'D' = 'D';
    if (finalScore >= (preds.aMin || 88)) predicate = 'A';
    else if (finalScore >= (preds.bMin || 78)) predicate = 'B';
    else if (finalScore >= (preds.cMin || 68)) predicate = 'C';
    else predicate = 'D';

    return { finalScore, predicate };
  };

  const saveGrade = async (gradeData: Omit<Grade, 'id' | 'finalScore' | 'predicate' | 'updatedAt'>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }

    try {
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
      console.log('[Supabase DB] Saving grade for student:', gradeData.studentId);
      const { error } = await client.from('grades').upsert([{
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
        return;
      }
      await loadDataFromSupabase();
      logActivity('INPUT_NILAI', `Menyimpan nilai siswa`);
      addNotification({
        title: 'Nilai Siswa Disimpan',
        message: `Guru telah menyimpan/memperbarui rekapitulasi nilai siswa.`,
        type: 'success',
        role: 'all'
      });
      showSuccessToast('Nilai siswa berhasil disimpan.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] saveGrade failed:', err);
      showErrorToast(`Gagal menyimpan nilai: ${err.message || err}`);
    }
  };

  const deleteGrade = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB] Deleting grade:', id);
      const { error } = await client.from('grades').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete grade failed:', error);
        showErrorToast(`Gagal menghapus nilai: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('HAPUS_NILAI', `Menghapus rekaman nilai`);
      showSuccessToast('Nilai berhasil dihapus.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] deleteGrade failed:', err);
      showErrorToast(`Gagal menghapus nilai: ${err.message || err}`);
    }
  };

  // Attendance Actions
  const saveAttendanceBatch = async (records: Omit<Attendance, 'id' | 'createdAt'>[]) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    if (records.length === 0) return;

    try {
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
      const { error } = await client.from('attendance').insert(payload);
      if (error) {
        console.error('[Supabase DB Error] Save attendance failed:', error);
        showErrorToast(`Gagal menyimpan absensi: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('INPUT_ABSENSI', `Memproses absensi untuk ${records.length} siswa`);
      addNotification({
        title: 'Presensi Siswa Disimpan',
        message: `Guru telah memperbarui data presensi harian untuk ${records.length} siswa.`,
        type: 'success',
        role: 'all'
      });
      showSuccessToast(`Berhasil menyimpan absensi ${records.length} siswa.`);
    } catch (err: any) {
      console.error('[Supabase DB Exception] saveAttendanceBatch failed:', err);
      showErrorToast(`Gagal menyimpan absensi: ${err.message || err}`);
    }
  };

  // Journal Actions
  const addJournal = async (journal: Omit<TeachingJournal, 'id' | 'createdAt'>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      const newJrnId = `jrn_${Date.now()}`;
      console.log('[Supabase DB] Adding teaching journal:', journal.topic);
      const { error } = await client.from('teaching_journals').insert([{
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
        return;
      }
      await loadDataFromSupabase();
      logActivity('TAMBAH_JURNAL', `Menambahkan jurnal mengajar ${journal.topic}`);
      addNotification({
        title: 'Jurnal Mengajar Disimpan',
        message: `Guru telah mencatat jurnal mengajar baru: "${journal.topic}".`,
        type: 'success',
        role: 'all'
      });
      showSuccessToast('Jurnal mengajar berhasil disimpan.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] addJournal failed:', err);
      showErrorToast(`Gagal menyimpan jurnal: ${err.message || err}`);
    }
  };

  const deleteJournal = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB] Deleting journal:', id);
      const { error } = await client.from('teaching_journals').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete journal failed:', error);
        showErrorToast(`Gagal menghapus jurnal: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('HAPUS_JURNAL', `Menghapus jurnal mengajar`);
      showSuccessToast('Jurnal mengajar berhasil dihapus.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] deleteJournal failed:', err);
      showErrorToast(`Gagal menghapus jurnal: ${err.message || err}`);
    }
  };

  // Module Actions
  const addModule = async (mod: Omit<TeachingModule, 'id' | 'createdAt'>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      const newModId = `mod_${Date.now()}`;
      console.log('[Supabase DB] Adding module archive:', mod.title);

      const previewUrl = GoogleDriveService.getDrivePreviewUrl(mod.webViewLink, mod.fileDriveId);
      const downloadUrl = GoogleDriveService.getDriveDownloadUrl(mod.webContentLink, mod.fileDriveId);

      const archivePayload = {
        id: newModId,
        title: mod.title,
        description: mod.description || '',
        subject_id: mod.subjectId || null,
        class_id: mod.classId || mod.classLevel || '7',
        class_level: mod.classLevel,
        semester: mod.semester,
        academic_year: mod.academicYear,
        file_name: mod.fileName,
        mime_type: mod.mimeType || (mod.fileType === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
        file_size: mod.fileSize || '',
        google_drive_file_id: mod.fileDriveId,
        drive_file_id: mod.fileDriveId,
        drive_folder_id: mod.driveFolderId || '',
        preview_url: previewUrl,
        download_url: downloadUrl,
        drive_url: mod.webViewLink,
        web_view_link: mod.webViewLink,
        web_content_link: mod.webContentLink,
        uploaded_by: mod.teacherId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Primary insertion to module_archives
      const { error: maErr } = await client.from('module_archives').insert([archivePayload]);
      if (maErr) {
        console.warn('[Supabase DB Warning] module_archives insert failed, trying teaching_modules:', maErr);
      }

      // Secondary insertion to teaching_modules
      await client.from('teaching_modules').insert([{
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

      await loadDataFromSupabase();
      logActivity('UPLOAD_MODUL', `Mengunggah arsip modul/RPP "${mod.title}" ke Google Drive & Supabase`);
      addNotification({
        title: 'Arsip Modul Ajar/RPP Diunggah',
        message: `Guru mengunggah arsip Modul Ajar/RPP "${mod.title}" ke Google Drive & database sekolah.`,
        type: 'success',
        role: 'all'
      });
      showSuccessToast('Arsip Modul Ajar / RPP berhasil diunggah dan tersimpan!');
    } catch (err: any) {
      console.error('[Supabase DB Exception] addModule failed:', err);
      showErrorToast(`Gagal mengunggah modul: ${err.message || err}`);
    }
  };

  const updateModule = async (id: string, updatedMod: Partial<TeachingModule>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB] Updating module archive:', id);

      const updatePayload: any = {
        updated_at: new Date().toISOString()
      };

      if (updatedMod.title !== undefined) updatePayload.title = updatedMod.title;
      if (updatedMod.description !== undefined) updatePayload.description = updatedMod.description;
      if (updatedMod.subjectId !== undefined) updatePayload.subject_id = updatedMod.subjectId;
      if (updatedMod.classLevel !== undefined) {
        updatePayload.class_level = updatedMod.classLevel;
        updatePayload.class_id = updatedMod.classLevel;
      }
      if (updatedMod.semester !== undefined) updatePayload.semester = updatedMod.semester;
      if (updatedMod.academicYear !== undefined) updatePayload.academic_year = updatedMod.academicYear;
      if (updatedMod.fileName !== undefined) updatePayload.file_name = updatedMod.fileName;
      if (updatedMod.fileSize !== undefined) updatePayload.file_size = updatedMod.fileSize;
      if (updatedMod.fileDriveId !== undefined) {
        updatePayload.google_drive_file_id = updatedMod.fileDriveId;
        updatePayload.drive_file_id = updatedMod.fileDriveId;
        updatePayload.file_drive_id = updatedMod.fileDriveId;
      }
      if (updatedMod.webViewLink !== undefined) {
        updatePayload.preview_url = updatedMod.webViewLink;
        updatePayload.web_view_link = updatedMod.webViewLink;
        updatePayload.drive_url = updatedMod.webViewLink;
      }
      if (updatedMod.webContentLink !== undefined) {
        updatePayload.download_url = updatedMod.webContentLink;
        updatePayload.web_content_link = updatedMod.webContentLink;
      }

      await client.from('module_archives').update(updatePayload).eq('id', id);
      await client.from('teaching_modules').update(updatePayload).eq('id', id);

      await loadDataFromSupabase();
      logActivity('EDIT_MODUL', `Memperbarui metadata arsip modul/RPP`);
      showSuccessToast('Data Arsip Modul Ajar / RPP berhasil diperbarui!');
    } catch (err: any) {
      console.error('[Supabase DB Exception] updateModule failed:', err);
      showErrorToast(`Gagal memperbarui modul: ${err.message || err}`);
    }
  };

  const deleteModule = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      console.log('[Supabase DB & Drive] Deleting module archive:', id);

      // Step 1: Find file drive ID and delete physical file from Google Drive
      const modToDelete = modules.find((m) => m.id === id);
      if (modToDelete?.fileDriveId) {
        await GoogleDriveService.deleteFile(modToDelete.fileDriveId);
      }

      // Step 2: Delete metadata from Supabase PostgreSQL
      await client.from('module_archives').delete().eq('id', id);
      await client.from('teaching_modules').delete().eq('id', id);

      await loadDataFromSupabase();
      logActivity('HAPUS_MODUL', `Menghapus arsip modul/RPP dari Google Drive & Supabase`);
      showSuccessToast('Arsip Modul Ajar/RPP berhasil dihapus dari Google Drive dan database.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] deleteModule failed:', err);
      showErrorToast(`Gagal menghapus modul: ${err.message || err}`);
    }
  };

  // School Principal Actions
  const addPrincipal = async (p: Omit<SchoolPrincipal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      const newId = `prn_${Date.now()}`;
      if (p.isActive) {
        await client.from('school_principals').update({ is_active: false }).neq('id', newId);
      }
      const { error } = await client.from('school_principals').insert([{
        id: newId,
        full_name: p.fullName,
        title: p.title || '',
        nuks: p.nuks || '',
        position: p.position || 'Kepala Sekolah',
        is_active: Boolean(p.isActive),
        created_at: new Date().toISOString()
      }]);
      if (error) {
        console.error('[Supabase DB Error] Insert school_principal failed:', error);
        showErrorToast(`Gagal menambah data Kepala Sekolah: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('TAMBAH_KEPALA_SEKOLAH', `Menambahkan Kepala Sekolah ${p.fullName}`);
      showSuccessToast('Data Kepala Sekolah berhasil ditambahkan.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] addPrincipal failed:', err);
      showErrorToast(`Gagal menambah data Kepala Sekolah: ${err.message || err}`);
    }
  };

  const updatePrincipal = async (id: string, updated: Partial<SchoolPrincipal>) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      if (updated.isActive) {
        await client.from('school_principals').update({ is_active: false }).neq('id', id);
      }
      const payload: any = {};
      if (updated.fullName !== undefined) payload.full_name = updated.fullName;
      if (updated.title !== undefined) payload.title = updated.title;
      if (updated.nuks !== undefined) payload.nuks = updated.nuks;
      if (updated.position !== undefined) payload.position = updated.position;
      if (updated.isActive !== undefined) payload.is_active = Boolean(updated.isActive);
      payload.updated_at = new Date().toISOString();

      const { error } = await client.from('school_principals').update(payload).eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Update school_principal failed:', error);
        showErrorToast(`Gagal memperbarui data Kepala Sekolah: ${error.message}`);
        return;
      }
      await loadDataFromSupabase();
      logActivity('UBAH_KEPALA_SEKOLAH', `Memperbarui data Kepala Sekolah`);
      showSuccessToast('Data Kepala Sekolah berhasil diperbarui.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] updatePrincipal failed:', err);
      showErrorToast(`Gagal memperbarui data Kepala Sekolah: ${err.message || err}`);
    }
  };

  const deletePrincipal = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      const target = principals.find((p) => p.id === id);
      const { error } = await client.from('school_principals').delete().eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Delete school_principal failed:', error);
        showErrorToast(`Gagal menghapus data Kepala Sekolah: ${error.message}`);
        return;
      }
      if (target?.isActive && principals.length > 1) {
        const remaining = principals.filter((p) => p.id !== id);
        if (remaining.length > 0) {
          await client.from('school_principals').update({ is_active: true }).eq('id', remaining[0].id);
        }
      }
      await loadDataFromSupabase();
      logActivity('HAPUS_KEPALA_SEKOLAH', `Menghapus data Kepala Sekolah`);
      showSuccessToast('Data Kepala Sekolah berhasil dihapus.');
    } catch (err: any) {
      console.error('[Supabase DB Exception] deletePrincipal failed:', err);
      showErrorToast(`Gagal menghapus data Kepala Sekolah: ${err.message || err}`);
    }
  };

  const setActivePrincipal = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi database Supabase tidak tersedia.');
      return;
    }
    try {
      await client.from('school_principals').update({ is_active: false }).neq('id', id);
      const { error } = await client.from('school_principals').update({ is_active: true, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) {
        console.error('[Supabase DB Error] Set active school_principal failed:', error);
        showErrorToast(`Gagal mengaktifkan Kepala Sekolah: ${error.message}`);
        return;
      }
      const activePrn = principals.find((p) => p.id === id);
      if (activePrn) {
        const formattedName = activePrn.title ? `${activePrn.fullName}, ${activePrn.title}` : activePrn.fullName;
        const newSchoolInfo = {
          ...systemSettings.schoolInfo,
          headmasterName: formattedName,
          headmasterNuks: activePrn.nuks || ''
        };
        const newSysConfig = { ...systemSettings, schoolInfo: newSchoolInfo };
        await client.from('system_settings').upsert({ key: 'main_config', value: newSysConfig, updated_at: new Date().toISOString() });
      }
      await loadDataFromSupabase();
      logActivity('AKTIFKAN_KEPALA_SEKOLAH', `Mengaktifkan Kepala Sekolah ${activePrn?.fullName || id}`);
      showSuccessToast(`Kepala Sekolah ${activePrn?.fullName || ''} berhasil diaktifkan.`);
    } catch (err: any) {
      console.error('[Supabase DB Exception] setActivePrincipal failed:', err);
      showErrorToast(`Gagal mengaktifkan Kepala Sekolah: ${err.message || err}`);
    }
  };

  // System Settings Action
  const updateSystemSettings = async (updated: Partial<SystemSettings>) => {
    const nextSettings = {
      ...systemSettings,
      ...updated,
      updatedAt: new Date().toISOString()
    };

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('system_settings').upsert({
          key: 'main_config',
          value: nextSettings,
          updated_at: nextSettings.updatedAt
        });
        if (error) {
          console.error('[Supabase DB Error] Update system settings failed:', error);
          showErrorToast(`Gagal menyimpan pengaturan sistem: ${error.message}`);
          return;
        }
        setSystemSettings(nextSettings);
        await loadDataFromSupabase();
        logActivity('PENGATURAN_SISTEM', 'Memperbarui Pengaturan Margin Kertas & Kop Surat');
        addNotification({
          title: 'Pengaturan Sistem Diperbarui',
          message: 'Konfigurasi sistem & akademik sekolah telah diperbarui oleh Administrator.',
          type: 'info',
          role: 'all'
        });
        showSuccessToast('Pengaturan sistem berhasil diperbarui.');
      } catch (err: any) {
        console.error('[Supabase DB Exception] updateSystemSettings failed:', err);
        showErrorToast(`Gagal menyimpan pengaturan sistem: ${err.message || err}`);
      }
    }
  };

  // Assign Teacher to Subjects, Grade Levels, and Classes
  const assignTeacherToSubjectsAndClasses = async (
    teacherId: string,
    subjectIds: string[],
    classIds: string[]
  ) => {
    const client = getSupabaseClient();
    if (!client) {
      showErrorToast('Koneksi Supabase tidak tersedia.');
      return;
    }

    try {
      // 1. Update subjects
      for (const subj of subjects) {
        let currentIds = subj.teacherIds || [];
        const isAssigned = subjectIds.includes(subj.id);
        if (isAssigned && !currentIds.includes(teacherId)) {
          const nextIds = [...currentIds, teacherId];
          await client.from('subjects').update({ teacher_ids: nextIds }).eq('id', subj.id);
        } else if (!isAssigned && currentIds.includes(teacherId)) {
          const nextIds = currentIds.filter((id) => id !== teacherId);
          await client.from('subjects').update({ teacher_ids: nextIds }).eq('id', subj.id);
        }
      }

      // 2. Update classes
      for (const cls of classes) {
        let currentTeacherIds = cls.teacherIds || [];
        const isAssigned = classIds.includes(cls.id);
        if (isAssigned) {
          if (!currentTeacherIds.includes(teacherId)) {
            const nextTeacherIds = [...currentTeacherIds, teacherId];
            await client.from('classes').update({ teacher_ids: nextTeacherIds }).eq('id', cls.id);
          }
        } else {
          if (currentTeacherIds.includes(teacherId)) {
            const nextTeacherIds = currentTeacherIds.filter((id) => id !== teacherId);
            await client.from('classes').update({ teacher_ids: nextTeacherIds }).eq('id', cls.id);
          }
          if (cls.homeroomTeacherId === teacherId) {
            await client.from('classes').update({ homeroom_teacher_id: null }).eq('id', cls.id);
          }
        }
      }

      // 3. Sync teacher_assignments table
      try {
        await client.from('teacher_assignments').delete().eq('teacher_id', teacherId);

        const newAssignments: any[] = [];
        const currentYear = activeAcademicYear?.year || '2025/2026';
        const currentSemester = activeAcademicYear?.semester || '1';

        if (classIds.length > 0 || subjectIds.length > 0) {
          if (classIds.length > 0 && subjectIds.length > 0) {
            for (const cId of classIds) {
              const classObj = classes.find((c) => c.id === cId);
              for (const sId of subjectIds) {
                newAssignments.push({
                  teacher_id: teacherId,
                  subject_id: sId,
                  class_id: cId,
                  grade_level: classObj?.gradeLevel || null,
                  academic_year: currentYear,
                  semester: currentSemester,
                  is_active: true
                });
              }
            }
          } else if (classIds.length > 0) {
            for (const cId of classIds) {
              const classObj = classes.find((c) => c.id === cId);
              newAssignments.push({
                teacher_id: teacherId,
                subject_id: null,
                class_id: cId,
                grade_level: classObj?.gradeLevel || null,
                academic_year: currentYear,
                semester: currentSemester,
                is_active: true
              });
            }
          } else {
            for (const sId of subjectIds) {
              newAssignments.push({
                teacher_id: teacherId,
                subject_id: sId,
                class_id: null,
                grade_level: null,
                academic_year: currentYear,
                semester: currentSemester,
                is_active: true
              });
            }
          }

          if (newAssignments.length > 0) {
            await client.from('teacher_assignments').insert(newAssignments);
          }
        }
      } catch (assignErr) {
        console.warn('Sync teacher_assignments table notice:', assignErr);
      }

      await loadDataFromSupabase();
      logActivity('PENUGASAN_GURU', `Memperbarui penugasan mata pelajaran, tingkat, dan kelas untuk guru`);
      showSuccessToast('Penugasan guru berhasil disimpan.');
    } catch (err: any) {
      console.error('Failed assignTeacherToSubjectsAndClasses:', err);
      showErrorToast(`Gagal memperbarui penugasan guru: ${err.message || err}`);
    }
  };

  // Reset local state & backend tables to clean initial state
  const resetAllData = async () => {
    try {
      await resetSupabaseDatabaseTables();
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
      showSuccessToast('Seluruh data aplikasi & backend database berhasil dibersihkan.');
    } catch (err: any) {
      console.error('Reset error:', err);
      showErrorToast('Gagal mereset data backend Supabase: ' + (err.message || err));
    }
  };

  // Role-Based Data Isolation Filtering (Backend/Provider Level Isolation)
  const isGuru = user?.role === 'guru';

  // Calculate assigned subjects and classes for logged-in teacher
  const assignedSubjects = isGuru
    ? subjects.filter((s) => s.teacherIds?.includes(user?.id || ''))
    : subjects;
  const assignedSubjectIds = new Set(assignedSubjects.map((s) => s.id));

  const assignedClasses = isGuru
    ? classes.filter((c) => c.homeroomTeacherId === user?.id || c.teacherIds?.includes(user?.id || ''))
    : classes;
  const assignedClassIds = new Set(assignedClasses.map((c) => c.id));

  // Filtered collections for Guru vs Admin
  const visibleSubjects = assignedSubjects;
  const visibleClasses = assignedClasses;
  const visibleStudents = isGuru
    ? students.filter((st) => assignedClassIds.has(st.classId))
    : students;
  const visibleGrades = isGuru
    ? grades.filter(
        (g) =>
          g.teacherId === user?.id ||
          (assignedClassIds.has(g.classId) && assignedSubjectIds.has(g.subjectId))
      )
    : grades;
  const visibleAttendance = isGuru
    ? attendance.filter((a) => a.teacherId === user?.id || assignedClassIds.has(a.classId))
    : attendance;
  const visibleJournals = isGuru
    ? journals.filter((j) => j.teacherId === user?.id || assignedClassIds.has(j.classId))
    : journals;
  const visibleModules = isGuru
    ? modules.filter((m) => m.teacherId === user?.id || assignedSubjectIds.has(m.subjectId))
    : modules;

  return (
    <DataContext.Provider
      value={{
        academicYears,
        activeAcademicYear,
        teachers,
        subjects: visibleSubjects,
        classes: visibleClasses,
        students: visibleStudents,
        grades: visibleGrades,
        attendance: visibleAttendance,
        journals: visibleJournals,
        modules: visibleModules,
        systemSettings,
        principals,
        activePrincipal: activePrincipalState,
        activityLogs,
        notifications,
        unreadCount,
        isRealtimeConnected,
        addPrincipal,
        updatePrincipal,
        deletePrincipal,
        setActivePrincipal,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
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
        assignTeacherToSubjectsAndClasses,
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
